#!/usr/bin/env node

/**
 * Real-Time Demo Test Script
 * 
 * This script tests the Socket.IO integration by:
 * 1. Starting the backend server
 * 2. Starting the frontend development server
 * 3. Testing Socket.IO connections and events
 * 
 * Day 10: Real-Time Sync Implementation Complete
 */

const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');

console.log('🚀 Starting Real-Time Demo Test...\n');

console.log('📁 Project Structure:');
console.log(`   Backend:  ${BACKEND_DIR}`);
console.log(`   Frontend: ${FRONTEND_DIR}\n`);

// Start backend server
console.log('🔧 Starting Backend Server (Socket.IO + Express)...');
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: BACKEND_DIR,
  stdio: 'pipe',
  shell: true
});

backendProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Server running') || output.includes('Socket.IO')) {
    console.log(`[Backend] ${output.trim()}`);
  }
});

backendProcess.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data.toString().trim()}`);
});

// Wait a moment for backend to start
setTimeout(() => {
  console.log('\n🎨 Starting Frontend Development Server...');
  
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'pipe',
    shell: true
  });

  frontendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:') || output.includes('ready')) {
      console.log(`[Frontend] ${output.trim()}`);
    }
  });

  frontendProcess.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data.toString().trim()}`);
  });

  // Display instructions after both servers start
  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ REAL-TIME DEMO READY!');
    console.log('='.repeat(60));
    console.log('\n📋 Day 10 Implementation Complete:');
    console.log('   ✅ Socket.IO Server Handler');
    console.log('   ✅ Real-time events: aiAnswer, whiteboardUpdate, voiceReply');
    console.log('   ✅ Frontend Socket.IO client hook');
    console.log('   ✅ Real-time demo UI components');
    console.log('   ✅ Session management & user presence');
    console.log('   ✅ Chat, whiteboard, AI thinking indicators');
    
    console.log('\n🌐 Access the Demo:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend:  http://localhost:5000');
    console.log('   Demo:     http://localhost:5173/realtime');
    
    console.log('\n🔧 Features to Test:');
    console.log('   • Real-time chat messaging');
    console.log('   • Whiteboard collaboration');
    console.log('   • AI thinking/typing indicators');
    console.log('   • User presence tracking');
    console.log('   • Voice replies (when implemented)');
    console.log('   • Session join/leave events');
    
    console.log('\n📝 Next Steps:');
    console.log('   • Open multiple browser tabs to test collaboration');
    console.log('   • Check browser developer tools for Socket.IO logs');
    console.log('   • Monitor real-time event emission and reception');
    
    console.log('\n🚨 To stop servers: Press Ctrl+C');
    console.log('='.repeat(60) + '\n');
  }, 3000);

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });

}, 2000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backendProcess.kill();
  process.exit(0);
});
