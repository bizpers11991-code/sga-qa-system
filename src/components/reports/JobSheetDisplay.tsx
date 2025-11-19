import React from 'react';
import { DailyJobSheetData, Job } from '../../types';

const hasValue = (value: any): boolean => {
  if (value === null || typeof value === 'undefined') return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) return false;
    return Object.values(value).some(v => hasValue(v));
  }
  return true;
};

const renderSafely = (value: any): React.ReactNode => {
  if (!hasValue(value)) return '---';
  if (React.isValidElement(value) || typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    if ('name' in value && value.name) {
      return ('phone' in value && value.phone) ? `${value.name} (${value.phone})` : value.name;
    }
    return '[Complex Data]';
  }
  return 'Invalid Data';
};

const isMapUrl = (text: string | undefined) => {
  if (!text) return false;
  return /^(https?:\/\/)?(www\.)?(maps\.app\.goo\.gl|maps\.google\.com|maps\.apple\.com|goo\.gl|apple\.co)/i.test(text);
};

const renderLocation = (location: string, mapLink?: string) => {
  const link = mapLink || (isMapUrl(location) ? location : null);
  if (link) {
    const href = link.startsWith('http') ? link : `https://${link}`;
    return (
      <div>
        <p>{location}</p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
          Open in Maps
        </a>
      </div>
    );
  }
  return <p>{location}</p>;
};

const DetailCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className,
}) => (
  <div className={`p-3 bg-gray-50 border border-gray-200 rounded-md h-full ${className || ''}`}>
    <h4 className="font-bold text-sga-700">{title}</h4>
    <div className="mt-1 text-sm text-gray-700">{children}</div>
  </div>
);

interface JobSheetDisplayProps {
  job: Job;
  jobSheet: DailyJobSheetData | undefined;
}

export const JobSheetDisplay: React.FC<JobSheetDisplayProps> = ({ job, jobSheet }) => {
  if (!jobSheet || Object.keys(jobSheet).length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-white border rounded-lg shadow-md">
        <h3 className="text-xl font-bold">No Job Sheet Data</h3>
        <p className="mt-2">This is a manually created job. All data will be entered in the following tabs.</p>
      </div>
    );
  }

  if (job.division === 'Profiling') {
    return <ProfilingJobSheetDisplay jobSheet={jobSheet} />;
  }

  if (job.division === 'Spray') {
    return <SprayJobSheetDisplay job={job} jobSheet={jobSheet} />;
  }

  return <StandardJobSheetDisplay job={job} jobSheet={jobSheet} />;
};

