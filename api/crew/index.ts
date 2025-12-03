/**
 * Crew Management API
 *
 * Full CRUD operations for crew members.
 * GET /api/crew - List all crew (with optional filters)
 * POST /api/crew - Create new crew member
 * PUT /api/crew?id=xxx - Update crew member
 * DELETE /api/crew?id=xxx - Soft delete (deactivate) crew member
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResourcesData } from '../_lib/sharepointData.js';
import { Role } from '../../src/types.js';
import { withAuth, AuthenticatedRequest } from '../_lib/auth.js';
import { handleApiError } from '../_lib/errors.js';

interface CrewMember {
  id: string;
  name: string;
  division: 'Asphalt' | 'Profiling' | 'Spray' | 'Common';
  isForeman: boolean;
  role?: string;
  phone?: string;
  email?: string;
  active?: boolean;
  certifications?: string[];
  hireDate?: string;
  notes?: string;
  resourceType: 'Crew';
}

// Validate crew member data
function validateCrewMember(data: Partial<CrewMember>): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length < 2) {
    return { valid: false, error: 'Name is required and must be at least 2 characters' };
  }
  if (!data.division || !['Asphalt', 'Profiling', 'Spray', 'Common'].includes(data.division)) {
    return { valid: false, error: 'Division must be Asphalt, Profiling, Spray, or Common' };
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  if (data.phone && !/^[\d\s\-+()]+$/.test(data.phone)) {
    return { valid: false, error: 'Invalid phone format' };
  }
  return { valid: true };
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handleCreate(req, res);
      case 'PUT':
        return handleUpdate(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    await handleApiError({
      res,
      error,
      title: 'Crew Management API Error',
      context: { method: req.method, userId: req.user?.id },
    });
  }
}

// GET - List crew members with optional filters
async function handleGet(req: AuthenticatedRequest, res: VercelResponse) {
  const { division, active, isForeman, search } = req.query;

  const allResources = await ResourcesData.getAll();
  let crew = allResources.filter((r: any) => r.resourceType === 'Crew');

  // Apply filters
  if (division && typeof division === 'string') {
    crew = crew.filter((c: any) => c.division === division);
  }
  if (active !== undefined) {
    const isActive = active === 'true';
    crew = crew.filter((c: any) => c.active !== false === isActive);
  }
  if (isForeman !== undefined) {
    const foremanFilter = isForeman === 'true';
    crew = crew.filter((c: any) => c.isForeman === foremanFilter);
  }
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    crew = crew.filter((c: any) =>
      c.name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(search)
    );
  }

  // Sort by name
  crew.sort((a: any, b: any) => a.name.localeCompare(b.name));

  return res.status(200).json({
    crew,
    total: crew.length,
    filters: { division, active, isForeman, search },
  });
}

// POST - Create new crew member
async function handleCreate(req: AuthenticatedRequest, res: VercelResponse) {
  const data = req.body as Partial<CrewMember>;

  // Validate
  const validation = validateCrewMember(data);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Check for duplicate email
  if (data.email) {
    const allResources = await ResourcesData.getAll();
    const existingByEmail = allResources.find(
      (r: any) => r.resourceType === 'Crew' && r.email?.toLowerCase() === data.email?.toLowerCase()
    );
    if (existingByEmail) {
      return res.status(409).json({ error: 'A crew member with this email already exists' });
    }
  }

  // Create crew member
  const newCrew: Omit<CrewMember, 'id'> = {
    name: data.name!.trim(),
    division: data.division!,
    isForeman: data.isForeman || false,
    role: data.role?.trim(),
    phone: data.phone?.trim(),
    email: data.email?.toLowerCase().trim(),
    active: true,
    certifications: data.certifications || [],
    hireDate: data.hireDate || new Date().toISOString().split('T')[0],
    notes: data.notes?.trim(),
    resourceType: 'Crew',
  };

  const created = await ResourcesData.create(newCrew);

  return res.status(201).json({
    message: 'Crew member created successfully',
    crew: created,
  });
}

// PUT - Update existing crew member
async function handleUpdate(req: AuthenticatedRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Crew member ID is required' });
  }

  const data = req.body as Partial<CrewMember>;

  // Validate if updating key fields
  if (data.name || data.division) {
    const validation = validateCrewMember({
      name: data.name || 'placeholder',
      division: data.division || 'Common',
      ...data,
    });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
  }

  // Get existing crew member
  const existing = await ResourcesData.getById(id);
  if (!existing || (existing as any).resourceType !== 'Crew') {
    return res.status(404).json({ error: 'Crew member not found' });
  }

  // Check for duplicate email (if updating email)
  if (data.email && data.email !== (existing as any).email) {
    const allResources = await ResourcesData.getAll();
    const existingByEmail = allResources.find(
      (r: any) => r.resourceType === 'Crew' && r.id !== id && r.email?.toLowerCase() === data.email?.toLowerCase()
    );
    if (existingByEmail) {
      return res.status(409).json({ error: 'A crew member with this email already exists' });
    }
  }

  // Build update object
  const updates: Partial<CrewMember> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.division !== undefined) updates.division = data.division;
  if (data.isForeman !== undefined) updates.isForeman = data.isForeman;
  if (data.role !== undefined) updates.role = data.role?.trim();
  if (data.phone !== undefined) updates.phone = data.phone?.trim();
  if (data.email !== undefined) updates.email = data.email?.toLowerCase().trim();
  if (data.active !== undefined) updates.active = data.active;
  if (data.certifications !== undefined) updates.certifications = data.certifications;
  if (data.notes !== undefined) updates.notes = data.notes?.trim();

  const updated = await ResourcesData.update(id, updates);

  return res.status(200).json({
    message: 'Crew member updated successfully',
    crew: updated,
  });
}

// DELETE - Soft delete (deactivate) crew member
async function handleDelete(req: AuthenticatedRequest, res: VercelResponse) {
  const { id, permanent } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Crew member ID is required' });
  }

  // Get existing crew member
  const existing = await ResourcesData.getById(id);
  if (!existing || (existing as any).resourceType !== 'Crew') {
    return res.status(404).json({ error: 'Crew member not found' });
  }

  if (permanent === 'true') {
    // Hard delete - actually remove from SharePoint
    await ResourcesData.delete(id);
    return res.status(200).json({
      message: 'Crew member permanently deleted',
      id,
    });
  } else {
    // Soft delete - just mark as inactive
    await ResourcesData.update(id, { active: false } as any);
    return res.status(200).json({
      message: 'Crew member deactivated',
      id,
    });
  }
}

// Only admins and schedulers can manage crew
const authorizedRoles: Role[] = [
  'management_admin',
  'scheduler_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'hseq_manager',
];

export default withAuth(handler, authorizedRoles);
