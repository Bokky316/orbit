package com.orbit.service.procurement;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.ApprovalLineResponseDTO;
import com.orbit.dto.approval.ApprovalProcessDTO;
import com.orbit.entity.approval.ApprovalLine;
import com.orbit.entity.approval.Department;
import com.orbit.entity.approval.Position;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ApprovalException;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.ApprovalLineRepository;
import com.orbit.repository.approval.DepartmentRepository;
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

import java.time.LocalDateTime;
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
    private final DepartmentRepository departmentRepo; // 추가된 Repository
    private final SimpMessagingTemplate messagingTemplate;
    private static final int MAX_APPROVAL_STEPS = 3;

    // 결재선 생성 메서드
    public ApprovalLineResponseDTO createApprovalLine(ApprovalLineCreateDTO dto) {
        // 구매 요청 조회
        PurchaseRequest request = purchaseRequestRepo.findById(dto.getPurchaseRequestId())

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

    // 결재 가능한 멤버 조회 메서드
    private List<Member> findEligibleMembersForApproval(PurchaseRequest request) {
        // 기안자의 부서 가져오기
        Department requesterDepartment = request.getMember().getDepartment();

        List<Member> approvers = new ArrayList<>();

        // 1. 해당 부서의 상위 직급 멤버 (팀장/부서장) 조회
        List<Member> departmentHeads = memberRepo.findByDepartmentAndPositionLevelGreaterThan(
                requesterDepartment,
                requesterDepartment.getTeamLeaderLevel() // 팀장 직급 수준
        );

        // 2. 재무/구매팀 담당자 조회 - 예외 처리 추가하여 찾을 수 없는 경우 다른 부서를 사용
        Department financeDepartment = null;
        try {
            financeDepartment = departmentRepo.findByName("재무팀")
                    .orElseGet(() -> departmentRepo.findByName("재무회계팀")
                            .orElse(null));
        } catch (Exception e) {
            log.warn("재무팀 또는 재무회계팀을 찾을 수 없습니다: {}", e.getMessage());
        }

        Department purchaseDepartment = null;
        try {
            purchaseDepartment = departmentRepo.findByName("구매팀")
                    .orElseGet(() -> departmentRepo.findByName("구매관리팀")
                            .orElse(null));
        } catch (Exception e) {
            log.warn("구매팀 또는 구매관리팀을 찾을 수 없습니다: {}", e.getMessage());
        }

        List<Member> financeMembers = new ArrayList<>();
        if (financeDepartment != null) {
            financeMembers = memberRepo.findByDepartmentAndPositionLevelBetween(
                    financeDepartment,
                    financeDepartment.getMiddleManagerLevel(),
                    financeDepartment.getUpperManagerLevel()
            );
        }

        List<Member> purchaseMembers = new ArrayList<>();
        if (purchaseDepartment != null) {
            purchaseMembers = memberRepo.findByDepartmentAndPositionLevelBetween(
                    purchaseDepartment,
                    purchaseDepartment.getMiddleManagerLevel(),
                    purchaseDepartment.getUpperManagerLevel()
            );
        }

        // 3. 임원 조회 - 예외 처리 추가
        Department executiveDept = null;
        try {
            executiveDept = departmentRepo.findByName("임원")
                    .orElse(null);
        } catch (Exception e) {
            log.warn("임원 부서를 찾을 수 없습니다: {}", e.getMessage());
        }

        List<Member> executives = new ArrayList<>();
        if (executiveDept != null) {
            executives = memberRepo.findByPositionLevelGreaterThan(
                    executiveDept.getExecutiveLevel()
            );
        } else {
            // 임원 부서가 없는 경우 직급 수준이 높은 멤버를 임원으로 간주
            // 직급 수준 상수 대신 직접 숫자 값을 사용 (예: 8이 임원급 직급 수준이라고 가정)
            executives = memberRepo.findByPositionLevelGreaterThan(8);
        }

        // 결재선 구성
        // 1. 기안자 부서의 팀장/부서장 중 한 명
        if (!departmentHeads.isEmpty()) {
            approvers.add(departmentHeads.get(0));
        }

        // 2. 재무팀 또는 구매팀 담당자 중 한 명
        if (!financeMembers.isEmpty()) {
            approvers.add(financeMembers.get(0));
        } else if (!purchaseMembers.isEmpty()) {
            approvers.add(purchaseMembers.get(0));
        }

        // 3. 임원 중 한 명
        if (!executives.isEmpty()) {
            approvers.add(executives.get(0));
        }

        // 필요한 승인자 수를 맞추기 위해 추가 로직
        while (approvers.size() < 3) {
            // 직급 높은 순으로 정렬된 전체 멤버 중 추가
            List<Member> allMembers = memberRepo.findAllSortedByPositionLevel();
            for (Member member : allMembers) {
                if (!approvers.contains(member)) {
                    approvers.add(member);
                    break;
                }
            }
        }

        return approvers;
    }

    // createAutoApprovalLine 메서드 수정
    public ApprovalLineResponseDTO createAutoApprovalLine(ApprovalLineCreateDTO dto) {
        // 구매 요청 조회
        PurchaseRequest request = purchaseRequestRepo.findById(dto.getPurchaseRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다. ID: " + dto.getPurchaseRequestId()));

        // 상위 상태 코드 조회
        ParentCode parentCode = findParentCode(ENTITY_TYPE, CODE_GROUP);

        // 부서를 고려한 결재 가능한 멤버 조회
        List<Member> approvers = findEligibleMembersForApproval(request);

        // 현재 사용자(기안자)를 첫 번째 단계로 설정
        Member requester = request.getMember();

        // 결재선 자동 생성
        List<ApprovalLine> lines = new ArrayList<>();

        // 1단계: 기안자 (작성자) - 요청과 동시에 승인 처리
        ChildCode approvedStatus = findChildCode(parentCode, "APPROVED"); // 승인 상태 사용

        ApprovalLine requesterLine = ApprovalLine.builder()
                .purchaseRequest(request)
                .approver(requester)
                .step(1)
                .status(approvedStatus) // 바로 승인 상태로 설정
                .approvedAt(LocalDateTime.now()) // 승인 시간 현재로 설정
                .comment("구매 요청 작성자(기안자) 자동 승인") // 기본 코멘트 설정
                .build();
        lines.add(requesterLine);

        // 2~4단계: 부서 기반 결재자
        for (int step = 2; step <= 4 && step-2 < approvers.size(); step++) {
            ChildCode status = step == 2
                    ? findChildCode(parentCode, "IN_REVIEW")
                    : findChildCode(parentCode, "PENDING");

            ApprovalLine line = ApprovalLine.builder()
                    .purchaseRequest(request)
                    .approver(approvers.get(step - 2))
                    .step(step)
                    .status(status)
                    .build();
            lines.add(line);
        }

        approvalLineRepo.saveAll(lines);

        // 실시간 업데이트
        sendRealTimeUpdate(request.getId());

        // 생성된 첫 번째 결재선 응답 DTO 반환
        return convertToDTO(lines.get(0));
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

    // 결재 처리 메서드 수정
    public ApprovalLineResponseDTO processApproval(Long lineId, ApprovalProcessDTO dto) {
        ApprovalLine line = approvalLineRepo.findById(lineId)
                .orElseThrow(() -> new ResourceNotFoundException("결재선을 찾을 수 없습니다. ID: " + lineId));

        // 상위 상태 코드 조회
        ParentCode parentCode = findParentCode(ENTITY_TYPE, CODE_GROUP);

        // 다음 상태 코드 조회
        ChildCode nextStatus = findChildCode(parentCode, dto.getNextStatusCode());

        // 결재 처리
        processApprovalAction(line, dto, nextStatus, parentCode);

        // 모든 결재가 완료되었는지 확인하고 구매요청 상태 변경
        if ("APPROVE".equalsIgnoreCase(dto.getAction())) {
            checkAndUpdateRequestStatus(line.getPurchaseRequest().getId());
        }

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
                .purchaseRequestId(line.getPurchaseRequest().getId())
                .approverId(line.getApprover().getId()) // 이 부분 추가
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
        List<Member> eligibleMembers = memberRepo.findByPositionLevelGreaterThanEqual(Position.MIN_APPROVAL_LEVEL);

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

    /**
     * 모든 결재 단계가 완료되었는지 확인하고, 완료된 경우 구매 요청 상태 변경
     */
    @Transactional
    public void checkAndUpdateRequestStatus(Long requestId) {
        log.info("결재 완료 여부 확인 및 구매요청 상태 업데이트: 요청 ID={}", requestId);

        // 1. 해당 요청의 모든 결재선 조회
        List<ApprovalLine> approvalLines = approvalLineRepo.findAllByRequestId(requestId);

        // 2. 모든 결재선이 승인 상태인지 확인
        ParentCode parentCode = findParentCode(ENTITY_TYPE, CODE_GROUP);
        ChildCode approvedStatus = findChildCode(parentCode, "APPROVED");

        boolean allApproved = approvalLines.stream()
                .allMatch(line -> line.getStatus().getCodeValue().equals("APPROVED"));

        // 3. 모든 결재선이 승인 상태이면 구매 요청 상태 변경
        if (allApproved) {
            log.info("모든 결재가 승인되었습니다. 구매요청 상태를 변경합니다: 요청 ID={}", requestId);

            PurchaseRequest purchaseRequest = purchaseRequestRepo.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("구매요청을 찾을 수 없습니다. ID: " + requestId));

            // 구매 요청 상태를 "구매요청 접수"로 변경
            ParentCode requestParentCode = parentCodeRepo.findByEntityTypeAndCodeGroup("PURCHASE_REQUEST", "STATUS")
                    .orElseThrow(() -> new ResourceNotFoundException("ParentCode(PURCHASE_REQUEST, STATUS)를 찾을 수 없습니다."));

            ChildCode receivedStatus = childCodeRepo.findByParentCodeAndCodeValue(requestParentCode, "RECEIVED")
                    .orElseThrow(() -> new ResourceNotFoundException("ChildCode(RECEIVED)를 찾을 수 없습니다."));

            SystemStatus newStatus = new SystemStatus(requestParentCode.getCodeName(), receivedStatus.getCodeValue());
            purchaseRequest.setStatus(newStatus);

            purchaseRequestRepo.save(purchaseRequest);
            log.info("구매요청 상태가 '구매요청 접수'로 변경되었습니다: 요청 ID={}", requestId);

            // 구매요청 접수 알림 전송
            sendRequestReceivedNotification(purchaseRequest);
        }
    }

    /**
     * 구매요청 접수 알림 전송
     */
    private void sendRequestReceivedNotification(PurchaseRequest request) {
        // 구매 담당자에게 알림 전송
        try {
            // 구매팀 담당자 찾기
            Department purchaseDept = departmentRepo.findByName("구매팀")
                    .orElseGet(() -> departmentRepo.findByName("구매관리팀")
                            .orElse(null));

            if (purchaseDept != null) {
                List<Member> purchaseManagers = memberRepo.findByDepartmentAndPositionLevelBetween(
                        purchaseDept,
                        purchaseDept.getMiddleManagerLevel(),
                        purchaseDept.getUpperManagerLevel()
                );

                for (Member manager : purchaseManagers) {
                    messagingTemplate.convertAndSendToUser(
                            manager.getUsername(),
                            "/queue/notifications",
                            String.format("새로운 구매요청(ID: %d, 요청명: %s)이 접수되었습니다.",
                                    request.getId(), request.getRequestName())
                    );
                }
            }
        } catch (Exception e) {
            log.error("구매요청 접수 알림 전송 중 오류 발생: {}", e.getMessage());
        }
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
