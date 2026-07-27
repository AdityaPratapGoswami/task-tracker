import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    // Google matches redirect_uri as an exact string, so a trailing slash on
    // NEXT_PUBLIC_APP_URL (e.g. "https://x.vercel.app/") would otherwise
    // produce a double slash here and fail with redirect_uri_mismatch.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'Google Client ID is missing' }, { status: 500 });
    }

    const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    const responseType = 'code';

    // Construct the Google OAuth URL
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(googleAuthUrl);
}
