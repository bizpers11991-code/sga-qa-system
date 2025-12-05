/**
 * Equipment Management API
 *
 * Full CRUD operations for equipment.
 * GET /api/equipment - List all equipment (with optional filters)
 * POST /api/equipment - Create new equipment
 * PUT /api/equipment?id=xxx - Update equipment
 * DELETE /api/equipment?id=xxx - Delete equipment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResourcesData } from '../_lib/sharepointData.js';
import { Role } from '../../src/types.js';
import { withAuth, AuthenticatedRequest } from '../_lib/auth.js';
import { handleApiError } from '../_lib/errors.js';

interface Equipment {
  id: string;
  fleetId: string;
  name: string;
  type: string;
  division: 'Asphalt' | 'Profiling' | 'Spray' | 'Common';
  registrationNumber?: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Retired';
  make?: string;
  model?: string;
  year?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
  resourceType: 'Equipment';
}

// Validate equipment data
function validateEquipment(data: Partial<Equipment>): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length < 2) {
    return { valid: false, error: 'Name is required and must be at least 2 characters' };
  }
  if (!data.type || data.type.trim().length < 2) {
    return { valid: false, error: 'Type is required' };
  }
  if (!data.division || !['Asphalt', 'Profiling', 'Spray', 'Common'].includes(data.division)) {
    return { valid: false, error: 'Division must be Asphalt, Profiling, Spray, or Common' };
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
      title: 'Equipment Management API Error',
      context: { method: req.method, userId: req.user?.id },
    });
  }
}

// Equipment types from the fleet register
const EQUIPMENT_TYPES = ['Paver', 'Roller', 'Truck', 'Profiler', 'Other Equipment'];

// GET - List equipment with optional filters
async function handleGet(req: AuthenticatedRequest, res: VercelResponse) {
  const { division, status, type, search } = req.query;

  const allResources = await ResourcesData.getAll();
  // Filter by equipment types (Paver, Roller, Truck, Profiler, Other Equipment)
  let equipment = allResources.filter((r: any) => EQUIPMENT_TYPES.includes(r.resourceType));

  // Apply filters
  if (division && typeof division === 'string') {
    equipment = equipment.filter((e: any) => e.division === division);
  }
  if (status && typeof status === 'string') {
    equipment = equipment.filter((e: any) => e.status === status);
  }
  if (type && typeof type === 'string') {
    equipment = equipment.filter((e: any) => e.type === type);
  }
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    equipment = equipment.filter((e: any) =>
      e.resourceName?.toLowerCase().includes(searchLower) ||
      e.title?.toLowerCase().includes(searchLower) ||
      e.registrationNumber?.toLowerCase().includes(searchLower)
    );
  }

  // Sort by fleet ID (Title field contains SGA001, SGA002, etc.)
  equipment.sort((a: any, b: any) => (a.title || a.id).localeCompare(b.title || b.id));

  // Get unique types for filter dropdown
  const types = [...new Set(equipment.map((e: any) => e.type).filter(Boolean))];

  return res.status(200).json({
    equipment,
    total: equipment.length,
    types,
    filters: { division, status, type, search },
  });
}

// POST - Create new equipment
async function handleCreate(req: AuthenticatedRequest, res: VercelResponse) {
  const data = req.body as Partial<Equipment>;

  // Validate
  const validation = validateEquipment(data);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Generate fleet ID if not provided
  const fleetId = data.fleetId || `SGA${Date.now().toString().slice(-4)}`;

  // Check for duplicate fleet ID
  const allResources = await ResourcesData.getAll();
  const existingByFleetId = allResources.find(
    (r: any) => r.resourceType === 'Equipment' && r.fleetId?.toLowerCase() === fleetId.toLowerCase()
  );
  if (existingByFleetId) {
    return res.status(409).json({ error: 'Equipment with this fleet ID already exists' });
  }

  // Create equipment
  const newEquipment: Omit<Equipment, 'id'> = {
    fleetId,
    name: data.name!.trim(),
    type: data.type!.trim(),
    division: data.division!,
    registrationNumber: data.registrationNumber?.trim(),
    status: data.status || 'Available',
    make: data.make?.trim(),
    model: data.model?.trim(),
    year: data.year,
    lastServiceDate: data.lastServiceDate,
    nextServiceDate: data.nextServiceDate,
    notes: data.notes?.trim(),
    resourceType: 'Equipment',
  };

  const created = await ResourcesData.create(newEquipment);

  return res.status(201).json({
    message: 'Equipment created successfully',
    equipment: created,
  });
}

// PUT - Update existing equipment
async function handleUpdate(req: AuthenticatedRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Equipment ID is required' });
  }

  const data = req.body as Partial<Equipment>;

  // Get existing equipment
  const existing = await ResourcesData.getById(id);
  if (!existing || (existing as any).resourceType !== 'Equipment') {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  // Check for duplicate fleet ID (if updating)
  if (data.fleetId && data.fleetId !== (existing as any).fleetId) {
    const allResources = await ResourcesData.getAll();
    const existingByFleetId = allResources.find(
      (r: any) => r.resourceType === 'Equipment' && r.id !== id && r.fleetId?.toLowerCase() === data.fleetId?.toLowerCase()
    );
    if (existingByFleetId) {
      return res.status(409).json({ error: 'Equipment with this fleet ID already exists' });
    }
  }

  // Build update object
  const updates: Partial<Equipment> = {};
  if (data.fleetId !== undefined) updates.fleetId = data.fleetId.trim();
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.type !== undefined) updates.type = data.type.trim();
  if (data.division !== undefined) updates.division = data.division;
  if (data.registrationNumber !== undefined) updates.registrationNumber = data.registrationNumber?.trim();
  if (data.status !== undefined) updates.status = data.status;
  if (data.make !== undefined) updates.make = data.make?.trim();
  if (data.model !== undefined) updates.model = data.model?.trim();
  if (data.year !== undefined) updates.year = data.year;
  if (data.lastServiceDate !== undefined) updates.lastServiceDate = data.lastServiceDate;
  if (data.nextServiceDate !== undefined) updates.nextServiceDate = data.nextServiceDate;
  if (data.notes !== undefined) updates.notes = data.notes?.trim();

  const updated = await ResourcesData.update(id, updates);

  return res.status(200).json({
    message: 'Equipment updated successfully',
    equipment: updated,
  });
}

// DELETE - Remove equipment
async function handleDelete(req: AuthenticatedRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Equipment ID is required' });
  }

  // Get existing equipment
  const existing = await ResourcesData.getById(id);
  if (!existing || (existing as any).resourceType !== 'Equipment') {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  await ResourcesData.delete(id);

  return res.status(200).json({
    message: 'Equipment deleted successfully',
    id,
  });
}

// Only admins and schedulers can manage equipment
const authorizedRoles: Role[] = [
  'management_admin',
  'scheduler_admin',
  'asphalt_engineer',
  'profiling_engineer',
  'spray_admin',
  'hseq_manager',
];

export default withAuth(handler, authorizedRoles);
