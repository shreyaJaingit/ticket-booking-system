package com.ticketbooking.service;

import com.ticketbooking.model.Booking;
import com.ticketbooking.model.Seat;
import com.ticketbooking.model.SeatStatus;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.SeatRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;

    public BookingService(
            BookingRepository bookingRepository,
            SeatRepository seatRepository) {

        this.bookingRepository = bookingRepository;
        this.seatRepository = seatRepository;
    }

    public Booking createBooking(
            String showId,
            String seatNumber,
            String userId) {

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

        seatRepository.save(seat);

        Booking booking = new Booking(
                showId,
                seatNumber,
                userId
        );

        return bookingRepository.save(booking);
    }

    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }
}