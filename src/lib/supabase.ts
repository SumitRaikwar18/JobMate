import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ebhzdlpljcmhtfwukhpo.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaHpkbHBsamNtaHRmd3VraHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTI1ODQsImV4cCI6MjEwNjA2ODU4NH0.36tphrvnRSZfTwIOkZXuNu3IDDOqbgGhQum3h1OCqmE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  headline: string | null;
  target_role: string | null;
  target_industry: string | null;
  years_of_experience: number | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  telegram_handle: string | null;
  telegram_chat_id: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type Resume = {
  id: string;
  user_id: string;
  title: string;
  template_id: string;
  language: string;
  target_role: string | null;
  target_company: string | null;
  ats_score: number;
  ats_feedback: any;
  resume_data: any;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Job = {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  description: string;
  required_skills: string[] | null;
  match_score: number;
  match_details: any;
  status: string;
  url: string | null;
  created_at: string;
  updated_at: string;
};
