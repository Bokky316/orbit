package com.orbit.controller.inspection;

import com.orbit.entity.inspection.Inspection;
import com.orbit.service.inspection.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    @GetMapping
    public List<Inspection> getAllInspections() {
        return inspectionService.getAllInspections();
    }

    @GetMapping("/{id}")
    public Optional<Inspection> getInspectionById(@PathVariable Long id) {
        return inspectionService.getInspectionById(id);
    }

    @PostMapping
    public Inspection createInspection(@RequestBody Inspection inspection) {
        return inspectionService.createInspection(inspection);
    }

    @DeleteMapping("/{id}")
    public void deleteInspection(@PathVariable Long id) {
        inspectionService.deleteInspection(id);
    }
}
