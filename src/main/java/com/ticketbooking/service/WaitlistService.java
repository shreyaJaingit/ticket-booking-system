package com.ticketbooking.service;

import com.ticketbooking.model.Waitlist;
import com.ticketbooking.repository.WaitlistRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;

    public WaitlistService(WaitlistRepository waitlistRepository) {
        this.waitlistRepository = waitlistRepository;
    }

    public Waitlist joinWaitlist(String showId, String seatNumber, String userId) {

        Waitlist waitlist = new Waitlist(showId, seatNumber, userId);

        return waitlistRepository.save(waitlist);
    }

    public List<Waitlist> getWaitlist(String showId, String seatNumber) {

        return waitlistRepository
                .findByShowIdAndSeatNumberOrderByJoinedAtAsc(showId, seatNumber);
    }
}