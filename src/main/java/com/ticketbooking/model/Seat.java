package com.ticketbooking.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "seats")
public class Seat {

    @Id
    private String id;

    private String showId;

    private String seatNumber;

    private SeatStatus status;

    private String heldBy;

    private Instant holdExpiresAt;

    public Seat() {
    }

    public Seat(String showId, String seatNumber) {
        this.showId = showId;
        this.seatNumber = seatNumber;
        this.status = SeatStatus.AVAILABLE;
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

    public SeatStatus getStatus() {
        return status;
    }

    public void setStatus(SeatStatus status) {
        this.status = status;
    }

    public String getHeldBy() {
        return heldBy;
    }

    public void setHeldBy(String heldBy) {
        this.heldBy = heldBy;
    }

    public Instant getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(Instant holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }
}