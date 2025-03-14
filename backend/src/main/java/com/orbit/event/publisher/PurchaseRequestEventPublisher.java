package com.orbit.event.publisher;

import com.orbit.event.dto.PurchaseRequestStatusEventDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PurchaseRequestEventPublisher {
    private final RedisTemplate<String, Object> redisTemplate;

    public void publishStatusChangeEvent(PurchaseRequestStatusEventDTO event) {
        redisTemplate.convertAndSend("purchase_request_status_channel", event);
    }
}