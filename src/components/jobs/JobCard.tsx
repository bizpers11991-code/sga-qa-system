import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';

interface JobCardProps {
  job: Job;
  onDelete?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getDivisionColor = (division: string) => {
    switch (division) {
      case 'Asphalt':
        return 'bg-blue-100 text-blue-800';
      case 'Profiling':
        return 'bg-purple-100 text-purple-800';
      case 'Spray':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = () => {
    navigate(`/jobs/${job.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(job.id);
    } else {
      navigate(`/jobs/${job.id}/edit`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(job.id);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Error deleting job:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div
        onClick={handleView}
        className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sga-700 transition-colors truncate">
                {job.jobNo}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDivisionColor(
                  job.division
                )}`}
              >
                {job.division}
              </span>
            </div>
            <p className="text-gray-700 font-medium mb-3 truncate">{job.projectName}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              <p className="truncate"><strong>Client:</strong> {job.client}</p>
              <p className="truncate"><strong>Location:</strong> {job.location}</p>
              <p><strong>Job Date:</strong> {formatDate(job.jobDate)}</p>
              <p><strong>Due Date:</strong> {formatDate(job.dueDate)}</p>
            </div>
          </div>
          <div className="relative flex-shrink-0 ml-4" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Options"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Job</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete job <strong>{job.jobNo}</strong>?
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete the job and all associated data. This action cannot be
              undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-touch"
              >
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobCard;
