import { useState, useEffect } from 'react';

export function useWeatherAndClock() {
  const [time, setTime] = useState(new Date());
  const [temp, setTemp] = useState(null);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather temperature (default New Delhi coordinates, or geolocated)
  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`
        );
        const data = await response.json();
        if (data && data.current) {
          setTemp(Math.round(data.current.temperature_2m));
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      }
    };

    // Default to New Delhi coordinates
    const defaultLat = 28.6139;
    const defaultLon = 77.2090;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchWeather(defaultLat, defaultLon);
        }
      );
    } else {
      fetchWeather(defaultLat, defaultLon);
    }
  }, []);

  return { time, temp };
}
