package com.orbit.repository.inspection;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // JPA Query 어노테이션으로 변경

import com.orbit.entity.inspection.Inspection;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    // 기존 쿼리는 참고용으로 주석 처리하거나 이름 변경
    /*
    @Query("SELECT i FROM Inspection i WHERE i.contractId IN " +
            "(SELECT c.id FROM BiddingContract c WHERE c.status = com.orbit.entity.bidding.BiddingContract.ContractStatus.완료)")
    List<Inspection> findAllByCompletedContract();
    */

    // 계약 ID로 검수 데이터 조회
    Optional<Inspection> findByContractId(Long contractId);
}