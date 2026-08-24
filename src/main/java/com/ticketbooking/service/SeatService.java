package com.ticketbooking.service;

import com.ticketbooking.model.Seat;
import com.ticketbooking.model.SeatStatus;
import com.ticketbooking.model.Waitlist;
import com.ticketbooking.repository.SeatRepository;
import com.ticketbooking.repository.WaitlistRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class SeatService {

    private final SeatRepository seatRepository;
    private final WaitlistRepository waitlistRepository;

    public SeatService(
            SeatRepository seatRepository,
            WaitlistRepository waitlistRepository) {

        this.seatRepository = seatRepository;
        this.waitlistRepository = waitlistRepository;
    }

    public List<Seat> getSeats(String showId) {

        System.out.println("SHOW ID RECEIVED: " + showId);
        System.out.println("TOTAL SEATS: " + seatRepository.count());

        List<Seat> seats = seatRepository.findByShowId(showId);

        System.out.println("SEATS FOUND: " + seats.size());

        for (Seat seat : seats) {
            System.out.println(
                    seat.getShowId() + " | " +
                            seat.getSeatNumber() + " | " +
                            seat.getStatus()
            );
        }

        return seats;
    }

    public Seat holdSeat(String showId, String seatNumber, String userId) {

        System.out.println("HOLD REQUEST:");
        System.out.println("showId = " + showId);
        System.out.println("seatNumber = " + seatNumber);
        System.out.println("userId = " + userId);

        Seat seat = seatRepository
                .findByShowIdAndSeatNumber(showId, seatNumber)
                .orElseThrow(() -> new RuntimeException("Seat not found"));

        System.out.println("SEAT FOUND:");
        System.out.println("showId = " + seat.getShowId());
        System.out.println("seatNumber = " + seat.getSeatNumber());
        System.out.println("status = " + seat.getStatus());

        if (seat.getStatus() != SeatStatus.AVAILABLE) {
            throw new RuntimeException("Seat is not available");
        }

        seat.setStatus(SeatStatus.HELD);
        seat.setHeldBy(userId);
        seat.setHoldExpiresAt(
                Instant.now().plus(Duration.ofMinutes(5))
        );

        return seatRepository.save(seat);
    }
    public Seat bookSeat(String showId, String seatNumber, String userId) {

        Seat seat = seatRepository
                .findByShowIdAndSeatNumber(showId, seatNumber)
                .orElseThrow(() -> new RuntimeException("Seat not found"));

        if (seat.getStatus() != SeatStatus.HELD) {
            throw new RuntimeException("Seat is not held");
        }

        if (!userId.equals(seat.getHeldBy())) {
            throw new RuntimeException("Seat is held by another user");
        }

        if (seat.getHoldExpiresAt() != null &&
                Instant.now().isAfter(seat.getHoldExpiresAt())) {

            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setHeldBy(null);
            seat.setHoldExpiresAt(null);

            seatRepository.save(seat);

            throw new RuntimeException("Seat hold has expired");
        }

        seat.setStatus(SeatStatus.BOOKED);
        seat.setHeldBy(null);
        seat.setHoldExpiresAt(null);

        return seatRepository.save(seat);
    }

    public Seat cancelBooking(
            String showId,
            String seatNumber,
            String userId) {

        Seat seat = seatRepository
                .findByShowIdAndSeatNumber(showId, seatNumber)
                .orElseThrow(() -> new RuntimeException("Seat not found"));

        if (seat.getStatus() != SeatStatus.BOOKED) {
            throw new RuntimeException("Seat is not booked");
        }

        seat.setStatus(SeatStatus.AVAILABLE);

        Waitlist nextCustomer = waitlistRepository
                .findFirstByShowIdAndSeatNumberOrderByJoinedAtAsc(
                        showId,
                        seatNumber
                )
                .orElse(null);

        if (nextCustomer != null) {

            seat.setStatus(SeatStatus.HELD);
            seat.setHeldBy(nextCustomer.getUserId());
            seat.setHoldExpiresAt(
                    Instant.now().plus(Duration.ofMinutes(5))
            );

            waitlistRepository.delete(nextCustomer);
        }

        return seatRepository.save(seat);
    }
}