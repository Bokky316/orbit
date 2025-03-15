package com.orbit.service.supplier;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.orbit.dto.supplier.SupplierRegistrationRequestDto;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.member.Member;
import com.orbit.entity.supplier.SupplierAttachment;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.event.event.SupplierStatusChangeEvent;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.supplier.SupplierAttachmentRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SupplierRegistrationService {
    private final SupplierRegistrationRepository supplierRegistrationRepository;
    private final SupplierAttachmentRepository attachmentRepository;
    private final MemberRepository memberRepository;
    private final ApplicationEventPublisher applicationEventPublisher; // 추가

    @Value("${uploadPath}")
    private String uploadPath;

    /**
     * 🔹 협력업체 목록 조회
     */
    @Transactional(readOnly = true)
    public List<SupplierRegistration> getSuppliers(String statusCode) {
        log.info("🔍 StatusCode: {}", statusCode);

        if (statusCode == null) {
            List<SupplierRegistration> allSuppliers = supplierRegistrationRepository.findAll();
            log.info("✅ 전체 조회, 총 개수: {}", allSuppliers.size());
            return allSuppliers;
        }

        List<SupplierRegistration> filteredSuppliers = supplierRegistrationRepository.findByStatusChildCode(statusCode);
        log.info("✅ 상태별 조회, 총 개수: {}", filteredSuppliers.size());

        return filteredSuppliers;
    }

    /**
     * 🔹 협력업체 목록 조회 - 사용자별
     */
    @Transactional(readOnly = true)
    public List<SupplierRegistration> getSuppliersByUsername(String username, String statusCode) {
        log.info("🔍 Username: {}, StatusCode: {}", username, statusCode);

        // 먼저 사용자 정보 조회
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + username));

        // 사용자 ID로 등록된 업체 목록 필터링
        List<SupplierRegistration> userSuppliers;
        if (statusCode == null) {
            userSuppliers = supplierRegistrationRepository.findAll()
                    .stream()
                    .filter(supplier -> supplier.getSupplier().getId().equals(member.getId()))
                    .collect(Collectors.toList());
        } else {
            userSuppliers = supplierRegistrationRepository.findByStatusChildCode(statusCode)
                    .stream()
                    .filter(supplier -> supplier.getSupplier().getId().equals(member.getId()))
                    .collect(Collectors.toList());
        }

        log.info("✅ 사용자별 조회, 총 개수: {}", userSuppliers.size());
        return userSuppliers;
    }

    /**
     * 🔹 협력업체 상세 조회
     */
    @Transactional(readOnly = true)
    public SupplierRegistration getSupplierById(Long id) {
        return supplierRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("협력업체가 존재하지 않습니다."));
    }

    /**
     * 🔹 협력업체 등록 요청 (파일 업로드 포함)
     * Purchase와 동일한 패턴으로 수정
     */
    public SupplierRegistration registerSupplier(SupplierRegistrationRequestDto requestDto, MultipartFile[] files) {
        // 회원 존재 여부 확인
        Member supplier = memberRepository.findById(requestDto.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // 사업자등록번호 중복 체크
        supplierRegistrationRepository.findByBusinessNo(requestDto.getBusinessNo())
                .ifPresent(existingReg -> {
                    throw new IllegalArgumentException("이미 등록된 사업자등록번호입니다.");
                });

        // 협력업체 등록 엔티티 생성
        SupplierRegistration registration = new SupplierRegistration();
        registration.setSupplier(supplier);
        registration.setBusinessNo(requestDto.getBusinessNo());
        registration.setCeoName(requestDto.getCeoName());
        registration.setBusinessType(requestDto.getBusinessType());
        registration.setBusinessCategory(requestDto.getBusinessCategory());
        registration.setSourcingCategory(requestDto.getSourcingCategory());
        registration.setSourcingSubCategory(requestDto.getSourcingSubCategory());
        registration.setSourcingDetailCategory(requestDto.getSourcingDetailCategory());
        registration.setPhoneNumber(requestDto.getPhoneNumber());

        // 주소 관련 필드 설정 (headOfficeAddress 대신 개별 필드 사용)
        registration.setPostalCode(requestDto.getPostalCode());
        registration.setRoadAddress(requestDto.getRoadAddress());
        registration.setDetailAddress(requestDto.getDetailAddress());

        registration.setComments(requestDto.getComments());
        registration.setStatus(new SystemStatus("SUPPLIER", "PENDING"));
        registration.setRegistrationDate(LocalDate.now());

        // 담당자 정보 설정
        registration.setContactPerson(requestDto.getContactPerson());
        registration.setContactPhone(requestDto.getContactPhone());
        registration.setContactEmail(requestDto.getContactEmail());

        // 저장
        SupplierRegistration savedRegistration = supplierRegistrationRepository.save(registration);

        // 파일이 있는 경우 처리
        if (files != null && files.length > 0) {
            processAttachments(savedRegistration, files);
        }

        return savedRegistration;
    }

    /**
     * 첨부파일 처리
     * Purchase와 동일한 패턴
     */
    private void processAttachments(SupplierRegistration supplierRegistration, MultipartFile[] files) {
        for (MultipartFile file : files) {
            try {
                // 파일명 정제 - 특수 문자 제거
                String fileName = StringUtils.cleanPath(file.getOriginalFilename())
                        .replaceAll("[^a-zA-Z0-9.-]", "_");  // 안전한 파일명으로 변경

                // 절대 경로 생성
                Path baseDir = Paths.get(uploadPath).toAbsolutePath();
                String subDir = "supplier_" + supplierRegistration.getId();
                Path targetDir = baseDir.resolve(subDir);

                // 디렉토리 존재 확인 및 생성
                Files.createDirectories(targetDir);

                // 고유한 파일명 생성
                String uniqueFileName = System.currentTimeMillis() + "_" + fileName;
                Path targetPath = targetDir.resolve(uniqueFileName);

                // 파일 복사
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                // 상대 경로로 저장 (백슬래시를 슬래시로 변경)
                String relativePath = Paths.get(subDir, uniqueFileName).toString().replace("\\", "/");

                SupplierAttachment attachment = SupplierAttachment.builder()
                        .fileName(fileName)
                        .filePath(relativePath)  // 상대 경로 사용
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .supplierRegistration(supplierRegistration)
                        .build();

                attachmentRepository.save(attachment);

            } catch (IOException e) {
                log.error("파일 저장 실패: {}", e.getMessage(), e);
                throw new RuntimeException("파일 처리 중 오류 발생", e);
            }
        }
    }

    /**
     * 기존 협력업체에 첨부 파일 추가
     */
    public SupplierRegistration addAttachmentsToSupplier(Long id, MultipartFile[] files) {
        SupplierRegistration supplierRegistration = supplierRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("협력업체가 존재하지 않습니다: " + id));

        if (files != null && files.length > 0) {
            processAttachments(supplierRegistration, files);
        }

        return supplierRegistration;
    }

    /**
     * 첨부파일 다운로드
     */
    public Resource downloadAttachment(Long attachmentId) {
        SupplierAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("첨부파일을 찾을 수 없습니다: " + attachmentId));

        Path file = Paths.get(uploadPath).resolve(attachment.getFilePath());
        Resource resource = new FileSystemResource(file);

        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("파일을 다운로드 할 수 없습니다: " + attachment.getFileName());
        }
    }

    /**
     * 첨부파일 접근 권한 확인
     */
    @Transactional(readOnly = true)
    public boolean checkAttachmentAccess(Long attachmentId, String username, boolean isAdmin) {
        if (isAdmin) {
            return true;  // 관리자는 항상 접근 가능
        }

        SupplierAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("첨부파일을 찾을 수 없습니다: " + attachmentId));

        // 파일을 업로드한 사용자와 현재 사용자가 동일한지 확인
        String ownerUsername = attachment.getSupplierRegistration().getSupplier().getUsername();
        return ownerUsername.equals(username);
    }

    /**
     * 🔹 협력업체 승인
     */
    public void approveSupplier(Long id) {
        SupplierRegistration registration = getSupplierById(id);

        // 이전 상태 저장
        String oldStatus = registration.getStatus() != null ? registration.getStatus().getFullCode() : null;

        // 상태 변경
        registration.setStatus(new SystemStatus("SUPPLIER", "APPROVED"));

        // 이벤트 발행
        publishStatusChangeEvent(id, oldStatus, "SUPPLIER-STATUS-APPROVED", getCurrentUsername());
    }

    /**
     * 🔹 협력업체 거절
     */
    public void rejectSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);

        // 이전 상태 저장
        String oldStatus = registration.getStatus() != null ? registration.getStatus().getFullCode() : null;

        // 상태 변경
        registration.setStatus(new SystemStatus("SUPPLIER", "REJECTED"));
        registration.setRejectionReason(reason);

        // 이벤트 발행
        publishStatusChangeEvent(id, oldStatus, "SUPPLIER-STATUS-REJECTED", getCurrentUsername());
    }

    /**
     * 🔹 협력업체 일시정지
     */
    public void suspendSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);

        // 이전 상태 저장
        String oldStatus = registration.getStatus() != null ? registration.getStatus().getFullCode() : null;

        // 상태 변경
        registration.setStatus(new SystemStatus("SUPPLIER", "SUSPENDED"));
        registration.setRejectionReason(reason);

        // 이벤트 발행
        publishStatusChangeEvent(id, oldStatus, "SUPPLIER-STATUS-SUSPENDED", getCurrentUsername());
    }

    /**
     * 🔹 협력업체 블랙리스트 등록
     */
    public void blacklistSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);

        // 이전 상태 저장
        String oldStatus = registration.getStatus() != null ? registration.getStatus().getFullCode() : null;

        // 상태 변경
        registration.setStatus(new SystemStatus("SUPPLIER", "BLACKLIST"));
        registration.setRejectionReason(reason);

        // 이벤트 발행
        publishStatusChangeEvent(id, oldStatus, "SUPPLIER-STATUS-BLACKLIST", getCurrentUsername());
    }

    /**
     * 🔹 협력업체 비활성화
     */
    public void inactivateSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);

        // 이전 상태 저장
        String oldStatus = registration.getStatus() != null ? registration.getStatus().getFullCode() : null;

        // 상태 변경
        registration.setStatus(new SystemStatus("SUPPLIER", "INACTIVE"));
        registration.setRejectionReason(reason);

        // 이벤트 발행
        publishStatusChangeEvent(id, oldStatus, "SUPPLIER-STATUS-INACTIVE", getCurrentUsername());
    }

    /**
     * 🔹 협력업체 활성화 (비활성화된 업체를 다시 활성화)
     */
    public void activateSupplier(Long id) {
        SupplierRegistration registration = getSupplierById(id);

        // 이전 상태 저장
        String oldStatus = registration.getStatus() != null ? registration.getStatus().getFullCode() : null;

        // 상태 변경
        registration.setStatus(new SystemStatus("SUPPLIER", "APPROVED"));
        registration.setRejectionReason(null); // 비활성화 사유 제거

        // 이벤트 발행
        publishStatusChangeEvent(id, oldStatus, "SUPPLIER-STATUS-APPROVED", getCurrentUsername());
    }

    /**
     * 🔹 협력업체 정보 수정 (기존 + 파일 처리)
     */
    @Transactional
    public SupplierRegistration updateSupplier(Long id, SupplierRegistrationRequestDto requestDto, MultipartFile[] files) {
        // 협력업체 존재 여부 확인
        SupplierRegistration supplier = supplierRegistrationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 협력업체를 찾을 수 없습니다: " + id));

        // 대기 상태 또는 반려 상태인 경우만 수정 가능
        if (!"PENDING".equals(supplier.getStatus().getChildCode()) &&
                !"REJECTED".equals(supplier.getStatus().getChildCode())) {
            throw new IllegalArgumentException("대기 상태 또는 반려 상태인 협력업체만 수정할 수 있습니다.");
        }

        // 반려 상태일 경우 상태를 PENDING으로 변경하여 재심사 요청
        if ("REJECTED".equals(supplier.getStatus().getChildCode())) {
            supplier.setStatus(new SystemStatus("SUPPLIER", "PENDING"));
            // 반려 사유 초기화
            supplier.setRejectionReason(null);
        }

        // 회원 존재 여부 확인
        Member member = memberRepository.findById(requestDto.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("회원이 존재하지 않습니다."));

        // 사업자등록번호 중복 체크 - 다른 업체와 중복될 경우
        supplierRegistrationRepository.findByBusinessNo(requestDto.getBusinessNo())
                .ifPresent(existingReg -> {
                    // 현재 업체와 ID가 다른 경우에만 중복으로 처리
                    if (!existingReg.getId().equals(id)) {
                        throw new IllegalArgumentException("이미 등록된 사업자등록번호입니다.");
                    }
                });

        // 기존 업체 정보 업데이트
        supplier.setBusinessNo(requestDto.getBusinessNo());
        supplier.setCeoName(requestDto.getCeoName());
        supplier.setBusinessType(requestDto.getBusinessType());
        supplier.setBusinessCategory(requestDto.getBusinessCategory());
        supplier.setSourcingCategory(requestDto.getSourcingCategory());
        supplier.setSourcingSubCategory(requestDto.getSourcingSubCategory());
        supplier.setSourcingDetailCategory(requestDto.getSourcingDetailCategory());
        supplier.setPhoneNumber(requestDto.getPhoneNumber());

        // 주소 관련 필드 업데이트 (headOfficeAddress 대신 개별 필드 사용)
        supplier.setPostalCode(requestDto.getPostalCode());
        supplier.setRoadAddress(requestDto.getRoadAddress());
        supplier.setDetailAddress(requestDto.getDetailAddress());

        supplier.setComments(requestDto.getComments());
        supplier.setContactPerson(requestDto.getContactPerson());
        supplier.setContactPhone(requestDto.getContactPhone());
        supplier.setContactEmail(requestDto.getContactEmail());

        // 기존 첨부 파일 삭제 (물리적 파일 삭제 추가)
        if (!supplier.getAttachments().isEmpty()) {
            // 1. 기존 파일의 물리적 파일 삭제
            for (SupplierAttachment attachment : supplier.getAttachments()) {
                try {
                    // 파일 경로 구성
                    Path filePath = Paths.get(uploadPath).resolve(attachment.getFilePath());
                    // 파일 존재 확인 후 삭제
                    if (Files.exists(filePath)) {
                        Files.delete(filePath);
                        log.info("파일 삭제 완료: {}", filePath);
                    }
                } catch (IOException e) {
                    log.error("파일 삭제 중 오류 발생: {}", e.getMessage());
                    // 파일 삭제 실패해도 진행 (DB에서는 삭제)
                }
            }

            // 2. DB에서 첨부파일 연결 제거 (orphanRemoval=true 설정으로 자동 삭제됨)
            supplier.getAttachments().clear();
        }

        // 새 파일이 있는 경우 처리
        if (files != null && files.length > 0) {
            processAttachments(supplier, files);
        }

        return supplierRegistrationRepository.save(supplier);
    }

    /**
     * 상태 변경 이벤트 발행
     */
    private void publishStatusChangeEvent(Long supplierId, String fromStatus, String toStatus, String username) {
        SupplierStatusChangeEvent event = new SupplierStatusChangeEvent(
                this,
                supplierId,
                fromStatus,
                toStatus,
                username
        );
        applicationEventPublisher.publishEvent(event);
        log.info("상태 변경 이벤트 발행: supplierId={}, fromStatus={}, toStatus={}, username={}",
                supplierId, fromStatus, toStatus, username);
    }

    /**
     * 현재 인증된 사용자 이름 조회
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            return authentication.getName();
        }
        return "system";
    }

    /**
     * 웹소켓을 통한 업체 상태 변경 처리
     * @param supplierId 협력업체 ID
     * @param newStatusCode 새로운 상태 코드
     * @param username 변경 요청자 사용자명
     * @return 업데이트된 협력업체 정보
     */
    @Transactional
    public SupplierRegistration updateSupplierStatusWithEvent(
            Long supplierId,
            String newStatusCode,
            String username
    ) {
        log.info("웹소켓을 통한 공급업체 상태 변경: id={}, toStatus={}, username={}",
                supplierId, newStatusCode, username);

        // 1. 협력업체 조회
        SupplierRegistration supplier = supplierRegistrationRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("협력업체가 존재하지 않습니다: " + supplierId));

        // 2. 이전 상태값 저장
        String oldStatusCode = supplier.getStatus() != null ? supplier.getStatus().getFullCode() : null;

        // 3. 새로운 상태값 설정 (newStatusCode 형식에 따라 처리)
        String processedStatusCode = newStatusCode;
        if (newStatusCode.contains("-")) {
            processedStatusCode = newStatusCode.split("-")[2]; // SUPPLIER-STATUS-APPROVED 형식에서 APPROVED 추출
        }

        // 4. 상태 변경 적용
        SystemStatus newStatus = new SystemStatus("SUPPLIER", processedStatusCode);
        supplier.setStatus(newStatus);

        // 5. 상태 변경 이벤트 발행
        publishStatusChangeEvent(
                supplierId,
                oldStatusCode,
                "SUPPLIER-STATUS-" + processedStatusCode,
                username
        );

        return supplier;
    }
}