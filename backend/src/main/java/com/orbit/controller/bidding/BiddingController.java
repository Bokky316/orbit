package com.orbit.controller.bidding;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingFormDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.entity.state.StatusHistory;
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

    // @GetMapping("/download-file")
    // @Operation(summary = "파일 다운로드", description = "지정된 파일 다운로드")
    // public ResponseEntity<Resource> downloadFile(
    //     @RequestParam("filename") String filename
    // ) {
    //     try {
    //         // 파일 리소스 로드
    //         Resource resource = biddingService.loadFileAsResource(filename);
            
    //         // 파일명 인코딩 (한글 파일명 지원)
    //         String encodedFilename = URLEncoder.encode(resource.getFilename(), StandardCharsets.UTF_8)
    //             .replaceAll("\\+", "%20");

    //         return ResponseEntity.ok()
    //             .contentType(MediaType.parseMediaType(determineContentType(filename)))
    //             .header(HttpHeaders.CONTENT_DISPOSITION, 
    //                 "attachment; filename*=UTF-8''" + encodedFilename)
    //             .body(resource);
    //     } catch (Exception e) {
    //         return ResponseEntity.status(HttpStatus.NOT_FOUND)
    //             .body(null);
    //     }
    // }

    /**
     * 파일 확장자에 따른 콘텐츠 타입 결정
     * @param filename 파일명
     * @return MIME 타입
     */
    // private String determineContentType(String filename) {
    //     filename = filename.toLowerCase();
    //     if (filename.endsWith(".pdf")) return MediaType.APPLICATION_PDF_VALUE;
    //     if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return MediaType.IMAGE_JPEG_VALUE;
    //     if (filename.endsWith(".png")) return MediaType.IMAGE_PNG_VALUE;
    //     if (filename.endsWith(".gif")) return MediaType.IMAGE_GIF_VALUE;
    //     if (filename.endsWith(".doc")) return "application/msword";
    //     if (filename.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    //     return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    // }

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
     * 입찰 공고 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingDto> getBiddingById(@PathVariable Long id) {
        log.info("입찰 공고 상세 조회 요청 - ID: {}", id);
        
        BiddingDto bidding = biddingService.getBiddingById(id);
        return ResponseEntity.ok(bidding);
    }

    /**
     * 입찰 공고 생성
     */
    @PostMapping
    public ResponseEntity<BiddingDto> createBidding(@Valid @RequestBody BiddingFormDto formDto) {
        log.info("입찰 공고 생성 요청 - 제목: {}", formDto.getTitle());
        
        try {
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
            @Valid @RequestBody BiddingFormDto formDto
    ) {
        log.info("입찰 공고 수정 요청 - ID: {}, 제목: {}", id, formDto.getTitle());
        
        try {
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
        
        biddingService.deleteBidding(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 입찰 상태 변경
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<BiddingDto> changeBiddingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusRequest
    ) {
        String status = statusRequest.get("status");
        String reason = statusRequest.get("reason");
        
        log.info("입찰 공고 상태 변경 요청 - ID: {}, 상태: {}, 사유: {}", id, status, reason);
        
        BiddingDto updatedBidding = biddingService.changeBiddingStatus(id, status, reason);
        return ResponseEntity.ok(updatedBidding);
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList()); // 오류 발생 시 빈 배열 반환
        }
    }

    /**
     * 입찰 참여
     */
    @PostMapping("/{biddingId}/participate")
    public ResponseEntity<BiddingParticipationDto> participateInBidding(
            @PathVariable Long biddingId,
            @RequestBody BiddingParticipationDto participation
    ) {
        log.info("입찰 참여 요청 - 입찰 ID: {}, 공급자 ID: {}", biddingId, participation.getSupplierId());
        
        participation.setBiddingId(biddingId);
        BiddingParticipationDto result = biddingService.participateInBidding(participation);
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }
    
    /**
     * 입찰 참여 목록 조회
     */
    @GetMapping("/{biddingId}/participations")
    public ResponseEntity<List<BiddingParticipationDto>> getBiddingParticipations(@PathVariable Long biddingId) {
        log.info("입찰 참여 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        List<BiddingParticipationDto> participations = biddingService.getBiddingParticipations(biddingId);
        return ResponseEntity.ok(participations);
    }
    
    /**
     * 입찰 참여 상세 조회
     */
    @GetMapping("/participations/{id}")
    public ResponseEntity<BiddingParticipationDto> getParticipationById(@PathVariable Long id) {
        log.info("입찰 참여 상세 조회 요청 - ID: {}", id);
        
        BiddingParticipationDto participation = biddingService.getParticipationById(id);
        return ResponseEntity.ok(participation);
    }
}