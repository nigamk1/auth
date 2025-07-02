# OpenAI API Setup Guide

## Issue Resolution

The backend was failing to start because the OpenAI API key was either missing or invalid. Here's how to fix it:

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. **Important**: Save this key securely - you won't be able to see it again!

## Step 2: Update Your .env File

Open `backend/.env` and replace the placeholder:

```env
# Replace this line:
OPENAI_API_KEY=your-openai-api-key-here

# With your actual key:
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

## Step 3: Test Your Setup

Run the OpenAI test script to verify everything works:

```bash
cd backend
npm run test:openai
```

This will:
- ✅ Check if your API key is present
- ✅ Verify the key format
- ✅ Test the connection to OpenAI
- ✅ Display any errors with troubleshooting tips

## Step 4: Start the Backend

Once the test passes, start your backend:

```bash
npm run dev
```

## Common Issues and Solutions

### Issue: Invalid API Key
**Error**: `invalid_api_key`
**Solution**: 
- Double-check your API key from OpenAI dashboard
- Ensure there are no extra spaces or quotes
- Make sure the key starts with `sk-`

### Issue: Insufficient Quota
**Error**: `insufficient_quota`
**Solution**: 
- Check your billing at [OpenAI Billing](https://platform.openai.com/account/billing)
- Add payment method or credits
- Consider using `gpt-3.5-turbo` instead of `gpt-4` (cheaper)

### Issue: Rate Limit Exceeded
**Error**: `rate_limit_exceeded`
**Solution**: 
- Wait a few minutes and try again
- Consider upgrading your plan for higher limits

### Issue: Model Access
**Error**: Model not found or accessible
**Solution**: 
- Change `OPENAI_MODEL=gpt-3.5-turbo` in your .env file
- GPT-4 access requires additional approval from OpenAI

## Alternative Models

If you don't have GPT-4 access, update your .env:

```env
# For GPT-3.5 (cheaper, faster, widely available)
OPENAI_MODEL=gpt-3.5-turbo

# For GPT-4 (more powerful, requires access)
OPENAI_MODEL=gpt-4-turbo-preview
```

## Next Steps

After fixing the OpenAI setup:

1. ✅ Run `npm run test:openai` to verify
2. ✅ Start backend with `npm run dev`
3. ✅ Start frontend with `npm run dev`
4. ✅ Test the tutor interface end-to-end
5. ✅ Verify all features work (text, voice, image questions)

## Support

If you continue having issues:
- Check the console logs for detailed error messages
- Verify your internet connection
- Try using `gpt-3.5-turbo` model first
- Ensure your OpenAI account has sufficient credits
