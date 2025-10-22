import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      ip?: string;
      loginTime?: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    ip?: string;
    loginTime?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string;
    ip?: string;
    loginTime?: number;
  }
}
