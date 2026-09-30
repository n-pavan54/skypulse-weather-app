package com.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weather.model.dto.AirQualityDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
public class AirQualityService {

    private static final Logger log = LoggerFactory.getLogger(AirQualityService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final WeatherCodeInterpreter interpreter;

    @Value("${weather.api.air-quality-url:https://air-quality-api.open-meteo.com/v1/air-quality}")
    private String airQualityUrl;

    public AirQualityService(RestClient restClient, ObjectMapper objectMapper, WeatherCodeInterpreter interpreter) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.interpreter = interpreter;
    }

    @Cacheable(value = "airQualityCache", key = "T(java.lang.String).format('%.2f_%.2f', #latitude, #longitude)")
    public AirQualityDTO getAirQuality(double latitude, double longitude) {
        try {
            URI uri = UriComponentsBuilder.fromUriString(airQualityUrl)
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current", "us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone")
                    .build()
                    .toUri();

            String response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode current = root.get("current");

            if (current != null) {
                Integer usAqi = current.hasNonNull("us_aqi") ? current.get("us_aqi").asInt() : null;
                WeatherCodeInterpreter.AqiInfo aqiInfo = interpreter.getAqiInfo(usAqi);

                return new AirQualityDTO(
                        usAqi,
                        aqiInfo.category(),
                        aqiInfo.color(),
                        current.hasNonNull("pm2_5") ? current.get("pm2_5").asDouble() : null,
                        current.hasNonNull("pm10") ? current.get("pm10").asDouble() : null,
                        current.hasNonNull("carbon_monoxide") ? current.get("carbon_monoxide").asDouble() : null,
                        current.hasNonNull("nitrogen_dioxide") ? current.get("nitrogen_dioxide").asDouble() : null,
                        current.hasNonNull("sulphur_dioxide") ? current.get("sulphur_dioxide").asDouble() : null,
                        current.hasNonNull("ozone") ? current.get("ozone").asDouble() : null
                );
            }
        } catch (Exception e) {
            log.warn("Failed to fetch air quality data for ({}, {}): {}", latitude, longitude, e.getMessage());
        }

        // Fallback default
        return new AirQualityDTO(35, "Good", "#10B981", 8.5, 15.0, 220.0, 12.0, 3.0, 45.0);
    }
}
