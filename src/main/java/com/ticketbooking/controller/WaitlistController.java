package com.ticketbooking.controller;

import com.ticketbooking.model.Waitlist;
import com.ticketbooking.service.WaitlistService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waitlist")
public class WaitlistController {

    private final WaitlistService waitlistService;

    public WaitlistController(WaitlistService waitlistService) {
        this.waitlistService = waitlistService;
    }

    @PostMapping
    public Waitlist joinWaitlist(
            @RequestParam String showId,
            @RequestParam String seatNumber,
            @RequestParam String userId) {

        return waitlistService.joinWaitlist(showId, seatNumber, userId);
    }

    @GetMapping
    public List<Waitlist> getWaitlist(
            @RequestParam String showId,
            @RequestParam String seatNumber) {

        return waitlistService.getWaitlist(showId, seatNumber);
    }
}