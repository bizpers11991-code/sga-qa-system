/**
 * @file src/api/qa-forms/validate-temperature.ts
 * @description POST /api/qa-forms/validate-temperature - Validate asphalt temperatures
 * Uses MRWA Spec 504/508 validation rules
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  validateDeliveryTemperature,
  validatePavementTemperature,
  AsphaltMixTypes,
  SPEC_REQUIREMENTS_SUMMARY,
} from '@/lib/validation/mrwa-specs';

// Request validation schema
const TemperatureValidationSchema = z.object({
  deliveryTemp: z.number().optional(),
  placementTemp: z.number().optional(),
  pavementTemp: z.number().optional(),
  windSpeedKmh: z.number().optional().default(0),
  mixType: z.enum(['DGA-Bitumen', 'DGA-PMB', 'Warm-Mix']).optional().default('DGA-PMB'),
  isPMB: z.boolean().optional().default(true),
  hasWorkabilityAdditive: z.boolean().optional().default(false),
});

type TemperatureValidationRequest = z.infer<typeof TemperatureValidationSchema>;

interface ValidationResult {
  valid: boolean;
  message: string;
  range?: { min: number; max: number };
  minRequired?: number;
}

interface TemperatureValidationResponse {
  success: boolean;
  validations: {
    deliveryTemp?: ValidationResult;
    placementTemp?: ValidationResult;
    pavementTemp?: ValidationResult;
  };
  allValid: boolean;
  requirements: typeof SPEC_REQUIREMENTS_SUMMARY.asphalt.deliveryTemp;
}

/**
 * Handler for POST /api/qa-forms/validate-temperature
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void | VercelResponse> {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are accepted',
    });
  }

  try {
    // Validate request body
    const data = TemperatureValidationSchema.parse(req.body);

    const validations: TemperatureValidationResponse['validations'] = {};
    let allValid = true;

    // Validate delivery temperature
    if (data.deliveryTemp !== undefined) {
      const result = validateDeliveryTemperature(
        data.deliveryTemp,
        data.mixType as keyof typeof AsphaltMixTypes
      );
      validations.deliveryTemp = result;
      if (!result.valid) allValid = false;
    }

    // Validate placement temperature (same logic as delivery for now)
    if (data.placementTemp !== undefined) {
      const result = validateDeliveryTemperature(
        data.placementTemp,
        data.mixType as keyof typeof AsphaltMixTypes
      );
      // Adjust message for placement temp
      validations.placementTemp = {
        ...result,
        message: result.message.replace('Delivery', 'Placement'),
      };
      if (!result.valid) allValid = false;
    }

    // Validate pavement temperature
    if (data.pavementTemp !== undefined) {
      const result = validatePavementTemperature(
        data.pavementTemp,
        data.windSpeedKmh || 0,
        data.isPMB,
        data.hasWorkabilityAdditive
      );
      validations.pavementTemp = result;
      if (!result.valid) allValid = false;
    }

    const response: TemperatureValidationResponse = {
      success: true,
      validations,
      allValid,
      requirements: SPEC_REQUIREMENTS_SUMMARY.asphalt.deliveryTemp,
    };

    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Temperature validation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate temperatures',
    });
  }
}
