import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase'
import { cleanDate, cleanPhone, cleanRegistration, cleanText } from '@/lib/normalize'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error:auth.message }, { status:auth.status })
  try {
    const b = await request.json()
    if (!['foundation','intermediate'].includes(b.course)) return NextResponse.json({ error:'Invalid course' }, { status:400 })
    const row = {
      course:b.course, registration_number:cleanRegistration(b.registration_number),
      student_name:cleanText(b.student_name).toUpperCase(),
      father_husband_name:cleanText(b.father_husband_name).toUpperCase() || null,
      date_of_birth:cleanDate(b.date_of_birth), mobile:cleanPhone(b.mobile) || null,
      email:cleanText(b.email).toUpperCase() || null, city:cleanText(b.city).toUpperCase() || null,
      pin_code:cleanText(b.pin_code) || null, updated_at:new Date().toISOString()
    }
    if (!row.registration_number || !row.student_name) return NextResponse.json({ error:'Registration number and student name are required.' }, { status:400 })
    const { error } = await auth.supabase.from('students').upsert(row, { onConflict:'registration_number' })
    if (error) throw error
    return NextResponse.json({ ok:true })
  } catch (e) {
    console.error('admin_add_error',e)
    return NextResponse.json({ error:'Unable to save student.' }, { status:500 })
  }
}
