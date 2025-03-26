package com.orbit.controller.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingSupplierViewService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/supplier/biddings")
@RequiredArgsConstructor
public class SupplierBiddingController {
    private final BiddingSupplierViewService supplierBiddingService;
    private final MemberRepository memberRepository;

    /**
     * 대시보드 요약 정보 조회
     */
    @GetMapping("/bidding-summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            Map<String, Object> dashboard = supplierBiddingService.getSupplierDashboardSummary(supplier.getId());
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            log.error("입찰 요약 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/recent-biddings")
    public ResponseEntity<List<BiddingDto>> getRecentBiddings(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            List<BiddingDto> recent = supplierBiddingService.getRecentBiddings(supplier.getId());
            
            // 최신 날짜순으로 정렬
            sortBiddingsByDateDesc(recent);
            
            return ResponseEntity.ok(recent);
        } catch (Exception e) {
            log.error("최근 입찰 공고 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/performance-metrics")
    public ResponseEntity<Map<String, Object>> getPerformanceMetrics(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            Map<String, Object> metrics = supplierBiddingService.getSupplierPerformanceMetrics(supplier.getId());
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            log.error("성과 지표 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    
    /**
     * 초대받은 입찰 공고 목록 조회
     */
    @GetMapping("/invited")
    public ResponseEntity<List<BiddingDto>> getInvitedBiddings(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("초대받은 입찰 공고 목록 조회 요청");
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            List<BiddingDto> invitedBiddings = supplierBiddingService.getInvitedBiddings(supplier.getId());
            
            // 최신 날짜순으로 정렬
            sortBiddingsByDateDesc(invitedBiddings);
            
            return ResponseEntity.ok(invitedBiddings);
        } catch (Exception e) {
            log.error("초대 목록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 활성 상태의 초대받은 입찰 공고 목록 조회 
     */
    @GetMapping("/active-invited")
    public ResponseEntity<List<BiddingDto>> getActiveInvitedBiddings(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("활성 상태 초대받은 입찰 공고 목록 조회 요청");
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            List<BiddingDto> activeInvitedBiddings = supplierBiddingService.getActiveInvitedBiddings(supplier.getId());
            
            // 최신 날짜순으로 정렬
            sortBiddingsByDateDesc(activeInvitedBiddings);
            
            return ResponseEntity.ok(activeInvitedBiddings);
        } catch (Exception e) {
            log.error("활성 초대 목록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 참여한 입찰 공고 목록 조회
     */
    @GetMapping("/participated")
    public ResponseEntity<List<BiddingDto>> getParticipatedBiddings(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("참여한 입찰 공고 목록 조회 요청");
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            List<BiddingDto> participatedBiddings = supplierBiddingService.getParticipatedBiddings(supplier.getId());
            
            // 최신 날짜순으로 정렬
            sortBiddingsByDateDesc(participatedBiddings);
            
            return ResponseEntity.ok(participatedBiddings);
        } catch (Exception e) {
            log.error("참여 목록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 낙찰받은 입찰 공고 목록 조회
     */
    @GetMapping("/won")
    public ResponseEntity<List<BiddingDto>> getWonBiddings(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("낙찰받은 입찰 공고 목록 조회 요청");
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            List<BiddingDto> wonBiddings = supplierBiddingService.getWonBiddings(supplier.getId());
            
            // 최신 날짜순으로 정렬
            sortBiddingsByDateDesc(wonBiddings);
            
            return ResponseEntity.ok(wonBiddings);
        } catch (Exception e) {
            log.error("낙찰 목록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 입찰 공고 상세 정보 조회
     */
    @GetMapping("/{biddingId}")
    public ResponseEntity<BiddingDto> getBiddingDetail(
        @PathVariable Long biddingId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 공고 상세 정보 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            // 인증 확인만 하고 별도 권한 체크는 필요 없음
            getUserFromUserDetails(userDetails);
            
            BiddingDto bidding = supplierBiddingService.getBiddingDetail(biddingId);
            return ResponseEntity.ok(bidding);
        } catch (EntityNotFoundException e) {
            log.error("입찰 공고 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("입찰 공고 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 공급자의 특정 입찰 참여 상세 정보 조회
     */
    @GetMapping("/{biddingId}/participation")
    public ResponseEntity<BiddingParticipationDto> getParticipationDetail(
        @PathVariable Long biddingId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 참여 상세 정보 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            BiddingParticipationDto participationDetail = 
                supplierBiddingService.getParticipationDetail(biddingId, supplier.getId());
            
            return ResponseEntity.ok(participationDetail);
        } catch (EntityNotFoundException e) {
            log.error("참여 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("참여 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 특정 입찰의 공급자 초대 상태 조회
     */
    @GetMapping("/{biddingId}/invitation")
    public ResponseEntity<BiddingSupplierDto> getInvitationStatus(
        @PathVariable Long biddingId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("초대 상태 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            BiddingSupplierDto invitationStatus = 
                supplierBiddingService.getInvitationStatus(biddingId, supplier.getId());
            
            return ResponseEntity.ok(invitationStatus);
        } catch (EntityNotFoundException e) {
            log.error("초대 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("초대 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 초대 응답 (수락/거부)
     */
    @PutMapping("/{biddingId}/invitation/respond")
    public ResponseEntity<BiddingSupplierDto> respondToInvitation(
        @PathVariable Long biddingId,
        @RequestParam boolean accept,
        @RequestParam(required = false) String comment,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("초대 응답 요청 - 입찰 ID: {}, 수락 여부: {}", biddingId, accept);
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            BiddingSupplierDto response = 
                supplierBiddingService.respondToInvitation(biddingId, supplier.getId(), accept, comment);
            
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            log.error("초대 응답 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException e) {
            log.error("초대 응답 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("초대 응답 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 참여 (가격제안)
     */
    @PostMapping("/{biddingId}/participate")
    public ResponseEntity<BiddingParticipationDto> participateInBidding(
        @PathVariable Long biddingId,
        @RequestParam BigDecimal unitPrice,
        @RequestParam(required = false) Integer quantity,
        @RequestParam(required = false) String comment,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 참여 요청 - 입찰 ID: {}, 단가: {}", biddingId, unitPrice);
        
        try {
            Member supplier = getUserFromUserDetails(userDetails);
            BiddingParticipationDto participation = 
                supplierBiddingService.participateWithPriceSuggestion(
                    biddingId, supplier.getId(), unitPrice, quantity, comment);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(participation);
        } catch (EntityNotFoundException e) {
            log.error("입찰 참여 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException e) {
            log.error("입찰 참여 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("입찰 참여 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 참여 정보 수정
     */
    @PutMapping("/participation/{participationId}")
    public ResponseEntity<BiddingParticipationDto> updateParticipation(
        @PathVariable Long participationId,
        @RequestParam(required = false) BigDecimal unitPrice,
        @RequestParam(required = false) Integer quantity,
        @RequestParam(required = false) String comment,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 참여 정보 수정 요청 - 참여 ID: {}", participationId);
        
        try {
            // 인증 확인
            getUserFromUserDetails(userDetails);
            
            BiddingParticipationDto updatedParticipation = 
                supplierBiddingService.updateParticipation(participationId, unitPrice, quantity, comment);
            
            return ResponseEntity.ok(updatedParticipation);
        } catch (EntityNotFoundException e) {
            log.error("참여 정보 수정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException e) {
            log.error("참여 정보 수정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("참여 정보 수정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 참여 철회
     */
    @DeleteMapping("/participation/{participationId}")
    public ResponseEntity<Void> withdrawParticipation(
        @PathVariable Long participationId,
        @RequestParam(required = false) String reason,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 참여 철회 요청 - 참여 ID: {}", participationId);
        
        try {
            // 인증 확인
            getUserFromUserDetails(userDetails);
            
            supplierBiddingService.withdrawParticipation(participationId, reason);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            log.error("참여 철회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalStateException e) {
            log.error("참여 철회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("참여 철회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 목록을 최신 날짜순으로 정렬하는 메서드
     * 마감일 > 시작일 > 생성일 > ID 순으로 정렬 우선순위 적용
     */
    private void sortBiddingsByDateDesc(List<BiddingDto> biddings) {
        if (biddings == null || biddings.isEmpty()) {
            return;
        }
        
        biddings.sort((a, b) -> {
            // 1. 마감일 기준 정렬 (최신 날짜가 먼저)
            // biddingPeriod.endDate 사용
            LocalDate aEndDate = null;
            LocalDate bEndDate = null;
            
            if (a.getBiddingPeriod() != null && a.getBiddingPeriod().getEndDate() != null) {
                aEndDate = a.getBiddingPeriod().getEndDate();
            }
            
            if (b.getBiddingPeriod() != null && b.getBiddingPeriod().getEndDate() != null) {
                bEndDate = b.getBiddingPeriod().getEndDate();
            }
            
            // 둘 다 마감일이 있으면 마감일로 비교
            if (aEndDate != null && bEndDate != null) {
                // 내림차순 정렬 (최신 날짜가 먼저)
                return bEndDate.compareTo(aEndDate);
            }
            
            // 2. 시작일 기준 정렬
            LocalDate aStartDate = null;
            LocalDate bStartDate = null;
            
            if (a.getBiddingPeriod() != null && a.getBiddingPeriod().getStartDate() != null) {
                aStartDate = a.getBiddingPeriod().getStartDate();
            }
            
            if (b.getBiddingPeriod() != null && b.getBiddingPeriod().getStartDate() != null) {
                bStartDate = b.getBiddingPeriod().getStartDate();
            }
            
            // 둘 다 시작일이 있으면 시작일로 비교
            if (aStartDate != null && bStartDate != null) {
                // 내림차순 정렬 (최신 날짜가 먼저)
                return bStartDate.compareTo(aStartDate);
            }
            
            // 3. 생성일 기준 정렬
            LocalDateTime aRegTime = a.getRegTime();
            LocalDateTime bRegTime = b.getRegTime();
            
            if (aRegTime != null && bRegTime != null) {
                // 내림차순 정렬 (최신 날짜가 먼저)
                return bRegTime.compareTo(aRegTime);
            }
            
            // 4. ID 기준 정렬 (최신 ID가 보통 더 큰 값)
            return Long.compare(b.getId(), a.getId());
        });
    }
    
    /**
     * UserDetails에서 Member 객체 조회
     */
    private Member getUserFromUserDetails(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("인증된 사용자 정보가 필요합니다.");
        }
        
        return memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
    }
}