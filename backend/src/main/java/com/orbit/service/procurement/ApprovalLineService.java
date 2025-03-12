package com.orbit.service.procurement;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.ApprovalLineResponseDTO;
import com.orbit.dto.approval.ApprovalProcessDTO;
import com.orbit.entity.approval.ApprovalLine;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.ApprovalLineRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ApprovalLineService {

    private final ApprovalLineRepository approvalLineRepo;
    private final PurchaseRequestRepository purchaseRequestRepo;
    private final MemberRepository memberRepo;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 결재선 생성
    public void createApprovalLine(ApprovalLineCreateDTO dto) {
        PurchaseRequest request = purchaseRequestRepo.findById(dto.getPurchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다."));

        // 상태 코드 파싱 및 조회
        String[] statusParts = dto.getInitialStatusCode().split("-");
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup(statusParts[0], statusParts[1]);
        ChildCode initialStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode, statusParts[2]);

        List<ApprovalLine> lines = new ArrayList<>();
        int step = 1;

        for (Long approverId : dto.getApproverIds()) {
            Member approver = memberRepo.findById(approverId)
                    .orElseThrow(() -> new ResourceNotFoundException("결재자를 찾을 수 없습니다: " + approverId));

            // 첫 번째 라인은 IN_REVIEW, 나머지는 PENDING 상태
            ChildCode lineStatus = step == 1
                    ? childCodeRepository.findByParentCodeAndCodeValue(parentCode, "IN_REVIEW")
                    : childCodeRepository.findByParentCodeAndCodeValue(parentCode, "PENDING");

            ApprovalLine line = ApprovalLine.builder()
                    .purchaseRequest(request)
                    .approver(approver)
                    .step(step++)
                    .status(lineStatus)
                    .build();

            lines.add(line);
        }

        approvalLineRepo.saveAll(lines);
        sendRealTimeUpdate(request.getId()); // 실시간 상태 업데이트
    }

    // 결재 처리
    public void processApproval(Long lineId, ApprovalProcessDTO dto) {
        ApprovalLine line = approvalLineRepo.findById(lineId)
                .orElseThrow(() -> new ResourceNotFoundException("결재선을 찾을 수 없습니다."));

        // 상태 코드 파싱 및 조회
        String[] statusParts = dto.getNextStatusCode().split("-");
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup(statusParts[0], statusParts[1]);
        ChildCode nextStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode, statusParts[2]);

        switch (dto.getAction().toUpperCase()) {
            case "APPROVE":
                line.approve(dto.getComment());
                line.setStatus(nextStatus);
                advanceToNextStep(line, parentCode);
                break;
            case "REJECT":
                line.reject(dto.getComment());
                line.setStatus(nextStatus);
                cancelRemainingSteps(line, parentCode);
                break;
            default:
                throw new IllegalArgumentException("잘못된 요청 액션: " + dto.getAction());
        }

        approvalLineRepo.save(line);
        sendRealTimeUpdate(line.getPurchaseRequest().getId());
    }

    // 다음 단계로 진행
    private void advanceToNextStep(ApprovalLine currentLine, ParentCode parentCode) {
        List<ApprovalLine> lines = approvalLineRepo
                .findByPurchaseRequestIdOrderByStepAsc(currentLine.getPurchaseRequest().getId());

        ChildCode inReviewStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode, "IN_REVIEW");
        ChildCode pendingStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode, "PENDING");

        lines.stream()
                .filter(l -> l.getStep() > currentLine.getStep())
                .findFirst()
                .ifPresent(nextLine -> {
                    nextLine.setStatus(inReviewStatus);
                    approvalLineRepo.save(nextLine);
                    sendApprovalNotification(nextLine); // 알림 전송
                });
    }

    // 남은 단계 취소
    private void cancelRemainingSteps(ApprovalLine rejectedLine, ParentCode parentCode) {
        ChildCode rejectedStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode, "REJECTED");

        approvalLineRepo.findByPurchaseRequestIdOrderByStepAsc(rejectedLine.getPurchaseRequest().getId())
                .stream()
                .filter(l -> l.getStep() > rejectedLine.getStep())
                .forEach(l -> {
                    l.setStatus(rejectedStatus);
                    approvalLineRepo.save(l);
                });
    }

    // 실시간 알림 (웹소켓)
    private void sendRealTimeUpdate(Long requestId) {
        List<ApprovalLineResponseDTO> lines = getApprovalLines(requestId);
        messagingTemplate.convertAndSend("/topic/approvals/" + requestId, lines);
    }

    // 결재선 조회
    @Transactional(readOnly = true)
    public List<ApprovalLineResponseDTO> getApprovalLines(Long requestId) {
        return approvalLineRepo.findByPurchaseRequestIdOrderByStepAsc(requestId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // DTO 변환
    private ApprovalLineResponseDTO convertToDTO(ApprovalLine line) {
        return ApprovalLineResponseDTO.builder()
                .id(line.getId())
                .approverName(line.getApprover().getName())
                .department(line.getApprover().getDepartment().getName())
                .step(line.getStep())
                .status(line.getStatus())
                .approvedAt(line.getApprovedAt())
                .comment(line.getComment())
                .build();
    }

    // 알림 전송 메서드 구현 필요
    private void sendApprovalNotification(ApprovalLine line) {
        // 실제 알림 로직 구현
    }

    @Transactional(readOnly = true)
    public List<ApprovalLineResponseDTO> findEligibleApprovalMembers() {
        List<Member> eligibleMembers = memberRepo.findEligibleApprovalMembers(); // 기존 쿼리 메서드 사용

        return eligibleMembers.stream()
                .map(member -> ApprovalLineResponseDTO.builder()
                        .id(member.getId())
                        .approverName(member.getName())
                        .department(member.getDepartment().getName())
                        .statusCode("ELIGIBLE") // 결재 가능 상태를 나타내는 임시 상태 코드
                        .statusName("결재 가능")
                        .build())
                .collect(Collectors.toList());
    }
}
