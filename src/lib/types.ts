export type UserRole = "student" | "startup";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
