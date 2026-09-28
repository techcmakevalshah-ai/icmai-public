import { NextResponse } from 'next/server'
import { getPublicSupabase } from '@/lib/supabase'
import { cleanText } from '@/lib/normalize'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const raw = cleanText(body?.query)
    if (raw.length < 2 || raw.length > 80) return NextResponse.json({ error:'Invalid search value.' }, { status:400 })
    const { data, error } = await getPublicSupabase().rpc('search_students', { search_term: raw })
    if (error) throw error
    return NextResponse.json({ results:data ?? [] })
  } catch (error) {
    console.error('search_error', error)
    return NextResponse.json({ error:'Unable to search right now.' }, { status:500 })
  }
}
