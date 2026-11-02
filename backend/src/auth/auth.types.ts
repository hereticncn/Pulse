import type { Request } from 'express';
import type { User } from '../generated/prisma/client.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: Date | null;
}

export interface AuthenticatedSession {
  id: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  session: AuthenticatedSession;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface MembershipSummary {
  organizationId: string;
  organizationName: string;
  slug: string;
  role: string;
}

export type UserWithVerification = Pick<
  User,
  'id' | 'email' | 'name' | 'emailVerifiedAt'
>;

export function toPublicUser(user: UserWithVerification): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerifiedAt !== null,
  };
}
