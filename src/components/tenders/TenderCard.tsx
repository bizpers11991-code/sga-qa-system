import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TenderHandover } from '../../types';

interface TenderCardProps {
  handover: TenderHandover;
}

const TenderCard: React.FC<TenderCardProps> = ({ handover }) => {
  const navigate = useNavigate();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier 1':
        return 'bg-green-100 text-green-800';
      case 'Tier 2':
        return 'bg-yellow-100 text-yellow-800';
      case 'Tier 3':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-purple-100 text-purple-800';
      case 'On Hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDivisionIcons = () => {
    const icons = [];
    if (handover.divisionsRequired.asphalt) {
      icons.push(
        <span key="asphalt" className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Asphalt
        </span>
      );
    }
    if (handover.divisionsRequired.profiling) {
      icons.push(
        <span key="profiling" className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Profiling
        </span>
      );
    }
    if (handover.divisionsRequired.spray) {
      icons.push(
        <span key="spray" className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Spray
        </span>
      );
    }
    return icons;
  };

  const handleView = () => {
    navigate(`/tenders/${handover.id}`);
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

  return (
    <div
      onClick={handleView}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sga-700 transition-colors">
              {handover.handoverNumber}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(handover.status)}`}>
              {handover.status}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(handover.clientTier)}`}>
              {handover.clientTier}
            </span>
          </div>

          <p className="text-gray-700 font-medium mb-3 truncate">{handover.projectName}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
            <p className="truncate">
              <strong>Client:</strong> {handover.clientName}
            </p>
            <p className="truncate">
              <strong>Location:</strong> {handover.location}
            </p>
            <p>
              <strong>Start:</strong> {formatDate(handover.estimatedStartDate)}
            </p>
            <p>
              <strong>End:</strong> {formatDate(handover.estimatedEndDate)}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600 font-medium">Divisions:</span>
            {getDivisionIcons()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderCard;
