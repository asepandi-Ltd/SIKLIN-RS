import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize supabase client for middleware
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const publicPaths = ['/', '/login'];

  // Check if it's an API route or static asset
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Temporary bypass for the preview environment if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
     return NextResponse.next();
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    }
  });

  // Get auth token from cookies (using Supabase conventions)
  // Note: For a robust implementation, prefer @supabase/ssr package
  // Here we do a basic check on cookies to see if a session might exist
  const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.includes('sb-') && cookie.name.includes('-auth-token'));

  // Removed cookie check to allow previewing without block
  // due to AI Studio iframe restrictions where document.cookie might fail

  // For this prototype/preview with dummy auth, bypass the strict middleware redirect
  // so the user can access /dashboard even if iframe cookie restrictions block document.cookie
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
