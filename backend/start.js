const path = require('path');

// Import and start the main application
const app = require('./dist/server').default || require('./dist/server');

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'production'} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend served from: http://localhost:${PORT}`);
});
