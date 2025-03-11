package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.ParentCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ParentCodeRepository extends JpaRepository<ParentCode, Long> {
    ParentCode findByEntityTypeAndCodeGroup(String entityType, String codeGroup);
    ParentCode findByCode(String code);
}