package com.orbit.dto.invoice;

import com.orbit.entity.invoice.Invoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDto {
    private Long id;
    private String invoiceNumber;
    private String contractNumber;
    private String transactionNumber;
    private String paymentDate;
    private Long deliveryId;
    private String deliveryNumber;
    private String userName;  // 공급자 username
    private String supplierName;  // 공급업체명
    private String supplierContactPerson;  // 담당자명
    private String supplierEmail;
    private String supplierPhone;
    private String supplierAddress;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    private String issueDate;
    private String dueDate;
    private String itemName;
    private String itemSpecification;
    private Integer quantity;
    private BigDecimal unitPrice;
    private String unit;
    private String status; // 상태 코드 (WAITING, PAID, OVERDUE)
    private String notes;
    private String orderNumber;

    // 송장 수정 시 사용되는 DTO
    @Data
    public static class InvoiceUpdateDto {
        private String contractNumber;
        private String transactionNumber;
        private String issueDate;
        private String dueDate;
        private String notes;
        private String status;
    }

    // Entity -> DTO 변환 메서드
    public static InvoiceDto fromEntity(Invoice invoice) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy. MM. dd.");

        InvoiceDto dto = InvoiceDto.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .contractNumber(invoice.getContractNumber())
                .transactionNumber(invoice.getTransactionNumber())
                .orderNumber(invoice.getDelivery() != null ? invoice.getDelivery().getOrderNumber() : null)
                .supplyPrice(invoice.getSupplyPrice())
                .vat(invoice.getVat())
                .totalAmount(invoice.getTotalAmount())
                .issueDate(invoice.getIssueDate().format(formatter))
                .dueDate(invoice.getDueDate().format(formatter))
                .itemName(invoice.getItemName())
                .itemSpecification(invoice.getItemSpecification())
                .quantity(invoice.getQuantity())
                .unitPrice(invoice.getUnitPrice())
                .unit(invoice.getUnit())
                .status(invoice.getStatus().getChildCode())
                .notes(invoice.getNotes())
                .build();

        if (invoice.getPaymentDate() != null) {
            dto.setPaymentDate(invoice.getPaymentDate().format(formatter));
        }

        if (invoice.getDelivery() != null) {
            dto.setDeliveryId(invoice.getDelivery().getId());
            dto.setDeliveryNumber(invoice.getDelivery().getDeliveryNumber());
        }

        if (invoice.getSupplier() != null) {
            dto.setUserName(invoice.getSupplier().getUsername());
            dto.setSupplierName(invoice.getSupplier().getCompanyName());
            dto.setSupplierContactPerson(invoice.getSupplier().getName());
            dto.setSupplierEmail(invoice.getSupplier().getEmail());
            dto.setSupplierPhone(invoice.getSupplier().getContactNumber());

            String fullAddress = "";
            if (invoice.getSupplier().getRoadAddress() != null) {
                fullAddress = invoice.getSupplier().getRoadAddress();
                if (invoice.getSupplier().getDetailAddress() != null) {
                    fullAddress += " " + invoice.getSupplier().getDetailAddress();
                }
            }
            dto.setSupplierAddress(fullAddress);
        }

        return dto;
    }
}
