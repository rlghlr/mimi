-- =====================================================================
-- Muse · extra FK constraints for PostgREST embedding
-- pro_id / customer_id columns reference users(id); to embed the matching
-- *_profiles row directly we add a second FK to <profile>(user_id), which
-- is UNIQUE. Every professional has a professional_profiles row and every
-- customer a customer_profiles row (created by handle_new_user), so these
-- hold. Named so we can hint the relationship in select strings.
-- =====================================================================

alter table recruit_posts
  add constraint fk_post_pro_profile
  foreign key (pro_id) references professional_profiles(user_id) on delete cascade;

alter table recruit_applications
  add constraint fk_app_customer_profile
  foreign key (applicant_id) references customer_profiles(user_id) on delete cascade;

alter table consultations
  add constraint fk_consult_customer_profile
  foreign key (customer_id) references customer_profiles(user_id) on delete cascade;

alter table consultation_offers
  add constraint fk_offer_pro_profile
  foreign key (pro_id) references professional_profiles(user_id) on delete cascade;

alter table reviews
  add constraint fk_review_pro_profile
  foreign key (pro_id) references professional_profiles(user_id) on delete cascade;

alter table portfolio
  add constraint fk_portfolio_pro_profile
  foreign key (pro_id) references professional_profiles(user_id) on delete cascade;

-- chats embed both participants' profiles
alter table chats
  add constraint fk_chat_customer_profile
  foreign key (customer_id) references customer_profiles(user_id) on delete cascade;
alter table chats
  add constraint fk_chat_pro_profile
  foreign key (pro_id) references professional_profiles(user_id) on delete cascade;

-- reservations embed both participants' profiles
alter table reservations
  add constraint fk_reservation_customer_profile
  foreign key (customer_id) references customer_profiles(user_id) on delete cascade;
alter table reservations
  add constraint fk_reservation_pro_profile
  foreign key (pro_id) references professional_profiles(user_id) on delete cascade;
