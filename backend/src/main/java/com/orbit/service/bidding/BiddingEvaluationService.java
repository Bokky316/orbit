package com.orbit.service.bidding;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BiddingEvaluationService {
    

    private final BiddingEvaluationRepository evaluationRepository;
    private final BiddingParticipationRepository participationRepository;

    // 모든 평가 목록 조회
    public List<BiddingEvaluationDto> getAllEvaluations() {
        List<BiddingEvaluation> evaluations = evaluationRepository.findAllWithParticipation();
        
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 평가 상세 조회
    public BiddingEvaluationDto getEvaluationById(Long id) {
        BiddingEvaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("평가 정보를 찾을 수 없습니다: " + id));
        
        return BiddingEvaluationDto.fromEntity(evaluation);
    }

    // 입찰 참여 ID로 평가 조회 (리스트 반환으로 수정)
    public List<BiddingEvaluationDto> getEvaluationsByParticipationId(Long participationId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingParticipationId(participationId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 입찰 참여 ID로 평가 조회 (Optional 단일 객체 반환)
    public Optional<BiddingEvaluationDto> getEvaluationByParticipationId(Long participationId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findByBiddingParticipationId(participationId);
        if (evaluations.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(BiddingEvaluationDto.fromEntity(evaluations.get(0)));
    }

    // 평가 생성
    @Transactional
    public BiddingEvaluationDto createEvaluation(BiddingEvaluationDto evaluationDto) {
        // 입찰 참여 정보 확인
        BiddingParticipation participation = participationRepository.findById(evaluationDto.getBiddingParticipationId())
                .orElseThrow(() -> new RuntimeException("입찰 참여 정보를 찾을 수 없습니다: " + evaluationDto.getBiddingParticipationId()));
        
        // 이미 평가가 존재하는지 확인
        List<BiddingEvaluation> existingEvaluations = evaluationRepository.findByBiddingParticipationId(evaluationDto.getBiddingParticipationId());
        if (!existingEvaluations.isEmpty()) {
            throw new RuntimeException("이미 평가가 존재합니다. 수정을 이용해주세요.");
        }
        
        // 평가 점수 계산 (4개 항목 평균)
        int totalScore = (evaluationDto.getPriceScore() + evaluationDto.getQualityScore() 
                + evaluationDto.getDeliveryScore() + evaluationDto.getReliabilityScore()) / 4;
        
        // 엔티티 변환 및 저장
        BiddingEvaluation evaluation = evaluationDto.toEntity();
        evaluation.setBiddingParticipationId(evaluationDto.getBiddingParticipationId());
        evaluation.setParticipation(participation);
        evaluation.setTotalScore(totalScore);
        
        BiddingEvaluation savedEvaluation = evaluationRepository.save(evaluation);
        return BiddingEvaluationDto.fromEntity(savedEvaluation);
    }

    // 평가 수정
    @Transactional
    public BiddingEvaluationDto updateEvaluation(Long id, BiddingEvaluationDto evaluationDto) {
        BiddingEvaluation existingEvaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("평가 정보를 찾을 수 없습니다: " + id));
        
        // 필드 업데이트
        existingEvaluation.setPriceScore(evaluationDto.getPriceScore());
        existingEvaluation.setQualityScore(evaluationDto.getQualityScore());
        existingEvaluation.setDeliveryScore(evaluationDto.getDeliveryScore());
        existingEvaluation.setReliabilityScore(evaluationDto.getReliabilityScore());
        existingEvaluation.setComments(evaluationDto.getComments());
        
        // 총점 재계산
        int totalScore = (existingEvaluation.getPriceScore() + existingEvaluation.getQualityScore() 
                + existingEvaluation.getDeliveryScore() + existingEvaluation.getReliabilityScore()) / 4;
        existingEvaluation.setTotalScore(totalScore);
        
        BiddingEvaluation updatedEvaluation = evaluationRepository.save(existingEvaluation);
        return BiddingEvaluationDto.fromEntity(updatedEvaluation);
    }

    // 평가 삭제 (또는 초기화)
    @Transactional
    public void deleteEvaluation(Long id) {
        if (!evaluationRepository.existsById(id)) {
            throw new RuntimeException("평가 정보를 찾을 수 없습니다: " + id);
        }
        evaluationRepository.deleteById(id);
    }
    
    // 입찰 ID로 모든 평가 조회
    public List<BiddingEvaluationDto> getAllEvaluationsByBiddingId(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findAllByBiddingId(biddingId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    // 공급자 ID로 모든 평가 조회
    public List<BiddingEvaluationDto> getAllEvaluationsBySupplierId(Long supplierId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findAllBySupplierId(supplierId);
        return evaluations.stream()
                .map(BiddingEvaluationDto::fromEntity)
                .collect(Collectors.toList());
    }
}