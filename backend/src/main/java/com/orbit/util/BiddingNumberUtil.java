package com.orbit.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

/**
 * 거래 번호(입찰 번호, 계약 번호, 발주 번호 등) 생성 유틸리티 클래스
 */
public class BiddingNumberUtil {
    
    private static final Random random = new Random();
    
    /**
     * 입찰 번호 생성 (BID-YYYYMMDD-XXXX)
     * @return 생성된 입찰 번호
     */
    public static String generateBidNumber() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%04d", random.nextInt(10000));
        return "BID-" + datePart + "-" + randomPart;
    }
    
    /**
     * 계약 번호 생성 (CNT-YYMMDD-XXX)
     * @return 생성된 계약 번호
     */
    public static String generateContractNumber() {
        LocalDate now = LocalDate.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyMMdd"));
        String randomPart = String.format("%03d", random.nextInt(1000));
        return "CNT-" + datePart + "-" + randomPart;
    }
    
    /**
     * 계약 번호 생성 (입찰 번호 기반)
     * @param bidNumber 입찰 번호
     * @return 생성된 계약 번호
     */
    public static String generateContractNumberFromBidNumber(String bidNumber) {
        if (bidNumber != null && bidNumber.startsWith("BID-")) {
            return bidNumber.replace("BID-", "CNT-");
        } else {
            // 예외 처리: 기존 공고번호가 없거나 형식이 다른 경우
            return generateContractNumber();
        }
    }
    
    /**
     * 발주 번호 생성 (ORD-YYMMDD-XXX)
     * @return 생성된 발주 번호
     */
    public static String generateOrderNumber() {
        LocalDate now = LocalDate.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyMMdd"));
        String randomPart = String.format("%03d", random.nextInt(1000));
        return "ORD-" + datePart + "-" + randomPart;
    }
    
    /**
     * 발주 번호 생성 (계약 번호 기반)
     * @param contractNumber 계약 번호
     * @return 생성된 발주 번호
     */
    public static String generateOrderNumberFromContractNumber(String contractNumber) {
        if (contractNumber != null && contractNumber.startsWith("CNT-")) {
            return contractNumber.replace("CNT-", "ORD-");
        } else {
            // 예외 처리: 기존 계약번호가 없거나 형식이 다른 경우
            return generateOrderNumber();
        }
    }
}