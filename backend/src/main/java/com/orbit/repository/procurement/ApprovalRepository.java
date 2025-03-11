package com.orbit.repository.procurement;

import com.orbit.entity.approval.ApprovalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 결재 엔티티에 대한 데이터 접근 인터페이스
 */
@Repository
public interface ApprovalRepository extends JpaRepository<ApprovalLine, Long> {
}
