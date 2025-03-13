package com.orbit.repository.bidding;

import java.time.LocalDate;
import java.util.List;

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
    List<BiddingContract> findBySupplier(Member supplier);
    
    /**
     * 특정 공급사 ID의 계약 목록 조회
     */
    @Query("SELECT c FROM BiddingContract c WHERE c.supplier.id = :supplierId")
    List<BiddingContract> findBySupplierId(@Param("supplierId") Long supplierId);
    
    /**
     * 특정 공급사 ID와 상태로 계약 목록 조회
     */
    @Query("SELECT c FROM BiddingContract c WHERE c.supplier.id = :supplierId AND c.statusChild.codeValue = :status")
    List<BiddingContract> findBySupplierIdAndStatus(
            @Param("supplierId") Long supplierId, 
            @Param("status") String status);
    
    /**
     * 특정 상태의 계약 목록 조회
     */
    List<BiddingContract> findByStatusChild(ChildCode statusChild);
    
    /**
     * 특정 상태와 종료일 범위의 계약 목록 조회
     */
    List<BiddingContract> findByStatusChildAndEndDateBetween(
            ChildCode statusChild, 
            LocalDate startDate, 
            LocalDate endDate);
    
    /**
     * 구매자 서명이 있는 계약 목록 조회
     */
    List<BiddingContract> findByBuyerSignatureIsNotNull();
    
    /**
     * 공급자 서명이 있는 계약 목록 조회
     */
    List<BiddingContract> findBySupplierSignatureIsNotNull();
    
    /**
     * 양측 모두 서명한 계약 목록 조회
     */
    List<BiddingContract> findByBuyerSignatureNotNullAndSupplierSignatureNotNull();
    
    /**
     * 특정 계약의 상태 변경 이력 조회
     */
    @Query("SELECT h FROM StatusHistory h WHERE h.biddingContract.id = :contractId ORDER BY h.changedAt DESC")
    List<StatusHistory> findStatusHistoriesByContractId(@Param("contractId") Long contractId);
    
    /**
     * 계약 번호로 계약 조회
     */
    BiddingContract findByTransactionNumber(String transactionNumber);
    
    /**
     * 특정 기간 내에 만료되는 계약 목록 조회
     */
    @Query("SELECT c FROM BiddingContract c WHERE c.statusChild.codeValue = 'CLOSED' AND " +
           "c.endDate BETWEEN :startDate AND :endDate ORDER BY c.endDate ASC")
    List<BiddingContract> findExpiringContracts(
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);


     /**
     * 상태 코드 값으로 계약 목록 조회
     */
     List<BiddingContract> findAllByStatusChild_CodeValue(String codeValue);
}