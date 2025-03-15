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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingOrderService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/supplier/orders")
@RequiredArgsConstructor
public class SupplierOrderController {
    private final BiddingOrderService orderService;
    private final MemberRepository memberRepository;
    
    /**
     * 공급업체의 주문 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingOrderDto>> getSupplierOrders(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("공급업체 주문 목록 조회 요청");
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            List<BiddingOrderDto> orders = orderService.getOrdersBySupplierId(supplierId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("공급업체 주문 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 주문 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingOrderDto> getOrderDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("주문 상세 조회 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 주문 정보 조회
            BiddingOrderDto order = orderService.getOrderById(id);
            
            // 해당 공급업체의 주문인지 확인
            if (!supplierId.equals(order.getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("주문 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 납품 예정일 업데이트
     */
    @PutMapping("/{id}/update-delivery-date")
    public ResponseEntity<BiddingOrderDto> updateDeliveryDate(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newDeliveryDate,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("납품 예정일 업데이트 요청 - ID: {}, 예정일: {}", id, newDeliveryDate);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 주문 정보 조회
            BiddingOrderDto order = orderService.getOrderById(id);
            
            // 해당 공급업체의 주문인지 확인
            if (!supplierId.equals(order.getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // 납품 예정일 업데이트
            BiddingOrderDto updatedOrder = orderService.updateDeliveryDate(id, newDeliveryDate, supplier.getId());
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            log.error("납품 예정일 업데이트 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 주문 상태 업데이트 (배송 시작, 배송 완료 등)
     */
    @PutMapping("/{id}/update-status")
    public ResponseEntity<BiddingOrderDto> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String comment,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("주문 상태 업데이트 요청 - ID: {}, 상태: {}", id, status);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 주문 정보 조회
            BiddingOrderDto order = orderService.getOrderById(id);
            
            // 해당 공급업체의 주문인지 확인
            if (!supplierId.equals(order.getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // TODO: 주문 상태 업데이트 서비스 메서드 구현 필요
            // BiddingOrderDto updatedOrder = orderService.updateOrderStatus(id, status, comment, supplier.getId());
            
            // 임시 응답
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("주문 상태 업데이트 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 기간 내 납품 예정 주문 목록 조회
     */
    @GetMapping("/delivery-scheduled")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByDeliveryDateBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("기간 내 납품 예정 주문 목록 조회 요청 - 시작일: {}, 종료일: {}", startDate, endDate);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 공급업체의 주문 목록 조회
            List<BiddingOrderDto> allOrders = orderService.getOrdersBySupplierId(supplierId);
            
            // 납품 예정일 기간으로 필터링
            List<BiddingOrderDto> filteredOrders = allOrders.stream()
                    .filter(o -> {
                        LocalDate expectedDelivery = o.getExpectedDeliveryDate();
                        return expectedDelivery != null && 
                               !expectedDelivery.isBefore(startDate) && 
                               !expectedDelivery.isAfter(endDate);
                    })
                    .toList();
            
            return ResponseEntity.ok(filteredOrders);
        } catch (Exception e) {
            log.error("주문 목록 조회 중 오류 발생", e);
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
        
        Member member = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
        // 공급업체 역할 확인
        if (!member.getRole().equals(Member.Role.SUPPLIER)) {
            throw new IllegalArgumentException("공급업체 권한이 필요합니다.");
        }
        
        return member;
    }
}