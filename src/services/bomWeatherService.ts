/**
 * SGA QA Pack - Bureau of Meteorology (BOM) Weather Service
 * ==========================================================
 * Official Australian weather data from api.weather.bom.gov.au
 *
 * Features:
 * - Real-time observations from BOM weather stations
 * - Hourly and daily forecasts
 * - Australian-specific data: UV index, fire danger ratings
 * - Weather warnings and alerts
 * - Location search by name or coordinates
 *
 * Data Attribution: Bureau of Meteorology (https://www.bom.gov.au)
 */

// ============================================================================
// GEOHASH UTILITIES
// ============================================================================

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode latitude/longitude to geohash string
 * BOM API uses 7-character geohashes for location identification
 */
export function encodeGeohash(latitude: number, longitude: number, precision: number = 7): string {
  let latRange = { min: -90.0, max: 90.0 };
  let lngRange = { min: -180.0, max: 180.0 };
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isEven = true;

  while (hash.length < precision) {
    if (isEven) {
      const mid = (lngRange.min + lngRange.max) / 2;
      if (longitude >= mid) {
        ch |= 1 << (4 - bit);
        lngRange.min = mid;
      } else {
        lngRange.max = mid;
      }
    } else {
      const mid = (latRange.min + latRange.max) / 2;
      if (latitude >= mid) {
        ch |= 1 << (4 - bit);
        latRange.min = mid;
      } else {
        latRange.max = mid;
      }
    }

    isEven = !isEven;
    bit++;

    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

// ============================================================================
// BOM API TYPES
// ============================================================================

export interface BOMLocation {
  id: string;
  geohash: string;
  name: string;
  state: string;
  postcode?: string;
}

export interface BOMObservation {
  temp: number;
  temp_feels_like: number | null;
  humidity: number;
  wind: {
    speed_kilometre: number;
    speed_knot: number;
    direction: string;
    gust_speed_kilometre?: number;
  };
  rain_since_9am: number;
  station: {
    name: string;
    distance: number;
  };
}

export interface BOMHourlyForecast {
  time: string;
  temp: number;
  icon_descriptor: string;
  rain: {
    chance: number;
    amount: { min: number; max: number | null };
  };
  wind: {
    speed_kilometre: number;
    direction: string;
  };
  humidity: number;
  is_night: boolean;
}

export interface BOMDailyForecast {
  date: string;
  temp_min: number | null;
  temp_max: number | null;
  icon_descriptor: string;
  short_text: string;
  extended_text: string;
  rain: {
    chance: number;
    amount: { min: number; max: number | null };
  };
  uv: {
    category: string;
    max_index: number;
    start_time: string;
    end_time: string;
  } | null;
  fire_danger: string | null;
  fire_danger_category: {
    text: string;
    default_colour: string;
  } | null;
  astronomical: {
    sunrise_time: string;
    sunset_time: string;
  };
  now?: {
    is_night: boolean;
    temp_now: number;
    temp_later: number;
  };
}

export interface BOMWarning {
  id: string;
  title: string;
  short_title: string;
  type: string;
  state: string;
  issue_time: string;
  expiry_time: string;
  phase: string;
}

export interface BOMWeatherData {
  location: BOMLocation;
  observation: BOMObservation | null;
  hourlyForecast: BOMHourlyForecast[];
  dailyForecast: BOMDailyForecast[];
  warnings: BOMWarning[];
  lastUpdated: Date;
}

// ============================================================================
// BOM API CLIENT
// ============================================================================

const BOM_API_BASE = 'https://api.weather.bom.gov.au/v1';

/**
 * Search for locations by name
 */
export async function searchBOMLocations(query: string): Promise<BOMLocation[]> {
  const response = await fetch(`${BOM_API_BASE}/locations?search=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error(`BOM location search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.map((loc: any) => ({
    id: loc.id,
    geohash: loc.geohash,
    name: loc.name,
    state: loc.state,
    postcode: loc.postcode,
  })) || [];
}

/**
 * Get location info from geohash
 */
export async function getBOMLocation(geohash: string): Promise<BOMLocation | null> {
  try {
    // Try to get location metadata from daily forecast
    const response = await fetch(`${BOM_API_BASE}/locations/${geohash}/forecasts/daily`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: geohash,
      geohash: geohash,
      name: data.metadata?.name || 'Unknown',
      state: data.metadata?.state || '',
    };
  } catch {
    return null;
  }
}

/**
 * Get current observations for a location
 */
export async function getBOMObservations(geohash: string): Promise<BOMObservation | null> {
  try {
    const response = await fetch(`${BOM_API_BASE}/locations/${geohash}/observations`);

    if (!response.ok) {
      console.warn(`BOM observations not available for ${geohash}: ${response.status}`);
      return null;
    }

    const json = await response.json();
    const data = json.data;

    if (!data) return null;

    return {
      temp: data.temp,
      temp_feels_like: data.temp_feels_like,
      humidity: data.humidity,
      wind: {
        speed_kilometre: data.wind?.speed_kilometre || 0,
        speed_knot: data.wind?.speed_knot || 0,
        direction: data.wind?.direction || 'N',
        gust_speed_kilometre: data.gust?.speed_kilometre,
      },
      rain_since_9am: data.rain_since_9am || 0,
      station: {
        name: json.metadata?.name || 'Unknown',
        distance: json.metadata?.distance_from_location_m || 0,
      },
    };
  } catch (error) {
    console.error('BOM observations error:', error);
    return null;
  }
}

/**
 * Get hourly forecast for a location
 */
export async function getBOMHourlyForecast(geohash: string): Promise<BOMHourlyForecast[]> {
  try {
    const response = await fetch(`${BOM_API_BASE}/locations/${geohash}/forecasts/hourly`);

    if (!response.ok) {
      console.warn(`BOM hourly forecast not available for ${geohash}: ${response.status}`);
      return [];
    }

    const json = await response.json();

    return (json.data || []).map((item: any) => ({
      time: item.time,
      temp: item.temp,
      icon_descriptor: item.icon_descriptor,
      rain: {
        chance: item.rain?.chance || 0,
        amount: {
          min: item.rain?.amount?.min || 0,
          max: item.rain?.amount?.max,
        },
      },
      wind: {
        speed_kilometre: item.wind?.speed_kilometre || 0,
        direction: item.wind?.direction || 'N',
      },
      humidity: item.humidity || 0,
      is_night: item.is_night || false,
    }));
  } catch (error) {
    console.error('BOM hourly forecast error:', error);
    return [];
  }
}

/**
 * Get daily forecast for a location
 */
export async function getBOMDailyForecast(geohash: string): Promise<BOMDailyForecast[]> {
  try {
    const response = await fetch(`${BOM_API_BASE}/locations/${geohash}/forecasts/daily`);

    if (!response.ok) {
      throw new Error(`BOM daily forecast failed: ${response.status}`);
    }

    const json = await response.json();

    return (json.data || []).map((item: any) => ({
      date: item.date,
      temp_min: item.temp_min,
      temp_max: item.temp_max,
      icon_descriptor: item.icon_descriptor,
      short_text: item.short_text || '',
      extended_text: item.extended_text || '',
      rain: {
        chance: item.rain?.chance || 0,
        amount: {
          min: item.rain?.amount?.min || 0,
          max: item.rain?.amount?.max,
        },
      },
      uv: item.uv ? {
        category: item.uv.category,
        max_index: item.uv.max_index,
        start_time: item.uv.start_time,
        end_time: item.uv.end_time,
      } : null,
      fire_danger: item.fire_danger,
      fire_danger_category: item.fire_danger_category,
      astronomical: {
        sunrise_time: item.astronomical?.sunrise_time || '',
        sunset_time: item.astronomical?.sunset_time || '',
      },
      now: item.now,
    }));
  } catch (error) {
    console.error('BOM daily forecast error:', error);
    return [];
  }
}

/**
 * Get weather warnings for a location
 */
export async function getBOMWarnings(geohash: string): Promise<BOMWarning[]> {
  try {
    const response = await fetch(`${BOM_API_BASE}/locations/${geohash}/warnings`);

    if (!response.ok) {
      return [];
    }

    const json = await response.json();

    return (json.data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      short_title: item.short_title || item.title,
      type: item.type,
      state: item.state,
      issue_time: item.issue_time,
      expiry_time: item.expiry_time,
      phase: item.phase,
    }));
  } catch (error) {
    console.error('BOM warnings error:', error);
    return [];
  }
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetch complete weather data from BOM for a location
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Complete BOM weather data including observations, forecasts, and warnings
 */
export async function fetchBOMWeather(
  latitude: number,
  longitude: number
): Promise<BOMWeatherData> {
  // Convert coordinates to geohash
  const geohash = encodeGeohash(latitude, longitude, 7);

  // Fetch all data in parallel
  const [observation, hourlyForecast, dailyForecast, warnings] = await Promise.all([
    getBOMObservations(geohash),
    getBOMHourlyForecast(geohash),
    getBOMDailyForecast(geohash),
    getBOMWarnings(geohash),
  ]);

  // Get location info from daily forecast or create from geohash
  const location: BOMLocation = {
    id: geohash,
    geohash: geohash,
    name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    state: 'AU',
  };

  return {
    location,
    observation,
    hourlyForecast,
    dailyForecast,
    warnings,
    lastUpdated: new Date(),
  };
}

/**
 * Fetch weather by location name (Australian locations only)
 */
export async function fetchBOMWeatherByName(locationName: string): Promise<BOMWeatherData | null> {
  const locations = await searchBOMLocations(locationName);

  if (locations.length === 0) {
    return null;
  }

  const location = locations[0];

  const [observation, hourlyForecast, dailyForecast, warnings] = await Promise.all([
    getBOMObservations(location.geohash),
    getBOMHourlyForecast(location.geohash),
    getBOMDailyForecast(location.geohash),
    getBOMWarnings(location.geohash),
  ]);

  return {
    location,
    observation,
    hourlyForecast,
    dailyForecast,
    warnings,
    lastUpdated: new Date(),
  };
}

// ============================================================================
// ICON MAPPING
// ============================================================================

/**
 * Map BOM icon descriptors to emoji icons
 */
export function getBOMWeatherIcon(descriptor: string, isNight: boolean = false): string {
  const iconMap: Record<string, { day: string; night: string }> = {
    'sunny': { day: '☀️', night: '🌙' },
    'clear': { day: '☀️', night: '🌙' },
    'mostly_sunny': { day: '🌤️', night: '🌙' },
    'partly_cloudy': { day: '⛅', night: '☁️' },
    'cloudy': { day: '☁️', night: '☁️' },
    'hazy': { day: '🌫️', night: '🌫️' },
    'fog': { day: '🌫️', night: '🌫️' },
    'light_rain': { day: '🌦️', night: '🌧️' },
    'rain': { day: '🌧️', night: '🌧️' },
    'heavy_rain': { day: '🌧️', night: '🌧️' },
    'showers': { day: '🌦️', night: '🌧️' },
    'light_showers': { day: '🌦️', night: '🌧️' },
    'heavy_showers': { day: '🌧️', night: '🌧️' },
    'storm': { day: '⛈️', night: '⛈️' },
    'thunderstorm': { day: '⛈️', night: '⛈️' },
    'cyclone': { day: '🌀', night: '🌀' },
    'wind': { day: '💨', night: '💨' },
    'windy': { day: '💨', night: '💨' },
    'frost': { day: '🥶', night: '🥶' },
    'snow': { day: '❄️', night: '❄️' },
    'dust': { day: '🌪️', night: '🌪️' },
    'dusty': { day: '🌪️', night: '🌪️' },
  };

  const icons = iconMap[descriptor.toLowerCase()] || { day: '❓', night: '❓' };
  return isNight ? icons.night : icons.day;
}

/**
 * Get fire danger color and severity
 */
export function getFireDangerInfo(category: string | null): {
  color: string;
  severity: 'low' | 'moderate' | 'high' | 'severe' | 'extreme' | 'catastrophic';
  icon: string;
} {
  const categoryLower = (category || '').toLowerCase();

  if (categoryLower.includes('catastrophic') || categoryLower.includes('code red')) {
    return { color: '#cc0000', severity: 'catastrophic', icon: '🔥' };
  }
  if (categoryLower.includes('extreme')) {
    return { color: '#cc0000', severity: 'extreme', icon: '🔥' };
  }
  if (categoryLower.includes('severe')) {
    return { color: '#ff6600', severity: 'severe', icon: '🔥' };
  }
  if (categoryLower.includes('very high')) {
    return { color: '#ff9900', severity: 'high', icon: '⚠️' };
  }
  if (categoryLower.includes('high')) {
    return { color: '#fedd3a', severity: 'high', icon: '⚠️' };
  }
  if (categoryLower.includes('moderate')) {
    return { color: '#87ceeb', severity: 'moderate', icon: '🔶' };
  }

  return { color: '#4caf50', severity: 'low', icon: '✅' };
}

/**
 * Get UV category color and advice
 */
export function getUVInfo(category: string, maxIndex: number): {
  color: string;
  advice: string;
  icon: string;
} {
  const categoryLower = category.toLowerCase();

  if (categoryLower === 'extreme' || maxIndex >= 11) {
    return {
      color: '#8b00ff',
      advice: 'Avoid sun exposure 10am-3pm. Shirt, sunscreen, hat, sunglasses essential.',
      icon: '☀️🔥',
    };
  }
  if (categoryLower === 'very high' || maxIndex >= 8) {
    return {
      color: '#ff0000',
      advice: 'Extra protection needed. Minimise sun exposure 10am-3pm.',
      icon: '☀️⚠️',
    };
  }
  if (categoryLower === 'high' || maxIndex >= 6) {
    return {
      color: '#ff8c00',
      advice: 'Protection required. Seek shade during midday hours.',
      icon: '☀️',
    };
  }
  if (categoryLower === 'moderate' || maxIndex >= 3) {
    return {
      color: '#ffff00',
      advice: 'Wear sunscreen and hat if outside for extended periods.',
      icon: '🌤️',
    };
  }

  return {
    color: '#4caf50',
    advice: 'No protection required for most skin types.',
    icon: '😎',
  };
}

// ============================================================================
// WORK SUITABILITY (CONSTRUCTION SPECIFIC)
// ============================================================================

/**
 * Check if weather conditions are suitable for construction work
 * Includes Australian-specific considerations like UV and fire danger
 */
export function isBOMWeatherSuitableForWork(weather: BOMWeatherData): {
  suitable: boolean;
  warnings: string[];
  recommendations: string[];
  stopWorkRequired: boolean;
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let stopWorkRequired = false;

  const obs = weather.observation;
  const today = weather.dailyForecast[0];

  // Check current temperature
  if (obs) {
    if (obs.temp >= 40) {
      warnings.push(`Extreme heat: ${obs.temp}°C - Heat stress danger`);
      recommendations.push('Stop outdoor work, mandatory cooling breaks');
      stopWorkRequired = true;
    } else if (obs.temp >= 38) {
      warnings.push(`Severe heat: ${obs.temp}°C - High heat stress risk`);
      recommendations.push('Reduce physical work, frequent hydration breaks every 15min');
    } else if (obs.temp >= 35) {
      warnings.push(`High temperature: ${obs.temp}°C`);
      recommendations.push('Schedule heavy work for cooler hours, ensure adequate hydration');
    }

    // Check wind
    if (obs.wind.gust_speed_kilometre && obs.wind.gust_speed_kilometre > 65) {
      warnings.push(`Dangerous wind gusts: ${obs.wind.gust_speed_kilometre} km/h`);
      recommendations.push('Suspend crane operations and work at heights');
      stopWorkRequired = true;
    } else if (obs.wind.speed_kilometre > 50) {
      warnings.push(`Strong winds: ${obs.wind.speed_kilometre} km/h`);
      recommendations.push('Review crane and scaffolding operations');
    }

    // Check rain
    if (obs.rain_since_9am > 10) {
      warnings.push(`Significant rain: ${obs.rain_since_9am}mm since 9am`);
      recommendations.push('Check for slippery surfaces and drainage issues');
    }
  }

  // Check fire danger
  if (today?.fire_danger) {
    const fireInfo = getFireDangerInfo(today.fire_danger);
    if (fireInfo.severity === 'catastrophic' || fireInfo.severity === 'extreme') {
      warnings.push(`${fireInfo.icon} ${today.fire_danger} Fire Danger`);
      recommendations.push('No hot works. Review evacuation procedures.');
      stopWorkRequired = true;
    } else if (fireInfo.severity === 'severe' || fireInfo.severity === 'high') {
      warnings.push(`${fireInfo.icon} ${today.fire_danger} Fire Danger`);
      recommendations.push('Hot work permits required. Fire watch mandatory.');
    }
  }

  // Check UV
  if (today?.uv) {
    const uvInfo = getUVInfo(today.uv.category, today.uv.max_index);
    if (today.uv.max_index >= 11) {
      warnings.push(`☀️ Extreme UV Index: ${today.uv.max_index}`);
      recommendations.push('Mandatory sun protection. Limit outdoor exposure 10am-3pm.');
    } else if (today.uv.max_index >= 8) {
      warnings.push(`☀️ Very High UV Index: ${today.uv.max_index}`);
      recommendations.push('Sun protection required. Seek shade when possible.');
    }
  }

  // Check rain forecast
  if (today?.rain.chance > 80) {
    warnings.push(`High rain probability: ${today.rain.chance}%`);
    recommendations.push('Prepare wet weather contingencies');
  }

  // Check BOM warnings
  weather.warnings.forEach(warning => {
    warnings.push(`⚠️ BOM Warning: ${warning.short_title}`);
    if (warning.type.toLowerCase().includes('severe') ||
        warning.type.toLowerCase().includes('dangerous')) {
      stopWorkRequired = true;
    }
  });

  const suitable = warnings.length === 0 ||
    (!stopWorkRequired && warnings.length <= 2);

  return { suitable, warnings, recommendations, stopWorkRequired };
}

export default {
  encodeGeohash,
  searchBOMLocations,
  getBOMLocation,
  getBOMObservations,
  getBOMHourlyForecast,
  getBOMDailyForecast,
  getBOMWarnings,
  fetchBOMWeather,
  fetchBOMWeatherByName,
  getBOMWeatherIcon,
  getFireDangerInfo,
  getUVInfo,
  isBOMWeatherSuitableForWork,
};
