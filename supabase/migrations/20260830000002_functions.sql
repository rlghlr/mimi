-- =====================================================================
-- Muse · functions, RPCs, and integrity triggers
-- State transitions run server-side so clients cannot forge them.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Auth → public.users mirror. Role comes from signup metadata.
-- ---------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_role user_role;
begin
  meta_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::user_role,
    'customer'
  );

  insert into public.users (id, email, role, status)
  values (
    new.id,
    new.email,
    meta_role,
    (case when meta_role = 'professional' then 'pending' else 'active' end)::user_status
  );

  if meta_role = 'customer' then
    insert into public.customer_profiles (user_id, nickname)
    values (new.id, split_part(coalesce(new.email, 'user'), '@', 1));
  elsif meta_role = 'professional' then
    insert into public.professional_profiles (user_id) values (new.id);
    insert into public.credits (pro_id, balance) values (new.id, 0);
  end if;

  insert into public.events (user_id, name, props)
  values (new.id, 'signup', jsonb_build_object('role', meta_role));

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- current user's role (used by RLS + guards)
-- ---------------------------------------------------------------------
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- notification helper
-- ---------------------------------------------------------------------
create or replace function notify(
  p_user uuid, p_type text, p_title text, p_body text,
  p_ref_type text default null, p_ref_id uuid default null
) returns void
language sql security definer set search_path = public
as $$
  insert into public.notifications (user_id, type, title, body, ref_type, ref_id)
  values (p_user, p_type, p_title, p_body, p_ref_type, p_ref_id);
$$;

-- ---------------------------------------------------------------------
-- RPC: apply to a recruit post  (edge cases: closed / duplicate / full)
-- ---------------------------------------------------------------------
create or replace function apply_to_post(
  p_post_id uuid,
  p_photos jsonb default '{}',
  p_current_state text default null,
  p_recent_history text default null,
  p_available_dates text[] default '{}',
  p_message text default null
) returns recruit_applications
language plpgsql security definer set search_path = public
as $$
declare
  v_post recruit_posts;
  v_app  recruit_applications;
  v_uid  uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select * into v_post from recruit_posts where id = p_post_id for update;
  if not found or v_post.deleted_at is not null then
    raise exception 'POST_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_post.status in ('completed','ended','cancelled') then
    raise exception 'POST_CLOSED' using errcode = 'P0003';
  end if;
  if v_post.matched_count >= v_post.headcount then
    raise exception 'POST_FULL' using errcode = 'P0004';
  end if;
  if exists (select 1 from recruit_applications
             where post_id = p_post_id and applicant_id = v_uid) then
    raise exception 'ALREADY_APPLIED' using errcode = 'P0005';
  end if;

  insert into recruit_applications
    (post_id, applicant_id, photos, current_state, recent_history, available_dates, message)
  values
    (p_post_id, v_uid, p_photos, p_current_state, p_recent_history, p_available_dates, p_message)
  returning * into v_app;

  perform notify(
    v_post.pro_id, 'new_applicant', '새 지원자가 있어요',
    v_post.title || ' 공고에 새 지원자가 도착했어요.', 'post', p_post_id
  );
  insert into events (user_id, name, props)
  values (v_uid, 'apply', jsonb_build_object('post_id', p_post_id));

  return v_app;
end $$;

-- ---------------------------------------------------------------------
-- RPC: get-or-create a 1:1 chat between customer & pro
-- ---------------------------------------------------------------------
create or replace function open_chat(
  p_customer uuid, p_pro uuid, p_match uuid default null
) returns chats
language plpgsql security definer set search_path = public
as $$
declare v_chat chats;
begin
  if auth.uid() not in (p_customer, p_pro) and not is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0010';
  end if;

  select * into v_chat from chats
   where customer_id = p_customer and pro_id = p_pro;
  if found then
    return v_chat;
  end if;

  insert into chats (customer_id, pro_id, match_id)
  values (p_customer, p_pro, p_match)
  returning * into v_chat;

  insert into events (user_id, name, props)
  values (auth.uid(), 'chat_open', jsonb_build_object('chat_id', v_chat.id));

  return v_chat;
end $$;

