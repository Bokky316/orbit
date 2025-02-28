package com.orbit.config.redis;

import com.orbit.service.MessageSubscriberService;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching // Spring의 캐싱 기능 활성화
public class RedisConfig {

    /**
     * 🔹 사용자 권한 관리용 RedisTemplate (Object 저장)
     * - 기존 코드 유지
     */
    @Bean
    @Primary // 기본적으로 주입되는 RedisTemplate 지정
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory); // Redis 연결 설정

        // Key 직렬화 방식 설정 (문자열)
        template.setKeySerializer(new StringRedisSerializer());

        // Value 직렬화 방식 설정 (JSON 변환)
        // - 객체를 JSON으로 변환하여 Redis에 저장
        // - GenericJackson2JsonRedisSerializer를 사용하여 JSON 직렬화 수행
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        return template;
    }

    /**
     * 🔹 CacheManager 빈 등록 (기존 코드 유지)
     * - Spring의 캐싱 기능과 Redis를 연결하는 역할
     * - RedisCacheManager를 사용하여 Redis를 캐시 저장소로 활용
     * - CacheManager는 RedisConnectionFactory를 사용하여 Redis와 연결됨
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        return RedisCacheManager.builder(redisConnectionFactory).build();
    }

    /**
     * 🔹 메시징 전용 RedisTemplate (String 저장)
     * - Pub/Sub을 위한 RedisTemplate
     * - 메시지는 단순한 문자열 형태로 주고받으므로 String 직렬화 사용
     */
    @Bean(name = "redisStringTemplate")
    public RedisTemplate<String, String> redisStringTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(stringSerializer);

        return template;
    }

    /**
     * 🔹 Redis Pub/Sub 메시지 리스너 컨테이너 설정
     * - "chat_channel"을 구독하여 메시지를 수신할 수 있도록 설정
     */
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory, MessageSubscriberService subscriber) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(new MessageListenerAdapter(subscriber), new PatternTopic("chat_channel"));
        return container;
    }
}
