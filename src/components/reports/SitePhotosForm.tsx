import React, { useState, useEffect } from 'react';
import { SitePhoto } from '../../types';
import { optimizeImage } from '../../services/imageUtils';
import VoiceInput from '../common/VoiceInput';
import { X } from 'lucide-react';

interface SitePhotosFormProps {
  initialData: SitePhoto[];
  onUpdate: (data: SitePhoto[]) => void;
}

export const SitePhotosForm: React.FC<SitePhotosFormProps> = ({ initialData, onUpdate }) => {
  const [photos, setPhotos] = useState<SitePhoto[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    onUpdate(photos);
  }, [photos, onUpdate]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);

    const optimizationPromises = Array.from(files).map(async (file: File): Promise<SitePhoto | null> => {
      try {
        const optimizedDataUrl = await optimizeImage(file);
        return { name: file.name, data: optimizedDataUrl, description: '' };
      } catch (error) {
        console.error('Error optimizing image:', error);
        return null;
      }
    });

    const newPhotos = (await Promise.all(optimizationPromises)).filter((p): p is SitePhoto => p !== null);

    setPhotos((prev) => [...prev, ...newPhotos]);
    setIsLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].description = description;
    setPhotos(updatedPhotos);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    handleDrag(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    handleDrag(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-sga-700">Site Photos</h3>

      <div>
        <label
          htmlFor="photo-upload"
          className="inline-block px-4 py-2 text-sm font-semibold text-white bg-sga-700 rounded-md hover:bg-sga-800 cursor-pointer"
        >
          {isLoading ? 'Processing...' : '+ Add Photos'}
        </label>
        <input
          id="photo-upload"
          type="file"
          multiple
          accept="image/jpeg, image/png, image/gif"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <p className="mt-2 text-sm text-gray-500">
          Upload any relevant photos from the site for the day's work. You can add an optional caption for each
          photo.
        </p>
      </div>

      <div
        className="relative"
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-sga-500 bg-opacity-20 border-2 border-dashed border-sga-600 rounded-lg pointer-events-none">
            <p className="font-semibold text-sga-700">Drop images to upload</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="relative aspect-square">
                <img src={photo.data} alt={photo.name} className="object-cover w-full h-full" />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 text-white bg-red-600 rounded-full hover:bg-red-700"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-700 truncate">{photo.name}</p>
                <VoiceInput onTextChange={(text) => handleDescriptionChange(index, text)} currentValue={photo.description || ''}>
                  <textarea
                    value={photo.description || ''}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    placeholder="Add an optional caption..."
                    rows={2}
                    className="w-full p-1 mt-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sga-500 focus:border-sga-500"
                  />
                </VoiceInput>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && !isLoading && (
          <div
            className={`py-8 text-center text-gray-400 border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? 'border-sga-500' : 'border-gray-300'
            }`}
          >
            Drag & drop photos here, or use the "Add Photos" button.
          </div>
        )}
      </div>
    </div>
  );
};

export default SitePhotosForm;
