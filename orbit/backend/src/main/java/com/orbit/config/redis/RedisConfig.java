package com.orbit.config.redis;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.beans.factory.annotation.Qualifier;

import com.orbit.service.MessageSubscriberService;

/**
 * Redis 설정 클래스
 * - RedisTemplate 및 CacheManager 빈 등록
 * - Redis를 활용한 캐싱 기능 활성화 (@EnableCaching)
 * - Redis에 저장되는 Key, Value의 직렬화 방식 지정
 * - RedisConnectionFactory를 활용하여 Redis 서버와 연결
 */
@Configuration
@EnableCaching // Spring의 캐싱 기능 활성화
public class RedisConfig {

    // 🔹 Pub/Sub 메시지 전송을 위한 채널 이름
    public static final String CHAT_CHANNEL_PREFIX = "chat_channel_";

    /**
     * 🔹 RedisTemplate 빈 등록 (기존 Object 타입)
     * - RedisTemplate은 Spring에서 Redis 데이터를 다룰 때 사용하는 주요 인터페이스
     * - Redis에 데이터를 저장하거나 조회할 때 사용됨
     * - Key와 Value의 직렬화(Serialization) 방식을 설정해야 함
     * - LettuceConnectionFactory를 사용하여 Redis 서버와 연결
     * @param connectionFactory Redis 연결을 위한 LettuceConnectionFactory
     * @return 설정된 RedisTemplate 객체
     */
    @Bean
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
     * 🔹 CacheManager 빈 등록
     * - Spring의 캐싱 기능과 Redis를 연결하는 역할
     * - RedisCacheManager를 사용하여 Redis를 캐시 저장소로 활용
     * - CacheManager는 RedisConnectionFactory를 사용하여 Redis와 연결됨
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        return RedisCacheManager.builder(redisConnectionFactory).build();
    }

    /**
     * 🔹 RedisTemplate<String, String> Bean 등록
     * - RedisPublisherService에서 사용하기 위해 추가 등록
     * - @Qualifier("redisStringTemplate")로 주입
     */
    @Bean
    @Qualifier("redisStringTemplate")
    public RedisTemplate<String, String> redisStringTemplate(LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // String 데이터 직렬화 설정
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());

        return template;
    }

    /**
     * 🔹 Redis Pub/Sub 메시지 수신 설정
     * - Redis에서 발행된 메시지를 MessageSubscriberService를 통해 처리
     * - RedisMessageListenerContainer를 통해 구독자 등록
     */
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory,
                                                                       MessageSubscriberService messageSubscriberService) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // ✅ 사용자별 메시지 채널 구독 설정
        for (int userId = 1; userId <= 1000; userId++) { // 최대 1000명의 사용자 채널 생성 (필요 시 변경)
            container.addMessageListener(new MessageListenerAdapter(messageSubscriberService),
                    new ChannelTopic(CHAT_CHANNEL_PREFIX + userId));
        }

        return container;
    }
}
