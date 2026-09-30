package com.weather.controller;

import com.weather.model.dto.FavoriteCityRequest;
import com.weather.model.dto.FavoriteCityResponseDTO;
import com.weather.service.FavoriteCityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteCityController {

    private final FavoriteCityService favoriteCityService;

    public FavoriteCityController(FavoriteCityService favoriteCityService) {
        this.favoriteCityService = favoriteCityService;
    }

    @GetMapping
    public ResponseEntity<List<FavoriteCityResponseDTO>> getAllFavorites() {
        return ResponseEntity.ok(favoriteCityService.getAllFavorites());
    }

    @PostMapping
    public ResponseEntity<FavoriteCityResponseDTO> addFavorite(@Valid @RequestBody FavoriteCityRequest request) {
        FavoriteCityResponseDTO saved = favoriteCityService.addFavorite(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFavorite(@PathVariable(name = "id") Long id) {
        favoriteCityService.deleteFavorite(id);
        return ResponseEntity.noContent().build();
    }
}
