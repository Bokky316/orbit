package com.orbit.service.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingFormDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.Bidding.BiddingStatus;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.SystemStatus;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.util.PriceCalculator;
import com.orbit.util.PriceCalculator.PriceResult;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingEvaluationRepository evaluationRepository;
    private final BiddingContractRepository contractRepository;
    private final BiddingEvaluationService evaluationService;


// @Value("${fuploadPath}")
//     private String uploadPath;

    @Transactional(readOnly = true)
    public List<String> getBiddingStatusHistoryReasons(Long biddingId) {
        List<StatusHistory> histories = biddingRepository.findStatusHistoriesByBiddingId(biddingId);
        return histories.stream()
                .map(StatusHistory::getReason)
                .filter(reason -> reason != null)
                .collect(Collectors.toList());
    }




    /**
     * 파일 다운로드를 위한 리소스 조회
     * @param filename 다운로드할 파일명
     * @return 파일 리소스
     * @throws Exception 파일 조회 중 예외
     */
    // public Resource loadFileAsResource(String filename) throws Exception {
    //     try {
    //         Path filePath = Paths.get(uploadPath).resolve(filename).normalize();
    //         Resource resource = new UrlResource(filePath.toUri());
            
    //         if (resource.exists() && resource.isReadable()) {
    //             return resource;
    //         } else {
    //             throw new RuntimeException("파일을 읽을 수 없습니다: " + filename);
    //         }
    //     } catch (MalformedURLException ex) {
    //         throw new RuntimeException("파일 경로 오류: " + filename, ex);
    //     }
    // }

    /**
     * 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingList(Map<String, Object> params) {
        String statusCode = params.get("status") != null ? (String) params.get("status") : null;
        LocalDateTime startDate = params.get("startDate") != null ? (LocalDateTime) params.get("startDate") : null;
        LocalDateTime endDate = params.get("endDate") != null ? (LocalDateTime) params.get("endDate") : null;
        
        List<Bidding> biddings;
        
        if (statusCode != null) {
            // 상태 코드로 필터링
            SystemStatus status = new SystemStatus("BIDDING", statusCode);
            biddings = biddingRepository.findBiddingsByFilter(status, startDate, endDate);
        } else {
            biddings = biddingRepository.findBiddingsByDateRange(startDate, endDate);
        }
        
        return biddings.stream()
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 입찰 공고 상세 조회
     */
    @Transactional(readOnly = true)
    public BiddingDto getBiddingById(Long id) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        return BiddingDto.fromEntity(bidding);
    }

    /**
 * 입찰 번호 생성
 * (예: BID-YYYYMMDD-XXXX)
 */
private String generateBidNumber() {
    LocalDateTime now = LocalDateTime.now();
    String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    String randomPart = String.format("%04d", (int)(Math.random() * 10000));
    return "BID-" + datePart + "-" + randomPart;
}

