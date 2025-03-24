package com.orbit.service.bidding;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.constant.BiddingStatus;
import com.orbit.constant.BiddingStatus.NotificationPriority;
import com.orbit.dto.bidding.BiddingContractDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;
import com.orbit.util.BiddingNumberUtil;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingContractService {
    private final BiddingContractRepository contractRepository;
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;


    /**
     * 모든 계약 목록 조회
     */
    public List<BiddingContractDto> getAllContracts() {
        List<BiddingContract> contracts = contractRepository.findAll();
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 상태의 계약 목록 조회
     */
    public List<BiddingContractDto> getContractsByStatus(String status) {
        List<BiddingContract> contracts = contractRepository.findAllByStatusChild_CodeValue(status);
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 입찰 공고의 계약 목록 조회
     */
    public List<BiddingContractDto> getContractsByBiddingId(Long biddingId) {
        List<BiddingContract> contracts = contractRepository.findByBiddingId(biddingId);
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급사의 계약 목록 조회
     */
    public List<BiddingContractDto> getContractsBySupplierId(Long supplierId) {
        List<BiddingContract> contracts = contractRepository.findBySupplierId(supplierId);
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 계약 상세 조회
     */
    public BiddingContractDto getContractById(Long id) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        return BiddingContractDto.fromEntity(contract);
    }

    /**
     * 계약 번호로 계약 조회
     */
    public BiddingContractDto getContractByTransactionNumber(String transactionNumber) {
        BiddingContract contract = contractRepository.findByTransactionNumber(transactionNumber);
        if (contract == null) {
            throw new EntityNotFoundException("계약을 찾을 수 없습니다. 계약번호: " + transactionNumber);
        }
        return BiddingContractDto.fromEntity(contract);
    }

    /**
     * 계약 상태 변경 이력 조회
     */
    public List<StatusHistory> getContractStatusHistories(Long contractId) {
        return contractRepository.findStatusHistoriesByContractId(contractId);
    }

    /**
     * 계약 세부 정보 업데이트
     */
    @Transactional
    public BiddingContractDto updateContractDetails(Long id, BiddingContractDto contractDto, Member member) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        
        // 권한 체크
        if (!canChangeStatus(member)) {
            throw new AccessDeniedException("계약 정보를 수정할 권한이 없습니다.");
        }
        
        // 상태 확인
        if (contract.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingContractStatusCode.CLOSED) ||
            contract.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingContractStatusCode.CANCELED)) {
            throw new IllegalStateException("완료 또는 취소된 계약은 수정할 수 없습니다.");
        }
        
        // 기본 정보 업데이트
        contract.setStartDate(contractDto.getStartDate());
        contract.setEndDate(contractDto.getEndDate());
        contract.setDeliveryDate(contractDto.getDeliveryDate());
        
        // 수량 및 금액 정보 업데이트
        if (contractDto.getQuantity() != null && contractDto.getUnitPrice() != null) {
            contract.setQuantity(contractDto.getQuantity());
            contract.setUnitPrice(contractDto.getUnitPrice());
            // 금액 재계산
            contract.recalculatePrices();
        }
        
        contract.setDescription(contractDto.getDescription());
        contract.setContractFilePath(contractDto.getContractFilePath());
        contract.setUpdatedBy(member);
        
        // 저장
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }

    /**
     * 특정 날짜 범위에 종료되는 계약 목록 조회
     */
    public List<BiddingContractDto> getContractsExpiringBetween(LocalDate startDate, LocalDate endDate) {
        List<BiddingContract> contracts = contractRepository.findExpiringContracts(startDate, endDate);
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 양측 모두 서명한 계약 목록 조회
     */
    public List<BiddingContractDto> getBothPartiesSignedContracts() {
        List<BiddingContract> contracts = contractRepository.findByBuyerSignatureNotNullAndSupplierSignatureNotNull();
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }


    /**
     * 계약 초안 생성
     */
    @Transactional
    public BiddingContractDto createContractDraft(Long biddingId, Long participationId, Member currentMember) {
        // 입찰 및 참여 정보 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 공급사 정보 조회
        Member supplier = memberRepository.findById(participation.getSupplierId())
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + participation.getSupplierId()));
        
        // 계약 번호 생성
        String transactionNumber = BiddingNumberUtil.generateContractNumber();
        
        // 계약 초안 생성
        BiddingContract contract = BiddingContract.builder()
                .bidding(bidding)
                .biddingParticipation(participation)
                .supplier(supplier)
                .transactionNumber(transactionNumber)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .totalAmount(participation.getTotalAmount())
                .quantity(participation.getQuantity())
                .unitPrice(participation.getUnitPrice())
                .build();
        
        // 상태 설정 - 공통 코드를 활용
        ChildCode draftStatus = childCodeRepository.findByParentCodeAndCodeValue(
                parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS").orElse(null),
                BiddingStatus.BiddingContractStatusCode.DRAFT
        ).orElseThrow(() -> new IllegalArgumentException("초안 상태 코드를 찾을 수 없습니다."));
        
        contract.setStatusChild(draftStatus);
        
        // 계약 초안 저장
        contract = contractRepository.save(contract);
        
        // 공급사에게 계약 초안 생성 알림
        notifySupplierAboutContractDraft(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }
    
    /**
     * 계약 진행 시작
     */
    @Transactional
    public BiddingContractDto startContract(Long contractId, Member currentMember) {
        BiddingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + contractId));
        
        // 권한 체크
        if (!canStartContract(currentMember)) {
            throw new AccessDeniedException("계약 진행을 시작할 권한이 없습니다.");
        }
        
        // 상태 확인
        if (!contract.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingContractStatusCode.DRAFT)) {
            throw new IllegalStateException("초안 상태의 계약만 진행할 수 있습니다.");
        }
        
        // 계약 진행 시작
        changeStatus(contract, BiddingStatus.BiddingContractStatusCode.IN_PROGRESS, "계약 진행 시작", currentMember.getId());
        
        // 계약 저장
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }

    
    /**
     * 구매자 서명
     */
    @Transactional
    public BiddingContractDto signByBuyer(Long contractId, String signature, Member currentMember) {
        BiddingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + contractId));
        
        // 권한 체크
        if (!canSignContract(currentMember)) {
            throw new AccessDeniedException("계약에 서명할 권한이 없습니다.");
        }
        
        // 상태 확인
        if (!contract.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingContractStatusCode.IN_PROGRESS)) {
            throw new IllegalStateException("진행중 상태의 계약만 서명할 수 있습니다.");
        }
        
        // 구매자 서명
        contract.setBuyerSignature(signature);
        contract.setBuyerSignedAt(LocalDateTime.now());
        contract.setUpdatedBy(currentMember);
        
        // 서명 완료 확인
        checkSignatureCompletion(contract);
        
        // 계약 저장
        contract = contractRepository.save(contract);
        
        // 알림 발송 (공급자에게)
        notifySupplierAboutBuyerSigning(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }


    /**
     * 공급자 서명
     */
    @Transactional
    public BiddingContractDto signBySupplier(Long contractId, String signature, Member currentMember) {
        BiddingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + contractId));
        
        // 권한 체크
        if (!isSupplier(currentMember, contract)) {
            throw new AccessDeniedException("해당 계약의 공급자만 서명할 수 있습니다.");
        }
        
        // 상태 확인
        if (!contract.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingContractStatusCode.IN_PROGRESS)) {
            throw new IllegalStateException("진행중 상태의 계약만 서명할 수 있습니다.");
        }
        
        // 공급자 서명
        contract.setSupplierSignature(signature);
        contract.setSupplierSignedAt(LocalDateTime.now());
        contract.setUpdatedBy(currentMember);
        
        // 서명 완료 확인
        checkSignatureCompletion(contract);
        
        // 계약 저장
        contract = contractRepository.save(contract);
        
        // 알림 발송 (구매자에게)
        notifyBuyerAboutSupplierSigning(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }

    
    /**
     * 상태 변경
     */
    @Transactional
    public BiddingContractDto changeStatus(Long contractId, String status, String reason, Member currentMember) {
        BiddingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + contractId));
        
        // 권한 체크
        if (!canChangeStatus(currentMember)) {
            throw new AccessDeniedException("계약 상태를 변경할 권한이 없습니다.");
        }
        
        // 상태 변경
        changeStatus(contract, status, reason, currentMember.getId());
        
        // 계약 저장
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }

    
    /**
     * 계약 취소
     */
    @Transactional
    public BiddingContractDto cancelContract(Long contractId, String reason, Member currentMember) {
        BiddingContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + contractId));
        
        // 권한 체크
        if (!canCancelContract(currentMember)) {
            throw new AccessDeniedException("계약을 취소할 권한이 없습니다.");
        }
        
        // 상태 확인
        if (contract.getStatusChild().getCodeValue().equals(BiddingStatus.BiddingContractStatusCode.CLOSED)) {
            throw new IllegalStateException("완료된 계약은 취소할 수 없습니다.");
        }
        
        // 계약 취소
        changeStatus(contract, BiddingStatus.BiddingContractStatusCode.CANCELED, reason, currentMember.getId());
        
        // 계약 저장
        contract = contractRepository.save(contract);
        
        // 알림 발송
        notifyContractCancellation(contract, reason);
        
        return BiddingContractDto.fromEntity(contract);
    }

    

     // 상태 변경 내부 메서드
     private void changeStatus(BiddingContract contract, String newStatus, String reason, Long changedById) {
        // 상태 코드 조회
        ChildCode newStatusCode = childCodeRepository.findByParentCodeAndCodeValue(
                parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS").orElse(null),
                newStatus
        ).orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + newStatus));
        
        // 상태 변경
        ChildCode oldStatus = contract.getStatusChild();
        contract.setStatusChild(newStatusCode);
        
        // 상태 변경 이력 추가
        StatusHistory history = StatusHistory.builder()
            .biddingContract(contract)
            .entityType(StatusHistory.EntityType.CONTRACT)
            .fromStatus(oldStatus)
            .toStatus(newStatusCode)
            .reason(reason)
            .changedById(changedById)
            .changedAt(LocalDateTime.now())
            .build();
        
        contract.getStatusHistories().add(history);
        
        // 상태 변경에 따른 알림 발송
        sendStatusChangeNotifications(contract, oldStatus, newStatusCode);
    }
    
    // 서명 완료 확인 내부 메서드
    private void checkSignatureCompletion(BiddingContract contract) {
        if (contract.getBuyerSignature() != null && contract.getSupplierSignature() != null) {
            // 계약 완료 처리
            changeStatus(contract, BiddingStatus.BiddingContractStatusCode.CLOSED, "양측 서명 완료", contract.getUpdatedBy().getId());
            
            // 알림 발송 (양측에게)
            notifyBothPartiesAboutContractCompletion(contract);
        }
    }
    
    // 공급자 여부 확인 내부 메서드
    private boolean isSupplier(Member member, BiddingContract contract) {
        return contract.getSupplier() != null && contract.getSupplier().equals(member);
    }
    
    // 알림 메서드
    private void notifySupplierAboutContractDraft(BiddingContract contract) {
        if (contract.getSupplier() != null) {
            notificationService.sendNotification(
                NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.CONTRACT_DRAFT)
                    .referenceId(contract.getId())
                    .title("계약 초안 생성")
                    .content("'" + contract.getBidding().getTitle() + "' 입찰에 대한 계약 초안이 생성되었습니다.")
                    .recipientId(contract.getSupplier().getId())
                    .priority(NotificationPriority.HIGH)
                    .build()
            );
        }
    }

    private void notifySupplierAboutBuyerSigning(BiddingContract contract) {
        if (contract.getSupplier() != null) {
            notificationService.sendNotification(
                NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.CONTRACT_SIGNED)
                    .referenceId(contract.getId())
                    .title("구매자 서명 완료")
                    .content("계약 번호 '" + contract.getTransactionNumber() + "'에 구매자 서명이 완료되었습니다.")
                    .recipientId(contract.getSupplier().getId())
                    .priority(NotificationPriority.HIGH)
                    .build()
            );
        }
    }

    private void notifyBuyerAboutSupplierSigning(BiddingContract contract) {
        String creatorUsername = contract.getBidding().getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                notificationService.sendNotification(
                    NotificationRequest.builder()
                        .type(BiddingStatus.NotificationType.CONTRACT_SIGNED)
                        .referenceId(contract.getId())
                        .title("공급자 서명 완료")
                        .content("계약 번호 '" + contract.getTransactionNumber() + "'에 공급자 서명이 완료되었습니다.")
                        .recipientId(buyer.getId())
                        .priority(NotificationPriority.HIGH)
                        .build()
                );
            }
        }
    }

    private void notifyBothPartiesAboutContractCompletion(BiddingContract contract) {
        // 구매자에게 알림
        String creatorUsername = contract.getBidding().getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                notificationService.sendNotification(
                    NotificationRequest.builder()
                        .type(BiddingStatus.NotificationType.CONTRACT_COMPLETED)
                        .referenceId(contract.getId())
                        .title("계약 체결 완료")
                        .content("계약 번호 '" + contract.getTransactionNumber() + "'이 모든 서명을 완료하여 체결되었습니다.")
                        .recipientId(buyer.getId())
                        .priority(NotificationPriority.HIGH)
                        .build()
                );
            }
        }

        // 공급자에게 알림
        if (contract.getSupplier() != null) {
            notificationService.sendNotification(
                NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.CONTRACT_COMPLETED)
                    .referenceId(contract.getId())
                    .title("계약 체결 완료")
                    .content("계약 번호 '" + contract.getTransactionNumber() + "'이 모든 서명을 완료하여 체결되었습니다.")
                    .recipientId(contract.getSupplier().getId())
                    .priority(NotificationPriority.HIGH)
                    .build()
            );
        }
    }

    private void notifyContractCancellation(BiddingContract contract, String reason) {
        // 구매자에게 알림
        String creatorUsername = contract.getBidding().getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                notificationService.sendNotification(
                    NotificationRequest.builder()
                        .type(BiddingStatus.NotificationType.CONTRACT_CANCELED)
                        .referenceId(contract.getId())
                        .title("계약 취소")
                        .content("계약 번호 '" + contract.getTransactionNumber() + "'이 취소되었습니다. 사유: " + reason)
                        .recipientId(buyer.getId())
                        .priority(NotificationPriority.HIGH)
                        .build()
                );
            }
        }

        // 공급자에게 알림
        if (contract.getSupplier() != null) {
            notificationService.sendNotification(
                NotificationRequest.builder()
                    .type(BiddingStatus.NotificationType.CONTRACT_CANCELED)
                    .referenceId(contract.getId())
                    .title("계약 취소")
                    .content("계약 번호 '" + contract.getTransactionNumber() + "'이 취소되었습니다. 사유: " + reason)
                    .recipientId(contract.getSupplier().getId())
                    .priority(NotificationPriority.HIGH)
                    .build()
            );
        }
    }

    // 상태 변경 알림 메서드
    private void sendStatusChangeNotifications(BiddingContract contract, ChildCode oldStatus, ChildCode newStatus) {
        // 상태가 변경되었을 때 알림 처리
        String statusName = newStatus.getCodeName();
        
        // 주요 상태별 알림 처리
        switch(newStatus.getCodeValue()) {
            case BiddingStatus.BiddingContractStatusCode.IN_PROGRESS:
                notifyStatusChangeToParties(contract, "계약 진행 시작", 
                    "계약 번호 '" + contract.getTransactionNumber() + "'이 진행 상태로 변경되었습니다.");
                break;
                
            case BiddingStatus.BiddingContractStatusCode.CLOSED:
                // 이미 완료 알림은 별도 처리하므로 중복 방지
                if (!oldStatus.getCodeValue().equals(BiddingStatus.BiddingContractStatusCode.IN_PROGRESS)) {
                    notifyStatusChangeToParties(contract, "계약 완료", 
                        "계약 번호 '" + contract.getTransactionNumber() + "'이 완료 처리되었습니다.");
                }
                break;
                
            case BiddingStatus.BiddingContractStatusCode.CANCELED:
                // 취소 알림은 별도 메서드로 처리하므로 중복 방지
                break;
                
            default:
                notifyStatusChangeToParties(contract, "계약 상태 변경", 
                    "계약 번호 '" + contract.getTransactionNumber() + "'의 상태가 '" + statusName + "'(으)로 변경되었습니다.");
                break;
        }
    }
    
    // 양측에 상태 변경 알림 전송
    private void notifyStatusChangeToParties(BiddingContract contract, String title, String content) {
        // 구매자에게 알림
        String creatorUsername = contract.getBidding().getCreatedBy();
        if (creatorUsername != null && !creatorUsername.isEmpty()) {
            Member buyer = memberRepository.findByUsername(creatorUsername).orElse(null);
            if (buyer != null) {
                notificationService.sendNotification(
                    NotificationRequest.builder()
                        .type("CONTRACT_STATUS_CHANGED")
                        .referenceId(contract.getId())
                        .title(title)
                        .content(content)
                        .recipientId(buyer.getId())
                        .priority(NotificationPriority.NORMAL)
                        .build()
                );
            }
        }

        // 공급자에게 알림
        if (contract.getSupplier() != null) {
            notificationService.sendNotification(
                NotificationRequest.builder()
                    .type("CONTRACT_STATUS_CHANGED")
                    .referenceId(contract.getId())
                    .title(title)
                    .content(content)
                    .recipientId(contract.getSupplier().getId())
                    .priority(NotificationPriority.NORMAL)
                    .build()
            );
        }
    }

    // 권한 체크 메서드들 (AuthorizationConstants 활용)
    private boolean canCreateContractDraft(Member member) {
        return member.getPosition().getLevel() >= BiddingStatus.BiddingContractStatusPermissions.DRAFT.CREATE_MIN_LEVEL;
    }

    private boolean canStartContract(Member member) {
        return member.getPosition().getLevel() >= BiddingStatus.BiddingContractStatusPermissions.IN_PROGRESS.START_MIN_LEVEL;
    }

    private boolean canSignContract(Member member) {
        return member.getPosition().getLevel() >= BiddingStatus.BiddingContractStatusPermissions.IN_PROGRESS.SIGN_MIN_LEVEL;
    }

    private boolean canChangeStatus(Member member) {
        return member.getPosition().getLevel() >= BiddingStatus.BiddingContractStatusPermissions.CHANGE_STATUS_MIN_LEVEL;
    }

    private boolean canCancelContract(Member member) {
        return member.getPosition().getLevel() >= BiddingStatus.BiddingContractStatusPermissions.CANCEL_MIN_LEVEL;
    }

}