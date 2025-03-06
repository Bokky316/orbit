package com.orbit.service;

import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisService {

    private final RedisTemplate<String, Object> redisObjectTemplate;
    private final MemberRepository memberRepository;

    /**
     * 사용자의 권한 정보를 Redis에 캐싱
     */
    public void cacheUserAuthorities(String email) {
        log.info("사용자 [{}]의 권한 정보를 Redis에 캐싱합니다.", email);

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일을 가진 사용자가 존재하지 않습니다."));

        List<String> authorities = member.getAuthorities().stream()
                .map(role -> role.getAuthority())
                .collect(Collectors.toList());

        redisObjectTemplate.opsForValue().set("AUTH:" + email, authorities, Duration.ofHours(6));

        log.info("사용자 [{}]의 권한 정보가 Redis에 저장되었습니다: {}", email, authorities);
    }

    /**
     * Redis에서 사용자의 권한 정보 조회
     */
    public List<String> getUserAuthoritiesFromCache(String email) {
        Object data = redisObjectTemplate.opsForValue().get("AUTH:" + email);

        if (data instanceof List<?>) {
            return ((List<?>) data).stream()
                    .map(String.class::cast)
                    .collect(Collectors.toList());
        }

        log.warn("Redis에서 [{}]의 권한 정보를 불러올 수 없습니다.", email);
        return List.of(); // 빈 리스트 반환
    }

    /**
     * Redis에서 사용자 권한 정보 삭제
     */
    public void removeUserAuthorities(String email) {
        redisObjectTemplate.delete("AUTH:" + email);
        log.info("사용자 [{}]의 권한 정보가 Redis에서 삭제되었습니다.", email);
    }
}