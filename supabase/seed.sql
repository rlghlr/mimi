-- =====================================================================
-- Muse · seed data (local dev)
-- Demo login: all accounts use password  →  muse1234
--   admin@muse.dev (admin) · soo@muse.dev / jin@muse.dev (pro)
--   mina@muse.dev / hana@muse.dev (customer)
-- =====================================================================

-- ---------------- categories ----------------
insert into categories (type, name, slug, sort) values
  ('hair','헤어','hair',1),
  ('makeup','메이크업','makeup',2),
  ('nail','네일','nail',3),
  ('lash','속눈썹','lash',4),
  ('skin','피부/에스테틱','skin',5),
  ('semi_permanent','반영구','semi-permanent',6),
  ('tattoo','타투','tattoo',7);

-- ---------------- shops ----------------
insert into shops (id, name, address, region, lat, lng) values
  ('00000000-0000-0000-0000-0000000005a1','살롱 드 뮤즈','서울 강남구 신사동 123-4','강남',37.5219,127.0227),
  ('00000000-0000-0000-0000-0000000005a2','아뜰리에 로즈','서울 마포구 서교동 55-1','홍대',37.5561,126.9229);

-- ---------------- demo auth users ----------------
-- inserts into auth.users fire handle_new_user() → public.users + profiles
do $$
declare
  v_pw text := crypt('muse1234', gen_salt('bf'));
  ids uuid[] := array[
    '00000000-0000-0000-0000-0000000000a1', -- admin
    '00000000-0000-0000-0000-0000000000b1', -- pro 1
    '00000000-0000-0000-0000-0000000000b2', -- pro 2
    '00000000-0000-0000-0000-0000000000c1', -- model 1
    '00000000-0000-0000-0000-0000000000c2'  -- model 2
  ];
  emails text[] := array['admin@muse.dev','soo@muse.dev','jin@muse.dev','mina@muse.dev','hana@muse.dev'];
  roles text[]  := array['admin','professional','professional','customer','customer'];
  i int;
begin
  for i in 1..array_length(ids,1) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', ids[i], 'authenticated', 'authenticated',
      emails[i], v_pw, now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('role', roles[i]),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), ids[i], ids[i]::text,
      jsonb_build_object('sub', ids[i]::text, 'email', emails[i]),
      'email', now(), now(), now()
    );
  end loop;
end $$;

-- ---------------- flesh out professional profiles ----------------
update professional_profiles set
  name='수 아티스트', specialties=array['hair']::category_type[], career='9년차 · 청담 헤어살롱',
  region='강남', bio='단발·펌 전문. 얼굴형에 맞는 스타일을 찾아드려요.',
  services=array['커트','펌','염색','클리닉'], certificates=array['미용사(일반)'],
  shop_id='00000000-0000-0000-0000-0000000005a1', approved=true, approved_at=now()
where user_id='00000000-0000-0000-0000-0000000000b1';

update professional_profiles set
  name='진 메이크업', specialties=array['makeup','lash']::category_type[], career='6년차 · 웨딩/화보',
  region='홍대', bio='웨딩·화보 메이크업. 자연스러운 데일리룩도 자신 있어요.',
  services=array['웨딩','화보','데일리','속눈썹연장'], certificates=array['메이크업 국가자격'],
  shop_id='00000000-0000-0000-0000-0000000005a2', approved=true, approved_at=now()
where user_id='00000000-0000-0000-0000-0000000000b2';

update users set status='active' where role='professional';

update customer_profiles set
  nickname='미나', gender='여성', birth_era='1990s', region='강남',
  desired_services=array['hair']::category_type[], hair_length='단발',
  hair_state='염색모', bio='새로운 스타일에 도전하고 싶어요!'
where user_id='00000000-0000-0000-0000-0000000000c1';

update customer_profiles set
  nickname='하나', gender='여성', birth_era='2000s', region='홍대',
  desired_services=array['makeup']::category_type[],
  bio='촬영용 메이크업 모델 지원 자주 해요.'
where user_id='00000000-0000-0000-0000-0000000000c2';

-- ---------------- sample recruit posts ----------------
insert into recruit_posts
  (id, pro_id, category_id, title, detail, before_condition, model_conditions,
   headcount, place, address, region, session_date, session_time, duration_min,
   cost_type, pay_amount, charge_amount, reference_images, agreements, status, is_urgent)
values
  ('00000000-0000-0000-0000-000000000d01',
   '00000000-0000-0000-0000-0000000000b1',
   (select id from categories where slug='hair'),
   '레이어드 단발 커트 모델 구해요', '트렌디한 레이어드 단발 시술 모델을 모집합니다. 결과물은 포트폴리오에 사용됩니다.',
   '어깨 아래 길이, 손상 심하지 않은 모발',
   '{"gender":"무관","age":"20~30대","hair_length":"미디움 이상","history":"무관"}',
   1, '살롱 드 뮤즈', '서울 강남구 신사동 123-4', '강남',
   current_date + 3, '오후 2:00', 90,
   'free', 0, 0, array['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'],
   '{"sns":true,"photo":true,"video":false,"before_after":true}', 'recruiting', false),

  ('00000000-0000-0000-0000-000000000d02',
   '00000000-0000-0000-0000-0000000000b2',
   (select id from categories where slug='makeup'),
   '[급구] 내일 화보 촬영 메이크업 모델', '내일 오전 스튜디오 화보 촬영에 함께할 메이크업 모델을 급하게 찾습니다.',
   '피부 트러블 적은 분 선호',
   '{"gender":"여성","age":"20대","hair_length":"무관","history":"무관"}',
   2, '아뜰리에 로즈', '서울 마포구 서교동 55-1', '홍대',
   current_date + 1, '오전 10:00', 120,
   'model_pay', 30000, 0, array['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800'],
   '{"sns":true,"photo":true,"video":true,"before_after":false}', 'recruiting', true);

-- ---------------- portfolio ----------------
insert into portfolio (pro_id, category_id, image_url, caption, sort) values
  ('00000000-0000-0000-0000-0000000000b1',(select id from categories where slug='hair'),
   'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600','레이어드 펌',1),
  ('00000000-0000-0000-0000-0000000000b1',(select id from categories where slug='hair'),
   'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600','내추럴 단발',2),
  ('00000000-0000-0000-0000-0000000000b2',(select id from categories where slug='makeup'),
   'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=600','웨딩 메이크업',1);

-- ---------------- sample consultation ----------------
insert into consultations (customer_id, category_id, content, region, budget, status)
values (
  '00000000-0000-0000-0000-0000000000c1',
  (select id from categories where slug='hair'),
  '단발이 어울릴지 상담받고 싶어요. 염색으로 머릿결이 상한 상태예요.',
  '강남', 50000, 'open'
);
