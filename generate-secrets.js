// Generate secure JWT secrets for production deployment
const crypto = require('crypto');

console.log('🔐 Generating secure JWT secrets for production deployment...\n');

console.log('Copy these environment variables to your Vercel backend project:\n');

console.log('JWT_ACCESS_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('PASSWORD_RESET_SECRET=' + crypto.randomBytes(32).toString('hex'));

console.log('\n✨ These secrets are cryptographically secure and ready for production use!');
console.log('🔒 Keep them safe and never share them publicly.');
