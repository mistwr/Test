import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { materialId } = await request.json()

    if (!materialId) {
      return NextResponse.json({ error: 'ID do material não fornecido' }, { status: 400 })
    }

    // Increment download count
    const { error } = await supabase.rpc('increment_download_count', { 
      material_id: materialId 
    })

    // If RPC doesn't exist, fall back to manual increment
    if (error) {
      const { data: material } = await supabase
        .from('campaign_materials')
        .select('download_count')
        .eq('id', materialId)
        .single()

      if (material) {
        await supabase
          .from('campaign_materials')
          .update({ download_count: (material.download_count || 0) + 1 })
          .eq('id', materialId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Download tracking error:', error)
    return NextResponse.json({ error: 'Erro ao registar download' }, { status: 500 })
  }
}
