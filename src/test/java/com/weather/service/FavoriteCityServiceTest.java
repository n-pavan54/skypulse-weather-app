package com.weather.service;

import com.weather.model.dto.FavoriteCityRequest;
import com.weather.model.dto.FavoriteCityResponseDTO;
import com.weather.repository.FavoriteCityRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class FavoriteCityServiceTest {

    @Autowired
    private FavoriteCityService favoriteCityService;

    @Autowired
    private FavoriteCityRepository favoriteCityRepository;

    @Test
    void testAddAndRetrieveFavorite() {
        FavoriteCityRequest req = new FavoriteCityRequest(
                "Seattle",
                "United States",
                "US",
                "Washington",
                47.6062,
                -122.3321,
                "America/Los_Angeles"
        );

        FavoriteCityResponseDTO added = favoriteCityService.addFavorite(req);
        assertNotNull(added.id());
        assertEquals("Seattle", added.name());

        List<FavoriteCityResponseDTO> all = favoriteCityService.getAllFavorites();
        assertTrue(all.stream().anyMatch(f -> "Seattle".equalsIgnoreCase(f.name())));

        // Test delete
        favoriteCityService.deleteFavorite(added.id());
        assertFalse(favoriteCityRepository.existsById(added.id()));
    }
}
