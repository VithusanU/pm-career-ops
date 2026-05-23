import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_KEY } from './config'

function tryDecode(value: string): string {
  try { return decodeURIComponent(value) } catch { return value }
}

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({
            name,
            value: tryDecode(value),
          }))
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, encodeURIComponent(value), options as any)
            )
          } catch {}
        },
      },
    }
  )
}
