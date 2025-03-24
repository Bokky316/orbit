package com.orbit.controller.bidding;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingParticipationService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/supplier/bidding-participations")
@RequiredArgsConstructor
public class SupplierBiddingParticipationController {
    private final BiddingParticipationService participationService;
    private final MemberRepository memberRepository;

    @PostMapping("/{biddingId}")
    public ResponseEntity<BiddingParticipationDto> participateInBidding(
        @PathVariable Long biddingId,
        @RequestBody BiddingParticipationDto participationDto,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        participationDto.setBiddingId(biddingId);
        participationDto.setSupplierId(supplier.getId());

        BiddingParticipationDto result = participationService.participateInBidding(participationDto);
        
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{participationId}/confirm")
    public ResponseEntity<BiddingParticipationDto> confirmParticipation(
        @PathVariable Long participationId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member supplier = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        BiddingParticipationDto result = participationService.confirmParticipation(participationId);
        
        return ResponseEntity.ok(result);
    }
}
