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

        // Check if profile exists (to safely handle missing profiles from failed triggers)
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, role_id')
            .eq('id', user.id)
            .single()

        // If profile doesn't exist, we MUST provide mandatory role fields for the INSERT
        if (!existingProfile) {
            let roleId: string | null = null;

            // 1. Try to find existing role
            const { data: roleData } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'customer')
                .single()

            if (roleData) {
                roleId = roleData.id
            } else {
                // 2. Aggressive Self-Healing: Create role if missing
                console.warn('[API/Profile] Customer role missing. Creating it now...')
                const { data: newRole, error: roleError } = await supabase
                    .from('roles')
                    .insert({ name: 'customer', description: 'System customer' })
                    .select('id')
                    .single()

                if (newRole) roleId = newRole.id
                if (roleError) console.error('[API/Profile] Error creating role:', roleError)
            }

            if (roleId) {
                updates.role_id = roleId
            } else {
                throw new Error("Critical: Could not find or create 'customer' role.")
            }
        }

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
