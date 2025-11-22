import React, { useState, useEffect } from 'react';
import type { DamagePhoto } from '../../types';

interface DamagePhotosFormProps {
  initialData: DamagePhoto[];
  onUpdate: (data: DamagePhoto[]) => void;
}

const formStyles = {
  button: "px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50",
  removeButton: "absolute top-1 right-1 px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700",
  input: "w-full p-2 mt-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
};

const DamagePhotosForm: React.FC<DamagePhotosFormProps> = ({ initialData, onUpdate }) => {
  const [photos, setPhotos] = useState<DamagePhoto[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onUpdate(photos);
  }, [photos, onUpdate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    const newPhotos: DamagePhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = (event) => {
            if (event.target?.result) {
              newPhotos.push({
                name: file.name,
                data: event.target.result as string,
                description: ''
              });
            }
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsLoading(false);
    e.target.value = '';
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].description = description;
    setPhotos(updatedPhotos);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-xl font-bold text-amber-600">Damage Photos</h3>

      <div>
        <label htmlFor="damage-photo-upload" className={formStyles.button}>
          {isLoading ? 'Loading...' : '+ Add Photos of Damage'}
        </label>
        <input
          id="damage-photo-upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Upload photos of any damage that occurred (e.g., over-profiling, damaged kerbs, etc.) and provide a description for each.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="border border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
            <div className="relative aspect-square">
              <img src={photo.data} alt={photo.name} className="object-cover w-full h-full" />
              <button
                onClick={() => removePhoto(index)}
                className={formStyles.removeButton}
                title="Remove photo"
                type="button"
              >
                &times;
              </button>
            </div>
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-700 truncate dark:text-gray-300">{photo.name}</p>
              <textarea
                value={photo.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder="Add a description..."
                rows={2}
                className={formStyles.input}
              />
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && !isLoading && (
        <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600">
          Click "Add Photos" button above to upload damage photos.
        </div>
      )}
    </div>
  );
};

export default DamagePhotosForm;
