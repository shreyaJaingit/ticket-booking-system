package com.ticketbooking.controller;

import com.ticketbooking.model.Seat;
import com.ticketbooking.service.SeatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shows")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @GetMapping("/{showId}/seats")
    public List<Seat> getSeats(@PathVariable String showId) {
        return seatService.getSeats(showId);
    }

    @PostMapping("/{showId}/seats/{seatNumber}/hold")
    public Seat holdSeat(
            @PathVariable String showId,
            @PathVariable String seatNumber,
            @RequestParam String userId) {

        return seatService.holdSeat(showId, seatNumber, userId);
    }

    @PostMapping("/{showId}/seats/{seatNumber}/book")
    public Seat bookSeat(
            @PathVariable String showId,
            @PathVariable String seatNumber,
            @RequestParam String userId) {

        return seatService.bookSeat(showId, seatNumber, userId);
    }

    @PostMapping("/{showId}/seats/{seatNumber}/cancel")
    public Seat cancelBooking(
            @PathVariable String showId,
            @PathVariable String seatNumber,
            @RequestParam String userId) {

        return seatService.cancelBooking(
                showId,
                seatNumber,
                userId
        );
    }
}