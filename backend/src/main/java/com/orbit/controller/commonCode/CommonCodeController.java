package com.orbit.controller.commonCode;

import com.orbit.dto.commonCode.ChildCodeDTO;
import com.orbit.service.commonCode.CommonCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 공통 코드 API 컨트롤러
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/common-codes")
public class CommonCodeController {

    private final CommonCodeService commonCodeService;

    /**
     * 특정 entityType, codeGroup에 해당하는 자식 코드 목록 조회
     */
    @GetMapping("/{entityType}/{codeGroup}")
    public ResponseEntity<List<ChildCodeDTO>> getChildCodesByTypeAndGroup(
            @PathVariable String entityType,
            @PathVariable String codeGroup) {

        List<ChildCodeDTO> childCodes = commonCodeService.getChildCodesByTypeAndGroup(entityType, codeGroup);
        return ResponseEntity.ok(childCodes);
    }

    /**
     * 모든 공통 코드 목록 조회 (타입별 그룹화)
     */
    @GetMapping
    public ResponseEntity<List<Object>> getAllCommonCodes() {
        return ResponseEntity.ok(commonCodeService.getAllCommonCodes());
    }
}