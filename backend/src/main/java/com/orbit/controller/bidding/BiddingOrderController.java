package com.orbit.controller.bidding;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/bidding-orders")
@RequiredArgsConstructor
public class BiddingOrderController {
    private final BiddingOrderService orderService;
    private final MemberRepository memberRepository;
    
    /**
     * 발주 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingOrderDto>> getAllOrders() {
        log.info("발주 목록 조회 요청");
        
        try {
            List<BiddingOrderDto> orders = orderService.getAllBiddingOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 계약의 발주 목록 조회
     */
    @GetMapping("/contract/{contractId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByContractId(@PathVariable Long contractId) {
        log.info("특정 계약의 발주 목록 조회 요청 - 계약 ID: {}", contractId);
        
        try {
            List<BiddingOrderDto> orders = orderService.getOrdersByContractId(contractId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 공급사의 발주 목록 조회
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersBySupplierId(@PathVariable Long supplierId) {
        log.info("특정 공급사의 발주 목록 조회 요청 - 공급사 ID: {}", supplierId);
        
        try {
            List<BiddingOrderDto> orders = orderService.getOrdersBySupplierId(supplierId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingOrderDto> getOrderById(@PathVariable Long id) {
        log.info("발주 상세 조회 요청 - ID: {}", id);
        
        try {
            BiddingOrderDto order = orderService.getOrderById(id);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("발주 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 생성
     */
    @PostMapping("/contract/{contractId}")
    public ResponseEntity<BiddingOrderDto> createOrder(
            @PathVariable Long contractId,
            @Valid @RequestBody BiddingOrderDto orderDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("발주 생성 요청 - 계약 ID: {}", contractId);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            BiddingOrderDto createdOrder = orderService.createOrder(contractId, orderDto, member);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
        } catch (IllegalStateException e) {
            log.error("발주 생성 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("발주 생성 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 승인
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<BiddingOrderDto> approveOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("발주 승인 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            BiddingOrderDto approvedOrder = orderService.approveOrder(id, member);
            return ResponseEntity.ok(approvedOrder);
        } catch (IllegalStateException e) {
            log.error("발주 승인 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("발주 승인 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 납품 예정일 변경
     */
    @PutMapping("/{id}/delivery-date")
    public ResponseEntity<BiddingOrderDto> updateDeliveryDate(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newDeliveryDate,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("납품 예정일 변경 요청 - ID: {}, 새 납품일: {}", id, newDeliveryDate);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            BiddingOrderDto updatedOrder = orderService.updateDeliveryDate(id, newDeliveryDate, member);
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalStateException e) {
            log.error("납품 예정일 변경 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("납품 예정일 변경 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 취소
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BiddingOrderDto> cancelOrder(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("발주 취소 요청 - ID: {}, 취소 사유: {}", id, reason);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            BiddingOrderDto cancelledOrder = orderService.cancelOrder(id, reason, member);
            return ResponseEntity.ok(cancelledOrder);
        } catch (IllegalStateException e) {
            log.error("발주 취소 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("발주 취소 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 상태 변경
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<BiddingOrderDto> changeOrderStatus(
            @PathVariable Long id,
            @RequestParam String newStatus,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("발주 상태 변경 요청 - ID: {}, 상태: {}, 사유: {}", id, newStatus, reason);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            BiddingOrderDto updatedOrder = orderService.changeOrderStatus(id, newStatus, reason, member);
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalStateException e) {
            log.error("발주 상태 변경 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("발주 상태 변경 중 오류 발생", e);
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