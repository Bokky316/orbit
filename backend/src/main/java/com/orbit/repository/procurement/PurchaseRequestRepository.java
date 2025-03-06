package com.orbit.repository.procurement;

import com.orbit.entity.procurement.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 구매 요청 엔티티에 대한 데이터 접근 인터페이스
 */
@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
}
