export interface Profile {
  id: string;
  user_id: string;
  role: 'operator' | 'engineer' | 'admin';
  company_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}
