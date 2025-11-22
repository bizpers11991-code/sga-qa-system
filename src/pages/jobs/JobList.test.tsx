import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { JobList } from './JobList';
import { jobsApi } from '../../services/jobsApi';
import { vi } from 'vitest';

// Mock the jobsApi
vi.mock('../../services/jobsApi', () => ({
  jobsApi: {
    getAllJobs: vi.fn(),
    deleteJob: vi.fn(),
  },
}));

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { name: 'Test User' },
    logout: vi.fn(),
  }),
}));

const mockJobs = [
  {
    id: '1',
    jobNo: 'JOB-001',
    client: 'Client A',
    division: 'Asphalt',
    projectName: 'Project A',
    location: 'Location A',
    jobDate: '2025-01-01',
    dueDate: '2025-01-10',
  },
  {
    id: '2',
    jobNo: 'JOB-002',
    client: 'Client B',
    division: 'Profiling',
    projectName: 'Project B',
    location: 'Location B',
    jobDate: '2025-01-02',
    dueDate: '2025-01-12',
  },
];

describe('JobList', () => {
  beforeEach(() => {
    (jobsApi.getAllJobs as jest.Mock).mockResolvedValue(mockJobs);
  });

  it('renders the job list', async () => {
    render(
      <BrowserRouter>
        <JobList />
      </BrowserRouter>
    );

    expect(await screen.findByText('JOB-001')).toBeInTheDocument();
    expect(screen.getByText('JOB-002')).toBeInTheDocument();
  });

  it('filters the job list', async () => {
    render(
      <BrowserRouter>
        <JobList />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search by job number, client, or project...');
    fireEvent.change(searchInput, { target: { value: 'JOB-001' } });

    expect(await screen.findByText('JOB-001')).toBeInTheDocument();
    expect(screen.queryByText('JOB-002')).not.toBeInTheDocument();
  });

  it('deletes a job', async () => {
    (jobsApi.deleteJob as jest.Mock).mockResolvedValue({});
    render(
      <BrowserRouter>
        <JobList />
      </BrowserRouter>
    );

    const deleteButton = screen.getAllByLabelText('Options')[0];
    fireEvent.click(deleteButton);

    const deleteMenuItem = await screen.findByText('Delete');
    fireEvent.click(deleteMenuItem);

    const confirmButton = await screen.findByText('Delete Job');
    fireEvent.click(confirmButton);

    expect(jobsApi.deleteJob).toHaveBeenCalledWith('1');
  });
});
