// This route is now handled by NextAuth at /api/auth/[...nextauth]
// Use signIn() from next-auth/react on the client side
// Or use getServerSession() on the server side

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Please use NextAuth for authentication. Use signIn() from next-auth/react' },
    { status: 410 }
  );
}
