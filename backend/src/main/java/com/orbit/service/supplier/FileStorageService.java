package com.orbit.service.supplier;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${uploadPath}")
    private String uploadPath;

    // 사업자등록증 하위 디렉토리 이름
    private static final String BUSINESS_CERT_DIR = "supplier_files";

    /**
     * 초기화 메서드 - 업로드 디렉토리 생성
     */
    @PostConstruct
    public void init() {
        try {
            // 업로드 기본 디렉토리 생성
            Path baseDir = Paths.get(uploadPath).toAbsolutePath().normalize();
            Files.createDirectories(baseDir);
            log.info("✅ 기본 업로드 디렉토리 생성됨: {}", baseDir);

            // 사업자등록증 저장 디렉토리 생성
            Path businessCertDir = baseDir.resolve(BUSINESS_CERT_DIR);
            Files.createDirectories(businessCertDir);
            log.info("✅ 사업자등록증 디렉토리 생성됨: {}", businessCertDir);
        } catch (IOException e) {
            log.error("❌ 디렉토리 생성 실패", e);
            throw new RuntimeException("파일 업로드 디렉토리 생성 실패", e);
        }
    }

    /**
     * 파일 저장 메서드
     * @param file 저장할 파일
     * @return 저장된 파일명
     */
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다");
        }

        try {
            // 파일명 정제 - 특수 문자 제거
            String fileName = StringUtils.cleanPath(file.getOriginalFilename())
                    .replaceAll("[^a-zA-Z0-9.-]", "_");  // 안전한 파일명으로 변경

            // 확장자 추출
            String extension = FilenameUtils.getExtension(fileName);

            // 고유한 파일명 생성
            String uniqueFileName = System.currentTimeMillis() + "_" + fileName;

            // 절대 경로 생성
            Path baseDir = Paths.get(uploadPath).toAbsolutePath().normalize();
            Path targetDir = baseDir.resolve(BUSINESS_CERT_DIR);

            // 디렉토리 존재 확인 및 생성
            Files.createDirectories(targetDir);

            // 저장 경로 설정
            Path targetPath = targetDir.resolve(uniqueFileName);

            // 파일 저장
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("📂 파일 저장 완료: {}", targetPath);

            // 상대 경로로 저장 (백슬래시를 슬래시로 변경)
            String relativePath = Paths.get(BUSINESS_CERT_DIR, uniqueFileName).toString().replace("\\", "/");

            return relativePath;
        } catch (IOException e) {
            log.error("❌ 파일 저장 실패", e);
            throw new RuntimeException("파일 저장 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 파일 다운로드를 위한 Resource 조회
     * @param fileName 파일 상대 경로
     * @return 파일 Resource
     */
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = Paths.get(uploadPath).resolve(fileName).normalize();
            Resource resource = new FileSystemResource(filePath.toFile());

            if (resource.exists()) {
                return resource;
            } else {
                log.error("❌ 파일을 찾을 수 없음: {}", fileName);
                throw new RuntimeException("파일을 찾을 수 없음: " + fileName);
            }
        } catch (Exception e) {
            log.error("❌ 파일 로드 실패: {}", fileName, e);
            throw new RuntimeException("파일 로드 실패: " + fileName, e);
        }
    }

    /**
     * 파일 URL 반환 (브라우저 접근용)
     * @param filePath 파일 상대 경로
     * @return 파일 URL
     */
    public String getFileUrl(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        return "/api/files/download?path=" + filePath;
    }

    /**
     * 파일 삭제
     * @param filePath 파일 상대 경로
     * @return 삭제 성공 여부
     */
    public boolean deleteFile(String filePath) {
        try {
            Path file = Paths.get(uploadPath).resolve(filePath).normalize();
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            log.error("❌ 파일 삭제 실패: {}", filePath, e);
            return false;
        }
    }
}