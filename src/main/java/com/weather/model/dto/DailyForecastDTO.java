package com.weather.model.dto;

public record DailyForecastDTO(
        String date,
        String dayOfWeek,
        Integer weatherCode,
        String weatherDescription,
        String weatherIcon,
        Double maxTemperature,
        Double minTemperature,
        Integer precipitationProbabilityMax,
        Double precipitationSum,
        Double uvIndexMax,
        String sunrise,
        String sunset
) {}
