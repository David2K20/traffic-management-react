import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wcyddetrsqhblplwxlvj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWRkZXRyc3FoYmxwbHd4bHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDA0MzUsImV4cCI6MjA3MjE3NjQzNX0.7aKMrENCqa6ynF5rVjpE_8HMG_XDQU_ZN8HcRO_tdRs'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable since we're not using email verification
    flowType: 'implicit' // Use implicit flow to skip email verification
  }
})

// Storage bucket names
export const STORAGE_BUCKETS = {
  COMPLAINT_IMAGES: 'complaint-images',
  USER_DOCUMENTS: 'user-documents'
}

// Document types
export const DOCUMENT_TYPES = {
  LICENSE: 'license',
  ROADWORTHINESS: 'roadworthiness',
  INSURANCE: 'insurance'
}

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
}

// Complaint statuses
export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
}

// Complaint priorities
export const COMPLAINT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

export default supabase
