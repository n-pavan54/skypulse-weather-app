package com.weather.controller;

import com.weather.model.dto.CitySearchResultDTO;
import com.weather.model.dto.WeatherFullResponseDTO;
import com.weather.service.GeocodingService;
import com.weather.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;
    private final GeocodingService geocodingService;

    public WeatherController(WeatherService weatherService, GeocodingService geocodingService) {
        this.weatherService = weatherService;
        this.geocodingService = geocodingService;
    }

    @GetMapping
    public ResponseEntity<WeatherFullResponseDTO> getWeatherByCity(
            @RequestParam(name = "city", defaultValue = "London") String city) {
        return ResponseEntity.ok(weatherService.getWeatherByCity(city));
    }

    @GetMapping("/coords")
    public ResponseEntity<WeatherFullResponseDTO> getWeatherByCoordinates(
            @RequestParam(name = "lat") double latitude,
            @RequestParam(name = "lon") double longitude) {
        return ResponseEntity.ok(weatherService.getWeatherByCoordinates(latitude, longitude));
    }

    @GetMapping("/search")
    public ResponseEntity<List<CitySearchResultDTO>> searchCities(
            @RequestParam(name = "q") String query) {
        return ResponseEntity.ok(geocodingService.searchCities(query));
    }
}
