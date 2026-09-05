// Muse · shared domain types (enums + row shapes).
// Hand-written; the source of truth for the DB is the Data Connect schema
// at dataconnect/schema/schema.gql. These snake_case row shapes match what
// the src/lib/reads.ts data layer returns to pages/components.

export type Role = "customer" | "professional" | "admin";
export type UserStatus = "active" | "pending" | "suspended" | "withdrawn" | "reported";
export type CategoryType =
  | "hair" | "makeup" | "nail" | "lash" | "skin" | "semi_permanent" | "tattoo";
export type CostType = "free" | "model_pay" | "material_fee" | "discount" | "negotiable";
export type PostStatus = "recruiting" | "closing_soon" | "completed" | "ended" | "cancelled";
export type ApplicationStatus =
  | "applied" | "reviewing" | "chatting" | "matched" | "rejected" | "cancelled";
export type ConsultationStatus = "open" | "offered" | "closed" | "cancelled";
export type OfferStatus = "sent" | "accepted" | "declined" | "withdrawn";
export type MatchType = "recruit" | "consultation";
export type MatchStatus = "pending" | "confirmed" | "cancelled";
export type MessageType =
  | "text" | "image" | "price_offer" | "date_offer" | "location" | "reservation_offer" | "system";
export type ReservationStatus =
  | "requested" | "confirmed" | "upcoming" | "completed" | "cancelled" | "no_show";
export type ReportReason =
  | "fake_post" | "no_show" | "inappropriate" | "price_change" | "fraud" | "illegal" | "other";
export type ReportStatus = "received" | "processing" | "resolved" | "dismissed";
export type FavoriteTarget = "professional" | "post" | "product";

type Timestamps = { created_at: string; updated_at: string };

export type UserRow = Timestamps & {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: UserStatus;
  no_show_count: number;
  last_active_at: string | null;
  deleted_at: string | null;
}

export type CustomerProfileRow = Timestamps & {
  id: string;
  user_id: string;
  avatar_url: string | null;
  nickname: string | null;
  gender: string | null;
  birth_era: string | null;
  region: string | null;
  desired_services: CategoryType[];
  hair_length: string | null;
  hair_state: string | null;
  service_history: string | null;
  model_experience: string | null;
  bio: string | null;
  sns_url: string | null;
  portfolio_urls: string[];
}

export type ProfessionalProfileRow = Timestamps & {
  id: string;
  user_id: string;
  shop_id: string | null;
  avatar_url: string | null;
  name: string | null;
  specialties: CategoryType[];
  career: string | null;
  region: string | null;
  bio: string | null;
  services: string[];
  certificates: string[];
  career_items: unknown;
  sns_url: string | null;
  approved: boolean;
  approved_at: string | null;
  rating_avg: number;
  review_count: number;
}

export type ShopRow = Timestamps & {
  id: string;
  name: string;
  address: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
}

export type CategoryRow = {
  id: string;
  type: CategoryType;
  name: string;
  slug: string;
  sort: number;
}

export type RecruitPostRow = Timestamps & {
  id: string;
  pro_id: string;
  category_id: string | null;
  title: string;
  detail: string | null;
  before_condition: string | null;
  model_conditions: Record<string, unknown>;
  headcount: number;
  matched_count: number;
  place: string | null;
  address: string | null;
  region: string | null;
  session_date: string | null;
  session_time: string | null;
  duration_min: number | null;
  cost_type: CostType;
  pay_amount: number | null;
  charge_amount: number | null;
  reference_images: string[];
  result_images: string[];
  agreements: Record<string, boolean>;
  status: PostStatus;
  is_urgent: boolean;
  boost_until: string | null;
  view_count: number;
  deleted_at: string | null;
}

export type RecruitApplicationRow = Timestamps & {
  id: string;
  post_id: string;
  applicant_id: string;
  photos: Record<string, string>;
  current_state: string | null;
  recent_history: string | null;
  available_dates: string[];
  message: string | null;
  status: ApplicationStatus;
}

export type ConsultationRow = Timestamps & {
  id: string;
  customer_id: string;
  category_id: string | null;
  content: string | null;
  current_photo: string | null;
  desired_photo: string | null;
  region: string | null;
  available_dates: string[];
  budget: number | null;
  status: ConsultationStatus;
  deleted_at: string | null;
}

