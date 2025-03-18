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
    private Long supplierId;
    private String supplierName;
    private String supplierContactPerson;
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
    private String status; // childCode만 사용
    private String notes;

    // Entity -> DTO 변환
    public static InvoiceDto fromEntity(Invoice invoice) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy. MM. dd.");

        InvoiceDto dto = InvoiceDto.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .contractNumber(invoice.getContractNumber())
                .transactionNumber(invoice.getTransactionNumber())
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

        // 결제일 추가
        if (invoice.getPaymentDate() != null) {
            dto.setPaymentDate(invoice.getPaymentDate().format(formatter));
        }

        // 입고 정보 추가
        if (invoice.getDelivery() != null) {
            dto.setDeliveryId(invoice.getDelivery().getId());
            dto.setDeliveryNumber(invoice.getDelivery().getDeliveryNumber());
        }

        // 공급업체 정보 추가
        if (invoice.getSupplier() != null) {
            dto.setSupplierId(invoice.getSupplier().getId());
            dto.setSupplierName(invoice.getSupplier().getName());

            // Member 엔티티 구조에 따라 필드명 조정 필요
            dto.setSupplierContactPerson(invoice.getSupplier().getName());
            dto.setSupplierEmail(invoice.getSupplier().getEmail());
            dto.setSupplierPhone(invoice.getSupplier().getContactNumber());

            // 주소 조합 (Member 엔티티 구조에 따라 조정)
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
