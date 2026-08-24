package com.ticketbooking.service;

import com.ticketbooking.model.Seat;
import com.ticketbooking.model.SeatStatus;
import com.ticketbooking.repository.SeatRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class SeatReleaseService {

    private final SeatRepository seatRepository;

    public SeatReleaseService(SeatRepository seatRepository) {
        this.seatRepository = seatRepository;
    }

    @Scheduled(fixedRate = 10000)
    public void releaseExpiredSeats() {

        List<Seat> seats = seatRepository.findAll();

        for (Seat seat : seats) {

            if (seat.getStatus() == SeatStatus.HELD
                    && seat.getHoldExpiresAt() != null
                    && Instant.now().isAfter(seat.getHoldExpiresAt())) {

                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setHeldBy(null);
                seat.setHoldExpiresAt(null);

                seatRepository.save(seat);
            }
        }
    }
}