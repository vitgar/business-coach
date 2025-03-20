/**
 * NextAuth.js API Route
 * 
 * Handles all authentication-related API requests including:
 * - Sign in with email/password
 * - OAuth sign in with Google and LinkedIn
 * - Session management
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";

// Define custom user type with role
interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

// Define the authentication options
export const authOptions: NextAuthOptions = {
  // Configure Prisma adapter for database storage
  adapter: PrismaAdapter(prisma) as unknown as Adapter,
  
  // Configure providers
  providers: [
    // Email/password authentication
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Check if user exists and password is correct
        if (!user || !user.password) {
          return null;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        // Return user object without password
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        };
      }
    }),
    
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user" // Default role for OAuth users
        };
      }
    }),
    
    // LinkedIn OAuth
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user" // Default role for OAuth users
        };
      }
    })
  ],
  
  // Configure session
  session: {
    strategy: "jwt"
  },
  
  // Configure pages
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user"
  },
  
  // Configure callbacks
  callbacks: {
    // Add user role to token
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as CustomUser).role;
      }
      return token;
    },
    
    // Add user role to session
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    }
  },
  
  // Disable debug mode to prevent webpack errors
  debug: false
};

// Create handler with the auth options
const handler = NextAuth(authOptions);

// Export handlers for GET and POST requests
export { handler as GET, handler as POST }; 