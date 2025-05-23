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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
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

            // 재무회계팀(username이 004로 시작하는) 담당자 랜덤 배정
            List<Member> financeTeamMembers = memberService.findByUsernameStartingWith("004");

            if (!financeTeamMembers.isEmpty()) {
                // 랜덤으로 한 명 선택하여 담당자로 지정
                int randomIndex = new Random().nextInt(financeTeamMembers.size());
                Member assignedApprover = financeTeamMembers.get(randomIndex);

                // 송장에 담당자 정보 설정
                invoice.setApprover(assignedApprover);

                System.out.println("송장 담당자 자동 배정: " + assignedApprover.getName() + " (ID: " + assignedApprover.getId() + ")");
            } else {
                System.out.println("경고: 재무회계팀 담당자가 없어 담당자 자동 배정 실패");
            }

            Invoice savedInvoice = invoiceService.createInvoice(invoice);

            delivery.setInvoiceIssued(true);
            DeliveryDto.Request request = new DeliveryDto.Request();
            request.setDeliveryDate(delivery.getDeliveryDate());
            request.setItemQuantity(delivery.getItemQuantity());
            deliveryService.updateDelivery(delivery.getId(), request);

            return ResponseEntity.status(HttpStatus.CREATED).body(InvoiceDto.fromEntity(savedInvoice));
        } catch (Exception e) {
            e.printStackTrace();
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
            // 송장 삭제 전에 송장 정보 조회
            Optional<Invoice> invoiceOpt = invoiceService.getInvoiceById(id);
            if (invoiceOpt.isPresent()) {
                Invoice invoice = invoiceOpt.get();
                Long deliveryId = invoice.getDelivery().getId();

                // 송장 삭제
                invoiceService.deleteInvoice(id);

                // 입고의 invoiceIssued 상태를 false로 업데이트
                Optional<Delivery> deliveryOpt = deliveryService.getDeliveryById(deliveryId);
                if (deliveryOpt.isPresent()) {
                    Delivery delivery = deliveryOpt.get();
                    delivery.setInvoiceIssued(false);

                    DeliveryDto.Request request = new DeliveryDto.Request();
                    request.setDeliveryDate(delivery.getDeliveryDate());
                    request.setItemQuantity(delivery.getItemQuantity());
                    deliveryService.updateDelivery(delivery.getId(), request);

                    System.out.println("송장 삭제 후 입고 상태 업데이트 완료: " + deliveryId);
                }

                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
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
    public ResponseEntity<InvoiceDto> approveInvoice(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> approverInfo) {
        try {
            Invoice invoice = invoiceService.getInvoiceById(id)
                    .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다."));

            invoice.setStatus(new SystemStatus("INVOICE", "APPROVED"));

            // 승인자 정보 설정
            if (approverInfo != null && approverInfo.containsKey("approverId")) {
                Long approverId = Long.valueOf(approverInfo.get("approverId").toString());
                Member approver = memberService.findById(approverId);
                if (approver != null) {
                    invoice.setApprover(approver);
                    invoice.setApprovedAt(LocalDateTime.now());
                }
            }

            Invoice updatedInvoice = invoiceService.createInvoice(invoice);

            return ResponseEntity.ok(InvoiceDto.fromEntity(updatedInvoice));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 송장 거부 처리
    @PutMapping("/{id}/reject")
    public ResponseEntity<InvoiceDto> rejectInvoice(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> approverInfo) {
        try {
            Invoice invoice = invoiceService.getInvoiceById(id)
                    .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다."));

            invoice.setStatus(new SystemStatus("INVOICE", "REJECTED"));

            // 거절자 정보 설정 (승인자와 동일한 필드 사용)
            if (approverInfo != null && approverInfo.containsKey("approverId")) {
                Long approverId = Long.valueOf(approverInfo.get("approverId").toString());
                Member approver = memberService.findById(approverId);
                if (approver != null) {
                    invoice.setApprover(approver);
                    invoice.setApprovedAt(LocalDateTime.now());
                }
            }

            Invoice updatedInvoice = invoiceService.createInvoice(invoice);

            return ResponseEntity.ok(InvoiceDto.fromEntity(updatedInvoice));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 담당자별 송장 목록 페이징/검색/정렬 조회
    @GetMapping("/list/approver/{approverId}")
    public ResponseEntity<Map<String, Object>> getFilteredInvoicesByApprover(
            @PathVariable Long approverId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "issueDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Invoice> invoicesPage = invoiceService.getFilteredInvoicesByApprover(status, searchTerm, approverId, pageable);
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
}