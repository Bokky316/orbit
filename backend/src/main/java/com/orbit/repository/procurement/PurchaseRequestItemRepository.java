package com.orbit.repository.procurement;

import com.orbit.entity.procurement.PurchaseRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * PurchaseRequestItem 엔티티에 대한 JPA Repository 인터페이스
 */
@Repository
public interface PurchaseRequestItemRepository extends JpaRepository<PurchaseRequestItem, Long> {
}
