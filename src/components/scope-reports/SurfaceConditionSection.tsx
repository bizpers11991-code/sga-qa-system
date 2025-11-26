import React, { useRef } from 'react';
import { SurfaceCondition, ScopeReportPhoto } from '../../types/project-management';
import { Camera, X } from 'lucide-react';

interface SurfaceConditionSectionProps {
  value: SurfaceCondition;
  onChange: (value: SurfaceCondition) => void;
}

const CONDITIONS: Array<'Good' | 'Fair' | 'Poor' | 'Critical'> = ['Good', 'Fair', 'Poor', 'Critical'];
const DEFECTS = [
  'Cracking',
  'Potholing',
  'Rutting',
  'Bleeding',
  'Raveling',
  'Edge Break',
  'Delamination',
  'Shoving',
  'Depression',
  'Corrugation'
];

export function SurfaceConditionSection({ value, onChange }: SurfaceConditionSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDefect = (defect: string) => {
    const newDefects = value.defects.includes(defect)
      ? value.defects.filter(d => d !== defect)
      : [...value.defects, defect];

    onChange({ ...value, defects: newDefects });
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: ScopeReportPhoto[] = [];

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (event) => {
          const photo: ScopeReportPhoto = {
            name: file.name,
            data: event.target?.result as string,
            description: '',
            timestamp: new Date().toISOString()
          };
          newPhotos.push(photo);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    onChange({ ...value, photos: [...value.photos, ...newPhotos] });
  };

  const removePhoto = (index: number) => {
    const newPhotos = value.photos.filter((_, i) => i !== index);
    onChange({ ...value, photos: newPhotos });
  };

  const updatePhotoDescription = (index: number, description: string) => {
    const newPhotos = [...value.photos];
    newPhotos[index] = { ...newPhotos[index], description };
    onChange({ ...value, photos: newPhotos });
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      Good: 'bg-green-500',
      Fair: 'bg-yellow-500',
      Poor: 'bg-orange-500',
      Critical: 'bg-red-500'
    };
    return colors[condition as keyof typeof colors];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Surface Condition</h3>

      {/* Condition Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Condition
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CONDITIONS.map((condition) => (
            <button
              key={condition}
              type="button"
              onClick={() => onChange({ ...value, currentCondition: condition })}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                value.currentCondition === condition
                  ? `${getConditionColor(condition)} text-white border-transparent`
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>

      {/* Defects */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Defects Observed
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DEFECTS.map((defect) => (
            <button
              key={defect}
              type="button"
              onClick={() => toggleDefect(defect)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                value.defects.includes(defect)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {defect}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Capture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Surface Photos ({value.photos.length})
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handlePhotoCapture}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center"
        >
          <Camera className="w-5 h-5 mr-2" />
          Capture Photos
        </button>

        {/* Photo Grid */}
        {value.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {value.photos.map((photo, index) => (
              <div key={index} className="relative border rounded-lg overflow-hidden">
                <img
                  src={photo.data}
                  alt={`Surface photo ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Photo description..."
                  value={photo.description}
                  onChange={(e) => updatePhotoDescription(index, e.target.value)}
                  className="w-full px-2 py-1 text-sm border-t"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
