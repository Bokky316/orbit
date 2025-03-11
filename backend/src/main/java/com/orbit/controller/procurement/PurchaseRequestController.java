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

    /**
     * 생성자를 통한 의존성 주입
     *
     * @param purchaseRequestService 구매 요청 서비스
     */
    public PurchaseRequestController(PurchaseRequestService purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }

    /**
     * 모든 구매 요청을 조회합니다.
     *
     * @return 구매 요청 목록
     */
    @GetMapping
    public ResponseEntity<List<PurchaseRequestDTO>> getAllPurchaseRequests() {
        List<PurchaseRequestDTO> purchaseRequests = purchaseRequestService.getAllPurchaseRequests();
        return new ResponseEntity<>(purchaseRequests, HttpStatus.OK);
    }

    /**
     * 구매 요청 ID로 구매 요청을 조회합니다.
     *
     * @param id 구매 요청 ID
     * @return 조회된 구매 요청 (존재하지 않으면 404 상태 코드 반환)
     */
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

    /**
     * 새로운 구매 요청을 생성합니다.
     *
     * @param purchaseRequestDTO 생성할 구매 요청 정보
     * @return 생성된 구매 요청 (201 상태 코드 반환)
     */
    @PostMapping
    public ResponseEntity<PurchaseRequestResponseDTO> createPurchaseRequest(@Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequestResponseDTO createdPurchaseRequest = purchaseRequestService.createPurchaseRequest(purchaseRequestDTO);
        return new ResponseEntity<>(createdPurchaseRequest, HttpStatus.CREATED);
    }

    /**
     * 구매 요청 정보를 업데이트합니다.
     *
     * @param id               업데이트할 구매 요청 ID
     * @param purchaseRequestDTO 업데이트할 구매 요청 정보
     * @return 업데이트된 구매 요청
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> updatePurchaseRequest(@PathVariable Long id, @Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequestResponseDTO updatedPurchaseRequest = purchaseRequestService.updatePurchaseRequest(id, purchaseRequestDTO);
        return new ResponseEntity<>(updatedPurchaseRequest, HttpStatus.OK);
    }

    /**
     * 구매 요청을 삭제합니다.
     *
     * @param id 삭제할 구매 요청 ID
     * @return 삭제 성공 여부 (성공 시 204, 실패 시 404)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseRequest(@PathVariable Long id) {
        boolean isDeleted = purchaseRequestService.deletePurchaseRequest(id);
        return isDeleted ? new ResponseEntity<>(HttpStatus.NO_CONTENT) : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}
