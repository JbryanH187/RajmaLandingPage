
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create an authenticated Supabase Client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh Session
    const { data: { session } } = await supabase.auth.getSession()

    // 1. Protect Admin Routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!session) {
            return NextResponse.redirect(new URL('/?login=true', request.url))
        }

        // Check Profile Role via RPC (same as frontend)
        // We use the RPC to ensure consistent logic with the UI and avoid RLS/Schema issues on raw tables
        const { data, error } = await (supabase as any)
            .rpc('get_user_auth_info', { p_user_id: session.user.id })

        if (error) {
            console.error('Middleware RPC Error:', error)
            return NextResponse.redirect(new URL('/?error=server_error', request.url))
        }

        const userRole = data?.user?.role?.name

        if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
            // Redirect unauthorized users to home with error
            return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
