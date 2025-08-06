# OAuth Setup Guide for E-Marketing App

This guide will help you set up third-party authentication (Google, Facebook, Apple) with Supabase for your E-Marketing app.

## Prerequisites
- Supabase project set up
- Access to your Supabase dashboard
- Developer accounts for Google, Facebook, and/or Apple

## 1. Configure OAuth Providers in Supabase

### Step 1: Access Authentication Settings
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication > Providers**

### Step 2: Configure Redirect URLs
In the **General Settings** section, add these redirect URLs:

**Site URL:** 
```
myapp://
```

**Additional Redirect URLs:**
```
myapp://auth/callback
exp://localhost:8081/--/auth/callback
exp://localhost:8082/--/auth/callback
```

## 2. Google OAuth Setup

### Step 1: Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials > Create Credentials > OAuth 2.0 Client IDs**

### Step 2: Configure OAuth Client
**Application Type:** Web application

**Authorized redirect URIs:**
```
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
```
Replace `YOUR_SUPABASE_PROJECT_ID` with your actual Supabase project ID.

### Step 3: Configure in Supabase
1. In Supabase Dashboard, go to **Authentication > Providers**
2. Enable **Google**
3. Add your **Client ID** and **Client Secret**
4. Click **Save**

## 3. Facebook OAuth Setup

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add **Facebook Login** product

### Step 2: Configure OAuth Settings
**Valid OAuth Redirect URIs:**
```
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
```

### Step 3: Configure in Supabase
1. Enable **Facebook** in Supabase
2. Add your **App ID** and **App Secret**
3. Click **Save**

## 4. Apple OAuth Setup

### Step 1: Configure Apple Sign In
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Create an App ID with **Sign In with Apple** capability
3. Create a **Services ID**

### Step 2: Configure Return URLs
**Return URLs:**
```
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
```

### Step 3: Configure in Supabase
1. Enable **Apple** in Supabase
2. Add your **Services ID**, **Team ID**, **Key ID**, and **Private Key**
3. Click **Save**

## 5. Testing OAuth

### Test in Development
1. Run your app: `npm run dev`
2. Navigate to login screen
3. Try each OAuth provider
4. Check console for any errors

### Common Issues & Solutions

**Issue:** "Invalid redirect URI"
**Solution:** Ensure all redirect URLs are correctly configured in both the provider (Google/Facebook/Apple) and Supabase.

**Issue:** "OAuth cancelled by user"
**Solution:** This is normal when users cancel the OAuth flow.

**Issue:** Deep linking not working
**Solution:** Make sure your app.json scheme is correctly configured and matches the redirect URLs.

## 6. Production Configuration

For production apps, you'll need to:

1. **Update redirect URLs** to use your production domain
2. **Configure iOS/Android specific settings** in respective developer consoles
3. **Test on actual devices** as OAuth behavior can differ from simulators

## Environment Variables

Make sure your `.env` file contains:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Troubleshooting

If OAuth is still not working:

1. **Check Supabase logs**: Authentication > Users > Logs
2. **Verify provider configuration**: Double-check all IDs and secrets
3. **Test redirect URLs**: Ensure they match exactly
4. **Check mobile platform requirements**: Some providers have specific mobile app requirements

## Security Considerations

- Never expose client secrets in your app code
- Use environment variables for sensitive data
- Regularly rotate OAuth credentials
- Monitor authentication logs for suspicious activity

---

**Need Help?**
- Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- Review [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
- Open an issue if problems persist