const StandardJobSheetDisplay: React.FC<{ job: Job; jobSheet: DailyJobSheetData }> = ({ job, jobSheet }) => (
  <div className="p-6 space-y-4 bg-white border border-gray-200 rounded-lg shadow-md">
    <h3 className="text-xl font-bold text-sga-700">Daily Job Sheet</h3>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailCard title="Project">
        <p>{jobSheet.projectName || job.projectName}</p>
        {hasValue(jobSheet.asphaltPlant) && <p className="text-xs text-gray-500">{jobSheet.asphaltPlant}</p>}
      </DetailCard>
      <DetailCard title="Location">{renderLocation(job.location, jobSheet.mapLink)}</DetailCard>
    </div>

    <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
      <DetailCard title="Date & Shift">
        <p>{jobSheet.date}</p>
        <p>{jobSheet.dayShift ? 'Day Shift' : 'Night Shift'}</p>
      </DetailCard>
      {(hasValue(jobSheet.startTimeInYard) || hasValue(jobSheet.estimatedFinishTime)) && (
        <DetailCard title="Times">
          {hasValue(jobSheet.startTimeInYard) && <p>Start in Yard: {jobSheet.startTimeInYard}</p>}
          {hasValue(jobSheet.estimatedFinishTime) && <p>Est. Finish: {jobSheet.estimatedFinishTime}</p>}
        </DetailCard>
      )}
      {hasValue(jobSheet.asphaltForeman) && (
        <DetailCard title="Foreman">
          <p>{jobSheet.asphaltForeman}</p>
        </DetailCard>
      )}
    </div>

    {hasValue(jobSheet.jobMaterials) && (
      <DetailCard title="Material">
        {(jobSheet.jobMaterials || []).map((material, index) => (
          <div
            key={index}
            className={index > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}
          >
            <p>
              <strong>Mix:</strong> {material.mixCode}
            </p>
            <p>
              <strong>Tonnes:</strong> {material.tonnes} | <strong>Area:</strong> {material.area}m² |{' '}
              <strong>Depth:</strong> {material.aveDepth}mm
            </p>
          </div>
        ))}
      </DetailCard>
    )}

    {hasValue(jobSheet.jobDetails) && (
      <DetailCard title="Job Details & Instructions">
        <div className="space-y-1">
          {(jobSheet.jobDetails || []).map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </DetailCard>
    )}

    {hasValue(jobSheet.equipment) && (
      <DetailCard title="Equipment">
        <ul className="space-y-1 list-disc list-inside">
          {(jobSheet.equipment || []).map((eq, i) => (
            <li key={i}>
              {eq.vehicle} ({eq.item}) - {eq.comments || 'No comment'}
            </li>
          ))}
        </ul>
      </DetailCard>
    )}

    {jobSheet.jobSheetImages && jobSheet.jobSheetImages.length > 0 && (
      <DetailCard title="Job Sheet Images">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {jobSheet.jobSheetImages.map((img, i) => (
            <a key={i} href={img.data} target="_blank" rel="noopener noreferrer">
              <img src={img.data} alt={img.name} className="object-cover w-full h-auto rounded-md border" />
            </a>
          ))}
        </div>
      </DetailCard>
    )}
  </div>
);

const ProfilingJobSheetDisplay: React.FC<{ jobSheet: DailyJobSheetData }> = ({ jobSheet }) => {
  const { profilers, trucks } = jobSheet;

  return (
    <div className="p-6 space-y-4 bg-white border border-gray-200 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-sga-700">Profiling Job Sheet</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasValue(jobSheet.date) && (
          <DetailCard title="Date Required">
            <p>{jobSheet.date}</p>
          </DetailCard>
        )}
        {hasValue(jobSheet.crewLeader) && (
          <DetailCard title="Crew Leader">
            <p>{renderSafely(jobSheet.crewLeader)}</p>
          </DetailCard>
        )}
        {hasValue(jobSheet.crew) && (
          <DetailCard title="Crew">
            <p>{renderSafely(jobSheet.crew)}</p>
          </DetailCard>
        )}
        {hasValue(jobSheet.client) && (
          <DetailCard title="Client">
            <p>{jobSheet.client}</p>
          </DetailCard>
        )}
      </div>

      {(profilers && profilers.length > 0) || (trucks && trucks.length > 0) ? (
        <DetailCard title="Plant Requirements" className="!bg-gray-100">
          {profilers && profilers.length > 0 && (
            <div>
              <h5 className="font-semibold text-lg mb-2">Profilers</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 text-left">Machine</th>
                      <th className="p-2 text-left">Start Time</th>
                      <th className="p-2 text-left">Supplier</th>
                      <th className="p-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profilers.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{p.machine}</td>
                        <td className="p-2">{p.startTime}</td>
                        <td className="p-2">{p.supplier}</td>
                        <td className="p-2">{p.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DetailCard>
      ) : null}
    </div>
  );
};

const SprayJobSheetDisplay: React.FC<{ job: Job; jobSheet: DailyJobSheetData }> = ({ job, jobSheet }) => (
  <div className="p-6 space-y-4 bg-white border border-gray-200 rounded-lg shadow-md">
    <h3 className="text-xl font-bold text-sga-700">Spray Job Sheet</h3>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailCard title="Project">
        <p>{jobSheet.projectName || job.projectName}</p>
        {hasValue(jobSheet.asphaltPlant) && <p className="text-xs text-gray-500">Source: {jobSheet.asphaltPlant}</p>}
      </DetailCard>
      <DetailCard title="Location">{renderLocation(job.location, jobSheet.mapLink)}</DetailCard>
    </div>

    {hasValue(jobSheet.jobMaterials) && (
      <DetailCard title="Material">
        <p>
          <strong>Product:</strong> {jobSheet.jobMaterials?.[0]?.mixCode}
        </p>
        <p>
          <strong>Quantity:</strong> {jobSheet.jobMaterials?.[0]?.tonnes} Litres
        </p>
      </DetailCard>
    )}
  </div>
);

export default JobSheetDisplay;
