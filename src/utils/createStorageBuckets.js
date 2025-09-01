import { supabase, STORAGE_BUCKETS } from '../lib/supabase.js';

/**
 * Creates Supabase storage buckets if they don't exist
 */
export const createStorageBuckets = async () => {
  const buckets = Object.values(STORAGE_BUCKETS);
  
  for (const bucketName of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`Error listing buckets:`, listError);
        continue;
      }
      
      const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        
        // Create bucket with public access for file downloads
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png', 
            'image/jpg',
            'application/pdf'
          ],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (error) {
          if (error.status === 403 || error.statusCode === '403') {
            console.log(`⚠️ Bucket ${bucketName} needs to be created manually in Supabase Dashboard (insufficient permissions)`);
          } else {
            console.error(`Error creating bucket ${bucketName}:`, error);
          }
        } else {
          console.log(`✅ Successfully created bucket: ${bucketName}`);
        }
      } else {
        console.log(`✅ Bucket ${bucketName} already exists`);
      }
    } catch (error) {
      console.error(`Error processing bucket ${bucketName}:`, error);
    }
  }
};

// This utility is designed to be imported and used in React components
// For standalone testing, use a separate Node.js script
