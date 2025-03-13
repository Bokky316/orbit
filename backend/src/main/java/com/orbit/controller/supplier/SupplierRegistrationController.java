package com.orbit.controller.supplier;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.orbit.dto.supplier.SupplierApprovalDto;
import com.orbit.dto.supplier.SupplierRegistrationRequestDto;
import com.orbit.dto.supplier.SupplierRegistrationResponseDto;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.service.supplier.SupplierRegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/supplier-registrations") // 기본 경로 유지
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPPLIER')") // 클래스 레벨 공통 권한 설정
@Slf4j
public class SupplierRegistrationController {

    private final SupplierRegistrationService supplierRegistrationService;

    // 🟢 협력업체 목록 조회 - 권한별 처리 추가
    @GetMapping
    public ResponseEntity<List<SupplierRegistrationResponseDto>> getSuppliers(
            @RequestParam(required = false) String status) {

        try {
            // 현재 로그인한 사용자의 권한과 정보 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

            List<SupplierRegistration> suppliers;
            if (isAdmin) {
                // 관리자는 모든 업체 조회 가능
                if (status == null || status.isEmpty()) {
                    suppliers = supplierRegistrationService.getSuppliers(null);
                } else {
                    if (!Arrays.asList("PENDING", "APPROVED", "REJECTED", "SUSPENDED", "BLACKLIST")
                            .contains(status.toUpperCase())) {
                        return ResponseEntity.badRequest().body(List.of());
                    }
                    suppliers = supplierRegistrationService.getSuppliers(status.toUpperCase());
                }
            } else {
                // 일반 업체는 자신의 정보만 조회 가능
                String username = authentication.getName(); // 현재 로그인한 사용자 아이디

                if (status == null || status.isEmpty()) {
                    suppliers = supplierRegistrationService.getSuppliersByUsername(username, null);
                } else {
                    if (!Arrays.asList("PENDING", "APPROVED", "REJECTED", "SUSPENDED", "BLACKLIST")
                            .contains(status.toUpperCase())) {
                        return ResponseEntity.badRequest().body(List.of());
                    }
                    suppliers = supplierRegistrationService.getSuppliersByUsername(username, status.toUpperCase());
                }
            }

            List<SupplierRegistrationResponseDto> response = suppliers.stream()
                    .map(SupplierRegistrationResponseDto::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("협력업체 목록 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    // 🟢 협력업체 상세 조회 - 권한별 처리 추가
    @GetMapping("/{id}/detail")
    public ResponseEntity<SupplierRegistrationResponseDto> getSupplier(@PathVariable Long id) {
        try {
            // 현재 로그인한 사용자의 권한과 정보 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            String username = authentication.getName();

            SupplierRegistration supplier = supplierRegistrationService.getSupplierById(id);

            // 관리자가 아니면서 자신의 등록 정보가 아니면 접근 불가
            if (!isAdmin && !supplier.getSupplier().getUsername().equals(username)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
            }

            return ResponseEntity.ok(SupplierRegistrationResponseDto.fromEntity(supplier));
        } catch (IllegalArgumentException e) {
            log.error("존재하지 않는 협력업체 ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("협력업체 상세 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 🟢 협력업체 등록 - JSON 요청 (파일 없음)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<SupplierRegistrationResponseDto> registerSupplier(
            @Valid @RequestBody SupplierRegistrationRequestDto requestDto) {

        try {
            SupplierRegistration registration = supplierRegistrationService.registerSupplier(requestDto, null);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(SupplierRegistrationResponseDto.fromEntity(registration));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 🟢 협력업체 등록 - Multipart 요청 (파일 포함)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<SupplierRegistrationResponseDto> registerSupplierWithFiles(
            @RequestPart(value = "supplierRegistrationDTO") String supplierRegistrationDTOString,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {

        try {
            // JSON 문자열 로깅
            log.info("수신된 DTO 문자열: {}", supplierRegistrationDTOString);

            // JSON 문자열을 DTO 객체로 변환
            ObjectMapper objectMapper = new ObjectMapper();
            // LocalDate 변환을 위한 모듈 등록
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            SupplierRegistrationRequestDto requestDto = objectMapper.readValue(
                    supplierRegistrationDTOString,
                    SupplierRegistrationRequestDto.class
            );

            // 변환된 DTO 로깅
            log.info("변환된 DTO: {}", requestDto);

            // 파일 로깅
            if (files != null) {
                log.info("파일 수신: {} 개", files.length);
                for (MultipartFile file : files) {
                    log.info("파일 정보: {}, 크기: {}", file.getOriginalFilename(), file.getSize());
                }
            }

            SupplierRegistration registration = supplierRegistrationService.registerSupplier(requestDto, files);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(SupplierRegistrationResponseDto.fromEntity(registration));
        } catch (Exception e) {
            log.error("협력업체 등록 오류: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 🟢 파일만 업로드하는 별도 엔드포인트 추가
    @PostMapping("/{id}/attachments")
    public ResponseEntity<SupplierRegistrationResponseDto> addAttachmentsToSupplier(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {

        try {
            // 현재 로그인한 사용자의 권한과 정보 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            String username = authentication.getName();

            SupplierRegistration supplier = supplierRegistrationService.getSupplierById(id);

            // 관리자가 아니면서 자신의 등록 정보가 아니면 접근 불가
            if (!isAdmin && !supplier.getSupplier().getUsername().equals(username)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
            }

            SupplierRegistration updatedSupplier = supplierRegistrationService.addAttachmentsToSupplier(id, files);
            return ResponseEntity.ok(SupplierRegistrationResponseDto.fromEntity(updatedSupplier));
        } catch (IllegalArgumentException e) {
            log.error("존재하지 않는 협력업체 ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("첨부파일 업로드 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 🟢 상태 업데이트 (ADMIN 전용)
    @PutMapping("/status/{id}") // 경로 구조 변경
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateSupplierStatus(
            @PathVariable Long id,
            @Valid @RequestBody SupplierApprovalDto requestDto) {

        switch(requestDto.getStatusCode().toUpperCase()) {
            case "REJECTED":
                supplierRegistrationService.rejectSupplier(id, requestDto.getRejectionReason());
                break;
            case "APPROVED":
                supplierRegistrationService.approveSupplier(id);
                break;
            case "SUSPENDED":
                supplierRegistrationService.suspendSupplier(id, requestDto.getRejectionReason());
                break;
            case "BLACKLIST":
                supplierRegistrationService.blacklistSupplier(id, requestDto.getRejectionReason());
                break;
            default:
                throw new IllegalArgumentException("Invalid status code");
        }
        return ResponseEntity.noContent().build();
    }

    // 🟢 첨부파일 다운로드 엔드포인트 추가
    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long attachmentId,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {

        try {
            // 현재 로그인한 사용자의 권한과 정보 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            String username = authentication.getName();

            // 파일 다운로드 권한 체크
            boolean hasAccess = supplierRegistrationService.checkAttachmentAccess(attachmentId, username, isAdmin);
            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = supplierRegistrationService.downloadAttachment(attachmentId);

            // 파일명 인코딩 처리
            String filename = resource.getFilename();
            String encodedFilename;

            if (userAgent != null && (userAgent.contains("Trident") || userAgent.contains("MSIE"))) {
                encodedFilename = UriUtils.encode(filename, StandardCharsets.UTF_8)
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

        } catch (Exception e) {
            log.error("파일 다운로드 실패: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}