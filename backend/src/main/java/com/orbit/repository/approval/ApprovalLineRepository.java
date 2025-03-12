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

    // 리스트 조회용 추가
    @Query("SELECT al FROM ApprovalLine al " +
            "WHERE al.purchaseRequest.id = :requestId " +
            "ORDER BY al.step ASC")
    List<ApprovalLine> findAllByRequestId(@Param("requestId") Long requestId);

    // 현재 로그인한 사용자의 결재 대기 목록 조회
    @Query("SELECT al FROM ApprovalLine al " +
            "WHERE al.approver.username = :username " +
            "AND al.status.codeValue IN ('IN_REVIEW', 'PENDING')")
    List<ApprovalLine> findPendingApprovalsByUsername(@Param("username") String username);

    // 현재 로그인한 사용자의 완료된 결재 목록 조회
    @Query("SELECT al FROM ApprovalLine al " +
            "WHERE al.approver.username = :username " +
            "AND al.status.codeValue IN ('APPROVED', 'REJECTED')")
    List<ApprovalLine> findCompletedApprovalsByUsername(@Param("username") String username);
}
