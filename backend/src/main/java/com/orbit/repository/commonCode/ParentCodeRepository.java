package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.ParentCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ParentCodeRepository extends JpaRepository<ParentCode, Long> {
    // Optional 반환으로 수정
    Optional<ParentCode> findByEntityTypeAndCodeGroup(String entityType, String codeGroup);

    // 기존 메서드 유지
    ParentCode findByCodeName(String codeName);
    ParentCode findByEntityType(String entityType);
}
