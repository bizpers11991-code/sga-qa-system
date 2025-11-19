// api/get-foremen.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SecureForeman, Role } from '../types.js';
import { withAuth, AuthenticatedRequest } from './_lib/auth.js';
import { getManagementApiToken } from './_lib/auth0.js';
import { handleApiError } from './_lib/errors.js';

const FOREMAN_ROLE_NAMES: Role[] = ['asphalt_foreman', 'profiling_foreman', 'spray_foreman'];

async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
) {
  try {
    const token = await getManagementApiToken();
    const auth0Domain = process.env.AUTH0_DOMAIN;

    // 1. Get all roles from Auth0 to find the IDs of our foreman roles.
    const rolesResponse = await fetch(`https://${auth0Domain}/api/v2/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!rolesResponse.ok) throw new Error('Failed to fetch roles from Auth0.');
    const allRoles = await rolesResponse.json();

    if (!allRoles || allRoles.length === 0) {
        return res.status(200).json([]);
    }

    const foremanRoleInfos = allRoles
        .filter((role: any) => role.name && FOREMAN_ROLE_NAMES.includes(role.name as Role))
        .map((role: any) => ({ id: role.id!, name: role.name as Role }));

    if (foremanRoleInfos.length === 0) {
        console.warn("Foreman roles (asphalt_foreman, etc.) not found in Auth0. Please ensure they are created.");
        return res.status(200).json([]);
    }
    
    // 2. For each foreman role, fetch ALL users assigned to it using the Auth0 Management API directly.
    const userPromises = foremanRoleInfos.map(async (roleInfo: { id: string; name: Role }) => {
        const allUsersInRole = [];
        let page = 0;
        while (true) {
            const response = await fetch(`https://${auth0Domain}/api/v2/roles/${roleInfo.id}/users?page=${page}&per_page=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Auth0 API error fetching users for role ${roleInfo.id}: ${errorData.message}`);
            }

            const users = await response.json();
            if (users.length === 0) {
                break; // Exit loop when no more users are returned
            }
            allUsersInRole.push(...users);
            page++;
        }
        
        // Tag each user with their role name so we know which role they have
        return allUsersInRole.map((user: any) => ({ ...user, assigned_role: roleInfo.name }));
    });

    const usersByRoleArrays = await Promise.all(userPromises);
    const allForemanUsers = usersByRoleArrays.flat();

    // 3. Deduplicate users (in case a user has multiple foreman roles)
    const uniqueUsers = new Map<string, any & { assigned_role: Role }>();
    for (const user of allForemanUsers) {
        // Auth0 API returns user_id, not sub, in this context
        const userId = user.user_id || user.sub;
        if (userId && !uniqueUsers.has(userId)) {
            uniqueUsers.set(userId, user);
        }
    }

    // 4. Map to our SecureForeman type and sort
    const foremen: SecureForeman[] = Array.from(uniqueUsers.values())
      .filter(user => !user.blocked && (user.user_id || user.sub) && user.email)
      .map(user => ({
          id: user.user_id! || user.sub!,
          name: user.name || user.email!,
          username: user.email!,
          role: user.assigned_role,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json(foremen);

  } catch (error: any) {
    let title = 'Fetch Foremen Failure';
    // Check for specific Auth0 errors if possible, e.g., insufficient scope
    if (error.statusCode === 403 || (error.message && error.message.includes('Forbidden'))) {
        error.message = 'The backend M2M application does not have permission to read users from Auth0. Please check the API permissions (e.g., read:users) in your Auth0 dashboard.';
        title = 'Auth0 Permissions Error';
    }
    await handleApiError({ res, error, title, context: { authenticatedUserId: req.user.id } });
  }
}

// Allow admins to fetch the list of foremen
export default withAuth(handler, [
    'asphalt_engineer', 'profiling_engineer', 'spray_admin',
    'management_admin', 'scheduler_admin', 'hseq_manager'
]);