package com.orbit.controller.bidding;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api/bidding-participations")
@RequiredArgsConstructor
public class BiddingParticipationController {
    private final BiddingParticipationService participationService;
    private final MemberRepository memberRepository;

    @PostMapping("/{biddingId}/participate")
    public ResponseEntity<BiddingParticipationDto> participateInBidding(
        @PathVariable Long biddingId,
        @RequestBody BiddingParticipationDto participationDto,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        // 현재 로그인한 사용자 정보 가져오기
        Member currentMember = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        // 입찰 ID 설정
        participationDto.setBiddingId(biddingId);
        participationDto.setSupplierId(currentMember.getId());

        // 서비스 호출
        BiddingParticipationDto result = participationService.participateInBidding(participationDto);
        
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{participationId}/confirm")
    public ResponseEntity<BiddingParticipationDto> confirmParticipation(
        @PathVariable Long participationId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        // 현재 로그인한 사용자 정보 가져오기
        Member currentMember = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        // 서비스 호출
        BiddingParticipationDto result = participationService.confirmParticipation(participationId);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/bidding/{biddingId}")
    public ResponseEntity<List<BiddingParticipationDto>> getBiddingParticipations(
        @PathVariable Long biddingId
    ) {
        List<BiddingParticipationDto> participations = participationService.getBiddingParticipations(biddingId);
        return ResponseEntity.ok(participations);
    }
}
