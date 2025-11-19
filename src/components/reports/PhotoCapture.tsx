// components/reports/PhotoCapture.tsx

import { useState, useRef } from 'react';
import { optimizeImage } from '../../services/imageUtils';
import { JobSheetImage } from '../../types';

interface PhotoCaptureProps {
  photos: JobSheetImage[];
  onChange: (photos: JobSheetImage[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

const PhotoCapture = ({ photos, onChange, maxPhotos = 20, disabled = false }: PhotoCaptureProps) => {
  const [descriptions, setDescriptions] = useState<{ [key: number]: string }>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);

    try {
      const newPhotos: JobSheetImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file type
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image file:', file.name);
          continue;
        }

        // Check file size (10MB limit before compression)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        try {
          // Compress and optimize image
          const optimizedData = await optimizeImage(file);

          newPhotos.push({
            name: file.name,
            data: optimizedData,
          });
        } catch (error) {
          console.error('Failed to process image:', file.name, error);
          alert(`Failed to process ${file.name}`);
        }
      }

      onChange([...photos, ...newPhotos]);
    } finally {
      setUploading(false);

      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);

    // Remove description
    const newDescriptions = { ...descriptions };
    delete newDescriptions[index];
    setDescriptions(newDescriptions);
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const newDescriptions = { ...descriptions, [index]: description };
    setDescriptions(newDescriptions);

    // Update photo with description
    const newPhotos = [...photos];
    newPhotos[index] = {
      ...newPhotos[index],
      name: description || newPhotos[index].name,
    };
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCameraCapture}
          disabled={disabled || uploading || photos.length >= maxPhotos}
          className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sga-600 hover:bg-sga-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take Photo
        </button>

        <button
          type="button"
          onClick={handleFileSelect}
          disabled={disabled || uploading || photos.length >= maxPhotos}
          className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sga-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload from Files
        </button>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">Processing photos...</p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Count */}
      <div className="text-sm text-gray-600">
        {photos.length} of {maxPhotos} photos
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No photos</h3>
          <p className="mt-1 text-sm text-gray-500">Take a photo or upload from files to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative bg-white rounded-lg shadow-md overflow-hidden group">
              {/* Photo Preview */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <img
                  src={photo.data}
                  alt={photo.name || `Photo ${index + 1}`}
                  className="object-cover w-full h-48"
                />
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDeletePhoto(index)}
                disabled={disabled}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700 min-h-[44px] min-w-[44px]"
                title="Delete photo"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Description Input */}
              <div className="p-3">
                <input
                  type="text"
                  value={descriptions[index] || ''}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  disabled={disabled}
                  placeholder="Add description (optional)"
                  className="block w-full rounded border-gray-300 shadow-sm focus:border-sga-500 focus:ring-sga-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Photo {index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Photo Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Photos are automatically compressed for faster upload</li>
                <li>Maximum file size: 10MB before compression</li>
                <li>Supported formats: JPG, PNG, HEIC</li>
                <li>Add descriptions to help identify photos later</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;
