package com.orbit.config.redis;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Redis 연결 테스트 클래스
 * -  Redis 연결 상태 점검이라는 단순한 역할을 수행
 */
@Component
public class RedisConnectionTest {

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisConnectionTest(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Redis 연결 테스트
     * - ApplicationReadyEvent 발생 시 Redis 서버와 연결 테스트 수행
     * - 애플리케이션이 완전히 초기화된 후(ApplicationReadyEvent 발생 시) 실행됨.
     *   즉, 모든 Bean이 생성되고, 컨텍스트가 준비된 상태에서 실행되므로 Redis 연결 테스트를 안전하게 수행할 수 있음.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void testConnection() {
        try {
            redisTemplate.opsForValue().set("testKey", "testValue");
            String value = (String) redisTemplate.opsForValue().get("testKey");
            System.out.println("Redis 연결 성공! testKey 값: " + value);
        } catch (Exception e) {
            System.err.println("Redis 연결 실패: " + e.getMessage());
        }
    }
}
