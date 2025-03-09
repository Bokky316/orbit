package com.orbit.controller.inspection;

import com.orbit.dto.inspection.InspectionsDto;
import com.orbit.entity.inspection.Inspections;
import com.orbit.service.inspection.InspectionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionsController {

    private final InspectionsService inspectionsService;

    @GetMapping
    public ResponseEntity<List<InspectionsDto>> getInspections() {
        try {
            List<InspectionsDto> inspections = inspectionsService.getAllInspections();

            if (inspections.isEmpty()) {
                System.out.println("⚠️ 검수 데이터 없음");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }

            System.out.println("✅ 조회된 검수 데이터 개수: " + inspections.size());
            return ResponseEntity.ok(inspections);

        } catch (Exception e) {
            System.err.println("❌ 검수 목록 조회 중 오류 발생: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
