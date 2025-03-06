package com.orbit.service.inspection;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.orbit.entity.inspection.Inspection;
import com.orbit.repository.inspection.InspectionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InspectionService {

    private final InspectionRepository inspectionRepository;

    public List<Inspection> getAllInspections() {
        return inspectionRepository.findAll();
    }

    public Optional<Inspection> getInspectionById(Long id) {
        return inspectionRepository.findById(id);
    }

    public Inspection createInspection(Inspection inspection) {
        return inspectionRepository.save(inspection);
    }

    public void deleteInspection(Long id) {
        inspectionRepository.deleteById(id);
    }
}
