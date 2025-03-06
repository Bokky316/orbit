package com.orbit.service.inspection;

import com.orbit.dto.inspection.InspectionRequestDto;
import com.orbit.dto.inspection.InspectionResponseDto;
import com.orbit.entity.bidding.SimplifiedContract;
import com.orbit.entity.inspection.Inspection;
import com.orbit.repository.bidding.SimplifiedContractRepository;
import com.orbit.repository.inspection.InspectionRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class InspectionService {
    private final InspectionRepository inspectionRepository;
    private final SimplifiedContractRepository simplifiedContractRepository;

    public InspectionService(InspectionRepository inspectionRepository,
                             SimplifiedContractRepository simplifiedContractRepository) {
        this.inspectionRepository = inspectionRepository;
        this.simplifiedContractRepository = simplifiedContractRepository;
    }

    // 계약이 완료된 검수 목록 조회 - 수정된 로직
    public List<InspectionResponseDto> getCompletedContractInspections() {
        // 완료 상태의 계약 목록 조회
        List<SimplifiedContract> completedContracts =
                simplifiedContractRepository.findAllByStatus(SimplifiedContract.ContractStatus.완료);

        List<InspectionResponseDto> result = new ArrayList<>();

        for (SimplifiedContract contract : completedContracts) {
            // 해당 계약 ID로 검수 데이터 조회
            Optional<Inspection> existingInspection =
                    inspectionRepository.findByContractId(contract.getId());

            if (existingInspection.isPresent()) {
                // 검수 데이터가 있으면 그대로 반환
                result.add(InspectionResponseDto.fromEntity(existingInspection.get()));
            } else {
                // 검수 데이터가 없으면 기본 검수 정보로 Dto 생성
                InspectionResponseDto dto = new InspectionResponseDto();
                dto.setId(null); // 아직 검수 ID 없음
                dto.setContractId(contract.getId());
                dto.setInspectorId(null); // 아직 검수자 없음
                dto.setInspectionDate(null); // 아직 검수일 없음
                dto.setResult("검수대기"); // 기본 상태
                dto.setComments(null);
                dto.setQuantityStatus(null);
                dto.setQualityStatus(null);
                dto.setPackagingStatus(null);
                dto.setSpecMatchStatus(null);
                result.add(dto);
            }
        }

        return result;
    }

    // 특정 검수 조회 - 그대로 유지
    public Optional<InspectionResponseDto> getInspectionById(Long id) {
        return inspectionRepository.findById(id).map(InspectionResponseDto::fromEntity);
    }

    // 검수 등록 - 수정
    public InspectionResponseDto saveInspection(InspectionRequestDto requestDto) {
        // 해당 계약에 대한 검수가 이미 존재하는지 확인
        Optional<Inspection> existingInspection =
                inspectionRepository.findByContractId(requestDto.getContractId());

        Inspection inspection;
        if (existingInspection.isPresent()) {
            // 이미 존재하면 필드값 업데이트
            inspection = existingInspection.get();
            updateInspectionFields(inspection, requestDto);
        } else {
            // 존재하지 않으면 새로 생성
            inspection = requestDto.toEntity();
        }

        return InspectionResponseDto.fromEntity(inspectionRepository.save(inspection));
    }

    // 검수 수정 - 그대로 유지
    public InspectionResponseDto updateInspection(Long id, InspectionRequestDto requestDto) {
        return inspectionRepository.findById(id).map(inspection -> {
            updateInspectionFields(inspection, requestDto);
            return InspectionResponseDto.fromEntity(inspectionRepository.save(inspection));
        }).orElseThrow(() -> new RuntimeException("검수를 찾을 수 없습니다: " + id));
    }

    // 검수 필드 업데이트 헬퍼 메소드
    private void updateInspectionFields(Inspection inspection, InspectionRequestDto requestDto) {
        inspection.setInspectorId(requestDto.getInspectorId());
        inspection.setInspectionDate(requestDto.getInspectionDate());
        inspection.setResult(requestDto.getResult());
        inspection.setComments(requestDto.getComments());
        inspection.setQuantityStatus(requestDto.getQuantityStatus());
        inspection.setQualityStatus(requestDto.getQualityStatus());
        inspection.setPackagingStatus(requestDto.getPackagingStatus());
        inspection.setSpecMatchStatus(requestDto.getSpecMatchStatus());
    }
}
