// Server-only — never import this from a "use client" component.
// These belong to the same Google Cloud OAuth client already configured
// as the Google provider in your Supabase Auth settings (must have the
// Gmail API enabled and the gmail.readonly scope on its consent screen).
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
