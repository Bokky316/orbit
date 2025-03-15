package com.orbit.controller.bidding;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
    private final MemberRepository memberRepository;
    
    /**
     * 평가 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingEvaluationDto>> getAllEvaluations() {
        log.info("평가 목록 조회 요청");
        
        try {
            List<BiddingEvaluationDto> evaluations = evaluationService.getAllEvaluations();
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            log.error("평가 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 입찰 공고의 평가 목록 조회
     */
    @GetMapping("/bidding/{biddingId}")
    public ResponseEntity<List<BiddingEvaluationDto>> getEvaluationsByBiddingId(@PathVariable Long biddingId) {
        log.info("특정 입찰 공고의 평가 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingEvaluationDto> evaluations = evaluationService.getEvaluationsByBiddingId(biddingId);
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            log.error("평가 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 참여에 대한 평가 목록 조회
     */
    @GetMapping("/participation/{participationId}")
    public ResponseEntity<List<BiddingEvaluationDto>> getEvaluationsByParticipationId(@PathVariable Long participationId) {
        log.info("특정 참여에 대한 평가 목록 조회 요청 - 참여 ID: {}", participationId);
        
        try {
            List<BiddingEvaluationDto> evaluations = evaluationService.getEvaluationsByParticipationId(participationId);
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            log.error("평가 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 평가자의 평가 목록 조회
     */
    @GetMapping("/evaluator/{evaluatorId}")
    public ResponseEntity<List<BiddingEvaluationDto>> getEvaluationsByEvaluatorId(@PathVariable Long evaluatorId) {
        log.info("특정 평가자의 평가 목록 조회 요청 - 평가자 ID: {}", evaluatorId);
        
        try {
            List<BiddingEvaluationDto> evaluations = evaluationService.getEvaluationsByEvaluatorId(evaluatorId);
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            log.error("평가 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 평가 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingEvaluationDto> getEvaluationById(@PathVariable Long id) {
        log.info("평가 상세 조회 요청 - ID: {}", id);
        
        try {
            BiddingEvaluationDto evaluation = evaluationService.getEvaluationById(id);
            return ResponseEntity.ok(evaluation);
        } catch (Exception e) {
            log.error("평가 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 참여에 대한 평가 생성
     */
    @PostMapping
    public ResponseEntity<BiddingEvaluationDto> createEvaluation(
            @RequestBody BiddingEvaluationDto evaluationDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("평가 생성 요청 - 입찰 ID: {}, 참여 ID: {}", 
                evaluationDto.getBiddingId(), evaluationDto.getBiddingParticipationId());
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingEvaluationDto evaluation = evaluationService.createEvaluation(
                    evaluationDto.getBiddingId(), 
                    evaluationDto.getBiddingParticipationId(), 
                    member.getId());
            
            return new ResponseEntity<>(evaluation, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            log.error("평가 생성 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("평가 생성 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 평가 점수 업데이트
     */
    @PutMapping("/{id}")
    public ResponseEntity<BiddingEvaluationDto> updateEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody BiddingEvaluationDto evaluationDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("평가 점수 업데이트 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (평가자 본인 또는 관리자만 가능하도록)
            
            evaluationDto.setId(id); // ID 설정
            BiddingEvaluationDto updatedEvaluation = evaluationService.updateEvaluation(id, evaluationDto);
            return ResponseEntity.ok(updatedEvaluation);
        } catch (IllegalStateException e) {
            log.error("평가 업데이트 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("평가 업데이트 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 낙찰자 선정 취소
     */
    @PutMapping("/{id}/cancel-selection")
    public ResponseEntity<BiddingEvaluationDto> cancelSelectedBidder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("낙찰자 선정 취소 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingEvaluationDto evaluation = evaluationService.cancelSelectedBidder(id);
            return ResponseEntity.ok(evaluation);
        } catch (IllegalStateException e) {
            log.error("낙찰자 선정 취소 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("낙찰자 선정 취소 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 점수별 평가 목록 조회 (내림차순)
     */
    @GetMapping("/bidding/{biddingId}/top")
    public ResponseEntity<List<BiddingEvaluationDto>> getTopEvaluationsByBiddingId(@PathVariable Long biddingId) {
        log.info("점수별 평가 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingEvaluationDto> evaluations = evaluationService.getTopEvaluationsByBiddingId(biddingId);
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            log.error("평가 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 낙찰된 평가 목록 조회
     */
    @GetMapping("/bidding/{biddingId}/selected")
    public ResponseEntity<List<BiddingEvaluationDto>> getSelectedBiddersByBiddingId(@PathVariable Long biddingId) {
        log.info("낙찰된 평가 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingEvaluationDto> evaluations = evaluationService.getSelectedBiddersByBiddingId(biddingId);
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            log.error("평가 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 공급사의 평가 목록 조회
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<BiddingEvaluationDto>> getEvaluationsBySupplier(@PathVariable Long supplierId) {
        log.info("특정 공급사의 평가 목록 조회 요청 - 공급사 ID: {}", supplierId);
        
        try {
            List<BiddingEvaluationDto> evaluations = evaluationService.getEvaluationsBySupplier(supplierId);
            return ResponseEntity.ok(evaluations);
        } catch (Exception e) {
            log.error("평가 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * UserDetails로부터 Member 객체 조회
     */
    private Member getUserFromUserDetails(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("인증된 사용자 정보가 필요합니다.");
        }
        
        return memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
    }
}