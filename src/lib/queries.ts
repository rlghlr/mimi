// Shared PostgREST select strings (embedding via named FK constraints).

export const POST_SELECT =
  "*, pro:professional_profiles!fk_post_pro_profile(name, avatar_url, region, career), category:categories(name, type)";

export const APPLICATION_SELECT =
  "*, applicant:customer_profiles!fk_app_customer_profile(nickname, avatar_url, gender, birth_era, region, hair_length, hair_state)";

export const CONSULTATION_SELECT =
  "*, customer:customer_profiles!fk_consult_customer_profile(nickname, avatar_url, region), category:categories(name, type)";

export const OFFER_SELECT =
  "*, pro:professional_profiles!fk_offer_pro_profile(name, avatar_url, career, region, rating_avg, review_count)";

export const RESERVATION_PRO_SELECT =
  "*, pro:professional_profiles!fk_reservation_pro_profile(name, avatar_url), shop:shops(name, address)";

export const RESERVATION_CUST_SELECT =
  "*, customer:customer_profiles!fk_reservation_customer_profile(nickname, avatar_url), shop:shops(name, address)";
