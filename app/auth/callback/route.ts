import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    // Diagnostic: log first 3 char codes of each env var to detect BOM/corruption
    const urlCodes = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').split('').slice(0,3).map(c=>c.charCodeAt(0)).join(',')
    const keyCodes = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').split('').slice(0,3).map(c=>c.charCodeAt(0)).join(',')

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${baseUrl}/`)
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error.message + ' | url:' + urlCodes + ' key:' + keyCodes)}`)
  }

  return NextResponse.redirect(`${baseUrl}/login?error=no_code`)
}
