import { NextResponse } from 'next/server'
import { getPublicSupabase } from '@/lib/supabase'
import { cleanText } from '@/lib/normalize'

export const runtime = 'nodejs'

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, private, max-age=0, must-revalidate',
      'Pragma': 'no-cache'
    }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const raw = cleanText(body?.query)

    if (raw.length < 2 || raw.length > 80) {
      return json({ error:'Invalid search value.' }, 400)
    }

    const { data, error } = await getPublicSupabase().rpc('search_students', { search_term: raw })
    if (error) throw error

    return json({ results:data ?? [] })
  } catch (error) {
    console.error('search_error', error)
    return json({ error:'Unable to search right now.' }, 500)
  }
}
