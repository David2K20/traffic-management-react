// Utility to set up Row-Level Security policies for database tables
import { supabase } from '../lib/supabase';

// SQL statements for setting up table RLS policies
const RLS_POLICIES = {
  // Profiles table policies
  profiles: [
    `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
    
    `DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;`,
    `DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;`,
    
    `CREATE POLICY "Users can view their own profile" ON public.profiles
     FOR SELECT TO authenticated
     USING (auth.uid() = id);`,
     
    `CREATE POLICY "Users can create their own profile" ON public.profiles
     FOR INSERT TO authenticated
     WITH CHECK (auth.uid() = id);`,
     
    `CREATE POLICY "Users can update their own profile" ON public.profiles
     FOR UPDATE TO authenticated
     USING (auth.uid() = id);`,
     
    `CREATE POLICY "Admins can view all profiles" ON public.profiles
     FOR SELECT TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     );`,
     
    `CREATE POLICY "Admins can manage all profiles" ON public.profiles
     FOR ALL TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     )
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     );`
  ],

  // Documents table policies  
  documents: [
    `ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;`,
    
    `DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;`,
    `DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;`,
    `DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;`,
    `DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;`,
    `DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;`,
    
    `CREATE POLICY "Users can view their own documents" ON public.documents
     FOR SELECT TO authenticated
     USING (auth.uid() = user_id);`,
     
    `CREATE POLICY "Users can create their own documents" ON public.documents
     FOR INSERT TO authenticated
     WITH CHECK (auth.uid() = user_id);`,
     
    `CREATE POLICY "Users can update their own documents" ON public.documents
     FOR UPDATE TO authenticated
     USING (auth.uid() = user_id);`,
     
    `CREATE POLICY "Admins can view all documents" ON public.documents
     FOR SELECT TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     );`,
     
    `CREATE POLICY "Admins can manage all documents" ON public.documents
     FOR ALL TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     )
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     );`
  ],

  // Complaints table policies
  complaints: [
    `ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;`,
    
    `DROP POLICY IF EXISTS "Users can view relevant complaints" ON public.complaints;`,
    `DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;`,
    `DROP POLICY IF EXISTS "Users can update their own complaints" ON public.complaints;`,
    `DROP POLICY IF EXISTS "Admins can manage all complaints" ON public.complaints;`,
    
    `CREATE POLICY "Users can view relevant complaints" ON public.complaints
     FOR SELECT TO authenticated
     USING (
       auth.uid() = reported_by OR 
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND 
         (profiles.vehicle_plate = offender_plate OR profiles.role = 'admin')
       )
     );`,
     
    `CREATE POLICY "Users can create complaints" ON public.complaints
     FOR INSERT TO authenticated
     WITH CHECK (auth.uid() = reported_by);`,
     
    `CREATE POLICY "Users can update their own complaints" ON public.complaints
     FOR UPDATE TO authenticated
     USING (auth.uid() = reported_by);`,
     
    `CREATE POLICY "Admins can manage all complaints" ON public.complaints
     FOR ALL TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     )
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
       )
     );`
  ]
};

export const setupDatabasePolicies = async () => {
  console.log('Setting up database RLS policies...');
  
  try {
    const results = [];
    
    // Setup policies for each table
    for (const [tableName, policies] of Object.entries(RLS_POLICIES)) {
      console.log(`Setting up ${tableName} table policies...`);
      
      for (const policy of policies) {
        try {
          console.log(`Executing: ${policy.split('\\n')[0]}...`);
          const { error } = await supabase.rpc('execute_sql', { sql: policy });
          
          if (error) {
            console.error(`Error setting up ${tableName} policy:`, error.message);
            results.push({ table: tableName, policy, success: false, error: error.message });
          } else {
            results.push({ table: tableName, policy, success: true });
          }
        } catch (err) {
          console.error(`Error executing ${tableName} policy:`, err.message);
          results.push({ table: tableName, policy, success: false, error: err.message });
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`Database RLS setup completed: ${successCount}/${totalCount} policies applied`);
    
    if (successCount < totalCount) {
      console.log('Some policies failed to apply. You may need to run the SQL script manually.');
      console.log('Check setup-complete-rls.sql for the complete script.');
    }
    
    return {
      success: successCount === totalCount,
      results,
      message: `Applied ${successCount}/${totalCount} database policies`
    };
    
  } catch (error) {
    console.error('Error setting up database policies:', error);
    return {
      success: false,
      message: `Error setting up database policies: ${error.message}`
    };
  }
};

export const printDatabasePolicyInstructions = () => {
  console.log(`
=== DATABASE RLS POLICY SETUP REQUIRED ===

Your Supabase database needs Row-Level Security policies to allow users to:
1. Create and manage their own profiles
2. Upload and manage their own documents  
3. Create and view relevant complaints

To fix this:

OPTION 1 - Run the complete SQL script:
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and run the contents of: setup-complete-rls.sql

OPTION 2 - Let the app attempt automatic setup:
1. The app will try to set up policies automatically
2. If it fails, you'll need to use Option 1

This is a one-time setup that's required for the app to function properly.
`);
};
