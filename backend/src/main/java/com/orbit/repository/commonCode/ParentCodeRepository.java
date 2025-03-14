package com.orbit.repository.commonCode;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.commonCode.ParentCode;

@Repository
public interface ParentCodeRepository extends JpaRepository<ParentCode, Long> {
    // Optional 반환으로 수정
    Optional<ParentCode> findByEntityTypeAndCodeGroup(String entityType, String codeGroup);

    ParentCode findByCodeName(String codeName);
    /**
     * 활성화된 부모 코드 목록 조회
     */
    List<ParentCode> findByIsActiveTrue();

    /**
     * entityType으로 부모 코드 목록 조회
     */
    List<ParentCode> findByEntityType(String entityType);

    /**
     * 코드명 중복 체크
     */
    boolean existsByCodeName(String codeName);

    /**
     * entityType과 codeGroup 조합 중복 체크
     */
    boolean existsByEntityTypeAndCodeGroup(String entityType, String codeGroup);
}