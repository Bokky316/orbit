package com.orbit.controller.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.service.bidding.BiddingEvaluationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/biddings/evaluations")
@RequiredArgsConstructor
public class BiddingEvaluationController {

    private final BiddingEvaluationService evaluationService;

    // 모든 평가 목록 조회
    @GetMapping
    public ResponseEntity<List<BiddingEvaluationDto>> getAllEvaluations() {
        return ResponseEntity.ok(evaluationService.getAllEvaluations());
    }

    // 평가 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<BiddingEvaluationDto> getEvaluationById(@PathVariable Long id) {
        return ResponseEntity.ok(evaluationService.getEvaluationById(id));
    }

    // 입찰 참여 ID로 평가 조회
    @GetMapping("/participation/{participationId}")
    public ResponseEntity<BiddingEvaluationDto> getEvaluationByParticipationId(@PathVariable Long participationId) {
        Optional<BiddingEvaluationDto> evaluation = evaluationService.getEvaluationByParticipationId(participationId);
        return evaluation
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 평가 생성
    @PostMapping
    public ResponseEntity<BiddingEvaluationDto> createEvaluation(@RequestBody BiddingEvaluationDto evaluationDto) {
        BiddingEvaluationDto createdEvaluation = evaluationService.createEvaluation(evaluationDto);
        return new ResponseEntity<>(createdEvaluation, HttpStatus.CREATED);
    }

    // 평가 수정
    @PutMapping("/{id}")
    public ResponseEntity<BiddingEvaluationDto> updateEvaluation(
            @PathVariable Long id, 
            @RequestBody BiddingEvaluationDto evaluationDto) {
        BiddingEvaluationDto updatedEvaluation = evaluationService.updateEvaluation(id, evaluationDto);
        return ResponseEntity.ok(updatedEvaluation);
    }

    // 평가 삭제 (초기화)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvaluation(@PathVariable Long id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.noContent().build();
    }
}