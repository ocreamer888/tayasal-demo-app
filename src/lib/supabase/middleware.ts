import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(request: Request) {
  let response = Response.next();

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: (name, value, options) => {
        response = new Response('Unauthorized', { status: 401 });
        response.cookies.set(name, value, options);
      },
      remove: (name) => {
        response = new Response('Unauthorized', { status: 401 });
        response.cookies.delete(name);
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return response;
  }

  return Response.redirect(request.url, '/dashboard');
}
