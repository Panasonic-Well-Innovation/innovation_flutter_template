# Supabase Configuration for Apple Sign In

Follow these steps in the Supabase dashboard to enable Apple Sign In:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find Apple in the list of OAuth providers and enable it
4. You'll need the following from Apple Developer account:
   - Service ID
   - Team ID
   - Key ID
   - Private Key

## Apple Developer Configuration
1. Log in to the [Apple Developer Portal](https://developer.apple.com)
2. Go to Certificates, Identifiers & Profiles → Identifiers
3. Register an App ID if you don't have one, enable "Sign In with Apple"
4. Create a Services ID for web authentication
5. Configure domains and redirect URLs in the Services ID
   - Add the Supabase redirect URL: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
6. Generate a private key for Sign In with Apple
7. Note your Team ID, Service ID, Key ID, and download the private key

Paste these details in the Supabase dashboard.
