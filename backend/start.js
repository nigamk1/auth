const express = require('express');
const path = require('path');

// Import and start the main application
const mainApp = require('./dist/server').default;

const PORT = process.env.PORT || 10000;

mainApp.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend served from: http://localhost:${PORT}`);
});
