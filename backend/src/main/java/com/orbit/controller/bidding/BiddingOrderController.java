package com.orbit.controller.bidding;

import java.time.LocalDate;
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
import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingOrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class BiddingOrderController {
    private final BiddingOrderService orderService;
    private final MemberRepository memberRepository;
    
    /**
     * 발주 목록 조회
     */
    @PostMapping
    public ResponseEntity<BiddingOrderDto> createOrder(@Valid @RequestBody BiddingOrderDto orderDto) {
        log.info("발주 생성 요청");
        BiddingOrderDto createdOrder = biddingOrderService.createOrder(orderDto);
        return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
    }
    @GetMapping
    public ResponseEntity<List<BiddingOrderDto>> getAllOrders() {
        log.info("발주 목록 조회 요청");
        
        try {
            List<BiddingOrderDto> orders = orderService.getAllOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 입찰 공고의 발주 목록 조회
     */
    @GetMapping("/bidding/{biddingId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByBiddingId(@PathVariable Long biddingId) {
        log.info("특정 입찰 공고의 발주 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingOrderDto> orders = orderService.getOrdersByBiddingId(biddingId);
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
     * 발주 번호로 발주 조회
     */
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<BiddingOrderDto> getOrderByOrderNumber(@PathVariable String orderNumber) {
        log.info("발주 번호로 발주 조회 요청 - 발주번호: {}", orderNumber);
        
        try {
            BiddingOrderDto order = orderService.getOrderByOrderNumber(orderNumber);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("발주 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 기간 내 납품 예정 발주 목록 조회
     */
    @GetMapping("/delivery-date")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByDeliveryDateBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        log.info("기간 내 납품 예정 발주 목록 조회 요청 - 시작일: {}, 종료일: {}", startDate, endDate);
        
        try {
            List<BiddingOrderDto> orders = orderService.getOrdersByDeliveryDateBetween(startDate, endDate);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

   
    /**
     * 승인된 발주 목록 조회
     */
    @GetMapping("/approved")
    public ResponseEntity<List<BiddingOrderDto>> getApprovedOrders() {
        log.info("승인된 발주 목록 조회 요청");
        
        try {
            List<BiddingOrderDto> orders = orderService.getApprovedOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 승인되지 않은 발주 목록 조회
     */
    @GetMapping("/unapproved")
    public ResponseEntity<List<BiddingOrderDto>> getUnapprovedOrders() {
        log.info("승인되지 않은 발주 목록 조회 요청");
        
        try {
            List<BiddingOrderDto> orders = orderService.getUnapprovedOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 생성
     */
    @PostMapping
    public ResponseEntity<BiddingOrderDto> createOrder(
            @Valid @RequestBody BiddingOrderDto orderDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("발주 생성 요청 - 제목: {}", orderDto.getTitle());
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingOrderDto createdOrder = orderService.createOrder(orderDto, member.getId());
            return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("발주 생성 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 정보 업데이트
     */
    @PutMapping("/{id}")
    public ResponseEntity<BiddingOrderDto> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody BiddingOrderDto orderDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("발주 정보 업데이트 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingOrderDto updatedOrder = orderService.updateOrder(id, orderDto);
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalStateException e) {
            log.error("발주 업데이트 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("발주 업데이트 중 오류 발생", e);
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
            
            // TODO: 권한 체크 로직 추가 (승인권자만 가능하도록)
            
            BiddingOrderDto approvedOrder = orderService.approveOrder(id, member.getId());
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
     * 납품 예정일 업데이트
     */
    @PutMapping("/{id}/delivery-date")
    public ResponseEntity<BiddingOrderDto> updateDeliveryDate(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newDeliveryDate,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("납품 예정일 업데이트 요청 - ID: {}, 예정일: {}", id, newDeliveryDate);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자, 공급자 또는 관리자만 가능하도록)
            
            BiddingOrderDto updatedOrder = orderService.updateDeliveryDate(id, newDeliveryDate, member.getId());
            return ResponseEntity.ok(updatedOrder);
        } catch (Exception e) {
            log.error("납품 예정일 업데이트 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 참여에 대한 발주 조회
     */
    @GetMapping("/participation/{participationId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByParticipationId(@PathVariable Long participationId) {
        log.info("특정 참여에 대한 발주 조회 요청 - 참여 ID: {}", participationId);
        
        try {
            List<BiddingOrderDto> orders = orderService.getOrdersByParticipationId(participationId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 평가에 대한 발주 조회
     */
    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<BiddingOrderDto>> getOrdersByEvaluationId(@PathVariable Long evaluationId) {
        log.info("특정 평가에 대한 발주 조회 요청 - 평가 ID: {}", evaluationId);
        
        try {
            List<BiddingOrderDto> orders = orderService.getOrdersByEvaluationId(evaluationId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            log.error("발주 목록 조회 중 오류 발생", e);
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
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingOrderDto cancelledOrder = orderService.cancelOrder(id, reason, member.getId());
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
     * UserDetails로부터 Member 객체 조회
     */
    private Member getUserFromUserDetails(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("인증된 사용자 정보가 필요합니다.");
        }
        
        return memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
    }

    /**
     * 입고되지 않은 발주 목록 조회
     */
    @GetMapping("/unreceived")
    public ResponseEntity<List<BiddingOrderDto>> getUnreceivedBiddingOrders() {
        List<BiddingOrderDto> orders = orderService.getUnreceivedBiddingOrders();
        return ResponseEntity.ok(orders);
    }

    /**
     * 특정 발주 상세 정보 조회
     */
    @GetMapping("/{biddingOrderId}")
    public ResponseEntity<BiddingOrderDto> getBiddingOrderDetail(@PathVariable Long biddingOrderId) {
        BiddingOrderDto order = orderService.getBiddingOrderDetail(biddingOrderId);
        return ResponseEntity.ok(order);
    }
}