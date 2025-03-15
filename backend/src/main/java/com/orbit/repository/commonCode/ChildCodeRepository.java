package com.orbit.repository.commonCode;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;

@Repository
public interface ChildCodeRepository extends JpaRepository<ChildCode, Long> {
    // Optional 반환으로 수정 ★★★
    Optional<ChildCode> findByParentCodeAndCodeValue(ParentCode parentCode, String codeValue);

    Optional<ChildCode> findByCodeValue(String codeValue);
    ChildCode findByCodeName(String codeName);
    /**
     * 부모 코드에 속한 활성화된 자식 코드 목록 조회
     */
    List<ChildCode> findByParentCodeAndIsActiveTrue(ParentCode parentCode);

    /**
     * 부모 코드에 속한 모든 자식 코드 조회
     */
    List<ChildCode> findByParentCode(ParentCode parentCode);

    /**
     * 특정 부모 코드 하위의 코드값 중복 체크
     */
    boolean existsByParentCodeAndCodeValue(ParentCode parentCode, String codeValue);

    /**
     * 특정 부모 코드 하위의 코드명 중복 체크
     */
    boolean existsByParentCodeAndCodeName(ParentCode parentCode, String codeName);

    /**
     * 부모 코드 ID로 자식 코드 삭제
     */
    void deleteByParentCodeId(Long parentCodeId);
}