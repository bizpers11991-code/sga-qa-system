import { HttpRequest } from "@azure/functions";

/**
 * Extracts user information from Azure Functions authentication headers
 */
export interface AuthenticatedUser {
  email: string;
  roles: string[];
  name: string;
}

export function getUserFromRequest(req: HttpRequest): AuthenticatedUser | null {
  // Azure Functions with EasyAuth injects principal info in headers
  const principalJson = req.headers.get('x-ms-client-principal');

  if (!principalJson) {
    return null;
  }

  try {
    const decoded = Buffer.from(principalJson, 'base64').toString('utf-8');
    const principal = JSON.parse(decoded);

    return {
      email: principal.userDetails || principal.claims?.find((c: any) => c.typ === 'email')?.val || '',
      name: principal.claims?.find((c: any) => c.typ === 'name')?.val || '',
      roles: principal.claims?.filter((c: any) => c.typ === 'roles').map((c: any) => c.val) || []
    };
  } catch (error) {
    return null;
  }
}

/**
 * Checks if user can access a specific QA Pack
 */
export async function canUserAccessQAPack(
  user: AuthenticatedUser,
  qaPackData: any
): Promise<boolean> {
  // 1. User created the QA pack
  if (qaPackData.submittedBy?.toLowerCase() === user.email.toLowerCase()) {
    return true;
  }

  // 2. User is an engineer in the same division
  const division = qaPackData.division?.toLowerCase();
  const engineerRole = `${division}_engineer`;

  if (user.roles.some(r => r.toLowerCase() === engineerRole)) {
    return true;
  }

  // 3. User is management or HSEQ (can access all)
  const adminRoles = ['management_admin', 'hseq_manager', 'scheduler_admin'];
  if (user.roles.some(r => adminRoles.includes(r.toLowerCase()))) {
    return true;
  }

  // 4. User is spray admin (can access all spray division)
  if (user.roles.includes('spray_admin') && division === 'spray') {
    return true;
  }

  return false;
}