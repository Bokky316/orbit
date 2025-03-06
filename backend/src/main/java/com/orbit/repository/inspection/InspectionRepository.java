package com.orbit.repository.inspection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.inspection.Inspection;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {}
