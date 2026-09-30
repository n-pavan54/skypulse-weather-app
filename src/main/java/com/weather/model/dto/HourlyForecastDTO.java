package com.weather.model.dto;

public record HourlyForecastDTO(
        String time,
        Double temperature,
        Integer relativeHumidity,
        Integer weatherCode,
        String weatherDescription,
        String weatherIcon,
        Integer precipitationProbability,
        Double precipitation,
        Double windSpeed,
        Boolean isDay
) {}
