const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'Test123456'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.accessToken;
    console.log('Access token received:', token.substring(0, 20) + '...\n');

    // Test sessions endpoint
    console.log('2. Testing sessions endpoint...');
    const sessionsResponse = await axios.get(`${BASE_URL}/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Sessions endpoint accessible');
    console.log('Current sessions:', sessionsResponse.data.data.length, '\n');

    // Test session creation
    console.log('3. Testing session creation...');
    const createResponse = await axios.post(`${BASE_URL}/sessions`, {
      title: 'Test Learning Session',
      subject: 'Mathematics',
      language: 'en',
      difficulty: 'beginner'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Session creation successful');
    console.log('Created session ID:', createResponse.data.data.id, '\n');
    
    console.log('🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPI();
