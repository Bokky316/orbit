package com.orbit.event.event;

import org.springframework.context.ApplicationEvent;

public class SupplierStatusChangeEvent extends ApplicationEvent {
    private final Long supplierId;
    private final String fromStatus;
    private final String toStatus;
    private final String username;

    public SupplierStatusChangeEvent(
            Object source,
            Long supplierId,
            String fromStatus,
            String toStatus,
            String username
    ) {
        super(source);
        this.supplierId = supplierId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.username = username;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public String getFromStatus() {
        return fromStatus;
    }

    public String getToStatus() {
        return toStatus;
    }

    public String getUsername() {
        return username;
    }
}