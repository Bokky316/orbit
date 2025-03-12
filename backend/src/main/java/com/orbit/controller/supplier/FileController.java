package com.orbit.controller.supplier;

import com.orbit.service.supplier.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileStorageService fileStorageService;

    /**
     * 🔹 파일 업로드 엔드포인트 추가
     * @param businessFile 업로드할 파일
     * @return 저장된 파일 경로 반환
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    public ResponseEntity<String> uploadFile(@RequestParam("businessFile") MultipartFile businessFile) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("📂 파일 업로드 요청 받음: {}", businessFile.getOriginalFilename());
        log.info("✅ 현재 사용자 권한: {}", authentication.getAuthorities());

        try {
            if (businessFile.isEmpty()) {
                log.error("❌ 파일이 비어 있음");
                return ResponseEntity.badRequest().body("파일이 비어 있습니다.");
            }

            String storedFileName = fileStorageService.storeFile(businessFile);
            log.info("✅ 파일 업로드 성공: {}", storedFileName);
            return ResponseEntity.ok(storedFileName);
        } catch (Exception e) {
            log.error("❌ 파일 업로드 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("파일 업로드 실패: " + e.getMessage());
        }
    }


    /**
     * 🔹 파일 다운로드 엔드포인트
     * @param path 파일 경로 (상대 경로)
     * @return 파일 리소스
     */
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String path) {
        try {
            // 파일 리소스 가져오기
            Resource resource = fileStorageService.loadFileAsResource(path);

            // 파일 이름 추출
            String filename = resource.getFilename();

            // 콘텐츠 타입 확인
            String contentType = null;
            try {
                Path filePath = resource.getFile().toPath();
                contentType = Files.probeContentType(filePath);
            } catch (IOException ex) {
                log.warn("파일 타입 결정 실패", ex);
            }

            // 콘텐츠 타입을 결정할 수 없는 경우 기본값 설정
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            log.info("파일 다운로드: {}, 타입: {}", filename, contentType);

            // 응답 생성
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            log.error("파일 다운로드 실패", e);
            return ResponseEntity.notFound().build();
        }
    }
}
