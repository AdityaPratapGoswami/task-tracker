import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: 'Google Auth Error: ' + error }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: 'Google credentials missing' }, { status: 500 });
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return NextResponse.json({ error: tokenData.error_description }, { status: 400 });
        }

        const accessToken = tokenData.access_token;
        const idToken = tokenData.id_token; // We might not need this if we use the verify endpoint or userinfo

        // Fetch user info from Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const userData = await userResponse.json();

        await connectToDatabase();

        let user = await User.findOne({ email: userData.email });

        if (user) {
            // User exists
            if (!user.googleId) {
                // Link Google account to existing account
                user.googleId = userData.id;
                await user.save();
            }
        } else {
            // Create new user
            user = await User.create({
                email: userData.email,
                name: userData.name,
                googleId: userData.id,
                // No password for Google users
            });
        }

        // Sign JWT
        const token = signToken({ userId: user._id.toString(), email: user.email });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        // Redirect to home
        return NextResponse.redirect(new URL('/', req.url));

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
