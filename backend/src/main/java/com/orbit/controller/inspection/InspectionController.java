package com.orbit.controller.inspection;

import com.orbit.entity.inspection.Inspection;
import com.orbit.service.inspection.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {
    private final InspectionService inspectionService;

    @GetMapping
    public List<Inspection> getAllInspections(@RequestParam(required = false) Long inspectorId) {
        if (inspectorId != null) {
            return inspectionService.getInspectionsByInspector(inspectorId);
        }
        return inspectionService.getAllInspections();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inspection> getInspectionById(@PathVariable Long id) {
        return inspectionService.getInspectionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Inspection> createInspection(@RequestBody Inspection inspection) {
        return ResponseEntity.ok(inspectionService.createInspection(inspection));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable Long id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.noContent().build();
    }
}
