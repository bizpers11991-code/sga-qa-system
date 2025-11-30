/**
 * MRWA Specification Validation Rules
 *
 * This file contains validation rules derived from:
 * - MRWA Spec 504: Dense Graded Asphalt Wearing Course
 * - MRWA Spec 508: Cold Planing (Profiling)
 *
 * These rules are used for automatic validation of asphalt placement
 * and profiling data in QA forms.
 */

import { z } from 'zod';

// ============================================================================
// MRWA SPEC 504 - DENSE GRADED ASPHALT WEARING COURSE
// ============================================================================

/**
 * Asphalt mix types with their specific requirements
 */
export const AsphaltMixTypes = {
  DGA_BITUMEN: 'DGA-Bitumen',
  DGA_PMB: 'DGA-PMB',
  WARM_MIX: 'Warm-Mix',
} as const;

export type AsphaltMixType = typeof AsphaltMixTypes[keyof typeof AsphaltMixTypes];

/**
 * Temperature requirements by mix type (MRWA Spec 504 Section 10.2)
 */
export const DELIVERY_TEMPERATURE_RANGES = {
  [AsphaltMixTypes.DGA_BITUMEN]: { min: 140, max: 170, unit: '°C' },
  [AsphaltMixTypes.DGA_PMB]: { min: 160, max: 185, unit: '°C' },
  [AsphaltMixTypes.WARM_MIX]: { min: 135, max: 155, unit: '°C' },
} as const;

/**
 * Minimum pavement temperature requirements (MRWA Spec 504 Section 10.3)
 * Based on wind conditions and mix type
 */
export const PAVEMENT_TEMPERATURE_REQUIREMENTS = {
  PMB: {
    calm: 20, // °C - wind < 15 km/h
    moderate: 22, // °C - wind 15-25 km/h
    windy: 25, // °C - wind > 25 km/h
  },
  PMB_WITH_ADDITIVE: {
    calm: 10, // °C - wind < 15 km/h
    moderate: 12, // °C - wind 15-25 km/h
    windy: 15, // °C - wind > 25 km/h
  },
  STANDARD: {
    calm: 15, // °C
    moderate: 17, // °C
    windy: 20, // °C
  },
} as const;

/**
 * Surface shape tolerances (MRWA Spec 504 Section 11.3)
 */
export const SURFACE_TOLERANCES = {
  longitudinal: { maxDeviation: 3, measureLength: 3000, unit: 'mm' }, // 3mm over 3m
  transverse: { maxDeviation: 5, measureLength: 3000, unit: 'mm' }, // 5mm over 3m
  jointDeviation: { maxTransverse: 3, maxLongitudinal: 5, unit: 'mm' },
} as const;

/**
 * Density requirements (MRWA Spec 504 Section 11.4)
 */
export const DENSITY_REQUIREMENTS = {
  standard: { minMarshallDensity: 93, unit: '%' }, // Characteristic value
  sharedPaths: { minMarshallDensity: 91, unit: '%' }, // For shared paths
  individual: { minMarshallDensity: 90, unit: '%' }, // Individual test result
} as const;

/**
 * Tack coat application rate (MRWA Spec 504 Section 9.3)
 */
export const TACK_COAT_RATE = {
  standard: 0.6, // L/m² dilute emulsion
  minResidual: 0.43, // L/m² residual bitumen
  unit: 'L/m²',
} as const;

/**
 * Core sampling requirements (MRWA Spec 504 Section 11.4.2)
 */
export const CORE_SAMPLING = {
  takeWithin: 24, // hours after placement
  resultsWithin: 48, // hours after taking
  frequency: 'per lot as defined in Cl 234',
} as const;

// ============================================================================
// MRWA SPEC 508 - COLD PLANING (PROFILING)
// ============================================================================

/**
 * Cold planing drum types
 */
export const ProfilingDrumTypes = {
  FINE: 'Fine',
  STANDARD: 'Standard',
} as const;

/**
 * Depth tolerances (MRWA Spec 508 Section 8.1)
 */
export const PROFILING_DEPTH_TOLERANCE = {
  average: 3, // ±3mm from specified depth
  unit: 'mm',
} as const;

/**
 * Surface texture requirements (MRWA Spec 508 Section 8.2)
 */
export const PROFILING_SURFACE_TEXTURE = {
  type1: {
    averageMax: 2.0, // mm
    individualMax: 2.3, // mm at any location
    unit: 'mm',
  },
  type2: {
    averageMax: 3.0, // mm
    individualMax: 3.5, // mm at any location
    unit: 'mm',
  },
} as const;

/**
 * Drum groove spacing (MRWA Spec 508 Section 6.2)
 */
