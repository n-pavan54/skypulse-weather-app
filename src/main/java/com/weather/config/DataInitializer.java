package com.weather.config;

import com.weather.model.entity.FavoriteCity;
import com.weather.repository.FavoriteCityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final FavoriteCityRepository repository;

    public DataInitializer(FavoriteCityRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() == 0) {
            log.info("Seeding initial popular favorite cities...");
            List<FavoriteCity> defaults = List.of(
                    new FavoriteCity("New York", "United States", "US", "New York", 40.7128, -74.0060, "America/New_York"),
                    new FavoriteCity("Tokyo", "Japan", "JP", "Tokyo", 35.6895, 139.6917, "Asia/Tokyo"),
                    new FavoriteCity("Paris", "France", "FR", "Île-de-France", 48.8566, 2.3522, "Europe/Paris"),
                    new FavoriteCity("Sydney", "Australia", "AU", "New South Wales", -33.8688, 151.2093, "Australia/Sydney")
            );
            repository.saveAll(defaults);
            log.info("Seeded {} initial favorite cities.", defaults.size());
        }
    }
}
