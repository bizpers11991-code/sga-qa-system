/**
 * SGA QA Pack - Australian Weather Service
 * =========================================
 * Primary: Bureau of Meteorology (BOM) official API for Australian locations
 * Fallback: Open-Meteo API for international locations
 *
 * Features:
 * - Real-time BOM observations and forecasts for Australia
 * - Fire danger ratings and UV index (Australian-specific)
 * - Weather warnings from BOM
 * - Automatic location detection
 * - Construction work suitability assessment
 *
 * Data Attribution: Bureau of Meteorology (https://www.bom.gov.au)
 */

import {
  fetchBOMWeather,
  getBOMWeatherIcon,
  getFireDangerInfo,
  getUVInfo,
  isBOMWeatherSuitableForWork,
  type BOMWeatherData,
  type BOMWarning,
} from './bomWeatherService';

// ============================================================================
// TYPES
// ============================================================================

export interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
    elevation: number;
    name?: string;
    state?: string;
  };
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    weatherDescription: string;
    weatherIcon: string;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    cloudCover: number;
    isDay: boolean;
    uvIndex: number;
    // Australian-specific fields
    rainSince9am?: number;
    stationName?: string;
  };
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  // Australian-specific data
  warnings?: WeatherWarning[];
  source: 'bom' | 'open-meteo';
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  windSpeed: number;
  windGusts: number;
  cloudCover: number;
  humidity: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  sunrise: string;
  sunset: string;
  windSpeedMax: number;
  windGustsMax: number;
  uvIndexMax: number;
  // Australian-specific fields
  uvCategory?: string;
  fireDanger?: string;
  fireDangerColor?: string;
  shortText?: string;
  extendedText?: string;
}

export interface WeatherWarning {
  id: string;
  title: string;
  shortTitle: string;
  type: string;
  issueTime: string;
  expiryTime: string;
}

// ============================================================================
// LOCATION UTILITIES
// ============================================================================

/**
 * Australian bounding box (approximate)
 * Used to determine whether to use BOM API or fallback
 */
const AUSTRALIA_BOUNDS = {
  north: -9.0,    // Torres Strait
  south: -44.0,   // Tasmania
  west: 112.0,    // Western Australia
  east: 154.0,    // Eastern seaboard
};

/**
 * Check if coordinates are within Australia
 */
export function isInAustralia(latitude: number, longitude: number): boolean {
  return (
    latitude >= AUSTRALIA_BOUNDS.south &&
    latitude <= AUSTRALIA_BOUNDS.north &&
    longitude >= AUSTRALIA_BOUNDS.west &&
    longitude <= AUSTRALIA_BOUNDS.east
  );
}

// ============================================================================
// WEATHER CODE MAPPING (WMO codes for Open-Meteo fallback)
// ============================================================================

