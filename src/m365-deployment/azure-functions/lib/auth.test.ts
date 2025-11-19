import { describe, it, expect } from '@jest/globals';
import { canUserAccessQAPack } from './auth';

describe('Authorization Tests', () => {
  const qaPackAsphalt = {
    id: 'qa-123',
    division: 'Asphalt',
    submittedBy: 'foreman1@sga.com.au'
  };

  it('should allow foreman to access their own QA pack', async () => {
    const user = {
      email: 'foreman1@sga.com.au',
      roles: ['asphalt_foreman'],
      name: 'John Foreman'
    };

    const canAccess = await canUserAccessQAPack(user, qaPackAsphalt);
    expect(canAccess).toBe(true);
  });

  it('should deny foreman from accessing other divisions', async () => {
    const user = {
      email: 'foreman2@sga.com.au',
      roles: ['profiling_foreman'],
      name: 'Jane Foreman'
    };

    const canAccess = await canUserAccessQAPack(user, qaPackAsphalt);
    expect(canAccess).toBe(false);
  });

  it('should allow engineer to access same division', async () => {
    const user = {
      email: 'engineer@sga.com.au',
      roles: ['asphalt_engineer'],
      name: 'Bob Engineer'
    };

    const canAccess = await canUserAccessQAPack(user, qaPackAsphalt);
    expect(canAccess).toBe(true);
  });

  it('should allow management to access all divisions', async () => {
    const user = {
      email: 'ceo@sga.com.au',
      roles: ['management_admin'],
      name: 'CEO'
    };

    const canAccess = await canUserAccessQAPack(user, qaPackAsphalt);
    expect(canAccess).toBe(true);
  });

  it('should deny unauthorized user', async () => {
    const user = {
      email: 'external@competitor.com',
      roles: [],
      name: 'External User'
    };

    const canAccess = await canUserAccessQAPack(user, qaPackAsphalt);
    expect(canAccess).toBe(false);
  });
});