// ============================================================
// MULTI-TENANT SECURITY TEST SUITE
// Use this to verify data isolation after signup
// ============================================================

const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testMultiTenantSecurity() {
  console.log('🔒 MULTI-TENANT SECURITY TEST\n');
  
  let company1Token, company2Token;
  let company1User, company2User;
  
  try {
    // ============================================================
    // TEST 1: Sign up two different companies
    // ============================================================
    console.log('1️⃣  Testing company registration...');
    
    const company1Signup = await axios.post(`${API_URL}/auth/register`, {
      email: `test1_${Date.now()}@test.com`,
      password: 'password123',
      company_name: 'Test Company 1'
    });
    
    company1Token = company1Signup.data.token;
    company1User = company1Signup.data.user;
    console.log(`   ✅ Company 1 created: ${company1User.email} (company_id: ${company1User.company_id})`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const company2Signup = await axios.post(`${API_URL}/auth/register`, {
      email: `test2_${Date.now()}@test.com`,
      password: 'password123',
      company_name: 'Test Company 2'
    });
    
    company2Token = company2Signup.data.token;
    company2User = company2Signup.data.user;
    console.log(`   ✅ Company 2 created: ${company2User.email} (company_id: ${company2User.company_id})\n`);
    
    // ============================================================
    // TEST 2: Verify each user can access their own profile
    // ============================================================
    console.log('2️⃣  Testing profile access...');
    
    const profile1 = await axios.get(`${API_URL}/me/profile`, {
      headers: { Authorization: `Bearer ${company1Token}` }
    });
    
    if (profile1.data.company_id === company1User.company_id) {
      console.log('   ✅ Company 1 user can access their own profile');
    } else {
      console.log('   ❌ ERROR: Company 1 profile mismatch!');
    }
    
    const profile2 = await axios.get(`${API_URL}/me/profile`, {
      headers: { Authorization: `Bearer ${company2Token}` }
    });
    
    if (profile2.data.company_id === company2User.company_id) {
      console.log('   ✅ Company 2 user can access their own profile\n');
    } else {
      console.log('   ❌ ERROR: Company 2 profile mismatch!\n');
    }
    
    // ============================================================
    // TEST 3: Update profile for Company 1
    // ============================================================
    console.log('3️⃣  Testing profile updates...');
    
    await axios.put(`${API_URL}/me/profile`, 
      {
        full_name: 'Company 1 Admin Updated',
        job_title: 'CEO'
      },
      {
        headers: { Authorization: `Bearer ${company1Token}` }
      }
    );
    
    console.log('   ✅ Company 1 profile updated\n');
    
    // ============================================================
    // TEST 4: Verify Company 2 CANNOT see Company 1's changes
    // ============================================================
    console.log('4️⃣  Testing data isolation...');
    
    const profile1Updated = await axios.get(`${API_URL}/me/profile`, {
      headers: { Authorization: `Bearer ${company1Token}` }
    });
    
    const profile2Check = await axios.get(`${API_URL}/me/profile`, {
      headers: { Authorization: `Bearer ${company2Token}` }
    });
    
    if (profile1Updated.data.full_name === 'Company 1 Admin Updated' &&
        profile2Check.data.full_name !== 'Company 1 Admin Updated') {
      console.log('   ✅ PASS: Company 2 cannot see Company 1 data');
      console.log(`   Company 1: ${profile1Updated.data.full_name}`);
      console.log(`   Company 2: ${profile2Check.data.full_name || '(not set)'}\n`);
    } else {
      console.log('   ❌ FAIL: Data leakage detected!\n');
    }
    
    // ============================================================
    // TEST 5: Try to access with wrong company context (should fail)
    // ============================================================
    console.log('5️⃣  Testing unauthorized cross-company access...');
    
    try {
      // Try to access Company 1's profile using Company 2's token with wrong X-Company-Id
      await axios.get(`${API_URL}/me/profile`, {
        headers: { 
          Authorization: `Bearer ${company2Token}`,
          'X-Company-Id': company1User.company_id.toString()
        }
      });
      console.log('   ❌ SECURITY ISSUE: Cross-company access allowed!\n');
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
        console.log('   ✅ PASS: Cross-company access properly blocked\n');
      } else {
        console.log(`   ⚠️  Unexpected error: ${err.message}\n`);
      }
    }
    
    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SECURITY TEST COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Company 1: ${company1User.email} (ID: ${company1User.company_id})`);
    console.log(`Company 2: ${company2User.email} (ID: ${company2User.company_id})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMultiTenantSecurity();
