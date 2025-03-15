//package com.orbit.controller;
//
//
//import com.orbit.dto.commonCode.CommonCodeDTO;
//import com.orbit.dto.commonCode.CommonCodeGroupDTO;
//import com.orbit.service.CommonCodeService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/codes")
//@RequiredArgsConstructor
//public class CommonCodeController {
//
//    private final CommonCodeService commonCodeService;
//
//    /**
//     * 모든 코드 그룹 조회
//     */
//    @GetMapping("/groups")
//    public ResponseEntity<List<CommonCodeGroupDTO>> getAllCodeGroups() {
//        return ResponseEntity.ok(commonCodeService.getAllCodeGroups());
//    }
//
//    /**
//     * 사용 가능한 코드 그룹만 조회
//     */
//    @GetMapping("/groups/active")
//    public ResponseEntity<List<CommonCodeGroupDTO>> getActiveCodeGroups() {
//        return ResponseEntity.ok(commonCodeService.getActiveCodeGroups());
//    }
//
//    /**
//     * 코드 그룹 및 하위 코드 상세 조회
//     */
//    @GetMapping("/groups/{groupId}")
//    public ResponseEntity<CommonCodeGroupDTO> getCodeGroupWithCodes(@PathVariable String groupId) {
//        return ResponseEntity.ok(commonCodeService.getCodeGroupWithCodes(groupId));
//    }
//
//    /**
//     * 그룹 ID로 코드 목록 조회
//     */
//    @GetMapping("/by-group/{groupId}")
//    public ResponseEntity<List<CommonCodeDTO>> getCodesByGroupId(@PathVariable String groupId) {
//        return ResponseEntity.ok(commonCodeService.getCodesByGroupId(groupId));
//    }
//
//    /**
//     * 사용 가능한 코드만 그룹 ID로 조회
//     */
//    @GetMapping("/by-group/{groupId}/active")
//    public ResponseEntity<List<CommonCodeDTO>> getActiveCodesByGroupId(@PathVariable String groupId) {
//        return ResponseEntity.ok(commonCodeService.getActiveCodesByGroupId(groupId));
//    }
//
//    /**
//     * 코드 상세 조회
//     */
//    @GetMapping("/{codeId}")
//    public ResponseEntity<CommonCodeDTO> getCodeById(@PathVariable String codeId) {
//        return ResponseEntity.ok(commonCodeService.getCodeById(codeId));
//    }
//
////    /**
////     * 공통 코드 조회 (여러 그룹의 코드를 한번에 조회)
////     */
////    @GetMapping("/multi")
////    public ResponseEntity<Map<String, List<CommonCodeDTO>>> getMultiGroupCodes(
////            @RequestParam List<String> groupIds) {
////        return ResponseEntity.ok(commonCodeService.getMultiGroupCodes(groupIds));
////    }
//}
