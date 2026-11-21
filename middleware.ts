import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/aluno/:path*", "/treinador/:path*", "/entrar", "/inicio", "/auth/:path*", "/strava/conectar", "/strava/callback", "/strava/sincronizar", "/strava/desconectar"],
};
