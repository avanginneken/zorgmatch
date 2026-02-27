import { createBrowserClient } from '@supabase/ssr'

function isSupabaseConfigured() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
  )
}

function createMockBrowserClient() {
  const makeChain = (result: unknown = { data: null, error: null }): any => {
    const obj: any = new Proxy({}, {
      get: (_t, prop) => {
        if (prop === 'then') return (res: any) => Promise.resolve(result).then(res)
        if (prop === 'catch') return (rej: any) => Promise.resolve(result).catch(rej)
        return () => obj
      },
    })
    return obj
  }

  return {
    auth: {
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Demo modus actief' } }),
      signUp: async () => ({ data: null, error: { message: 'Demo modus actief' } }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: (_table: string) => ({
      select: (_cols?: string, _opts?: any) => makeChain({ data: [], count: 0, error: null }),
      insert: (_data: any) => makeChain({ data: null, error: null }),
      update: (_data: any) => makeChain({ data: null, error: null }),
      delete: () => makeChain({ data: null, error: null }),
      upsert: (_data: any) => makeChain({ data: null, error: null }),
    }),
    storage: {
      from: (_bucket: string) => ({
        upload: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    return createMockBrowserClient() as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
