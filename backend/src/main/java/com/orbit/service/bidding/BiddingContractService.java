package com.orbit.service.bidding;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.repository.member.MemberRepository;
import org.springframework.stereotype.Service;

import com.orbit.dto.bidding.BiddingContractDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.member.Member;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BiddingContractService {
    private final BiddingContractRepository biddingContractRepository;
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository biddingParticipationRepository;
    private final MemberRepository memberRepository;

    /**
     * 계약 번호 생성
     * (예: CNT-YYYYMMDD-XXXX)
     */
    @Transactional
    private String generateTransactionNumber() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        
        // 해당 날짜의 최대 시퀀스 조회
        int maxSequence = biddingContractRepository.findMaxSequenceForDate("CNT-" + datePart + "%");
        
        // 시퀀스 증가
        int nextSequence = maxSequence + 1;
        
        // 4자리 숫자로 포맷팅
        String sequencePart = String.format("%04d", nextSequence);
        
        return "CNT-" + datePart + "-" + sequencePart;
    }

    /**
     * 계약 초안 생성
     * @param biddingId 입찰 ID
     * @param participationId 입찰 참여 ID
     * @param currentUserId 현재 사용자 ID
     * @return 생성된 계약 DTO
     */
    @Transactional
    public BiddingContractDto createContractDraft(Long biddingId, Long participationId, String currentUserId) {
        // 입찰 정보 조회
        Bidding bidding = biddingRepository.findById(biddingId)
            .orElseThrow(() -> new EntityNotFoundException("입찰 정보를 찾을 수 없습니다."));
        
        // 입찰 참여 정보 조회
        BiddingParticipation participation = biddingParticipationRepository.findById(participationId)
            .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다."));
        
        // 공급자 정보 조회
       // Member supplier = participation.getMember();
        
        // 현재 사용자 정보 조회 (구매자)
        Member currentUser = memberRepository.findByUsername(currentUserId)
            .orElseThrow(() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다."));

        // 계약 번호 생성
        String transactionNumber = generateTransactionNumber();

        // 계약 초안 생성
        BiddingContract contract = BiddingContract.builder()
            .transactionNumber(transactionNumber)
            .bidding(bidding)
            .biddingParticipation(participation)
            //.supplier(supplier)
            .startDate(bidding.getStartDate().toLocalDate())
            .endDate(bidding.getEndDate().toLocalDate())
            .quantity(bidding.getQuantity())
            .unitPrice(bidding.getBiddingPrice().getUnitPrice())
            .totalAmount(bidding.getBiddingPrice().getTotalAmount())
            .status(new SystemStatus("BIDDING_CONTRACT", "DRAFT"))
            .build();

        // 계약 저장
        BiddingContract savedContract = biddingContractRepository.save(contract);

        // DTO 변환 및 반환
        return BiddingContractDto.fromEntity(savedContract);
    }

    /**
     * 계약 상태를 진행중으로 변경
     * @param contractId 계약 ID
     * @param currentUserId 현재 사용자 ID
     * @return 업데이트된 계약 DTO
     */
    @Transactional
    public BiddingContractDto proceedContract(Long contractId, String currentUserId) {
        BiddingContract contract = biddingContractRepository.findById(contractId)
            .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다."));

        // 상태가 초안인 경우에만 진행 가능
        if (!contract.isDraft()) {
            throw new IllegalStateException("초안 상태의 계약만 진행할 수 있습니다.");
        }

        // 상태를 진행중으로 변경
        contract.setStatusEnum(BiddingContract.ContractStatus.진행중);

        // 저장 및 반환
        return BiddingContractDto.fromEntity(biddingContractRepository.save(contract));
    }

    /**
     * 구매자 서명
     * @param contractId 계약 ID
     * @param buyerSignature 구매자 서명
     * @param currentUserId 현재 사용자 ID
     * @return 업데이트된 계약 DTO
     */
    @Transactional
    public BiddingContractDto signByBuyer(Long contractId, String buyerSignature, String currentUserId) {
        BiddingContract contract = biddingContractRepository.findById(contractId)
            .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다."));

        // 진행중 상태에서만 서명 가능
        if (!contract.isInProgress()) {
            throw new IllegalStateException("진행중인 계약만 서명할 수 있습니다.");
        }

        // 구매자 서명 추가
        contract.setBuyerSignature(buyerSignature);

        // 서명 상태 확인 및 자동 변경
        contract.checkSignatureStatus();

        // 저장 및 반환
        return BiddingContractDto.fromEntity(biddingContractRepository.save(contract));
    }

    /**
     * 공급자 서명
     * @param contractId 계약 ID
     * @param supplierSignature 공급자 서명
     * @param currentUserId 현재 사용자 ID
     * @return 업데이트된 계약 DTO
     */
    @Transactional
    public BiddingContractDto signBySupplier(Long contractId, String supplierSignature, String currentUserId) {
        BiddingContract contract = biddingContractRepository.findById(contractId)
            .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다."));

        // 진행중 상태에서만 서명 가능
        if (!contract.isInProgress()) {
            throw new IllegalStateException("진행중인 계약만 서명할 수 있습니다.");
        }

        // 공급자 서명 추가
        contract.setSupplierSignature(supplierSignature);

        // 서명 상태 확인 및 자동 변경
        contract.checkSignatureStatus();

        // 저장 및 반환
        return BiddingContractDto.fromEntity(biddingContractRepository.save(contract));
    }

    /**
     * 계약 발주
     * @param contractId 계약 ID
     * @param currentUserId 현재 사용자 ID
     * @return 업데이트된 계약 DTO
     */
    @Transactional
    public BiddingContractDto placeOrder(Long contractId, String currentUserId) {
        BiddingContract contract = biddingContractRepository.findById(contractId)
            .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다."));

        // 완료 상태에서만 발주 가능
        if (!contract.isCompleted()) {
            throw new IllegalStateException("서명이 완료된 계약만 발주할 수 있습니다.");
        }

        // TODO: 실제 발주 로직 추가 (예: 재고 시스템, 물류 시스템 연동 등)

        return BiddingContractDto.fromEntity(contract);
    }

    /**
     * 계약 목록 조회
     * @param currentUserId 현재 사용자 ID
     * @return 계약 DTO 목록
     */
    public List<BiddingContractDto> getContractList(String currentUserId) {
        // TODO: 실제 비즈니스 로직에 맞게 구현 
        // 예: 사용자 권한에 따른 계약 목록 필터링
        List<BiddingContract> contracts = biddingContractRepository.findAll();
        
        return contracts.stream()
            .map(BiddingContractDto::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * 특정 계약 상세 조회
     * @param contractId 계약 ID
     * @param currentUserId 현재 사용자 ID
     * @return 계약 DTO
     */
    public BiddingContractDto getContractDetail(Long contractId, String currentUserId) {
        BiddingContract contract = biddingContractRepository.findById(contractId)
            .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다."));

        // TODO: 권한 검증 로직 추가 필요
        // 예: 해당 계약에 대한 접근 권한 확인

        return BiddingContractDto.fromEntity(contract);
    }
}