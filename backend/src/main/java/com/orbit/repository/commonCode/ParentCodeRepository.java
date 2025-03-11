package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.ParentCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ParentCodeRepository extends JpaRepository<ParentCode, Long> {
    // 기존 메서드 유지
    ParentCode findByEntityTypeAndCodeGroup(String entityType, String codeGroup);

    // 코드 이름으로 조회
    ParentCode findByCodeName(String codeName);

    // 엔티티 유형으로 조회
    ParentCode findByEntityType(String entityType);
}