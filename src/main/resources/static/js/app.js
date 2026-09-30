/**
 * SkyPulse Weather App - Full-Stack Client Logic
 */
(function() {
    'use strict';

    // Application State
    const state = {
        weather: null,
        unit: localStorage.getItem('skypulse_unit') || 'C', // 'C' or 'F'
        favorites: [],
        currentCity: 'London',
        searchQuery: '',
        searchDebounceTimer: null,
        activeSearchIndex: -1,
        searchResults: [],
        canvasAnimationId: null
    };

    // DOM Elements
    const elements = {
        body: document.body,
        canvas: document.getElementById('ambient-canvas'),
        // Search
        searchInput: document.getElementById('search-input'),
        searchClearBtn: document.getElementById('search-clear'),
        searchDropdown: document.getElementById('search-dropdown'),
        geoBtn: document.getElementById('btn-geolocation'),
        // Units
        unitBtnC: document.getElementById('unit-c'),
        unitBtnF: document.getElementById('unit-f'),
        // Favorites
        quickFavsBar: document.getElementById('quick-favorites-bar'),
        btnOpenFavs: document.getElementById('btn-open-favorites'),
        favCountBadge: document.getElementById('fav-count-badge'),
        favToggleBtn: document.getElementById('btn-favorite-toggle'),
        favModal: document.getElementById('favorites-modal'),
        favModalClose: document.getElementById('modal-close-btn'),
        favModalList: document.getElementById('modal-favorites-list'),
        // Hero
        cityName: document.getElementById('hero-city-name'),
        citySub: document.getElementById('hero-city-sub'),
        cityTime: document.getElementById('hero-city-time'),
        mainTemp: document.getElementById('hero-main-temp'),
        tempUnit: document.getElementById('hero-temp-unit'),
        conditionText: document.getElementById('hero-condition-text'),
        feelsLikeText: document.getElementById('hero-feels-like'),
        tempHigh: document.getElementById('hero-temp-high'),
        tempLow: document.getElementById('hero-temp-low'),
        heroIcon: document.getElementById('hero-weather-icon'),
        // Hourly & Daily
        hourlyList: document.getElementById('hourly-scroll-list'),
        dailyList: document.getElementById('daily-forecast-list'),
        // Metrics
        windSpeed: document.getElementById('metric-wind-speed'),
        windDirCardinal: document.getElementById('metric-wind-cardinal'),
        windArrow: document.getElementById('metric-wind-arrow'),
        windGusts: document.getElementById('metric-wind-gusts'),
        humidity: document.getElementById('metric-humidity'),
        humidityStatus: document.getElementById('metric-humidity-status'),
        dewPoint: document.getElementById('metric-dew-point'),
        uvIndex: document.getElementById('metric-uv-index'),
        uvDesc: document.getElementById('metric-uv-desc'),
        uvGaugeFill: document.getElementById('metric-uv-gauge-fill'),
        aqiValue: document.getElementById('metric-aqi-value'),
        aqiCategory: document.getElementById('metric-aqi-category'),
        aqiPm25: document.getElementById('metric-aqi-pm25'),
        pressure: document.getElementById('metric-pressure'),
        cloudCover: document.getElementById('metric-cloud-cover'),
        cloudGaugeFill: document.getElementById('metric-cloud-gauge-fill'),
        precipitation: document.getElementById('metric-precipitation'),
        sunriseTime: document.getElementById('metric-sunrise'),
        sunsetTime: document.getElementById('metric-sunset'),
        // Toast container
        toastContainer: document.getElementById('toast-container')
    };

    // -------------------------------------------------------------
    // Helper Functions & Unit Conversion
    // -------------------------------------------------------------
    function toFahrenheit(celsius) {
        return (celsius * 9 / 5) + 32;
    }

    function formatTemp(celsius, includeDegree = true) {
        if (celsius === null || celsius === undefined) return '--';
        let val = state.unit === 'F' ? toFahrenheit(celsius) : celsius;
        let rounded = Math.round(val);
        return includeDegree ? `${rounded}°` : `${rounded}`;
    }

    function formatSpeed(kmh) {
        if (kmh === null || kmh === undefined) return '--';
        if (state.unit === 'F') {
            let mph = Math.round(kmh * 0.621371);
            return `${mph} mph`;
        }
        return `${Math.round(kmh)} km/h`;
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;
        elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // -------------------------------------------------------------
    // API Calls
    // -------------------------------------------------------------
    async function fetchWeatherByCity(cityName) {
        setLoadingState(true);
        try {
            const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'City not found');
            }
            const data = await res.json();
            state.weather = data;
            state.currentCity = data.location.name;
            renderAll();
        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    async function fetchWeatherByCoords(lat, lon) {
        setLoadingState(true);
        try {
            const res = await fetch(`/api/weather/coords?lat=${lat}&lon=${lon}`);
            if (!res.ok) throw new Error('Could not retrieve weather for your location');
            const data = await res.json();
            state.weather = data;
            state.currentCity = data.location.name;
            renderAll();
            showToast(`Weather updated for ${data.location.name}`, 'success');
        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    async function searchCitiesApi(query) {
        if (!query || query.trim().length < 2) return [];
        try {
            const res = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            console.error('Search error', e);
            return [];
        }
    }

    async function loadFavorites() {
        try {
            const res = await fetch('/api/favorites');
            if (res.ok) {
                state.favorites = await res.json();
                renderFavoritesBar();
                renderFavoritesModalList();
                updateFavBadge();
                checkCurrentIsFav();
            }
        } catch (e) {
            console.warn('Could not load favorites', e);
        }
    }

    async function toggleFavorite() {
        if (!state.weather) return;
        const loc = state.weather.location;
        const isFav = state.weather.isFavorite;

        if (isFav && state.weather.favoriteId) {
            // Remove
            try {
                const res = await fetch(`/api/favorites/${state.weather.favoriteId}`, { method: 'DELETE' });
                if (res.ok) {
                    state.weather.isFavorite = false;
                    state.weather.favoriteId = null;
                    elements.favToggleBtn.classList.remove('is-favorite');
                    showToast(`Removed ${loc.name} from favorites`, 'info');
                    loadFavorites();
                }
            } catch (e) {
                showToast('Failed to remove favorite', 'error');
            }
        } else {
            // Add
            try {
                const reqData = {
                    name: loc.name,
                    country: loc.country,
                    countryCode: loc.countryCode,
                    admin1: loc.admin1,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    timezone: loc.timezone
                };
                const res = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqData)
                });
                if (res.ok) {
                    const saved = await res.json();
                    state.weather.isFavorite = true;
                    state.weather.favoriteId = saved.id;
                    elements.favToggleBtn.classList.add('is-favorite');
                    showToast(`Saved ${loc.name} to favorites!`, 'success');
                    loadFavorites();
                }
            } catch (e) {
                showToast('Failed to save favorite', 'error');
            }
        }
    }

    async function deleteFavoriteById(id, cityName, e) {
        if (e) e.stopPropagation();
        try {
            const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast(`Removed ${cityName}`, 'info');
                if (state.weather && state.weather.favoriteId === id) {
                    state.weather.isFavorite = false;
                    state.weather.favoriteId = null;
                    elements.favToggleBtn.classList.remove('is-favorite');
                }
                loadFavorites();
            }
        } catch (e) {
            showToast('Failed to delete favorite', 'error');
        }
    }

    // -------------------------------------------------------------
    // Rendering Logic
    // -------------------------------------------------------------
    function renderAll() {
        if (!state.weather) return;

        updateTheme();
        renderHero();
        renderHourly();
        renderDaily();
        renderMetrics();
        checkCurrentIsFav();
    }

    function updateTheme() {
        const cur = state.weather.current;
        const code = cur.weatherCode;
        const isDay = cur.isDay;

        // Reset theme classes
        elements.body.className = '';

        let theme = 'theme-clear-day';
        if (!isDay && (code === 0 || code === 1)) {
            theme = 'theme-clear-night';
        } else if (code >= 95) {
            theme = 'theme-thunderstorm';
        } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
            theme = 'theme-rain';
        } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
            theme = 'theme-snow';
        } else if (code === 2 || code === 3 || code === 45 || code === 48) {
            theme = 'theme-clouds';
        } else if (isDay) {
            theme = 'theme-clear-day';
        } else {
            theme = 'theme-clear-night';
        }

        elements.body.classList.add(theme);
        initDynamicCanvas(theme);
    }

    function renderHero() {
        const w = state.weather;
        const loc = w.location;
        const cur = w.current;
        const dailyToday = w.daily && w.daily.length > 0 ? w.daily[0] : null;

        elements.cityName.textContent = loc.name;
        
        let subDetails = [];
        if (loc.admin1 && loc.admin1 !== loc.name) subDetails.push(loc.admin1);
        if (loc.country) subDetails.push(loc.country);
        elements.citySub.textContent = subDetails.join(', ') || 'Global Location';

        // Local Time formatting
        if (loc.localTime) {
            try {
                const dateObj = new Date(loc.localTime);
                const options = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                elements.cityTime.textContent = dateObj.toLocaleDateString('en-US', options);
            } catch (e) {
                elements.cityTime.textContent = loc.localTime.replace('T', ' ');
            }
        }

        elements.mainTemp.textContent = formatTemp(cur.temperature, false);
        elements.tempUnit.textContent = `°${state.unit}`;

        elements.conditionText.textContent = cur.weatherDescription;
        elements.feelsLikeText.textContent = `Feels like ${formatTemp(cur.apparentTemperature)}`;

        if (dailyToday) {
            elements.tempHigh.textContent = formatTemp(dailyToday.maxTemperature);
            elements.tempLow.textContent = formatTemp(dailyToday.minTemperature);
        }

        elements.heroIcon.innerHTML = getWeatherIconSvg(cur.weatherIcon);

        if (w.isFavorite) {
            elements.favToggleBtn.classList.add('is-favorite');
        } else {
            elements.favToggleBtn.classList.remove('is-favorite');
        }
    }

    function renderHourly() {
        const hourly = state.weather.hourly || [];
        elements.hourlyList.innerHTML = '';

        hourly.forEach((hour, idx) => {
            const item = document.createElement('div');
            item.className = `hourly-item ${idx === 0 ? 'is-current' : ''}`;

            let timeLabel = 'Now';
            if (idx > 0 && hour.time) {
                timeLabel = hour.time.length >= 16 ? hour.time.substring(11, 16) : hour.time;
            }

            const popHtml = hour.precipitationProbability > 0 
                ? `<div class="hourly-pop">💧 ${hour.precipitationProbability}%</div>` 
                : `<div class="hourly-pop" style="visibility:hidden">0%</div>`;

            item.innerHTML = `
                <div class="hourly-time">${timeLabel}</div>
                <div class="hourly-icon">${getWeatherIconSvg(hour.weatherIcon)}</div>
                <div class="hourly-temp">${formatTemp(hour.temperature)}</div>
                ${popHtml}
            `;
            elements.hourlyList.appendChild(item);
        });
    }

    function renderDaily() {
        const daily = state.weather.daily || [];
        elements.dailyList.innerHTML = '';

        // Find min and max across all 7 days to calibrate the spectrum bar!
        let allMin = Math.min(...daily.map(d => d.minTemperature));
        let allMax = Math.max(...daily.map(d => d.maxTemperature));
        let span = allMax - allMin;
        if (span <= 0) span = 1;

        daily.forEach((day, idx) => {
            const row = document.createElement('div');
            row.className = `daily-row ${idx === 0 ? 'is-today' : ''}`;

            // Calculate percentage left and width for the spectrum bar
            const leftPercent = Math.max(0, Math.min(100, ((day.minTemperature - allMin) / span) * 100));
            const widthPercent = Math.max(15, Math.min(100 - leftPercent, ((day.maxTemperature - day.minTemperature) / span) * 100));

            const popBadge = day.precipitationProbabilityMax > 0
                ? `<span class="daily-pop-badge">💧 ${day.precipitationProbabilityMax}%</span>`
                : '';

            row.innerHTML = `
                <div class="daily-day">${day.dayOfWeek}</div>
                <div class="daily-icon">${getWeatherIconSvg(day.weatherIcon)}</div>
                <div class="daily-pop-cond">
                    <span>${day.weatherDescription}</span>
                    ${popBadge}
                </div>
                <div class="daily-temp-bar-wrap">
                    <span class="daily-temp-min">${formatTemp(day.minTemperature)}</span>
                    <div class="temp-spectrum-bar">
                        <div class="temp-spectrum-fill" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
                    </div>
                    <span class="daily-temp-max">${formatTemp(day.maxTemperature)}</span>
                </div>
            `;
            elements.dailyList.appendChild(row);
        });
    }

    function renderMetrics() {
        const cur = state.weather.current;
        const aq = state.weather.airQuality;
        const dailyToday = state.weather.daily && state.weather.daily[0];

        // 1. Wind
        elements.windSpeed.textContent = formatSpeed(cur.windSpeed);
        elements.windDirCardinal.textContent = cur.windDirectionCardinal || 'N';
        if (elements.windArrow && cur.windDirection !== null) {
            elements.windArrow.style.transform = `rotate(${cur.windDirection}deg)`;
        }
        elements.windGusts.textContent = cur.windGusts ? `Gusts up to ${formatSpeed(cur.windGusts)}` : 'Steady breeze';

        // 2. Humidity & Dew Point
        elements.humidity.textContent = `${cur.relativeHumidity || 0}%`;
        let humStatus = 'Comfortable';
        if (cur.relativeHumidity < 30) humStatus = 'Dry';
        else if (cur.relativeHumidity > 70) humStatus = 'Humid';
        elements.humidityStatus.textContent = humStatus;
        elements.dewPoint.textContent = cur.dewPoint ? `Dew point is ${formatTemp(cur.dewPoint)}` : '';

        // 3. UV Index
        const uv = cur.uvIndex || 0;
        elements.uvIndex.textContent = uv.toFixed(1);
        elements.uvDesc.textContent = cur.uvDescription || 'Low';
        const uvPercent = Math.min(100, (uv / 11) * 100);
        elements.uvGaugeFill.style.width = `${uvPercent}%`;
        elements.uvGaugeFill.style.background = uv <= 2 ? '#10B981' : (uv <= 5 ? '#F59E0B' : (uv <= 7 ? '#F97316' : '#EF4444'));

        // 4. Air Quality
        if (aq) {
            elements.aqiValue.textContent = aq.usAqi || '--';
            elements.aqiCategory.textContent = aq.aqiCategory || 'Good';
            elements.aqiCategory.style.backgroundColor = `${aq.aqiColor}25`;
            elements.aqiCategory.style.color = aq.aqiColor;
            elements.aqiPm25.textContent = aq.pm25 ? `PM2.5: ${aq.pm25.toFixed(1)} µg/m³` : '';
        }

        // 5. Pressure
        elements.pressure.textContent = cur.pressureMsl ? `${Math.round(cur.pressureMsl)} hPa` : '1013 hPa';

        // 6. Cloud Cover
        const clouds = cur.cloudCover || 0;
        elements.cloudCover.textContent = `${clouds}%`;
        elements.cloudGaugeFill.style.width = `${clouds}%`;

        // 7. Precipitation
        elements.precipitation.textContent = cur.precipitation ? `${cur.precipitation} mm` : '0 mm';

        // 8. Sunrise & Sunset
        if (dailyToday) {
            elements.sunriseTime.textContent = dailyToday.sunrise || '--:--';
            elements.sunsetTime.textContent = dailyToday.sunset || '--:--';
        }
    }

    function checkCurrentIsFav() {
        if (!state.weather) return;
        const loc = state.weather.location;
        const match = state.favorites.find(f => 
            f.name.toLowerCase() === loc.name.toLowerCase() && 
            (!loc.country || f.country.toLowerCase() === loc.country.toLowerCase())
        );

        if (match) {
            state.weather.isFavorite = true;
            state.weather.favoriteId = match.id;
            elements.favToggleBtn.classList.add('is-favorite');
        } else {
            state.weather.isFavorite = false;
            state.weather.favoriteId = null;
            elements.favToggleBtn.classList.remove('is-favorite');
        }
    }

    function renderFavoritesBar() {
        elements.quickFavsBar.innerHTML = '';
        state.favorites.slice(0, 6).forEach(fav => {
            const chip = document.createElement('div');
            chip.className = `quick-fav-chip ${state.currentCity.toLowerCase() === fav.name.toLowerCase() ? 'active' : ''}`;
            
            const tempVal = fav.currentTemperature !== null ? formatTemp(fav.currentTemperature) : '';
            const iconSvg = getWeatherIconSvg(fav.weatherIcon || 'clear-day');

            chip.innerHTML = `
                ${iconSvg}
                <span>${fav.name}</span>
                ${tempVal ? `<span class="chip-temp">${tempVal}</span>` : ''}
            `;

            chip.addEventListener('click', () => {
                fetchWeatherByCoords(fav.latitude, fav.longitude);
            });

            elements.quickFavsBar.appendChild(chip);
        });
    }

    function renderFavoritesModalList() {
        elements.favModalList.innerHTML = '';
        if (state.favorites.length === 0) {
            elements.favModalList.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                    No favorite cities saved yet.<br>Click the star icon next to any city to bookmark it!
                </div>
            `;
            return;
        }

        state.favorites.forEach(fav => {
            const card = document.createElement('div');
            card.className = 'fav-card-item';

            const tempStr = fav.currentTemperature !== null ? formatTemp(fav.currentTemperature) : '';
            const iconSvg = getWeatherIconSvg(fav.weatherIcon || 'clear-day');

            card.innerHTML = `
                <div class="fav-info">
                    <div class="fav-city-name">${fav.name}</div>
                    <div class="fav-country-name">${fav.admin1 ? fav.admin1 + ', ' : ''}${fav.country || ''}</div>
                </div>
                <div class="fav-weather-side">
                    ${iconSvg ? `<div class="fav-icon">${iconSvg}</div>` : ''}
                    ${tempStr ? `<div class="fav-temp">${tempStr}</div>` : ''}
                    <button class="fav-delete-btn" title="Remove from favorites" data-id="${fav.id}">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;

            card.addEventListener('click', () => {
                elements.favModal.classList.remove('active');
                fetchWeatherByCoords(fav.latitude, fav.longitude);
            });

            const delBtn = card.querySelector('.fav-delete-btn');
            delBtn.addEventListener('click', (e) => {
                deleteFavoriteById(fav.id, fav.name, e);
            });

            elements.favModalList.appendChild(card);
        });
    }

    function updateFavBadge() {
        elements.favCountBadge.textContent = state.favorites.length;
    }

    function setLoadingState(loading) {
        if (loading) {
            elements.cityName.classList.add('skeleton');
            elements.mainTemp.classList.add('skeleton');
        } else {
            elements.cityName.classList.remove('skeleton');
            elements.mainTemp.classList.remove('skeleton');
        }
    }

    // -------------------------------------------------------------
    // Dynamic Ambient Canvas Animation
    // -------------------------------------------------------------
    function initDynamicCanvas(theme) {
        if (state.canvasAnimationId) {
            cancelAnimationFrame(state.canvasAnimationId);
            state.canvasAnimationId = null;
        }

        const canvas = elements.canvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.removeEventListener('resize', resize);
        window.addEventListener('resize', resize);

        const particles = [];
        const isRain = theme === 'theme-rain';
        const isSnow = theme === 'theme-snow';
        const isNight = theme === 'theme-clear-night';
        const isThunder = theme === 'theme-thunderstorm';
        const isDay = theme === 'theme-clear-day';

        const count = isRain ? 90 : (isSnow ? 60 : (isNight ? 70 : 35));

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: isSnow ? Math.random() * 2.5 + 1 : (isNight ? Math.random() * 1.5 + 0.5 : Math.random() * 2),
                speedY: isRain ? Math.random() * 12 + 10 : (isSnow ? Math.random() * 1.2 + 0.6 : (isNight ? 0 : Math.random() * 0.4 - 0.2)),
                speedX: isRain ? -1.5 : (isSnow ? Math.sin(i) * 0.5 : Math.random() * 0.4 - 0.2),
                opacity: Math.random() * 0.7 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.005
            });
        }

        let thunderCounter = 0;

        function renderCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (isThunder) {
                thunderCounter++;
                if (thunderCounter > 180 && Math.random() < 0.03) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    thunderCounter = 0;
                }
            }

            for (let p of particles) {
                if (isRain) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.speedX * 2, p.y + p.speedY * 1.5);
                    ctx.strokeStyle = `rgba(125, 211, 252, ${p.opacity * 0.5})`;
                    ctx.lineWidth = 1.4;
                    ctx.stroke();

                    p.x += p.speedX;
                    p.y += p.speedY;

                    if (p.y > canvas.height) {
                        p.y = -10;
                        p.x = Math.random() * canvas.width;
                    }
                } else if (isSnow) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.8})`;
                    ctx.fill();

                    p.y += p.speedY;
                    p.x += Math.sin(p.y * 0.01) * 0.5;

                    if (p.y > canvas.height) {
                        p.y = -5;
                        p.x = Math.random() * canvas.width;
                    }
                } else if (isNight) {
                    p.opacity += p.twinkleSpeed;
                    if (p.opacity > 0.9 || p.opacity < 0.2) p.twinkleSpeed = -p.twinkleSpeed;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, p.opacity)})`;
                    ctx.fill();
                } else {
                    // Soft warm particles
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(250, 204, 21, ${p.opacity * 0.25})`;
                    ctx.fill();

                    p.x += p.speedX;
                    p.y += p.speedY;

                    if (p.x < 0) p.x = canvas.width;
                    if (p.x > canvas.width) p.x = 0;
                    if (p.y < 0) p.y = canvas.height;
                    if (p.y > canvas.height) p.y = 0;
                }
            }

            state.canvasAnimationId = requestAnimationFrame(renderCanvas);
        }

        renderCanvas();
    }

    // -------------------------------------------------------------
    // Search & Autocomplete Event Listeners
    // -------------------------------------------------------------
    function setupSearch() {
        elements.searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            state.searchQuery = val;
            elements.searchClearBtn.style.display = val.length > 0 ? 'block' : 'none';

            clearTimeout(state.searchDebounceTimer);
            if (val.trim().length < 2) {
                elements.searchDropdown.classList.remove('active');
                state.searchResults = [];
                return;
            }

            state.searchDebounceTimer = setTimeout(async () => {
                const results = await searchCitiesApi(val);
                state.searchResults = results;
                state.activeSearchIndex = -1;
                renderSearchResults(results);
            }, 250);
        });

        elements.searchInput.addEventListener('keydown', (e) => {
            const items = elements.searchDropdown.querySelectorAll('.search-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                state.activeSearchIndex = (state.activeSearchIndex + 1) % items.length;
                highlightSearchItem(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                state.activeSearchIndex = (state.activeSearchIndex - 1 + items.length) % items.length;
                highlightSearchItem(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (state.activeSearchIndex >= 0 && state.searchResults[state.activeSearchIndex]) {
                    selectSearchResult(state.searchResults[state.activeSearchIndex]);
                } else if (elements.searchInput.value.trim()) {
                    fetchWeatherByCity(elements.searchInput.value.trim());
                    closeSearchDropdown();
                }
            } else if (e.key === 'Escape') {
                closeSearchDropdown();
            }
        });

        elements.searchClearBtn.addEventListener('click', () => {
            elements.searchInput.value = '';
            elements.searchClearBtn.style.display = 'none';
            closeSearchDropdown();
            elements.searchInput.focus();
        });

        document.addEventListener('click', (e) => {
            if (!elements.searchInput.contains(e.target) && !elements.searchDropdown.contains(e.target)) {
                closeSearchDropdown();
            }
        });
    }

    function highlightSearchItem(items) {
        items.forEach((item, idx) => {
            if (idx === state.activeSearchIndex) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    function renderSearchResults(results) {
        elements.searchDropdown.innerHTML = '';
        if (results.length === 0) {
            elements.searchDropdown.innerHTML = `
                <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
                    No matching cities found
                </div>
            `;
            elements.searchDropdown.classList.add('active');
            return;
        }

        results.forEach(city => {
            const item = document.createElement('div');
            item.className = 'search-item';

            let subtitle = [];
            if (city.admin1) subtitle.push(city.admin1);
            if (city.country) subtitle.push(city.country);

            item.innerHTML = `
                <div class="search-item-info">
                    <span class="search-item-title">${city.name}</span>
                    <span class="search-item-subtitle">${subtitle.join(', ')}</span>
                </div>
                ${city.countryCode ? `<span class="search-item-badge">${city.countryCode}</span>` : ''}
            `;

            item.addEventListener('click', () => {
                selectSearchResult(city);
            });

            elements.searchDropdown.appendChild(item);
        });

        elements.searchDropdown.classList.add('active');
    }

    function selectSearchResult(city) {
        elements.searchInput.value = `${city.name}, ${city.country || ''}`;
        closeSearchDropdown();
        fetchWeatherByCoords(city.latitude, city.longitude);
    }

    function closeSearchDropdown() {
        elements.searchDropdown.classList.remove('active');
        state.activeSearchIndex = -1;
    }

    // -------------------------------------------------------------
    // Unit Switcher
    // -------------------------------------------------------------
    function setupUnitToggle() {
        function setUnit(newUnit) {
            if (state.unit === newUnit) return;
            state.unit = newUnit;
            localStorage.setItem('skypulse_unit', newUnit);

            if (newUnit === 'C') {
                elements.unitBtnC.classList.add('active');
                elements.unitBtnF.classList.remove('active');
            } else {
                elements.unitBtnF.classList.add('active');
                elements.unitBtnC.classList.remove('active');
            }

            renderAll();
            renderFavoritesBar();
            renderFavoritesModalList();
        }

        elements.unitBtnC.addEventListener('click', () => setUnit('C'));
        elements.unitBtnF.addEventListener('click', () => setUnit('F'));

        // Initialize active class
        if (state.unit === 'F') {
            elements.unitBtnF.classList.add('active');
            elements.unitBtnC.classList.remove('active');
        } else {
            elements.unitBtnC.classList.add('active');
            elements.unitBtnF.classList.remove('active');
        }
    }

    // -------------------------------------------------------------
    // Geolocation Setup
    // -------------------------------------------------------------
    function setupGeolocation() {
        elements.geoBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast('Geolocation is not supported by your browser', 'error');
                return;
            }

            elements.geoBtn.style.transform = 'rotate(180deg)';
            elements.geoBtn.style.transition = 'transform 0.5s ease';

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    elements.geoBtn.style.transform = '';
                    fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    elements.geoBtn.style.transform = '';
                    console.warn(err);
                    showToast('Location access denied. Please search for your city above.', 'info');
                },
                { timeout: 10000 }
            );
        });
    }

    // -------------------------------------------------------------
    // Favorites Setup
    // -------------------------------------------------------------
    function setupFavorites() {
        elements.favToggleBtn.addEventListener('click', toggleFavorite);

        elements.btnOpenFavs.addEventListener('click', () => {
            renderFavoritesModalList();
            elements.favModal.classList.add('active');
        });

        elements.favModalClose.addEventListener('click', () => {
            elements.favModal.classList.remove('active');
        });

        elements.favModal.addEventListener('click', (e) => {
            if (e.target === elements.favModal) {
                elements.favModal.classList.remove('active');
            }
        });
    }

    // -------------------------------------------------------------
    // Application Initialization
    // -------------------------------------------------------------
    function init() {
        setupSearch();
        setupUnitToggle();
        setupGeolocation();
        setupFavorites();

        // Load initial favorites from backend
        loadFavorites();

        // Load initial city weather (London default)
        fetchWeatherByCity('London');
    }

    // Boot on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
