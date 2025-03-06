package com.orbit.service;

import com.orbit.entity.Member;
import com.orbit.repository.MemberRepository;
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
    public void cacheUserAuthorities(String username) { // email -> username으로 변경
        log.info("사용자 [{}]의 권한 정보를 Redis에 캐싱합니다.", username);

        Member member = memberRepository.findByUsername(username) // email -> username으로 변경
                .orElseThrow(() -> new IllegalArgumentException("해당 username을 가진 사용자가 존재하지 않습니다."));

        List<String> authorities = member.getAuthorities().stream()
                .map(role -> role.getAuthority())
                .collect(Collectors.toList());

        redisObjectTemplate.opsForValue().set("AUTH:" + username, authorities, Duration.ofHours(6)); // email -> username으로 변경

        log.info("사용자 [{}]의 권한 정보가 Redis에 저장되었습니다: {}", username, authorities);
    }

    /**
     * Redis에서 사용자의 권한 정보 조회
     */
    public List<String> getUserAuthoritiesFromCache(String username) { // email -> username으로 변경
        Object data = redisObjectTemplate.opsForValue().get("AUTH:" + username); // email -> username으로 변경

        if (data instanceof List<?>) {
            return ((List<?>) data).stream()
                    .map(String.class::cast)
                    .collect(Collectors.toList());
        }

        log.warn("Redis에서 [{}]의 권한 정보를 불러올 수 없습니다.", username);
        return List.of(); // 빈 리스트 반환
    }

    /**
     * Redis에서 사용자 권한 정보 삭제
     */
    public void removeUserAuthorities(String username) { // email -> username으로 변경
        redisObjectTemplate.delete("AUTH:" + username); // email -> username으로 변경
        log.info("사용자 [{}]의 권한 정보가 Redis에서 삭제되었습니다.", username);
    }
}
