import React, { useEffect, useState } from "react";
import "./App.css";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('SW registered: ', registration);
      })
      .catch(function(registrationError) {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const API_KEY = "171c829556b3a6f4a045d47d32ba0a8b";

export default function App() {
  const [city, setCity] = useState("Lucknow");
  const [search, setSearch] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [air, setAir] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("metric");
  const [error, setError] = useState("");
  const [bgClass, setBgClass] = useState("clear");
  const [popularCities] = useState([
    "Noida", "Bengaluru", "Indore", "Bhopal", "Delhi", 
    "Mumbai", "Sydney", "Dubai", "Singapore", "Toronto"
  ]);

  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "m/s" : "mph";

  // Simple weather descriptions for better user understanding
  const getSimpleWeatherDesc = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear')) return 'Sunny';
    if (desc.includes('cloud')) return 'Cloudy';
    if (desc.includes('rain')) return 'Rainy';
    if (desc.includes('drizzle')) return 'Light Rain';
    if (desc.includes('thunderstorm')) return 'Storm';
    if (desc.includes('snow')) return 'Snow';
    if (desc.includes('mist') || desc.includes('fog') || desc.includes('haze')) return 'Foggy';
    if (desc.includes('overcast')) return 'Overcast';
    return 'Clear';
  };

  // Check if it's currently day time based on sunrise and sunset
  const isDayTime = (sunrise, sunset) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > sunrise && currentTime < sunset;
  };

  // Round time into blocks like 6:00, 9:00, 12:00
  const roundTime = (timestamp) => {
    const d = new Date(timestamp * 1000);
    let hour = d.getHours();
    const rounded = Math.round(hour / 3) * 3;
    return `${String(rounded).padStart(2, "0")}:00`;
  };

  // AQI Calculation
  const calculateAQI = (pm25) => {
    if (pm25 <= 12.0) return Math.round((50 / 12.0) * pm25);
    if (pm25 <= 35.4) return 50 + Math.round((50 / 23.4) * (pm25 - 12.1));
    if (pm25 <= 55.4) return 100 + Math.round((50 / 19.9) * (pm25 - 35.5));
    if (pm25 <= 150.4) return 150 + Math.round((50 / 94.9) * (pm25 - 55.5));
    if (pm25 <= 250.4) return 200 + Math.round((100 / 99.9) * (pm25 - 150.5));
    return 300 + Math.round((200 / 249.5) * (pm25 - 250.5));
  };

  const getAQIInfo = (aqi) => {
    if (aqi <= 50) return { text: "Good", color: "#4ade80" };
    if (aqi <= 100) return { text: "Moderate", color: "#facc15" };
    if (aqi <= 150) return { text: "Unhealthy (Sensitive)", color: "#fb923c" };
    if (aqi <= 200) return { text: "Unhealthy", color: "#ef4444" };
    if (aqi <= 300) return { text: "Very Unhealthy", color: "#a855f7" };
    return { text: "Hazardous", color: "#991b1b" };
  };

  const getWeatherBackground = (main) => {
    const map = {
      Clear: "clear",
      Clouds: "clouds",
      Rain: "rain",
      Drizzle: "rain",
      Thunderstorm: "thunder",
      Snow: "snow",
      Mist: "mist",
      Fog: "mist",
      Haze: "mist",
    };
    return map[main] || "clear";
  };

  const fetchAllData = async (query) => {
    try {
      setLoading(true);
      setError("");

      const isCoords = query.includes("lat=");

      const url = isCoords
        ? `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${API_KEY}&units=${unit}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${API_KEY}&units=${unit}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("City not found");

      const data = await res.json();

      setWeather(data);
      setCity(data.name);
      setSearch("");
      setBgClass(getWeatherBackground(data.weather[0].main));

      // Forecast (6 days)
      const fRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_KEY}&units=${unit}`
      );
      const fData = await fRes.json();

      setHourly(fData.list.slice(0, 12));

      const groups = {};
      fData.list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0];
        groups[date] = groups[date] || [];
        groups[date].push(item);
      });

      const daily = Object.values(groups)
        .slice(0, 6)
        .map((day) => {
          const temps = day.map((d) => d.main.temp);
          const mid = day[Math.floor(day.length / 2)];
          return {
            date: mid.dt,
            max: Math.max(...temps),
            min: Math.min(...temps),
            icon: mid.weather[0].icon,
            weatherDesc: mid.weather[0].description,
          };
        });

      setForecast(daily);

      // Air Quality
      const airRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_KEY}`
      );
      const airData = await airRes.json();

      const realAQI = calculateAQI(airData.list[0].components.pm2_5);
      setAir({ ...airData.list[0], realAQI });
    } catch (err) {
      setError("City not found or network issue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData("Lucknow");
  }, [unit]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) fetchAllData(search);
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        fetchAllData(
          `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        ),
      () => setError("Location access denied")
    );
  };

  return (
    <div className={`weather-app ${bgClass}`}>
      {/* Fixed Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">SkyTemp</h1>
          <button
            onClick={() =>
              setUnit((u) => (u === "metric" ? "imperial" : "metric"))
            }
            className="nav-unit-btn"
          >
            {unit === "metric" ? "°F" : "°C"}
          </button>
        </div>
      </nav>

      <div className="container">
        <form onSubmit={handleSearch} className="search-bar">
          <div className="search-input-container">
            <div className="search-icon">🔍</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter city name..."
              disabled={loading}
              className={loading ? 'search-loading' : ''}
            />
          </div>
          <div className="search-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button type="button" onClick={getLocation} disabled={loading}>
              📍 My Location
            </button>
          </div>
        </form>

        {loading && (
          <div className="loading-box">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <div className="loading-text">
                <h3>Searching Weather...</h3>
                <p>Fetching latest weather data for {search}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-text">
                <h3>City Not Found</h3>
                <p>We couldn't find weather data for "{search}"</p>
              </div>
            </div>
            
            <div className="error-suggestion">
              <p>Try searching for one of these popular cities:</p>
              <div className="suggestion-list">
                {popularCities.slice(0, 4).map((city, index) => (
                  <div 
                    key={index}
                    className="suggestion-chip"
                    onClick={() => {
                      setSearch(city);
                      fetchAllData(city);
                    }}
                  >
                    {city}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {weather && (
          <>
            <div className="current-card">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt=""
              />

              <div className="info">
                <div className="location-time">
                  <h2>{city}</h2>
                  {weather && (
                    <span className="time-indicator">
                      {isDayTime(weather.sys.sunrise, weather.sys.sunset) ? '☀️ Day' : '🌙 Night'}
                    </span>
                  )}
                </div>
                <h1>
                  {Math.round(weather.main.temp)}
                  {unitSymbol}
                </h1>
                <p className="desc">{weather.weather[0].description}</p>

                <div className="stats">
                  <span>Humidity: {weather.main.humidity}%</span>
                  <span>
                    Wind: {weather.wind.speed} {speedUnit}
                  </span>
                  <span>
                    Feels like: {Math.round(weather.main.feels_like)}
                    {unitSymbol}
                  </span>
                </div>
              </div>
            </div>

            {air && (
              <div className="card aqi">
                <h3>Air Quality Index</h3>
                <div
                  className="aqi-value"
                  style={{ color: getAQIInfo(air.realAQI).color }}
                >
                  {air.realAQI} <span>{getAQIInfo(air.realAQI).text}</span>
                </div>
                <p>PM2.5: {air.components.pm2_5.toFixed(1)} µg/m³</p>
              </div>
            )}

            {/* Hourly */}
            <div className="card">
              <h3 className="section-title">Hourly Forecast</h3>
              <div className="hourly-grid">
                {hourly.map((h, i) => (
                  <div key={i} className="h-item">
                    <p>{roundTime(h.dt)}</p>
                    <img
                      src={`https://openweathermap.org/img/wn/${h.weather[0].icon}.png`}
                      alt=""
                    />
                    <p className="weather-desc">{getSimpleWeatherDesc(h.weather[0].description)}</p>
                    <p>
                      {Math.round(h.main.temp)}
                      {unitSymbol}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 6 Days */}
            <div className="card">
              <h3 className="section-title">6-Day Forecast</h3>
              <div className="daily-grid">
                {forecast.map((d, i) => (
                  <div key={i} className="d-item">
                    <p>
                      {new Date(d.date * 1000).toLocaleDateString("en", {
                        weekday: "short",
                      })}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${d.icon}.png`}
                      alt=""
                    />
                    <p className="weather-desc">{getSimpleWeatherDesc(d.weatherDesc)}</p>
                    <p>
                      {Math.round(d.max)}
                      {unitSymbol} / {Math.round(d.min)}
                      {unitSymbol}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <footer className="footer">
  <div className="footer-content">
    <p>
      Made with care by <strong>Ayush Srivastava</strong>
    </p>
    <p className="email-cta">
      Drop me an email for your suggestions
    </p>
    <div className="contact-info">
      <a 
        href="mailto:srivastava999ayush@gmail.com?subject=Weather%20App%20Feedback&body=Hi%20Ayush,%20I%20have%20a%20suggestion%20for%20your%20weather%20app:" 
        className="email-link"
      >
        <span className="email-icon">📧</span>
        srivastava999ayush@gmail.com
      </a>
    </div>
    <p className="disclaimer">
      Accuracy is not guaranteed. Weather dynamics introduce inherent
      unpredictability!!!
    </p>
  </div>
</footer>
      </div>
    </div>
  );
}