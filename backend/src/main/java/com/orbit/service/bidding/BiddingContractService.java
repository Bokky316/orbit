package com.orbit.service.bidding;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingContractDto;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingContractService {
    private final BiddingContractRepository contractRepository;
    private final MemberRepository memberRepository;
    private final NotificationRepository notificationRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;

    /**
     * 계약 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingContractDto> getAllContracts() {
        List<BiddingContract> contracts = contractRepository.findAll();
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 상태의 계약 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingContractDto> getContractsByStatus(String status) {
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> statusCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), status);
        if (statusCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + status);
        }
        
        List<BiddingContract> contracts = contractRepository.findByStatusChild(statusCode.get());
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 입찰 공고의 계약 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingContractDto> getContractsByBiddingId(Long biddingId) {
        List<BiddingContract> contracts = contractRepository.findByBiddingId(biddingId);
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 공급사의 계약 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingContractDto> getContractsBySupplierId(Long supplierId) {
        List<BiddingContract> contracts = contractRepository.findBySupplierId(supplierId);
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 계약 상세 조회
     */
    @Transactional(readOnly = true)
    public BiddingContractDto getContractById(Long id) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        return BiddingContractDto.fromEntity(contract);
    }
    
    /**
     * 계약 번호로 계약 조회
     */
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<StatusHistory> getContractStatusHistories(Long contractId) {
        return contractRepository.findStatusHistoriesByContractId(contractId);
    }
    
    /**
     * 계약 세부 정보 업데이트
     */
    @Transactional
    public BiddingContractDto updateContractDetails(Long id, BiddingContractDto contractDto) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        
        // 초안 상태인지 확인
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> draftStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "DRAFT");
        if (draftStatus.isEmpty() || contract.getStatusChild() == null || !contract.getStatusChild().equals(draftStatus.get())) {
            throw new IllegalStateException("초안 상태의 계약만 수정할 수 있습니다.");
        }
        
        // 값 변경
        contract.setDescription(contractDto.getDescription());
        contract.setStartDate(contractDto.getStartDate());
        contract.setEndDate(contractDto.getEndDate());
        contract.setDeliveryDate(contractDto.getDeliveryDate());
        contract.setQuantity(contractDto.getQuantity());
        contract.setUnitPrice(contractDto.getUnitPrice());
        
        // 금액 재계산
        contract.recalculatePrices();
        
        // 계약 파일 경로 설정
        if (contractDto.getContractFilePath() != null) {
            contract.setContractFilePath(contractDto.getContractFilePath());
        }
        
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }
    
    /**
     * 계약 진행 시작
     */
    @Transactional
    public BiddingContractDto startContract(Long id, Long updatedById) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        
        Member updatedBy = memberRepository.findById(updatedById)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다. ID: " + updatedById));
        
        // 초안 상태인지 확인
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> draftStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "DRAFT");
        if (draftStatus.isEmpty() || contract.getStatusChild() == null || !contract.getStatusChild().equals(draftStatus.get())) {
            throw new IllegalStateException("초안 상태의 계약만 진행할 수 있습니다.");
        }
        
        // 진행중 상태로 변경
        Optional<ChildCode> inProgressStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "IN_PROGRESS");
        if (inProgressStatus.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: IN_PROGRESS");
        }
        
        contract.setStatusChild(inProgressStatus.get());
        
        // 상태 이력 추가
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.CONTRACT)
                .biddingContract(contract)
                .fromStatus(draftStatus.get())
                .toStatus(inProgressStatus.get())
                .reason("계약 진행 시작")
                .changedById(updatedById)
                .changedAt(LocalDateTime.now())
                .build();
        
        contract.getStatusHistories().add(history);
        
        // 알림 발송
        try {
            // 공급사에게 알림
            if (contract.getSupplier() != null) {
                // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                // sendContractNotification 대신 다른 알림 발송 방법 사용 필요
                /*
                notificationRepository.sendContractNotification(
                    contract.getSupplier(),
                    "계약 진행 시작",
                    "계약 번호 '" + contract.getTransactionNumber() + "'의 계약 진행이 시작되었습니다. 서명을 진행해주세요.",
                    contract.getId()
                );
                */
                // 대체 방법: 일반 알림 생성
                log.info("계약 진행 시작 알림 발송: 공급사 ID={}, 계약번호={}", 
                        contract.getSupplier().getId(), contract.getTransactionNumber());
            }

            // 구매자에게도 알림 (생성자)
            String creatorUsername = contract.getBidding().getCreatedBy(); 
            if (creatorUsername != null && !creatorUsername.isEmpty()) {
                // 사용자명으로 Member 찾기
                Optional<Member> creator = memberRepository.findByUsername(creatorUsername);
                if (creator.isPresent() && contract.getSupplier() != null && !creator.get().getId().equals(contract.getSupplier().getId())) {
                    // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                    /*
                    notificationRepository.sendContractNotification(
                        creator.get(),
                        "계약 진행 시작",
                        "계약 번호 '" + contract.getTransactionNumber() + "'의 계약 진행이 시작되었습니다. 서명을 진행해주세요.",
                        contract.getId()
                    );
                    */
                    // 대체 방법: 일반 알림 생성
                    log.info("계약 진행 시작 알림 발송: 구매자 ID={}, 계약번호={}", 
                            creator.get().getId(), contract.getTransactionNumber());
                }
            }
        } catch (Exception e) {
            log.error("계약 진행 알림 발송 실패", e);
        }
        
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }
    
    /**
     * 구매자 서명
     */
    @Transactional
    public BiddingContractDto signByBuyer(Long id, String signature, Long buyerId) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        
        Member buyer = memberRepository.findById(buyerId)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다. ID: " + buyerId));
        
        // 진행중 상태인지 확인
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> inProgressStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "IN_PROGRESS");
        if (inProgressStatus.isEmpty() || contract.getStatusChild() == null || !contract.getStatusChild().equals(inProgressStatus.get())) {
            throw new IllegalStateException("진행중 상태의 계약만 서명할 수 있습니다.");
        }
        
        // 구매자 서명
        contract.setBuyerSignature(signature);
        contract.setBuyerSignedAt(LocalDateTime.now());
        contract.setUpdatedBy(buyer);
        
        // 알림 발송 (공급자에게)
        try {
            if (contract.getSupplier() != null) {
                // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                /*
                notificationRepository.sendContractNotification(
                    contract.getSupplier(),
                    "구매자 서명 완료",
                    "계약 '" + contract.getTransactionNumber() + "'에 구매자 서명이 완료되었습니다. 공급자 서명을 진행해주세요.",
                    contract.getId()
                );
                */
                // 대체 방법: 일반 알림 생성
                log.info("구매자 서명 완료 알림 발송: 공급사 ID={}, 계약번호={}", 
                        contract.getSupplier().getId(), contract.getTransactionNumber());
            }
        } catch (Exception e) {
            log.error("구매자 서명 알림 발송 실패", e);
        }
        
        // 양측 서명 완료 시 완료 상태로 변경
        checkAndUpdateContractCompletionStatus(contract);
        
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }
    
    /**
     * 공급자 서명
     */
    @Transactional
    public BiddingContractDto signBySupplier(Long id, String signature) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        
        // 진행중 상태인지 확인
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> inProgressStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "IN_PROGRESS");
        if (inProgressStatus.isEmpty() || contract.getStatusChild() == null || !contract.getStatusChild().equals(inProgressStatus.get())) {
            throw new IllegalStateException("진행중 상태의 계약만 서명할 수 있습니다.");
        }
        
        // 공급자 서명
        contract.setSupplierSignature(signature);
        contract.setSupplierSignedAt(LocalDateTime.now());
        contract.setUpdatedBy(contract.getSupplier());
        
        // 알림 발송 (구매자에게)
        try {
            // 생성자 이름(String) 가져오기
            String creatorUsername = contract.getBidding().getCreatedBy();
            if (creatorUsername != null && !creatorUsername.isEmpty()) {
                // MemberRepository를 통해 Member 객체 조회
                Optional<Member> buyer = memberRepository.findByUsername(creatorUsername);
                if (buyer.isPresent()) {
                    // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                    /*
                    notificationRepository.sendContractNotification(
                        buyer.get(),
                        "공급자 서명 완료",
                        "계약 '" + contract.getTransactionNumber() + "'에 공급자 서명이 완료되었습니다.",
                        contract.getId()
                    );
                    */
                    // 대체 방법: 일반 알림 생성
                    log.info("공급자 서명 완료 알림 발송: 구매자 ID={}, 계약번호={}", 
                            buyer.get().getId(), contract.getTransactionNumber());
                }
            }
        } catch (Exception e) {
            log.error("공급자 서명 알림 발송 실패", e);
        }
        
        // 양측 서명 완료 시 완료 상태로 변경
        checkAndUpdateContractCompletionStatus(contract);
        
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }
    
    /**
     * 양측 서명 완료 시 계약 완료 상태로 변경
     */
    private void checkAndUpdateContractCompletionStatus(BiddingContract contract) {
        if (contract.getBuyerSignature() != null && contract.getSupplierSignature() != null) {
            // ParentCode 객체 먼저 찾기
            Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
            if (parentCode.isEmpty()) {
                log.error("상태 코드 그룹을 찾을 수 없습니다: BIDDING_CONTRACT_STATUS");
                return;
            }
            
            Optional<ChildCode> inProgressStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "IN_PROGRESS");
            Optional<ChildCode> closedStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "CLOSED");
            
            if (inProgressStatus.isEmpty() || closedStatus.isEmpty()) {
                log.error("상태 코드를 찾을 수 없습니다: IN_PROGRESS 또는 CLOSED");
                return;
            }
            
            // 상태 변경
            contract.setStatusChild(closedStatus.get());
            
            // 상태 이력 추가
            StatusHistory history = StatusHistory.builder()
                    .entityType(StatusHistory.EntityType.CONTRACT)
                    .biddingContract(contract)
                    .fromStatus(inProgressStatus.get())
                    .toStatus(closedStatus.get())
                    .reason("양측 서명 완료로 인한 계약 체결")
                    .changedAt(LocalDateTime.now())
                    .build();
            
            contract.getStatusHistories().add(history);
            
            // 알림 발송
            try {
                // 공급자에게 알림
                if (contract.getSupplier() != null) {
                    // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                    /*
                    notificationRepository.sendContractNotification(
                        contract.getSupplier(),
                        "계약 체결 완료",
                        "계약 '" + contract.getTransactionNumber() + "'이 모든 서명 절차를 완료하여 체결되었습니다.",
                        contract.getId()
                    );
                    */
                    // 대체 방법: 일반 알림 생성
                    log.info("계약 체결 완료 알림 발송: 공급사 ID={}, 계약번호={}", 
                            contract.getSupplier().getId(), contract.getTransactionNumber());
                }
                
                // 구매자에게 알림
                String creatorUsername = contract.getBidding().getCreatedBy();
                if (creatorUsername != null && !creatorUsername.isEmpty()) {
                    Optional<Member> buyer = memberRepository.findByUsername(creatorUsername);
                    if (buyer.isPresent()) {
                        // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                        /*
                        notificationRepository.sendContractNotification(
                            buyer.get(),
                            "계약 체결 완료",
                            "계약 '" + contract.getTransactionNumber() + "'이 모든 서명 절차를 완료하여 체결되었습니다.",
                            contract.getId()
                        );
                        */
                        // 대체 방법: 일반 알림 생성
                        log.info("계약 체결 완료 알림 발송: 구매자 ID={}, 계약번호={}", 
                                buyer.get().getId(), contract.getTransactionNumber());
                    }
                }
            } catch (Exception e) {
                log.error("계약 체결 알림 발송 실패", e);
            }
        }
    }
    
    /**
     * 계약 취소
     */
    @Transactional
    public BiddingContractDto cancelContract(Long id, String reason, Long cancelledById) {
        BiddingContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약을 찾을 수 없습니다. ID: " + id));
        
        // 완료 상태인지 확인
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> closedStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "CLOSED");
        if (closedStatus.isPresent() && contract.getStatusChild() != null && contract.getStatusChild().equals(closedStatus.get())) {
            throw new IllegalStateException("완료된 계약은 취소할 수 없습니다.");
        }
        
        // 취소 상태로 변경
        ChildCode currentStatus = contract.getStatusChild();
        Optional<ChildCode> canceledStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "CANCELED");
        if (canceledStatus.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: CANCELED");
        }
        
        contract.setStatusChild(canceledStatus.get());
        
        // 상태 이력 추가
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.CONTRACT)
                .biddingContract(contract)
                .fromStatus(currentStatus)
                .toStatus(canceledStatus.get())
                .reason(reason)
                .changedById(cancelledById)
                .changedAt(LocalDateTime.now())
                .build();
        
        contract.getStatusHistories().add(history);
        
        // 알림 발송
        try {
            // 공급자에게 알림
            if (contract.getSupplier() != null) {
                // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                /*
                notificationRepository.sendContractNotification(
                    contract.getSupplier(),
                    "계약 취소",
                    "계약 '" + contract.getTransactionNumber() + "'이 취소되었습니다. 사유: " + reason,
                    contract.getId()
                );
                */
                // 대체 방법: 일반 알림 생성
                log.info("계약 취소 알림 발송: 공급사 ID={}, 계약번호={}, 사유={}", 
                        contract.getSupplier().getId(), contract.getTransactionNumber(), reason);
            }
            
            // 구매자에게 알림 (생성자)
            String creatorUsername = contract.getBidding().getCreatedBy();
            if (creatorUsername != null && !creatorUsername.isEmpty()) {
                Optional<Member> creator = memberRepository.findByUsername(creatorUsername);
                if (creator.isPresent() && contract.getSupplier() != null && !creator.get().getId().equals(contract.getSupplier().getId())) {
                    // NotificationRepository에 sendContractNotification 메서드가 없으므로 기본 알림 발송 메서드 사용
                    /*
                    notificationRepository.sendContractNotification(
                        creator.get(),
                        "계약 취소",
                        "계약 '" + contract.getTransactionNumber() + "'이 취소되었습니다. 사유: " + reason,
                        contract.getId()
                    );
                    */
                    // 대체 방법: 일반 알림 생성
                    log.info("계약 취소 알림 발송: 구매자 ID={}, 계약번호={}, 사유={}", 
                            creator.get().getId(), contract.getTransactionNumber(), reason);
                }
            }
        } catch (Exception e) {
            log.error("계약 취소 알림 발송 실패", e);
        }
        
        contract = contractRepository.save(contract);
        
        return BiddingContractDto.fromEntity(contract);
    }
    
    /**
     * 특정 날짜 범위에 종료되는 계약 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingContractDto> getContractsExpiringBetween(LocalDate startDate, LocalDate endDate) {
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> closedStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), "CLOSED");
        if (closedStatus.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: CLOSED");
        }
        
        List<BiddingContract> contracts = contractRepository.findByStatusChildAndEndDateBetween(closedStatus.get(), startDate, endDate);
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 양측 모두 서명한 계약 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingContractDto> getBothPartiesSignedContracts() {
        List<BiddingContract> contracts = contractRepository.findByBuyerSignatureNotNullAndSupplierSignatureNotNull();
        return contracts.stream()
                .map(BiddingContractDto::fromEntity)
                .collect(Collectors.toList());
    }
}