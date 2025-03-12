package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ChildCodeRepository extends JpaRepository<ChildCode, Long> {
    // Optional 반환으로 수정 ★★★
    Optional<ChildCode> findByParentCodeAndCodeValue(ParentCode parentCode, String codeValue);

    // 기존 메서드 유지
    Optional<ChildCode> findByCodeValue(String codeValue);
    ChildCode findByCodeName(String codeName);
}
