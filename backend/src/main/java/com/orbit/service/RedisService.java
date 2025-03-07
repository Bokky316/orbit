package com.orbit.service;

import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Redis를 활용한 사용자 권한 캐싱 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisService {

    private final RedisTemplate<String, Object> redisObjectTemplate; // RedisTemplate 객체
    private final MemberRepository memberRepository; // MemberRepository 객체

    /**
     * 사용자의 권한 정보를 Redis에 캐싱
     *
     * @param username 사용자 ID
     */
    @Transactional(readOnly = true)
    public void cacheUserAuthorities(String username) {
        log.info("사용자 [{}]의 권한 정보를 Redis에 캐싱합니다.", username);

        // username으로 사용자 조회
        Member member = memberRepository.findByUsername(username);
        if (member == null) {
            throw new IllegalArgumentException("해당 username을 가진 사용자가 존재하지 않습니다.");
        }

        // 사용자 권한 정보 추출
        List<String> authorities = member.getAuthorities().stream()
                .map(authority -> authority.getAuthority()) // GrantedAuthority에서 권한 이름 추출
                .collect(Collectors.toList());

        // Redis에 저장 (6시간 TTL)
        redisObjectTemplate.opsForValue().set("AUTH:" + username, authorities, Duration.ofHours(6));
        log.info("사용자 [{}]의 권한 정보가 Redis에 저장되었습니다: {}", username, authorities);
    }

    /**
     * Redis에서 사용자의 권한 정보 조회
     *
     * @param username 사용자 ID
     * @return 권한 목록 (List<String>)
     */
    public List<String> getUserAuthoritiesFromCache(String username) {
        log.info("Redis에서 사용자 [{}]의 권한 정보를 조회합니다.", username);

        // Redis에서 데이터 조회
        Object data = redisObjectTemplate.opsForValue().get("AUTH:" + username);

        if (data instanceof List<?>) {
            return ((List<?>) data).stream()
                    .map(String.class::cast) // Object를 String으로 변환
                    .collect(Collectors.toList());
        }

        log.warn("Redis에서 [{}]의 권한 정보를 불러올 수 없습니다.", username);
        return List.of(); // 빈 리스트 반환
    }

    /**
     * Redis에서 사용자 권한 정보 삭제
     *
     * @param username 사용자 ID
     */
    public void removeUserAuthorities(String username) {
        log.info("Redis에서 사용자 [{}]의 권한 정보를 삭제합니다.", username);

        // Redis에서 데이터 삭제
        redisObjectTemplate.delete("AUTH:" + username);
        log.info("사용자 [{}]의 권한 정보가 Redis에서 삭제되었습니다.", username);
    }
}
