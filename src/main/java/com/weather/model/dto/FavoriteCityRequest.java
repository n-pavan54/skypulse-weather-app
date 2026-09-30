package com.weather.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FavoriteCityRequest(
        @NotBlank(message = "City name is required")
        String name,
        String country,
        String countryCode,
        String admin1,
        @NotNull(message = "Latitude is required")
        Double latitude,
        @NotNull(message = "Longitude is required")
        Double longitude,
        String timezone
) {}
