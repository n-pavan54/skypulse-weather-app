package com.weather.repository;

import com.weather.model.entity.FavoriteCity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FavoriteCityRepository extends JpaRepository<FavoriteCity, Long> {
    Optional<FavoriteCity> findByNameIgnoreCaseAndCountryIgnoreCase(String name, String country);
    boolean existsByNameIgnoreCaseAndCountryIgnoreCase(String name, String country);
}
