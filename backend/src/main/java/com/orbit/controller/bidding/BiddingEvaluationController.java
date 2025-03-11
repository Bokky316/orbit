package com.orbit.controller.bidding;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingEvaluationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class BiddingEvaluationController {
    private final BiddingEvaluationService evaluationService;

    @GetMapping
    public ResponseEntity<List<BiddingEvaluationDto>> getAllEvaluations() {
        log.info("전체 평가 목록 조회 요청");
        List<BiddingEvaluationDto> evaluations = evaluationService.getAllEvaluations();
        return ResponseEntity.ok(evaluations);
    }

    /**
     * 입찰 평가 생성
     */
    @PostMapping
    public ResponseEntity<BiddingEvaluationDto> createEvaluation(@Valid @RequestBody BiddingEvaluationDto evaluationDto) {
        log.info("입찰 평가 생성 요청 - 입찰 ID: {}, 입찰 참여 ID: {}", 
                evaluationDto.getBiddingId(), evaluationDto.getBiddingParticipationId());
        
        BiddingEvaluationDto createdEvaluation = evaluationService.createEvaluation(evaluationDto);
        return new ResponseEntity<>(createdEvaluation, HttpStatus.CREATED);
    }
    
    /**
     * 입찰별 평가 목록 조회
     */
    @GetMapping("/by-bidding/{biddingId}")
    public ResponseEntity<List<BiddingEvaluationDto>> getEvaluationsByBiddingId(@PathVariable Long biddingId) {
        log.info("입찰별 평가 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        List<BiddingEvaluationDto> evaluations = evaluationService.getEvaluationsByBiddingId(biddingId);
        return ResponseEntity.ok(evaluations);
    }
    
    /**
     * 입찰 참여별 평가 조회
     */
    @GetMapping("/by-participation/{participationId}")
    public ResponseEntity<BiddingEvaluationDto> getEvaluationByParticipationId(@PathVariable Long participationId) {
        log.info("입찰 참여별 평가 조회 요청 - 입찰 참여 ID: {}", participationId);
        
        BiddingEvaluationDto evaluation = evaluationService.getEvaluationByParticipationId(participationId);
        return ResponseEntity.ok(evaluation);
    }
    
    
    /**
     * 평가
     */
    @PutMapping("/{id}")
    public ResponseEntity<BiddingEvaluationDto> updateEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody BiddingEvaluationDto evaluationDto
    ) {
        log.info("평가 수정 요청 - ID: {}", id);
        
        evaluationDto.setId(id);
        BiddingEvaluationDto updatedEvaluation = evaluationService.updateEvaluation(evaluationDto);
        return ResponseEntity.ok(updatedEvaluation);
    }

     /**
     * 특정 입찰의 최고 점수 낙찰자 선정
     */
    @PostMapping("/select-winner/{biddingId}")
    public ResponseEntity<BiddingEvaluationDto> selectWinningBidder(@PathVariable Long biddingId) {
        log.info("입찰 최고 점수 낙찰자 선정 요청 - 입찰 ID: {}", biddingId);
        
        BiddingEvaluationDto winningBidder = evaluationService.selectWinningBidderByHighestScore(biddingId);
        return ResponseEntity.ok(winningBidder);
    }

    /**
     * 공급자별 평가 히스토리 조회
     */
    @GetMapping("/supplier/{supplierName}")
    public ResponseEntity<List<BiddingEvaluationDto>> getSupplierEvaluationHistory(@PathVariable String supplierName) {
        log.info("공급자 평가 히스토리 조회 요청 - 공급자명: {}", supplierName);
        
        List<BiddingEvaluationDto> supplierEvaluations = evaluationService.getEvaluationsBySupplierName(supplierName);
        return ResponseEntity.ok(supplierEvaluations);
    }
    
    
}