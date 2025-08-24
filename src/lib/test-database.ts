// Database health check functions for Admin Panel
export interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  data?: any;
}

export const runDatabaseTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // Test 1: Database Connection
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    results.push({
      test: 'Database Connection',
      success: !error,
      error: error?.message,
      data: data ? 'Connected' : null
    });
  } catch (error) {
    results.push({
      test: 'Database Connection',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: Authentication
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase.auth.getSession();
    results.push({
      test: 'Authentication Service',
      success: true,
      data: data.session ? 'Session active' : 'No session'
    });
  } catch (error) {
    results.push({
      test: 'Authentication Service',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 3: Profile Access
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    results.push({
      test: 'Profile Table Access',
      success: !error,
      error: error?.message,
      data: data ? `${data.length} profiles accessible` : null
    });
  } catch (error) {
    results.push({
      test: 'Profile Table Access',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
};

export const displayTestResults = (results: TestResult[]) => {
  const passCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const allPassed = passCount === totalCount;

  console.log(`\n🧪 Database Test Results: ${passCount}/${totalCount} passed\n`);
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.data) {
      console.log(`   Data: ${result.data}`);
    }
  });

  return { passCount, totalCount, allPassed };
};