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

/**
 * 구매 요청 관련 RESTful API 컨트롤러 (파일 업로드 기능 포함)
 */
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

    /**
     * 구매 요청 생성 (JSON 요청)
     * @param purchaseRequestDTO 요청 정보
     * @return 생성된 구매 요청
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PurchaseRequestResponseDTO> createPurchaseRequest(
            @Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequestResponseDTO createdPurchaseRequest = purchaseRequestService.createPurchaseRequest(purchaseRequestDTO, null); // 파일은 null로 전달
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
        PurchaseRequestDTO updatedPurchaseRequest = purchaseRequestService.updatePurchaseRequest(id, purchaseRequestDTO);
        return new ResponseEntity<>(updatedPurchaseRequest, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseRequest(@PathVariable Long id) {
        boolean isDeleted = purchaseRequestService.deletePurchaseRequest(id);
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

    // ======== 새로 추가된 부서/담당자 관련 API 엔드포인트 ========

    /**
     * 모든 부서 목록을 조회하는 API
     */
    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        List<DepartmentDTO> departments = purchaseRequestService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    /**
     * 특정 부서 정보를 조회하는 API
     */
    @GetMapping("/departments/{id}")
    public ResponseEntity<DepartmentDTO> getDepartmentById(@PathVariable Long id) {
        DepartmentDTO department = purchaseRequestService.getDepartmentById(id);
        return ResponseEntity.ok(department);
    }

    /**
     * 모든 사용자 목록을 조회하는 API
     */
    @GetMapping("/members")
    public ResponseEntity<List<MemberDTO>> getAllMembers() {
        List<MemberDTO> members = purchaseRequestService.getAllMembers();
        return ResponseEntity.ok(members);
    }

    /**
     * 특정 부서에 속한 사용자 목록을 조회하는 API
     */
    @GetMapping("/members/department/{departmentId}")
    public ResponseEntity<List<MemberDTO>> getMembersByDepartment(@PathVariable Long departmentId) {
        List<MemberDTO> members = purchaseRequestService.getMembersByDepartment(departmentId);
        return ResponseEntity.ok(members);
    }
}