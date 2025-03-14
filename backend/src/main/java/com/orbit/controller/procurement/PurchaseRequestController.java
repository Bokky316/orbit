package com.orbit.controller.procurement;

import com.orbit.dto.approval.DepartmentDTO;
import com.orbit.dto.item.CategoryDTO;
import com.orbit.dto.item.ItemDTO;
import com.orbit.dto.member.MemberDTO;
import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.service.procurement.PurchaseRequestService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/purchase-requests")
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    public PurchaseRequestController(PurchaseRequestService purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }

    @GetMapping
    public ResponseEntity<List<PurchaseRequestDTO>> getAllPurchaseRequests() {
        List<PurchaseRequestDTO> purchaseRequests = purchaseRequestService.getAllPurchaseRequests();
        return new ResponseEntity<>(purchaseRequests, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseRequestDTO> getPurchaseRequestById(@PathVariable Long id) {
        PurchaseRequestDTO purchaseRequest = purchaseRequestService.getPurchaseRequestById(id);
        return new ResponseEntity<>(purchaseRequest, HttpStatus.OK);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PurchaseRequestDTO> createPurchaseRequest(
            @Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequestDTO createdPurchaseRequest = purchaseRequestService.createPurchaseRequest(purchaseRequestDTO, null);
        return new ResponseEntity<>(createdPurchaseRequest, HttpStatus.CREATED);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PurchaseRequestDTO> createPurchaseRequestWithFiles(
            @Valid @RequestPart("purchaseRequestDTO") PurchaseRequestDTO purchaseRequestDTO,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        PurchaseRequestDTO createdPurchaseRequest = purchaseRequestService.createPurchaseRequest(purchaseRequestDTO, files);
        return new ResponseEntity<>(createdPurchaseRequest, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseRequestDTO> updatePurchaseRequest(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {

        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        PurchaseRequestDTO updatedPurchaseRequest = purchaseRequestService.updatePurchaseRequest(id, purchaseRequestDTO, currentUserName);
        return new ResponseEntity<>(updatedPurchaseRequest, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseRequest(@PathVariable Long id) {
        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        boolean isDeleted = purchaseRequestService.deletePurchaseRequest(id, currentUserName);
        return isDeleted ? new ResponseEntity<>(HttpStatus.NO_CONTENT) : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<PurchaseRequestDTO> addAttachmentsToPurchaseRequest(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {
        PurchaseRequestDTO updatedRequest = purchaseRequestService.addAttachmentsToPurchaseRequest(id, files);
        return new ResponseEntity<>(updatedRequest, HttpStatus.OK);
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {

        Resource resource = purchaseRequestService.downloadAttachment(attachmentId);

        try {
            String filename = resource.getFilename();
            String encodedFilename;

            if (userAgent != null && (userAgent.contains("Trident") || userAgent.contains("MSIE"))) {
                encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8.name())
                        .replaceAll("\\+", "%20");
            } else {
                encodedFilename = UriUtils.encode(filename, StandardCharsets.UTF_8);
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + encodedFilename + "\"; " +
                                    "filename*=UTF-8''" + encodedFilename)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                    .body(resource);

        } catch (UnsupportedEncodingException e) {
            log.error("파일명 인코딩 실패: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/items")
    public ResponseEntity<List<ItemDTO>> getAllItems() {
        List<ItemDTO> items = purchaseRequestService.getAllItems();
        return new ResponseEntity<>(items, HttpStatus.OK);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> categories = purchaseRequestService.getAllCategories();
        return new ResponseEntity<>(categories, HttpStatus.OK);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseRequestDTO> updatePurchaseRequestStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusData,
            Authentication authentication
    ) {
        String currentUsername = authentication.getName();

        PurchaseRequestDTO updatedRequest = purchaseRequestService.updatePurchaseRequestStatus(
                id,
                statusData.get("toStatus"),
                currentUsername
        );

        return ResponseEntity.ok(updatedRequest);
    }
}