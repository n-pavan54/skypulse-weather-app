package com.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weather.exception.ResourceNotFoundException;
import com.weather.exception.WeatherServiceException;
import com.weather.model.dto.CitySearchResultDTO;
import com.weather.model.dto.LocationDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Service
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${weather.api.geocoding-url:https://geocoding-api.open-meteo.com/v1/search}")
    private String geocodingUrl;

    public GeocodingService(RestClient restClient, ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    @Cacheable(value = "cityCache", key = "#query.toLowerCase().trim()")
    public List<CitySearchResultDTO> searchCities(String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }

        try {
            URI uri = UriComponentsBuilder.fromUriString(geocodingUrl)
                    .queryParam("name", query.trim())
                    .queryParam("count", 8)
                    .queryParam("language", "en")
                    .queryParam("format", "json")
                    .build()
                    .toUri();

            String response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode resultsNode = root.get("results");

            List<CitySearchResultDTO> results = new ArrayList<>();
            if (resultsNode != null && resultsNode.isArray()) {
                for (JsonNode node : resultsNode) {
                    results.add(new CitySearchResultDTO(
                            node.hasNonNull("id") ? node.get("id").asLong() : null,
                            node.hasNonNull("name") ? node.get("name").asText() : "",
                            node.hasNonNull("latitude") ? node.get("latitude").asDouble() : 0.0,
                            node.hasNonNull("longitude") ? node.get("longitude").asDouble() : 0.0,
                            node.hasNonNull("elevation") ? node.get("elevation").asDouble() : null,
                            node.hasNonNull("country_code") ? node.get("country_code").asText() : "",
                            node.hasNonNull("country") ? node.get("country").asText() : "",
                            node.hasNonNull("admin1") ? node.get("admin1").asText() : null,
                            node.hasNonNull("timezone") ? node.get("timezone").asText() : "auto"
                    ));
                }
            }
            return results;
        } catch (Exception e) {
            log.error("Failed to search cities for query: {}", query, e);
            throw new WeatherServiceException("Unable to search cities at this time", e);
        }
    }

    public CitySearchResultDTO getTopCityMatch(String cityName) {
        List<CitySearchResultDTO> matches = searchCities(cityName);
        if (matches.isEmpty()) {
            throw new ResourceNotFoundException("City not found: " + cityName);
        }
        return matches.get(0);
    }

    public LocationDTO reverseGeocode(double latitude, double longitude) {
        try {
            URI uri = UriComponentsBuilder
                    .fromUriString("https://api.bigdatacloud.net/data/reverse-geocode-client")
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("localityLanguage", "en")
                    .build()
                    .toUri();

            String response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            JsonNode node = objectMapper.readTree(response);
            String city = node.hasNonNull("city") && !node.get("city").asText().isBlank()
                    ? node.get("city").asText()
                    : (node.hasNonNull("locality") && !node.get("locality").asText().isBlank()
                        ? node.get("locality").asText()
                        : "Current Location");

            String country = node.hasNonNull("countryName") ? node.get("countryName").asText() : "";
            String countryCode = node.hasNonNull("countryCode") ? node.get("countryCode").asText() : "";
            String admin1 = node.hasNonNull("principalSubdivision") ? node.get("principalSubdivision").asText() : "";

            return new LocationDTO(
                    city,
                    country,
                    countryCode,
                    admin1,
                    latitude,
                    longitude,
                    "auto",
                    null
            );
        } catch (Exception e) {
            log.warn("Reverse geocoding failed for ({}, {}), using fallback: {}", latitude, longitude, e.getMessage());
            return new LocationDTO(
                    "Location (" + String.format("%.2f", latitude) + ", " + String.format("%.2f", longitude) + ")",
                    "",
                    "",
                    "",
                    latitude,
                    longitude,
                    "auto",
                    null
            );
        }
    }
}
