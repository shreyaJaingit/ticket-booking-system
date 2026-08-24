package com.ticketbooking.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "waitlists")
public class Waitlist {

    @Id
    private String id;

    private String showId;
    private String seatNumber;
    private String userId;
    private Instant joinedAt;

    public Waitlist() {
    }

    public Waitlist(String showId, String seatNumber, String userId) {
        this.showId = showId;
        this.seatNumber = seatNumber;
        this.userId = userId;
        this.joinedAt = Instant.now();
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

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}