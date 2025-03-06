package com.orbit.repository.bidding;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.SimplifiedContract;
import com.orbit.entity.bidding.SimplifiedContract.ContractStatus;

@Repository
public interface SimplifiedContractRepository extends JpaRepository<SimplifiedContract, Long> {
    
    List<SimplifiedContract> findByBiddingId(Long biddingId);
    
    List<SimplifiedContract> findByStatus(ContractStatus status);
    
    List<SimplifiedContract> findByBiddingParticipationId(Long participationId);
}
