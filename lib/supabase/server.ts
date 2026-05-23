import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function tryDecode(value: string): string {
  try { return decodeURIComponent(value) } catch { return value }
}

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
