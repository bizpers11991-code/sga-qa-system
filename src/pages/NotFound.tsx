import { PageContainer, PageHeader } from '../components/layout';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <PageHeader
        title="Page Not Found"
        description="The page you're looking for doesn't exist"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Not Found' }
        ]}
      />

      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full">
          <span className="text-4xl">🔍</span>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. The URL might be incorrect or the page may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-white text-sga-700 border-2 border-sga-700 rounded-lg hover:bg-sga-50 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Here are some helpful links:</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="/" className="text-sm text-sga-700 hover:text-sga-600 font-medium">
              Dashboard
            </a>
            <a href="/jobs" className="text-sm text-sga-700 hover:text-sga-600 font-medium">
              Jobs
            </a>
            <a href="/reports" className="text-sm text-sga-700 hover:text-sga-600 font-medium">
              Reports
            </a>
            <a href="/incidents" className="text-sm text-sga-700 hover:text-sga-600 font-medium">
              Incidents
            </a>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default NotFound;
