package com.orbit.service.inspection;

import com.orbit.dto.inspection.InspectionsDto;
import com.orbit.entity.inspection.Inspections;
import com.orbit.repository.inspection.InspectionsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InspectionsService {

    private final InspectionsRepository inspectionsRepository;

    @Transactional(readOnly = true)
    public List<InspectionsDto> getAllInspections() {
        List<Inspections> inspections = inspectionsRepository.findAllWithContracts();
        return inspections.stream()
                .map(InspectionsDto::fromEntity)
                .collect(Collectors.toList());
    }
}