package com.orbit.repository.approval;

import com.orbit.entity.approval.ApprovalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ApprovalLineRepository extends JpaRepository<ApprovalLine, Long> {
    List<ApprovalLine> findByPurchaseRequestIdOrderByStepAsc(Long requestId);

    @Query("SELECT al FROM ApprovalLine al " +
            "WHERE al.purchaseRequest.id = :requestId " +
            "AND al.status = 'IN_REVIEW'")
    Optional<ApprovalLine> findCurrentStep(@Param("requestId") Long requestId);
}
