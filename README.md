# 🌤️ SkyPulse Weather — Full-Stack Spring Boot Application

SkyPulse is a full-stack weather application built with **Spring Boot 3.3.4** and **Java 22** on the backend, and a dynamic, responsive glassmorphic web interface on the frontend. It integrates real-time meteorological data and geocoding without requiring external API keys.

---

## ✨ Features

- **Real-Time Weather & Highlights**:
  - Live temperature, feels-like temperature, and high/low ranges.
  - WMO weather code interpretation with animated SVG weather icons.
  - Highlights grid: Wind speed & cardinal direction with compass arrow, Humidity & Dew Point, UV Index with gauge bar, Air Quality Index (US AQI & PM2.5), Atmospheric Pressure, Cloud Cover, Precipitation, Sunrise and Sunset times.
- **Hourly Forecast (Next 24 Hours)**:
  - Smooth horizontal scrollable carousel with time, weather icon, temperature, and rain probability.
- **7-Day Extended Forecast**:
  - Daily outlook with min/max temperatures, rain chance, and visual relative temperature spectrum bars.
- **City Search & Autocomplete**:
  - Debounced typeahead search for cities and regions worldwide with country codes and keyboard navigation (`↑`/`↓`/`Enter`/`Esc`).
- **Geolocation**:
  - One-click "Use My Location" GPS button to fetch live local weather.
- **Persistent Favorites**:
  - Add or remove favorite cities.
  - Stored in an embedded file-based **H2 database** via **Spring Data JPA**.
  - Quick-access favorites bar and favorites drawer showing live temperatures and weather badges.
- **Unit Conversion**:
  - Instant toggle between **°C** (Celsius & km/h) and **°F** (Fahrenheit & mph) with persistent user preference in `localStorage`.
- **Dynamic Weather Themes & Ambient Canvas**:
  - Adaptive ambient background canvas (twinkling night stars, falling rain, drifting snow, warm sunbeams, or subtle lightning flash) reflecting the active weather condition.
- **Performance & Caching**:
  - In-memory **Caffeine cache** for weather and geocoding queries with a 15-minute TTL to reduce redundant external requests.

---

## 🛠️ Tech Stack

- **Backend**:
  - Java 22
  - Spring Boot 3.3.4
  - Spring MVC (`spring-boot-starter-web`)
  - Spring Data JPA (`spring-boot-starter-data-jpa`)
  - H2 Database (`com.h2database:h2`)
  - Spring Cache + Caffeine (`com.github.ben-manes.caffeine`)
  - Jakarta Validation (`spring-boot-starter-validation`)
  - Modern `RestClient` with timeout handling
- **Frontend**:
  - Semantic HTML5, Vanilla CSS, and Modern JavaScript (ES6+)
  - Glassmorphic design system (`backdrop-filter: blur(20px)`)
  - Dynamic HTML5 Canvas particle system
  - Responsive design for mobile, tablet, and desktop

---

## 🚀 Running the Application

### Prerequisites
- **Java 22** (or Java 17+)
- **Maven 3.9+**

### Steps to Run

1. **Clone / Navigate to the project directory**:
   ```bash
   cd c:\Users\npava\OneDrive\Desktop\projects
   ```

2. **Build and package the project**:
   ```bash
   mvn clean package -DskipTests
   ```

3. **Run the Spring Boot application**:
   ```bash
   java -jar target/weather-app-1.0.0.jar
   ```
   *Or with Maven:*
   ```bash
   mvn spring-boot:run
   ```

4. **Access the application**:
   - Open your browser and navigate to: **[http://localhost:8080](http://localhost:8080)**
   - H2 Database Console: **[http://localhost:8080/h2-console](http://localhost:8080/h2-console)**
     - JDBC URL: `jdbc:h2:file:./data/weatherdb`
     - Username: `sa`
     - Password: *(blank)*

---

## 📡 REST API Documentation

### Weather Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/weather?city={cityName}` | Get complete weather forecast (current, hourly, 7-day, air quality) for a city name (e.g. `London`, `Tokyo`) |
| `GET` | `/api/weather/coords?lat={latitude}&lon={longitude}` | Get complete weather forecast for geographic coordinates |
| `GET` | `/api/weather/search?q={query}` | Search cities with instant autocomplete suggestions |

### Favorites Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/favorites` | Retrieve all saved favorite cities with current live temperatures |
| `POST` | `/api/favorites` | Add a new favorite city (requires JSON body) |
| `DELETE` | `/api/favorites/{id}` | Remove a favorite city by its ID |
