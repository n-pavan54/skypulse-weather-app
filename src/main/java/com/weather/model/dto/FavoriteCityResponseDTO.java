package com.weather.model.dto;

import java.time.LocalDateTime;

public record FavoriteCityResponseDTO(
        Long id,
        String name,
        String country,
        String countryCode,
        String admin1,
        Double latitude,
        Double longitude,
        String timezone,
        LocalDateTime addedAt,
        Double currentTemperature,
        String weatherDescription,
        String weatherIcon
) {}
