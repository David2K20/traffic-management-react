// Authentication and database debugging script
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

async function checkAuthUsers() {
  console.log('=== Checking Auth Users ===\n');
  
  try {
    // Try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError.message);
    } else if (session) {
      console.log('Current session exists for user:', session.user.email);
      console.log('User ID:', session.user.id);
      console.log('Email confirmed:', session.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('User metadata:', JSON.stringify(session.user.user_metadata, null, 2));
      
      // Check if this user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.log('\\nProfile error:', profileError.message);
        if (profileError.code === 'PGRST116') {
          console.log('No profile found for this user in profiles table');
        }
      } else {
        console.log('\\nUser profile found:');
        console.log(JSON.stringify(profile, null, 2));
      }
    } else {
      console.log('No current session - user not logged in');
    }
  } catch (error) {
    console.error('Error checking auth users:', error.message);
  }
}

async function checkTableStructures() {
  console.log('\\n=== Checking Table Structures ===\\n');
  
  // Check if documents table exists and what columns it has
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .limit(0); // Just get structure, no data
    
    if (error) {
      console.log('Documents table error:', error.message);
      if (error.code === '42P01') {
        console.log('Documents table does not exist!');
      }
    } else {
      console.log('Documents table exists and is accessible');
    }
  } catch (error) {
    console.error('Error checking documents table:', error.message);
  }
  
  // Check profiles table
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(0); // Just get structure, no data
    
    if (error) {
      console.log('Profiles table error:', error.message);
      if (error.code === '42P01') {
        console.log('Profiles table does not exist!');
      }
    } else {
      console.log('Profiles table exists and is accessible');
    }
  } catch (error) {
    console.error('Error checking profiles table:', error.message);
  }
}

async function testDocumentInsert() {
  console.log('\\n=== Testing Document Insert ===\\n');
  
  try {
    // First check if we have a current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session - cannot test document insert');
      return;
    }
    
    console.log('Testing document insert for user:', session.user.id);
    
    // Try a simple document insert
    const testDoc = {
      user_id: session.user.id,
      document_type: 'license',
      file_name: 'test_license.pdf',
      file_url: 'https://example.com/test.pdf',
      expiry_date: '2025-12-31',
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('documents')
      .insert(testDoc)
      .select()
      .single();
    
    if (error) {
      console.error('Document insert failed:', error.message);
      console.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Test document inserted successfully:');
      console.log(JSON.stringify(data, null, 2));
      
      // Clean up - delete the test document
      await supabase
        .from('documents')
        .delete()
        .eq('id', data.id);
      console.log('\\nTest document cleaned up');
    }
  } catch (error) {
    console.error('Error testing document insert:', error.message);
  }
}

// Run all checks
async function main() {
  await checkAuthUsers();
  await checkTableStructures();
  await testDocumentInsert();
  process.exit(0);
}

main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
