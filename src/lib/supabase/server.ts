import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Returns a chainable builder that always resolves to empty data
function makeBuilder(resolveValue: unknown = { data: null, count: 0, error: null }): any {
  const handler: ProxyHandler<object> = {
    get: (_target, prop) => {
      if (prop === 'then') return (onFulfilled: any) => Promise.resolve(resolveValue).then(onFulfilled)
      if (prop === 'catch') return (onRejected: any) => Promise.resolve(resolveValue).catch(onRejected)
      if (prop === 'finally') return (onFinally: any) => Promise.resolve(resolveValue).finally(onFinally)
      return () => makeBuilder(resolveValue)
    },
  }
  return new Proxy({}, handler)
}

function createMockClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: (_table: string) => ({
      select: (_cols?: string, _opts?: any) => makeBuilder({ data: [], count: 0, error: null }),
      insert: (_data: any) => makeBuilder({ data: null, error: null }),
      update: (_data: any) => makeBuilder({ data: null, error: null }),
      delete: () => makeBuilder({ data: null, error: null }),
      upsert: (_data: any) => makeBuilder({ data: null, error: null }),
    }),
    storage: {
      from: (_bucket: string) => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }),
      }),
    },
    rpc: (_fn: string) => makeBuilder({ data: null, error: null }),
  }
}

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return mock client when Supabase is not configured (demo/prototype mode)
  if (
    !supabaseUrl ||
    supabaseUrl === 'your_supabase_project_url' ||
    !supabaseKey ||
    supabaseKey === 'your_supabase_anon_key'
  ) {
    return createMockClient() as any
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  )
}
