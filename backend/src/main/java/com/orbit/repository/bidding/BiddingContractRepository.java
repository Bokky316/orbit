package com.orbit.repository.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.BiddingContract;

@Repository
public interface BiddingContractRepository extends JpaRepository<BiddingContract, Long> {
    /**
     * 특정 거래 번호로 계약 존재 여부 확인
     * @param transactionNumber 확인할 거래 번호
     * @return 존재 여부
     */
    boolean existsByTransactionNumber(String transactionNumber);

    /**
     * 거래 번호로 계약 조회
     * @param transactionNumber 조회할 거래 번호
     * @return 계약 엔티티 Optional
     */
    Optional<BiddingContract> findByTransactionNumber(String transactionNumber);

    /**
     * 특정 날짜의 계약 번호 최대값 조회
     * @param datePrefix 날짜 접두사 (예: 20240312)
     * @return 해당 날짜의 최대 일련번호
     */
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(bc.transactionNumber, 16) AS integer)), 0) " +
           "FROM BiddingContract bc " +
           "WHERE bc.transactionNumber LIKE :datePrefix")
    int findMaxSequenceForDate(@Param("datePrefix") String datePrefix);

    /**
     * ✅ 계약 상태가 "CLOSED"인 계약 목록 조회 (검수 대상)
     */
    @Query("SELECT bc FROM BiddingContract bc WHERE bc.status.parentCode = :parentCode AND bc.status.childCode = :childCode")
    List<BiddingContract> findByStatus(@Param("parentCode") String parentCode, @Param("childCode") String childCode);
}