const WEATHER_CODES: Record<number, { description: string; icon: string; iconDay: string; iconNight: string }> = {
  0: { description: 'Clear sky', icon: '☀️', iconDay: '☀️', iconNight: '🌙' },
  1: { description: 'Mainly clear', icon: '🌤️', iconDay: '🌤️', iconNight: '🌙' },
  2: { description: 'Partly cloudy', icon: '⛅', iconDay: '⛅', iconNight: '☁️' },
  3: { description: 'Overcast', icon: '☁️', iconDay: '☁️', iconNight: '☁️' },
  45: { description: 'Foggy', icon: '🌫️', iconDay: '🌫️', iconNight: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️', iconDay: '🌫️', iconNight: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌧️', iconDay: '🌦️', iconNight: '🌧️' },
  53: { description: 'Moderate drizzle', icon: '🌧️', iconDay: '🌦️', iconNight: '🌧️' },
  55: { description: 'Dense drizzle', icon: '🌧️', iconDay: '🌧️', iconNight: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️', iconDay: '🌦️', iconNight: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️', iconDay: '🌧️', iconNight: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️', iconDay: '🌧️', iconNight: '🌧️' },
  66: { description: 'Light freezing rain', icon: '🌨️', iconDay: '🌨️', iconNight: '🌨️' },
  67: { description: 'Heavy freezing rain', icon: '🌨️', iconDay: '🌨️', iconNight: '🌨️' },
  71: { description: 'Slight snow', icon: '🌨️', iconDay: '🌨️', iconNight: '🌨️' },
  73: { description: 'Moderate snow', icon: '🌨️', iconDay: '🌨️', iconNight: '🌨️' },
  75: { description: 'Heavy snow', icon: '❄️', iconDay: '❄️', iconNight: '❄️' },
  77: { description: 'Snow grains', icon: '🌨️', iconDay: '🌨️', iconNight: '🌨️' },
  80: { description: 'Slight rain showers', icon: '🌦️', iconDay: '🌦️', iconNight: '🌧️' },
  81: { description: 'Moderate rain showers', icon: '🌧️', iconDay: '🌧️', iconNight: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️', iconDay: '⛈️', iconNight: '⛈️' },
  85: { description: 'Slight snow showers', icon: '🌨️', iconDay: '🌨️', iconNight: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '❄️', iconDay: '❄️', iconNight: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️', iconDay: '⛈️', iconNight: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️', iconDay: '⛈️', iconNight: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️', iconDay: '⛈️', iconNight: '⛈️' },
};

function getWeatherInfo(code: number, isDay: boolean = true) {
  const info = WEATHER_CODES[code] || { description: 'Unknown', icon: '❓', iconDay: '❓', iconNight: '❓' };
  return {
    description: info.description,
    icon: isDay ? info.iconDay : info.iconNight,
  };
}

// ============================================================================
// BOM DATA TRANSFORMATION
// ============================================================================

/**
 * Transform BOM weather data to common WeatherData format
 */
function transformBOMData(bom: BOMWeatherData, latitude: number, longitude: number): WeatherData {
  const obs = bom.observation;
  const today = bom.dailyForecast[0];
  const isNight = today?.now?.is_night ?? false;

  // Get current weather icon from today's forecast or observation
  const currentIcon = today?.icon_descriptor
    ? getBOMWeatherIcon(today.icon_descriptor, isNight)
    : '☀️';

  // Build current conditions
  const current = {
    time: new Date().toISOString(),
    temperature: Math.round(obs?.temp ?? today?.now?.temp_now ?? 0),
    apparentTemperature: Math.round(obs?.temp_feels_like ?? obs?.temp ?? 0),
    humidity: obs?.humidity ?? 0,
    precipitation: obs?.rain_since_9am ?? 0,
    weatherCode: 0, // BOM uses descriptors, not codes
    weatherDescription: today?.short_text || 'Unknown',
    weatherIcon: currentIcon,
    windSpeed: Math.round(obs?.wind.speed_kilometre ?? 0),
    windDirection: 0, // Would need to convert direction string
    windGusts: Math.round(obs?.wind.gust_speed_kilometre ?? 0),
    cloudCover: 0,
    isDay: !isNight,
    uvIndex: today?.uv?.max_index ?? 0,
    rainSince9am: obs?.rain_since_9am,
    stationName: obs?.station.name,
  };

  // Transform hourly forecast
  const hourly: HourlyForecast[] = bom.hourlyForecast.slice(0, 24).map(h => ({
    time: h.time,
    temperature: Math.round(h.temp),
    apparentTemperature: Math.round(h.temp), // BOM doesn't provide feels-like hourly
    precipitation: h.rain.amount.min,
    precipitationProbability: h.rain.chance,
    weatherCode: 0,
    weatherDescription: h.icon_descriptor.replace(/_/g, ' '),
    weatherIcon: getBOMWeatherIcon(h.icon_descriptor, h.is_night),
    windSpeed: Math.round(h.wind.speed_kilometre),
    windGusts: 0,
    cloudCover: 0,
    humidity: h.humidity,
    isDay: !h.is_night,
  }));

  // Transform daily forecast
  const daily: DailyForecast[] = bom.dailyForecast.map(d => {
    const uvInfo = d.uv ? getUVInfo(d.uv.category, d.uv.max_index) : null;
    const fireInfo = d.fire_danger ? getFireDangerInfo(d.fire_danger) : null;

    return {
      date: d.date.split('T')[0],
      temperatureMax: Math.round(d.temp_max ?? 0),
      temperatureMin: Math.round(d.temp_min ?? 0),
      apparentTemperatureMax: Math.round(d.temp_max ?? 0),
      apparentTemperatureMin: Math.round(d.temp_min ?? 0),
      precipitation: d.rain.amount.min,
      precipitationProbability: d.rain.chance,
      weatherCode: 0,
      weatherDescription: d.short_text,
      weatherIcon: getBOMWeatherIcon(d.icon_descriptor, false),
      sunrise: d.astronomical.sunrise_time,
      sunset: d.astronomical.sunset_time,
      windSpeedMax: 0,
      windGustsMax: 0,
      uvIndexMax: d.uv?.max_index ?? 0,
      uvCategory: d.uv?.category,
      fireDanger: d.fire_danger ?? undefined,
      fireDangerColor: fireInfo?.color,
      shortText: d.short_text,
      extendedText: d.extended_text,
    };
  });

  // Transform warnings
  const warnings: WeatherWarning[] = bom.warnings.map(w => ({
    id: w.id,
    title: w.title,
    shortTitle: w.short_title,
    type: w.type,
    issueTime: w.issue_time,
    expiryTime: w.expiry_time,
  }));

  return {
    location: {
      latitude,
      longitude,
      timezone: 'Australia/Perth', // Could be determined from coordinates
      elevation: 0,
      name: bom.location.name,
      state: bom.location.state,
    },
    current,
    hourly,
    daily,
    warnings,
    source: 'bom',
  };
}

// ============================================================================
// OPEN-METEO FALLBACK
// ============================================================================

/**
 * Fetch weather from Open-Meteo (fallback for non-Australian locations)
 */
async function fetchOpenMeteoWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const baseUrl = 'https://api.open-meteo.com/v1/forecast';

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'is_day',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'precipitation_probability',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_gusts_10m',
      'is_day',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'uv_index_max',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
  });

  const response = await fetch(`${baseUrl}?${params}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  return transformOpenMeteoData(data);
}

function transformOpenMeteoData(data: any): WeatherData {
  const isDay = data.current?.is_day === 1;
  const currentWeatherInfo = getWeatherInfo(data.current?.weather_code || 0, isDay);

  const hourly: HourlyForecast[] = [];
  const now = new Date();

  if (data.hourly?.time) {
    for (let i = 0; i < Math.min(data.hourly.time.length, 48); i++) {
      const time = new Date(data.hourly.time[i]);
      if (time < now) continue;
      if (hourly.length >= 24) break;

      const isHourDay = data.hourly.is_day?.[i] === 1;
      const weatherInfo = getWeatherInfo(data.hourly.weather_code?.[i] || 0, isHourDay);

      hourly.push({
        time: data.hourly.time[i],
        temperature: Math.round(data.hourly.temperature_2m?.[i] || 0),
        apparentTemperature: Math.round(data.hourly.apparent_temperature?.[i] || 0),
        precipitation: data.hourly.precipitation?.[i] || 0,
        precipitationProbability: data.hourly.precipitation_probability?.[i] || 0,
        weatherCode: data.hourly.weather_code?.[i] || 0,
        weatherDescription: weatherInfo.description,
        weatherIcon: weatherInfo.icon,
        windSpeed: Math.round(data.hourly.wind_speed_10m?.[i] || 0),
        windGusts: Math.round(data.hourly.wind_gusts_10m?.[i] || 0),
        cloudCover: data.hourly.cloud_cover?.[i] || 0,
        humidity: Math.round(data.hourly.relative_humidity_2m?.[i] || 0),
        isDay: isHourDay,
      });
    }
  }

  const daily: DailyForecast[] = (data.daily?.time || []).map((date: string, i: number) => {
    const weatherInfo = getWeatherInfo(data.daily.weather_code?.[i] || 0, true);

    return {
      date,
      temperatureMax: Math.round(data.daily.temperature_2m_max?.[i] || 0),
      temperatureMin: Math.round(data.daily.temperature_2m_min?.[i] || 0),
      apparentTemperatureMax: Math.round(data.daily.apparent_temperature_max?.[i] || 0),
      apparentTemperatureMin: Math.round(data.daily.apparent_temperature_min?.[i] || 0),
      precipitation: data.daily.precipitation_sum?.[i] || 0,
      precipitationProbability: data.daily.precipitation_probability_max?.[i] || 0,
      weatherCode: data.daily.weather_code?.[i] || 0,
      weatherDescription: weatherInfo.description,
      weatherIcon: weatherInfo.icon,
      sunrise: data.daily.sunrise?.[i] || '',
      sunset: data.daily.sunset?.[i] || '',
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max?.[i] || 0),
      windGustsMax: Math.round(data.daily.wind_gusts_10m_max?.[i] || 0),
      uvIndexMax: data.daily.uv_index_max?.[i] || 0,
    };
  });

  return {
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      elevation: data.elevation,
    },
    current: {
      time: data.current?.time || new Date().toISOString(),
      temperature: Math.round(data.current?.temperature_2m || 0),
      apparentTemperature: Math.round(data.current?.apparent_temperature || 0),
      humidity: Math.round(data.current?.relative_humidity_2m || 0),
      precipitation: data.current?.precipitation || 0,
      weatherCode: data.current?.weather_code || 0,
      weatherDescription: currentWeatherInfo.description,
      weatherIcon: currentWeatherInfo.icon,
      windSpeed: Math.round(data.current?.wind_speed_10m || 0),
      windDirection: data.current?.wind_direction_10m || 0,
      windGusts: Math.round(data.current?.wind_gusts_10m || 0),
      cloudCover: data.current?.cloud_cover || 0,
      isDay,
      uvIndex: 0,
    },
    hourly,
    daily,
    source: 'open-meteo',
  };
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Fetch weather data for a location
 * Uses BOM API for Australian locations, Open-Meteo for others
 */
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  // Use BOM for Australian locations
  if (isInAustralia(latitude, longitude)) {
    try {
      const bomData = await fetchBOMWeather(latitude, longitude);
      return transformBOMData(bomData, latitude, longitude);
    } catch (error) {
      console.warn('BOM API failed, falling back to Open-Meteo:', error);
      // Fall through to Open-Meteo
    }
  }

  // Use Open-Meteo for non-Australian locations or as fallback
  return fetchOpenMeteoWeather(latitude, longitude);
}

/**
 * Get user's current location
 */
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // Cache for 5 minutes
    });
  });
}

/**
 * Fetch weather for user's current location
 */
export async function fetchWeatherForCurrentLocation(): Promise<WeatherData> {
  const position = await getCurrentLocation();
  return fetchWeather(position.coords.latitude, position.coords.longitude);
}

/**
 * Check if weather conditions are suitable for construction work
 * Uses enhanced BOM checks for Australian locations
 */
export function isWeatherSuitableForWork(weather: WeatherData): {
  suitable: boolean;
  warnings: string[];
  recommendations: string[];
  stopWorkRequired?: boolean;
} {
  // For BOM data, use the enhanced Australian-specific checks
  if (weather.source === 'bom') {
    // Reconstruct minimal BOM data structure for the check
    const bomData: BOMWeatherData = {
      location: {
        id: '',
        geohash: '',
        name: weather.location.name || '',
        state: weather.location.state || '',
      },
      observation: weather.current.stationName ? {
        temp: weather.current.temperature,
        temp_feels_like: weather.current.apparentTemperature,
        humidity: weather.current.humidity,
        wind: {
          speed_kilometre: weather.current.windSpeed,
          speed_knot: 0,
          direction: 'N',
          gust_speed_kilometre: weather.current.windGusts,
        },
        rain_since_9am: weather.current.rainSince9am || 0,
        station: { name: weather.current.stationName, distance: 0 },
      } : null,
      hourlyForecast: [],
      dailyForecast: weather.daily.map(d => ({
        date: d.date,
        temp_min: d.temperatureMin,
        temp_max: d.temperatureMax,
        icon_descriptor: '',
        short_text: d.shortText || '',
        extended_text: d.extendedText || '',
        rain: {
          chance: d.precipitationProbability,
          amount: { min: d.precipitation, max: null },
        },
        uv: d.uvCategory ? {
          category: d.uvCategory,
          max_index: d.uvIndexMax,
          start_time: '',
          end_time: '',
        } : null,
        fire_danger: d.fireDanger || null,
        fire_danger_category: d.fireDangerColor ? {
          text: d.fireDanger || '',
          default_colour: d.fireDangerColor,
        } : null,
        astronomical: {
          sunrise_time: d.sunrise,
          sunset_time: d.sunset,
        },
      })),
      warnings: (weather.warnings || []).map(w => ({
        id: w.id,
        title: w.title,
        short_title: w.shortTitle,
        type: w.type,
        state: '',
        issue_time: w.issueTime,
        expiry_time: w.expiryTime,
        phase: '',
      })),
      lastUpdated: new Date(),
    };

    return isBOMWeatherSuitableForWork(bomData);
  }

  // Standard checks for non-BOM data
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const current = weather.current;
  const todayForecast = weather.daily[0];

  // Check for rain
  if (current.precipitation > 0) {
    warnings.push(`Current precipitation: ${current.precipitation}mm`);
  }
  if (todayForecast?.precipitationProbability > 50) {
    warnings.push(`${todayForecast.precipitationProbability}% chance of rain today`);
  }

  // Check for extreme temperatures
  if (current.temperature > 38) {
    warnings.push(`Extreme heat: ${current.temperature}°C - Heat stress risk`);
    recommendations.push('Ensure adequate hydration and rest breaks');
  } else if (current.temperature > 35) {
    warnings.push(`High temperature: ${current.temperature}°C`);
    recommendations.push('Schedule demanding work for cooler hours');
  }

  // Check for high winds
  if (current.windGusts > 60) {
    warnings.push(`Strong wind gusts: ${current.windGusts} km/h - Crane operations may be affected`);
  } else if (current.windSpeed > 40) {
    warnings.push(`High winds: ${current.windSpeed} km/h`);
  }

  // Check for storms
  if ([95, 96, 99].includes(current.weatherCode)) {
    warnings.push('Thunderstorm activity - Consider work suspension');
  }

  // Check UV
  if (todayForecast?.uvIndexMax >= 11) {
    warnings.push(`Extreme UV index: ${todayForecast.uvIndexMax}`);
    recommendations.push('Mandatory sun protection, limit outdoor exposure');
  } else if (todayForecast?.uvIndexMax >= 8) {
    warnings.push(`Very high UV index: ${todayForecast.uvIndexMax}`);
    recommendations.push('Sun protection required');
  }

  // Determine overall suitability
  const suitable = warnings.length === 0 ||
    (warnings.length === 1 && !warnings.some(w =>
      w.includes('Thunderstorm') ||
      w.includes('Extreme') ||
      w.includes('Strong wind')
    ));

  return { suitable, warnings, recommendations };
}
