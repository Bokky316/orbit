package com.orbit.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.SimplifiedContractDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.Bidding.BidMethod;
import com.orbit.entity.bidding.Bidding.BiddingStatus;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.bidding.SimplifiedContract;
import com.orbit.entity.bidding.SimplifiedContract.ContractStatus;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.SimplifiedContractRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BiddingService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingEvaluationRepository evaluationRepository;
    private final SimplifiedContractRepository contractRepository;

    // 입찰 공고 목록 조회
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingList(Map<String, Object> params) {
        BiddingStatus status = params.get("status") != null ? (BiddingStatus) params.get("status") : null;
        LocalDateTime startDate = params.get("startDate") != null ? (LocalDateTime) params.get("startDate") : null;
        LocalDateTime endDate = params.get("endDate") != null ? (LocalDateTime) params.get("endDate") : null;
        
        List<Bidding> biddings = biddingRepository.findBiddingsByFilter(status, startDate, endDate);
        
        return biddings.stream()
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 입찰 공고 상세 조회
    @Transactional(readOnly = true)
    public BiddingDto getBiddingById(Long id) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        return BiddingDto.fromEntity(bidding);
    }

    // 입찰 공고 생성
    @Transactional
    public BiddingDto createBidding(BiddingDto biddingDto) {
        // 입찰 번호 생성 (예: BID-년도-일련번호)
        String bidNumber = "BID-" + LocalDateTime.now().getYear() + "-" 
                         + String.format("%04d", biddingRepository.count() + 1);
        biddingDto.setBidNumber(bidNumber);
        
        // 가격제안 방식일 경우 금액 계산
        if (biddingDto.getBidMethod() == BidMethod.가격제안) {
            calculateBiddingPrices(biddingDto);
        }
        
        Bidding bidding = biddingDto.toEntity();
        bidding = biddingRepository.save(bidding);
        
        return BiddingDto.fromEntity(bidding);
    }
    
    // 입찰 공고 수정
    @Transactional
    public BiddingDto updateBidding(Long id, BiddingDto biddingDto) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        bidding.setTitle(biddingDto.getTitle());
        bidding.setDescription(biddingDto.getDescription());
        bidding.setBidMethod(biddingDto.getBidMethod());
        bidding.setStartDate(biddingDto.getStartDate());
        bidding.setEndDate(biddingDto.getEndDate());
        bidding.setConditions(biddingDto.getConditions());
        bidding.setInternalNote(biddingDto.getInternalNote());
        
        if (biddingDto.getBidMethod() == BidMethod.가격제안) {
            calculateBiddingPrices(biddingDto);
            bidding.setBiddingUnitPrice(biddingDto.getBiddingUnitPrice());
            bidding.setBiddingSupplyPrice(biddingDto.getBiddingSupplyPrice());
            bidding.setBiddingVat(biddingDto.getBiddingVat());
        }
        
        bidding = biddingRepository.save(bidding);
        
        return BiddingDto.fromEntity(bidding);
    }
    
    // 입찰 공고 삭제
    @Transactional
    public void deleteBidding(Long id) {
        if (!biddingRepository.existsById(id)) {
            throw new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id);
        }
        
        biddingRepository.deleteById(id);
    }

    // 가격제안 방식 금액 계산 메서드
    private void calculateBiddingPrices(BiddingDto bidding) {
        BigDecimal unitPrice = bidding.getBiddingUnitPrice();
        Integer quantity = bidding.getQuantity();

        if (unitPrice != null && quantity != null) {
            // 공급가액 계산 (단가 * 수량)
            BigDecimal supplyPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
            bidding.setBiddingSupplyPrice(supplyPrice);

            // 부가세 계산 (공급가액의 10%)
            BigDecimal vat = supplyPrice.multiply(BigDecimal.valueOf(0.1))
                    .setScale(2, RoundingMode.HALF_UP);
            bidding.setBiddingVat(vat);
        }
    }

    // 입찰 참여
    @Transactional
    public BiddingParticipationDto participateInBidding(BiddingParticipationDto participationDto) {
        // 입찰 참여 검증
        validateBiddingParticipation(participationDto);
        
        Bidding bidding = biddingRepository.findById(participationDto.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participationDto.getBiddingId()));
        
        BiddingParticipation participation = participationDto.toEntity();
        participation.setBidding(bidding);
        
        // 가격제안 방식 검증
        if (bidding.getBidMethod() == BidMethod.가격제안) {
            validatePriceProposal(bidding, participation);
        }
        
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }
    
    // 입찰 참여 목록 조회
    @Transactional(readOnly = true)
    public List<BiddingParticipationDto> getBiddingParticipations(Long biddingId) {
        List<BiddingParticipation> participations = participationRepository.findByBiddingId(biddingId);
        
        return participations.stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 입찰 참여 상세 조회
    @Transactional(readOnly = true)
    public BiddingParticipationDto getParticipationById(Long id) {
        BiddingParticipation participation = participationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + id));
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    // 입찰 참여 검증
    private void validateBiddingParticipation(BiddingParticipationDto participation) {
        Bidding bidding = biddingRepository.findById(participation.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participation.getBiddingId()));
        
        // 이미 마감된 입찰인지 확인
        if (bidding.getStatus() == BiddingStatus.마감 || bidding.getStatus() == BiddingStatus.취소) {
            throw new IllegalStateException("이미 마감되었거나 취소된 입찰입니다.");
        }
        
        // 마감일이 지났는지 확인
        if (LocalDateTime.now().isAfter(bidding.getEndDate())) {
            throw new IllegalStateException("입찰 마감일이 지났습니다.");
        }
        
        // 이미 참여한 공급자인지 확인
        if (participationRepository.existsByBiddingIdAndSupplierId(
                participation.getBiddingId(), participation.getSupplierId())) {
            throw new IllegalStateException("이미 참여한 입찰입니다.");
        }
    }

    // 가격제안 방식 검증
    private void validatePriceProposal(Bidding bidding, BiddingParticipation participation) {
        BigDecimal proposedPrice = participation.getProposedPrice();
        BigDecimal minimumPrice = bidding.getBiddingUnitPrice(); // 최소 입찰가

        if (proposedPrice.compareTo(minimumPrice) < 0) {
            throw new IllegalArgumentException("제안 가격이 최소 입찰가보다 낮습니다.");
        }

        // 공급가액, 부가세 계산
        participation.setSupplyPrice(proposedPrice);
        participation.setVat(proposedPrice.multiply(BigDecimal.valueOf(0.1))
                .setScale(2, RoundingMode.HALF_UP));
    }

    // 입찰 평가
    @Transactional
