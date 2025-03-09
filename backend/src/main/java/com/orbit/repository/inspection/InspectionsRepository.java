package com.orbit.repository.inspection;

import com.orbit.entity.inspection.Inspections;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionsRepository extends JpaRepository<Inspections, Long> {

    // ✅ 계약 정보까지 함께 조회하는 쿼리
    @Query("SELECT i FROM Inspections i LEFT JOIN FETCH i.contract LEFT JOIN FETCH i.inspector")
    List<Inspections> findAllWithContracts();
}
