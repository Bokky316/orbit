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

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * 구매 요청 관련 RESTful API 컨트롤러 (파일 업로드 기능 포함)
 */
@RestController
@RequestMapping("/api/purchase-requests")
public class PurchaseRequestController {

    private final PurchaseRequestService purchaseRequestService;

    /**
     * 생성자를 통한 의존성 주입
     * @param purchaseRequestService 구매 요청 서비스
     */
    public PurchaseRequestController(PurchaseRequestService purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }

    /**
     * 모든 구매 요청 조회
     * @return 구매 요청 목록
     */
    @GetMapping
    public ResponseEntity<List<PurchaseRequestDTO>> getAllPurchaseRequests() {
        List<PurchaseRequestDTO> purchaseRequests = purchaseRequestService.getAllPurchaseRequests();
        return new ResponseEntity<>(purchaseRequests, HttpStatus.OK);
    }

    /**
     * ID로 구매 요청 조회
     * @param id 구매 요청 ID
     * @return 구매 요청 (Optional)
     */
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

    /**
     * 구매 요청 생성 (Multipart 요청 - 파일 업로드)
     * @param purchaseRequestDTO 요청 정보
     * @param files 업로드 파일 배열
     * @return 생성된 구매 요청
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PurchaseRequestResponseDTO> createPurchaseRequestWithFiles(
            @Valid @RequestPart("purchaseRequestDTO") PurchaseRequestDTO purchaseRequestDTO,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        PurchaseRequestResponseDTO createdPurchaseRequest = purchaseRequestService.createPurchaseRequest(purchaseRequestDTO, files);
        return new ResponseEntity<>(createdPurchaseRequest, HttpStatus.CREATED);
    }

    /**
     * 구매 요청 정보 업데이트
     * @param id 업데이트 대상 ID
     * @param purchaseRequestDTO 업데이트 정보
     * @return 업데이트된 구매 요청
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> updatePurchaseRequest(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequestResponseDTO updatedPurchaseRequest = purchaseRequestService.updatePurchaseRequest(id, purchaseRequestDTO);
        return new ResponseEntity<>(updatedPurchaseRequest, HttpStatus.OK);
    }

    /**
     * 구매 요청 삭제
     * @param id 삭제 대상 ID
     * @return 삭제 성공 여부
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseRequest(@PathVariable Long id) {
        // Spring Security Context에서 인증 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = authentication.getName();

        boolean isDeleted = purchaseRequestService.deletePurchaseRequest(id, currentUserName);
        return isDeleted ? new ResponseEntity<>(HttpStatus.NO_CONTENT) : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // 파일만 업로드하는 별도 엔드포인트 추가
    @PostMapping("/{id}/attachments")
    public ResponseEntity<PurchaseRequestDTO> addAttachmentsToPurchaseRequest(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {

        Optional<PurchaseRequestDTO> requestOpt = purchaseRequestService.getPurchaseRequestById(id);
        if (requestOpt.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        PurchaseRequestDTO updatedRequest = purchaseRequestService.addAttachmentsToPurchaseRequest(id, files);
        return new ResponseEntity<>(updatedRequest, HttpStatus.OK);
    }
}