public BiddingEvaluationDto evaluateBidding(BiddingEvaluationDto evaluationDto) {
    BiddingParticipation participation = participationRepository.findById(evaluationDto.getBiddingParticipationId())
            .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + evaluationDto.getBiddingParticipationId()));
    
    // 평가 점수 계산
    int totalScore = calculateEvaluationScore(evaluationDto);
    evaluationDto.setTotalScore(totalScore);
    
    BiddingEvaluation evaluation = evaluationDto.toEntity();
    // 변경: setParticipation 대신 ID 설정
    evaluation.setBiddingParticipationId(evaluationDto.getBiddingParticipationId());
    
    evaluation = evaluationRepository.save(evaluation);
    
    return BiddingEvaluationDto.fromEntity(evaluation);
}
    
    // 입찰 평가 목록 조회
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getBiddingEvaluations(Long participationId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingParticipationId(participationId);
        
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 입찰별 평가 목록 조회
   @Transactional(readOnly = true)
public List<BiddingEvaluationDto> getEvaluationsByBiddingId(Long biddingId) {
    // 1. 해당 입찰에 참여한 모든 참여 ID 조회
    List<Long> participationIds = participationRepository.findByBiddingId(biddingId)
            .stream()
            .map(BiddingParticipation::getId)
            .collect(Collectors.toList());
    
    // 2. 참여 ID로 평가 조회
    List<BiddingEvaluation> evaluations = new ArrayList<>();
    if (!participationIds.isEmpty()) {
        evaluations = evaluationRepository.findByBiddingParticipationIdInOrderByTotalScoreDesc(participationIds);
    }
    
    // 3. DTO 변환 및 반환
    return evaluations.stream()
            .map(BiddingEvaluationDto::fromEntity)
            .collect(Collectors.toList());
}

    // 평가 점수 계산
    private int calculateEvaluationScore(BiddingEvaluationDto evaluation) {
        return (evaluation.getPriceScore() +
                evaluation.getQualityScore() +
                evaluation.getDeliveryScore() +
                evaluation.getReliabilityScore()) / 4;
    }
    
    // 낙찰자 선정
    @Transactional(readOnly = true)
    public BiddingEvaluationDto selectWinningBid(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findTopByBiddingIdOrderByTotalScoreDesc(biddingId);
        
        if (evaluations.isEmpty()) {
            return null;
        }
        
        return BiddingEvaluationDto.fromEntity(evaluations.get(0));
    }

    // 계약 생성
    @Transactional
public SimplifiedContractDto createContract(SimplifiedContractDto contractDto) {
    // 낙찰자 선정
    BiddingEvaluationDto winningBid = selectWinningBid(contractDto.getBiddingId());

    if (winningBid == null) {
        throw new IllegalStateException("낙찰자가 선정되지 않았습니다.");
    }
    
    Bidding bidding = biddingRepository.findById(contractDto.getBiddingId())
            .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + contractDto.getBiddingId()));
    
    BiddingParticipation participation = participationRepository.findById(winningBid.getBiddingParticipationId())
            .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + winningBid.getBiddingParticipationId()));
    
    // 계약 정보 설정
    contractDto.setBiddingParticipationId(winningBid.getBiddingParticipationId());
    contractDto.setSupplierId(participation.getSupplierId());
    
    if (contractDto.getTransactionNumber() == null) {
        contractDto.setTransactionNumber("CT-" + LocalDateTime.now().getYear() + "-" 
                + String.format("%04d", contractRepository.count() + 1));
    }
    
    if (contractDto.getStatus() == null) {
        contractDto.setStatus(ContractStatus.초안);
    }
    
    // 계약 생성
    SimplifiedContract contract = contractDto.toEntity();
    // 변경: 객체 참조 대신 ID 설정
    contract.setBiddingId(contractDto.getBiddingId());
    contract.setBiddingParticipationId(contractDto.getBiddingParticipationId());
    
    contract = contractRepository.save(contract);
    
    // 입찰 상태 변경
    bidding.setStatus(BiddingStatus.마감);
    biddingRepository.save(bidding);
    
    return SimplifiedContractDto.fromEntity(contract);
}
    
    // 계약 목록 조회
    @Transactional(readOnly = true)
    public List<SimplifiedContractDto> getContractList(Map<String, Object> params) {
        List<SimplifiedContract> contracts;
        
        // 입찰 ID로 필터링
        if (params.containsKey("biddingId")) {
            Long biddingId = (Long) params.get("biddingId");
            contracts = contractRepository.findByBiddingId(biddingId);
        } 
        // 상태로 필터링
        else if (params.containsKey("status")) {
            ContractStatus status = (ContractStatus) params.get("status");
            contracts = contractRepository.findByStatus(status);
        } 
        // 전체 조회
        else {
            contracts = contractRepository.findAll();
        }
        
        return contracts.stream()
                .map(SimplifiedContractDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 계약 상세 조회
    @Transactional(readOnly = true)
    public SimplifiedContractDto getContractById(Long id) {
        SimplifiedContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다. ID: " + id));
        
        return SimplifiedContractDto.fromEntity(contract);
    }
    
    // 계약 상태 업데이트
    @Transactional
    public SimplifiedContractDto updateContractStatus(Long id, ContractStatus status) {
        SimplifiedContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다. ID: " + id));
        
        contract.setStatus(status);
        contract = contractRepository.save(contract);
        
        return SimplifiedContractDto.fromEntity(contract);
    }
}