/**
 * @file src/context/WeatherContext.tsx
 * @description Weather Context Provider for Smart App-Wide Weather Automation
 *
 * Provides real-time BOM weather data to all components including:
 * - Auto-population of weather conditions in QA forms
 * - MRWA temperature validation integration
 * - Work suitability warnings
 * - Asphalt placement temperature calculations
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  WeatherData,
  fetchWeather,
  fetchWeatherForCurrentLocation,
  isWeatherSuitableForWork,
} from '@/services/weatherService';
import {
  validatePavementTemperature,
  PAVEMENT_TEMPERATURE_REQUIREMENTS,
} from '@/lib/validation/mrwa-specs';

// Default Perth coordinates (SGA HQ area)
const DEFAULT_LOCATION = {
  latitude: -31.9505,
  longitude: 115.8605,
  name: 'Perth, WA',
};

// Weather context state
interface WeatherContextState {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  // Computed properties for forms
  formData: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    conditions: string;
    rainfall: boolean;
    cloudCover: string;
  } | null;
  // MRWA compliance
  mrwaCompliance: {
    pavementTempSuitable: boolean;
    minPavementTemp: number;
    windCategory: 'calm' | 'moderate' | 'windy';
    recommendations: string[];
  } | null;
  // Work suitability
  workSuitability: {
    suitable: boolean;
    warnings: string[];
    recommendations: string[];
  } | null;
  // Actions
  refresh: () => Promise<void>;
  setLocation: (lat: number, lon: number, name?: string) => void;
  useCurrentLocation: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextState | undefined>(undefined);

// Helper to get wind direction as compass string
function getWindDirectionString(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Helper to get cloud cover description
function getCloudCoverDescription(percent: number): string {
  if (percent < 10) return 'Clear';
  if (percent < 30) return 'Mostly Clear';
  if (percent < 60) return 'Partly Cloudy';
  if (percent < 85) return 'Mostly Cloudy';
  return 'Overcast';
}

// Helper to get wind category for MRWA
function getWindCategory(windSpeedKmh: number): 'calm' | 'moderate' | 'windy' {
  if (windSpeedKmh < 15) return 'calm';
  if (windSpeedKmh <= 25) return 'moderate';
  return 'windy';
}

// Provider props
interface WeatherProviderProps {
  children: ReactNode;
  autoRefreshMinutes?: number;
  initialLocation?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

export function WeatherProvider({
  children,
  autoRefreshMinutes = 15,
  initialLocation,
}: WeatherProviderProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [location, setLocationState] = useState(
    initialLocation
      ? {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          name: initialLocation.name || `${initialLocation.latitude.toFixed(4)}, ${initialLocation.longitude.toFixed(4)}`,
        }
      : DEFAULT_LOCATION
  );

  // Fetch weather data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWeather(location.latitude, location.longitude);
      setWeather(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchData, autoRefreshMinutes * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData, autoRefreshMinutes]);

  // Set location
  const setLocation = useCallback((lat: number, lon: number, name?: string) => {
    setLocationState({
      latitude: lat,
      longitude: lon,
      name: name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    });
  }, []);

  // Use current GPS location
  const useCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWeatherForCurrentLocation();
      setWeather(data);
      setLocationState({
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        name: 'Current Location',
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute form-ready data
  const formData = weather
    ? {
        temperature: weather.current.temperature,
        humidity: weather.current.humidity,
        windSpeed: weather.current.windSpeed,
        windDirection: getWindDirectionString(weather.current.windDirection),
        conditions: weather.current.weatherDescription,
        rainfall: weather.current.precipitation > 0,
        cloudCover: getCloudCoverDescription(weather.current.cloudCover),
      }
    : null;

  // Compute MRWA compliance
  const mrwaCompliance = weather
    ? (() => {
        const windCategory = getWindCategory(weather.current.windSpeed);
        const minPavementTemp = PAVEMENT_TEMPERATURE_REQUIREMENTS.PMB[windCategory];

        // Estimate pavement temperature (typically ~5-10°C above air temp in sun, less at night)
        const estimatedPavementTemp = weather.current.isDay
          ? weather.current.temperature + (weather.current.cloudCover < 50 ? 8 : 3)
          : weather.current.temperature - 2;

        const pavementValidation = validatePavementTemperature(
          estimatedPavementTemp,
          weather.current.windSpeed,
          true, // Assume PMB for strictest compliance
          false
        );

        const recommendations: string[] = [];
        if (!pavementValidation.valid) {
          recommendations.push(`Pavement temp (~${Math.round(estimatedPavementTemp)}°C) below minimum ${minPavementTemp}°C for PMB`);
          recommendations.push('Consider using workability additive or waiting for warmer conditions');
        }
        if (windCategory === 'windy') {
          recommendations.push('High wind conditions - ensure rapid compaction after paving');
        }

        return {
          pavementTempSuitable: pavementValidation.valid,
          minPavementTemp,
          windCategory,
          recommendations,
        };
      })()
    : null;

  // Work suitability
  const workSuitability = weather ? isWeatherSuitableForWork(weather) : null;

  const value: WeatherContextState = {
    weather,
    loading,
    error,
    lastUpdated,
    location,
    formData,
    mrwaCompliance,
    workSuitability,
    refresh: fetchData,
    setLocation,
    useCurrentLocation,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

// Hook to use weather context
export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}

// Hook specifically for form auto-population
export function useWeatherForForm() {
  const { formData, loading, error, refresh, mrwaCompliance, workSuitability } = useWeather();

  return {
    // Ready-to-use form values
    weatherConditions: formData ? {
      temperature: formData.temperature,
      humidity: formData.humidity,
      windSpeed: formData.windSpeed,
      windDirection: formData.windDirection,
      conditions: formData.conditions,
      rainfall: formData.rainfall ? 'Yes' : 'No',
      cloudCover: formData.cloudCover,
    } : null,
    // Loading state
    loading,
    error,
    refresh,
    // Validation helpers
    isPavementTempSuitable: mrwaCompliance?.pavementTempSuitable ?? true,
    minPavementTemp: mrwaCompliance?.minPavementTemp ?? 15,
    windCategory: mrwaCompliance?.windCategory ?? 'calm',
    // Work suitability
    isWorkSuitable: workSuitability?.suitable ?? true,
    warnings: workSuitability?.warnings ?? [],
    recommendations: [
      ...(workSuitability?.recommendations ?? []),
      ...(mrwaCompliance?.recommendations ?? []),
    ],
  };
}

export default WeatherContext;
