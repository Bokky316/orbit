package com.orbit.dto.payment;

import com.orbit.entity.paymant.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private Long id;
    private Long invoiceId;
    private String invoiceNumber;
    private String supplierName;
    private String contractNumber;
    private String orderNumber;
    private BigDecimal totalAmount;
    private String paymentDate;
    private String paymentMethod; // SystemStatus.method.childCode로 매핑
    private String paymentStatus; // SystemStatus.status.childCode로 매핑
    private String transactionId;
    private String notes;
    private String paymentDetails;

    // 송장 관련 추가 정보
    private String itemName;
    private Integer quantity;
    private String unit;
    private String approverName;

    // 결제 생성/수정 정보
    private String createdAt;
    private String updatedAt;

    // 결제 생성 요청 DTO
    @Data
    public static class PaymentCreateRequest {
        private Long invoiceId;
        private String paymentDate;
        private String paymentMethod; // TRANSFER, CARD, CHECK
        private String transactionId;
        private String notes;
        private String paymentDetails;
    }

    // 결제 수정 요청 DTO
    @Data
    public static class PaymentUpdateRequest {
        private String paymentDate;
        private String paymentMethod; // TRANSFER, CARD, CHECK
        private String paymentStatus; // COMPLETED, FAILED, CANCELED
        private String transactionId;
        private String notes;
        private String paymentDetails;
    }

    // Entity -> DTO 변환 메서드
    public static PaymentDto fromEntity(Payment payment) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy. MM. dd.");
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy. MM. dd. HH:mm:ss");

        PaymentDto dto = PaymentDto.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoice().getId())
                .invoiceNumber(payment.getInvoice().getInvoiceNumber())
                .totalAmount(payment.getTotalAmount())
                .paymentDate(payment.getPaymentDate().format(dateFormatter))
                .paymentMethod(payment.getMethod() != null ? payment.getMethod().getChildCode() : null)
                .paymentStatus(payment.getStatus() != null ? payment.getStatus().getChildCode() : null)
                .transactionId(payment.getTransactionId())
                .notes(payment.getNotes())
                .paymentDetails(payment.getPaymentDetails())
                .createdAt(payment.getCreatedAt().format(dateTimeFormatter))
                .updatedAt(payment.getUpdatedAt().format(dateTimeFormatter))
                .build();

        // 송장 정보 추가
        if (payment.getInvoice() != null) {
            dto.setSupplierName(payment.getInvoice().getSupplier().getName());
            dto.setContractNumber(payment.getInvoice().getContractNumber());
            dto.setOrderNumber(payment.getInvoice().getDelivery() != null ?
                    payment.getInvoice().getDelivery().getOrderNumber() : null);
            dto.setItemName(payment.getInvoice().getItemName());
            dto.setQuantity(payment.getInvoice().getQuantity());
            dto.setUnit(payment.getInvoice().getUnit());

            if (payment.getInvoice().getApprover() != null) {
                dto.setApproverName(payment.getInvoice().getApprover().getName());
            }
        }

        return dto;
    }
}