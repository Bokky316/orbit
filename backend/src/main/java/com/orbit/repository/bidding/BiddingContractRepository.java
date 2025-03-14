package com.orbit.repository.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;

public interface BiddingContractRepository extends JpaRepository<BiddingContract, Long> {

    /**
     * 특정 입찰 공고에 대한 계약 목록 조회
     */
    List<BiddingContract> findByBiddingId(Long biddingId);
    
    /**
     * 특정 공급사의 계약 목록 조회
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