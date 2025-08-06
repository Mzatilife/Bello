import { supabase } from './supabase';

export const debugService = {
  // Test basic connection
  testConnection: async () => {
    console.log('🔍 Testing Supabase connection...');
    try {
      const { data, error } = await supabase.from('profiles').select('count(*)').single();
      console.log('✅ Connection successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return { success: false, error };
    }
  },

  // Check current user
  checkAuth: async () => {
    console.log('🔍 Checking authentication...');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('👤 Current user:', user ? `${user.email} (${user.id})` : 'Not authenticated');
      return { user, error };
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      return { user: null, error };
    }
  },

  // Test listings query without RLS
  testListingsRaw: async () => {
    console.log('🔍 Testing raw listings query...');
    try {
      // First check if table exists and has data
      const { count, error: countError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Total listings count:', count);
      
      if (countError) {
        console.error('❌ Count query failed:', countError);
        return { success: false, error: countError };
      }

      // Get actual data
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .limit(10);

      console.log('📋 Raw listings data:', data);
      
      if (error) {
        console.error('❌ Listings query failed:', error);
        return { success: false, error };
      }

      return { success: true, data, count };
    } catch (error) {
      console.error('❌ Raw listings test failed:', error);
      return { success: false, error };
    }
  },

  // Test listings query with filters
  testListingsFiltered: async () => {
    console.log('🔍 Testing filtered listings query...');
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .limit(10);

      console.log('📋 Filtered listings (active only):', data);
      
      if (error) {
        console.error('❌ Filtered listings query failed:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Filtered listings test failed:', error);
      return { success: false, error };
    }
  },

  // Check RLS policies
  checkRLS: async () => {
    console.log('🔍 Testing RLS policies...');
    try {
      // Test as anonymous user
      const { data: anonData, error: anonError } = await supabase
        .from('listings')
        .select('id, title, status')
        .limit(5);

      console.log('👻 Anonymous user can see:', anonData?.length || 0, 'listings');
      if (anonError) console.log('👻 Anonymous error:', anonError.message);

      return { anonData, anonError };
    } catch (error) {
      console.error('❌ RLS test failed:', error);
      return { error };
    }
  },

  // Run all debug tests
  runAllTests: async () => {
    console.log('🚀 Running comprehensive debug tests...');
    
    const results = {
      connection: await debugService.testConnection(),
      auth: await debugService.checkAuth(),
      rawListings: await debugService.testListingsRaw(),
      filteredListings: await debugService.testListingsFiltered(),
      rls: await debugService.checkRLS(),
    };

    console.log('📊 Debug Results Summary:');
    console.log('- Connection:', results.connection.success ? '✅' : '❌');
    console.log('- Auth:', results.auth.user ? '✅' : '❌');
    console.log('- Raw Listings:', results.rawListings.success ? `✅ (${results.rawListings.count} total)` : '❌');
    console.log('- Filtered Listings:', results.filteredListings.success ? `✅ (${results.filteredListings.data?.length || 0} active)` : '❌');
    console.log('- RLS:', results.rls.anonData ? `✅ (${results.rls.anonData.length} visible)` : '❌');

    return results;
  }
};

export default debugService;
