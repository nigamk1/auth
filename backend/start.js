const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Import and start the main application
const mainApp = require('./dist/server').default;

mainApp.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
