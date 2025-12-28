import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Helper to get Supabase Server Client
async function getSupabaseServer() {
    const cookieStore = await cookies()
    return createServerClient(
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
                        // Ignored
                    }
                },
            },
        }
    )
}

export async function GET() {
    try {
        const supabase = await getSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) {
            return NextResponse.json({ error: 'Error fetching profile', details: error }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await getSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized', details: authError }, { status: 401 })
        }

        const body = await request.json()

        // Explicitly map allowed fields (User preference)
        const updates: any = {
            updated_at: new Date().toISOString(),
            // CRITICAL FIX: Inject email from session so 'upsert' works on new rows
            email: user.email,
        }

        // Only add fields if they are present in the request
        if (body.full_name !== undefined) updates.full_name = body.full_name
        if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url
        if (body.phone !== undefined) updates.phone = body.phone
        if (body.default_address !== undefined) updates.default_address = body.default_address

        // Perform Upsert
        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...updates })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: 'Error updating profile', details: error }, { status: 500 })
        }

        return NextResponse.json({ data })

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 })
    }
}
