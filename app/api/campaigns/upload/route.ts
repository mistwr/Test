import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Sem permissão para carregar ficheiros' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const campaignId = formData.get('campaignId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string || 'geral'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro fornecido' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de ficheiro não permitido. Use PDF, imagens ou documentos Office.' 
      }, { status: 400 })
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Ficheiro muito grande. Máximo 10MB.' 
      }, { status: 400 })
    }

    // Upload to Vercel Blob (public access for easier PDF preview)
    const blob = await put(`campaigns/${campaignId || 'general'}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    // Save to database
    const { data: material, error: dbError } = await supabase
      .from('campaign_materials')
      .insert({
        campaign_id: campaignId || null,
        title: title || file.name,
        description: description || null,
        file_url: blob.url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        category,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Erro ao guardar no banco de dados' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      material,
      url: blob.url 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro ao carregar ficheiro' }, { status: 500 })
  }
}
