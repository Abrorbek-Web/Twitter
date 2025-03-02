import { AuthOptions } from "next-auth";
import { connectToDatabase } from "./mognoose";
import User from "@/database/user.model";

import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { DefaultSession } from "next-auth";

export interface UserSession extends DefaultSession {
  currentUser?: {
    email: string;
    name?: string;
    profileImage?: string;
  };
}

export interface CustomSession extends DefaultSession {
  user?: UserSession["user"];
  currentUser?: UserSession["currentUser"];
}

// interface Credentials {
//   email: string;
//   password: string;
// }

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectToDatabase();

        const user = await User.findOne({
          email: credentials.email,
        });

        return user || null;
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }: { session: CustomSession }) {
      await connectToDatabase();

      if (session.user?.email) {
        let user = await User.findOne({ email: session.user.email });

        if (!user) {
          user = await User.create({
            email: session.user.email,
            name: session.user.name,
            profileImage: session.user.image,
          });
        }

        session.currentUser = {
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
        };
      }

      return session;
    },
  },
  session: { strategy: "jwt" },
  jwt: { secret: process.env.NEXTAUTH_JWT_SECRET! },
  secret: process.env.NEXTAUTH_SECRET!,
};
