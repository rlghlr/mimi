-- =====================================================================
-- Muse · core schema
-- Beauty model ↔ professional two-sided matching marketplace
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role          as enum ('customer', 'professional', 'admin');
create type user_status        as enum ('active', 'pending', 'suspended', 'withdrawn', 'reported');
create type category_type      as enum ('hair', 'makeup', 'nail', 'lash', 'skin', 'semi_permanent', 'tattoo');
create type cost_type          as enum ('free', 'model_pay', 'material_fee', 'discount', 'negotiable');
create type post_status        as enum ('recruiting', 'closing_soon', 'completed', 'ended', 'cancelled');
create type application_status as enum ('applied', 'reviewing', 'chatting', 'matched', 'rejected', 'cancelled');
create type consultation_status as enum ('open', 'offered', 'closed', 'cancelled');
create type offer_status       as enum ('sent', 'accepted', 'declined', 'withdrawn');
create type match_type         as enum ('recruit', 'consultation');
create type match_status       as enum ('pending', 'confirmed', 'cancelled');
create type message_type       as enum ('text', 'image', 'price_offer', 'date_offer', 'location', 'reservation_offer', 'system');
create type reservation_status as enum ('requested', 'confirmed', 'upcoming', 'completed', 'cancelled', 'no_show');
create type report_reason      as enum ('fake_post', 'no_show', 'inappropriate', 'price_change', 'fraud', 'illegal', 'other');
create type report_status      as enum ('received', 'processing', 'resolved', 'dismissed');
create type favorite_target    as enum ('professional', 'post', 'product');
create type payment_kind       as enum ('credit', 'reservation', 'ad');
create type payment_status     as enum ('pending', 'paid', 'failed', 'refunded');
create type credit_txn_type    as enum ('charge', 'spend', 'refund');

-- ---------------------------------------------------------------------
-- helper: updated_at trigger
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 1. users  (mirrors auth.users, holds role + status)
-- ---------------------------------------------------------------------
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  phone       text,
  role        user_role   not null default 'customer',
  status      user_status not null default 'active',
  no_show_count int not null default 0,
  last_active_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index on users (role);
create index on users (status);

