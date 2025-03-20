package com.orbit.controller.invoice;

import com.orbit.dto.delivery.DeliveryDto;
import com.orbit.dto.invoice.InvoiceDto;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.invoice.Invoice;
import com.orbit.entity.member.Member;
import com.orbit.service.delivery.DeliveryService;
import com.orbit.service.invoice.InvoiceService;
import com.orbit.service.member.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final DeliveryService deliveryService;
    private final MemberService memberService;

    // 전체 송장 목록 조회
    @GetMapping
    public ResponseEntity<List<InvoiceDto>> getAllInvoices() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        List<InvoiceDto> invoiceDtos = invoices.stream()
                .map(InvoiceDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoiceDtos);
    }

    // 특정 송장 ID로 송장 조회
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDto> getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id)
                .map(InvoiceDto::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 입고 ID로 송장 생성
    @PostMapping("/from-delivery/{deliveryId}")
    public ResponseEntity<InvoiceDto> createInvoiceFromDelivery(@PathVariable Long deliveryId) {
        try {
            Delivery delivery = deliveryService.getDeliveryById(deliveryId)
                    .orElseThrow(() -> new RuntimeException("입고 정보를 찾을 수 없습니다."));

            if (delivery.getInvoiceIssued()) {
                return ResponseEntity.badRequest().body(null);
            }

            Member supplier = memberService.findById(delivery.getSupplierId());

            Invoice invoice = new Invoice();
            invoice.setFromDelivery(delivery, supplier);

            Invoice savedInvoice = invoiceService.createInvoice(invoice);

            delivery.setInvoiceIssued(true);
            DeliveryDto.Request request = new DeliveryDto.Request();
            request.setDeliveryDate(delivery.getDeliveryDate());
            request.setItemQuantity(delivery.getItemQuantity());
            deliveryService.updateDelivery(delivery.getId(), request);

            return ResponseEntity.status(HttpStatus.CREATED).body(InvoiceDto.fromEntity(savedInvoice));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 송장 수정 API
    @PutMapping("/{id}")
    public ResponseEntity<InvoiceDto> updateInvoice(
            @PathVariable Long id,
            @RequestBody InvoiceDto.InvoiceUpdateDto updateDto) {

        try {
            Invoice invoice = invoiceService.getInvoiceById(id)
                    .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다."));

            if (updateDto.getContractNumber() != null) {
                invoice.setContractNumber(updateDto.getContractNumber());
            }
            if (updateDto.getTransactionNumber() != null) {
                invoice.setTransactionNumber(updateDto.getTransactionNumber());
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            if (updateDto.getIssueDate() != null) {
                invoice.setIssueDate(LocalDate.parse(updateDto.getIssueDate(), formatter));
            }
            if (updateDto.getDueDate() != null) {
                invoice.setDueDate(LocalDate.parse(updateDto.getDueDate(), formatter));
            }

            if (updateDto.getNotes() != null) {
                invoice.setNotes(updateDto.getNotes());
            }
            if (updateDto.getStatus() != null) {
                invoice.setStatus(new SystemStatus("INVOICE", updateDto.getStatus()));
            }

            Invoice updatedInvoice = invoiceService.createInvoice(invoice);
            return ResponseEntity.ok(InvoiceDto.fromEntity(updatedInvoice));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 송장 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        try {
            invoiceService.deleteInvoice(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 송장 목록 페이징/검색/정렬 조회
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getFilteredInvoices(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Invoice> invoicesPage = invoiceService.getFilteredInvoices(status, searchTerm, pageable);
        Page<InvoiceDto> invoiceDtos = invoicesPage.map(InvoiceDto::fromEntity);

        InvoiceService.InvoiceStatistics statistics = invoiceService.getInvoiceStatistics();

        Map<String, Object> response = Map.of(
                "invoices", invoiceDtos.getContent(),
                "currentPage", invoiceDtos.getNumber(),
                "totalItems", invoiceDtos.getTotalElements(),
                "totalPages", invoiceDtos.getTotalPages(),
                "statistics", statistics
        );

        return ResponseEntity.ok(response);
    }

    // 송장 상태별 통계 조회
    @GetMapping("/statistics")
    public ResponseEntity<InvoiceService.InvoiceStatistics> getInvoiceStatistics() {
        InvoiceService.InvoiceStatistics statistics = invoiceService.getInvoiceStatistics();
        return ResponseEntity.ok(statistics);
    }

    // 송장 결제 완료 처리
    @PutMapping("/{id}/payment-complete")
    public ResponseEntity<InvoiceDto> markAsPaid(@PathVariable Long id) {
        try {
            Invoice invoice = invoiceService.getInvoiceById(id)
                    .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다."));

            invoice.setStatus(new SystemStatus("INVOICE", "PAID"));
            invoice.setPaymentDate(java.time.LocalDate.now());

            Invoice updatedInvoice = invoiceService.createInvoice(invoice);

            return ResponseEntity.ok(InvoiceDto.fromEntity(updatedInvoice));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 송장 승인 처리
    @PutMapping("/{id}/approve")
    public ResponseEntity<InvoiceDto> approveInvoice(@PathVariable Long id) {
        try {
            Invoice invoice = invoiceService.getInvoiceById(id)
                    .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다."));

            invoice.setStatus(new SystemStatus("INVOICE", "APPROVED"));

            Invoice updatedInvoice = invoiceService.createInvoice(invoice);

            return ResponseEntity.ok(InvoiceDto.fromEntity(updatedInvoice));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 송장 거부 처리
    @PutMapping("/{id}/reject")
    public ResponseEntity<InvoiceDto> rejectInvoice(@PathVariable Long id) {
        try {
            Invoice invoice = invoiceService.getInvoiceById(id)
                    .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다."));

            invoice.setStatus(new SystemStatus("INVOICE", "REJECTED"));

            Invoice updatedInvoice = invoiceService.createInvoice(invoice);

            return ResponseEntity.ok(InvoiceDto.fromEntity(updatedInvoice));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
