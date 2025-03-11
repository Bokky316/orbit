package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.CommonCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommonCodeRepository extends JpaRepository<CommonCode, String> {

    List<CommonCode> findByGroupId(String groupId);

    List<CommonCode> findByGroupIdOrderBySortOrderAsc(String groupId);

    @Query("SELECT c FROM CommonCode c WHERE c.group.id = :groupId AND c.useYn = 'Y' ORDER BY c.sortOrder ASC")
    List<CommonCode> findActiveCodesByGroupId(@Param("groupId") String groupId);

    Optional<CommonCode> findByGroupIdAndId(String groupId, String codeId);

    Optional<CommonCode> findByGroupIdAndValue(String groupId, String codeValue);

    boolean existsByGroupIdAndValue(String groupId, String codeValue);

    @Query("SELECT c FROM CommonCode c JOIN FETCH c.group WHERE c.id = :codeId")
    Optional<CommonCode> findByIdWithGroup(@Param("codeId") String codeId);
}