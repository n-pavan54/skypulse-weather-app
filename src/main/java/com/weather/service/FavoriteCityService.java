package com.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weather.exception.ResourceNotFoundException;
import com.weather.model.dto.FavoriteCityRequest;
import com.weather.model.dto.FavoriteCityResponseDTO;
import com.weather.model.entity.FavoriteCity;
import com.weather.repository.FavoriteCityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Service
public class FavoriteCityService {

    private static final Logger log = LoggerFactory.getLogger(FavoriteCityService.class);

    private final FavoriteCityRepository repository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final WeatherCodeInterpreter interpreter;

    @Value("${weather.api.forecast-url:https://api.open-meteo.com/v1/forecast}")
    private String forecastUrl;

    public FavoriteCityService(FavoriteCityRepository repository,
                               RestClient restClient,
                               ObjectMapper objectMapper,
                               WeatherCodeInterpreter interpreter) {
        this.repository = repository;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
        this.interpreter = interpreter;
    }

    public List<FavoriteCityResponseDTO> getAllFavorites() {
        List<FavoriteCity> cities = repository.findAll();
        List<FavoriteCityResponseDTO> dtos = new ArrayList<>();

        for (FavoriteCity city : cities) {
            Double currentTemp = null;
            String desc = "Sunny";
            String icon = "clear-day";

            try {
                URI uri = UriComponentsBuilder.fromUriString(forecastUrl)
                        .queryParam("latitude", city.getLatitude())
                        .queryParam("longitude", city.getLongitude())
                        .queryParam("current", "temperature_2m,weather_code,is_day")
                        .queryParam("timezone", "auto")
                        .build()
                        .toUri();

                String res = restClient.get().uri(uri).retrieve().body(String.class);
                JsonNode root = objectMapper.readTree(res);
                JsonNode cur = root.get("current");
                if (cur != null) {
                    currentTemp = cur.hasNonNull("temperature_2m") ? cur.get("temperature_2m").asDouble() : null;
                    int code = cur.hasNonNull("weather_code") ? cur.get("weather_code").asInt() : 0;
                    boolean isDay = cur.hasNonNull("is_day") && cur.get("is_day").asInt() == 1;
                    var info = interpreter.interpret(code, isDay);
                    desc = info.description();
                    icon = info.icon();
                }
            } catch (Exception e) {
                log.warn("Could not fetch current weather for favorite city {}: {}", city.getName(), e.getMessage());
            }

            dtos.add(new FavoriteCityResponseDTO(
                    city.getId(),
                    city.getName(),
                    city.getCountry(),
                    city.getCountryCode(),
                    city.getAdmin1(),
                    city.getLatitude(),
                    city.getLongitude(),
                    city.getTimezone(),
                    city.getAddedAt(),
                    currentTemp,
                    desc,
                    icon
            ));
        }

        return dtos;
    }

    @Transactional
    public FavoriteCityResponseDTO addFavorite(FavoriteCityRequest request) {
        var existing = repository.findByNameIgnoreCaseAndCountryIgnoreCase(
                request.name(), request.country() != null ? request.country() : "");

        FavoriteCity city;
        if (existing.isPresent()) {
            city = existing.get();
        } else {
            city = new FavoriteCity(
                    request.name(),
                    request.country(),
                    request.countryCode(),
                    request.admin1(),
                    request.latitude(),
                    request.longitude(),
                    request.timezone()
            );
            city = repository.save(city);
        }

        return new FavoriteCityResponseDTO(
                city.getId(),
                city.getName(),
                city.getCountry(),
                city.getCountryCode(),
                city.getAdmin1(),
                city.getLatitude(),
                city.getLongitude(),
                city.getTimezone(),
                city.getAddedAt(),
                null,
                null,
                null
        );
    }

    @Transactional
    public void deleteFavorite(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Favorite city with id " + id + " not found");
        }
        repository.deleteById(id);
    }
}