-- ---------------------------------------------------------------------
-- 2. shops
-- ---------------------------------------------------------------------
create table shops (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  region     text,
  lat        double precision,
  lng        double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. categories
-- ---------------------------------------------------------------------
create table categories (
  id     uuid primary key default gen_random_uuid(),
  type   category_type not null,
  name   text not null,
  slug   text not null unique,
  sort   int  not null default 0
);

-- ---------------------------------------------------------------------
-- 4. customer_profiles  (일반 회원 / 모델)
-- ---------------------------------------------------------------------
create table customer_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references users(id) on delete cascade,
  avatar_url      text,
  nickname        text,
  gender          text,
  birth_era       text,        -- 생년대 (e.g. '1990s')
  region          text,
  desired_services category_type[] default '{}',
  hair_length     text,
  hair_state      text,
  service_history text,
  model_experience text,
  bio             text,
  sns_url         text,
  portfolio_urls  text[] default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. professional_profiles  (전문가)
-- ---------------------------------------------------------------------
create table professional_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references users(id) on delete cascade,
  shop_id       uuid references shops(id) on delete set null,
  avatar_url    text,
  name          text,               -- 이름/활동명
  specialties   category_type[] default '{}',
  career        text,
  region        text,
  bio           text,
  services      text[] default '{}',-- 시술 가능 항목
  certificates  text[] default '{}',
  career_items  jsonb  default '[]',
  sns_url       text,
  approved      boolean not null default false,
  approved_at   timestamptz,
  rating_avg    numeric(2,1) not null default 0,
  review_count  int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on professional_profiles (approved);
create index on professional_profiles (region);

-- ---------------------------------------------------------------------
-- 6. recruit_posts  (전문가 → 모델 모집)
-- ---------------------------------------------------------------------
create table recruit_posts (
  id            uuid primary key default gen_random_uuid(),
  pro_id        uuid not null references users(id) on delete cascade,
  category_id   uuid references categories(id) on delete set null,
  title         text not null,
  detail        text,
  before_condition text,
  model_conditions jsonb default '{}',   -- {gender, age, hair_length, history}
  headcount     int not null default 1,
  matched_count int not null default 0,
  place         text,
  address       text,
  region        text,
  session_date  date,
  session_time  text,
  duration_min  int,
  cost_type     cost_type not null default 'free',
  pay_amount    int default 0,           -- 모델 지급 금액
  charge_amount int default 0,           -- 모델 부담 금액
  reference_images text[] default '{}',
  result_images    text[] default '{}',
  agreements    jsonb default '{}',      -- {sns, photo, video, before_after}
  status        post_status not null default 'recruiting',
  is_urgent     boolean not null default false,   -- 급구 (24~72h)
  boost_until   timestamptz,             -- 프리미엄 상단 노출 만료
  view_count    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on recruit_posts (status);
create index on recruit_posts (pro_id);
create index on recruit_posts (is_urgent);
create index on recruit_posts (boost_until);
create index on recruit_posts (created_at desc);

-- ---------------------------------------------------------------------
-- 7. recruit_applications  (모델 지원)
-- ---------------------------------------------------------------------
create table recruit_applications (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references recruit_posts(id) on delete cascade,
  applicant_id   uuid not null references users(id) on delete cascade,
  photos         jsonb default '{}',     -- {front, side, back}
  current_state  text,
  recent_history text,
  available_dates text[] default '{}',
  message        text,
  status         application_status not null default 'applied',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (post_id, applicant_id)         -- 중복 지원 방지
);
create index on recruit_applications (post_id);
create index on recruit_applications (applicant_id);
create index on recruit_applications (status);

-- ---------------------------------------------------------------------
-- 8. consultations  (고객 → 전문가 상담 요청)
-- ---------------------------------------------------------------------
create table consultations (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references users(id) on delete cascade,
  category_id   uuid references categories(id) on delete set null,
  content       text,
  current_photo text,
  desired_photo text,
  region        text,
  available_dates text[] default '{}',
  budget        int,
  status        consultation_status not null default 'open',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on consultations (status);
create index on consultations (customer_id);

-- ---------------------------------------------------------------------
-- 9. consultation_offers  (전문가 제안)
-- ---------------------------------------------------------------------
create table consultation_offers (
  id              uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations(id) on delete cascade,
  pro_id          uuid not null references users(id) on delete cascade,
  recommend       text,
  method          text,
  price           int,
  duration_min    int,
  available_dates text[] default '{}',
  portfolio_ref   uuid[] default '{}',
  message         text,
  status          offer_status not null default 'sent',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (consultation_id, pro_id)
);
create index on consultation_offers (consultation_id);
create index on consultation_offers (pro_id);

-- ---------------------------------------------------------------------
-- 10. matches
-- ---------------------------------------------------------------------
create table matches (
  id           uuid primary key default gen_random_uuid(),
  type         match_type not null,
  source_id    uuid not null,             -- post_id or consultation_id
  customer_id  uuid not null references users(id) on delete cascade,
  pro_id       uuid not null references users(id) on delete cascade,
  status       match_status not null default 'pending',
  confirmed_at timestamptz,
  cancelled_reason text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on matches (customer_id);
create index on matches (pro_id);
create index on matches (status);

-- ---------------------------------------------------------------------
-- 11. chats
-- ---------------------------------------------------------------------
create table chats (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid references matches(id) on delete set null,
  customer_id  uuid not null references users(id) on delete cascade,
  pro_id       uuid not null references users(id) on delete cascade,
  last_message text,
  last_message_at timestamptz,
  blocked_by   uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (customer_id, pro_id)
);
create index on chats (customer_id);
create index on chats (pro_id);
create index on chats (last_message_at desc);

-- ---------------------------------------------------------------------
-- 12. chat_messages
-- ---------------------------------------------------------------------
create table chat_messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references chats(id) on delete cascade,
  sender_id  uuid not null references users(id) on delete cascade,
  type       message_type not null default 'text',
  body       text,
  payload    jsonb default '{}',     -- price/date/location/reservation proposal
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on chat_messages (chat_id, created_at);

-- ---------------------------------------------------------------------
-- 13. reservations
-- ---------------------------------------------------------------------
create table reservations (
  id            uuid primary key default gen_random_uuid(),
  chat_id       uuid references chats(id) on delete set null,
  customer_id   uuid not null references users(id) on delete cascade,
  pro_id        uuid not null references users(id) on delete cascade,
  shop_id       uuid references shops(id) on delete set null,
  service       text,
  session_date  date,
  session_time  text,
  duration_min  int,
  amount        int not null default 0,
  discount      int not null default 0,
  final_amount  int not null default 0,
  status        reservation_status not null default 'requested',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on reservations (customer_id);
create index on reservations (pro_id);
create index on reservations (status);

-- ---------------------------------------------------------------------
-- 14. consents  (전자 초상권 동의 · 항목별)
-- ---------------------------------------------------------------------
create table consents (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade,
  user_id        uuid not null references users(id) on delete cascade,
  face           boolean not null default false,
  process        boolean not null default false,
  before_after   boolean not null default false,
  sns            boolean not null default false,
  ad             boolean not null default false,
  portfolio      boolean not null default false,
  signed_at      timestamptz not null default now(),
  ip             text
);
create index on consents (reservation_id);

-- ---------------------------------------------------------------------
-- 15. reviews
-- ---------------------------------------------------------------------
create table reviews (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid unique references reservations(id) on delete set null,
  author_id      uuid not null references users(id) on delete cascade,
  pro_id         uuid not null references users(id) on delete cascade,
  rating         int not null check (rating between 1 and 5),
  text           text,
  photos         text[] default '{}',
  service_name   text,
  has_photo      boolean generated always as (coalesce(array_length(photos,1),0) > 0) stored,
  pro_reply      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on reviews (pro_id);

-- ---------------------------------------------------------------------
-- 16. portfolio
-- ---------------------------------------------------------------------
create table portfolio (
  id          uuid primary key default gen_random_uuid(),
  pro_id      uuid not null references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  image_url   text not null,
  caption     text,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index on portfolio (pro_id);

-- ---------------------------------------------------------------------
-- 17. favorites
-- ---------------------------------------------------------------------
create table favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  target_type favorite_target not null,
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index on favorites (user_id);

-- ---------------------------------------------------------------------
-- 18. notifications
-- ---------------------------------------------------------------------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  ref_type   text,
  ref_id     uuid,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- 19. reports
-- ---------------------------------------------------------------------
create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references users(id) on delete cascade,
  target_type  text not null,          -- user | post | message
  target_id    uuid not null,
  reason       report_reason not null,
  detail       text,
  status       report_status not null default 'received',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on reports (status);
create index on reports (target_type, target_id);

-- ---------------------------------------------------------------------
-- 20. credits + credit_transactions
-- ---------------------------------------------------------------------
create table credits (
  id         uuid primary key default gen_random_uuid(),
  pro_id     uuid not null unique references users(id) on delete cascade,
  balance    int not null default 0,
  updated_at timestamptz not null default now()
);

create table credit_transactions (
  id         uuid primary key default gen_random_uuid(),
  pro_id     uuid not null references users(id) on delete cascade,
  type       credit_txn_type not null,
  amount     int not null,              -- signed (+charge / -spend)
  reason     text,
  ref_type   text,
  ref_id     uuid,
  created_at timestamptz not null default now()
);
create index on credit_transactions (pro_id, created_at desc);

-- ---------------------------------------------------------------------
-- 21. payments
-- ---------------------------------------------------------------------
create table payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  kind       payment_kind not null,
  amount     int not null,
  fee        int not null default 0,    -- platform commission (reservation)
  pg_id      text,
  status     payment_status not null default 'pending',
  refunded_amount int not null default 0,
  ref_type   text,
  ref_id     uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payments (user_id);
create index on payments (kind);

-- ---------------------------------------------------------------------
-- events  (KPI funnel log — append-only)
-- ---------------------------------------------------------------------
create table events (
  id         bigint generated always as identity primary key,
  user_id    uuid references users(id) on delete set null,
  name       text not null,            -- visit, signup, post_view, apply, ...
  props      jsonb default '{}',
  created_at timestamptz not null default now()
);
create index on events (name, created_at);
create index on events (user_id);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','shops','customer_profiles','professional_profiles','recruit_posts',
    'recruit_applications','consultations','consultation_offers','matches','chats',
    'reservations','reviews','reports','payments'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated before update on %1$I
       for each row execute function set_updated_at()', t);
  end loop;
end $$;
