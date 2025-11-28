/**
 * SGA QA Pack - Australian Weather Service
 * =========================================
 * Integrates weather data from Bureau of Meteorology (BOM) via Open-Meteo API
 * 
 * This uses Open-Meteo's BOM API which provides:
 * - FREE access (no API key required for non-commercial use)
 * - Real BOM ACCESS-G model data
 * - Hourly forecasts up to 10 days
 * - Updated 4x daily (0:00, 6:00, 12:00, 18:00 UTC)
 * 
 * Perfect for construction site weather monitoring!
 */

// Types for weather data
export interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
    elevation: number;
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
  };
  hourly: HourlyForecast[];
  daily: DailyForecast[];
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
}

// Weather code to description and icon mapping (WMO codes)
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

/**
 * Fetch weather data from Open-Meteo BOM API
 * No API key required!
 */
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const baseUrl = 'https://api.open-meteo.com/v1/bom';
  
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
    timezone: 'Australia/Perth', // Default to Perth, will be auto-detected
    forecast_days: '7',
  });

  const response = await fetch(`${baseUrl}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  
  return transformWeatherData(data);
}


function transformWeatherData(data: any): WeatherData {
  const currentHour = new Date().getHours();
  const isDay = data.current?.is_day === 1;
  const currentWeatherInfo = getWeatherInfo(data.current?.weather_code || 0, isDay);
  
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
      uvIndex: 0, // UV not in current, will get from daily
    },
    hourly: transformHourlyData(data.hourly),
    daily: transformDailyData(data.daily),
  };
}

function transformHourlyData(hourly: any): HourlyForecast[] {
  if (!hourly?.time) return [];
  
  const forecasts: HourlyForecast[] = [];
  const now = new Date();
  
  // Get next 24 hours
  for (let i = 0; i < Math.min(hourly.time.length, 48); i++) {
    const time = new Date(hourly.time[i]);
    if (time < now) continue;
    if (forecasts.length >= 24) break;
    
    const isDay = hourly.is_day?.[i] === 1;
    const weatherInfo = getWeatherInfo(hourly.weather_code?.[i] || 0, isDay);
    
    forecasts.push({
      time: hourly.time[i],
      temperature: Math.round(hourly.temperature_2m?.[i] || 0),
      apparentTemperature: Math.round(hourly.apparent_temperature?.[i] || 0),
      precipitation: hourly.precipitation?.[i] || 0,
      precipitationProbability: hourly.precipitation_probability?.[i] || 0,
      weatherCode: hourly.weather_code?.[i] || 0,
      weatherDescription: weatherInfo.description,
      weatherIcon: weatherInfo.icon,
      windSpeed: Math.round(hourly.wind_speed_10m?.[i] || 0),
      windGusts: Math.round(hourly.wind_gusts_10m?.[i] || 0),
      cloudCover: hourly.cloud_cover?.[i] || 0,
      humidity: Math.round(hourly.relative_humidity_2m?.[i] || 0),
      isDay,
    });
  }
  
  return forecasts;
}

function transformDailyData(daily: any): DailyForecast[] {
  if (!daily?.time) return [];
  
  return daily.time.map((date: string, i: number) => {
    const weatherInfo = getWeatherInfo(daily.weather_code?.[i] || 0, true);
    
    return {
      date,
      temperatureMax: Math.round(daily.temperature_2m_max?.[i] || 0),
      temperatureMin: Math.round(daily.temperature_2m_min?.[i] || 0),
      apparentTemperatureMax: Math.round(daily.apparent_temperature_max?.[i] || 0),
      apparentTemperatureMin: Math.round(daily.apparent_temperature_min?.[i] || 0),
      precipitation: daily.precipitation_sum?.[i] || 0,
      precipitationProbability: daily.precipitation_probability_max?.[i] || 0,
      weatherCode: daily.weather_code?.[i] || 0,
      weatherDescription: weatherInfo.description,
      weatherIcon: weatherInfo.icon,
      sunrise: daily.sunrise?.[i] || '',
      sunset: daily.sunset?.[i] || '',
      windSpeedMax: Math.round(daily.wind_speed_10m_max?.[i] || 0),
      windGustsMax: Math.round(daily.wind_gusts_10m_max?.[i] || 0),
      uvIndexMax: daily.uv_index_max?.[i] || 0,
    };
  });
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
 */
export function isWeatherSuitableForWork(weather: WeatherData): {
  suitable: boolean;
  warnings: string[];
  recommendations: string[];
} {
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
