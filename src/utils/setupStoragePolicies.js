import { supabase, STORAGE_BUCKETS } from '../lib/supabase.js';

/**
 * Checks storage bucket setup and provides guidance for policy configuration
 * Note: Storage policies must be set up manually in Supabase SQL Editor
 */
export const setupStoragePolicies = async () => {
  console.log('Checking storage bucket configuration...');
  
  try {
    // Test if user can access their storage folders
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found, skipping storage policy check');
      return;
    }
    
    const userId = user.id;
    console.log(`Testing storage access for user: ${userId}`);
    
    // Test user documents bucket access
    try {
      const { data: userDocsList, error: userDocsError } = await supabase.storage
        .from(STORAGE_BUCKETS.USER_DOCUMENTS)
        .list(userId, { limit: 1 });
        
      if (userDocsError) {
        console.warn('❌ User documents storage access denied:', userDocsError.message);
        console.log('📋 Storage policies need to be set up. Check setup-storage-policies.sql');
      } else {
        console.log('✅ User documents storage access working');
      }
    } catch (error) {
      console.warn('❌ User documents bucket test failed:', error.message);
    }
    
    // Test complaint images bucket access
    try {
      const { data: complaintImagesList, error: complaintImagesError } = await supabase.storage
        .from(STORAGE_BUCKETS.COMPLAINT_IMAGES)
        .list(userId, { limit: 1 });
        
      if (complaintImagesError) {
        console.warn('❌ Complaint images storage access denied:', complaintImagesError.message);
        console.log('📋 Storage policies need to be set up. Check setup-storage-policies.sql');
      } else {
        console.log('✅ Complaint images storage access working');
      }
    } catch (error) {
      console.warn('❌ Complaint images bucket test failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error during storage policy check:', error);
  }
  
  console.log('📋 Storage policy check completed.');
  console.log('💡 If you see access denied errors, run the SQL script: setup-storage-policies.sql');
  console.log('📁 Make sure buckets exist: user-documents, complaint-images');
};
