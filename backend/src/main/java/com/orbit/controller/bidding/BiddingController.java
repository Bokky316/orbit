package com.orbit.controller.bidding;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingFormDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/biddings")
@RequiredArgsConstructor
public class BiddingController {
    private final BiddingService biddingService;
    private final MemberRepository memberRepository;

    /**
     * 입찰 공고 첨부파일 추가
     */
    @PostMapping("/{id}/attachments")
    public ResponseEntity<BiddingDto> addAttachmentsToBidding(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 인증된 사용자 확인
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 현재 사용자 정보 조회
        Member currentMember = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));

        // 파일 추가 서비스 호출
        BiddingDto updatedBidding = biddingService.addAttachmentsToBidding(id, files, currentMember);
        
        return ResponseEntity.ok(updatedBidding);
    }

    /**
     * 첨부파일 다운로드
     */
    @GetMapping("/{id}/attachments/{filename}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long id,
            @PathVariable String filename,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 인증된 사용자 확인
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 파일 다운로드 서비스 호출
        Resource resource = biddingService.downloadAttachment(id, filename);

        String encodedFilename = UriUtils.encode(filename, StandardCharsets.UTF_8);

        // 브라우저에 따른 인코딩 처리
        if (userAgent != null && (userAgent.contains("Trident") || userAgent.contains("Edge"))) {
            encodedFilename = encodedFilename.replaceAll("\\+", "%20");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encodedFilename + "\"; " +
                                "filename*=UTF-8''" + encodedFilename)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .body(resource);
    }

    /**
     * 입찰 공고 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingDto>> getBiddingList(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("입찰 공고 목록 조회 요청 - 상태: {}, 시작일: {}, 종료일: {}", status, startDate, endDate);
        
        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("startDate", startDate);
        params.put("endDate", endDate);

        List<BiddingDto> biddings = biddingService.getBiddingList(params);
        return ResponseEntity.ok(biddings);
    }
    
    /**
     * 특정 상태의 입찰 공고 목록 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BiddingDto>> getBiddingsByStatus(@PathVariable String status) {
        log.info("특정 상태의 입찰 공고 목록 조회 요청 - 상태: {}", status);
        
        try {
            List<BiddingDto> biddings = biddingService.getBiddingsByStatus(status);
            return ResponseEntity.ok(biddings);
        } catch (IllegalArgumentException e) {
            log.error("유효하지 않은 상태 코드: {}", status);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    @GetMapping("/supplier/{supplierId}/invited")
    public ResponseEntity<List<BiddingDto>> getBiddingsInvitedSupplier(@PathVariable Long supplierId) {
        log.info("특정 공급사가 초대된 입찰 공고 목록 조회 요청 - 공급사 ID: {}", supplierId);
        
        List<BiddingDto> biddings = biddingService.getBiddingsInvitedSupplier(supplierId);
        return ResponseEntity.ok(biddings);
    }
    
    /**
     * 특정 공급사가 참여한 입찰 공고 목록 조회
     */
    @GetMapping("/supplier/{supplierId}/participated")
    public ResponseEntity<List<BiddingDto>> getBiddingsParticipatedBySupplier(@PathVariable Long supplierId) {
        log.info("특정 공급사가 참여한 입찰 공고 목록 조회 요청 - 공급사 ID: {}", supplierId);
        
        List<BiddingDto> biddings = biddingService.getBiddingsParticipatedBySupplier(supplierId);
        return ResponseEntity.ok(biddings);
    }
    
    /**
     * 입찰 공고 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingDto> getBiddingById(@PathVariable Long id) {
        log.info("입찰 공고 상세 조회 요청 - ID: {}", id);
        
        try {
            BiddingDto bidding = biddingService.getBiddingById(id);
            return ResponseEntity.ok(bidding);
        } catch (Exception e) {
            log.error("입찰 공고 조회 중 오류 발생", e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 입찰 공고 생성
     */
    @PostMapping
    public ResponseEntity<BiddingDto> createBidding(
            @Valid @RequestBody BiddingFormDto formDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 공고 생성 요청 - 제목: {}", formDto.getTitle());
        
        try {
            // 현재 사용자 정보 설정은 Service 레이어에서 처리하도록 수정
            
            // 금액 필드 안전 처리 및 재계산
            formDto.recalculateAllPrices();
            
            BiddingDto createdBidding = biddingService.createBidding(formDto);
            return new ResponseEntity<>(createdBidding, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("입찰 공고 생성 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 공고 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<BiddingDto> updateBidding(
            @PathVariable Long id,
            @Valid @RequestBody BiddingFormDto formDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 공고 수정 요청 - ID: {}, 제목: {}", id, formDto.getTitle());
        
        try {
            // 현재 사용자 정보 설정은 Service 레이어에서 처리하도록 수정
            
            // 금액 필드 안전 처리 및 재계산
            formDto.recalculateAllPrices();
            
            BiddingDto updatedBidding = biddingService.updateBidding(id, formDto);
            return ResponseEntity.ok(updatedBidding);
        } catch (Exception e) {
            log.error("입찰 공고 수정 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 공고 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBidding(@PathVariable Long id) {
        log.info("입찰 공고 삭제 요청 - ID: {}", id);
        
        try {
            biddingService.deleteBidding(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("입찰 공고 삭제 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 입찰 상태 변경
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<BiddingDto> changeBiddingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusRequest,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String status = statusRequest.get("status");
        String reason = statusRequest.get("reason");
        
        log.info("입찰 공고 상태 변경 요청 - ID: {}, 상태: {}, 사유: {}", id, status, reason);
        
        try {
            BiddingDto updatedBidding = biddingService.changeBiddingStatus(id, status, reason);
            return ResponseEntity.ok(updatedBidding);
        } catch (IllegalArgumentException e) {
            log.error("유효하지 않은 상태 코드: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("입찰 공고 상태 변경 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 상태 변경 이력 조회
     */
    @GetMapping("/{id}/status-histories")
    public ResponseEntity<List<StatusHistory>> getBiddingStatusHistories(@PathVariable Long id) {
        log.info("입찰 공고 상태 변경 이력 조회 요청 - ID: {}", id);
        
        try {
            List<StatusHistory> histories = biddingService.getBiddingStatusHistories(id);
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            log.error("상태 이력 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 입찰 참여
     */
    @PostMapping("/{biddingId}/participate")
    public ResponseEntity<BiddingParticipationDto> participateInBidding(
            @PathVariable Long biddingId,
            @RequestBody BiddingParticipationDto participation,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 참여 요청 - 입찰 ID: {}, 공급자 ID: {}", biddingId, participation.getSupplierId());
        
        try {
            // 현재 로그인한 사용자의 공급사 ID 설정 (보안 강화)
            if (userDetails != null) {
                Member member = memberRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                participation.setSupplierId(member.getId());
            }
            
            participation.setBiddingId(biddingId);
            BiddingParticipationDto result = biddingService.participateInBidding(participation);
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            log.error("입찰 참여 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("입찰 참여 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 참여 목록 조회
     */
    @GetMapping("/{biddingId}/participations")
    public ResponseEntity<List<BiddingParticipationDto>> getBiddingParticipations(@PathVariable Long biddingId) {
        log.info("입찰 참여 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingParticipationDto> participations = biddingService.getBiddingParticipations(biddingId);
            return ResponseEntity.ok(participations);
        } catch (Exception e) {
            log.error("입찰 참여 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 입찰 참여 상세 조회
     */
    @GetMapping("/participations/{id}")
    public ResponseEntity<BiddingParticipationDto> getParticipationById(@PathVariable Long id) {
        log.info("입찰 참여 상세 조회 요청 - ID: {}", id);
        
        try {
            BiddingParticipationDto participation = biddingService.getParticipationById(id);
            return ResponseEntity.ok(participation);
        } catch (Exception e) {
            log.error("입찰 참여 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 참여 의사 확인
     */
    @PutMapping("/participations/{id}/confirm")
    public ResponseEntity<BiddingParticipationDto> confirmParticipation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 참여 의사 확인 요청 - ID: {}", id);
        
        try {
            // 권한 체크 로직 - 참여자 본인만 확인 가능하도록
            if (userDetails != null) {
                Member member = memberRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
                // 참여 정보 조회
                BiddingParticipationDto participation = biddingService.getParticipationById(id);
                
                // 본인 확인
                if (!member.getId().equals(participation.getSupplierId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }
            
            BiddingParticipationDto participation = biddingService.confirmSupplierParticipation(id);
            return ResponseEntity.ok(participation);
        } catch (Exception e) {
            log.error("참여 의사 확인 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 낙찰자 선정 (최고 점수 기준)
     */
    @PostMapping("/{biddingId}/select-winner")
    public ResponseEntity<BiddingEvaluationDto> selectWinningBidder(
            @PathVariable Long biddingId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 낙찰자 선정 요청 (자동) - 입찰 ID: {}", biddingId);
        
        try {
            // 권한 체크 로직 - 구매자 또는 관리자만 가능하도록
            if (userDetails != null) {
                Member member = memberRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
                // 여기에 역할 확인 로직을 추가할 수 있습니다.
                // 예: if (!"BUYER".equals(member.getRole()) && !"ADMIN".equals(member.getRole())) { ... }
            }
            
            BiddingEvaluationDto winner = biddingService.selectWinningBidder(biddingId);
            return ResponseEntity.ok(winner);
        } catch (IllegalStateException e) {
            log.error("낙찰자 선정 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("낙찰자 선정 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 수동 낙찰자 선정
     */
    @PostMapping("/{biddingId}/select-winner/{evaluationId}")
    public ResponseEntity<BiddingEvaluationDto> selectBidderManually(
            @PathVariable Long biddingId, 
            @PathVariable Long evaluationId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("입찰 낙찰자 선정 요청 (수동) - 입찰 ID: {}, 평가 ID: {}", biddingId, evaluationId);
        
        try {
            // 권한 체크 로직 - 구매자 또는 관리자만 가능하도록
            if (userDetails != null) {
                Member member = memberRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
                // 여기에 역할 확인 로직을 추가할 수 있습니다.
                // 예: if (!"BUYER".equals(member.getRole()) && !"ADMIN".equals(member.getRole())) { ... }
            }
            
            BiddingEvaluationDto winner = biddingService.selectBidderManually(biddingId, evaluationId);
            return ResponseEntity.ok(winner);
        } catch (IllegalStateException e) {
            log.error("낙찰자 선정 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("낙찰자 선정 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 낙찰자 목록 조회
     */
    @GetMapping("/{biddingId}/winners")
    public ResponseEntity<List<BiddingEvaluationDto>> getWinningBidders(@PathVariable Long biddingId) {
        log.info("입찰 낙찰자 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingEvaluationDto> winners = biddingService.getWinningBidders(biddingId);
            return ResponseEntity.ok(winners);
        } catch (Exception e) {
            log.error("낙찰자 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 초대된 공급사 목록 조회
     */
    @GetMapping("/{biddingId}/invited-suppliers")
    public ResponseEntity<List<BiddingSupplierDto>> getInvitedSuppliers(@PathVariable Long biddingId) {
        log.info("초대된 공급사 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingSupplierDto> suppliers = biddingService.getInvitedSuppliers(biddingId);
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("초대된 공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 공급사 초대
     */
    @PostMapping("/{biddingId}/invite/{supplierId}")
    public ResponseEntity<BiddingSupplierDto> inviteSupplier(
            @PathVariable Long biddingId,
            @PathVariable Long supplierId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("공급사 초대 요청 - 입찰 ID: {}, 공급사 ID: {}", biddingId, supplierId);
        
        try {
            // 권한 체크 로직 - 구매자 또는 관리자만 가능하도록
            if (userDetails != null) {
                Member member = memberRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
                // 여기에 역할 확인 로직을 추가할 수 있습니다.
                // 예: if (!"BUYER".equals(member.getRole()) && !"ADMIN".equals(member.getRole())) { ... }
            }
            
            BiddingSupplierDto supplier = biddingService.inviteSupplier(biddingId, supplierId);
            return new ResponseEntity<>(supplier, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            log.error("공급사 초대 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("공급사 초대 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 초안 생성
     */
    @PostMapping("/{biddingId}/create-contract/{participationId}")
    public ResponseEntity<Map<String, Long>> createContractDraft(
            @PathVariable Long biddingId,
            @PathVariable Long participationId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("계약 초안 생성 요청 - 입찰 ID: {}, 참여 ID: {}", biddingId, participationId);
        
        try {
            // 권한 체크 로직 - 구매자 또는 관리자만 가능하도록
            if (userDetails != null) {
                Member member = memberRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
                // 여기에 역할 확인 로직을 추가할 수 있습니다.
                // 예: if (!"BUYER".equals(member.getRole()) && !"ADMIN".equals(member.getRole())) { ... }
            }
            
            Long contractId = biddingService.createContractDraft(biddingId, participationId);
            Map<String, Long> response = new HashMap<>();
            response.put("contractId", contractId);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("계약 초안 생성 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 발주 생성
     */
    @PostMapping("/{biddingId}/create-order/{participationId}")
    public ResponseEntity<Map<String, Long>> createOrder(
            @PathVariable Long biddingId,
            @PathVariable Long participationId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("발주 생성 요청 - 입찰 ID: {}, 참여 ID: {}", biddingId, participationId);
        
        try {
            // 권한 체크 로직 - 구매자 또는 관리자만 가능하도록
            if (userDetails != null) {
                Member member = memberRepository.findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
                // 여기에 역할 확인 로직을 추가할 수 있습니다.
                // 예: if (!"BUYER".equals(member.getRole()) && !"ADMIN".equals(member.getRole())) { ... }
            }
            
            String createdById = userDetails != null ? userDetails.getUsername() : null;
            Long orderId = biddingService.createOrder(biddingId, participationId, createdById);
            Map<String, Long> response = new HashMap<>();
            response.put("orderId", orderId);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("발주 생성 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}