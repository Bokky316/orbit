package com.orbit.controller.bidding;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.bidding.BiddingContractDto;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingContractService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class BiddingContractController {
    private final BiddingContractService contractService;
    private final MemberRepository memberRepository;
    
    /**
     * 계약 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<BiddingContractDto>> getAllContracts() {
        log.info("계약 목록 조회 요청");
        
        try {
            List<BiddingContractDto> contracts = contractService.getAllContracts();
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            log.error("계약 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 상태의 계약 목록 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BiddingContractDto>> getContractsByStatus(@PathVariable String status) {
        log.info("특정 상태의 계약 목록 조회 요청 - 상태: {}", status);
        
        try {
            List<BiddingContractDto> contracts = contractService.getContractsByStatus(status);
            return ResponseEntity.ok(contracts);
        } catch (IllegalArgumentException e) {
            log.error("유효하지 않은 상태 코드: {}", status);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("계약 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 입찰 공고의 계약 목록 조회
     */
    @GetMapping("/bidding/{biddingId}")
    public ResponseEntity<List<BiddingContractDto>> getContractsByBiddingId(@PathVariable Long biddingId) {
        log.info("특정 입찰 공고의 계약 목록 조회 요청 - 입찰 ID: {}", biddingId);
        
        try {
            List<BiddingContractDto> contracts = contractService.getContractsByBiddingId(biddingId);
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            log.error("계약 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 공급사의 계약 목록 조회
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<BiddingContractDto>> getContractsBySupplierId(@PathVariable Long supplierId) {
        log.info("특정 공급사의 계약 목록 조회 요청 - 공급사 ID: {}", supplierId);
        
        try {
            List<BiddingContractDto> contracts = contractService.getContractsBySupplierId(supplierId);
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            log.error("계약 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<BiddingContractDto> getContractById(@PathVariable Long id) {
        log.info("계약 상세 조회 요청 - ID: {}", id);
        
        try {
            BiddingContractDto contract = contractService.getContractById(id);
            return ResponseEntity.ok(contract);
        } catch (Exception e) {
            log.error("계약 상세 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 번호로 계약 조회
     */
    @GetMapping("/number/{transactionNumber}")
    public ResponseEntity<BiddingContractDto> getContractByTransactionNumber(@PathVariable String transactionNumber) {
        log.info("계약 번호로 계약 조회 요청 - 계약번호: {}", transactionNumber);
        
        try {
            BiddingContractDto contract = contractService.getContractByTransactionNumber(transactionNumber);
            return ResponseEntity.ok(contract);
        } catch (Exception e) {
            log.error("계약 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 상태 변경 이력 조회
     */
    @GetMapping("/{id}/status-histories")
    public ResponseEntity<List<StatusHistory>> getContractStatusHistories(@PathVariable Long id) {
        log.info("계약 상태 변경 이력 조회 요청 - ID: {}", id);
        
        try {
            List<StatusHistory> histories = contractService.getContractStatusHistories(id);
            return ResponseEntity.ok(histories);
        } catch (Exception e) {
            log.error("상태 이력 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 세부 정보 업데이트
     */
    @PutMapping("/{id}")
    public ResponseEntity<BiddingContractDto> updateContractDetails(
            @PathVariable Long id,
            @Valid @RequestBody BiddingContractDto contractDto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("계약 세부 정보 업데이트 요청 - ID: {}", id);
        
        try {
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingContractDto updatedContract = contractService.updateContractDetails(id, contractDto);
            return ResponseEntity.ok(updatedContract);
        } catch (IllegalStateException e) {
            log.error("계약 업데이트 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("계약 업데이트 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 계약 진행 시작
     */
    @PutMapping("/{id}/start")
    public ResponseEntity<BiddingContractDto> startContract(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("계약 진행 시작 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            BiddingContractDto startedContract = contractService.startContract(id, member.getId());
            return ResponseEntity.ok(startedContract);
        } catch (IllegalStateException e) {
            log.error("계약 진행 시작 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("계약 진행 시작 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 구매자 서명
     */
    @PutMapping("/{id}/sign-buyer")
    public ResponseEntity<BiddingContractDto> signByBuyer(
            @PathVariable Long id,
            @RequestParam String signature,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("구매자 서명 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 역할을 가진 사용자만 가능하도록)
            
            BiddingContractDto signedContract = contractService.signByBuyer(id, signature, member.getId());
            return ResponseEntity.ok(signedContract);
        } catch (IllegalStateException e) {
            log.error("구매자 서명 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("구매자 서명 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 공급자 서명
     */
    @PutMapping("/{id}/sign-supplier")
    public ResponseEntity<BiddingContractDto> signBySupplier(
            @PathVariable Long id,
            @RequestParam String signature,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("공급자 서명 요청 - ID: {}", id);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (계약 연관 공급자만 가능하도록)
            
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
     * 계약 취소
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BiddingContractDto> cancelContract(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("계약 취소 요청 - ID: {}, 취소 사유: {}", id, reason);
        
        try {
            // 현재 사용자 정보 조회
            Member member = getUserFromUserDetails(userDetails);
            
            // TODO: 권한 체크 로직 추가 (구매자 또는 관리자만 가능하도록)
            
            BiddingContractDto cancelledContract = contractService.cancelContract(id, reason, member.getId());
            return ResponseEntity.ok(cancelledContract);
        } catch (IllegalStateException e) {
            log.error("계약 취소 불가: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("계약 취소 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 특정 날짜 범위에 종료되는 계약 목록 조회
     */
    @GetMapping("/expiring")
    public ResponseEntity<List<BiddingContractDto>> getContractsExpiringBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        log.info("만료 예정 계약 목록 조회 요청 - 시작일: {}, 종료일: {}", startDate, endDate);
        
        try {
            List<BiddingContractDto> contracts = contractService.getContractsExpiringBetween(startDate, endDate);
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            log.error("만료 예정 계약 목록 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 양측 모두 서명한 계약 목록 조회
     */
    @GetMapping("/both-signed")
    public ResponseEntity<List<BiddingContractDto>> getBothPartiesSignedContracts() {
        log.info("양측 모두 서명한 계약 목록 조회 요청");
        
        try {
            List<BiddingContractDto> contracts = contractService.getBothPartiesSignedContracts();
            return ResponseEntity.ok(contracts);
        } catch (Exception e) {
            log.error("양측 모두 서명한 계약 목록 조회 중 오류 발생", e);
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
        
        return memberRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
    }
}