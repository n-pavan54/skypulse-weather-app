package com.weather.model.dto;

import java.util.List;

public record WeatherFullResponseDTO(
        LocationDTO location,
        CurrentWeatherDTO current,
        List<HourlyForecastDTO> hourly,
        List<DailyForecastDTO> daily,
        AirQualityDTO airQuality,
        boolean isFavorite,
        Long favoriteId
) {}
