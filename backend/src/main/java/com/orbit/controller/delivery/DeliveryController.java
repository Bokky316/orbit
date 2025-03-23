package com.orbit.controller.delivery;

import com.orbit.dto.delivery.DeliveryDto;
import com.orbit.entity.member.Member;
import com.orbit.service.delivery.DeliveryService;
import com.orbit.service.member.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final MemberService memberService;

    // @Slf4j 어노테이션이 자동으로 log 객체를 생성하므로 별도 정의 불필요

    /**
     * 입고 목록 조회
     */
    @GetMapping
    public ResponseEntity<Page<DeliveryDto.Response>> getDeliveries(
            @RequestParam(required = false) String deliveryNumber,
            @RequestParam(required = false) String orderNumber,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String supplierName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Boolean invoiceIssued,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        DeliveryDto.SearchCondition condition = DeliveryDto.SearchCondition.builder()
                .deliveryNumber(deliveryNumber)
                .orderNumber(orderNumber)
                .supplierId(supplierId)
                .supplierName(supplierName)
                .startDate(startDate)
                .endDate(endDate)
                .invoiceIssued(invoiceIssued)
                .page(page)
                .size(size)
                .build();

        Page<DeliveryDto.Response> deliveries = deliveryService.getDeliveries(condition);
        return ResponseEntity.ok(deliveries);
    }

    /**
     * 입고 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<DeliveryDto.Response> getDelivery(@PathVariable Long id) {
        DeliveryDto.Response delivery = deliveryService.getDelivery(id);
        return ResponseEntity.ok(delivery);
    }

    /**
     * 입고번호로 조회
     */
    @GetMapping("/number/{deliveryNumber}")
    public ResponseEntity<DeliveryDto.Response> getDeliveryByNumber(@PathVariable String deliveryNumber) {
        DeliveryDto.Response delivery = deliveryService.getDeliveryByNumber(deliveryNumber);
        return ResponseEntity.ok(delivery);
    }

    /**
     * 발주에 대한 입고 목록 조회
     */
    @GetMapping("/order/{biddingOrderId}")
    public ResponseEntity<List<DeliveryDto.Response>> getDeliveriesByBiddingOrderId(@PathVariable Long biddingOrderId) {
        List<DeliveryDto.Response> deliveries = deliveryService.getDeliveriesByBiddingOrderId(biddingOrderId);
        return ResponseEntity.ok(deliveries);
    }

    /**
     * 입고 등록
     */
    @PostMapping
    public ResponseEntity<DeliveryDto.Response> createDelivery(
            @RequestBody DeliveryDto.Request request,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            // receiverId가 없는 경우에만 현재 인증된 사용자 ID 설정
            if (request.getReceiverId() == null && userDetails != null) {
                try {
                    Member member = memberService.findByUsername(userDetails.getUsername());
                    if (member != null) {
                        request.setReceiverId(member.getId());
                    }
                } catch (Exception e) {
                    log.warn("사용자 정보 조회 중 오류: {}", e.getMessage());
                }
            }

            // 클라이언트에서 보낸 요청 로깅
            log.info("입고 등록 요청 데이터: {}", request);

            // 서비스 호출 및 응답
            DeliveryDto.Response delivery = deliveryService.createDelivery(request);
            log.info("입고 등록 성공: {}", delivery.getDeliveryNumber());
            return ResponseEntity.status(HttpStatus.CREATED).body(delivery);
        } catch (IllegalArgumentException e) {
            log.error("입고 등록 실패 - 잘못된 요청 데이터: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            log.error("입고 등록 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * 입고 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<DeliveryDto.Response> updateDelivery(
            @PathVariable Long id,
            @RequestBody DeliveryDto.Request request) {

        DeliveryDto.Response updatedDelivery = deliveryService.updateDelivery(id, request);
        return ResponseEntity.ok(updatedDelivery);
    }

    /**
     * 입고 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable Long id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 송장 미발행 입고 목록 조회 (계약 번호 포함)
     */
    @GetMapping("/uninvoiced-with-contracts")
    public ResponseEntity<List<Map<String, Object>>> getUninvoicedDeliveriesWithContracts() {
        List<Map<String, Object>> result = deliveryService.getUninvoicedDeliveriesWithContracts();
        return ResponseEntity.ok(result);
    }
}