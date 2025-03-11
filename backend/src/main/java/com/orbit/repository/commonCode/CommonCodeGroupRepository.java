package com.orbit.repository.commonCode;

import com.orbit.entity.commonCode.CommonCodeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CommonCodeGroupRepository extends JpaRepository<CommonCodeGroup, String> {

    @Query("SELECT g FROM CommonCodeGroup g WHERE g.useYn = 'Y' ORDER BY g.id")
    List<CommonCodeGroup> findAllActive();

    @Query("SELECT g FROM CommonCodeGroup g LEFT JOIN FETCH g.codes WHERE g.id = :id")
    Optional<CommonCodeGroup> findByIdWithCodes(String id);

    List<CommonCodeGroup> findByNameContaining(String name);

    Optional<CommonCodeGroup> findByName(String name);

    boolean existsByName(String name);
}