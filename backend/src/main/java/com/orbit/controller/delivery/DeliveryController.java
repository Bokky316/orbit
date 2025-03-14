package com.orbit.controller.delivery;

import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.dto.delivery.DeliveryRequestDto;
import com.orbit.dto.delivery.DeliveryResponseDto;
import com.orbit.dto.delivery.DeliveryUpdateRequest;
import com.orbit.service.delivery.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@Tag(name = "입고 관리", description = "입고 관련 API")
public class DeliveryController {

    private final DeliveryService deliveryService;

    @Operation(summary = "입고 목록 조회", description = "조건에 맞는 입고 목록을 페이징하여 조회합니다.")
    @GetMapping
    public ResponseEntity<List<DeliveryResponseDto>> getDeliveryList(
            @RequestParam(required = false) String deliveryNumber,
            @RequestParam(required = false) String orderNumber,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long receiverId,
            @RequestParam(required = false) String deliveryItemId,
            @PageableDefault(size = 10) Pageable pageable) {

        Page<DeliveryResponseDto> result = deliveryService.getDeliveryList(
                deliveryNumber, orderNumber, supplierId, startDate, endDate, receiverId, deliveryItemId, pageable);

        return ResponseEntity.ok(result.getContent());
    }

    @Operation(summary = "발주번호로 발주 상세 조회", description = "발주번호(orderNumber)로 발주 상세 정보를 조회합니다.")
    @GetMapping("/purchase-orders/{orderNumber}")
    public ResponseEntity<BiddingOrderDto> getOrderByOrderNumber(@PathVariable String orderNumber) {
        BiddingOrderDto orderDto = deliveryService.getOrderDetails(orderNumber);
        return ResponseEntity.ok(orderDto);
    }

//    @Operation(summary = "전체 입고 목록 조회", description = "모든 입고 목록을 조회합니다.")
//    @GetMapping("/all")
//    public ResponseEntity<ApiResponse<List<DeliveryDto.ListResponseDto>>> getAllDeliveries() {
//        List<DeliveryDto.ListResponseDto> result = deliveryService.getAllDeliveries();
//        return ResponseEntity.ok(ApiResponse.success(result));
//    }

    @Operation(summary = "미입고 발주 목록 조회", description = "아직 입고등록이 되지 않은 발주 목록을 조회합니다.")
    @GetMapping("/available-orders")
    public ResponseEntity<List<BiddingOrderDto>> getAvailableOrders() {
        List<BiddingOrderDto> result = deliveryService.getAvailableOrders();
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "이번달 입고 목록 조회", description = "이번달 입고된 목록을 조회합니다.")
    @GetMapping("/current-month")
    public ResponseEntity<List<DeliveryResponseDto>> getCurrentMonthDeliveries() {
        List<DeliveryResponseDto> result = deliveryService.getCurrentMonthDeliveries();
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "입고 상세 조회", description = "입고 ID로 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<DeliveryResponseDto> getDelivery(@PathVariable("id") Long id) {
        DeliveryResponseDto result = deliveryService.getDelivery(id);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "입고번호로 조회", description = "입고번호로 입고 정보를 조회합니다.")
    @GetMapping("/number/{deliveryNumber}")
    public ResponseEntity<DeliveryResponseDto> getDeliveryByNumber(
            @PathVariable("deliveryNumber") String deliveryNumber) {
        DeliveryResponseDto result = deliveryService.getDeliveryByNumber(deliveryNumber);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "입고 등록", description = "새로운 입고를 등록합니다. 자동으로 검수도 완료 처리됩니다.")
    @PostMapping
    public ResponseEntity<DeliveryResponseDto> createDelivery(
            @Valid @RequestBody DeliveryRequestDto requestDto) {
        DeliveryResponseDto result = deliveryService.createDelivery(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @Operation(summary = "입고 수정", description = "기존 입고 정보를 수정합니다.")
    @PutMapping("/{id}")
    public ResponseEntity<DeliveryResponseDto> updateDelivery(
            @PathVariable("id") Long id,
            @Valid @RequestBody DeliveryUpdateRequest requestDto) {
        DeliveryResponseDto result = deliveryService.updateDelivery(id, requestDto);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "입고 삭제", description = "입고 정보를 삭제합니다. 관련된 검수 정보도 함께 삭제됩니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable("id") Long id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.ok().build();
    }
}