package com.orbit.repository.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.BiddingParticipation;

@Repository
public interface BiddingParticipationRepository extends JpaRepository<BiddingParticipation, Long> {
    
    List<BiddingParticipation> findByBiddingId(Long biddingId);
    
    Optional<BiddingParticipation> findByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
    boolean existsByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
}
