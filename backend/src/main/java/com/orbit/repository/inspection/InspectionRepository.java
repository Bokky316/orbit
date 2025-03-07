package com.orbit.repository.inspection;

import com.orbit.entity.inspection.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    List<Inspection> findByInspectorId(Long inspectorId);
}