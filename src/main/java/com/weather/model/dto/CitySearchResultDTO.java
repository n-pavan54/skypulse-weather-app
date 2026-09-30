package com.weather.model.dto;

public record CitySearchResultDTO(
        Long id,
        String name,
        Double latitude,
        Double longitude,
        Double elevation,
        String countryCode,
        String country,
        String admin1,
        String timezone
) {}
