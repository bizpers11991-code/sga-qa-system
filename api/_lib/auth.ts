// api/_lib/auth.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Role, SecureForeman } from '../../src/types.js';
import { getRedisInstance } from './redis.js';

const USER_CACHE_TTL_SECONDS = 300; // 5 minutes

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

export const withAuth = (handler: AuthenticatedApiHandler, requiredRoles: Role[]) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];
    // FIX: Server-side code must use server-side environment variables.
    // VITE_ variables are only exposed to the client. Changed to AUTH0_DOMAIN.
    const auth0Domain = process.env.AUTH0_DOMAIN;

    if (!auth0Domain) {
        console.error("Auth0 domain is not configured on the server.");
        return res.status(500).json({ message: 'Authentication service is misconfigured.' });
    }

    try {
      const redis = getRedisInstance();
      const cacheKey = `user-profile:${token}`;
      
      // 1. Check cache first
      const cachedUserJson = await redis.get(cacheKey);
      if (cachedUserJson) {
          const cachedUser = (typeof cachedUserJson === 'string') 
            ? JSON.parse(cachedUserJson) 
            : cachedUserJson as SecureForeman;
            
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

      // 3. Cache the user profile in Redis
      await redis.set(cacheKey, JSON.stringify(foreman), { ex: USER_CACHE_TTL_SECONDS });
      
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
  };
};