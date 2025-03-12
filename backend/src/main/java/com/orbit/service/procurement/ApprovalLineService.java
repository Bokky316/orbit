package com.orbit.service.procurement;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.ApprovalLineResponseDTO;
import com.orbit.dto.approval.ApprovalProcessDTO;
import com.orbit.entity.approval.ApprovalLine;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ApprovalException;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.ApprovalLineRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ApprovalLineService {

    private static final String ENTITY_TYPE = "APPROVAL_LINE";
    private static final String CODE_GROUP = "STATUS";

    private final ApprovalLineRepository approvalLineRepo;
    private final PurchaseRequestRepository purchaseRequestRepo;
    private final MemberRepository memberRepo;
    private final ParentCodeRepository parentCodeRepo;
    private final ChildCodeRepository childCodeRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private static final int MAX_APPROVAL_STEPS = 3;

    // 결재선 생성 메서드
    public ApprovalLineResponseDTO createApprovalLine(ApprovalLineCreateDTO dto) {
        // 구매 요청 조회
        PurchaseRequest request = purchaseRequestRepo.findById(dto.getPurchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다. ID: " + dto.getPurchaseRequestId()));

        // 상위 상태 코드 조회
        ParentCode parentCode = findParentCode(ENTITY_TYPE, CODE_GROUP);

        // 초기 상태 코드 조회
        ChildCode initialStatus = findChildCode(parentCode, "WAITING");

        // 결재선 생성
        List<ApprovalLine> lines = createApprovalLines(request, dto.getApproverIds(), parentCode);
        approvalLineRepo.saveAll(lines);

        // 실시간 업데이트
        sendRealTimeUpdate(request.getId());

        // 생성된 첫 번째 결재선 응답 DTO 반환
        return convertToDTO(lines.get(0));
    }

    // 자동 결재선 생성 메서드
    public ApprovalLineResponseDTO createAutoApprovalLine(ApprovalLineCreateDTO dto) {
        // 구매 요청 조회
        PurchaseRequest request = purchaseRequestRepo.findById(dto.getPurchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다. ID: " + dto.getPurchaseRequestId()));

        // 상위 상태 코드 조회
        ParentCode parentCode = findParentCode(ENTITY_TYPE, CODE_GROUP);

        // 결재 가능한 멤버 조회 (직급 기준 정렬)
        List<Member> eligibleMembers = findEligibleMembersForApproval();

        // 결재선 자동 생성
        List<ApprovalLine> lines = createAutoApprovalLines(request, eligibleMembers, parentCode);
        approvalLineRepo.saveAll(lines);

        // 실시간 업데이트
        sendRealTimeUpdate(request.getId());

        // 생성된 첫 번째 결재선 응답 DTO 반환
        return convertToDTO(lines.get(0));
    }

    // 결재 가능한 멤버 조회 (직급 높은 순으로 정렬)
    private List<Member> findEligibleMembersForApproval() {
        // 직급이 3 이상인 모든 멤버 조회 (level >= 3)
        List<Member> eligibleMembers = memberRepo.findByPositionLevelGreaterThanEqual(3);

        // 직급이 높은 순으로 정렬
        return eligibleMembers.stream()
                .sorted((m1, m2) ->
                        Integer.compare(
                                m2.getPosition().getLevel(),
                                m1.getPosition().getLevel()
                        )
                )
                .limit(3)  // 최대 3단계로 제한
                .collect(Collectors.toList());
    }

    // 자동 결재선 생성 메서드
    private List<ApprovalLine> createAutoApprovalLines(
            PurchaseRequest request,
            List<Member> approvers,
            ParentCode parentCode
    ) {
        List<ApprovalLine> lines = new ArrayList<>();

        // 결재 단계별 상태 코드 조회
        ChildCode inReviewStatus = findChildCode(parentCode, "IN_REVIEW");
        ChildCode pendingStatus = findChildCode(parentCode, "PENDING");

        for (int step = 0; step < approvers.size(); step++) {
            ChildCode lineStatus = (step == 0) ? inReviewStatus : pendingStatus;

            ApprovalLine line = ApprovalLine.builder()
                    .purchaseRequest(request)
                    .approver(approvers.get(step))
                    .step(step + 1)
                    .status(lineStatus)
                    .build();

            lines.add(line);
        }

        return lines;
    }

    // 결재 처리 메서드
    public ApprovalLineResponseDTO processApproval(Long lineId, ApprovalProcessDTO dto) {
        ApprovalLine line = approvalLineRepo.findById(lineId)
                .orElseThrow(() -> new ResourceNotFoundException("결재선을 찾을 수 없습니다. ID: " + lineId));

        // 상위 상태 코드 조회
        ParentCode parentCode = findParentCode(ENTITY_TYPE, CODE_GROUP);

        // 다음 상태 코드 조회
        ChildCode nextStatus = findChildCode(parentCode, dto.getNextStatusCode());

        // 결재 처리
        processApprovalAction(line, dto, nextStatus, parentCode);

        // 실시간 업데이트
        sendRealTimeUpdate(line.getPurchaseRequest().getId());

        return convertToDTO(line);
    }

    // 결재 처리 액션 메서드
    private void processApprovalAction(ApprovalLine line, ApprovalProcessDTO dto,
                                       ChildCode nextStatus, ParentCode parentCode) {
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
                throw new ApprovalException("잘못된 결재 액션: " + dto.getAction());
        }

        approvalLineRepo.save(line);
    }

    // 다음 단계로 진행
    private void advanceToNextStep(ApprovalLine currentLine, ParentCode parentCode) {
        List<ApprovalLine> lines = approvalLineRepo.findAllByRequestId(currentLine.getPurchaseRequest().getId());
        ChildCode inReviewStatus = findChildCode(parentCode, "IN_REVIEW");

        lines.stream()
                .filter(l -> l.getStep() > currentLine.getStep())
                .findFirst()
                .ifPresent(nextLine -> {
                    nextLine.setStatus(inReviewStatus);
                    approvalLineRepo.save(nextLine);
                    sendApprovalNotification(nextLine);
                });
    }

    // 남은 단계 취소
    private void cancelRemainingSteps(ApprovalLine rejectedLine, ParentCode parentCode) {
        ChildCode rejectedStatus = findChildCode(parentCode, "REJECTED");

        approvalLineRepo.findCurrentStep(rejectedLine.getPurchaseRequest().getId())
                .stream()
                .filter(l -> l.getStep() > rejectedLine.getStep())
                .forEach(l -> {
                    l.setStatus(rejectedStatus);
                    approvalLineRepo.save(l);
                });
    }

    // 결재선 생성 보조 메서드
    private List<ApprovalLine> createApprovalLines(PurchaseRequest request,
                                                   List<Long> approverIds,
                                                   ParentCode parentCode) {
        List<ApprovalLine> lines = new ArrayList<>();
        int step = 1;

        for (Long approverId : approverIds) {
            Member approver = findMember(approverId);
            ChildCode lineStatus = step == 1
                    ? findChildCode(parentCode, "IN_REVIEW")
                    : findChildCode(parentCode, "PENDING");

            ApprovalLine line = ApprovalLine.builder()
                    .purchaseRequest(request)
                    .approver(approver)
                    .step(step++)
                    .status(lineStatus)
                    .build();

            lines.add(line);
        }

        return lines;
    }

    // 헬퍼 메서드들
    private ParentCode findParentCode(String entityType, String codeGroup) {
        return parentCodeRepo.findByEntityTypeAndCodeGroup(entityType, codeGroup)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ParentCode를 찾을 수 없습니다: " + entityType + "-" + codeGroup));
    }

    private ChildCode findChildCode(ParentCode parentCode, String codeValue) {
        return childCodeRepo.findByParentCodeAndCodeValue(parentCode, codeValue)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ChildCode를 찾을 수 없습니다: " + codeValue));
    }

    private Member findMember(Long approverId) {
        return memberRepo.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "결재자를 찾을 수 없습니다. ID: " + approverId));
    }

    // 실시간 업데이트 및 DTO 변환 메서드
    private void sendRealTimeUpdate(Long requestId) {
        List<ApprovalLineResponseDTO> lines = getApprovalLines(requestId);
        messagingTemplate.convertAndSend("/topic/approvals/" + requestId, lines);
    }

    // 특정 구매 요청의 현재 결재선 조회
    @Transactional(readOnly = true)
    public List<ApprovalLineResponseDTO> getApprovalLines(Long requestId) {
        // findAllByRequestId를 사용하여 모든 결재선을 단계 순서대로 조회
        return approvalLineRepo.findAllByRequestId(requestId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 결재선을 ResponseDTO로 변환
    private ApprovalLineResponseDTO convertToDTO(ApprovalLine line) {
        return ApprovalLineResponseDTO.builder()
                .id(line.getId())
                .purchaseRequestId(line.getPurchaseRequest().getId()) // 추가
                .approverName(line.getApprover().getName())
                .department(line.getApprover().getDepartment().getName())
                .step(line.getStep())
                .statusCode(line.getStatus().getCodeValue())
                .statusName(line.getStatus().getCodeName())
                .approvedAt(line.getApprovedAt())
                .comment(line.getComment())
                .build();
    }

    // 결재 가능한 멤버 조회
    @Transactional(readOnly = true)
    public List<ApprovalLineResponseDTO> findByPositionLevelGreaterThanEqual() {
        List<Member> eligibleMembers = memberRepo.findByPositionLevelGreaterThanEqual(3);

        return eligibleMembers.stream()
                .map(member -> ApprovalLineResponseDTO.builder()
                        .id(member.getId())
                        .approverName(member.getName())
                        .department(member.getDepartment().getName())
                        .statusCode("ELIGIBLE")
                        .statusName("결재 가능")
                        .build())
                .collect(Collectors.toList());
    }

    // 사용자의 결재 대기 목록 조회
    @Transactional(readOnly = true)
    public List<ApprovalLineResponseDTO> getPendingApprovals() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        return approvalLineRepo.findPendingApprovalsByUsername(currentUsername)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 사용자의 완료된 결재 목록 조회
    @Transactional(readOnly = true)
    public List<ApprovalLineResponseDTO> getCompletedApprovals() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        return approvalLineRepo.findCompletedApprovalsByUsername(currentUsername)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // 알림 전송 메서드 개선
    private void sendApprovalNotification(ApprovalLine line) {
        // 실제 알림 로직 (다양한 채널 지원)
        log.info("결재 알림 전송: 요청 ID {}, 결재자 {}",
                line.getPurchaseRequest().getId(),
                line.getApprover().getName());

        // 이메일 알림
        sendEmailNotification(line);

        // SMS 알림
        sendSMSNotification(line);

        // 웹소켓 실시간 알림
        sendWebSocketNotification(line);
    }

    private void sendEmailNotification(ApprovalLine line) {
        try {
            // 이메일 전송 로직 (JavaMail 또는 외부 서비스 활용)
            // 결재 대기 알림 이메일 발송
        } catch (Exception e) {
            log.error("이메일 알림 전송 중 오류 발생: {}", e.getMessage());
        }
    }

    private void sendSMSNotification(ApprovalLine line) {
        try {
            // SMS 전송 로직 (외부 SMS 서비스 활용)
            // 결재 대기 알림 SMS 발송
        } catch (Exception e) {
            log.error("SMS 알림 전송 중 오류 발생: {}", e.getMessage());
        }
    }

    private void sendWebSocketNotification(ApprovalLine line) {
        // 실시간 웹소켓 알림
        ApprovalLineResponseDTO notificationDto = convertToDTO(line);
        messagingTemplate.convertAndSendToUser(
                line.getApprover().getUsername(),
                "/queue/approvals",
                notificationDto
        );
    }
}