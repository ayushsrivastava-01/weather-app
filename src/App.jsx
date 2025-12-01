import React, { useEffect, useState } from "react";
import "./App.css";

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
  const [isInstalled, setIsInstalled] = useState(false);
  const [bgClass, setBgClass] = useState("clear");
  const [popularCities] = useState([
    "Noida", "Bengaluru", "Indore", "Bhopal", "Delhi", 
    "Mumbai", "Sydney", "Dubai", "Singapore", "Toronto"
  ]);

  // ✅ Advanced Features State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showAlreadyInstalled, setShowAlreadyInstalled] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [uvIndex, setUvIndex] = useState(null);

  // Service Worker Registration
  useEffect(() => {
    console.log('📱 Checking service worker...');
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('🎉 Service Worker registered!');
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  // ✅ FIXED: Simple and reliable installed detection
  useEffect(() => {
    console.log('🔍 Checking if app is installed...');
    
    const checkInstalled = () => {
      // Desktop PWA and Mobile PWA
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ Detected: PWA standalone mode');
        return true;
      }
      
      // iOS PWA
      if (navigator.standalone) {
        console.log('✅ Detected: iOS PWA');
        return true;
      }
      
      return false;
    };

    // Check immediately
    if (checkInstalled()) {
      console.log('✅ App is installed');
      setIsInstalled(true);
    }

    // Also check after a delay (for mobile)
    setTimeout(() => {
      if (checkInstalled() && !isInstalled) {
        console.log('✅ App is installed (delayed check)');
        setIsInstalled(true);
      }
    }, 1000);

    // Listen for new installations
    window.addEventListener('appinstalled', () => {
      console.log('🎉 App installed event received');
      setIsInstalled(true);
      setShowInstallPrompt(false);
    });

  }, []);

  // Desktop Install Prompt Handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (userInteracted) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [userInteracted]);

  // Track user interaction
  const handleUserInteraction = () => {
    if (!userInteracted) {
      setUserInteracted(true);
    }
  };

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('weatherFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "m/s" : "mph";

  // Simple weather descriptions
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

  // Check if it's currently day time
  const isDayTime = (sunrise, sunset) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime > sunrise && currentTime < sunset;
  };

  // Round time into blocks
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

  // ✅ Add to favorites
  const addToFavorites = () => {
    if (weather && !favorites.includes(city)) {
      setFavorites([...favorites, city]);
    }
  };

  // ✅ Remove from favorites
  const removeFromFavorites = (cityToRemove) => {
    setFavorites(favorites.filter(fav => fav !== cityToRemove));
  };

  // ✅ Share weather
  const shareWeather = async () => {
    if (weather) {
      const shareData = {
        title: `Weather in ${city}`,
        text: `It's ${Math.round(weather.main.temp)}${unitSymbol} and ${weather.weather[0].description} in ${city}. Check it out!`,
        url: window.location.href
      };
      
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Weather info copied to clipboard!');
      }
    }
  };

  // ✅ Get UV Index (mock data for now)
  const getUVIndex = () => {
    const levels = ['Low', 'Moderate', 'High', 'Very High', 'Extreme'];
    const randomIndex = Math.floor(Math.random() * 5);
    return { level: levels[randomIndex], value: randomIndex + 1 };
  };

  // ✅ FIXED: Enhanced install handler with better detection
  const handleInstall = async () => {
    console.log('🔄 Install clicked');
    
    // Real-time check
    const isCurrentlyInstalled = 
      window.matchMedia('(display-mode: standalone)').matches || 
      navigator.standalone;
    
    if (isCurrentlyInstalled) {
      setShowAlreadyInstalled(true);
      setShowInstallPrompt(false);
      setIsInstalled(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallPrompt(false);
          setIsInstalled(true);
        }
      } catch (error) {
        console.error('Install prompt error:', error);
      }
    } else {
      // Show already installed message if prompt not available but app is installed
      if (isInstalled) {
        setShowAlreadyInstalled(true);
      } else {
        alert('⚠️ Seems like SkyTemp is already installed on your device/nPlease check it out.');
      }
    }
  };


  const fetchAllData = async (query) => {
    try {
      setLoading(true);
      setError("");

      handleUserInteraction();

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
      setUvIndex(getUVIndex());

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
    if (search.trim()) {
      handleUserInteraction();
      fetchAllData(search);
    }
  };

  const getLocation = () => {
    handleUserInteraction();
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        fetchAllData(
          `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        ),
      () => setError("Location access denied")
    );
  };

  return (
    <div className={`weather-app ${bgClass} ${isDark ? 'dark-theme' : 'light-theme'}`}>
      {/* Fixed Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">SkyTemp</h1>
          <div className="nav-controls">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="nav-btn"
              title="Favorites"
            >
              ⭐
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="nav-btn"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => {
                const isCurrentlyInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
                
                if (isCurrentlyInstalled) {
                  setShowAlreadyInstalled(true);
                } else {
                  setShowInstallPrompt(true);
                }
              }}
              className="nav-btn"
              title={isInstalled ? 'Already Installed' : 'Install App'}
            >
              {isInstalled ? '☑️' : '📱'}
            </button>
            <button
              onClick={() => setUnit((u) => (u === "metric" ? "imperial" : "metric"))}
              className="nav-unit-btn"
            >
              {unit === "metric" ? "°F" : "°C"}
            </button>
          </div>
        </div>
      </nav>

      {/* Favorites Panel */}
      {showFavorites && (
        <div className="favorites-panel">
          <div className="favorites-header">
            <h3>Favorite Cities</h3>
            <button onClick={() => setShowFavorites(false)}>✕</button>
          </div>
          <div className="favorites-list">
            {favorites.length === 0 ? (
              <p className="no-favorites">No favorites yet</p>
            ) : (
              favorites.map((favCity, index) => (
                <div key={index} className="favorite-item">
                  <span onClick={() => fetchAllData(favCity)}>{favCity}</span>
                  <button onClick={() => removeFromFavorites(favCity)}>🗑️</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="install-prompt-overlay">
          <div className="install-prompt">
            <div className="install-content">
              <div className="install-icon">📱</div>
              <h3>Install SkyTemp App</h3>
              <p>Get the best weather experience with our app! Works on desktop and mobile.</p>
              <div className="install-buttons">
                <button onClick={handleInstall} className="install-btn">
                  Install Now
                </button>
                <button 
                  onClick={() => setShowInstallPrompt(false)} 
                  className="install-cancel"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Already Installed Message */}
      {showAlreadyInstalled && (
        <div className="install-prompt-overlay">
          <div className="install-prompt already-installed-prompt">
            <div className="install-content">
              <div className="install-icon">✅</div>
              <h3>Already Installed!</h3>
              <p>SkyTemp is already installed on your device. Enjoy the app! 🎉</p>
              <div className="install-buttons">
                <button 
                  onClick={() => setShowAlreadyInstalled(false)} 
                  className="install-btn"
                >
                  Ok! ✔️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="weather-header">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                  alt=""
                />
                <div className="weather-actions">
                  <button 
                    onClick={addToFavorites}
                    disabled={favorites.includes(city)}
                    className="action-btn"
                    title="Add to favorites"
                  >
                    {favorites.includes(city) ? '⭐ Added' : '⭐ Add'}
                  </button>
                  <button 
                    onClick={shareWeather}
                    className="action-btn"
                    title="Share weather"
                  >
                    📤 Share
                  </button>
                </div>
              </div>

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
                  {uvIndex && (
                    <span>
                      UV Index: {uvIndex.value} ({uvIndex.level})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="cards-grid">
              {air && (
                <div className="card aqi">
                  <h3>🌫️ Air Quality</h3>
                  <div
                    className="aqi-value"
                    style={{ color: getAQIInfo(air.realAQI).color }}
                  >
                    {air.realAQI} <span>{getAQIInfo(air.realAQI).text}</span>
                  </div>
                  <p>PM2.5: {air.components.pm2_5.toFixed(1)} µg/m³</p>
                </div>
              )}

              <div className="card extra-info">
                <h3>📊 Details</h3>
                <div className="extra-stats">
                  <div className="stat-item">
                    <span>Pressure</span>
                    <span>{weather.main.pressure} hPa</span>
                  </div>
                  <div className="stat-item">
                    <span>Visibility</span>
                    <span>{(weather.visibility / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="stat-item">
                    <span>Sunrise</span>
                    <span>{new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="stat-item">
                    <span>Sunset</span>
                    <span>{new Date(weather.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hourly */}
            <div className="card">
              <h3 className="section-title">🕒 Hourly Forecast</h3>
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
              <h3 className="section-title">📅 6-Day Forecast</h3>
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