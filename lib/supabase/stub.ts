function emptyQueryResult() {
  return { data: [], error: null, count: 0 }
}

function emptySingleResult() {
  return { data: null, error: null }
}

function supabaseNotConfigured() {
  return { data: null, error: new Error('Supabase is not configured') }
}

export function createQueryStub() {
  const query: any = {}
  const chain = () => query

  Object.assign(query, {
    select: chain,
    insert: chain,
    update: chain,
    upsert: chain,
    delete: chain,
    eq: chain,
    neq: chain,
    gt: chain,
    gte: chain,
    lt: chain,
    lte: chain,
    is: chain,
    in: chain,
    contains: chain,
    containedBy: chain,
    range: chain,
    order: chain,
    limit: chain,
    match: chain,
    or: chain,
    filter: chain,
    ilike: chain,
    like: chain,
    throwOnError: chain,
    single: async () => emptySingleResult(),
    maybeSingle: async () => emptySingleResult(),
    then: (resolve: any, reject: any) => Promise.resolve(emptyQueryResult()).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(emptyQueryResult()).catch(reject),
    finally: (onFinally: any) => Promise.resolve(emptyQueryResult()).finally(onFinally),
  })

  return query
}

export function createSupabaseStub() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signUp: async () => supabaseNotConfigured(),
      signInWithPassword: async () => supabaseNotConfigured(),
      exchangeCodeForSession: async () => ({ data: null, error: null }),
    },
    from: () => createQueryStub(),
    rpc: async () => ({ data: null, error: null }),
  } as any
}
