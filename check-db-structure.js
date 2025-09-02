// Database structure check utility
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocumentsTable() {
  console.log('=== Checking Documents Table Structure ===\n');
  
  try {
    // Get table schema information
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_info', { table_name: 'documents' })
      .select();
    
    if (schemaError) {
      console.log('RPC function not available, checking with a simple query instead...\n');
      
      // Try to get sample data to see what columns exist
      const { data: sampleData, error: sampleError } = await supabase
        .from('documents')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error checking documents table:', sampleError.message);
        return;
      }
      
      console.log('Sample document record (first row):');
      console.log(JSON.stringify(sampleData?.[0] || 'No documents found', null, 2));
      
      if (sampleData?.[0]) {
        console.log('\nAvailable columns:');
        Object.keys(sampleData[0]).forEach(col => {
          console.log(`- ${col}: ${typeof sampleData[0][col]}`);
        });
      }
    } else {
      console.log('Table columns:');
      console.log(columns);
    }
    
  } catch (error) {
    console.error('Error checking table structure:', error.message);
  }
  
  // Check if we can query documents with status using manual join
  console.log('\n=== Testing Documents Query (Manual Join) ===\n');
  
  try {
    // First get documents
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (documentsError) {
      console.error('Error querying documents:', documentsError.message);
      return;
    }
    
    console.log(`Found ${documents?.length || 0} documents in the database`);
    
    if (documents?.length > 0) {
      console.log('\nFirst document example:');
      console.log(JSON.stringify(documents[0], null, 2));
      
      console.log('\nDocument statuses:');
      const statusCounts = {};
      documents.forEach(doc => {
        const status = doc.status || 'no_status';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      console.log(statusCounts);
      
      // Try to fetch profiles for these documents
      const userIds = [...new Set(documents.map(doc => doc.user_id))];
      console.log('\nUser IDs with documents:', userIds);
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, vehicle_plate')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError.message);
        } else {
          console.log(`\nFound ${profiles?.length || 0} matching profiles`);
          if (profiles?.length > 0) {
            console.log('Sample profile:');
            console.log(JSON.stringify(profiles[0], null, 2));
          }
        }
      }
    }
  } catch (error) {
    console.error('Error testing documents query:', error.message);
  }
}

async function checkProfilesTable() {
  console.log('\n=== Checking Profiles Table ===\n');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('Error checking profiles:', error.message);
    } else {
      console.log(`Found ${profiles?.length || 0} profiles`);
      if (profiles?.length > 0) {
        console.log('\nSample profile:');
        console.log(JSON.stringify(profiles[0], null, 2));
      }
    }
  } catch (error) {
    console.error('Error checking profiles table:', error.message);
  }
}

// Run the checks
async function main() {
  await checkDocumentsTable();
  await checkProfilesTable();
  process.exit(0);
}

main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
