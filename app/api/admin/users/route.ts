import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

// Admin client with service role key — bypasses RLS, can manage auth users
function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

// Verify the requester is an authenticated ADMIN
async function verifyAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401, message: 'Nao autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    return { ok: false, status: 403, message: 'Apenas administradores podem gerir utilizadores' }
  }

  return { ok: true, status: 200, message: 'ok' }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const { email, password, full_name, role, team_id } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password e nome sao obrigatorios' },
        { status: 400 },
      )
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'A password deve ter pelo menos 4 caracteres' },
        { status: 400 },
      )
    }

    const admin = getAdminClient()

    // Create the auth user with email confirmed so they can log in immediately
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: role || 'VENDEDOR' },
    })

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message || 'Erro ao criar utilizador' },
        { status: 400 },
      )
    }

    // Create the profile row
    const { error: profileError } = await admin.from('profiles').upsert({
      id: created.user.id,
      full_name,
      email,
      role: role || 'VENDEDOR',
      team_id: team_id || null,
      active: true,
    })

    if (profileError) {
      // Roll back the auth user if the profile insert failed
      await admin.auth.admin.deleteUser(created.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, id: created.user.id })
  } catch (error: any) {
    console.error('[v0] Create user error:', error)
    return NextResponse.json({ error: error.message || 'Erro inesperado' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const { id, password } = await request.json()

    if (!id || !password) {
      return NextResponse.json({ error: 'ID e password sao obrigatorios' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'A password deve ter pelo menos 4 caracteres' },
        { status: 400 },
      )
    }

    const admin = getAdminClient()
    const { error } = await admin.auth.admin.updateUserById(id, { password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Update password error:', error)
    return NextResponse.json({ error: error.message || 'Erro inesperado' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID e obrigatorio' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { error } = await admin.auth.admin.deleteUser(id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Delete user error:', error)
    return NextResponse.json({ error: error.message || 'Erro inesperado' }, { status: 500 })
  }
}
