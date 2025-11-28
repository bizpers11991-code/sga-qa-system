/**
 * SGA QA Pack - Weather Widget Component
 * ======================================
 * Displays live weather from Bureau of Meteorology (via Open-Meteo)
 * 
 * Features:
 * - Current conditions with icon
 * - Temperature (actual and feels-like)
 * - Wind speed and direction
 * - Rain probability
 * - 7-day forecast
 * - Construction work suitability check
 * - Auto-refresh every 30 minutes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  WeatherData,
  fetchWeather,
  fetchWeatherForCurrentLocation,
  isWeatherSuitableForWork,
} from '../../services/weatherService';

interface WeatherWidgetProps {
  /** Fixed location (lat, lng) or null for auto-detect */
  location?: { latitude: number; longitude: number } | null;
  /** Show expanded view with forecast */
  expanded?: boolean;
  /** Show construction suitability warnings */
  showWorkSuitability?: boolean;
  /** Refresh interval in minutes (default: 30) */
  refreshInterval?: number;
  /** Custom class name */
  className?: string;
}

// Helper function for wind direction
function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Format time for display
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-AU', { hour: 'numeric', hour12: true });
}

// Format date for display
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  location = null,
  expanded = false,
  showWorkSuitability = true,
  refreshInterval = 30,
  className = '',
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: WeatherData;
      if (location) {
        data = await fetchWeather(location.latitude, location.longitude);
      } else {
        data = await fetchWeatherForCurrentLocation();
      }
      
      setWeather(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeatherData();
    
    // Set up refresh interval
    const interval = setInterval(fetchWeatherData, refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherData, refreshInterval]);

  // Loading state
  if (loading && !weather) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !weather) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600">
          <span className="text-xl mr-2">⚠️</span>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchWeatherData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!weather) return null;

  const workSuitability = showWorkSuitability ? isWeatherSuitableForWork(weather) : null;
  const windDirection = getWindDirectionLabel(weather.current.windDirection);

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Header with current conditions */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Weather Icon */}
            <div className="text-5xl">
              {weather.current.weatherIcon}
            </div>
            
            {/* Temperature */}
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {weather.current.temperature}°C
              </div>
              <div className="text-sm text-gray-500">
                Feels like {weather.current.apparentTemperature}°C
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-right text-sm text-gray-600">
            <div>{weather.current.weatherDescription}</div>
            <div>💨 {weather.current.windSpeed} km/h {windDirection}</div>
            <div>💧 {weather.current.humidity}%</div>
          </div>

          {/* Expand toggle */}
          <div className="ml-2 text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </div>
        </div>

        {/* Work Suitability Banner */}
        {workSuitability && workSuitability.warnings.length > 0 && (
          <div className={`mt-3 p-2 rounded text-sm ${
            workSuitability.suitable 
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="font-medium flex items-center">
              {workSuitability.suitable ? '⚠️ Weather Advisory' : '🚫 Weather Warning'}
            </div>
            <ul className="mt-1 list-disc list-inside">
              {workSuitability.warnings.slice(0, 2).map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Hourly Forecast */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Next 12 Hours</h3>
            <div className="flex overflow-x-auto space-x-4 pb-2">
              {weather.hourly.slice(0, 12).map((hour, i) => (
                <div key={i} className="flex-shrink-0 text-center">
                  <div className="text-xs text-gray-500">{formatTime(hour.time)}</div>
                  <div className="text-2xl my-1">{hour.weatherIcon}</div>
                  <div className="text-sm font-medium">{hour.temperature}°</div>
                  {hour.precipitationProbability > 0 && (
                    <div className="text-xs text-blue-500">
                      {hour.precipitationProbability}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">7-Day Forecast</h3>
            <div className="space-y-2">
              {weather.daily.map((day, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="w-20 text-sm text-gray-600">{formatDate(day.date)}</div>
                  <div className="text-2xl">{day.weatherIcon}</div>
                  <div className="flex-1 text-center text-xs text-gray-500 hidden sm:block">
                    {day.weatherDescription}
                  </div>
                  {day.precipitationProbability > 0 && (
                    <div className="text-xs text-blue-500 w-12 text-center">
                      💧{day.precipitationProbability}%
                    </div>
                  )}
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium">{day.temperatureMax}°</span>
                    <span className="text-sm text-gray-400 ml-1">{day.temperatureMin}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer with attribution */}
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex justify-between items-center">
            <span>
              Data: Bureau of Meteorology (via Open-Meteo)
            </span>
            {lastUpdated && (
              <span>
                Updated: {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
