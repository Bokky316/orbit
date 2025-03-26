package com.orbit.entity.procurement;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

public class PurchaseRequestIdGenerator implements IdentifierGenerator {

    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        // 현재 년월 계산 (예: 2405)
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMM"));

        // 직접 requestNumber를 쿼리하는 방식으로 변경
        String query = String.format(
                "SELECT MAX(p.requestNumber) FROM PurchaseRequest p " +
                        "WHERE p.requestNumber LIKE 'REQ-%s-%%'", yearMonth
        );

        String maxRequestNumber = (String) session.createQuery(query).uniqueResult();
        int nextId = 1;

        if (maxRequestNumber != null && maxRequestNumber.startsWith("REQ-" + yearMonth)) {
            try {
                // 기존 요청번호에서 마지막 숫자 부분 추출
                String[] parts = maxRequestNumber.split("-");
                if (parts.length == 3) {
                    nextId = Integer.parseInt(parts[2]) + 1;
                }
            } catch (Exception e) {
                // 파싱 오류 시 기본값 사용
                nextId = 1;
            }
        }

        // 구매요청 번호 형식: REQ-YYMM-XXX (예: REQ-2405-001)
        PurchaseRequest purchaseRequest = (PurchaseRequest) object;
        purchaseRequest.setRequestNumber(String.format("REQ-%s-%03d", yearMonth, nextId));

        return null; // 기본 ID 생성 전략 사용 (GenerationType.IDENTITY)
    }
}