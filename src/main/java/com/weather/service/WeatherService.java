package com.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weather.exception.WeatherServiceException;
import com.weather.model.dto.*;
import com.weather.repository.FavoriteCityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class WeatherService {

    private static final Logger log = LoggerFactory.getLogger(WeatherService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final WeatherCodeInterpreter interpreter;
    private final GeocodingService geocodingService;
    private final AirQualityService airQualityService;
    private final FavoriteCityRepository favoriteCityRepository;

    @Value("${weather.api.forecast-url:https://api.open-meteo.com/v1/forecast}")
    private String forecastUrl;

    public WeatherService(RestClient restClient,
                          ObjectMapper objectMapper,
                          WeatherCodeInterpreter interpreter,
                          GeocodingService geocodingService,
                          AirQualityService airQualityService,
                          FavoriteCityRepository favoriteCityRepository) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.interpreter = interpreter;
        this.geocodingService = geocodingService;
        this.airQualityService = airQualityService;
        this.favoriteCityRepository = favoriteCityRepository;
    }

    public WeatherFullResponseDTO getWeatherByCity(String cityName) {
        CitySearchResultDTO city = geocodingService.getTopCityMatch(cityName);
        LocationDTO location = new LocationDTO(
                city.name(),
                city.country(),
                city.countryCode(),
                city.admin1(),
                city.latitude(),
                city.longitude(),
                city.timezone(),
                null
        );

        return fetchWeatherData(location);
    }

    public WeatherFullResponseDTO getWeatherByCoordinates(double latitude, double longitude) {
        LocationDTO location = geocodingService.reverseGeocode(latitude, longitude);
        return fetchWeatherData(location);
    }

    @Cacheable(value = "weatherCache", key = "T(java.lang.String).format('%.2f_%.2f', #location.latitude(), #location.longitude())")
    public WeatherFullResponseDTO fetchWeatherData(LocationDTO location) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(forecastUrl)
                    .queryParam("latitude", location.latitude())
                    .queryParam("longitude", location.longitude())
                    .queryParam("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m")
                    .queryParam("hourly", "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,precipitation,is_day")
                    .queryParam("daily", "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max")
                    .queryParam("timezone", "auto")
                    .build()
                    .toUri();

            String response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);

            // Update timezone and local time
            String timezone = root.hasNonNull("timezone") ? root.get("timezone").asText() : location.timezone();

            JsonNode currentNode = root.get("current");
            JsonNode dailyNode = root.get("daily");
            JsonNode hourlyNode = root.get("hourly");

            String localTimeString = currentNode != null && currentNode.hasNonNull("time")
                    ? currentNode.get("time").asText()
                    : LocalDateTime.now().toString();

            LocationDTO updatedLocation = new LocationDTO(
                    location.name(),
                    location.country(),
                    location.countryCode(),
                    location.admin1(),
                    location.latitude(),
                    location.longitude(),
                    timezone,
                    localTimeString
            );

            // 1. Current Weather
            CurrentWeatherDTO currentWeather = parseCurrentWeather(currentNode, dailyNode);

            // 2. Hourly Forecast (next 24 hours from current time)
            List<HourlyForecastDTO> hourlyList = parseHourlyForecast(hourlyNode, localTimeString);

            // 3. Daily Forecast (7 days)
            List<DailyForecastDTO> dailyList = parseDailyForecast(dailyNode);

            // 4. Air Quality
            AirQualityDTO airQuality = airQualityService.getAirQuality(location.latitude(), location.longitude());

            // 5. Favorite Status
            var existingFav = favoriteCityRepository.findByNameIgnoreCaseAndCountryIgnoreCase(
                    location.name(), location.country());
            boolean isFav = existingFav.isPresent();
            Long favId = isFav ? existingFav.get().getId() : null;

            return new WeatherFullResponseDTO(
                    updatedLocation,
                    currentWeather,
                    hourlyList,
                    dailyList,
                    airQuality,
                    isFav,
                    favId
            );

        } catch (Exception e) {
            log.error("Error fetching weather for location: {}", location, e);
            throw new WeatherServiceException("Unable to retrieve weather forecast for " + location.name(), e);
        }
    }

    private CurrentWeatherDTO parseCurrentWeather(JsonNode current, JsonNode daily) {
        if (current == null) {
            return new CurrentWeatherDTO(20.0, 20.0, 50, 0.0, 0.0, 0, "Clear Sky", "clear-day",
                    true, 10.0, 180, "S", 15.0, 1013.0, 10, 4.0, "Moderate", 10.0);
        }

        int weatherCode = current.hasNonNull("weather_code") ? current.get("weather_code").asInt() : 0;
        boolean isDay = current.hasNonNull("is_day") && current.get("is_day").asInt() == 1;
        var info = interpreter.interpret(weatherCode, isDay);

        int windDir = current.hasNonNull("wind_direction_10m") ? current.get("wind_direction_10m").asInt() : 0;
        String cardinal = interpreter.getWindDirectionCardinal(windDir);

        Double uvMax = null;
        if (daily != null && daily.hasNonNull("uv_index_max") && daily.get("uv_index_max").isArray() && !daily.get("uv_index_max").isEmpty()) {
            uvMax = daily.get("uv_index_max").get(0).asDouble();
        }
        String uvDesc = interpreter.getUvDescription(uvMax);

        return new CurrentWeatherDTO(
                current.hasNonNull("temperature_2m") ? current.get("temperature_2m").asDouble() : 0.0,
                current.hasNonNull("apparent_temperature") ? current.get("apparent_temperature").asDouble() : 0.0,
                current.hasNonNull("relative_humidity_2m") ? current.get("relative_humidity_2m").asInt() : 0,
                current.hasNonNull("precipitation") ? current.get("precipitation").asDouble() : 0.0,
                current.hasNonNull("rain") ? current.get("rain").asDouble() : 0.0,
                weatherCode,
                info.description(),
                info.icon(),
                isDay,
                current.hasNonNull("wind_speed_10m") ? current.get("wind_speed_10m").asDouble() : 0.0,
                windDir,
                cardinal,
                current.hasNonNull("wind_gusts_10m") ? current.get("wind_gusts_10m").asDouble() : 0.0,
                current.hasNonNull("pressure_msl") ? current.get("pressure_msl").asDouble() : 1013.25,
                current.hasNonNull("cloud_cover") ? current.get("cloud_cover").asInt() : 0,
                uvMax != null ? uvMax : 3.0,
                uvDesc,
                current.hasNonNull("dew_point_2m") ? current.get("dew_point_2m").asDouble() : null
        );
    }

    private List<HourlyForecastDTO> parseHourlyForecast(JsonNode hourly, String currentIsoTime) {
        List<HourlyForecastDTO> list = new ArrayList<>();
        if (hourly == null || !hourly.hasNonNull("time")) return list;

        JsonNode times = hourly.get("time");
        JsonNode temps = hourly.get("temperature_2m");
        JsonNode humidities = hourly.get("relative_humidity_2m");
        JsonNode codes = hourly.get("weather_code");
        JsonNode winds = hourly.get("wind_speed_10m");
        JsonNode precipsProb = hourly.get("precipitation_probability");
        JsonNode precips = hourly.get("precipitation");
        JsonNode isDays = hourly.get("is_day");

        // Find starting index matching current hour or just take next 24 hours
        int startIndex = 0;
        if (currentIsoTime != null && currentIsoTime.length() >= 13) {
            String currentHourPrefix = currentIsoTime.substring(0, 13);
            for (int i = 0; i < times.size(); i++) {
                if (times.get(i).asText().startsWith(currentHourPrefix)) {
                    startIndex = i;
                    break;
                }
            }
        }

        int count = Math.min(24, times.size() - startIndex);
        for (int i = startIndex; i < startIndex + count; i++) {
            int code = codes != null && codes.size() > i ? codes.get(i).asInt() : 0;
            boolean isDay = isDays != null && isDays.size() > i && isDays.get(i).asInt() == 1;
            var info = interpreter.interpret(code, isDay);

            list.add(new HourlyForecastDTO(
                    times.get(i).asText(),
                    temps != null && temps.size() > i ? temps.get(i).asDouble() : 0.0,
                    humidities != null && humidities.size() > i ? humidities.get(i).asInt() : 0,
                    code,
                    info.description(),
                    info.icon(),
                    precipsProb != null && precipsProb.size() > i ? precipsProb.get(i).asInt() : 0,
                    precips != null && precips.size() > i ? precips.get(i).asDouble() : 0.0,
                    winds != null && winds.size() > i ? winds.get(i).asDouble() : 0.0,
                    isDay
            ));
        }

        return list;
    }

    private List<DailyForecastDTO> parseDailyForecast(JsonNode daily) {
        List<DailyForecastDTO> list = new ArrayList<>();
        if (daily == null || !daily.hasNonNull("time")) return list;

        JsonNode times = daily.get("time");
        JsonNode codes = daily.get("weather_code");
        JsonNode maxTemps = daily.get("temperature_2m_max");
        JsonNode minTemps = daily.get("temperature_2m_min");
        JsonNode precipProbMax = daily.get("precipitation_probability_max");
        JsonNode precipSums = daily.get("precipitation_sum");
        JsonNode uvMaxes = daily.get("uv_index_max");
        JsonNode sunrises = daily.get("sunrise");
        JsonNode sunsets = daily.get("sunset");

        LocalDate today = LocalDate.now();

        for (int i = 0; i < times.size(); i++) {
            String dateStr = times.get(i).asText();
            LocalDate itemDate = LocalDate.parse(dateStr);

            String dayLabel;
            if (itemDate.equals(today)) {
                dayLabel = "Today";
            } else if (itemDate.equals(today.plusDays(1))) {
                dayLabel = "Tomorrow";
            } else {
                dayLabel = itemDate.getDayOfWeek().name().substring(0, 3);
                dayLabel = dayLabel.charAt(0) + dayLabel.substring(1).toLowerCase();
            }

            int code = codes != null && codes.size() > i ? codes.get(i).asInt() : 0;
            var info = interpreter.interpret(code, true);

            String sunriseTime = sunrises != null && sunrises.size() > i ? formatTimeOnly(sunrises.get(i).asText()) : "";
            String sunsetTime = sunsets != null && sunsets.size() > i ? formatTimeOnly(sunsets.get(i).asText()) : "";

            list.add(new DailyForecastDTO(
                    dateStr,
                    dayLabel,
                    code,
                    info.description(),
                    info.icon(),
                    maxTemps != null && maxTemps.size() > i ? maxTemps.get(i).asDouble() : 0.0,
                    minTemps != null && minTemps.size() > i ? minTemps.get(i).asDouble() : 0.0,
                    precipProbMax != null && precipProbMax.size() > i ? precipProbMax.get(i).asInt() : 0,
                    precipSums != null && precipSums.size() > i ? precipSums.get(i).asDouble() : 0.0,
                    uvMaxes != null && uvMaxes.size() > i ? uvMaxes.get(i).asDouble() : 0.0,
                    sunriseTime,
                    sunsetTime
            ));
        }

        return list;
    }

    private String formatTimeOnly(String isoDateTime) {
        if (isoDateTime == null || isoDateTime.length() < 16) return isoDateTime;
        return isoDateTime.substring(11, 16);
    }
}
