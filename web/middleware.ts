import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/api/:path*"],
};

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api/, "");

  const url = new URL(
    `${process.env.API_HOST}${path}${request.nextUrl.search}`
  );

  return NextResponse.rewrite(url, { request });
}
