package com.weather.model.dto;

public record LocationDTO(
        String name,
        String country,
        String countryCode,
        String admin1,
        Double latitude,
        Double longitude,
        String timezone,
        String localTime
) {}
