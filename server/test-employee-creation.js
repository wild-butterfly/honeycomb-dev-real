// ============================================================
// TEST: Admin Creates Employee Accounts
// ============================================================

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testEmployeeCreation() {
  console.log('🧪 TESTING: Admin Creates Employee Accounts\n');
  
  try {
    // ============================================================
    // STEP 1: Register a new company (becomes admin)
    // ============================================================
    console.log('1️⃣  Registering new company...');
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: `testadmin_${Date.now()}@test.com`,
      password: 'admin123',
      company_name: 'Test Security Co'
    });
    
    const adminToken = registerResponse.data.token;
    const admin = registerResponse.data.user;
    
    console.log(`   ✅ Admin created: ${admin.email} (company_id: ${admin.company_id})\n`);
    
    // ============================================================
    // STEP 2: Admin creates employee account
    // ============================================================
    console.log('2️⃣  Admin creating employee account...');
    
    const createEmployeeResponse = await axios.post(
      `${API_URL}/users/employees`,
      {
        email: `employee1_${Date.now()}@test.com`,
        password: 'emp123',
        full_name: 'Test Employee',
        phone: '+1234567890',
        job_title: 'Technician'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    
    const employee = createEmployeeResponse.data.employee;
    
    console.log(`   ✅ Employee created: ${employee.email}`);
    console.log(`      Company ID: ${employee.company_id}`);
    console.log(`      Role: ${employee.role}`);
    console.log(`      Job Title: ${employee.job_title}\n`);
    
    // ============================================================
    // STEP 3: Verify employee can login
    // ============================================================
    console.log('3️⃣  Testing employee login...');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: employee.email,
      password: 'emp123'
    });
    
    const employeeToken = loginResponse.data.token;
    const loggedInEmployee = loginResponse.data.user;
    
    console.log(`   ✅ Employee logged in successfully`);
    console.log(`      User ID: ${loggedInEmployee.id}`);
    console.log(`      Company ID: ${loggedInEmployee.company_id}\n`);
    
    // ============================================================
    // STEP 4: Verify company_id matches
    // ============================================================
    console.log('4️⃣  Verifying data isolation...');
    
    if (admin.company_id === employee.company_id) {
      console.log(`   ✅ PASS: Both belong to same company (${admin.company_id})`);
    } else {
      console.log(`   ❌ FAIL: Company mismatch!`);
      console.log(`      Admin: ${admin.company_id}, Employee: ${employee.company_id}`);
    }
    
    // ============================================================
    // STEP 5: Admin lists all employees
    // ============================================================
    console.log('\n5️⃣  Admin listing all employees...');
    
    const employeeListResponse = await axios.get(
      `${API_URL}/users/employees`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    
    const employees = employeeListResponse.data.employees;
    
    console.log(`   ✅ Found ${employees.length} employee(s):`);
    employees.forEach(emp => {
      console.log(`      - ${emp.full_name} (${emp.email}) - ${emp.job_title}`);
    });
    
    // ============================================================
    // STEP 6: Try cross-company access (security test)
    // ============================================================
    console.log('\n6️⃣  Testing cross-company security...');
    
    // Register second company
    const company2Response = await axios.post(`${API_URL}/auth/register`, {
      email: `testadmin2_${Date.now()}@test.com`,
      password: 'admin456',
      company_name: 'Another Company'
    });
    
    const admin2Token = company2Response.data.token;
    const admin2 = company2Response.data.user;
    
    // Try to create employee in company 1 using admin 2's token
    try {
      await axios.post(
        `${API_URL}/users/employees`,
        {
          email: `hacker_${Date.now()}@test.com`,
          password: 'hack123',
          full_name: 'Hacker Attempt'
        },
        {
          headers: { 
            Authorization: `Bearer ${admin2Token}`,
            'X-Company-Id': admin.company_id.toString()  // Try to access company 1
          }
        }
      );
      
      console.log('   ❌ SECURITY ISSUE: Cross-company access allowed!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ PASS: Cross-company employee creation blocked');
      } else {
        console.log(`   ⚠️  Unexpected error: ${err.message}`);
      }
    }
    
    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ EMPLOYEE CREATION TEST COMPLETED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Company 1: ${admin.email} (ID: ${admin.company_id})`);
    console.log(`Employee: ${employee.email} (ID: ${employee.id})`);
    console.log(`Company 2: ${admin2.email} (ID: ${admin2.company_id})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmployeeCreation();
