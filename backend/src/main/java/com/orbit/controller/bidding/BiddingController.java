package com.orbit.controller.bidding;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import com.orbit.dto.bidding.BiddingFormDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import com.orbit.service.bidding.BiddingService;
import com.orbit.service.supplier.SupplierRegistrationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/biddings")
@RequiredArgsConstructor
public class BiddingController {
    private final BiddingService biddingService;
    private final SupplierRegistrationService supplierRegistrationService;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final MemberRepository memberRepository;

   

    //구매요청 가져오기
    @GetMapping("/purchase-requests/active")
    public ResponseEntity<List<Map<String, Object>>> getActivePurchaseRequests() {
        log.info("활성화된 구매 요청 목록 조회 요청 시작");
        
        try {
            // 모든 구매 요청을 가져온 후 필터링
            List<PurchaseRequest> allRequests = purchaseRequestRepository.findAll();
            
            log.info("전체 구매 요청 수: {}", allRequests.size());
            
            // 상태에 따라 필터링 (코드에서 필터링)
            List<PurchaseRequest> activeRequests = allRequests.stream()
                .filter(request -> {
                    // 안전한 상태 필터링
                    if (request.getStatus() == null || request.getStatus().getChildCode() == null) {
                        log.warn("상태 정보가 없는 구매 요청 발견: ID {}", request.getId());
                        return false;
                    }
                    
                    String status = request.getStatus().getChildCode();
                    boolean isActive = !"CANCELED".equals(status) && !"REJECTED".equals(status);
                    
                    log.debug("구매 요청 ID: {}, 상태: {}, 활성 상태: {}", 
                        request.getId(), status, isActive);
                    
                    return isActive;
                })
                .collect(Collectors.toList());
            
            log.info("활성 구매 요청 수: {}", activeRequests.size());
            
            // 모든 구매 요청 품목을 한번에 조회 (N+1 문제 방지)
            List<Long> activeRequestIds = activeRequests.stream()
                .map(PurchaseRequest::getId)
                .collect(Collectors.toList());
                
            // 모든 품목을 조회
            List<PurchaseRequestItem> allItems = purchaseRequestItemRepository.findAll();
            
            // 활성 요청 ID에 해당하는 품목만 필터링
            Map<Long, List<PurchaseRequestItem>> itemsByRequestId = allItems.stream()
                .filter(item -> item.getPurchaseRequest() != null && 
                    activeRequestIds.contains(item.getPurchaseRequest().getId()))
                .collect(Collectors.groupingBy(
                    item -> item.getPurchaseRequest().getId()
                ));
            
            // PurchaseRequest를 Map으로 변환
            List<Map<String, Object>> result = activeRequests.stream()
                .map(request -> {
                    Map<String, Object> requestMap = new HashMap<>();
                    requestMap.put("id", request.getId());
                    requestMap.put("requestName", request.getRequestName());
                    requestMap.put("prStatusChild", request.getStatus().getChildCode());
                    requestMap.put("requestNumber", request.getRequestNumber());
                    requestMap.put("customer", request.getCustomer());
                    requestMap.put("requestDate", request.getRequestDate());
                    requestMap.put("businessDepartment", request.getBusinessDepartment());
                    
                    // 해당 요청 ID에 매핑된 품목 리스트 가져오기
                    List<PurchaseRequestItem> requestItems = itemsByRequestId.getOrDefault(request.getId(), Collections.emptyList());
                    
                    // 품목 정보 변환
                    List<Map<String, Object>> items = requestItems.stream()
                    .map(item -> {
                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("id", item.getId());
                        itemMap.put("itemName", item.getItem() != null ? item.getItem().getName() : "");
                        itemMap.put("specification", item.getSpecification());
                        itemMap.put("quantity", item.getQuantity());
                        itemMap.put("unitPrice", item.getUnitPrice());
                        itemMap.put("totalPrice", item.getTotalPrice());
                        itemMap.put("unitChildCode", item.getUnitChildCode() != null ? 
                            item.getUnitChildCode().getCodeValue() : "49");
                        itemMap.put("deliveryLocation", item.getDeliveryLocation());
                        itemMap.put("deliveryRequestDate", item.getDeliveryRequestDate());
                        return itemMap;
                    })
                    .collect(Collectors.toList());
                    
                    requestMap.put("items", items);
                    
                    return requestMap;
                })
                .collect(Collectors.toList());
            
            log.info("변환된 구매 요청 맵 수: {}", result.size());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("구매 요청 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


     /**
     * 활성화된 공급사 목록 조회 (입찰 공고에서 사용)
     */
    @GetMapping("/suppliers/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveSuppliers() {
        log.info("활성화된 공급사 목록 조회 요청");
        
        try {
            // 승인(APPROVED) 상태인 공급사만 조회
            List<SupplierRegistration> supplierRegistrations = 
                supplierRegistrationService.getSuppliers("APPROVED");
            
            // SupplierRegistration을 Map으로 변환
            List<Map<String, Object>> suppliers = supplierRegistrations.stream()
                .map(registration -> {
                    Map<String, Object> supplierMap = new HashMap<>();
                    supplierMap.put("id", registration.getSupplier().getId());
                    supplierMap.put("name", registration.getSupplier().getCompanyName());
                    supplierMap.put("businessNumber", registration.getBusinessNo());
                    supplierMap.put("contact", registration.getPhoneNumber());
                    supplierMap.put("email", registration.getContactEmail());
                    return supplierMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(suppliers);
        } catch (Exception e) {
            log.error("공급사 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

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
    @GetMapping("/{supplierId}/invited")
    public ResponseEntity<List<BiddingDto>> getBiddingsInvitedSupplier(@PathVariable Long supplierId) {
        log.info("특정 공급사가 초대된 입찰 공고 목록 조회 요청 - 공급사 ID: {}", supplierId);
        
        List<BiddingDto> biddings = biddingService.getBiddingsInvitedSupplier(supplierId);
        return ResponseEntity.ok(biddings);
    }
    
    /**
     * 특정 공급사가 참여한 입찰 공고 목록 조회
     */
    @GetMapping("/{supplierId}/participated")
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
public ResponseEntity<?> createBidding(
    @Valid @RequestBody BiddingFormDto formDto,
    @AuthenticationPrincipal UserDetails userDetails
) {
    if (userDetails == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "로그인이 필요합니다."));
    }

    try {
        Member currentMember = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
        
        // 권한 체크 로직 
        if (currentMember.getRole() != Member.Role.ADMIN && 
            currentMember.getRole() != Member.Role.BUYER) {
            return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "입찰 공고 생성 권한이 없습니다."));
        }
        
        BiddingDto createdBidding = biddingService.createBidding(formDto, currentMember);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBidding);

    } catch (Exception e) {
        log.error("입찰 공고 생성 중 오류: ", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("message", "입찰 공고 생성에 실패했습니다.", "error", e.getMessage()));
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
    // @GetMapping("/{id}/status-histories")
    // public ResponseEntity<List<StatusHistory>> getBiddingStatusHistories(@PathVariable Long id) {
    //     log.info("입찰 공고 상태 변경 이력 조회 요청 - ID: {}", id);
        
    //     try {
    //         List<StatusHistory> histories = biddingService.getBiddingStatusHistories(id);
    //         return ResponseEntity.ok(histories);
    //     } catch (Exception e) {
    //         log.error("상태 이력 조회 중 오류 발생", e);
    //         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    //     }
    // }

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

    @GetMapping("/{id}/status-history")
public ResponseEntity<List<StatusHistory>> getStatusHistories(@PathVariable Long id) {
    List<StatusHistory> histories = biddingService.getBiddingStatusHistories(id);
    return ResponseEntity.ok(histories);
}


/**
 * 입찰 공고 마감 처리 (입찰 상태를 CLOSED로 변경)
 */
@PutMapping("/{id}/close")
public ResponseEntity<BiddingDto> closeBidding(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
) {
    log.info("입찰 마감 요청 - ID: {}", id);

    if (userDetails == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    try {
        BiddingDto closedBidding = biddingService.changeBiddingStatus(id, "CLOSED", "입찰 마감 처리");
        return ResponseEntity.ok(closedBidding);
    } catch (IllegalArgumentException e) {
        log.error("입찰 마감 요청 실패 - 잘못된 상태 코드", e);
        return ResponseEntity.badRequest().build();
    } catch (Exception e) {
        log.error("입찰 마감 중 서버 오류 발생", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}



    
}