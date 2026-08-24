package com.ticketbooking.repository;

import com.ticketbooking.model.Waitlist;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WaitlistRepository extends MongoRepository<Waitlist, String> {

    List<Waitlist> findByShowIdAndSeatNumberOrderByJoinedAtAsc(
            String showId,
            String seatNumber
    );

    Optional<Waitlist> findFirstByShowIdAndSeatNumberOrderByJoinedAtAsc(
            String showId,
            String seatNumber
    );
}