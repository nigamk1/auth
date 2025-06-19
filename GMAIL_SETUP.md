# Gmail App Password Setup Guide

This guide will help you set up Gmail App Passwords for the email functionality in the Auth System.

## What is a Gmail App Password?

When you have 2-factor authentication (2FA) enabled on your Gmail account (which is recommended), you cannot use your regular Gmail password for third-party applications. Instead, you need to generate an "App Password" - a 16-character password specifically for applications.

## Prerequisites

1. **2-Factor Authentication must be enabled** on your Google account
2. **Less secure app access** must be disabled (this is the default and recommended setting)

## Step-by-Step Setup

### Step 1: Enable 2-Factor Authentication (if not already enabled)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the setup process to enable 2FA

### Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Scroll down and click on "App passwords"
4. You may need to sign in again
5. In the "Select app" dropdown, choose "Mail"
6. In the "Select device" dropdown, choose "Other (custom name)"
7. Enter a name like "Auth System Backend" or "Node.js App"
8. Click "Generate"
9. **Copy the 16-character password** that appears (you won't be able to see it again)

### Step 3: Configure Environment Variables

1. Open your `.env` file in the backend directory
2. Update the email configuration with your Gmail credentials:

```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcd-efgh-ijkl-mnop  # The 16-character app password
EMAIL_FROM=your-email@gmail.com
```

**Important:** 
- Use `EMAIL_APP_PASSWORD` instead of `EMAIL_PASSWORD`
- The app password should be 16 characters (may include spaces or dashes)
- Remove any spaces or dashes when entering the password

### Step 4: Test the Configuration

After updating your environment variables:

1. Restart your backend server
2. Try the "Forgot Password" functionality
3. Check the logs for any errors

## Troubleshooting

### Error: "Application-specific password required"
- This means you're still using your regular Gmail password instead of an App Password
- Make sure you've generated an App Password and are using it in `EMAIL_APP_PASSWORD`

### Error: "Invalid credentials"
- Double-check your email address in `EMAIL_USER`
- Verify the App Password is correct (no spaces or dashes)
- Make sure 2FA is enabled on your Google account

### Error: "Less secure app access"
- This error shouldn't occur with App Passwords
- If you see this, make sure you're using the Gmail service configuration in the code

### Still having issues?
- Try regenerating a new App Password
- Make sure the Gmail account is active and accessible
- Check that your Google account doesn't have any security restrictions

## Alternative Email Providers

If you prefer not to use Gmail, you can configure other SMTP providers:

### Outlook/Hotmail
```bash
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo Mail
```bash
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password  # Yahoo also requires app passwords
```

### Custom SMTP
```bash
EMAIL_SERVICE=smtp
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

## Security Best Practices

1. **Never commit your .env file** to version control
2. **Use App Passwords** instead of regular passwords
3. **Regularly rotate** your App Passwords
4. **Revoke unused** App Passwords from your Google Account
5. **Monitor email activity** in your Google Account security dashboard

## Testing Email Functionality

You can test your email configuration by:

1. Using the forgot password feature in the frontend
2. Checking the backend logs for success/error messages
3. Looking for the email in your inbox (and spam folder)

## Support

If you continue to have issues after following this guide:

1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a different email address
4. Consider using a different email provider temporarily

Remember: Gmail App Passwords are the secure and recommended way to authenticate third-party applications with Gmail when 2FA is enabled.
