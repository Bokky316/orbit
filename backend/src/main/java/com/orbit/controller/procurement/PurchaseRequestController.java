package com.orbit.controller.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.PurchaseRequestResponseDTO;
import com.orbit.service.procurement.PurchaseRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * 구매 요청 관련 RESTful API를 처리하는 컨트롤러 클래스
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
     * 모든 구매 요청을 조회합니다.
     * @return 구매 요청 목록
     */
    @GetMapping
    public ResponseEntity<List<PurchaseRequestResponseDTO>> getAllPurchaseRequests() {
        List<PurchaseRequestResponseDTO> purchaseRequests = purchaseRequestService.getAllPurchaseRequests();
        return new ResponseEntity<>(purchaseRequests, HttpStatus.OK);
    }

    /**
     * 구매 요청 ID로 구매 요청을 조회합니다.
     * @param id 구매 요청 ID
     * @return 조회된 구매 요청 (존재하지 않으면 404 상태 코드 반환)
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> getPurchaseRequestById(@PathVariable Long id) {
        Optional<PurchaseRequestResponseDTO> purchaseRequest = purchaseRequestService.getPurchaseRequestById(id);
        return purchaseRequest.map(response -> new ResponseEntity<>(response, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * 새로운 구매 요청을 생성합니다.
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
     * @param id 업데이트할 구매 요청 ID
     * @param purchaseRequestDTO 업데이트할 구매 요청 정보
     * @return 업데이트된 구매 요청
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseRequestResponseDTO> updatePurchaseRequest(@PathVariable Long id, @Valid @RequestBody PurchaseRequestDTO purchaseRequestDTO) {
        PurchaseRequestResponseDTO updatedPurchaseRequest = purchaseRequestService.updatePurchaseRequest(id, purchaseRequestDTO);
        return new ResponseEntity<>(updatedPurchaseRequest, HttpStatus.OK);
    }
}
