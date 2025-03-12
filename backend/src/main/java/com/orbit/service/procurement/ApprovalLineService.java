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
    private final ParentCodeRepository parentCodeRepo;
    private final ChildCodeRepository childCodeRepo;
    private final SimpMessagingTemplate messagingTemplate;

    // 결재선 생성
    public void createApprovalLine(ApprovalLineCreateDTO dto) {
        PurchaseRequest request = purchaseRequestRepo.findById(dto.getPurchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다. ID: " + dto.getPurchaseRequestId()));

        // 상태 코드 파싱 및 조회 (Optional 처리 추가)
        String[] statusParts = dto.getInitialStatusCode().split("-");
        ParentCode parentCode = parentCodeRepo.findByEntityTypeAndCodeGroup(statusParts[0], statusParts[1])
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ParentCode를 찾을 수 없습니다: " + statusParts[0] + "-" + statusParts[1]));

        ChildCode initialStatus = childCodeRepo.findByParentCodeAndCodeValue(parentCode, statusParts[2])
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ChildCode를 찾을 수 없습니다: " + statusParts[2]));

        List<ApprovalLine> lines = new ArrayList<>();
        int step = 1;

        for (Long approverId : dto.getApproverIds()) {
            Member approver = memberRepo.findById(approverId)
                    .orElseThrow(() -> new ResourceNotFoundException("결재자를 찾을 수 없습니다. ID: " + approverId));

            // 상태 코드 조회 (Optional 처리 추가)
            ChildCode lineStatus = step == 1
                    ? childCodeRepo.findByParentCodeAndCodeValue(parentCode, "IN_REVIEW")
                    .orElseThrow(() -> new ResourceNotFoundException("IN_REVIEW 상태 코드 없음"))
                    : childCodeRepo.findByParentCodeAndCodeValue(parentCode, "PENDING")
                    .orElseThrow(() -> new ResourceNotFoundException("PENDING 상태 코드 없음"));

            ApprovalLine line = ApprovalLine.builder()
                    .purchaseRequest(request)
                    .approver(approver)
                    .step(step++)
                    .status(lineStatus)
                    .build();

            lines.add(line);
        }

        approvalLineRepo.saveAll(lines);
        sendRealTimeUpdate(request.getId());
    }

    // 결재 처리
    public void processApproval(Long lineId, ApprovalProcessDTO dto) {
        ApprovalLine line = approvalLineRepo.findById(lineId)
                .orElseThrow(() -> new ResourceNotFoundException("결재선을 찾을 수 없습니다. ID: " + lineId));

        // 상태 코드 파싱 및 조회 (Optional 처리 추가)
        String[] statusParts = dto.getNextStatusCode().split("-");
        ParentCode parentCode = parentCodeRepo.findByEntityTypeAndCodeGroup(statusParts[0], statusParts[1])
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ParentCode를 찾을 수 없습니다: " + statusParts[0] + "-" + statusParts[1]));

        ChildCode nextStatus = childCodeRepo.findByParentCodeAndCodeValue(parentCode, statusParts[2])
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ChildCode를 찾을 수 없습니다: " + statusParts[2]));

        switch (dto.getAction().toUpperCase()) {
            case "APPROVE":
                line.approve(dto.getComment(), nextStatus);
                advanceToNextStep(line, parentCode);
                break;
            case "REJECT":
                line.reject(dto.getComment(), nextStatus);
                cancelRemainingSteps(line, parentCode);
                break;
            default:
                throw new IllegalArgumentException("잘못된 요청 액션: " + dto.getAction());
        }

        approvalLineRepo.save(line);
        sendRealTimeUpdate(line.getPurchaseRequest().getId());
    }

    // 다음 단계로 진행 (Optional 처리 추가)
    private void advanceToNextStep(ApprovalLine currentLine, ParentCode parentCode) {
        List<ApprovalLine> lines = approvalLineRepo.findAllByRequestId(currentLine.getPurchaseRequest().getId());

        ChildCode inReviewStatus = childCodeRepo.findByParentCodeAndCodeValue(parentCode, "IN_REVIEW")
                .orElseThrow(() -> new ResourceNotFoundException("IN_REVIEW 상태 코드 없음"));

        ChildCode pendingStatus = childCodeRepo.findByParentCodeAndCodeValue(parentCode, "PENDING")
                .orElseThrow(() -> new ResourceNotFoundException("PENDING 상태 코드 없음"));

        lines.stream()
                .filter(l -> l.getStep() > currentLine.getStep())
                .findFirst()
                .ifPresent(nextLine -> {
                    nextLine.setStatus(inReviewStatus);
                    approvalLineRepo.save(nextLine);
                    sendApprovalNotification(nextLine);
                });
    }

    // 남은 단계 취소 (Optional 처리 추가)
    private void cancelRemainingSteps(ApprovalLine rejectedLine, ParentCode parentCode) {
        ChildCode rejectedStatus = childCodeRepo.findByParentCodeAndCodeValue(parentCode, "REJECTED")
                .orElseThrow(() -> new ResourceNotFoundException("REJECTED 상태 코드 없음"));

        approvalLineRepo.findCurrentStep(rejectedLine.getPurchaseRequest().getId())
                .stream()
                .filter(l -> l.getStep() > rejectedLine.getStep())
                .forEach(l -> {
                    l.setStatus(rejectedStatus);
                    approvalLineRepo.save(l);
                });
    }

    // [기존 메서드 유지] -------------------------------------------------
    private void sendRealTimeUpdate(Long requestId) {
        List<ApprovalLineResponseDTO> lines = getApprovalLines(requestId);
        messagingTemplate.convertAndSend("/topic/approvals/" + requestId, lines);
    }

    @Transactional(readOnly = true)
    public List<ApprovalLineResponseDTO> getApprovalLines(Long requestId) {
        return approvalLineRepo.findCurrentStep(requestId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private ApprovalLineResponseDTO convertToDTO(ApprovalLine line) {
        return ApprovalLineResponseDTO.builder()
                .id(line.getId())
                .approverName(line.getApprover().getName())
                .department(line.getApprover().getDepartment().getName())
                .step(line.getStep())
                .statusCode(line.getStatus().getCodeValue())
                .approvedAt(line.getApprovedAt())
                .comment(line.getComment())
                .build();
    }

    private void sendApprovalNotification(ApprovalLine line) {
        // 구현 생략
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
