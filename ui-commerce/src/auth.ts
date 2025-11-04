// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

// Validate input để tránh 'unknown'
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Verify user credentials via backend API
async function verifyUser(email: string, password: string) {
  if (!password) return null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/client-auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Backend returns: { accessToken, user: { id, email, name, phone, role, ... } }
    if (!data.accessToken || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || data.user.email,
      image: null as string | null,
      accessToken: data.accessToken,
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // 👇 v5: (credentials, request) => Awaitable<User | null>
      authorize: async (credentials, _req) => {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const u = await verifyUser(email, password);
        if (!u) return null;

        // Trả đúng kiểu User với accessToken
        const user: any = {
          id: u.id,
          email: u.email,    // string | null OK
          name: u.name ?? null,
          image: u.image ?? null,
          accessToken: u.accessToken, // Lưu accessToken để dùng trong callback
        };
        return user;
      },
    }),
  ],

  // Đưa user.id và accessToken vào token & session
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;      // lưu id vào token
        token.accessToken = (user as any).accessToken; // lưu accessToken từ backend
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        (session.user as any).id = token.id as string; // gắn id vào session.user
        (session.user as any).accessToken = token.accessToken; // gắn accessToken vào session
      }
      return session;
    },
  },
});
