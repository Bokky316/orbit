package com.orbit.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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
import com.orbit.util.PriceCalculator;
import com.orbit.util.PriceCalculator.PriceResult;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 관련 비즈니스 로직을 처리하는 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingEvaluationRepository evaluationRepository;
    private final SimplifiedContractRepository contractRepository;

    /**
     * 입찰 공고 금액 계산 - PriceCalculator 유틸리티를 사용하여 계산
     * 
     * @param biddingDto 입찰 공고 DTO
     */
    private void calculateBiddingPrices(BiddingDto biddingDto) {
        BigDecimal unitPrice = biddingDto.getUnitPrice();
        Integer quantity = biddingDto.getQuantity();
        
        if (unitPrice != null && quantity != null) {
            PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
            
            biddingDto.setSupplyPrice(result.getSupplyPrice());
            biddingDto.setVat(result.getVat());
            biddingDto.setTotalAmount(result.getTotalAmount());
        }
    }

    /**
     * 입찰 참여 금액 계산 - PriceCalculator 유틸리티를 사용하여 계산
     * 
     * @param participation 입찰 참여 엔티티
     */
    private void calculateParticipationPrices(BiddingParticipation participation) {
        BigDecimal unitPrice = participation.getUnitPrice();
        Integer quantity = participation.getQuantity() != null ? participation.getQuantity() : 1;
        
        if (unitPrice != null) {
            PriceResult result = PriceCalculator.calculateAll(unitPrice, quantity);
            
            participation.setSupplyPrice(result.getSupplyPrice());
            participation.setVat(result.getVat());
            
            try {
                // totalAmount 필드가 있는 경우
                participation.setTotalAmount(result.getTotalAmount());
            } catch (Exception e) {
                // 로그만 남기고 계속 진행
                log.warn("totalAmount 필드를 설정할 수 없습니다: {}", e.getMessage());
            }
        }
    }

    /**
     * 입찰 공고 목록 조회
     * 
     * @param params 필터링 파라미터 (status, startDate, endDate)
     * @return 입찰 공고 DTO 목록
     */
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
    
    /**
     * 입찰 공고 상세 조회
     * 
     * @param id 입찰 공고 ID
     * @return 입찰 공고 DTO
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public BiddingDto getBiddingById(Long id) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        return BiddingDto.fromEntity(bidding);
    }

    /**
     * 입찰 공고 생성
     * 
     * @param biddingDto 입찰 공고 DTO
     * @return 생성된 입찰 공고 DTO
     */
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
    
    /**
     * 입찰 공고 수정
     * 
     * @param id 입찰 공고 ID
     * @param biddingDto 수정할 입찰 공고 정보
     * @return 수정된 입찰 공고 DTO
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
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
            bidding.setUnitPrice(biddingDto.getUnitPrice());
            bidding.setSupplyPrice(biddingDto.getSupplyPrice());
            bidding.setVat(biddingDto.getVat());
            bidding.setTotalAmount(biddingDto.getTotalAmount());
        }
        
        bidding = biddingRepository.save(bidding);
        
        return BiddingDto.fromEntity(bidding);
    }
    
    /**
     * 입찰 공고 삭제
     * 
     * @param id 입찰 공고 ID
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
    @Transactional
    public void deleteBidding(Long id) {
        if (!biddingRepository.existsById(id)) {
            throw new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id);
        }
        
        biddingRepository.deleteById(id);
    }

    /**
     * 입찰 참여
     * 
     * @param participationDto 입찰 참여 DTO
     * @return 생성된 입찰 참여 DTO
     */
    @Transactional
    public BiddingParticipationDto participateInBidding(BiddingParticipationDto participationDto) {
        // 입찰 참여 검증
        validateBiddingParticipation(participationDto);
        
        Bidding bidding = biddingRepository.findById(participationDto.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participationDto.getBiddingId()));
        
        BiddingParticipation participation = participationDto.toEntity();
        
        // 가격제안 방식 검증 및 금액 계산
        if (bidding.getBidMethod() == BidMethod.가격제안) {
            calculateParticipationPrices(participation);
        }
        
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }
    
    /**
     * 입찰 참여 목록 조회
     * 
     * @param biddingId 입찰 공고 ID
     * @return 입찰 참여 DTO 목록
     */
    @Transactional(readOnly = true)
    public List<BiddingParticipationDto> getBiddingParticipations(Long biddingId) {
        List<BiddingParticipation> participations = participationRepository.findByBiddingId(biddingId);
        
        return participations.stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 입찰 참여 상세 조회
     * 
     * @param id 입찰 참여 ID
     * @return 입찰 참여 DTO
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public BiddingParticipationDto getParticipationById(Long id) {
        BiddingParticipation participation = participationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + id));
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 입찰 참여 검증
     * 
     * @param participation 입찰 참여 DTO
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     * @throws IllegalStateException 입찰 참여가 유효하지 않은 경우
     */
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

    /**
     * 입찰 평가
     * 
     * @param evaluationDto 입찰 평가 DTO
     * @return 생성된 입찰 평가 DTO
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
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
    
    /**
     * 입찰 평가 목록 조회
     * 
     * @param participationId 입찰 참여 ID
     * @return 입찰 평가 DTO 목록
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getBiddingEvaluations(Long participationId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingParticipationId(participationId);
        
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 입찰별 평가 목록 조회
     * 
     * @param biddingId 입찰 공고 ID
     * @return 입찰 평가 DTO 목록
     */
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

    /**
     * 평가 점수 계산
     * 
     * @param evaluation 입찰 평가 DTO
     * @return 계산된 총점
     */
    private int calculateEvaluationScore(BiddingEvaluationDto evaluation) {
        return (evaluation.getPriceScore() +
                evaluation.getQualityScore() +
                evaluation.getDeliveryScore() +
                evaluation.getReliabilityScore()) / 4;
    }
    
    /**
     * 낙찰자 선정
     * 
     * @param biddingId 입찰 공고 ID
     * @return 선정된 낙찰자의 평가 DTO (없으면 null)
     */
    @Transactional(readOnly = true)
    public BiddingEvaluationDto selectWinningBid(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findTopByBiddingIdOrderByTotalScoreDesc(biddingId);
        
        if (evaluations.isEmpty()) {
            return null;
        }
        
        return BiddingEvaluationDto.fromEntity(evaluations.get(0));
    }

    /**
     * 계약 생성
     * 
     * @param contractDto 계약 DTO
     * @return 생성된 계약 DTO
     * @throws IllegalStateException 낙찰자가 선정되지 않은 경우
     * @throws EntityNotFoundException 입찰 공고 또는 입찰 참여 정보를 찾을 수 없는 경우
     */
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
    
    /**
     * 계약 목록 조회
     * 
     * @param params 필터링 파라미터 (biddingId, status)
     * @return 계약 DTO 목록
     */
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
    
    /**
     * 계약 상세 조회
     * 
     * @param id 계약 ID
     * @return 계약 DTO
     * @throws EntityNotFoundException 계약 정보를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public SimplifiedContractDto getContractById(Long id) {
        SimplifiedContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다. ID: " + id));
        
        return SimplifiedContractDto.fromEntity(contract);
    }
    
    /**
     * 계약 상태 업데이트
     * 
     * @param id 계약 ID
     * @param status 새 계약 상태
     * @return 업데이트된 계약 DTO
     * @throws EntityNotFoundException 계약 정보를 찾을 수 없는 경우
     */
    @Transactional
    public SimplifiedContractDto updateContractStatus(Long id, ContractStatus status) {
        SimplifiedContract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("계약 정보를 찾을 수 없습니다. ID: " + id));
        
        contract.setStatus(status);
        contract = contractRepository.save(contract);
        
        return SimplifiedContractDto.fromEntity(contract);
    }

    /**
     * 총금액 다시 계산하기 - 외부로부터 총금액 전달받는 경우의 검증 메서드
     * 
     * @param participationId 입찰 참여 ID
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
    @Transactional
    public void recalculateTotalAmount(Long participationId) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 공급가액과 부가세로 총액 다시 계산
        BigDecimal supplyPrice = participation.getSupplyPrice();
        BigDecimal vat = participation.getVat();
        
        if (supplyPrice != null) {
            // 부가세가 없으면 계산
            if (vat == null) {
                vat = PriceCalculator.calculateVat(supplyPrice);
                participation.setVat(vat);
            }
            
            // 총액 계산
            BigDecimal totalAmount = PriceCalculator.calculateTotalAmount(supplyPrice, vat);
            participation.setTotalAmount(totalAmount);
            
            participationRepository.save(participation);
        }
    }
    
    /**
     * 외부에서 총금액을 직접 설정할 경우 (예: DB에서 가져온 데이터)
     * 
     * @param participationId 입찰 참여 ID
     * @param totalAmount 설정할 총금액
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
    @Transactional
    public void updateParticipationTotalAmount(Long participationId, BigDecimal totalAmount) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.setTotalAmount(totalAmount);
        participationRepository.save(participation);
    }
    
    /**
     * 테이블 간 금액 복사 (예: 입찰 참여 → 계약)
     * 
     * @param participationId 입찰 참여 ID
     * @param contract 계약 엔티티
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
    @Transactional
    public void copyPricesFromParticipationToContract(Long participationId, SimplifiedContract contract) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 금액 관련 필드 복사
        contract.setQuantity(participation.getQuantity());
        contract.setUnitPrice(participation.getUnitPrice());
        contract.setSupplyPrice(participation.getSupplyPrice());
        contract.setVat(participation.getVat());
        contract.setTotalAmount(participation.getTotalAmount());
    }
    
    /**
     * 다양한 소스에서 금액 정보 가져오기 (통합 조회 메서드)
     * 
     * @param biddingId 입찰 공고 ID
     * @return 모든 금액 정보를 담은 맵
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getAllPriceInfo(Long biddingId) {
        Map<String, BigDecimal> priceInfo = new HashMap<>();
        
        // 입찰 정보
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        priceInfo.put("biddingUnitPrice", bidding.getUnitPrice());
        priceInfo.put("biddingSupplyPrice", bidding.getSupplyPrice());
        priceInfo.put("biddingVat", bidding.getVat());
        priceInfo.put("biddingTotalAmount", bidding.getTotalAmount());
        
        // 참여 정보 (낙찰자)
        List<BiddingParticipation> participations = participationRepository.findByBiddingId(biddingId);
        if (!participations.isEmpty()) {
            BiddingParticipation winner = participations.stream()
                    .max(Comparator.comparing(p -> evaluationRepository.findByBiddingParticipationId(p.getId())
                            .stream()
                            .mapToInt(BiddingEvaluation::getTotalScore)
                            .max()
                            .orElse(0)))
                    .orElse(null);
            
            if (winner != null) {
                priceInfo.put("participationUnitPrice", winner.getUnitPrice());
                priceInfo.put("participationSupplyPrice", winner.getSupplyPrice());
                priceInfo.put("participationVat", winner.getVat());
                priceInfo.put("participationTotalAmount", winner.getTotalAmount());
            }
        }
        
        // 계약 정보
        List<SimplifiedContract> contracts = contractRepository.findByBiddingId(biddingId);
        if (!contracts.isEmpty()) {
            SimplifiedContract contract = contracts.get(0);
            priceInfo.put("contractUnitPrice", contract.getUnitPrice());
            priceInfo.put("contractSupplyPrice", contract.getSupplyPrice());
            priceInfo.put("contractVat", contract.getVat());
            priceInfo.put("contractTotalAmount", contract.getTotalAmount());
        }
        
        return priceInfo;
    }
}