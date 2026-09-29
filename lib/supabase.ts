import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://runblmanbuotldxelopf.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IgnEb3GnY1EPGgX4F0EB_g_JejnA6EM'

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY
  return { url, key }
}
export function getPublicSupabase() {
  const { url, key } = config()
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
export function getUserSupabase(token: string) {
  const { url, key } = config()
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}
export async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return { ok:false as const, status:401, message:'Missing session' }
  const supabase = getUserSupabase(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.email) return { ok:false as const, status:401, message:'Invalid session' }
  const allowed = (process.env.ADMIN_EMAILS || 'icmai.cmakevalshah@gmail.com').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)
  if (!allowed.includes(data.user.email.toLowerCase())) return { ok:false as const, status:403, message:'Admin access required' }
  return { ok:true as const, user:data.user, token, supabase }
}
