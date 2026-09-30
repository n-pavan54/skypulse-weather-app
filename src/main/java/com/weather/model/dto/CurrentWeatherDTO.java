package com.weather.model.dto;

public record CurrentWeatherDTO(
        Double temperature,
        Double apparentTemperature,
        Integer relativeHumidity,
        Double precipitation,
        Double rain,
        Integer weatherCode,
        String weatherDescription,
        String weatherIcon,
        Boolean isDay,
        Double windSpeed,
        Integer windDirection,
        String windDirectionCardinal,
        Double windGusts,
        Double pressureMsl,
        Integer cloudCover,
        Double uvIndex,
        String uvDescription,
        Double dewPoint
) {}
