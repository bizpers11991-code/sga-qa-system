import { useState, useRef } from 'react';
import { createNcr, NcrFormData, NcrAttachment } from '../../services/ncrApi';
import useAuth from '../../hooks/useAuth';

interface NcrFormProps {
  onSuccess?: (ncrId: string) => void;
  onCancel?: () => void;
}

const NcrForm = ({ onSuccess, onCancel }: NcrFormProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<NcrFormData>({
    jobReference: '',
    issueDescription: '',
    rootCause: '',
    correctiveAction: '',
    severity: 'Minor',
    assignedTo: '',
    attachments: [],
  });

  const [attachmentPreviews, setAttachmentPreviews] = useState<{ filename: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNcrId, setSubmittedNcrId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newAttachments: NcrAttachment[] = [];
      const newPreviews: { filename: string; type: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum file size is 10MB.`);
          continue;
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

        newAttachments.push({
          filename: file.name,
          dataUrl: base64,
          uploadedDate: new Date().toISOString(),
        });

        newPreviews.push({
          filename: file.name,
          type: file.type,
        });
      }

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      }));

      setAttachmentPreviews(prev => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Error processing files:', err);
      alert('Failed to process files. Please try again.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.jobReference.trim()) {
        throw new Error('Job reference is required');
      }
      if (!formData.issueDescription.trim()) {
        throw new Error('Issue description is required');
      }
      if (!formData.rootCause.trim()) {
        throw new Error('Root cause is required');
      }
      if (!formData.correctiveAction.trim()) {
        throw new Error('Corrective action is required');
      }

      // Prepare submission data
      const submissionData: NcrFormData = {
        ...formData,
        issuedBy: user?.name || user?.username || 'Unknown User',
        dateIssued: new Date().toISOString(),
      };

      const response = await createNcr(submissionData);

      if (response.success) {
        setSubmittedNcrId(response.ncrId);

        // Reset form
        setFormData({
          jobReference: '',
          issueDescription: '',
          rootCause: '',
          correctiveAction: '',
          severity: 'Minor',
          assignedTo: '',
          attachments: [],
        });
        setAttachmentPreviews([]);

        if (onSuccess) {
          onSuccess(response.ncrId);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create NCR';
      setError(errorMessage);
      console.error('Error creating NCR:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message after submission
  if (submittedNcrId) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">NCR Created Successfully</h2>
          <p className="text-gray-600 mb-6">Your Non-Conformance Report has been created and assigned the following ID:</p>

          <div className="bg-sga-50 border-2 border-sga-700 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">NCR ID</p>
            <p className="text-3xl font-bold text-sga-700">{submittedNcrId}</p>
          </div>

          <p className="text-sm text-gray-600 mb-8">
            Please save this ID for your records. The assigned team will review and address this NCR.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setSubmittedNcrId(null)}
              className="px-6 py-3 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-medium"
            >
              Create Another NCR
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
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Non-Conformance Report</h2>
        <p className="text-gray-600">Document quality issues and corrective actions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Reference */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Reference <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="jobReference"
            value={formData.jobReference}
            onChange={handleInputChange}
            required
            placeholder="e.g., JOB-2024-001"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Severity <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['Critical', 'Major', 'Minor'] as const).map((severity) => (
              <button
                key={severity}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, severity }))}
                className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                  formData.severity === severity
                    ? severity === 'Critical'
                      ? 'bg-red-600 text-white border-red-600'
                      : severity === 'Major'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-yellow-400 text-gray-900 border-yellow-400'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        {/* Issue Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Issue Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="issueDescription"
            value={formData.issueDescription}
            onChange={handleInputChange}
            required
            rows={4}
            placeholder="Describe the non-conformance issue in detail..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent resize-none"
          />
        </div>

        {/* Root Cause */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Root Cause Analysis <span className="text-red-500">*</span>
          </label>
          <textarea
            name="rootCause"
            value={formData.rootCause}
            onChange={handleInputChange}
            required
            rows={3}
            placeholder="Identify and explain the root cause of the issue..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent resize-none"
          />
        </div>

        {/* Corrective Action */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Corrective Action Plan <span className="text-red-500">*</span>
          </label>
          <textarea
            name="correctiveAction"
            value={formData.correctiveAction}
            onChange={handleInputChange}
            required
            rows={3}
            placeholder="Describe the corrective actions to be taken..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent resize-none"
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Assign To (Optional)
          </label>
          <input
            type="text"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleInputChange}
            placeholder="Enter name or email of person responsible"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sga-700 focus:border-transparent"
          />
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 bg-gray-50 text-gray-700 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Add Files
            </span>
          </button>
          <p className="mt-2 text-xs text-gray-500">Maximum file size: 10MB per file</p>

          {/* Attachment List */}
          {attachmentPreviews.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachmentPreviews.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate">{file.filename}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-sga-700 text-white rounded-lg hover:bg-sga-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating NCR...
              </span>
            ) : (
              'Create NCR'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NcrForm;
