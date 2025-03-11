package com.orbit.service.bidding;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.member.MemberRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingEvaluationService {
    private final BiddingEvaluationRepository evaluationRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingRepository biddingRepository;
    private final MemberRepository memberRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getEvaluationsBySupplierName(String supplierName) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findBySupplierName(supplierName);
        
        return evaluations.stream()
            .map(BiddingEvaluationDto::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * 전체 평가 목록 조회
     */
    public List<BiddingEvaluationDto> getAllEvaluations() {
        List<BiddingEvaluation> evaluations = evaluationRepository.findAll();
        return evaluations.stream()
                        .map(this::convertToDto)
                        .collect(Collectors.toList());
    }
    
    // DTO 변환 메서드
    private BiddingEvaluationDto convertToDto(BiddingEvaluation evaluation) {
        BiddingEvaluationDto dto = new BiddingEvaluationDto();
        dto.setId(evaluation.getId());
        dto.setBiddingParticipationId(evaluation.getBiddingParticipationId());
        dto.setBiddingId(evaluation.getBiddingId());
        dto.setEvaluatorId(evaluation.getEvaluatorId());
        dto.setSupplierName(evaluation.getSupplierName());
        dto.setPriceScore(evaluation.getPriceScore());
        dto.setQualityScore(evaluation.getQualityScore());
        dto.setDeliveryScore(evaluation.getDeliveryScore());
        dto.setReliabilityScore(evaluation.getReliabilityScore());
        dto.setComments(evaluation.getComments());
        dto.setSelectedBidder(evaluation.isSelectedBidder());
        dto.setSelectedForOrder(evaluation.isSelectedForOrder());
        dto.setEvaluatedAt(evaluation.getEvaluatedAt());
        
        // 총점 계산 
        int totalScore = (evaluation.getPriceScore() + 
                        evaluation.getQualityScore() + 
                        evaluation.getDeliveryScore() + 
                        evaluation.getReliabilityScore()) / 4;
        dto.setTotalScore(totalScore);
        
        return dto;
    }

    /**
     * 입찰 평가 생성
     */
    @Transactional
    public BiddingEvaluationDto createEvaluation(BiddingEvaluationDto evaluationDto) {
        // 입찰 참여 존재 여부 확인
        BiddingParticipation participation = participationRepository.findById(evaluationDto.getBiddingParticipationId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + evaluationDto.getBiddingParticipationId()));
        
        // BiddingId 설정 (참여 정보에서 가져옴)
        evaluationDto.setBiddingId(participation.getBiddingId());
        
        // 평가일시 설정
        LocalDateTime evaluatedAt = Optional.ofNullable(evaluationDto.getEvaluatedAt())
                .orElse(LocalDateTime.now());
        evaluationDto.setEvaluatedAt(evaluatedAt);
        
        // 엔티티 변환 및 저장
        BiddingEvaluation evaluation = evaluationDto.toEntity();
        evaluation = evaluationRepository.save(evaluation);
        
        // 참여 정보 업데이트 (평가 완료 표시)
        participation.updateEvaluationStatus(true);
        participation.updateEvaluationScore(evaluation.getTotalScore());
        participationRepository.save(participation);
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }

    /**
     * 입찰별 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getEvaluationsByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingId(biddingId);
        
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 입찰 참여별 평가 조회
     */
    @Transactional(readOnly = true)
    public BiddingEvaluationDto getEvaluationByParticipationId(Long participationId) {
        BiddingEvaluation evaluation = evaluationRepository.findByBiddingParticipationId(participationId)
                .orElseThrow(() -> new EntityNotFoundException("해당 입찰 참여에 대한 평가를 찾을 수 없습니다. 참여 ID: " + participationId));
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }
    
    /**
     * 평가 상세 조회
     */
    @Transactional(readOnly = true)
    public BiddingEvaluationDto getEvaluationById(Long id) {
        BiddingEvaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("평가를 찾을 수 없습니다. ID: " + id));
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }
    
    /**
     * 평가 수정
     */
    @Transactional
    public BiddingEvaluationDto updateEvaluation(BiddingEvaluationDto evaluationDto) {
        // 평가 존재 여부 확인
        final BiddingEvaluation existingEvaluation = evaluationRepository.findById(evaluationDto.getId())
                .orElseThrow(() -> new EntityNotFoundException("평가를 찾을 수 없습니다. ID: " + evaluationDto.getId()));
        
        // 평가일시 설정
        final LocalDateTime evaluatedAt = evaluationDto.getEvaluatedAt() != null 
                ? evaluationDto.getEvaluatedAt() 
                : existingEvaluation.getCreatedAt();
        evaluationDto.setEvaluatedAt(evaluatedAt);
        
        // 평가 엔티티 생성 및 저장
        final BiddingEvaluation updatedEvaluation = createUpdatedEvaluation(evaluationDto, existingEvaluation);
        
        // 참여 정보 업데이트 (평가 점수 갱신)
        updateParticipationScore(updatedEvaluation);
        
        return BiddingEvaluationDto.fromEntity(updatedEvaluation);
    }

    /**
     * 평가 엔티티 생성 및 저장 로직 분리
     */
    private BiddingEvaluation createUpdatedEvaluation(
            BiddingEvaluationDto evaluationDto, 
            BiddingEvaluation existingEvaluation) {
        
        // 엔티티 변환
        BiddingEvaluation updatedEvaluation = evaluationDto.toEntity();
        
        // 생성일시 유지
        updatedEvaluation.setCreatedAt(existingEvaluation.getCreatedAt());
        
        // 업데이트된 엔티티 저장
        return evaluationRepository.save(updatedEvaluation);
    }

    /**
     * 참여 정보 점수 업데이트 로직 분리
     */
    private void updateParticipationScore(BiddingEvaluation updatedEvaluation) {
        // 참여 정보 조회
        final BiddingParticipation participation = participationRepository
                .findById(updatedEvaluation.getBiddingParticipationId())
                .orElseThrow(() -> new EntityNotFoundException(
                    "입찰 참여 정보를 찾을 수 없습니다. ID: " + updatedEvaluation.getBiddingParticipationId()
                ));
        
        // 평가 점수 업데이트
        participation.setEvaluationScore(updatedEvaluation.getTotalScore());
        participationRepository.save(participation);
    }
    
   

   /**
     * 최고 점수 낙찰자 선정 (가중치 기반)
     */
    @Transactional
    public BiddingEvaluationDto selectWinningBidderByHighestScore(Long biddingId) {
    List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingId(biddingId);
    
    // 상수로 가중치 정의
    final double PRICE_WEIGHT = 0.3;
    final double QUALITY_WEIGHT = 0.4;
    final double DELIVERY_WEIGHT = 0.2;
    final double RELIABILITY_WEIGHT = 0.1;
    
    // 최고 점수 평가 찾기 (가중치 적용)
    BiddingEvaluation highestScoringEvaluation = evaluations.stream()
        .filter(evaluation -> 
            evaluation.getPriceScore() != null && 
            evaluation.getQualityScore() != null &&
            evaluation.getDeliveryScore() != null && 
            evaluation.getReliabilityScore() != null)
        .max(Comparator.comparingDouble(evaluation -> {
            double weightedScore = 
                (evaluation.getPriceScore() * PRICE_WEIGHT) +
                (evaluation.getQualityScore() * QUALITY_WEIGHT) +
                (evaluation.getDeliveryScore() * DELIVERY_WEIGHT) +
                (evaluation.getReliabilityScore() * RELIABILITY_WEIGHT);
            
            return weightedScore;
        }))
        .orElseThrow(() -> new EntityNotFoundException(
            "평가가 완료된 공급자가 없습니다. 입찰 ID: " + biddingId
        ));
    
    // 기존 낙찰자 초기화
    List<BiddingEvaluation> previousWinners = evaluationRepository
        .findByBiddingIdAndIsSelectedBidderTrue(biddingId);
    previousWinners.forEach(BiddingEvaluation::cancelSelectedBidder);
    evaluationRepository.saveAll(previousWinners);
    
    // 새 낙찰자 선정
    highestScoringEvaluation.selectAsBidder();
    BiddingEvaluation savedEvaluation = evaluationRepository.save(highestScoringEvaluation);
    
    return BiddingEvaluationDto.fromEntity(savedEvaluation);
}
    /**
     * 낙찰자 선정
     */
    // @Transactional
    // public BiddingEvaluationDto selectBidder(Long evaluationId) {
    //     BiddingEvaluation evaluation = evaluationRepository.findById(evaluationId)
    //             .orElseThrow(() -> new EntityNotFoundException("평가를 찾을 수 없습니다. ID: " + evaluationId));
        
    //     // 기존 낙찰자 취소
    //     List<BiddingEvaluation> previousBidders = evaluationRepository.findByIsSelectedBidderTrue();
    //     previousBidders.forEach(BiddingEvaluation::cancelSelectedBidder);
    //     evaluationRepository.saveAll(previousBidders);
        
    //     // 새 낙찰자 선정
    //     evaluation.selectAsBidder();
    //     BiddingEvaluation savedEvaluation = evaluationRepository.save(evaluation);
        
    //     return BiddingEvaluationDto.fromEntity(savedEvaluation);
    // }

}