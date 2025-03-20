package com.orbit.service.invoice;

import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.invoice.Invoice;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.invoice.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ChildCodeRepository childCodeRepository;
    private final ParentCodeRepository parentCodeRepository;

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Optional<Invoice> getInvoiceById(Long id) {
        return invoiceRepository.findById(id);
    }

    public Invoice createInvoice(Invoice invoice) {
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }

    @Transactional
    public Invoice updateInvoiceStatus(Long id, String statusCode) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("송장을 찾을 수 없습니다."));

        // ParentCode 조회 로직 추가
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("INVOICE", "STATUS")
                .orElseThrow(() -> new RuntimeException("상태 코드 그룹을 찾을 수 없습니다."));

        // 기존 메소드 사용
        ChildCode childCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode, statusCode)
                .orElseThrow(() -> new RuntimeException("유효하지 않은 상태 코드: " + statusCode));

        // 상태 업데이트
        SystemStatus newStatus = new SystemStatus("INVOICE", statusCode);
        invoice.setStatus(newStatus);

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void checkOverdueInvoices() {
        LocalDate today = LocalDate.now();

        // "WAITING" 상태인 송장들 조회
        List<Invoice> waitingInvoices = invoiceRepository.findByStatusParentCodeAndStatusChildCode(
                "INVOICE", "WAITING");

        for (Invoice invoice : waitingInvoices) {
            if (invoice.getDueDate().isBefore(today)) {
                // 상태를 "OVERDUE"로 변경
                SystemStatus overdueSt = new SystemStatus("INVOICE", "OVERDUE");
                invoice.setStatus(overdueSt);
                invoiceRepository.save(invoice);
            }
        }
    }

    public List<Invoice> getInvoicesByDeliveryId(Long deliveryId) {
        return invoiceRepository.findByDeliveryId(deliveryId);
    }

    /**
     * 페이징 및 정렬, 필터링을 적용한 송장 목록 조회
     */
    public Page<Invoice> getFilteredInvoices(String status, String searchTerm, Pageable pageable) {
        // 상태와 검색어가 모두 있는 경우
        if (status != null && !status.isEmpty() && searchTerm != null && !searchTerm.isEmpty()) {
            return invoiceRepository.findByStatusAndSearchTerm("INVOICE", status, searchTerm, pageable);
        }
        // 상태만 있는 경우
        else if (status != null && !status.isEmpty()) {
            return invoiceRepository.findByStatus("INVOICE", status, pageable);
        }
        // 검색어만 있는 경우
        else if (searchTerm != null && !searchTerm.isEmpty()) {
            return invoiceRepository.findBySearchTerm(searchTerm, pageable);
        }
        // 아무 조건 없는 경우
        else {
            return invoiceRepository.findAll(pageable);
        }
    }

    /**
     * 송장 상태별 통계 조회
     */
    public InvoiceStatistics getInvoiceStatistics() {
        List<Invoice> allInvoices = invoiceRepository.findAll();

        // 상태별 분류
        List<Invoice> waitingInvoices = invoiceRepository.findByStatusParentCodeAndStatusChildCode("INVOICE", "WAITING");
        List<Invoice> approvedInvoices = invoiceRepository.findByStatusParentCodeAndStatusChildCode("INVOICE", "APPROVED");
        List<Invoice> rejectedInvoices = invoiceRepository.findByStatusParentCodeAndStatusChildCode("INVOICE", "REJECTED");
        List<Invoice> paidInvoices = invoiceRepository.findByStatusParentCodeAndStatusChildCode("INVOICE", "PAID");
        List<Invoice> overdueInvoices = invoiceRepository.findByStatusParentCodeAndStatusChildCode("INVOICE", "OVERDUE");

        // 금액 합계 계산
        long totalAmount = allInvoices.stream()
                .mapToLong(i -> i.getTotalAmount().longValue())
                .sum();

        long waitingAmount = waitingInvoices.stream()
                .mapToLong(i -> i.getTotalAmount().longValue())
                .sum();

        long approvedAmount = approvedInvoices.stream()
                .mapToLong(i -> i.getTotalAmount().longValue())
                .sum();

        long rejectedAmount = rejectedInvoices.stream()
                .mapToLong(i -> i.getTotalAmount().longValue())
                .sum();

        long paidAmount = paidInvoices.stream()
                .mapToLong(i -> i.getTotalAmount().longValue())
                .sum();

        long overdueAmount = overdueInvoices.stream()
                .mapToLong(i -> i.getTotalAmount().longValue())
                .sum();

        // 통계 객체 생성
        return InvoiceStatistics.builder()
                .totalCount(allInvoices.size())
                .waitingCount(waitingInvoices.size())
                .approvedCount(approvedInvoices.size())
                .rejectedCount(rejectedInvoices.size())
                .paidCount(paidInvoices.size())
                .overdueCount(overdueInvoices.size())
                .totalAmount(totalAmount)
                .waitingAmount(waitingAmount)
                .approvedAmount(approvedAmount)
                .rejectedAmount(rejectedAmount)
                .paidAmount(paidAmount)
                .overdueAmount(overdueAmount)
                .build();
    }

    // 내부 정적 클래스: 송장 통계 정보
    @lombok.Data
    @lombok.Builder
    public static class InvoiceStatistics {
        private int totalCount;
        private int waitingCount;
        private int approvedCount;
        private int rejectedCount;
        private int paidCount;
        private int overdueCount;
        private long totalAmount;
        private long waitingAmount;
        private long approvedAmount;
        private long rejectedAmount;
        private long paidAmount;
        private long overdueAmount;
    }
}