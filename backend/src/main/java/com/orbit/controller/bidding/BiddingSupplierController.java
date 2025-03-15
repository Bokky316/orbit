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

import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingSupplierService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class BiddingSupplierController {
    private final BiddingSupplierService supplierService;
    private final MemberRepository memberRepository;
    
    /**
     * 초대된 공급사 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingSupplierDto>> getAllSuppliers() {
        log.info("초대된 공급사 목록 조회 요청");
        
        try {
            List<BiddingSupplierDto> suppliers = supplierService.getAllSuppliers();
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 입찰 공고에 초대된 공급사 목록 조회
     */
    @GetMapping("/bidding/{biddingId}")
    public ResponseEntity<List<BiddingSupplierDto>> getSuppliersByBiddingId(@PathVariable Long biddingId) {
        log.info("특정 입찰 공고에 초대된 공급사 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingSupplierDto> suppliers = supplierService.getSuppliersByBiddingId(biddingId);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<BiddingSupplierDto>> getSuppliersBySupplierId(@PathVariable Long supplierId) {
        log.info("특정 공급사가 초대된 입찰 공고 목록 조회 요청 - 공급사 ID: {}", supplierId);
        
        try {
            List<BiddingSupplierDto> suppliers = supplierService.getSuppliersBySupplierId(supplierId);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 입찰 공고에 공급사 초대
     */
    @PostMapping("/bidding/{biddingId}/invite/{supplierId}")
    public ResponseEntity<BiddingSupplierDto> inviteSupplier(
            @PathVariable Long biddingId,
            @PathVariable Long supplierId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("공급사 초대 요청 - 입찰 ID: {}, 공급사 ID: {}", biddingId, supplierId);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingSupplierDto supplier = supplierService.inviteSupplier(biddingId, supplierId);
            return new ResponseEntity<>(supplier, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            log.error("공급사 초대 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("공급사 초대 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 초대 응답 - 참여
     */
    @PutMapping("/bidding/{biddingId}/supplier/{supplierId}/participate")
    public ResponseEntity<BiddingSupplierDto> respondWithParticipation(
            @PathVariable Long biddingId,
            @PathVariable Long supplierId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("초대 응답 (참여) 요청 - 입찰 ID: {}, 공급사 ID: {}", biddingId, supplierId);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // 자신의 공급사 정보인지 확인
            if (!member.getId().equals(supplierId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            BiddingSupplierDto supplier = supplierService.respondWithParticipation(biddingId, supplierId);
            return ResponseEntity.ok(supplier);
        } catch (Exception e) {
            log.error("참여 응답 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 초대 응답 - 거부
     */
    @PutMapping("/bidding/{biddingId}/supplier/{supplierId}/reject")
    public ResponseEntity<BiddingSupplierDto> respondWithRejection(
            @PathVariable Long biddingId,
            @PathVariable Long supplierId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String reason = request.get("reason");
        log.info("초대 응답 (거부) 요청 - 입찰 ID: {}, 공급사 ID: {}, 사유: {}", biddingId, supplierId, reason);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // 자신의 공급사 정보인지 확인
            if (!member.getId().equals(supplierId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            BiddingSupplierDto supplier = supplierService.respondWithRejection(biddingId, supplierId, reason);
            return ResponseEntity.ok(supplier);
        } catch (Exception e) {
            log.error("거부 응답 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 알림 발송되지 않은 공급사 목록 조회
     */
    @GetMapping("/bidding/{biddingId}/non-notified")
    public ResponseEntity<List<BiddingSupplierDto>> getNonNotifiedSuppliers(@PathVariable Long biddingId) {
        log.info("알림 발송되지 않은 공급사 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingSupplierDto> suppliers = supplierService.getNonNotifiedSuppliers(biddingId);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 참여 의사를 밝힌 공급사 목록 조회
     */
    @GetMapping("/bidding/{biddingId}/participating")
    public ResponseEntity<List<BiddingSupplierDto>> getParticipatingSuppliers(@PathVariable Long biddingId) {
        log.info("참여 의사를 밝힌 공급사 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingSupplierDto> suppliers = supplierService.getParticipatingSuppliers(biddingId);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 참여를 거부한 공급사 목록 조회
     */
    @GetMapping("/bidding/{biddingId}/rejected")
    public ResponseEntity<List<BiddingSupplierDto>> getRejectedSuppliers(@PathVariable Long biddingId) {
        log.info("참여를 거부한 공급사 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingSupplierDto> suppliers = supplierService.getRejectedSuppliers(biddingId);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 응답하지 않은 공급사 목록 조회
     */
    @GetMapping("/bidding/{biddingId}/non-responded")
    public ResponseEntity<List<BiddingSupplierDto>> getNonRespondedSuppliers(@PathVariable Long biddingId) {
        log.info("응답하지 않은 공급사 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingSupplierDto> suppliers = supplierService.getNonRespondedSuppliers(biddingId);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 공급사 이름 업데이트
     */
    @PutMapping("/supplier/{supplierId}/update-name")
    public ResponseEntity<BiddingSupplierDto> updateSupplierName(
            @PathVariable Long supplierId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("공급사 이름 업데이트 요청 - 공급사 ID: {}", supplierId);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // 자신의 공급사 정보 또는 관리자 권한 확인
            // TODO: 권한 체크 로직 추가 (해당 공급사 또는 관리자만 가능하도록)
            
            BiddingSupplierDto supplier = supplierService.updateSupplierName(supplierId);
            return ResponseEntity.ok(supplier);
        } catch (Exception e) {
            log.error("공급사 이름 업데이트 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 알림 재전송
     */
    @PostMapping("/bidding/{biddingId}/supplier/{supplierId}/resend-notification")
    public ResponseEntity<BiddingSupplierDto> resendNotification(
            @PathVariable Long biddingId,
            @PathVariable Long supplierId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("알림 재전송 요청 - 입찰 ID: {}, 공급사 ID: {}", biddingId, supplierId);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingSupplierDto supplier = supplierService.resendNotification(biddingId, supplierId);
            return ResponseEntity.ok(supplier);
        } catch (Exception e) {
            log.error("알림 재전송 중 오류 발생", e);
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