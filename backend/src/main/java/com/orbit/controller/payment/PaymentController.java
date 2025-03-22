package com.orbit.controller.payment;

import com.orbit.dto.payment.PaymentDto;
import com.orbit.entity.member.Member;
import com.orbit.service.member.MemberService;
import com.orbit.service.payment.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final MemberService memberService;

    /**
     * 모든 결제 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<PaymentDto>> getAllPayments() {
        List<PaymentDto> payments = paymentService.getAllPayments();
        return ResponseEntity.ok(payments);
    }

    /**
     * ID로 결제 정보 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto> getPaymentById(@PathVariable Long id) {
        return paymentService.getPaymentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 송장 ID로 결제 정보 조회
     */
    @GetMapping("/by-invoice/{invoiceId}")
    public ResponseEntity<PaymentDto> getPaymentByInvoiceId(@PathVariable Long invoiceId) {
        return paymentService.getPaymentByInvoiceId(invoiceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 새 결제 정보 생성
     */
    @PostMapping
    public ResponseEntity<PaymentDto> createPayment(@RequestBody PaymentDto.PaymentCreateRequest request) {
        try {
            PaymentDto payment = paymentService.createPayment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 결제 정보 업데이트
     */
    @PutMapping("/{id}")
    public ResponseEntity<PaymentDto> updatePayment(
            @PathVariable Long id,
            @RequestBody PaymentDto.PaymentUpdateRequest request) {
        try {
            PaymentDto updatedPayment = paymentService.updatePayment(id, request);
            return ResponseEntity.ok(updatedPayment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 결제 정보 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 결제 목록 페이징/검색/정렬 조회
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getFilteredPayments(
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PaymentDto> paymentsPage = paymentService.getFilteredPayments(
                method, status, searchTerm, supplierId, pageable);

        PaymentService.PaymentStatistics statistics = paymentService.getPaymentStatistics();

        Map<String, Object> response = Map.of(
                "payments", paymentsPage.getContent(),
                "currentPage", paymentsPage.getNumber(),
                "totalItems", paymentsPage.getTotalElements(),
                "totalPages", paymentsPage.getTotalPages(),
                "statistics", statistics
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 결제 상태별 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<PaymentService.PaymentStatistics> getPaymentStatistics() {
        PaymentService.PaymentStatistics statistics = paymentService.getPaymentStatistics();
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 송장에 대한 결제 생성 (직접 호출 API)
     */
    @PostMapping("/process-invoice/{invoiceId}")
    public ResponseEntity<PaymentDto> processInvoicePayment(
            @PathVariable Long invoiceId,
            @RequestBody Map<String, Object> paymentInfo) {
        try {
            // 기본 결제 정보 설정
            PaymentDto.PaymentCreateRequest request = new PaymentDto.PaymentCreateRequest();
            request.setInvoiceId(invoiceId);
            
            if (paymentInfo.containsKey("paymentDate")) {
                request.setPaymentDate(paymentInfo.get("paymentDate").toString());
            }
            
            if (paymentInfo.containsKey("paymentMethod")) {
                request.setPaymentMethod(paymentInfo.get("paymentMethod").toString());
            } else {
                request.setPaymentMethod("계좌이체"); // 기본값
            }
            
            if (paymentInfo.containsKey("transactionId")) {
                request.setTransactionId(paymentInfo.get("transactionId").toString());
            } else {
                // 임의의 거래 ID 생성
                String randomId = "TRX-" + System.currentTimeMillis();
                request.setTransactionId(randomId);
            }
            
            if (paymentInfo.containsKey("notes")) {
                request.setNotes(paymentInfo.get("notes").toString());
            }
            
            // 결제 처리
            PaymentDto payment = paymentService.createPayment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(payment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}