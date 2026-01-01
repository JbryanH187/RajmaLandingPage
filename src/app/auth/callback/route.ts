import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log('[Auth Callback] Received code:', !!code)

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                        }
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        console.log('[Auth Callback] Exchange result:', {
            success: !!data.session,
            error: error?.message
        })

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        // Log the error but still redirect to home - the client will pick up the session
        console.error('[Auth Callback] Error:', error)
    }

    // Return the user to home instead of error page - session might still work
    return NextResponse.redirect(`${origin}/`)
}
