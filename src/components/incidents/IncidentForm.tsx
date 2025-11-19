import { useState, useRef } from 'react';
import {
  submitIncident,
  captureGpsLocation,
  IncidentFormData,
  IncidentPhoto,
  GpsLocation
} from '../../services/incidentsApi';
import { optimizeImage } from '../../services/imageUtils';
import useAuth from '../../hooks/useAuth';

interface IncidentFormProps {
  onSuccess?: (incidentId: string) => void;
  onCancel?: () => void;
}

const IncidentForm = ({ onSuccess, onCancel }: IncidentFormProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<IncidentFormData>({
    type: 'Incident',
    severity: 'Medium',
    description: '',
    location: '',
    photos: [],
    isEmergency: false,
  });

  const [gpsLocation, setGpsLocation] = useState<GpsLocation | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCaptureGps = async () => {
    setIsCapturingGps(true);
    setGpsError(null);

    try {
      const location = await captureGpsLocation();
      setGpsLocation(location);
      setFormData(prev => ({ ...prev, gpsLocation: location }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture GPS location';
      setGpsError(errorMessage);
    } finally {
      setIsCapturingGps(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newPhotos: IncidentPhoto[] = [];
      const newPreviews: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        // Optimize and convert to base64
        const dataUrl = await optimizeImage(file);

        newPhotos.push({
          dataUrl,
          filename: file.name,
          timestamp: new Date().toISOString(),
        });

        newPreviews.push(dataUrl);
      }

      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));

      setPhotoPreview(prev => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Error processing photos:', err);
      alert('Failed to process photos. Please try again.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.description.trim()) {
        throw new Error('Please provide a description');
      }
      if (!formData.location.trim()) {
        throw new Error('Please provide a location');
      }

      // Prepare submission data
      const submissionData: IncidentFormData = {
        ...formData,
        reportedBy: user?.name || user?.username || 'Unknown User',
        reportedDate: new Date().toISOString(),
      };

      const response = await submitIncident(submissionData);

      if (response.success) {
        setSubmittedIncidentId(response.incidentId);

        // Reset form
        setFormData({
          type: 'Incident',
          severity: 'Medium',
          description: '',
          location: '',
          photos: [],
          isEmergency: false,
        });
        setPhotoPreview([]);
        setGpsLocation(null);

        if (onSuccess) {
          onSuccess(response.incidentId);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit incident';
      setError(errorMessage);
      console.error('Error submitting incident:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message after submission
  if (submittedIncidentId) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Incident Reported Successfully</h2>
          <p className="text-gray-600 mb-6">Your incident has been recorded and assigned the following ID:</p>

          <div className="bg-sga-50 border-2 border-sga-700 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Incident ID</p>
            <p className="text-3xl font-bold text-sga-700">{submittedIncidentId}</p>
          </div>

          <p className="text-sm text-gray-600 mb-8">
            Please save this ID for your records. The safety team will review this incident shortly.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setSubmittedIncidentId(null)}
              className="px-6 py-3 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
            >
              Report Another Incident
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Incident</h2>
        <p className="text-gray-600">Quickly report safety incidents, near misses, or hazards</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Emergency Flag */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isEmergency"
              checked={formData.isEmergency}
              onChange={handleInputChange}
              className="w-6 h-6 text-red-600 rounded focus:ring-red-500"
            />
            <div>
              <span className="text-lg font-semibold text-red-900">Emergency Situation</span>
              <p className="text-sm text-red-700">Check if this requires immediate attention</p>
            </div>
          </label>
        </div>

        {/* Incident Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Incident Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent min-h-touch"
          >
            <option value="Incident">Incident</option>
            <option value="Near Miss">Near Miss</option>
            <option value="Hazard">Hazard Identification</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Severity <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['High', 'Medium', 'Low'] as const).map((severity) => (
              <button
                key={severity}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, severity }))}
                className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all min-h-touch ${
                  formData.severity === severity
                    ? severity === 'High'
                      ? 'bg-red-600 text-white border-red-600'
                      : severity === 'Medium'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-yellow-400 text-gray-900 border-yellow-400'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            placeholder="e.g., Building 3, Level 2, Near stairwell"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent min-h-touch"
          />
        </div>

        {/* GPS Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            GPS Location (Optional)
          </label>
          <button
            type="button"
            onClick={handleCaptureGps}
            disabled={isCapturingGps}
            className="w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
          >
            {isCapturingGps ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Capturing Location...
              </span>
            ) : gpsLocation ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Location Captured
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Capture GPS Location
              </span>
            )}
          </button>
          {gpsLocation && (
            <p className="mt-2 text-sm text-gray-600">
              Lat: {gpsLocation.latitude.toFixed(6)}, Lng: {gpsLocation.longitude.toFixed(6)}
            </p>
          )}
          {gpsError && (
            <p className="mt-2 text-sm text-red-600">{gpsError}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={5}
            placeholder="Describe what happened, when, and any other relevant details..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 bg-gray-50 text-gray-700 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium min-h-touch"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Add Photos
            </span>
          </button>

          {/* Photo Previews */}
          {photoPreview.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-touch"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Incident Report'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 min-h-touch"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default IncidentForm;
