# Task: scope_report

**Worker:** deepseek
**Generated:** 2025-11-21T22:36:41.869848

---

Below is a complete implementation of the **Scope Report Form** for site visits in the SGA QA application using React, TypeScript, Tailwind CSS, `react-hook-form`, and `zod`. This includes validation, photo upload with preview, signature capture, draft saving, and submission handling.

---

### 1. Install Dependencies

Make sure you have the required dependencies installed:

```bash
npm install react-hook-form zod @hookform/resolvers tailwindcss @types/react @types/node react-signature-canvas filepond
```

---

### 2. `ScopeReportForm.tsx`

```tsx
import React, { useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SignatureCanvas from "react-signature-canvas";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(FilePondPluginImagePreview);

// Zod schema for form validation
const schema = z.object({
  jobReference: z.string().min(1, "Job Reference is required"),
  visitDateTime: z.string().min(1, "Visit Date & Time is required"),
  siteConditions: z.object({
    condition: z.string().min(1, "Select a site condition"),
    notes: z.string().optional(),
  }),
  accessRequirements: z.array(z.string()).nonempty("Select at least one access requirement"),
  safetyHazards: z.object({
    hazards: z.array(z.string()).nonempty("Select at least one hazard"),
    notes: z.string().optional(),
  }),
  resourceRequirements: z.string().min(1, "Resource Requirements are required"),
  photos: z.array(z.any()).max(10, "Maximum of 10 photos allowed"),
  recommendations: z.string().min(1, "Recommendations are required"),
  additionalNotes: z.string().optional(),
  digitalSignature: z.string().min(1, "Signature is required"),
});

type FormData = z.infer<typeof schema>;

const ScopeReportForm: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log("Form Data:", data);
    // Simulate API POST request
    fetch("/api/submit-scope-report", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
  };

  const saveDraft = (data: FormData) => {
    console.log("Draft Saved:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      {/* Job Reference */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Job Reference</label>
        <input {...register("jobReference")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        {errors.jobReference && <p className="text-red-500">{errors.jobReference.message}</p>}
      </div>

      {/* Visit Date & Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Visit Date & Time</label>
        <input type="datetime-local" {...register("visitDateTime")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        {errors.visitDateTime && <p className="text-red-500">{errors.visitDateTime.message}</p>}
      </div>

      {/* Site Conditions */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Site Conditions</label>
        <select {...register("siteConditions.condition")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
          <option value="">Select Condition</option>
          <option value="Dry">Dry</option>
          <option value="Wet">Wet</option>
          <option value="Muddy">Muddy</option>
        </select>
        <textarea {...register("siteConditions.notes")} placeholder="Notes" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        {errors.siteConditions?.condition && <p className="text-red-500">{errors.siteConditions.condition.message}</p>}
      </div>

      {/* Access Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Access Requirements</label>
        <div className="mt-2 space-y-2">
          {["Ladder", "Scaffolding", "Elevator", "Other"].map((item) => (
            <label key={item} className="flex items-center">
              <input type="checkbox" value={item} {...register("accessRequirements")} className="rounded border-gray-300 shadow-sm" />
              <span className="ml-2">{item}</span>
            </label>
          ))}
        </div>
        {errors.accessRequirements && <p className="text-red-500">{errors.accessRequirements.message}</p>}
      </div>

      {/* Safety Hazards */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Safety Hazards Identified</label>
        <div className="mt-2 space-y-2">
          {["Electrical", "Structural", "Chemical", "Other"].map((item) => (
            <label key={item} className="flex items-center">
              <input type="checkbox" value={item} {...register("safetyHazards.hazards")} className="rounded border-gray-300 shadow-sm" />
              <span className="ml-2">{item}</span>
            </label>
          ))}
        </div>
        <textarea {...register("safetyHazards.notes")} placeholder="Notes" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        {errors.safetyHazards?.hazards && <p className="text-red-500">{errors.safetyHazards.hazards.message}</p>}
      </div>

      {/* Resource Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Resource Requirements</label>
        <textarea {...register("resourceRequirements")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        {errors.resourceRequirements && <p className="text-red-500">{errors.resourceRequirements.message}</p>}
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Photos (Max 10)</label>
        <Controller
          name="photos"
          control={control}
          render={({ field }) => (
            <FilePond
              files={files}
              onupdatefiles={(fileItems) => {
                setFiles(fileItems.map((item) => item.file as File));
                field.onChange(fileItems.map((item) => item.file as File));
              }}
              allowMultiple={true}
              maxFiles={10}
              name="photos"
              credits={false}
            />
          )}
        />
        {errors.photos && <p className="text-red-500">{errors.photos.message}</p>}
      </div>

      {/* Recommendations */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Recommendations</label>
        <textarea {...register("recommendations")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        {errors.recommendations && <p className="text-red-500">{errors.recommendations.message}</p>}
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
        <textarea {...register("additionalNotes")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
      </div>

      {/* Digital Signature */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Digital Signature</label>
        <SignatureCanvas
          canvasProps={{ className: "border rounded-md bg-white" }}
          onEnd={(data) => setSignature(data.toDataURL())}
        />
        <input type="hidden" {...register("digitalSignature")} value={signature || ""} />
        {errors.digitalSignature && <p className="text-red-500">{errors.digitalSignature.message}</p>}
      </div>

      {/* Buttons */}
      <div className="flex space-x-4">
        <button type="button" onClick={handleSubmit(saveDraft)} className="bg-gray-500 text-white px-4 py-2 rounded">
          Save Draft
        </button>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Submit
        </button>
      </div>
    </form>
  );
};

export default ScopeReportForm;
```

---

### 3. Tailwind Configuration

Ensure `tailwind.config.js` is properly set up. Here’s a basic example:

```js
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "./public/index.html"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

### Notes:
- Replace the `/api/submit-scope-report` endpoint with your actual API endpoint.
- `react-signature-canvas` is used for digital signature capture.
- `filepond` handles photo uploads with preview.
- Draft saving is simulated using `saveDraft`. You can implement actual draft saving logic (e.g., localStorage or APIs) as needed.

This implementation ensures a clean, validated form tailored for the SGA QA application.