import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Paths that do not require authentication
    const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];

    // Check if the current path is public
    if (publicPaths.some((path) => pathname.startsWith(path))) {
        // If user is already authenticated and tries to access login/signup, redirect to home
        if (token && (pathname === '/login' || pathname === '/signup')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // Allow static files and valid public API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/favicon.ico')
    ) {
        return NextResponse.next();
    }

    // For all other routes, check if token exists
    if (!token) {
        // If accessing API without token, return 401
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        // Otherwise redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> actually we want to match API routes to protect them? 
         *   No, we handled API protection in the routes themselves for finer control, 
         *   but middleware can do a blanket check.
         *   The regex below excludes _next/static, _next/image, favicon.ico
         */
        '/((?!_next|favicon.ico).*)',
    ],
};
