package com.orbit.controller.bidding;

import java.util.List;
import java.util.Map;

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

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingService;
import com.orbit.service.bidding.BiddingSupplierService;
import com.orbit.service.bidding.BiddingSupplierViewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 공급업체(Supplier) 관점에서의 입찰 정보 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/supplier/biddings")
@RequiredArgsConstructor
public class SupplierBiddingController {
    private final BiddingSupplierViewService biddingSupplierViewService;
    private final BiddingSupplierService biddingSupplierService;
    private final BiddingService biddingService;
    private final MemberRepository memberRepository;

    /**
     * 공급업체 대시보드 요약 정보 조회
     */
    // @GetMapping("/dashboard")
    // public ResponseEntity<Map<String, Object>> getDashboardSummary(@AuthenticationPrincipal UserDetails userDetails) {
    //     log.info("공급업체 입찰 대시보드 요약 정보 조회 요청");
        
    //     // 현재 로그인한 사용자의 공급업체 ID 조회
    //     Member supplier = memberRepository.findByUsername(userDetails.getUsername())
    //             .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
    //     Map<String, Object> summary = biddingSupplierViewService.getSupplierDashboardSummary(supplier.getId());
    //     return ResponseEntity.ok(summary);
    // }

    /**
     * 초대받은 모든 입찰 공고 목록 조회
     */
    @GetMapping("/invited")
    public ResponseEntity<List<BiddingDto>> getInvitedBiddings(@AuthenticationPrincipal UserDetails userDetails) {
        log.info("초대받은 입찰 공고 목록 조회 요청");
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        List<BiddingDto> biddings = biddingSupplierViewService.getInvitedBiddings(supplier.getId());
        return ResponseEntity.ok(biddings);
    }

    /**
     * 초대받은 활성 상태의 입찰 공고 목록 조회 (대응 가능한 입찰)
     */
    @GetMapping("/invited/active")
    public ResponseEntity<List<BiddingDto>> getActiveInvitedBiddings(@AuthenticationPrincipal UserDetails userDetails) {
        log.info("활성 상태의 초대받은 입찰 공고 목록 조회 요청");
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        List<BiddingDto> biddings = biddingSupplierViewService.getActiveInvitedBiddings(supplier.getId());
        return ResponseEntity.ok(biddings);
    }

    /**
     * 참여한 입찰 공고 목록 조회
     */
    @GetMapping("/participated")
    public ResponseEntity<List<BiddingDto>> getParticipatedBiddings(@AuthenticationPrincipal UserDetails userDetails) {
        log.info("참여한 입찰 공고 목록 조회 요청");
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        List<BiddingDto> biddings = biddingSupplierViewService.getParticipatedBiddings(supplier.getId());
        return ResponseEntity.ok(biddings);
    }

    /**
     * 낙찰받은 입찰 공고 목록 조회
     */
    @GetMapping("/won")
    public ResponseEntity<List<BiddingDto>> getWonBiddings(@AuthenticationPrincipal UserDetails userDetails) {
        log.info("낙찰받은 입찰 공고 목록 조회 요청");
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        List<BiddingDto> biddings = biddingSupplierViewService.getWonBiddings(supplier.getId());
        return ResponseEntity.ok(biddings);
    }

    /**
     * 입찰 공고 상세 조회
     */
    @GetMapping("/{biddingId}")
    public ResponseEntity<BiddingDto> getBiddingDetail(@PathVariable Long biddingId) {
        log.info("입찰 공고 상세 조회 요청 - ID: {}", biddingId);
        
        BiddingDto bidding = biddingService.getBiddingById(biddingId);
        return ResponseEntity.ok(bidding);
    }

    /**
     * 입찰 참여 세부 정보 조회
     */
    @GetMapping("/{biddingId}/participation")
    public ResponseEntity<BiddingParticipationDto> getParticipationDetail(
            @PathVariable Long biddingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("입찰 참여 세부 정보 조회 요청 - 입찰 ID: {}", biddingId);
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        try {
            BiddingParticipationDto participation = biddingSupplierViewService.getParticipationDetail(biddingId, supplier.getId());
            return ResponseEntity.ok(participation);
        } catch (Exception e) {
            // 아직 참여하지 않은 경우 404 반환
            log.error("입찰 참여 정보 조회 실패", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 초대 상태 조회
     */
    @GetMapping("/{biddingId}/invitation")
    public ResponseEntity<BiddingSupplierDto> getInvitationStatus(
            @PathVariable Long biddingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("입찰 초대 상태 조회 요청 - 입찰 ID: {}", biddingId);
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        try {
            BiddingSupplierDto invitation = biddingSupplierViewService.getInvitationStatus(biddingId, supplier.getId());
            return ResponseEntity.ok(invitation);
        } catch (Exception e) {
            // 초대된 적이 없는 경우 404 반환
            log.error("입찰 초대 정보 조회 실패", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 입찰 참여 (견적 제출)
     */
    @PostMapping("/{biddingId}/participate")
    public ResponseEntity<BiddingParticipationDto> participateInBidding(
            @PathVariable Long biddingId,
            @Valid @RequestBody BiddingParticipationDto participationDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("입찰 참여 요청 - 입찰 ID: {}", biddingId);
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        // 공급업체 ID와 입찰 ID 설정
        participationDto.setSupplierId(supplier.getId());
        participationDto.setBiddingId(biddingId);
        
        try {
            BiddingParticipationDto result = biddingService.participateInBidding(participationDto);
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            log.error("입찰 참여 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    /**
     * 초대 응답 - 참여 의사 표시
     */
    @PutMapping("/{biddingId}/invitation/accept")
    public ResponseEntity<BiddingSupplierDto> acceptInvitation(
            @PathVariable Long biddingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("입찰 초대 수락 요청 - 입찰 ID: {}", biddingId);
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        try {
            BiddingSupplierDto result = biddingSupplierService.respondWithParticipation(biddingId, supplier.getId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("입찰 초대 수락 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 초대 응답 - 거부
     */
    @PutMapping("/{biddingId}/invitation/reject")
    public ResponseEntity<BiddingSupplierDto> rejectInvitation(
            @PathVariable Long biddingId,
            @RequestBody Map<String, String> rejectRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        String reason = rejectRequest.get("reason");
        log.info("입찰 초대 거부 요청 - 입찰 ID: {}, 사유: {}", biddingId, reason);
        
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        try {
            BiddingSupplierDto result = biddingSupplierService.respondWithRejection(biddingId, supplier.getId(), reason);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("입찰 초대 거부 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}