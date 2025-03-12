package com.orbit.controller.bidding;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingContractDto;
import com.orbit.service.bidding.BiddingContractService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/biddings/contracts")
@RequiredArgsConstructor
public class BiddingContractController {
    
    private final BiddingContractService biddingContractService;

    @PostMapping("/draft")
    @Operation(summary = "계약 초안 생성", description = "입찰에 대한 계약 초안을 생성합니다.")
    public ResponseEntity<BiddingContractDto> createContractDraft(
        @Parameter(description = "입찰 ID") @RequestParam Long biddingId, 
        @Parameter(description = "입찰 참여 ID") @RequestParam Long participationId,
        Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        BiddingContractDto contractDto = biddingContractService.createContractDraft(
            biddingId, participationId, currentUserId
        );
        return ResponseEntity.ok(contractDto);
    }

    @PutMapping("/{contractId}/proceed")
    @Operation(summary = "계약 진행", description = "계약 상태를 진행중으로 변경합니다.")
    public ResponseEntity<BiddingContractDto> proceedContract(
        @Parameter(description = "계약 ID") @PathVariable Long contractId,
        Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        BiddingContractDto contractDto = biddingContractService.proceedContract(
            contractId, currentUserId
        );
        return ResponseEntity.ok(contractDto);
    }

    @PutMapping("/{contractId}/sign/buyer")
    @Operation(summary = "구매자 서명", description = "구매자의 계약 서명을 처리합니다.")
    public ResponseEntity<BiddingContractDto> signByBuyer(
        @Parameter(description = "계약 ID") @PathVariable Long contractId,
        @Parameter(description = "구매자 서명") @RequestBody String buyerSignature,
        Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        BiddingContractDto contractDto = biddingContractService.signByBuyer(
            contractId, buyerSignature, currentUserId
        );
        return ResponseEntity.ok(contractDto);
    }

    @PutMapping("/{contractId}/sign/supplier")
    @Operation(summary = "공급자 서명", description = "공급자의 계약 서명을 처리합니다.")
    public ResponseEntity<BiddingContractDto> signBySupplier(
        @Parameter(description = "계약 ID") @PathVariable Long contractId,
        @Parameter(description = "공급자 서명") @RequestBody String supplierSignature,
        Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        BiddingContractDto contractDto = biddingContractService.signBySupplier(
            contractId, supplierSignature, currentUserId
        );
        return ResponseEntity.ok(contractDto);
    }

    @PutMapping("/{contractId}/order")
    @Operation(summary = "계약 발주", description = "서명 완료된 계약에 대해 발주를 처리합니다.")
    public ResponseEntity<BiddingContractDto> placeOrder(
        @Parameter(description = "계약 ID") @PathVariable Long contractId,
        Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        BiddingContractDto contractDto = biddingContractService.placeOrder(
            contractId, currentUserId
        );
        return ResponseEntity.ok(contractDto);
    }

    @GetMapping
    @Operation(summary = "계약 목록 조회", description = "사용자의 계약 목록을 조회합니다.")
    public ResponseEntity<List<BiddingContractDto>> getContractList(
        Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        List<BiddingContractDto> contracts = biddingContractService.getContractList(currentUserId);
        return ResponseEntity.ok(contracts);
    }

    @GetMapping("/{contractId}")
    @Operation(summary = "계약 상세 조회", description = "특정 계약의 상세 정보를 조회합니다.")
    public ResponseEntity<BiddingContractDto> getContractDetail(
        @Parameter(description = "계약 ID") @PathVariable Long contractId,
        Authentication authentication
    ) {
        String currentUserId = authentication.getName();
        BiddingContractDto contractDto = biddingContractService.getContractDetail(
            contractId, currentUserId
        );
        return ResponseEntity.ok(contractDto);
    }
}