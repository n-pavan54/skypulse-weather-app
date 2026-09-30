package com.weather.model.dto;

public record AirQualityDTO(
        Integer usAqi,
        String aqiCategory,
        String aqiColor,
        Double pm25,
        Double pm10,
        Double carbonMonoxide,
        Double nitrogenDioxide,
        Double sulphurDioxide,
        Double ozone
) {}
