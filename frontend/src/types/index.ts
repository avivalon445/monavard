// User Types
export type UserType = 'customer' | 'supplier' | 'admin';
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

// Notification Types
export type NotificationType = 
  | 'bid_received'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'order_update'
  | 'payment_received'
  | 'message_received'
  | 'system_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type RelatedType = 'bid' | 'order' | 'request' | 'message' | 'payment';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: number;
  related_type?: RelatedType;
  is_read: boolean;
  is_pushed: boolean;
  priority: NotificationPriority;
  expires_at?: string;
  created_at: string;
  read_at?: string;
  is_expired?: boolean;
}

export interface NotificationTypeInfo {
  value: NotificationType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  high_priority_unread: number;
  new_bids: number;
  order_updates: number;
  new_messages: number;
}

export interface RealTimeEvent {
  id: number;
  event_type: NotificationType;
  data?: any;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: UserType;
  is_verified: boolean;
  is_active: boolean;
  account_status: AccountStatus;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// Request Types
export type RequestStatus = 
  | 'pending_categorization' 
  | 'open_for_bids' 
  | 'bids_received' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'expired';

export type TimeFlexibility = 'critical' | 'week' | 'month';
export type Currency = 'EUR' | 'USD';

export interface Request {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  currency?: Currency;
  delivery_date?: string;
  time_flexibility?: TimeFlexibility;
  priorities?: string;
  status: RequestStatus;
  category_id?: number;
  ai_categorized: boolean;
  manually_categorized: boolean;
  ai_confidence?: number;
  ai_categories_suggested?: string;
  ai_reasoning?: string;
  file_notes?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  bid_count?: number;
  min_bid_price?: number;
  max_bid_price?: number;
  avg_bid_price?: number;
}

// Bid Types
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';

export interface Bid {
  id: number;
  request_id: number;
  supplier_id: number;
  price: number;
  delivery_time_days: number;
  description?: string;
  proposal_details?: string;
  materials_cost?: number;
  labor_cost?: number;
  other_costs?: number;
  status: BidStatus;
  response_time_hours?: number;
  expires_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  anonymous_name?: string;
  anonymous_rating?: number;
  anonymous_review_count?: number;
  request_title?: string;
}

// Bid Creation Types
export interface CreateBidData {
  request_id: number;
  price: number;
  delivery_time_days: number;
  description?: string;
  proposal_details?: string;
  materials_cost?: number;
  labor_cost?: number;
  other_costs?: number;
}

// Order Types
export type OrderStatus = 
  | 'confirmed' 
  | 'in_production' 
  | 'shipped' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export interface Order {
  id: number;
  bid_id: number;
  customer_id: number;
  supplier_id: number;
  order_number: string;
  total_amount: number;
  commission_amount: number;
  commission_rate: number;
  status: OrderStatus;
  delivery_date: string | null;
  actual_delivery_date: string | null;
  tracking_number: string | null;
  notes: string | null;
  customer_notes: string | null;
  supplier_notes: string | null;
  created_at: string;
  updated_at: string;
  // Extended fields from joins
  request_id?: number;
  request_title?: string;
  request_description?: string;
  category_id?: number;
  category_name?: string;
  bid_price?: number;
  delivery_time_days?: number;
  bid_description?: string;
  supplier_first_name?: string;
  supplier_last_name?: string;
  supplier_email?: string;
  supplier_company_name?: string;
  supplier_phone?: string;
  updates_count?: number;
  unread_messages?: number;
}

export interface OrderUpdate {
  id: number;
  order_id: number;
  status: string;
  message: string | null;
  image_path: string | null;
  created_by: number;
  created_at: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: OrderStatus;
  notes: string | null;
  changed_by: number | null;
  created_at: string;
  changed_by_first_name?: string;
  changed_by_last_name?: string;
}

export interface OrderDetails extends Order {
  updates: OrderUpdate[];
  status_history: OrderStatusHistory[];
  budget_min?: number;
  budget_max?: number;
  currency?: string;
  materials_cost?: number;
  labor_cost?: number;
  other_costs?: number;
  supplier_address?: string;
}

export interface OrderStatistics {
  total_orders: number;
  active_orders: number;
  delivered_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
  avg_order_value: number;
  avg_delivery_days: number;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Profile Types
export interface CustomerProfile {
  id: number;
  user_id: number;
  company_name?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  avatar_url?: string;
  bio?: string;
  industry?: string;
  company_size?: string;
  preferred_currency?: Currency;
  language?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  two_factor_enabled?: boolean;
  email_visibility?: 'public' | 'private' | 'contacts_only';
  profile_visibility?: 'public' | 'private';
  activity_status?: 'online' | 'away' | 'busy' | 'invisible';
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: number;
  user_id: number;
  email_new_bids: boolean;
  email_order_updates: boolean;
  email_messages: boolean;
  email_promotions: boolean;
  sms_order_updates: boolean;
  sms_messages: boolean;
  push_notifications: boolean;
  real_time_notifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: 'customer' | 'supplier' | 'admin';
  is_verified: boolean;
  created_at: string;
}

export interface CompleteProfile {
  user: UserProfile;
  profile: CustomerProfile;
  notification_settings: NotificationSettings;
}

export interface SupplierProfile {
  id: number;
  user_id: number;
  company_name: string;
  business_license?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
  is_approved: boolean;
  rating: number;
  review_count: number;
  approval_date?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  company_size?: string;
  year_established?: number;
  verification_status?: 'pending' | 'verified' | 'rejected';
}

// Dashboard Types
export interface CustomerDashboardMetrics {
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
  avg_order_amount: number;
  avg_bid_price: number;
  total_commissions: number;
  requests_last_7d: number;
  requests_last_30d: number;
  bids_last_7d: number;
  bids_last_30d: number;
  orders_last_7d: number;
  orders_last_30d: number;
}

export interface DashboardRequest {
  id: number;
  title: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  created_at: string;
  delivery_date: string | null;
  bid_count: number;
  min_bid_price: number | null;
  max_bid_price: number | null;
  category_name: string | null;
}

export interface DashboardActivity {
  activity_type: 'bid_received' | 'request_created' | 'order_update';
  id: number;
  request_title: string;
  request_id: number;
  price: number | null;
  delivery_time_days: number | null;
  created_at: string;
  status: string;
}

export interface CustomerDashboardData {
  metrics: CustomerDashboardMetrics;
  recent_requests: DashboardRequest[];
  recent_activity: DashboardActivity[];
}

export interface SupplierDashboardMetrics {
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  rejected_bids: number;
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  total_earned: number;
  avg_rating: number;
  available_requests: number;
}

// Notification Types
export type NotificationType = 
  | 'bid_received' 
  | 'bid_accepted' 
  | 'bid_rejected' 
  | 'order_update' 
  | 'payment_received' 
  | 'message_received' 
  | 'system_alert';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: number;
  related_type?: string;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages?: number;
      totalPages?: number;
      hasNext?: boolean;
      hasPrev?: boolean;
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type: UserType;
  company_name?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  profile?: CustomerProfile | SupplierProfile;
}