/**
 * 입찰 공고 생성
 */
    @Transactional
    public BiddingDto createBidding(BiddingFormDto formDto) {
        // 입찰 번호 생성
        String bidNumber = generateBidNumber();
        
        // 입찰 공고 엔티티 생성
        Bidding bidding = formDto.toEntity();
        
        // 입찰 번호 설정
        bidding.setBidNumber(bidNumber);
        
        // 가격 재계산
        bidding.recalculatePrices();
        
        // 다중 공급자 정보 처리
        if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
            bidding.setDescription("공급자 ID: " + String.join(", ", 
                formDto.getSupplierIds().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList())));
        }

        // if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
        //     List<Supplier> suppliers = supplierRepository.findAllById(formDto.getSupplierIds());
            
        //     // 공급자 정보를 companyName으로 설정
        //     bidding.setCompanyName(
        //         suppliers.stream()
        //             .map(Supplier::getCompanyName)
        //             .collect(Collectors.joining(", "))
        //     );
            
        //     // 공급자-입찰 관계 설정
        //     suppliers.forEach(bidding::addSupplier);
        // }
        
        // 엔티티 저장
        bidding = biddingRepository.save(bidding);
        
        // 상태 이력 추가
        StatusHistory history = StatusHistory.builder()
                .fromStatus(null)
                .toStatus(bidding.getStatus())
                .entityType(StatusHistory.EntityType.BIDDING)
                .changedAt(LocalDateTime.now())
                .bidding(bidding)
                .build();
        bidding.addStatusHistory(history);
        
        return BiddingDto.fromEntity(bidding);
    }
    /**
     * 입찰 공고 수정
     */
    @Transactional
    public BiddingDto updateBidding(Long id, BiddingFormDto formDto) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        // 이전 상태 저장 (상태 변경 이력 추적용)
        SystemStatus oldStatus = bidding.getStatus();
        
        // 업데이트할 엔티티 생성
        Bidding updatedBidding = formDto.toEntity();
        updatedBidding.setId(id);
        updatedBidding.setBidNumber(bidding.getBidNumber()); // 기존 번호 유지
        
        // 상태 변경 감지
        boolean statusChanged = (oldStatus != null && updatedBidding.getStatus() != null 
                && !oldStatus.getChildCode().equals(updatedBidding.getStatus().getChildCode()));
        
        // 가격 재계산
        updatedBidding.recalculatePrices();
        
        // 엔티티 저장
        updatedBidding = biddingRepository.save(updatedBidding);
        
        // 상태 변경 이력 추가
        if (statusChanged) {
            StatusHistory history = StatusHistory.builder()
                    .fromStatus(oldStatus)
                    .toStatus(updatedBidding.getStatus())
                    .entityType(StatusHistory.EntityType.BIDDING)
                    .changedAt(LocalDateTime.now())
                    .bidding(updatedBidding)
                    .build();
            updatedBidding.addStatusHistory(history);
        }
        
        return BiddingDto.fromEntity(updatedBidding);
    }
    
    /**
     * 입찰 공고 삭제
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
     */
    @Transactional
    public BiddingParticipationDto participateInBidding(BiddingParticipationDto participationDto) {
        // 입찰 참여 검증
        validateBiddingParticipation(participationDto);
        
        Bidding bidding = biddingRepository.findById(participationDto.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participationDto.getBiddingId()));
        
        BiddingParticipation participation = participationDto.toEntity();
        
        // 참여 정보 설정
        participation.setSubmittedAt(LocalDateTime.now());
        
        // 가격 계산
        calculateParticipationPrices(participation, bidding.getQuantity());
        
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }
    
    /**
     * 입찰 참여 목록 조회
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
     */
    @Transactional(readOnly = true)
    public BiddingParticipationDto getParticipationById(Long id) {
        BiddingParticipation participation = participationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + id));
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 입찰 상태 변경
     */
    @Transactional
    public BiddingDto changeBiddingStatus(Long id, String status, String reason) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        // 이전 상태 저장
        SystemStatus oldStatus = bidding.getStatus();
        
        // 새 상태 설정
        SystemStatus newStatus = new SystemStatus("BIDDING", status);
        bidding.setStatus(newStatus);
        
        // 상태 이력 추가
        StatusHistory history = StatusHistory.builder()
                .fromStatus(oldStatus)
                .toStatus(newStatus)
                .entityType(StatusHistory.EntityType.BIDDING)
                .changedAt(LocalDateTime.now())
                .bidding(bidding)
                .reason(reason)  // reason 추가
                .build();
        
        bidding.addStatusHistory(history);
        
        return BiddingDto.fromEntity(bidding);
    }

    /**
     * 상태 변경 이력 조회
     */
    @Transactional(readOnly = true)
    public List<StatusHistory> getBiddingStatusHistories(Long biddingId) {
        return biddingRepository.findStatusHistoriesByBiddingId(biddingId);
    }

    /**
     * 입찰 참여 검증
     */
    private void validateBiddingParticipation(BiddingParticipationDto participation) {
        Bidding bidding = biddingRepository.findById(participation.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participation.getBiddingId()));
        
        // 이미 마감된 입찰인지 확인
        BiddingStatus status = bidding.getStatusEnum();
        if (status == BiddingStatus.마감 || status == BiddingStatus.취소) {
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
     * 입찰 참여 금액 계산
     */
    private void calculateParticipationPrices(BiddingParticipation participation, Integer quantity) {
        BigDecimal unitPrice = participation.getUnitPrice();
        Integer actualQuantity = quantity != null ? quantity : 1;
        
        if (unitPrice != null) {
            PriceResult result = PriceCalculator.calculateAll(unitPrice, actualQuantity);
            
            participation.setSupplyPrice(result.getSupplyPrice());
            participation.setVat(result.getVat());
            participation.setTotalAmount(result.getTotalAmount());
        }
    }

    /**
     * 낙찰자 선정 (최고 점수 기준)
     */
    @Transactional
    public BiddingEvaluationDto selectWinningBidder(Long biddingId) {
        // 해당 입찰의 모든 평가 중 최고 점수 평가 조회
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingId(biddingId);
        
        // 최고 점수 평가 찾기
        BiddingEvaluation highestScoringEvaluation = evaluations.stream()
                .max((e1, e2) -> {
                    // null 처리 및 점수 비교
                    Integer score1 = e1.getTotalScore() != null ? e1.getTotalScore() : 0;
                    Integer score2 = e2.getTotalScore() != null ? e2.getTotalScore() : 0;
                    return score1.compareTo(score2);
                })
                .orElseThrow(() -> new EntityNotFoundException("해당 입찰의 평가 정보를 찾을 수 없습니다. ID: " + biddingId));
        
        // 기존 낙찰자 초기화
        List<BiddingEvaluation> previousWinners = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        previousWinners.forEach(BiddingEvaluation::cancelSelectedBidder);
        evaluationRepository.saveAll(previousWinners);
        
        // 새 낙찰자 선정
        highestScoringEvaluation.selectAsBidder();
        highestScoringEvaluation = evaluationRepository.save(highestScoringEvaluation);
        
        return BiddingEvaluationDto.fromEntity(highestScoringEvaluation);
    }

    /**
     * 발주 선정
     */
    // @Transactional
    // public BiddingEvaluationDto selectForOrder(Long evaluationId) {
    //     BiddingEvaluation evaluation = evaluationRepository.findById(evaluationId)
    //             .orElseThrow(() -> new EntityNotFoundException("평가 정보를 찾을 수 없습니다. ID: " + evaluationId));
        
    //     // 기존 발주 선정 초기화
    //     List<BiddingEvaluation> previousOrders = evaluationRepository.findByBiddingIdAndSelectedForOrderTrue(evaluation.getBiddingId());
    //     previousOrders.forEach(BiddingEvaluation::cancelOrderSelection);
    //     evaluationRepository.saveAll(previousOrders);
        
    //     // 새 발주 선정
    //     evaluation.selectForOrder();
    //     evaluation = evaluationRepository.save(evaluation);
        
    //     return BiddingEvaluationDto.fromEntity(evaluation);
    // }

    /**
     * 입찰 공고별 낙찰자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getWinningBidders(Long biddingId) {
        List<BiddingEvaluation> winningBidders = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        
        return winningBidders.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 입찰 공고별 발주 선정 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getOrderedBidders(Long biddingId) {
        List<BiddingEvaluation> orderedBidders = evaluationRepository.findByBiddingIdAndSelectedForOrderTrue(biddingId);
        
        return orderedBidders.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 공급자 참여 의사 확인
     */
    @Transactional
    public BiddingParticipationDto confirmSupplierParticipation(Long participationId) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.confirmParticipation();
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 단일 낙찰자 선정 (최고 점수 기준)
     */
    @Transactional(readOnly = true)
    public BiddingEvaluationDto selectWinningBid(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findTopByBiddingIdOrderByTotalScoreDesc(biddingId);
        
        if (evaluations.isEmpty()) {
            return null;
        }
        
        return BiddingEvaluationDto.fromEntity(evaluations.get(0));
    }
}