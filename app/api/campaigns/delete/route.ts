import { del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Check if user has permission (ADMIN or CHEFE_EQUIPA)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'CHEFE_EQUIPA'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para eliminar ficheiros' }, { status: 403 })
    }

    const { materialId } = await request.json()

    if (!materialId) {
      return NextResponse.json({ error: 'ID do material não fornecido' }, { status: 400 })
    }

    // Get the material to get the file URL
    const { data: material, error: fetchError } = await supabase
      .from('campaign_materials')
      .select('file_url')
      .eq('id', materialId)
      .single()

    if (fetchError || !material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    // Delete from Vercel Blob
    await del(material.file_url)

    // Delete from database
    const { error: deleteError } = await supabase
      .from('campaign_materials')
      .delete()
      .eq('id', materialId)

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao eliminar do banco de dados' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Erro ao eliminar ficheiro' }, { status: 500 })
  }
}
