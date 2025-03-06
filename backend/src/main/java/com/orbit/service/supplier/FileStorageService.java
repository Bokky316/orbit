package com.orbit.service.supplier;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.File;
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
    @Value("${itemImgLocation}") // 기존 properties 설정 값 사용
    private String uploadDir;

    @Value("${uploadPath}") // 업로드된 파일을 URL로 접근할 때 사용할 경로
    private String uploadPath;

    @PostConstruct
    public void init() {
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            boolean created = directory.mkdirs();
            if (created) {
                log.info("✅ 파일 저장 디렉토리 생성됨: {}", uploadDir);
            } else {
                log.error("❌ 파일 저장 디렉토리 생성 실패!");
            }
        }
    }

    // 파일 저장 메서드
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다.");
        }

        try {
            // 원본 파일명
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = FilenameUtils.getExtension(originalFilename);

            // 새로운 파일명 (UUID 활용)
            String newFileName = UUID.randomUUID().toString() + "." + extension;

            // 저장할 파일 경로
            Path targetLocation = Paths.get(uploadDir).resolve(newFileName);

            // 파일 저장
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("📂 파일 저장 완료: {}", targetLocation);

            return newFileName; // 저장된 파일명 반환
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 중 오류 발생!", e);
        }
    }

    // 파일 삭제 메서드
    public void deleteFile(String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Files.deleteIfExists(filePath);
            log.info("🗑 파일 삭제 완료: {}", fileName);
        } catch (IOException e) {
            log.error("❌ 파일 삭제 실패: {}", fileName, e);
        }
    }

    // 파일 URL 반환 메서드 (프론트에서 접근 가능하도록)
    public String getFileUrl(String fileName) {
        return uploadPath + fileName;
    }
}
