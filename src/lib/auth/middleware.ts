/**
 * @file src/lib/auth/middleware.ts
 * @description Authentication utilities (generic version)
 * NOTE: This project uses Vercel serverless functions
 * For actual auth implementation, see src/api/_lib/auth.ts
 */

import type { AuthUser, TokenClaims } from './types';
import { AuthError, AuthErrorCode } from './types';
import type { Role } from '@/types';

/**
 * Decode JWT token (without verification - for development)
 * In production, use a proper JWT library with signature verification
 *
 * @param token - JWT token string
 * @returns Decoded token claims
 */
export function decodeToken(token: string): TokenClaims {
  try {
    // JWT has 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid token format',
        401
      );
    }

    // Decode base64url payload
    const payload = parts[1];
    const decodedPayload = Buffer.from(payload, 'base64url').toString('utf-8');
    const claims = JSON.parse(decodedPayload);

    return claims as TokenClaims;
  } catch (error) {
    throw new AuthError(
      AuthErrorCode.INVALID_TOKEN,
      'Failed to decode token',
      401
    );
  }
}

/**
 * Validate token claims
 *
 * @param claims - Token claims to validate
 * @throws AuthError if validation fails
 */
export function validateClaims(claims: TokenClaims): void {
  // Check required fields
  if (!claims.oid || !claims.name || !claims.preferred_username) {
    throw new AuthError(
      AuthErrorCode.MISSING_CLAIMS,
      'Token missing required claims',
      401
    );
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) {
    throw new AuthError(
      AuthErrorCode.EXPIRED_TOKEN,
      'Token has expired',
      401
    );
  }
}

/**
 * Extract role from token claims
 *
 * @param claims - Token claims
 * @returns User role
 */
export function extractRole(claims: TokenClaims): Role {
  // Check roles array (Azure AD app roles)
  if (claims.roles && Array.isArray(claims.roles) && claims.roles.length > 0) {
    return claims.roles[0] as Role;
  }

  // Check custom role claim
  const customRole = (claims as any).role || (claims as any).extension_role;
  if (customRole) {
    return customRole as Role;
  }

  // Default role
  return 'asphalt_foreman';
}

/**
 * Convert token claims to AuthUser object
 *
 * @param claims - Validated token claims
 * @returns AuthUser object
 */
export function claimsToAuthUser(claims: TokenClaims): AuthUser {
  return {
    id: claims.oid,
    name: claims.name,
    email: claims.preferred_username,
    role: extractRole(claims),
    expiresAt: claims.exp * 1000, // Convert to milliseconds
    claims,
  };
}
