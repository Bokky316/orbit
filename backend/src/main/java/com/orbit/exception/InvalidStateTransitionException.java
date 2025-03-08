package com.orbit.exception;

public class InvalidStateTransitionException extends RuntimeException {

    private final String currentStatus;
    private final String targetStatus;

    public InvalidStateTransitionException(String currentStatus, String targetStatus) {
        super(String.format("Invalid state transition: %s → %s", currentStatus, targetStatus));
        this.currentStatus = currentStatus;
        this.targetStatus = targetStatus;
    }

    // Getter 생략
}
