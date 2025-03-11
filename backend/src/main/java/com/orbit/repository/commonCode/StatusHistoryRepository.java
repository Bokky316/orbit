package com.orbit.repository.commonCode;

import com.orbit.entity.code.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {

    List<StatusHistory> findByPurchaseRequestIdOrderByChangedAtDesc(Long purchaseRequestId);

    @Query("SELECT sh FROM StatusHistory sh WHERE sh.entityType = :entityType AND sh.purchaseRequest.id = :entityId ORDER BY sh.changedAt DESC")
    List<StatusHistory> findHistoryByEntityTypeAndId(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") Long entityId);

    @Query("SELECT COUNT(sh) FROM StatusHistory sh WHERE sh.entityType = :entityType AND sh.purchaseRequest.id = :entityId")
    long countHistoryByEntityTypeAndId(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") Long entityId);
}