import { PageContainer, PageHeader } from '../../components/layout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenderHandover } from '../../types';
import { createHandover } from '../../services/tendersApi';
import TenderHandoverForm from '../../components/tenders/TenderHandoverForm';

const TenderCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<TenderHandover>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await createHandover(data as any);

      if (result.success) {
        navigate('/tenders');
      } else {
        setError('Failed to create handover');
      }
    } catch (err) {
      console.error('Error creating handover:', err);
      setError(err instanceof Error ? err.message : 'Failed to create handover');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/tenders');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Tender Handover"
        description="Create a new tender handover for project creation"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Tenders', path: '/tenders' },
          { label: 'Create' },
        ]}
      />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-red-500 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isSubmitting ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sga-700 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Creating handover...</p>
        </div>
      ) : (
        <TenderHandoverForm onSubmit={handleSubmit} onCancel={handleCancel} />
      )}
    </PageContainer>
  );
};

export default TenderCreate;
