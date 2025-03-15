package com.orbit.controller.bidding;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingContractDto;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingContractService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/supplier/contracts")
@RequiredArgsConstructor
public class SupplierContractController {
    private final BiddingContractService contractService;
    private final MemberRepository memberRepository;
    
    /**
     * 공급업체의 계약 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingContractDto>> getSupplierContracts(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("공급업체 계약 목록 조회 요청");
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            List<BiddingContractDto> contracts = contractService.getContractsBySupplierId(supplierId);
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            log.error("공급업체 계약 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 상태의 계약 목록 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BiddingContractDto>> getSupplierContractsByStatus(
            @PathVariable String status,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("특정 상태의 공급업체 계약 목록 조회 요청 - 상태: {}", status);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 특정 상태의 계약 목록 필터링 (현재 공급업체만)
            List<BiddingContractDto> allContracts = contractService.getContractsBySupplierId(supplierId);
            List<BiddingContractDto> filteredContracts = allContracts.stream()
                    .filter(c -> status.equals(c.getStatusText()))
                    .toList();
                    
            return ResponseEntity.ok(filteredContracts);
        } catch (Exception e) {
            log.error("공급업체 계약 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingContractDto> getContractDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("계약 상세 조회 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 계약 정보 조회
            BiddingContractDto contract = contractService.getContractById(id);
            
            // 해당 공급업체의 계약인지 확인
            if (!supplierId.equals(contract.getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(contract);
        } catch (Exception e) {
            log.error("계약 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 공급자 서명
     */
    @PutMapping("/{id}/sign")
    public ResponseEntity<BiddingContractDto> signContract(
            @PathVariable Long id,
            @RequestParam String signature,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("공급자 서명 요청 - 계약 ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 계약 정보 조회
            BiddingContractDto contract = contractService.getContractById(id);
            
            // 해당 공급업체의 계약인지 확인
            if (!supplierId.equals(contract.getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // 서명 요청
            BiddingContractDto signedContract = contractService.signBySupplier(id, signature);
            return ResponseEntity.ok(signedContract);
        } catch (IllegalStateException e) {
            log.error("공급자 서명 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("공급자 서명 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 상태 변경 이력 조회
     */
    @GetMapping("/{id}/status-histories")
    public ResponseEntity<List<StatusHistory>> getContractStatusHistories(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("계약 상태 변경 이력 조회 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회 (공급업체만 접근 가능)
            Member supplier = getUserFromUserDetails(userDetails);
            Long supplierId = supplier.getId();
            
            // 계약 정보 조회
            BiddingContractDto contract = contractService.getContractById(id);
            
            // 해당 공급업체의 계약인지 확인
            if (!supplierId.equals(contract.getSupplierId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            List<StatusHistory> histories = contractService.getContractStatusHistories(id);
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            log.error("상태 이력 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * UserDetails로부터 Member 객체 조회
     */
    private Member getUserFromUserDetails(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("인증된 사용자 정보가 필요합니다.");
        }
        
        Member member = memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
                
        // 공급업체 역할 확인
        if (!member.getRole().equals(Member.Role.SUPPLIER)) {
            throw new IllegalArgumentException("공급업체 권한이 필요합니다.");
        }
        
        return member;
    }
}