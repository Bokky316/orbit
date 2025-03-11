package com.orbit.service.inspection;

import com.orbit.dto.inspection.InspectionRequestDto;
import com.orbit.dto.inspection.InspectionResponseDto;
import com.orbit.entity.inspection.Inspection;
import com.orbit.repository.inspection.InspectionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 검수(Inspection) 서비스
 * - 검수 데이터 조회, 등록, 수정 관리
 * - 계약 완료 상태인 데이터만 검수 목록에 추가
 */
@Service
public class InspectionService {
    private final InspectionRepository inspectionRepository;

    public InspectionService(InspectionRepository inspectionRepository) {
        this.inspectionRepository = inspectionRepository;
    }

    // 계약이 완료된 검수 목록 조회
    public List<InspectionResponseDto> getCompletedContractInspections() {
        return inspectionRepository.findAllByCompletedContract().stream()
                .map(InspectionResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 특정 검수 조회
    public Optional<InspectionResponseDto> getInspectionById(Long id) {
        return inspectionRepository.findById(id).map(InspectionResponseDto::fromEntity);
    }

    // 검수 등록
    public InspectionResponseDto saveInspection(InspectionRequestDto requestDTO) {
        Inspection inspection = requestDTO.toEntity();
        return InspectionResponseDto.fromEntity(inspectionRepository.save(inspection));
    }

    // 검수 수정
    public InspectionResponseDto updateInspection(Long id, InspectionRequestDto requestDTO) {
        return inspectionRepository.findById(id).map(inspection -> {
            inspection.setResult(requestDTO.getResult());
            inspection.setComments(requestDTO.getComments());
            inspection.setQuantityStatus(requestDTO.getQuantityStatus());
            inspection.setQualityStatus(requestDTO.getQualityStatus());
            inspection.setPackagingStatus(requestDTO.getPackagingStatus());
            inspection.setSpecMatchStatus(requestDTO.getSpecMatchStatus());
            return InspectionResponseDto.fromEntity(inspectionRepository.save(inspection));
        }).orElseThrow(() -> new RuntimeException("검수를 찾을 수 없습니다: " + id));
    }
}
