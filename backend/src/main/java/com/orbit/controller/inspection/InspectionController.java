package com.orbit.controller.inspection;

import java.util.List;
import java.util.Optional;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.entity.inspection.Inspection;
import com.orbit.service.inspection.InspectionService;

import lombok.RequiredArgsConstructor;

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
