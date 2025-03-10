// PurchaseRequestService.java
package com.orbit.service.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.PurchaseRequestItemDTO;
import com.orbit.dto.procurement.PurchaseRequestResponseDTO;
import com.orbit.entity.procurement.Item;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestAttachment;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.ItemRepository;
import com.orbit.repository.procurement.PurchaseRequestAttachmentRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import com.orbit.security.dto.MemberSecurityDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 구매 요청 관련 비즈니스 로직 처리 (파일 업로드 기능 포함)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ItemRepository itemRepository;
    private final PurchaseRequestAttachmentRepository attachmentRepository; // [추가] 첨부파일 Repository

    @Value("${uploadPath}") // WebConfig와 동일한 설정
    private String uploadPath;

    /**
     * 구매 요청 생성 (파일 업로드 포함)
     * @param purchaseRequestDTO 요청 정보
     * @param files 업로드 파일 배열 (nullable)
     */
    public PurchaseRequestResponseDTO createPurchaseRequest(
            PurchaseRequestDTO purchaseRequestDTO,
            MultipartFile[] files) {

        // 1. 엔티티 변환 (기존 로직)
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);
        purchaseRequest.setRequestDate(LocalDate.now());

        // 2. 파일 처리 (신규 로직)
        if (files != null && files.length > 0) {
            processAttachments(purchaseRequest, files); // 첨부파일 처리
        }

        // 3. DB 저장
        PurchaseRequest savedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);

        // 4. 아이템 처리 (기존 로직)
        List<PurchaseRequestItem> purchaseRequestItems = new ArrayList<>();
        if (purchaseRequestDTO.getPurchaseRequestItemDTOs() != null) {
            purchaseRequestItems = purchaseRequestDTO.getPurchaseRequestItemDTOs().stream()
                    .map(itemDto -> convertToEntity(itemDto, savedPurchaseRequest))
                    .collect(Collectors.toList());
            purchaseRequestItemRepository.saveAll(purchaseRequestItems);
            savedPurchaseRequest.setPurchaseRequestItems(purchaseRequestItems);
        }

        return resource;
    }

    /**
     * 첨부파일 처리 메서드 (신규)
     * @param purchaseRequest 요청 엔티티
     * @param files 파일 배열
     */
    private void processAttachments(PurchaseRequest purchaseRequest, MultipartFile[] files) {
        for (MultipartFile file : files) {
            try {
                // 파일명 정제 - 특수 문자 제거
                String fileName = StringUtils.cleanPath(file.getOriginalFilename())
                        .replaceAll("[^a-zA-Z0-9.-]", "_");  // 안전한 파일명으로 변경

                // 절대 경로 생성
                Path baseDir = Paths.get(uploadPath).toAbsolutePath();
                String subDir = "pr_" + purchaseRequest.getId();
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

                PurchaseRequestAttachment attachment = PurchaseRequestAttachment.builder()
                        .fileName(fileName)
                        .filePath(relativePath)  // 상대 경로 사용
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .purchaseRequest(purchaseRequest)
                        .build();

                attachmentRepository.save(attachment); // 첨부파일 DB에 저장

            } catch (IOException e) {
                log.error("파일 저장 실패: {}", e.getMessage(), e);
                throw new RuntimeException("파일 처리 중 오류 발생", e);
            }
        }
    }

    /**
     * 기존 엔티티 변환 로직 (수정)
     * @param dto 요청 DTO
     * @return PurchaseRequest 엔티티
     */
    private PurchaseRequest convertToEntity(PurchaseRequestDTO dto) {
        PurchaseRequest entity = new PurchaseRequest();
        entity.setRequestName(dto.getRequestName());
        entity.setRequestDate(dto.getRequestDate() != null ? dto.getRequestDate() : LocalDate.now());
        entity.setCustomer(dto.getCustomer());
        entity.setBusinessDepartment(dto.getBusinessDepartment());
        entity.setBusinessManager(dto.getBusinessManager());
        entity.setBusinessType(dto.getBusinessType());
        entity.setBusinessBudget(dto.getBusinessBudget());
        entity.setSpecialNotes(dto.getSpecialNotes());
        entity.setManagerPhoneNumber(dto.getManagerPhoneNumber());
        entity.setProjectStartDate(dto.getProjectStartDate());
        entity.setProjectEndDate(dto.getProjectEndDate());
        entity.setProjectContent(dto.getProjectContent());
        // entity.setAttachments(dto.getAttachments()); // [삭제] DTO에서 직접 설정 X
        return entity;
    }

    /**
     * 기존 DTO 변환 로직 (수정)
     * @param entity PurchaseRequest 엔티티
     * @return PurchaseRequestResponseDTO 응답 DTO
     */
    private PurchaseRequestResponseDTO convertToDto(PurchaseRequest entity) {
        PurchaseRequestResponseDTO dto = new PurchaseRequestResponseDTO();
        dto.setId(entity.getId());
        dto.setRequestName(entity.getRequestName());
        dto.setRequestNumber(entity.getRequestNumber());

        // 상태 정보 설정
        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().getFullCode());
        }

        dto.setRequestDate(entity.getRequestDate());
        dto.setCustomer(entity.getCustomer());
        dto.setBusinessDepartment(entity.getBusinessDepartment());
        dto.setBusinessManager(entity.getBusinessManager());
        dto.setBusinessType(entity.getBusinessType());
        dto.setBusinessBudget(entity.getBusinessBudget());
        dto.setSpecialNotes(entity.getSpecialNotes());
        dto.setManagerPhoneNumber(entity.getManagerPhoneNumber());
        dto.setProjectStartDate(entity.getProjectStartDate());
        dto.setProjectEndDate(entity.getProjectEndDate());
        dto.setProjectContent(entity.getProjectContent());
        // dto.setAttachments(entity.getAttachments()); // [삭제] 더 이상 사용 X

        return dto;
    }

    /**
     * 기존 아이템 변환 로직 (수정 없음)
     * @param itemDTO 아이템 DTO
     * @param purchaseRequest 구매 요청 엔티티
     * @return PurchaseRequestItem 엔티티
     */
    private PurchaseRequestItem convertToEntity(PurchaseRequestItemDTO itemDTO, PurchaseRequest purchaseRequest) {
        PurchaseRequestItem entity = new PurchaseRequestItem();

        // Item 엔티티 조회
        Item item = itemRepository.findById(itemDTO.getItemId())
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + itemDTO.getItemId()));
        entity.setItem(item); // Item 엔티티 설정

        entity.setQuantity(itemDTO.getQuantity());
        entity.setUnitPrice(itemDTO.getUnitPrice());
        entity.setSupplyPrice(itemDTO.getSupplyPrice());
        entity.setVat(itemDTO.getVat());
        entity.setDeliveryRequestDate(itemDTO.getDeliveryRequestDate());
        entity.setDeliveryLocation(itemDTO.getDeliveryLocation());
        entity.setPurchaseRequest(purchaseRequest); // PurchaseRequest 설정

        return entity;
    }

    /**
     * 기존 update 로직 (수정 없음)
     * @param entity 업데이트 대상 엔티티
     * @param dto 요청 DTO
     */
    private PurchaseRequest convertToEntity(PurchaseRequestDTO dto) {
        PurchaseRequest entity;

        // 1. 타입에 따라 엔티티 생성 및 초기화
        if (dto instanceof SIRequestDTO) {
            entity = convertToSiEntity((SIRequestDTO) dto);
        } else if (dto instanceof MaintenanceRequestDTO) {
            entity = convertToMaintenanceEntity((MaintenanceRequestDTO) dto);
        } else if (dto instanceof GoodsRequestDTO) {
            entity = convertToGoodsEntity((GoodsRequestDTO) dto);
        } else {
            throw new IllegalArgumentException("잘못된 DTO 타입");
        }

        // 2. 공통 속성 설정
        entity.setRequestName(dto.getRequestName());
        entity.setCustomer(dto.getCustomer());
        entity.setBusinessDepartment(dto.getBusinessDepartment());
        entity.setBusinessManager(dto.getBusinessManager());
        entity.setBusinessType(dto.getBusinessType());
        entity.setBusinessBudget(dto.getBusinessBudget());
        entity.setSpecialNotes(dto.getSpecialNotes());
        entity.setManagerPhoneNumber(dto.getManagerPhoneNumber());

        return entity;
    }

    // 나머지 메서드들은 변경되지 않았으므로 그대로 유지합니다...

    /**
     * SIRequest -> SIRequestDTO 변환
     */
    private SIRequestDTO convertToSiDto(SIRequest entity) {
        SIRequestDTO dto = new SIRequestDTO();
        dto.setProjectStartDate(entity.getProjectStartDate());
        dto.setProjectEndDate(entity.getProjectEndDate());
        dto.setProjectContent(entity.getProjectContent());
        return dto;
    }

    /**
     * MaintenanceRequest -> MaintenanceRequestDTO 변환
     */
    private MaintenanceRequestDTO convertToMaintenanceDto(MaintenanceRequest entity) {
        MaintenanceRequestDTO dto = new MaintenanceRequestDTO();
        dto.setContractStartDate(entity.getContractStartDate());
        dto.setContractEndDate(entity.getContractEndDate());
        dto.setContractAmount(entity.getContractAmount());
        dto.setContractDetails(entity.getContractDetails());
        return dto;
    }

    /**
     * GoodsRequest -> GoodsRequestDTO 변환
     */
    private GoodsRequestDTO convertToGoodsDto(GoodsRequest entity) {
        GoodsRequestDTO dto = new GoodsRequestDTO();

        // items가 null이 아닌지 확인하고 빈 리스트로 초기화
        if (entity.getItems() != null && !entity.getItems().isEmpty()) {
            List<PurchaseRequestItemDTO> itemDtos = entity.getItems().stream()
                    .map(this::convertToItemDto)
                    .collect(Collectors.toList());
            dto.setItems(itemDtos);
        } else {
            // 명시적으로 빈 리스트 설정 (null이 되지 않도록)
            dto.setItems(new ArrayList<>());
        }

        return dto;
    }

    /**
     * SIRequestDTO -> SIRequest 변환
     */
    private SIRequest convertToSiEntity(SIRequestDTO dto) {
        SIRequest entity = new SIRequest();
        entity.setProjectStartDate(dto.getProjectStartDate());
        entity.setProjectEndDate(dto.getProjectEndDate());
        entity.setProjectContent(dto.getProjectContent());
        // entity.setAttachments(dto.getAttachments()); // [삭제] 더 이상 사용 X
    }

    // [기존 로직 유지] ====================================================

    /**
     * 모든 구매 요청 조회
     * @return 구매 요청 목록
     */
    @Transactional(readOnly = true)
    public List<PurchaseRequestResponseDTO> getAllPurchaseRequests() {
        return purchaseRequestRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * ID로 구매 요청 조회
     * @param id 요청 ID
     * @return 구매 요청 (Optional)
     */
    @Transactional(readOnly = true)
    public Optional<PurchaseRequestResponseDTO> getPurchaseRequestById(Long id) {
        return purchaseRequestRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * 구매 요청 정보 업데이트
     * @param id 업데이트 대상 ID
     * @param purchaseRequestDTO 업데이트 정보
     * @return 업데이트된 구매 요청
     * @throws EntityNotFoundException 해당 ID의 요청이 없을 경우
     */
    public PurchaseRequestResponseDTO updatePurchaseRequest(Long id, PurchaseRequestDTO purchaseRequestDTO) {
        // 1. ID로 기존 PurchaseRequest 엔티티 조회
        PurchaseRequest existingPurchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase request not found with id: " + id));

        // 2. DTO에서 받은 값으로 기존 엔티티 업데이트
        updateEntity(existingPurchaseRequest, purchaseRequestDTO);

        // 3. 업데이트된 엔티티 DB에 저장
        PurchaseRequest updatedPurchaseRequest = purchaseRequestRepository.save(existingPurchaseRequest);

        return convertToDto(updatedPurchaseRequest);
    }

    /**
     * 구매 요청 삭제
     * @param id 삭제할 ID
     * @return 삭제 성공 여부
     */
    public boolean deletePurchaseRequest(Long id) {
        if (!purchaseRequestRepository.existsById(id)) {
            return false;
        }
        purchaseRequestRepository.deleteById(id);
        return true;
    }

    /**
     * 기존 구매 요청에 첨부 파일 추가
     * @param id 구매 요청 ID
     * @param files 추가할 파일 배열
     * @return 업데이트된 구매 요청 DTO
     */
    public PurchaseRequestDTO addAttachmentsToPurchaseRequest(Long id, MultipartFile[] files) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase request not found with id: " + id));

        if (files != null && files.length > 0) {
            processAttachments(purchaseRequest, files);
        }

        return convertToDto(purchaseRequest);
    }
}