-- keep chats.last_message in sync + funnel event on first message
create or replace function on_new_message()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_first boolean;
begin
  select count(*) = 1 into v_first from chat_messages where chat_id = new.chat_id;

  update chats
     set last_message = coalesce(new.body, '[' || new.type || ']'),
         last_message_at = new.created_at
   where id = new.chat_id;

  if v_first then
    insert into events (user_id, name, props)
    values (new.sender_id, 'chat_first_message', jsonb_build_object('chat_id', new.chat_id));
  end if;
  return new;
end $$;

create trigger trg_on_new_message
  after insert on chat_messages
  for each row execute function on_new_message();

-- ---------------------------------------------------------------------
-- RPC: confirm a match  (recruit or consultation)
-- ---------------------------------------------------------------------
create or replace function confirm_match(
  p_type match_type, p_source_id uuid, p_customer uuid
) returns matches
language plpgsql security definer set search_path = public
as $$
declare
  v_pro   uuid := auth.uid();
  v_match matches;
  v_post  recruit_posts;
begin
  if v_pro is null then raise exception 'AUTH_REQUIRED'; end if;

  if p_type = 'recruit' then
    select * into v_post from recruit_posts where id = p_source_id for update;
    if not found then raise exception 'POST_NOT_FOUND'; end if;
    if v_post.pro_id <> v_pro then raise exception 'FORBIDDEN'; end if;
    if v_post.matched_count >= v_post.headcount then
      raise exception 'POST_FULL' using errcode = 'P0004';
    end if;

    update recruit_posts
       set matched_count = matched_count + 1,
           status = case when matched_count + 1 >= headcount
                         then 'completed'::post_status else status end
     where id = p_source_id;

    update recruit_applications
       set status = 'matched'
     where post_id = p_source_id and applicant_id = p_customer;
  end if;

  insert into matches (type, source_id, customer_id, pro_id, status, confirmed_at)
  values (p_type, p_source_id, p_customer, v_pro, 'confirmed', now())
  returning * into v_match;

  perform notify(p_customer, 'matched', '매칭이 확정됐어요',
                 '전문가와 매칭이 확정됐어요. 예약을 진행해 주세요.', 'match', v_match.id);
  insert into events (user_id, name, props)
  values (v_pro, 'match_confirm', jsonb_build_object('type', p_type, 'source_id', p_source_id));

  return v_match;
end $$;

-- ---------------------------------------------------------------------
-- RPC: spend credits atomically (boost / urgent / premium)
-- ---------------------------------------------------------------------
create or replace function spend_credits(
  p_amount int, p_reason text, p_ref_type text default null, p_ref_id uuid default null
) returns credits
language plpgsql security definer set search_path = public
as $$
declare
  v_pro uuid := auth.uid();
  v_row credits;
begin
  if v_pro is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  select * into v_row from credits where pro_id = v_pro for update;
  if not found then
    insert into credits (pro_id, balance) values (v_pro, 0) returning * into v_row;
  end if;
  if v_row.balance < p_amount then
    raise exception 'INSUFFICIENT_CREDIT' using errcode = 'P0020';
  end if;

  update credits set balance = balance - p_amount, updated_at = now()
   where pro_id = v_pro returning * into v_row;

  insert into credit_transactions (pro_id, type, amount, reason, ref_type, ref_id)
  values (v_pro, 'spend', -p_amount, p_reason, p_ref_type, p_ref_id);

  insert into events (user_id, name, props)
  values (v_pro, 'boost_purchase', jsonb_build_object('amount', p_amount, 'reason', p_reason));

  return v_row;
end $$;

-- ---------------------------------------------------------------------
-- increment a member's no-show counter (called by the other party's action)
-- ---------------------------------------------------------------------
create or replace function increment_no_show(p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update users set no_show_count = no_show_count + 1 where id = p_user;
end $$;

-- ---------------------------------------------------------------------
-- recalc professional rating when a review lands
-- ---------------------------------------------------------------------
create or replace function refresh_pro_rating()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_pro uuid := coalesce(new.pro_id, old.pro_id);
begin
  update professional_profiles p
     set rating_avg = coalesce((select round(avg(rating)::numeric,1) from reviews where pro_id = v_pro),0),
         review_count = (select count(*) from reviews where pro_id = v_pro)
   where p.user_id = v_pro;
  return null;
end $$;

create trigger trg_review_rating
  after insert or update or delete on reviews
  for each row execute function refresh_pro_rating();
