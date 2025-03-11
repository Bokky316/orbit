package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChildCodeRepository extends JpaRepository<ChildCode, Long> {
    // 기존 메서드 유지
    ChildCode findByParentCodeAndCodeValue(ParentCode parentCode, String codeValue);

    // 코드 값으로 조회
    Optional<ChildCode> findByCodeValue(String codeValue);

    // 코드 이름으로 조회
    ChildCode findByCodeName(String codeName);
}