package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChildCodeRepository extends JpaRepository<ChildCode, Long> {
    ChildCode findByParentCodeAndCodeValue(ParentCode parentCode, String codeValue);
    ChildCode findByCode(String code);
}
