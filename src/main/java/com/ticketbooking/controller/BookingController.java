package com.ticketbooking.controller;

import com.ticketbooking.model.Booking;
import com.ticketbooking.service.BookingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public Booking createBooking(
            @RequestParam String showId,
            @RequestParam String seatNumber,
            @RequestParam String userId) {

        return bookingService.createBooking(
                showId,
                seatNumber,
                userId
        );
    }

    @GetMapping
    public List<Booking> getUserBookings(
            @RequestParam String userId) {

        return bookingService.getUserBookings(userId);
    }
}