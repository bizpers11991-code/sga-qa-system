// api/_lib/auth.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Role, SecureForeman } from '../../src/types';

const USER_CACHE_TTL_SECONDS = 300; // 5 minutes

// In-memory cache for user profiles (simple alternative to Redis)
const userProfileCache = new Map<string, { user: SecureForeman; expiresAt: number }>();

export type AuthenticatedRequest = VercelRequest & {
  user: SecureForeman;
};

type AuthenticatedApiHandler = (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>;

// This maps the Auth0 user profile to our app's SecureForeman type
const mapAuth0UserToForeman = (user: any): SecureForeman | null => {
  if (!user) return null;
  const roles = user['https://sga.com/roles'] || [];
  const role: Role | undefined = roles[0];
  if (!role) return null;

  return {
    id: user.sub,
    name: user.name || user.email,
    username: user.email,
    role: role,
  };
};

/**
 * Get user from cache
 */
const getCachedUser = (token: string): SecureForeman | null => {
  const cached = userProfileCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
  // Clean up expired entry
  if (cached) {
    userProfileCache.delete(token);
  }
  return null;
};

/**
 * Set user in cache
 */
const setCachedUser = (token: string, user: SecureForeman): void => {
  userProfileCache.set(token, {
    user,
    expiresAt: Date.now() + USER_CACHE_TTL_SECONDS * 1000,
  });
};

export const withAuth = (handler: AuthenticatedApiHandler, requiredRoles: Role[]) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    // TEMPORARY: Bypass auth ENTIRELY for development/testing
    // TODO: Remove this before production deployment!
    // This allows the app to work immediately without setting up Auth0

    console.log('[AUTH BYPASS] Skipping authentication - development mode');
    // Create a mock user for testing with full admin access
    (req as AuthenticatedRequest).user = {
      id: 'dev-user-123',
      name: 'Development User',
      username: 'dev@sga.com',
      role: 'management_admin' as Role, // Admin role has access to everything
    };
    return handler(req as AuthenticatedRequest, res);

    // PRODUCTION AUTH CODE BELOW - Will be re-enabled when Auth0 is configured
    /*
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    const auth0Domain = process.env.AUTH0_DOMAIN;

    if (!auth0Domain) {
        console.error("Auth0 domain is not configured on the server.");
        return res.status(500).json({ message: 'Authentication service is misconfigured.' });
    }

    try {
      // 1. Check in-memory cache first
      const cachedUser = getCachedUser(token);
      if (cachedUser) {
          if (requiredRoles.length > 0 && !requiredRoles.includes(cachedUser.role)) {
              return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
          }
          (req as AuthenticatedRequest).user = cachedUser;
          return handler(req as AuthenticatedRequest, res);
      }

      // 2. If not in cache, fetch from Auth0
      const userInfoResponse = await fetch(`https://${auth0Domain}/userinfo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userInfoResponse.ok) {
        return res.status(401).json({ message: 'Invalid access token.' });
      }

      const userProfile = await userInfoResponse.json();
      const foreman = mapAuth0UserToForeman(userProfile);

      if (!foreman) {
        return res.status(403).json({ message: 'Forbidden: User profile is incomplete or is not assigned a valid role in Auth0.' });
      }

      // 3. Cache the user profile in memory
      setCachedUser(token, foreman);

      if (requiredRoles.length > 0 && !requiredRoles.includes(foreman.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
      }

      // Attach user to the request and call the actual handler
      (req as AuthenticatedRequest).user = foreman;
      return handler(req as AuthenticatedRequest, res);

    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'An error occurred during authentication.' });
    }
    */
  };
};
