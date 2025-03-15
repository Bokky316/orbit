package com.orbit.service.bidding;

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

    /**
     * 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getAllEvaluations() {
        List<BiddingEvaluation> evaluations = evaluationRepository.findAll();
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 입찰 공고의 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getEvaluationsByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingId(biddingId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 참여에 대한 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getEvaluationsByParticipationId(Long participationId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingParticipationId(participationId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 평가자의 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getEvaluationsByEvaluatorId(Long evaluatorId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByEvaluatorId(evaluatorId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
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
     * 입찰 참여에 대한 평가 생성
     */
    @Transactional
    public BiddingEvaluationDto createEvaluation(Long biddingId, Long participationId, Long evaluatorId) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        // 참여 정보 조회
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 평가가 이미 존재하는지 확인
        boolean evaluationExists = evaluationRepository.findByBiddingParticipationId(participationId)
                .stream()
                .anyMatch(e -> e.getEvaluatorId().equals(evaluatorId));
        
        if (evaluationExists) {
            throw new IllegalStateException("이미 해당 참여에 대한 평가가 존재합니다.");
        }
        
        // 평가 생성
        BiddingEvaluation evaluation = bidding.addEvaluation(participation, evaluatorId, memberRepository, notificationRepository);
        evaluation = evaluationRepository.save(evaluation);
        
        // 참여 정보 평가 상태 업데이트
        participation.updateEvaluationStatus(true);
        participationRepository.save(participation);
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }
    
    /**
     * 평가 점수 업데이트
     */
    @Transactional
    public BiddingEvaluationDto updateEvaluation(Long id, BiddingEvaluationDto evaluationDto) {
        BiddingEvaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("평가를 찾을 수 없습니다. ID: " + id));
        
        // 낙찰자로 선정된 평가는 수정 불가
        if (evaluation.isSelectedBidder()) {
            throw new IllegalStateException("낙찰자로 선정된 평가는 수정할 수 없습니다.");
        }
        
        // 값 변경
        evaluation.setPriceScore(evaluationDto.getPriceScore());
        evaluation.setQualityScore(evaluationDto.getQualityScore());
        evaluation.setDeliveryScore(evaluationDto.getDeliveryScore());
        evaluation.setReliabilityScore(evaluationDto.getReliabilityScore());
        evaluation.setComments(evaluationDto.getComments());
        
        // 저장
        evaluation = evaluationRepository.save(evaluation);
        
        // 참여 정보 업데이트
        if (evaluation.getParticipation() != null) {
            BiddingParticipation participation = evaluation.getParticipation();
            participation.updateEvaluationStatus(true, evaluation.getTotalScore(), notificationRepository);
            participationRepository.save(participation);
        }
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }
    
    /**
     * 낙찰자 선정 취소
     */
    @Transactional
    public BiddingEvaluationDto cancelSelectedBidder(Long id) {
        BiddingEvaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("평가를 찾을 수 없습니다. ID: " + id));
        
        // 낙찰자로 선정되지 않은 경우
        if (!evaluation.isSelectedBidder()) {
            throw new IllegalStateException("낙찰자로 선정되지 않은 평가입니다.");
        }
        
        // 낙찰자 선정 취소
        evaluation.cancelSelectedBidder();
        evaluation = evaluationRepository.save(evaluation);
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }
    
    /**
     * 점수별 평가 목록 조회 (내림차순)
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getTopEvaluationsByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findTopByBiddingIdOrderByTotalScoreDesc(biddingId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 낙찰된 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getSelectedBiddersByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 공급사의 평가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingEvaluationDto> getEvaluationsBySupplier(Long supplierId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findEvaluationsBySupplier(supplierId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
}