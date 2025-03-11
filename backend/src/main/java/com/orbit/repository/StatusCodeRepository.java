package com.orbit.repository;

import com.orbit.entity.state.StatusCode;
import com.orbit.entity.state.StatusCodeId;
import com.orbit.entity.state.StatusTransitionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StatusCodeRepository extends JpaRepository<StatusCode, StatusCodeId> {

    @Query("SELECT s FROM StatusCode s WHERE s.parentCode = :parent ORDER BY s.sortOrder")
    List<StatusCode> findByParent(@Param("parent") String parentCode);

    @Query("SELECT s FROM StatusCode s WHERE s.systemType = :systemType ORDER BY s.sortOrder")
    List<StatusCode> findBySystemType(@Param("systemType") StatusCode.SystemType systemType);

    @Query("SELECT t FROM StatusTransitionRule t " +
            "WHERE t.fromStatus.parentCode = :fromParent " +
            "AND t.fromStatus.childCode = :fromChild")
    List<StatusTransitionRule> findValidTransitions(
            @Param("fromParent") String fromParent,
            @Param("fromChild") String fromChild
    );
}

