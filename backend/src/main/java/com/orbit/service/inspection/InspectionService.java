package com.orbit.service.inspection;

import com.orbit.dto.inspection.InspectionRequestDto;
import com.orbit.dto.inspection.InspectionResponseDto;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.inspection.Inspection;
import com.orbit.entity.member.Member;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.inspection.InspectionRepository;
import com.orbit.repository.member.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 📌 검수(Inspection) 서비스 클래스
 * - 검수 목록 조회
 * - 특정 검수 조회
 * - 검수 등록 (자동 배정 포함)
 * - 검수 수정 (결과 입력 시 검수일 자동 입력)
 */
@Service
@RequiredArgsConstructor
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final MemberRepository memberRepository; // 검수 담당자 조회를 위해 필요
    private final BiddingContractRepository biddingContractRepository;
    private final BiddingOrderRepository biddingOrderRepository;

    /**
     * ✅ (1) 검수 완료된 계약 목록 조회
     * - 검수 결과가 '합격' 또는 '불합격'인 경우만 조회
     * - 검수 목록을 DTO로 변환하여 반환
     */
    public List<InspectionResponseDto> getCompletedContractInspections() {
        List<Inspection> completedInspections = inspectionRepository.findByResultIn(
                Arrays.asList(Inspection.InspectionResult.합격, Inspection.InspectionResult.불합격)
        );
        return completedInspections.stream()
                .map(InspectionResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * ✅ (2) 특정 검수 조회
     * - 검수 ID를 기반으로 검수 정보 조회
     * - 존재하지 않는 경우 예외 처리
     */
    public Optional<InspectionResponseDto> getInspectionById(Long id) {
        return inspectionRepository.findById(id)
                .map(InspectionResponseDto::fromEntity);
    }

    /**
     * ✅ (3) 새로운 검수 등록 (자동 배정 포함)
     * - 검수자 자동 배정 (QualityControl 부서에서 가장 오래된 미배정 인원)
     * - 기본 검수 상태는 "검수대기"
     */
    @Transactional
    public InspectionResponseDto saveInspection(InspectionRequestDto requestDto) {
        // 검수자 자동 배정: 가장 오래된 미배정 검수 담당자 찾기
        Member inspector = memberRepository.findAvailableInspector("QualityControl")
                .orElseThrow(() -> new RuntimeException("검수 가능 인원이 없습니다."));

        // DTO → 엔티티 변환
        Inspection inspection = requestDto.toEntity();
        inspection.setInspectorId(inspector.getId()); // 자동 배정된 검수자 ID 설정
        inspection.setResult(Inspection.InspectionResult.검수대기); // 기본값: 검수대기

        // 검수 저장
        inspectionRepository.save(inspection);

        return InspectionResponseDto.fromEntity(inspection);
    }

    /**
     * ✅ (4) 검수 정보 수정
     * - 입력값을 기반으로 검수 정보 업데이트
     * - 검수 결과 입력 시, 자동으로 검수일 등록
     */
    @Transactional
    public InspectionResponseDto updateInspection(Long id, InspectionRequestDto requestDto) {
        // 검수 ID로 기존 데이터 조회 (없으면 예외 발생)
        Inspection inspection = inspectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("검수 정보를 찾을 수 없습니다."));

        // 검수 정보 업데이트
        inspection.setResult(requestDto.getResult());
        inspection.setComments(requestDto.getComments());
        inspection.setQuantityStatus(requestDto.getQuantityStatus());
        inspection.setQualityStatus(requestDto.getQualityStatus());
        inspection.setPackagingStatus(requestDto.getPackagingStatus());
        inspection.setSpecMatchStatus(requestDto.getSpecMatchStatus());

        // 검수 결과 입력 시, 자동으로 검수일 지정
        if (requestDto.getResult() != Inspection.InspectionResult.검수대기) {
            inspection.setInspectionDate(LocalDate.now());
        }

        // 변경 사항 저장
        inspectionRepository.save(inspection);

        return InspectionResponseDto.fromEntity(inspection);
    }

    /**
     * ✅ (5) 계약 완료 시 검수 목록 자동 등록
     * - `transactionNumber`를 이용해 계약을 찾음.
     * - 계약 상태가 '완료'(`CLOSED`)이면 검수 목록을 자동 생성
     */
    @Transactional
    public void createInspectionIfContractCompleted(String transactionNumber) {
        BiddingContract contract = biddingContractRepository.findCompletedContractByTransactionNumber(transactionNumber)
                .orElseThrow(() -> new EntityNotFoundException("완료된 계약을 찾을 수 없습니다."));

        // 자동 배정할 검수 담당자 찾기
        Long inspectorId = memberRepository.findAvailableInspector("QualityControl")
                .orElseThrow(() -> new RuntimeException("검수 가능 인원이 없습니다."));

        // 품목명 조회
        String itemName = biddingItemRepository.findById(
                biddingOrderRepository.findByTransactionNumber(transactionNumber)
                        .orElseThrow(() -> new EntityNotFoundException("발주 정보를 찾을 수 없습니다."))
                        .getBiddingItemId()
        ).orElseThrow(() -> new EntityNotFoundException("품목 정보를 찾을 수 없습니다.")).getItemName();

        // 검수 목록 생성
        Inspection inspection = Inspection.builder()
                .contractId(contract.getId())
                .transactionNumber(contract.getTransactionNumber())
                .supplierName(contract.getSupplier().getName())
                .itemName(itemName) // 품목명
                .quantity(contract.getQuantity())
                .inspectorId(inspectorId) // 자동 배정된 검수자
                .result(Inspection.InspectionResult.검수대기) // 초기 상태
                .build();

        inspectionRepository.save(inspection);
    }

}
