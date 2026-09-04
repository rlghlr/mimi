-- =====================================================================
-- Muse · Row Level Security
-- Principle: users read/write only their own rows; public/marketplace
-- data is readable; admins bypass via is_admin(). State-changing RPCs
-- run as SECURITY DEFINER and are the only path for cross-user writes.
-- =====================================================================

alter table users                  enable row level security;
alter table shops                  enable row level security;
alter table categories             enable row level security;
alter table customer_profiles      enable row level security;
alter table professional_profiles  enable row level security;
alter table recruit_posts          enable row level security;
alter table recruit_applications   enable row level security;
alter table consultations          enable row level security;
alter table consultation_offers    enable row level security;
alter table matches                enable row level security;
alter table chats                  enable row level security;
alter table chat_messages          enable row level security;
alter table reservations           enable row level security;
alter table consents               enable row level security;
alter table reviews                enable row level security;
alter table portfolio              enable row level security;
alter table favorites              enable row level security;
alter table notifications          enable row level security;
alter table reports                enable row level security;
alter table credits                enable row level security;
alter table credit_transactions    enable row level security;
alter table payments               enable row level security;
alter table events                 enable row level security;

-- ---------- reference data: readable by all, writable by admin ----------
create policy read_categories on categories for select using (true);
create policy admin_categories on categories for all using (is_admin()) with check (is_admin());

create policy read_shops on shops for select using (true);
create policy write_shops on shops for all
  using (is_admin() or auth_role() = 'professional')
  with check (is_admin() or auth_role() = 'professional');

-- ---------- users ----------
create policy read_own_user   on users for select using (id = auth.uid() or is_admin());
create policy update_own_user on users for update using (id = auth.uid()) with check (id = auth.uid());
create policy admin_users      on users for all using (is_admin()) with check (is_admin());

-- ---------- customer_profiles (public read for matching) ----------
create policy read_customer_profiles on customer_profiles for select using (true);
create policy write_own_customer on customer_profiles for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

-- ---------- professional_profiles (public read) ----------
create policy read_pro_profiles on professional_profiles for select using (true);
create policy write_own_pro on professional_profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy admin_pro on professional_profiles for all using (is_admin()) with check (is_admin());

-- ---------- recruit_posts ----------
create policy read_posts on recruit_posts for select
  using (deleted_at is null or pro_id = auth.uid() or is_admin());
create policy insert_own_post on recruit_posts for insert
  with check (pro_id = auth.uid() and auth_role() = 'professional');
create policy update_own_post on recruit_posts for update
  using (pro_id = auth.uid() or is_admin()) with check (pro_id = auth.uid() or is_admin());

-- ---------- recruit_applications ----------
-- applicant sees own; post owner sees applications to their post
create policy read_applications on recruit_applications for select using (
  applicant_id = auth.uid()
  or exists (select 1 from recruit_posts p where p.id = post_id and p.pro_id = auth.uid())
  or is_admin()
);
create policy insert_application on recruit_applications for insert
  with check (applicant_id = auth.uid());
create policy update_application on recruit_applications for update using (
  applicant_id = auth.uid()
  or exists (select 1 from recruit_posts p where p.id = post_id and p.pro_id = auth.uid())
  or is_admin()
);

-- ---------- consultations ----------
-- pros browse open consultations; customers manage own
create policy read_consultations on consultations for select using (
  customer_id = auth.uid()
  or (status = 'open' and auth_role() = 'professional')
  or is_admin()
);
create policy write_own_consultation on consultations for all
  using (customer_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or is_admin());

-- ---------- consultation_offers ----------
create policy read_offers on consultation_offers for select using (
  pro_id = auth.uid()
  or exists (select 1 from consultations c where c.id = consultation_id and c.customer_id = auth.uid())
  or is_admin()
);
create policy insert_offer on consultation_offers for insert
  with check (pro_id = auth.uid() and auth_role() = 'professional');
create policy update_offer on consultation_offers for update using (
  pro_id = auth.uid()
  or exists (select 1 from consultations c where c.id = consultation_id and c.customer_id = auth.uid())
  or is_admin()
);

-- ---------- matches ----------
create policy read_matches on matches for select
  using (customer_id = auth.uid() or pro_id = auth.uid() or is_admin());
create policy update_matches on matches for update
  using (customer_id = auth.uid() or pro_id = auth.uid() or is_admin());

-- ---------- chats ----------
create policy read_chats on chats for select
  using (customer_id = auth.uid() or pro_id = auth.uid() or is_admin());
create policy update_chats on chats for update
  using (customer_id = auth.uid() or pro_id = auth.uid());

-- ---------- chat_messages ----------
create policy read_messages on chat_messages for select using (
  exists (select 1 from chats c where c.id = chat_id
          and (c.customer_id = auth.uid() or c.pro_id = auth.uid() or is_admin()))
);
create policy send_messages on chat_messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from chats c
     where c.id = chat_id
       and (c.customer_id = auth.uid() or c.pro_id = auth.uid())
       and (c.blocked_by is null)              -- blocked chats cannot send
  )
);
create policy update_read on chat_messages for update using (
  exists (select 1 from chats c where c.id = chat_id
          and (c.customer_id = auth.uid() or c.pro_id = auth.uid()))
);

-- ---------- reservations ----------
create policy read_reservations on reservations for select
  using (customer_id = auth.uid() or pro_id = auth.uid() or is_admin());
create policy write_reservations on reservations for all
  using (customer_id = auth.uid() or pro_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or pro_id = auth.uid() or is_admin());

-- ---------- consents ----------
create policy read_consents on consents for select
  using (user_id = auth.uid() or is_admin());
create policy write_consents on consents for insert with check (user_id = auth.uid());

-- ---------- reviews (public read) ----------
create policy read_reviews on reviews for select using (true);
create policy write_own_review on reviews for insert with check (author_id = auth.uid());
create policy update_review on reviews for update
  using (author_id = auth.uid() or pro_id = auth.uid() or is_admin());

-- ---------- portfolio (public read) ----------
create policy read_portfolio on portfolio for select using (true);
create policy write_own_portfolio on portfolio for all
  using (pro_id = auth.uid() or is_admin())
  with check (pro_id = auth.uid() or is_admin());

-- ---------- favorites ----------
create policy own_favorites on favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- notifications ----------
create policy read_own_notifications on notifications for select
  using (user_id = auth.uid() or is_admin());
create policy update_own_notifications on notifications for update
  using (user_id = auth.uid());

-- ---------- reports ----------
create policy insert_report on reports for insert with check (reporter_id = auth.uid());
create policy read_reports on reports for select
  using (reporter_id = auth.uid() or is_admin());
create policy admin_reports on reports for update using (is_admin());

-- ---------- credits / transactions ----------
create policy read_own_credits on credits for select using (pro_id = auth.uid() or is_admin());
create policy read_own_txns on credit_transactions for select using (pro_id = auth.uid() or is_admin());

-- ---------- payments ----------
create policy read_own_payments on payments for select using (user_id = auth.uid() or is_admin());
create policy insert_own_payment on payments for insert with check (user_id = auth.uid());
create policy admin_payments on payments for update using (is_admin());

-- ---------- events (write via definer RPCs; admin reads) ----------
create policy insert_event on events for insert with check (user_id = auth.uid() or user_id is null);
create policy read_events on events for select using (is_admin());
