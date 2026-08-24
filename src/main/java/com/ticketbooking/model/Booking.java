package com.ticketbooking.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String showId;
    private String seatNumber;
    private String userId;
    private String status;
    private Instant bookedAt;

    public Booking() {
    }

    public Booking(String showId, String seatNumber, String userId) {
        this.showId = showId;
        this.seatNumber = seatNumber;
        this.userId = userId;
        this.status = "CONFIRMED";
        this.bookedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getShowId() {
        return showId;
    }

    public void setShowId(String showId) {
        this.showId = showId;
    }

    public String getSeatNumber() {
        return seatNumber;
    }

    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getBookedAt() {
        return bookedAt;
    }

    public void setBookedAt(Instant bookedAt) {
        this.bookedAt = bookedAt;
    }
}