import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable to handle email verification links
    flowType: 'pkce', // Use PKCE flow for email verification
    // Reduce auto-refresh frequency to prevent excessive token refreshes
    refreshThreshold: 0.8, // Only refresh when 80% of token lifetime has passed
    // Make sessions tab-scoped: use sessionStorage so each tab has an independent session
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    // Do not sync auth state across tabs (prevents mirroring)
    multiTab: false
  },
  // Disable automatic refresh on page visibility change to prevent unnecessary refreshes
  global: {
    headers: {
      'X-Client-Info': 'traffic-management-app'
    }
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

// Document status
export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
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
