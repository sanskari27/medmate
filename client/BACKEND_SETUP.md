# Backend Setup Guide

## Environment Variables

Create a `.env.local` file in the client directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/medmate

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret
```

## Google OAuth Setup

1. **Create a Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API

2. **Configure OAuth Consent Screen**:

   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add your domain to authorized domains

3. **Create OAuth 2.0 Credentials**:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized JavaScript origins: `http://localhost:3001`
   - Add authorized redirect URIs: `http://localhost:3001`
   - Copy the Client ID and Client Secret

4. **Update Environment Variables**:
   - Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with your Client ID
   - Add `GOOGLE_CLIENT_SECRET` with your Client Secret

## Email Setup (Resend)

1. **Sign up for Resend**:

   - Go to [resend.com](https://resend.com)
   - Create a free account
   - Get your API key from the dashboard

2. **Verify your domain** (optional but recommended):

   - Add your domain to Resend
   - Update the `from` email in `src/lib/email.ts` to use your domain
   - Example: `from: 'MedMate <noreply@yourdomain.com>'`

3. **For testing**:
   - You can use the default `noreply@medmate.com` sender
   - Resend will handle the delivery automatically

## MongoDB Setup

1. Install MongoDB locally or use MongoDB Atlas
2. For local installation:

   ```bash
   # macOS with Homebrew
   brew install mongodb-community
   brew services start mongodb-community

   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## API Endpoints

### Authentication Endpoints

1. **POST /api/auth/send-otp**

   - Send OTP to user's email
   - Body: `{ email, phoneNumber, name }`

2. **POST /api/auth/verify-otp**

   - Verify OTP and login user
   - Body: `{ email, otp }`

3. **POST /api/auth/logout**

   - Logout user and clear cookies

4. **GET /api/auth/me**

   - Get current authenticated user

5. **POST /api/auth/google**

   - Google OAuth login
   - Body: `{ credential: "google-id-token" }`

## Features

- ✅ OTP-based authentication
- ✅ Google OAuth login
- ✅ Email verification using Resend
- ✅ JWT token management
- ✅ Secure HTTP-only cookies
- ✅ User schema with email, phone, name, provider
- ✅ Toast notifications
- ✅ Form validation
- ✅ Loading states

## Usage

1. Start the development server:

   ```bash
   npm run dev
   ```

2. The auth dialog will now:
   - Collect user details (name, email, phone)
   - Send OTP via email using Resend
   - Verify OTP and authenticate user
   - Show appropriate toast notifications
   - Handle loading states and errors
