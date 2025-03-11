package com.orbit.repository.inspection;

import com.orbit.entity.inspection.Inspection;
import org.springframework.data.jpa.repository.Query; // JPA Query 어노테이션으로 변경
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    @Query("SELECT i FROM Inspection i WHERE i.contractId IN " +
            "(SELECT c.id FROM SimplifiedContract c WHERE c.status = com.orbit.entity.bidding.SimplifiedContract.ContractStatus.완료)")
    List<Inspection> findAllByCompletedContract();
}