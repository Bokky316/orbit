package com.orbit.service.procurement;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.ApprovalLineResponseDTO;
import com.orbit.dto.approval.ApprovalProcessDTO;
import com.orbit.entity.approval.ApprovalLine;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.ApprovalLineRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
@Service
@RequiredArgsConstructor
@Transactional
public class ApprovalLineService {

    private final ApprovalLineRepository approvalLineRepo;
    private final PurchaseRequestRepository purchaseRequestRepo;
    private final MemberRepository memberRepo;
    private final SimpMessagingTemplate messagingTemplate;

    // 결재선 생성
    public void createApprovalLine(ApprovalLineCreateDTO dto) {
        PurchaseRequest request = purchaseRequestRepo.findById(dto.getPurchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다."));

        List<ApprovalLine> lines = new ArrayList<>();
        int step = 1;

        for (Long approverId : dto.getApproverIds()) {
            Member approver = memberRepo.findById(approverId)
                    .orElseThrow(() -> new ResourceNotFoundException("결재자를 찾을 수 없습니다: " + approverId));

            ApprovalLine line = ApprovalLine.builder()
                    .purchaseRequest(request)
                    .approver(approver)
                    .step(step++)
                    .status(step == 1 ? ApprovalStatus.IN_REVIEW : ApprovalStatus.PENDING)
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

        switch (dto.getAction().toUpperCase()) {
            case "APPROVE":
                line.approve(dto.getComment());
                advanceToNextStep(line);
                break;
            case "REJECT":
                line.reject(dto.getComment());
                cancelRemainingSteps(line);
                break;
            default:
                throw new InvalidActionException("잘못된 요청 액션: " + dto.getAction());
        }

        approvalLineRepo.save(line);
        sendRealTimeUpdate(line.getPurchaseRequest().getId());
    }

    // 다음 단계로 진행
    private void advanceToNextStep(ApprovalLine currentLine) {
        List<ApprovalLine> lines = approvalLineRepo
                .findByPurchaseRequestIdOrderByStepAsc(currentLine.getPurchaseRequest().getId());

        lines.stream()
                .filter(l -> l.getStep() > currentLine.getStep())
                .findFirst()
                .ifPresent(nextLine -> {
                    nextLine.setStatus(ApprovalStatus.IN_REVIEW);
                    approvalLineRepo.save(nextLine);
                    sendApprovalNotification(nextLine); // 알림 전송
                });
    }

    // 남은 단계 취소
    private void cancelRemainingSteps(ApprovalLine rejectedLine) {
        approvalLineRepo.findByPurchaseRequestIdOrderByStepAsc(rejectedLine.getPurchaseRequest().getId())
                .stream()
                .filter(l -> l.getStep() > rejectedLine.getStep())
                .forEach(l -> {
                    l.setStatus(ApprovalStatus.REJECTED);
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
}
