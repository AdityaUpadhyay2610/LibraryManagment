import { useState, useEffect, useCallback } from 'react';

export function useWeatherAndClock() {
  const [time, setTime] = useState(new Date());
  const [temp, setTemp] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState('Loading...');
  const [weatherIcon, setWeatherIcon] = useState('☁️');
  const [locationName, setLocationName] = useState('Detecting...');
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherCondition = (code) => {
    if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
    if (code >= 1 && code <= 3) return { label: 'Cloudy', icon: '☁️' };
    if (code === 45 || code === 48) return { label: 'Foggy', icon: '🌫️' };
    if (code >= 51 && code <= 67) return { label: 'Rainy', icon: '🌧️' };
    if (code >= 71 && code <= 77) return { label: 'Snowy', icon: '❄️' };
    if (code >= 80 && code <= 82) return { label: 'Showers', icon: '🌦️' };
    if (code >= 95 && code <= 99) return { label: 'Stormy', icon: '⛈️' };
    return { label: 'Clear', icon: '☀️' };
  };

  const fetchWeatherData = useCallback(async (lat, lon) => {
    setLoadingWeather(true);
    try {
      // 1. Fetch Weather from Open-Meteo
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
      );
      const data = await response.json();
      if (data && data.current) {
        setTemp(Math.round(data.current.temperature_2m));
        const cond = getWeatherCondition(data.current.weather_code);
        setWeatherCondition(cond.label);
        setWeatherIcon(cond.icon);
      }

      // 2. Reverse Geocode City Name (using free OpenStreetMap Nominatim API)
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const geoData = await geoResponse.json();
      if (geoData && geoData.address) {
        const city =
          geoData.address.city ||
          geoData.address.town ||
          geoData.address.village ||
          geoData.address.suburb ||
          'Local Area';
        setLocationName(city);
      } else {
        setLocationName('Detected');
      }
    } catch (err) {
      console.error('Failed to fetch weather/location:', err);
      setWeatherCondition('Offline');
      setLocationName('Unknown');
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  const refreshWeather = useCallback(() => {
    // Default to New Delhi coordinates
    const defaultLat = 28.6139;
    const defaultLon = 77.2090;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchWeatherData(defaultLat, defaultLon);
        }
      );
    } else {
      fetchWeatherData(defaultLat, defaultLon);
    }
  }, [fetchWeatherData]);

  // Initial load
  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  return {
    time,
    temp,
    weatherCondition,
    weatherIcon,
    locationName,
    loadingWeather,
    refreshWeather
  };
}
