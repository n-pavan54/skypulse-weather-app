/**
 * Scalable SVG Weather Icons with custom color fills and strokes
 */
const WeatherIcons = {
    // Sun / Clear Day
    'clear-day': `
        <svg viewBox="0 0 64 64" class="weather-svg icon-sun">
            <defs>
                <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FDE047" />
                    <stop offset="100%" stop-color="#F59E0B" />
                </linearGradient>
            </defs>
            <g class="sun-rays" stroke="#F59E0B" stroke-width="3" stroke-linecap="round">
                <line x1="32" y1="8" x2="32" y2="14" />
                <line x1="32" y1="50" x2="32" y2="56" />
                <line x1="8" y1="32" x2="14" y2="32" />
                <line x1="50" y1="32" x2="56" y2="32" />
                <line x1="15" y1="15" x2="19.5" y2="19.5" />
                <line x1="44.5" y1="44.5" x2="49" y2="49" />
                <line x1="15" y1="49" x2="19.5" y2="44.5" />
                <line x1="44.5" y1="19.5" x2="49" y2="15" />
            </g>
            <circle cx="32" cy="32" r="14" fill="url(#sunGrad)" filter="drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))" />
        </svg>
    `,

    // Moon / Clear Night
    'clear-night': `
        <svg viewBox="0 0 64 64" class="weather-svg icon-moon">
            <defs>
                <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#F8FAFC" />
                    <stop offset="100%" stop-color="#93C5FD" />
                </linearGradient>
            </defs>
            <path d="M42 36.5A16.5 16.5 0 0 1 23 15a17 17 0 1 0 25.5 24A16.4 16.4 0 0 1 42 36.5z" 
                  fill="url(#moonGrad)" filter="drop-shadow(0 0 8px rgba(147, 197, 253, 0.5))" />
            <circle cx="48" cy="18" r="1.5" fill="#E2E8F0" class="star-twinkle" />
            <circle cx="16" cy="46" r="1" fill="#E2E8F0" class="star-twinkle" />
            <circle cx="44" cy="48" r="1.2" fill="#E2E8F0" class="star-twinkle" />
        </svg>
    `,

    // Mostly Clear Day
    'mostly-clear-day': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <circle cx="26" cy="24" r="10" fill="#F59E0B" />
            <path d="M46 44H20a10 10 0 0 1-1.5-19.9 13 13 0 0 1 24.3-3.6A11 11 0 0 1 46 44z" fill="#E2E8F0" opacity="0.9" />
        </svg>
    `,

    // Mostly Clear Night
    'mostly-clear-night': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M34 26a10 10 0 0 1-10-10 10 10 0 1 0 15 14 10 10 0 0 1-5-4z" fill="#93C5FD" />
            <path d="M46 46H22a9 9 0 0 1-1.3-17.9 12 12 0 0 1 22.4-3.2A10 10 0 0 1 46 46z" fill="#CBD5E1" opacity="0.9" />
        </svg>
    `,

    // Partly Cloudy Day
    'partly-cloudy-day': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <g class="sun-behind">
                <circle cx="24" cy="24" r="11" fill="#F59E0B" />
                <line x1="24" y1="7" x2="24" y2="10" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" />
                <line x1="10" y1="24" x2="13" y2="24" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" />
                <line x1="14" y1="14" x2="16.5" y2="16.5" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" />
            </g>
            <path d="M48 48H22a10 10 0 0 1-2-19.8 13.5 13.5 0 0 1 25.5-4.2A11.5 11.5 0 0 1 48 48z" 
                  fill="#F1F5F9" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
        </svg>
    `,

    // Partly Cloudy Night
    'partly-cloudy-night': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M30 24a8 8 0 0 1-8-8 8.5 8.5 0 1 0 12.8 11.9A8 8 0 0 1 30 24z" fill="#93C5FD" />
            <path d="M48 48H22a10 10 0 0 1-2-19.8 13.5 13.5 0 0 1 25.5-4.2A11.5 11.5 0 0 1 48 48z" 
                  fill="#E2E8F0" opacity="0.95" />
        </svg>
    `,

    // Overcast / Cloudy
    'overcast': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M42 36H24a8 8 0 0 1-1.6-15.8 11 11 0 0 1 20.6-3.5A9.5 9.5 0 0 1 42 36z" fill="#94A3B8" opacity="0.7" />
            <path d="M50 48H22a11 11 0 0 1-2.2-21.8 14 14 0 0 1 26.8-4.5A12 12 0 0 1 50 48z" 
                  fill="#CBD5E1" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.15))" />
        </svg>
    `,

    // Fog
    'fog': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M46 32H20a9 9 0 0 1-1.5-17.9 12 12 0 0 1 22.8-3.4A10 10 0 0 1 46 32z" fill="#94A3B8" opacity="0.6" />
            <line x1="16" y1="40" x2="48" y2="40" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" />
            <line x1="20" y1="46" x2="52" y2="46" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" />
            <line x1="14" y1="52" x2="44" y2="52" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" />
        </svg>
    `,

    // Drizzle
    'drizzle': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M48 38H20a10 10 0 0 1-1.8-19.8 13 13 0 0 1 24.8-4.1A11 11 0 0 1 48 38z" fill="#94A3B8" />
            <g stroke="#60A5FA" stroke-width="2" stroke-linecap="round" class="rain-drops">
                <line x1="22" y1="44" x2="20" y2="49" />
                <line x1="32" y1="44" x2="30" y2="49" />
                <line x1="42" y1="44" x2="40" y2="49" />
            </g>
        </svg>
    `,

    // Rain / Rain Light
    'rain': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M48 36H20a10 10 0 0 1-1.8-19.8 13 13 0 0 1 24.8-4.1A11 11 0 0 1 48 36z" fill="#64748B" />
            <g stroke="#38BDF8" stroke-width="2.8" stroke-linecap="round" class="rain-drops">
                <line x1="22" y1="43" x2="19" y2="52" />
                <line x1="32" y1="43" x2="29" y2="52" />
                <line x1="42" y1="43" x2="39" y2="52" />
                <line x1="26" y1="48" x2="23" y2="57" />
                <line x1="36" y1="48" x2="33" y2="57" />
            </g>
        </svg>
    `,

    'rain-light': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M48 38H20a10 10 0 0 1-1.8-19.8 13 13 0 0 1 24.8-4.1A11 11 0 0 1 48 38z" fill="#94A3B8" />
            <g stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round" class="rain-drops">
                <line x1="24" y1="44" x2="22" y2="52" />
                <line x1="36" y1="44" x2="34" y2="52" />
            </g>
        </svg>
    `,

    // Heavy Rain
    'heavy-rain': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M48 34H18a11 11 0 0 1-2-21.8 14 14 0 0 1 26.8-4.4A12 12 0 0 1 48 34z" fill="#475569" />
            <g stroke="#0284C7" stroke-width="3" stroke-linecap="round" class="rain-drops">
                <line x1="18" y1="40" x2="14" y2="52" />
                <line x1="28" y1="40" x2="24" y2="52" />
                <line x1="38" y1="40" x2="34" y2="52" />
                <line x1="48" y1="40" x2="44" y2="52" />
                <line x1="22" y1="47" x2="18" y2="59" />
                <line x1="32" y1="47" x2="28" y2="59" />
                <line x1="42" y1="47" x2="38" y2="59" />
            </g>
        </svg>
    `,

    // Showers
    'showers': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <circle cx="22" cy="22" r="10" fill="#F59E0B" />
            <path d="M48 38H22a10 10 0 0 1-2-19.8 13.5 13.5 0 0 1 25.5-4.2A11.5 11.5 0 0 1 48 38z" fill="#64748B" />
            <g stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" class="rain-drops">
                <line x1="24" y1="44" x2="21" y2="53" />
                <line x1="34" y1="44" x2="31" y2="53" />
                <line x1="44" y1="44" x2="41" y2="53" />
            </g>
        </svg>
    `,

    // Snow
    'snow': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M48 36H20a10 10 0 0 1-1.8-19.8 13 13 0 0 1 24.8-4.1A11 11 0 0 1 48 36z" fill="#94A3B8" />
            <g fill="#E0F2FE" class="snowflakes">
                <circle cx="22" cy="45" r="2.2" />
                <circle cx="32" cy="49" r="2.5" />
                <circle cx="42" cy="44" r="2.2" />
                <circle cx="26" cy="54" r="2" />
                <circle cx="38" cy="55" r="2" />
            </g>
        </svg>
    `,

    'snow-light': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M48 36H20a10 10 0 0 1-1.8-19.8 13 13 0 0 1 24.8-4.1A11 11 0 0 1 48 36z" fill="#CBD5E1" />
            <g fill="#BAE6FD" class="snowflakes">
                <circle cx="26" cy="46" r="2" />
                <circle cx="38" cy="48" r="2.2" />
                <circle cx="32" cy="56" r="1.8" />
            </g>
        </svg>
    `,

    // Thunderstorm
    'thunderstorm': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M48 32H18a11 11 0 0 1-2-21.8 14 14 0 0 1 26.8-4.4A12 12 0 0 1 48 32z" fill="#334155" />
            <polygon points="31,34 23,46 30,46 27,58 39,44 32,44" fill="#FBBF24" filter="drop-shadow(0 0 6px #F59E0B)" />
            <g stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round">
                <line x1="17" y1="42" x2="14" y2="50" />
                <line x1="45" y1="42" x2="42" y2="50" />
            </g>
        </svg>
    `,

    // Wind
    'wind': `
        <svg viewBox="0 0 64 64" class="weather-svg">
            <path d="M14 24h26a5 5 0 1 0-5-5" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" />
            <path d="M10 32h36a5 5 0 1 1-5 5" fill="none" stroke="#60A5FA" stroke-width="3.5" stroke-linecap="round" />
            <path d="M16 40h20a4 4 0 1 0-4-4" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" />
        </svg>
    `
};

function getWeatherIconSvg(iconName) {
    if (!iconName) return WeatherIcons['clear-day'];
    if (WeatherIcons[iconName]) return WeatherIcons[iconName];

    // Fallbacks
    if (iconName.includes('rain') || iconName.includes('drizzle')) return WeatherIcons['rain'];
    if (iconName.includes('snow')) return WeatherIcons['snow'];
    if (iconName.includes('thunder')) return WeatherIcons['thunderstorm'];
    if (iconName.includes('cloud') || iconName.includes('overcast')) return WeatherIcons['overcast'];
    if (iconName.includes('night')) return WeatherIcons['clear-night'];
    return WeatherIcons['clear-day'];
}
