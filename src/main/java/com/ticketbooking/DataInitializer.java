package com.ticketbooking;

import com.ticketbooking.model.Seat;
import com.ticketbooking.repository.SeatRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initializeSeats(SeatRepository seatRepository) {
        return args -> {

            if (seatRepository.findByShowId("SHOW001").isEmpty()) {

                seatRepository.save(new Seat("SHOW001", "A1"));
                seatRepository.save(new Seat("SHOW001", "A2"));
                seatRepository.save(new Seat("SHOW001", "A3"));

                System.out.println("TEST SEATS CREATED!");
            }
        };
    }
}