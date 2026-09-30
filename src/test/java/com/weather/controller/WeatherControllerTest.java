package com.weather.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WeatherControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetWeatherByCity() throws Exception {
        mockMvc.perform(get("/api/weather").param("city", "London"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.location.name").exists())
                .andExpect(jsonPath("$.current.temperature").isNumber())
                .andExpect(jsonPath("$.hourly").isArray())
                .andExpect(jsonPath("$.daily").isArray());
    }

    @Test
    void testSearchCities() throws Exception {
        mockMvc.perform(get("/api/weather/search").param("q", "Paris"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void testActuatorHealth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