export type ConsultationOfferRow = Timestamps & {
  id: string;
  consultation_id: string;
  pro_id: string;
  recommend: string | null;
  method: string | null;
  price: number | null;
  duration_min: number | null;
  available_dates: string[];
  portfolio_ref: string[];
  message: string | null;
  status: OfferStatus;
}

export type MatchRow = Timestamps & {
  id: string;
  type: MatchType;
  source_id: string;
  customer_id: string;
  pro_id: string;
  status: MatchStatus;
  confirmed_at: string | null;
  cancelled_reason: string | null;
}

export type ChatRow = Timestamps & {
  id: string;
  match_id: string | null;
  customer_id: string;
  pro_id: string;
  last_message: string | null;
  last_message_at: string | null;
  blocked_by: string | null;
}

export type ChatMessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  type: MessageType;
  body: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export type ReservationRow = Timestamps & {
  id: string;
  chat_id: string | null;
  customer_id: string;
  pro_id: string;
  shop_id: string | null;
  service: string | null;
  session_date: string | null;
  session_time: string | null;
  duration_min: number | null;
  amount: number;
  discount: number;
  final_amount: number;
  status: ReservationStatus;
}

export type ReviewRow = Timestamps & {
  id: string;
  reservation_id: string | null;
  author_id: string;
  pro_id: string;
  rating: number;
  text: string | null;
  photos: string[];
  service_name: string | null;
  has_photo: boolean;
  pro_reply: string | null;
}

export type PortfolioRow = {
  id: string;
  pro_id: string;
  category_id: string | null;
  image_url: string;
  caption: string | null;
  sort: number;
  created_at: string;
}

export type FavoriteRow = {
  id: string;
  user_id: string;
  target_type: FavoriteTarget;
  target_id: string;
  created_at: string;
}

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  ref_type: string | null;
  ref_id: string | null;
  read_at: string | null;
  created_at: string;
}

export type ReportRow = Timestamps & {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
}

export type CreditRow = {
  id: string;
  pro_id: string;
  balance: number;
  updated_at: string;
}

export type ConsentRow = {
  id: string;
  reservation_id: string | null;
  user_id: string;
  face: boolean;
  process: boolean;
  before_after: boolean;
  sns: boolean;
  ad: boolean;
  portfolio: boolean;
  signed_at: string;
  ip: string | null;
}

export type EventRow = {
  id: number;
  user_id: string | null;
  name: string;
  props: Record<string, unknown>;
  created_at: string;
}

// Generic table shape helper.
type T<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      users: T<UserRow>;
      customer_profiles: T<CustomerProfileRow>;
      professional_profiles: T<ProfessionalProfileRow>;
      shops: T<ShopRow>;
      categories: T<CategoryRow>;
      recruit_posts: T<RecruitPostRow>;
      recruit_applications: T<RecruitApplicationRow>;
      consultations: T<ConsultationRow>;
      consultation_offers: T<ConsultationOfferRow>;
      matches: T<MatchRow>;
      chats: T<ChatRow>;
      chat_messages: T<ChatMessageRow>;
      reservations: T<ReservationRow>;
      reviews: T<ReviewRow>;
      portfolio: T<PortfolioRow>;
      favorites: T<FavoriteRow>;
      notifications: T<NotificationRow>;
      reports: T<ReportRow>;
      credits: T<CreditRow>;
      consents: T<ConsentRow>;
      events: T<EventRow>;
    };
    Views: Record<string, never>;
    Functions: {
      apply_to_post: {
        Args: {
          p_post_id: string;
          p_photos?: Record<string, string>;
          p_current_state?: string;
          p_recent_history?: string;
          p_available_dates?: string[];
          p_message?: string;
        };
        Returns: RecruitApplicationRow;
      };
      open_chat: {
        Args: { p_customer: string; p_pro: string; p_match?: string };
        Returns: ChatRow;
      };
      confirm_match: {
        Args: { p_type: MatchType; p_source_id: string; p_customer: string };
        Returns: MatchRow;
      };
      spend_credits: {
        Args: { p_amount: number; p_reason: string; p_ref_type?: string; p_ref_id?: string };
        Returns: CreditRow;
      };
    };
    Enums: {
      user_role: Role;
      user_status: UserStatus;
      category_type: CategoryType;
    };
    CompositeTypes: Record<string, never>;
  };
}
