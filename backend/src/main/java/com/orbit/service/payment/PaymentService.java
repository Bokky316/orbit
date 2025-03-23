package com.orbit.service.payment;

import com.orbit.dto.payment.PaymentDto;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.invoice.Invoice;
import com.orbit.entity.paymant.Payment;
import com.orbit.repository.invoice.InvoiceRepository;
import com.orbit.repository.payment.PaymentRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * 모든 결제 정보 조회
     */
    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(PaymentDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * ID로 결제 정보 조회
     */
    public Optional<PaymentDto> getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .map(PaymentDto::fromEntity);
    }

    /**
     * 송장 ID로 결제 정보 조회
     */
    public Optional<PaymentDto> getPaymentByInvoiceId(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId)
                .map(PaymentDto::fromEntity);
    }

    /**
     * 새 결제 정보 생성
     */
    @Transactional
    public PaymentDto createPayment(PaymentDto.PaymentCreateRequest request) {
        // 송장 정보 조회
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다: " + request.getInvoiceId()));

        // 이미 결제가 있는지 확인
        if (paymentRepository.findByInvoiceId(request.getInvoiceId()).isPresent()) {
            throw new RuntimeException("이 송장에 대한 결제가 이미 존재합니다: " + request.getInvoiceId());
        }

        // 결제 엔티티 생성 및 정보 설정
        Payment payment = new Payment();
        payment.setFromInvoice(invoice);

        // DateTimeFormatter 초기화
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // 요청에서 필드 설정
        if (request.getPaymentDate() != null && !request.getPaymentDate().isEmpty()) {
            payment.setPaymentDate(LocalDate.parse(request.getPaymentDate(), formatter));
        }

        if (request.getPaymentMethod() != null) {
            // 결제 방법 설정 (SystemStatus 사용)
            payment.setMethod(new SystemStatus("PAYMENT", request.getPaymentMethod()));
        } else {
            // 기본값: 계좌이체
            payment.setMethod(new SystemStatus("PAYMENT", "TRANSFER"));
        }

        // 상태는 완료(COMPLETED)로 설정
        payment.setStatus(new SystemStatus("PAYMENT", "COMPLETED"));
        payment.setTransactionId(request.getTransactionId());
        payment.setNotes(request.getNotes());
        payment.setPaymentDetails(request.getPaymentDetails());

        // 결제 정보 저장
        Payment savedPayment = paymentRepository.save(payment);

        // 송장 상태 업데이트 (PAID로 변경)
        invoice.setStatus(new SystemStatus("INVOICE", "PAID"));
        invoice.setPaymentDate(payment.getPaymentDate());
        invoiceRepository.save(invoice);

        return PaymentDto.fromEntity(savedPayment);
    }

    /**
     * 결제 정보 업데이트
     */
    @Transactional
    public PaymentDto updatePayment(Long id, PaymentDto.PaymentUpdateRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("결제 정보를 찾을 수 없습니다: " + id));

        // DateTimeFormatter 초기화
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // 요청에서 필드 설정
        if (request.getPaymentDate() != null && !request.getPaymentDate().isEmpty()) {
            payment.setPaymentDate(LocalDate.parse(request.getPaymentDate(), formatter));
        }

        if (request.getPaymentMethod() != null) {
            // 결제 방법 설정 (SystemStatus 사용)
            payment.setMethod(new SystemStatus("PAYMENT", request.getPaymentMethod()));
        }

        if (request.getPaymentStatus() != null) {
            // 상태 코드 업데이트 (SystemStatus 사용)
            payment.setStatus(new SystemStatus("PAYMENT", request.getPaymentStatus()));

            // 결제 상태가 변경되면 송장 상태도 업데이트
            Invoice invoice = payment.getInvoice();
            if ("COMPLETED".equals(request.getPaymentStatus())) {
                invoice.setStatus(new SystemStatus("INVOICE", "PAID"));
            } else if ("CANCELED".equals(request.getPaymentStatus())) {
                invoice.setStatus(new SystemStatus("INVOICE", "WAITING"));
                invoice.setPaymentDate(null);
            }
            invoiceRepository.save(invoice);
        }

        payment.setTransactionId(request.getTransactionId());
        payment.setNotes(request.getNotes());
        payment.setPaymentDetails(request.getPaymentDetails());

        // 결제 정보 저장
        Payment updatedPayment = paymentRepository.save(payment);
        return PaymentDto.fromEntity(updatedPayment);
    }

    /**
     * 결제 정보 삭제 (주의: 송장 상태도 업데이트 필요)
     */
    @Transactional
    public void deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("결제 정보를 찾을 수 없습니다: " + id));

        // 송장 상태를 WAITING으로 되돌림
        Invoice invoice = payment.getInvoice();
        invoice.setStatus(new SystemStatus("INVOICE", "WAITING"));
        invoice.setPaymentDate(null);
        invoiceRepository.save(invoice);

        // 결제 정보 삭제
        paymentRepository.deleteById(id);
    }

    /**
     * 페이징 및 정렬, 필터링을 적용한 결제 목록 조회
     */
    public Page<PaymentDto> getFilteredPayments(
            String method, String status, String searchTerm, Long supplierId, Pageable pageable) {

        Page<Payment> paymentsPage;

        // 공급업체 ID로 필터링
        if (supplierId != null) {
            paymentsPage = paymentRepository.findBySupplier(supplierId, pageable);
        }
        // 결제 방법과 검색어로 필터링
        else if (method != null && !method.isEmpty() && searchTerm != null && !searchTerm.isEmpty()) {
            paymentsPage = paymentRepository.findByMethodAndSearchTerm("PAYMENT", method, searchTerm, pageable);
        }
        // 결제 상태와 검색어로 필터링
        else if (status != null && !status.isEmpty() && searchTerm != null && !searchTerm.isEmpty()) {
            paymentsPage = paymentRepository.findByStatusAndSearchTerm("PAYMENT", status, searchTerm, pageable);
        }
        // 검색어만으로 필터링
        else if (searchTerm != null && !searchTerm.isEmpty()) {
            paymentsPage = paymentRepository.findBySearchTerm(searchTerm, pageable);
        }
        // 결제 방법만으로 필터링
        else if (method != null && !method.isEmpty()) {
            paymentsPage = paymentRepository.findByMethod("PAYMENT", method, pageable);
        }
        // 결제 상태만으로 필터링
        else if (status != null && !status.isEmpty()) {
            paymentsPage = paymentRepository.findByStatus("PAYMENT", status, pageable);
        }
        // 필터 없음
        else {
            paymentsPage = paymentRepository.findAll(pageable);
        }

        return paymentsPage.map(PaymentDto::fromEntity);
    }

    /**
     * 결제 통계 정보 조회
     */
    public PaymentStatistics getPaymentStatistics() {
        List<Payment> allPayments = paymentRepository.findAll();

        // 상태별 분류
        List<Payment> completedPayments = paymentRepository.findAllByStatus("PAYMENT", "COMPLETED");
        List<Payment> failedPayments = paymentRepository.findAllByStatus("PAYMENT", "FAILED");
        List<Payment> canceledPayments = paymentRepository.findAllByStatus("PAYMENT", "CANCELED");

        // 결제 방법별 분류
        List<Payment> transferPayments = paymentRepository.findAllByMethod("PAYMENT", "TRANSFER");
        List<Payment> cardPayments = paymentRepository.findAllByMethod("PAYMENT", "CARD");
        List<Payment> checkPayments = paymentRepository.findAllByMethod("PAYMENT", "CHECK");

        // 금액 합계 계산
        BigDecimal totalAmount = allPayments.stream()
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal completedAmount = completedPayments.stream()
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal failedAmount = failedPayments.stream()
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal canceledAmount = canceledPayments.stream()
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal transferAmount = transferPayments.stream()
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cardAmount = cardPayments.stream()
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal checkAmount = checkPayments.stream()
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 통계 객체 생성
        return PaymentStatistics.builder()
                .totalCount(allPayments.size())
                .completedCount(completedPayments.size())
                .failedCount(failedPayments.size())
                .canceledCount(canceledPayments.size())
                .transferCount(transferPayments.size())
                .cardCount(cardPayments.size())
                .checkCount(checkPayments.size())
                .totalAmount(totalAmount)
                .completedAmount(completedAmount)
                .failedAmount(failedAmount)
                .canceledAmount(canceledAmount)
                .transferAmount(transferAmount)
                .cardAmount(cardAmount)
                .checkAmount(checkAmount)
                .build();
    }

    // 내부 정적 클래스: 결제 통계 정보
    @Data
    @Builder
    public static class PaymentStatistics {
        private int totalCount;
        private int completedCount;
        private int failedCount;
        private int canceledCount;
        private int transferCount;
        private int cardCount;
        private int checkCount;
        private BigDecimal totalAmount;
        private BigDecimal completedAmount;
        private BigDecimal failedAmount;
        private BigDecimal canceledAmount;
        private BigDecimal transferAmount;
        private BigDecimal cardAmount;
        private BigDecimal checkAmount;
    }
}