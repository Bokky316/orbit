package com.orbit.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.SimplifiedContractDto;
import com.orbit.entity.bidding.Bidding.BiddingStatus;
import com.orbit.entity.bidding.SimplifiedContract.ContractStatus;
import com.orbit.service.BiddingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/biddings")
@RequiredArgsConstructor
public class BiddingController {
    private final BiddingService biddingService;

    /**
     * 입찰 공고 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingDto>> getBiddingList(
            @RequestParam(required = false) BiddingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("입찰 공고 목록 조회 요청 - 상태: {}, 시작일: {}, 종료일: {}", status, startDate, endDate);
        
        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("startDate", startDate);
        params.put("endDate", endDate);

        List<BiddingDto> biddings = biddingService.getBiddingList(params);
        return ResponseEntity.ok(biddings);
    }
    
    /**
     * 입찰 공고 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingDto> getBiddingById(@PathVariable Long id) {
        log.info("입찰 공고 상세 조회 요청 - ID: {}", id);
        
        BiddingDto bidding = biddingService.getBiddingById(id);
        return ResponseEntity.ok(bidding);
    }

    /**
     * 입찰 공고 생성
     */
    @PostMapping
    public ResponseEntity<BiddingDto> createBidding(@RequestBody BiddingDto bidding) {
        log.info("입찰 공고 생성 요청 - 제목: {}", bidding.getTitle());
        
        BiddingDto createdBidding = biddingService.createBidding(bidding);
        return new ResponseEntity<>(createdBidding, HttpStatus.CREATED);
    }
    
    /**
     * 입찰 공고 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<BiddingDto> updateBidding(
            @PathVariable Long id,
            @RequestBody BiddingDto bidding
    ) {
        log.info("입찰 공고 수정 요청 - ID: {}, 제목: {}", id, bidding.getTitle());
        
        BiddingDto updatedBidding = biddingService.updateBidding(id, bidding);
        return ResponseEntity.ok(updatedBidding);
    }
    
    /**
     * 입찰 공고 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBidding(@PathVariable Long id) {
        log.info("입찰 공고 삭제 요청 - ID: {}", id);
        
        biddingService.deleteBidding(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 입찰 참여
     */
    @PostMapping("/{biddingId}/participate")
    public ResponseEntity<BiddingParticipationDto> participateInBidding(
            @PathVariable Long biddingId,
            @RequestBody BiddingParticipationDto participation
    ) {
        log.info("입찰 참여 요청 - 입찰 ID: {}, 공급자 ID: {}", biddingId, participation.getSupplierId());
        
        participation.setBiddingId(biddingId);
        BiddingParticipationDto result = biddingService.participateInBidding(participation);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }
    
    /**
     * 입찰 참여 목록 조회
     */
    @GetMapping("/{biddingId}/participations")
    public ResponseEntity<List<BiddingParticipationDto>> getBiddingParticipations(@PathVariable Long biddingId) {
        log.info("입찰 참여 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        List<BiddingParticipationDto> participations = biddingService.getBiddingParticipations(biddingId);
        return ResponseEntity.ok(participations);
    }
    
    /**
     * 입찰 참여 상세 조회
     */
    @GetMapping("/participations/{id}")
    public ResponseEntity<BiddingParticipationDto> getParticipationById(@PathVariable Long id) {
        log.info("입찰 참여 상세 조회 요청 - ID: {}", id);
        
        BiddingParticipationDto participation = biddingService.getParticipationById(id);
        return ResponseEntity.ok(participation);
    }

    /**
     * 입찰 평가
     */
    @PostMapping("/participations/{participationId}/evaluate")
    public ResponseEntity<BiddingEvaluationDto> evaluateBidding(
            @PathVariable Long participationId,
            @RequestBody BiddingEvaluationDto evaluation
    ) {
        log.info("입찰 평가 요청 - 참여 ID: {}, 평가자 ID: {}", participationId, evaluation.getEvaluatorId());
        
        evaluation.setBiddingParticipationId(participationId);
        BiddingEvaluationDto result = biddingService.evaluateBidding(evaluation);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }
    
    /**
     * 입찰 평가 목록 조회
     */
    @GetMapping("/participations/{participationId}/evaluations")
    public ResponseEntity<List<BiddingEvaluationDto>> getBiddingEvaluations(@PathVariable Long participationId) {
        log.info("입찰 평가 목록 조회 요청 - 참여 ID: {}", participationId);
        
        List<BiddingEvaluationDto> evaluations = biddingService.getBiddingEvaluations(participationId);
        return ResponseEntity.ok(evaluations);
    }
    
    /**
     * 입찰별 평가 목록 조회
     */
    @GetMapping("/{biddingId}/evaluations")
    public ResponseEntity<List<BiddingEvaluationDto>> getEvaluationsByBiddingId(@PathVariable Long biddingId) {
        log.info("입찰별 평가 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        List<BiddingEvaluationDto> evaluations = biddingService.getEvaluationsByBiddingId(biddingId);
        return ResponseEntity.ok(evaluations);
    }
    
    /**
     * 낙찰자 선정
     */
    @GetMapping("/{biddingId}/winning-bid")
    public ResponseEntity<BiddingEvaluationDto> selectWinningBid(@PathVariable Long biddingId) {
        log.info("낙찰자 선정 요청 - 입찰 ID: {}", biddingId);
        
        BiddingEvaluationDto winningBid = biddingService.selectWinningBid(biddingId);
        if (winningBid == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(winningBid);
    }

    /**
     * 계약 생성
     */
    @PostMapping("/{biddingId}/contract")
    public ResponseEntity<SimplifiedContractDto> createContract(
            @PathVariable Long biddingId,
            @RequestBody SimplifiedContractDto contract
    ) {
        log.info("계약 생성 요청 - 입찰 ID: {}", biddingId);
        
        contract.setBiddingId(biddingId);
        SimplifiedContractDto createdContract = biddingService.createContract(contract);
        return new ResponseEntity<>(createdContract, HttpStatus.CREATED);
    }
    
    /**
     * 계약 목록 조회
     */
    @GetMapping("/contracts")
    public ResponseEntity<List<SimplifiedContractDto>> getContractList(
            @RequestParam(required = false) Long biddingId,
            @RequestParam(required = false) ContractStatus status
    ) {
        log.info("계약 목록 조회 요청 - 입찰 ID: {}, 상태: {}", biddingId, status);
        
        Map<String, Object> params = new HashMap<>();
        if (biddingId != null) params.put("biddingId", biddingId);
        if (status != null) params.put("status", status);
        
        List<SimplifiedContractDto> contracts = biddingService.getContractList(params);
        return ResponseEntity.ok(contracts);
    }
    
    /**
     * 계약 상세 조회
     */
    @GetMapping("/contracts/{id}")
    public ResponseEntity<SimplifiedContractDto> getContractById(@PathVariable Long id) {
        log.info("계약 상세 조회 요청 - ID: {}", id);
        
        SimplifiedContractDto contract = biddingService.getContractById(id);
        return ResponseEntity.ok(contract);
    }
    
    /**
     * 계약 상태 업데이트
     */
    @PutMapping("/contracts/{id}/status")
    public ResponseEntity<SimplifiedContractDto> updateContractStatus(
            @PathVariable Long id,
            @RequestParam ContractStatus status
    ) {
        log.info("계약 상태 업데이트 요청 - ID: {}, 상태: {}", id, status);
        
        SimplifiedContractDto updatedContract = biddingService.updateContractStatus(id, status);
        return ResponseEntity.ok(updatedContract);
    }
}