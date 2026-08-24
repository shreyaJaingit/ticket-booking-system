package com.ticketbooking.repository;

import com.ticketbooking.model.Seat;
import com.ticketbooking.model.SeatStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SeatRepository extends MongoRepository<Seat, String> {

    List<Seat> findByShowId(String showId);

    Optional<Seat> findByShowIdAndSeatNumber(String showId, String seatNumber);

    Optional<Seat> findByShowIdAndSeatNumberAndStatus(
            String showId,
            String seatNumber,
            SeatStatus status
    );
}