package com.orbit.repository.procurement;

import com.orbit.entity.procurement.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Item 엔티티에 대한 JPA Repository 인터페이스
 */
@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
}
