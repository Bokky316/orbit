package com.orbit.dto.delivery;

import com.orbit.entity.delivery.Delivery;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DeliveryDto {

    /**
     * 입고 등록 요청 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Long biddingOrderId;              // 발주 ID
        private Long purchaseRequestItemId;       // 구매요청품목 ID
        private Long deliveryItemId;              // 입고 품목 ID
        private Long receiverId;                  // 입고 담당자 ID
        private String receiverName;              // 입고 담당자명
        private Long supplierId;                  // 공급업체 ID
        private String supplierName;              // 공급업체명
        private LocalDate deliveryDate;           // 입고일
        private String notes;                     // 비고
        private Integer itemQuantity;             // 입고수량
    }

    /**
     * 입고 응답 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String deliveryNumber;            // 입고번호
        private Long biddingOrderId;              // 발주 ID
        private String orderNumber;               // 발주번호
        private String contractNumber;            // 계약번호
        private Long supplierId;                  // 공급업체 ID
        private String supplierName;              // 공급업체명
        private LocalDate deliveryDate;           // 입고일
        private Long receiverId;                  // 입고 담당자 ID
        private String receiverName;              // 입고 담당자명
        private String notes;                     // 비고
        private BigDecimal totalAmount;           // 총 금액
        private Long deliveryItemId;              // 입고 품목 ID (명시적 추가)
        private String itemName;                  // 품목명
        private String itemSpecification;         // 품목 규격
        private Integer itemQuantity;             // 수량
        private BigDecimal itemUnitPrice;         // 단가
        private String itemUnit;                  // 단위
        private LocalDateTime createdAt;          // 생성일시
        private Boolean invoiceIssued;          // 송장 발행 여부

        public static Response fromEntity(Delivery entity) {
            Response response = Response.builder()
                    .id(entity.getId())
                    .deliveryNumber(entity.getDeliveryNumber())
                    .biddingOrderId(entity.getBiddingOrder() != null ? entity.getBiddingOrder().getId() : null)
                    .orderNumber(entity.getOrderNumber())
                    .supplierId(entity.getSupplierId())
                    .supplierName(entity.getSupplierName())
                    .deliveryDate(entity.getDeliveryDate())
                    .receiverId(entity.getReceiver() != null ? entity.getReceiver().getId() : null)
                    .receiverName(entity.getReceiver() != null ? entity.getReceiver().getName() : null)
                    .notes(entity.getNotes())
                    .totalAmount(entity.getTotalAmount())
                    .itemName(entity.getItemName())
                    .itemSpecification(entity.getItemSpecification())
                    .itemQuantity(entity.getItemQuantity())
                    .itemUnitPrice(entity.getItemUnitPrice())
                    .itemUnit(entity.getItemUnit())
                    .createdAt(entity.getRegTime())
                    .invoiceIssued(entity.getInvoiceIssued())
                    .build();

            // 품목 ID 설정 (purchaseRequestItem이 있으면 그 ID 사용, 없으면 deliveryItemId 사용)
            if (entity.getPurchaseRequestItem() != null) {
                response.setDeliveryItemId(entity.getPurchaseRequestItem().getId());
            } else {
                response.setDeliveryItemId(entity.getDeliveryItemId());
            }

            return response;
        }
    }

    /**
     * 입고 검색 조건 DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchCondition {
        private String deliveryNumber;            // 입고번호
        private String orderNumber;               // 발주번호
        private Long supplierId;                  // 공급업체 ID
        private String supplierName;              // 공급업체명
        private LocalDate startDate;              // 시작일
        private LocalDate endDate;                // 종료일
        private Boolean invoiceIssued;      // 송장 발행 여부
        private int page;                         // 페이지
        private int size;                         // 페이지 크기
    }
}