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

@Slf4j
@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final MemberService memberService;

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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        DeliveryDto.SearchCondition condition = DeliveryDto.SearchCondition.builder()
                .deliveryNumber(deliveryNumber)
                .orderNumber(orderNumber)
                .supplierId(supplierId)
                .supplierName(supplierName)
                .startDate(startDate)
                .endDate(endDate)
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
            // ✅ `getUserFromUserDetails()`를 사용해서 안전하게 사용자 조회
            Member member = getUserFromUserDetails(userDetails);
            request.setReceiverId(member.getId());

            DeliveryDto.Response delivery = deliveryService.createDelivery(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(delivery);
        } catch (IllegalArgumentException e) {
            log.error("입고 등록 실패 - 사용자 정보 없음: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        } catch (Exception e) {
            log.error("입고 등록 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // ✅ 안전한 사용자 조회 메서드 추가
    private Member getUserFromUserDetails(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("인증된 사용자 정보가 필요합니다.");
        }

        return memberService.findByUsername(userDetails.getUsername());
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
}