export const DRUM_SPECIFICATIONS = {
  fine: {
    maxToolSpacing: 8, // mm
    grooveDepth: 5, // mm max
  },
  standard: {
    toolSpacing: 15, // mm
    grooveDepth: 5, // mm max
  },
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates delivery temperature against mix type requirements
 */
export function validateDeliveryTemperature(
  temperature: number,
  mixType: AsphaltMixType
): { valid: boolean; message: string; range?: { min: number; max: number } } {
  const range = DELIVERY_TEMPERATURE_RANGES[mixType];
  if (!range) {
    return { valid: false, message: `Unknown mix type: ${mixType}` };
  }

  if (temperature < range.min) {
    return {
      valid: false,
      message: `Temperature ${temperature}°C is below minimum ${range.min}°C for ${mixType}`,
      range: { min: range.min, max: range.max },
    };
  }

  if (temperature > range.max) {
    return {
      valid: false,
      message: `Temperature ${temperature}°C exceeds maximum ${range.max}°C for ${mixType}`,
      range: { min: range.min, max: range.max },
    };
  }

  return {
    valid: true,
    message: `Temperature ${temperature}°C is within acceptable range (${range.min}-${range.max}°C)`,
    range: { min: range.min, max: range.max },
  };
}

/**
 * Validates pavement temperature based on wind conditions
 */
export function validatePavementTemperature(
  temperature: number,
  windSpeedKmh: number,
  isPMB: boolean = false,
  hasWorkabilityAdditive: boolean = false
): { valid: boolean; message: string; minRequired: number } {
  // Select requirements based on mix type
  const requirements: { calm: number; moderate: number; windy: number } = isPMB
    ? (hasWorkabilityAdditive
        ? PAVEMENT_TEMPERATURE_REQUIREMENTS.PMB_WITH_ADDITIVE
        : PAVEMENT_TEMPERATURE_REQUIREMENTS.PMB)
    : PAVEMENT_TEMPERATURE_REQUIREMENTS.STANDARD;

  let minRequired: number;
  if (windSpeedKmh < 15) {
    minRequired = requirements.calm;
  } else if (windSpeedKmh <= 25) {
    minRequired = requirements.moderate;
  } else {
    minRequired = requirements.windy;
  }

  if (temperature < minRequired) {
    return {
      valid: false,
      message: `Pavement temperature ${temperature}°C is below minimum ${minRequired}°C for current wind conditions (${windSpeedKmh} km/h)`,
      minRequired,
    };
  }

  return {
    valid: true,
    message: `Pavement temperature ${temperature}°C meets minimum requirement of ${minRequired}°C`,
    minRequired,
  };
}

/**
 * Validates straight edge test results against tolerances
 */
export function validateStraightEdgeResult(
  deviation: number,
  type: 'longitudinal' | 'transverse' | 'joint'
): { valid: boolean; message: string; maxAllowed: number } {
  let maxAllowed: number;

  if (type === 'joint') {
    maxAllowed = SURFACE_TOLERANCES.jointDeviation.maxTransverse;
  } else {
    maxAllowed = SURFACE_TOLERANCES[type].maxDeviation;
  }

  if (deviation > maxAllowed) {
    return {
      valid: false,
      message: `${type} deviation of ${deviation}mm exceeds maximum allowed ${maxAllowed}mm`,
      maxAllowed,
    };
  }

  return {
    valid: true,
    message: `${type} deviation of ${deviation}mm is within tolerance (max ${maxAllowed}mm)`,
    maxAllowed,
  };
}

/**
 * Validates Marshall density test result
 */
export function validateMarshallDensity(
  density: number,
  isSharedPath: boolean = false,
  isCharacteristic: boolean = true
): { valid: boolean; message: string; minRequired: number } {
  let minRequired: number;

  if (!isCharacteristic) {
    minRequired = DENSITY_REQUIREMENTS.individual.minMarshallDensity;
  } else if (isSharedPath) {
    minRequired = DENSITY_REQUIREMENTS.sharedPaths.minMarshallDensity;
  } else {
    minRequired = DENSITY_REQUIREMENTS.standard.minMarshallDensity;
  }

  if (density < minRequired) {
    return {
      valid: false,
      message: `Marshall density ${density}% is below minimum required ${minRequired}%`,
      minRequired,
    };
  }

  return {
    valid: true,
    message: `Marshall density ${density}% meets minimum requirement of ${minRequired}%`,
    minRequired,
  };
}

/**
 * Validates profiling depth against specification
 */
export function validateProfilingDepth(
  actualDepth: number,
  specifiedDepth: number
): { valid: boolean; message: string; tolerance: number } {
  const tolerance = PROFILING_DEPTH_TOLERANCE.average;
  const deviation = Math.abs(actualDepth - specifiedDepth);

  if (deviation > tolerance) {
    return {
      valid: false,
      message: `Depth deviation of ${deviation}mm exceeds tolerance of ±${tolerance}mm (Actual: ${actualDepth}mm, Specified: ${specifiedDepth}mm)`,
      tolerance,
    };
  }

  return {
    valid: true,
    message: `Depth ${actualDepth}mm is within tolerance of ±${tolerance}mm from specified ${specifiedDepth}mm`,
    tolerance,
  };
}

/**
 * Validates surface texture after profiling
 */
export function validateSurfaceTexture(
  textureDepth: number,
  type: 'type1' | 'type2' = 'type1',
  isAverage: boolean = true
): { valid: boolean; message: string; maxAllowed: number } {
  const requirements = PROFILING_SURFACE_TEXTURE[type];
  const maxAllowed = isAverage ? requirements.averageMax : requirements.individualMax;

  if (textureDepth > maxAllowed) {
    return {
      valid: false,
      message: `Surface texture ${textureDepth}mm exceeds ${isAverage ? 'average' : 'individual'} maximum of ${maxAllowed}mm for ${type}`,
      maxAllowed,
    };
  }

  return {
    valid: true,
    message: `Surface texture ${textureDepth}mm is within ${isAverage ? 'average' : 'individual'} limit of ${maxAllowed}mm`,
    maxAllowed,
  };
}

// ============================================================================
// ZOD SCHEMAS FOR FORM VALIDATION
// ============================================================================

/**
 * Schema for asphalt temperature compliance
 */
export const AsphaltTemperatureSchema = z.object({
  deliveryTemp: z.number()
    .min(130, 'Delivery temperature cannot be below 130°C')
    .max(200, 'Delivery temperature cannot exceed 200°C'),
  placementTemp: z.number()
    .min(120, 'Placement temperature cannot be below 120°C')
    .max(190, 'Placement temperature cannot exceed 190°C'),
  mixType: z.enum(['DGA-Bitumen', 'DGA-PMB', 'Warm-Mix']),
}).refine((data) => {
  const result = validateDeliveryTemperature(data.deliveryTemp, data.mixType as AsphaltMixType);
  return result.valid;
}, {
  message: 'Delivery temperature out of range for specified mix type',
  path: ['deliveryTemp'],
});

/**
 * Schema for straight edge test data
 */
export const StraightEdgeTestSchema = z.object({
  longitudinal: z.number()
    .min(0, 'Deviation cannot be negative')
    .max(10, 'Deviation seems unusually high'),
  transverse: z.number()
    .min(0, 'Deviation cannot be negative')
    .max(15, 'Deviation seems unusually high'),
  join: z.number()
    .min(0, 'Deviation cannot be negative')
    .max(10, 'Deviation seems unusually high')
    .optional(),
}).refine((data) => {
  return validateStraightEdgeResult(data.longitudinal, 'longitudinal').valid;
}, {
  message: `Longitudinal deviation exceeds ${SURFACE_TOLERANCES.longitudinal.maxDeviation}mm tolerance`,
  path: ['longitudinal'],
}).refine((data) => {
  return validateStraightEdgeResult(data.transverse, 'transverse').valid;
}, {
  message: `Transverse deviation exceeds ${SURFACE_TOLERANCES.transverse.maxDeviation}mm tolerance`,
  path: ['transverse'],
});

/**
 * Schema for profiling depth validation
 */
export const ProfilingDepthSchema = z.object({
  specifiedDepth: z.number().positive('Specified depth must be positive'),
  actualDepth: z.number().positive('Actual depth must be positive'),
}).refine((data) => {
  const result = validateProfilingDepth(data.actualDepth, data.specifiedDepth);
  return result.valid;
}, {
  message: `Depth deviation exceeds ±${PROFILING_DEPTH_TOLERANCE.average}mm tolerance`,
  path: ['actualDepth'],
});

/**
 * Schema for density test validation
 */
export const DensityTestSchema = z.object({
  marshallDensity: z.number()
    .min(80, 'Density cannot be below 80%')
    .max(105, 'Density cannot exceed 105%'),
  isSharedPath: z.boolean().default(false),
}).refine((data) => {
  const result = validateMarshallDensity(data.marshallDensity, data.isSharedPath);
  return result.valid;
}, {
  message: 'Marshall density below minimum requirement',
  path: ['marshallDensity'],
});

// ============================================================================
// EXPORT SUMMARY CONSTANTS FOR UI DISPLAY
// ============================================================================

/**
 * Summary of key requirements for display in forms
 */
export const SPEC_REQUIREMENTS_SUMMARY = {
  asphalt: {
    deliveryTemp: {
      bitumen: '140-170°C',
      pmb: '160-185°C',
      warmMix: '135-155°C',
    },
    surfaceTolerances: {
      longitudinal: '≤3mm over 3m',
      transverse: '≤5mm over 3m',
      joint: '≤3mm transverse, ≤5mm longitudinal',
    },
    density: {
      standard: '≥93%',
      sharedPath: '≥91%',
      individual: '≥90%',
    },
    tackCoat: '0.6 L/m² (0.43 L/m² residual)',
  },
  profiling: {
    depthTolerance: '±3mm',
    surfaceTexture: {
      type1: '≤2.0mm avg, ≤2.3mm individual',
      type2: '≤3.0mm avg, ≤3.5mm individual',
    },
    drumSpacing: {
      fine: '≤8mm',
      standard: '15mm',
    },
  },
} as const;
