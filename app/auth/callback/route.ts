import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/supabase/config'

function tryDecode(value: string): string {
  try { return decodeURIComponent(value) } catch { return value }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const forwardedHost = request.headers.get('x-forwarded-host')
  const baseUrl = forwardedHost ? `https://${forwardedHost}` : origin

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
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
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cookieStore.set(name, encodeURIComponent(value), options as any)
              } catch {}
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${baseUrl}/`)
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${baseUrl}/login?error=no_code`)
}
