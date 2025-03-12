package com.orbit.service.supplier;

import com.orbit.dto.supplier.SupplierRegistrationRequestDto;
import com.orbit.entity.member.Member;
import com.orbit.entity.state.SystemStatus;
import com.orbit.entity.supplier.SupplierAttachment;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.supplier.SupplierAttachmentRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SupplierRegistrationService {
    private final SupplierRegistrationRepository supplierRegistrationRepository;
    private final SupplierAttachmentRepository attachmentRepository;
    private final MemberRepository memberRepository;

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
        registration.setPhoneNumber(requestDto.getPhoneNumber());
        registration.setHeadOfficeAddress(requestDto.getHeadOfficeAddress());
        registration.setComments(requestDto.getComments());
        registration.setStatus(new SystemStatus("SUPPLIER", "PENDING"));
        registration.setRegistrationDate(LocalDate.now());

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
     * 🔹 협력업체 승인
     */
    public void approveSupplier(Long id) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "APPROVED"));
    }

    /**
     * 🔹 협력업체 거절
     */
    public void rejectSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "REJECTED"));
        registration.setRejectionReason(reason);
    }

    /**
     * 🔹 협력업체 일시정지
     */
    public void suspendSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "SUSPENDED"));
        registration.setRejectionReason(reason);
    }

    /**
     * 🔹 협력업체 블랙리스트 등록
     */
    public void blacklistSupplier(Long id, String reason) {
        SupplierRegistration registration = getSupplierById(id);
        registration.setStatus(new SystemStatus("SUPPLIER", "BLACKLIST"));
        registration.setRejectionReason(reason);
    }
}