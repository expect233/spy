#!/usr/bin/env node

// Simple script to test the API endpoints
import http from 'http';

const API_BASE = 'http://localhost:3000/api';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testCreateRoom() {
  console.log('🧪 Testing create room API...');
  
  try {
    const response = await makeRequest('POST', '/rooms', {
      hostName: 'TestHost'
    });
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200 && response.data.code) {
      console.log('✅ Create room test PASSED');
      return response.data;
    } else {
      console.log('❌ Create room test FAILED');
      return null;
    }
  } catch (error) {
    console.log('❌ Create room test ERROR:', error.message);
    return null;
  }
}

async function testJoinRoom(roomCode) {
  console.log('🧪 Testing join room API...');
  
  try {
    const response = await makeRequest('POST', `/rooms/${roomCode}/join`, {
      name: 'TestPlayer'
    });
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200 && response.data.playerId) {
      console.log('✅ Join room test PASSED');
      return response.data;
    } else {
      console.log('❌ Join room test FAILED');
      return null;
    }
  } catch (error) {
    console.log('❌ Join room test ERROR:', error.message);
    return null;
  }
}

async function testGetRoom(roomCode) {
  console.log('🧪 Testing get room API...');
  
  try {
    const response = await makeRequest('GET', `/rooms/${roomCode}`);
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200 && response.data.code === roomCode) {
      console.log('✅ Get room test PASSED');
      return response.data;
    } else {
      console.log('❌ Get room test FAILED');
      return null;
    }
  } catch (error) {
    console.log('❌ Get room test ERROR:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  // Test create room
  const createResult = await testCreateRoom();
  if (!createResult) {
    console.log('\n❌ Tests failed at create room step');
    return;
  }
  
  console.log('\n');
  
  // Test join room
  const joinResult = await testJoinRoom(createResult.code);
  if (!joinResult) {
    console.log('\n❌ Tests failed at join room step');
    return;
  }
  
  console.log('\n');
  
  // Test get room
  const getResult = await testGetRoom(createResult.code);
  if (!getResult) {
    console.log('\n❌ Tests failed at get room step');
    return;
  }
  
  console.log('\n✅ All API tests PASSED!');
  console.log(`\n📊 Test Summary:`);
  console.log(`- Room Code: ${createResult.code}`);
  console.log(`- Host Token: ${createResult.hostToken.substring(0, 8)}...`);
  console.log(`- Player ID: ${joinResult.playerId}`);
  console.log(`- Player Token: ${joinResult.token.substring(0, 8)}...`);
  console.log(`- Players in room: ${getResult.players.length}`);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await makeRequest('GET', '/rooms/TEST');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if Next.js server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Next.js server is not running on localhost:3000');
    console.log('💡 Please run: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  await runTests();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
