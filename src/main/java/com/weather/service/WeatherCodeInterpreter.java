package com.weather.service;

import org.springframework.stereotype.Component;

@Component
public class WeatherCodeInterpreter {

    public record WeatherInfo(String description, String icon, String weatherGroup) {}

    public WeatherInfo interpret(int code, boolean isDay) {
        return switch (code) {
            case 0 -> new WeatherInfo("Clear Sky", isDay ? "clear-day" : "clear-night", "clear");
            case 1 -> new WeatherInfo("Mainly Clear", isDay ? "mostly-clear-day" : "mostly-clear-night", "clear");
            case 2 -> new WeatherInfo("Partly Cloudy", isDay ? "partly-cloudy-day" : "partly-cloudy-night", "clouds");
            case 3 -> new WeatherInfo("Overcast", "overcast", "clouds");
            case 45 -> new WeatherInfo("Foggy", "fog", "fog");
            case 48 -> new WeatherInfo("Depositing Rime Fog", "fog", "fog");
            case 51 -> new WeatherInfo("Light Drizzle", "drizzle", "rain");
            case 53 -> new WeatherInfo("Moderate Drizzle", "drizzle", "rain");
            case 55 -> new WeatherInfo("Dense Drizzle", "drizzle", "rain");
            case 56, 57 -> new WeatherInfo("Freezing Drizzle", "freezing-drizzle", "rain");
            case 61 -> new WeatherInfo("Slight Rain", "rain-light", "rain");
            case 63 -> new WeatherInfo("Moderate Rain", "rain", "rain");
            case 65 -> new WeatherInfo("Heavy Rain", "heavy-rain", "rain");
            case 66, 67 -> new WeatherInfo("Freezing Rain", "freezing-rain", "rain");
            case 71 -> new WeatherInfo("Slight Snow Fall", "snow-light", "snow");
            case 73 -> new WeatherInfo("Moderate Snow Fall", "snow", "snow");
            case 75 -> new WeatherInfo("Heavy Snow Fall", "heavy-snow", "snow");
            case 77 -> new WeatherInfo("Snow Grains", "snow", "snow");
            case 80 -> new WeatherInfo("Slight Rain Showers", "showers", "rain");
            case 81 -> new WeatherInfo("Moderate Rain Showers", "showers", "rain");
            case 82 -> new WeatherInfo("Violent Rain Showers", "heavy-showers", "rain");
            case 85 -> new WeatherInfo("Slight Snow Showers", "snow-showers", "snow");
            case 86 -> new WeatherInfo("Heavy Snow Showers", "heavy-snow-showers", "snow");
            case 95 -> new WeatherInfo("Thunderstorm", "thunderstorm", "thunderstorm");
            case 96, 99 -> new WeatherInfo("Thunderstorm with Hail", "thunderstorm-hail", "thunderstorm");
            default -> new WeatherInfo("Variable Weather", isDay ? "clear-day" : "clear-night", "clear");
        };
    }

    public String getWindDirectionCardinal(Integer degrees) {
        if (degrees == null) return "N/A";
        String[] directions = {"N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                               "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"};
        int index = (int) Math.round(((degrees % 360) / 22.5)) % 16;
        return directions[index];
    }

    public String getUvDescription(Double uvIndex) {
        if (uvIndex == null) return "N/A";
        if (uvIndex <= 2.9) return "Low";
        if (uvIndex <= 5.9) return "Moderate";
        if (uvIndex <= 7.9) return "High";
        if (uvIndex <= 10.9) return "Very High";
        return "Extreme";
    }

    public record AqiInfo(String category, String color) {}

    public AqiInfo getAqiInfo(Integer aqi) {
        if (aqi == null) return new AqiInfo("Unknown", "#9CA3AF");
        if (aqi <= 50) return new AqiInfo("Good", "#10B981");
        if (aqi <= 100) return new AqiInfo("Moderate", "#F59E0B");
        if (aqi <= 150) return new AqiInfo("Unhealthy for Sensitive Groups", "#F97316");
        if (aqi <= 200) return new AqiInfo("Unhealthy", "#EF4444");
        if (aqi <= 300) return new AqiInfo("Very Unhealthy", "#8B5CF6");
        return new AqiInfo("Hazardous", "#7F1D1D");
    }
}
