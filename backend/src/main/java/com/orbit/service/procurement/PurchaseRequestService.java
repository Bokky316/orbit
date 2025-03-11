// PurchaseRequestService.java
package com.orbit.service.procurement;

import com.orbit.dto.procurement.*;
import com.orbit.entity.procurement.*;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.item.Item;
import com.orbit.entity.member.Member;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.item.ItemRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestAttachmentRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import com.orbit.security.dto.MemberSecurityDto;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final ItemRepository itemRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final PurchaseRequestAttachmentRepository attachmentRepository;

    @Value("${uploadPath}") // WebConfig와 동일한 설정
    private String uploadPath;

    /**
     * 구매 요청 생성
     * - 요청 날짜 설정
     * - 초기 상태 설정
     * - 첨부파일 및 품목 처리
     */
    public PurchaseRequestDTO createPurchaseRequest(
            PurchaseRequestDTO purchaseRequestDTO,
            MultipartFile[] files) {
        // DTO를 엔티티로 변환
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);

        // 요청 날짜 설정
        purchaseRequest.setRequestDate(LocalDate.now());

        // 초기 상태 설정
        setInitialStatus(purchaseRequest);

        // 구매 요청 저장
        PurchaseRequest savedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);

        // 첨부파일 처리
        if (files != null) {
            processAttachments(savedPurchaseRequest, files);
        }

        // 물품 요청인 경우 품목 처리
        if (savedPurchaseRequest instanceof GoodsRequest &&
                purchaseRequestDTO instanceof GoodsRequestDTO) {
            processGoodsRequestItems(
                    (GoodsRequest) savedPurchaseRequest,
                    (GoodsRequestDTO) purchaseRequestDTO
            );
        }

        return convertToDto(savedPurchaseRequest);
    }

    /**
     * 초기 상태 설정
     * - 요청 유형에 따른 기본 상태 설정
     */
    private void setInitialStatus(PurchaseRequest purchaseRequest) {
        // 상위 코드 조회 (구매 요청 상태)
        ParentCode parentCode = parentCodeRepository
                .findByEntityTypeAndCodeGroup("PURCHASE_REQUEST", "STATUS");

        // 초기 상태 코드 조회 (예: REQUESTED)
        ChildCode childCode = childCodeRepository
                .findByParentCodeAndCodeValue(parentCode, "REQUESTED");

        // SystemStatus 생성
        SystemStatus status = new SystemStatus(
                parentCode.getCodeName(),
                childCode.getCodeValue()
        );

        purchaseRequest.setStatus(status);
    }

    /**
     * 구매 요청 업데이트
     * - 기존 구매 요청 조회
     * - 상태 및 기타 정보 업데이트
     */
    public PurchaseRequestDTO updatePurchaseRequest(Long id, PurchaseRequestDTO purchaseRequestDTO) {
        // 기존 구매 요청 조회
        PurchaseRequest existingPurchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Purchase request not found with id: " + id
                ));

        // 엔티티 업데이트
        updateEntity(existingPurchaseRequest, purchaseRequestDTO);

        // 저장 및 DTO 변환
        PurchaseRequest updatedPurchaseRequest = purchaseRequestRepository.save(existingPurchaseRequest);
        return convertToDto(updatedPurchaseRequest);
    }

    /**
     * 엔티티 업데이트 내부 메서드
     * - 공통 속성 업데이트
     * - 상태 코드 업데이트
     * - 구매 요청 타입별 세부 정보 업데이트
     */
    private void updateEntity(PurchaseRequest entity, PurchaseRequestDTO dto) {
        // 공통 속성 업데이트
        entity.setRequestName(dto.getRequestName());
        entity.setCustomer(dto.getCustomer());
        entity.setBusinessDepartment(dto.getBusinessDepartment());
        entity.setBusinessManager(dto.getBusinessManager());
        entity.setBusinessType(dto.getBusinessType());
        entity.setBusinessBudget(dto.getBusinessBudget());
        entity.setSpecialNotes(dto.getSpecialNotes());
        entity.setManagerPhoneNumber(dto.getManagerPhoneNumber());

        // 상태 코드 업데이트
        updateStatusCode(entity, dto.getStatus());

        // 구매 요청 타입별 세부 정보 업데이트
        updateSpecificRequestDetails(entity, dto);
    }

    /**
     * 상태 코드 업데이트 메서드
     */
    private void updateStatusCode(PurchaseRequest entity, String statusCode) {
        if (statusCode != null) {
            String[] statusParts = statusCode.split("-");
            if (statusParts.length == 3) {
                ParentCode parentCode = parentCodeRepository
                        .findByEntityTypeAndCodeGroup(statusParts[0], statusParts[1]);
                ChildCode childCode = childCodeRepository
                        .findByParentCodeAndCodeValue(parentCode, statusParts[2]);

                SystemStatus status = new SystemStatus(
                        parentCode.getCodeName(),
                        childCode.getCodeValue()
                );
                entity.setStatus(status);
            }
        }
    }

    /**
     * 구매 요청 타입별 세부 정보 업데이트
     */
    private void updateSpecificRequestDetails(PurchaseRequest entity, PurchaseRequestDTO dto) {
        if (entity instanceof SIRequest && dto instanceof SIRequestDTO) {
            SIRequest siRequest = (SIRequest) entity;
            SIRequestDTO siDto = (SIRequestDTO) dto;
            siRequest.setProjectStartDate(siDto.getProjectStartDate());
            siRequest.setProjectEndDate(siDto.getProjectEndDate());
            siRequest.setProjectContent(siDto.getProjectContent());
        } else if (entity instanceof MaintenanceRequest && dto instanceof MaintenanceRequestDTO) {
            MaintenanceRequest maintenanceRequest = (MaintenanceRequest) entity;
            MaintenanceRequestDTO maintenanceDto = (MaintenanceRequestDTO) dto;
            maintenanceRequest.setContractStartDate(maintenanceDto.getContractStartDate());
            maintenanceRequest.setContractEndDate(maintenanceDto.getContractEndDate());
            maintenanceRequest.setContractAmount(
                    maintenanceDto.getContractAmount() != null
                            ? maintenanceDto.getContractAmount()
                            : BigDecimal.ZERO
            );
            maintenanceRequest.setContractDetails(maintenanceDto.getContractDetails());
        } else if (entity instanceof GoodsRequest && dto instanceof GoodsRequestDTO) {
            GoodsRequest goodsRequest = (GoodsRequest) entity;
            GoodsRequestDTO goodsDto = (GoodsRequestDTO) dto;

            // 기존 아이템 제거
            goodsRequest.getItems().clear();

            // 새 아이템 추가
            List<PurchaseRequestItem> newItems = goodsDto.getItems().stream()
                    .map(itemDto -> {
                        PurchaseRequestItem item = convertToItemEntity(itemDto, goodsRequest);
                        item.calculateTotalPrice();
                        return item;
                    })
                    .collect(Collectors.toList());

            goodsRequest.getItems().addAll(newItems);
        }
    }

    /**
     * 모든 구매 요청 조회
     */
    @Transactional(readOnly = true)
    public List<PurchaseRequestDTO> getAllPurchaseRequests() {
        return purchaseRequestRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * ID로 구매 요청 조회
     */
    @Transactional(readOnly = true)
    public Optional<PurchaseRequestDTO> getPurchaseRequestById(Long id) {
        return purchaseRequestRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * 구매 요청 삭제
     */
    public boolean deletePurchaseRequest(Long id) {
        if (!purchaseRequestRepository.existsById(id)) {
            return false;
        }
        purchaseRequestRepository.deleteById(id);
        return true;
    }

    /**
     * 구매 요청에 첨부파일 추가
     */
    public PurchaseRequestDTO addAttachmentsToPurchaseRequest(Long id, MultipartFile[] files) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase request not found with id: " + id));

        if (files != null && files.length > 0) {
            processAttachments(purchaseRequest, files);
        }

        return convertToDto(purchaseRequest);
    }

    /**
     * 첨부파일 다운로드
     */
    public Resource downloadAttachment(Long attachmentId) {
        PurchaseRequestAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id " + attachmentId));

        Path file = Paths.get(uploadPath).resolve(attachment.getFilePath());
        Resource resource = new FileSystemResource(file);

        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new ResourceNotFoundException("Could not download file: " + attachment.getFileName());
        }
    }

    /**
     * DTO를 엔티티로 변환
     * - 비즈니스 타입에 따라 다른 구매 요청 엔티티 생성
     * - 공통 속성 설정
     */
    private PurchaseRequest convertToEntity(PurchaseRequestDTO dto) {
        PurchaseRequest purchaseRequest;

        switch (dto.getBusinessType()) {
            case "SI":
                purchaseRequest = new SIRequest();
                SIRequestDTO siDto = (SIRequestDTO) dto;
                ((SIRequest) purchaseRequest).setProjectStartDate(siDto.getProjectStartDate());
                ((SIRequest) purchaseRequest).setProjectEndDate(siDto.getProjectEndDate());
                ((SIRequest) purchaseRequest).setProjectContent(siDto.getProjectContent());
                break;
            case "MAINTENANCE":
                purchaseRequest = new MaintenanceRequest();
                MaintenanceRequestDTO maintenanceDto = (MaintenanceRequestDTO) dto;
                ((MaintenanceRequest) purchaseRequest).setContractStartDate(maintenanceDto.getContractStartDate());
                ((MaintenanceRequest) purchaseRequest).setContractEndDate(maintenanceDto.getContractEndDate());

                BigDecimal contractAmount = maintenanceDto.getContractAmount() != null
                        ? maintenanceDto.getContractAmount()
                        : BigDecimal.ZERO;
                ((MaintenanceRequest) purchaseRequest).setContractAmount(contractAmount);
                ((MaintenanceRequest) purchaseRequest).setContractDetails(maintenanceDto.getContractDetails());
                break;
            case "GOODS":
                purchaseRequest = new GoodsRequest();
                GoodsRequestDTO goodsDto = (GoodsRequestDTO) dto;
                List<PurchaseRequestItem> items = goodsDto.getItems().stream()
                        .map(this::convertToItemEntity)
                        .collect(Collectors.toList());
                ((GoodsRequest) purchaseRequest).setItems(items);
                break;
            default:
                throw new IllegalArgumentException("잘못된 Business Type: " + dto.getBusinessType());
        }

        // 공통 속성 설정
        purchaseRequest.setRequestName(dto.getRequestName());
        purchaseRequest.setCustomer(dto.getCustomer());
        purchaseRequest.setBusinessDepartment(dto.getBusinessDepartment());
        purchaseRequest.setBusinessManager(dto.getBusinessManager());
        purchaseRequest.setBusinessType(dto.getBusinessType());
        purchaseRequest.setBusinessBudget(dto.getBusinessBudget());
        purchaseRequest.setSpecialNotes(dto.getSpecialNotes());
        purchaseRequest.setManagerPhoneNumber(dto.getManagerPhoneNumber());

        return purchaseRequest;
    }

    /**
     * 엔티티를 DTO로 변환
     * - 구매 요청 타입에 따라 다른 DTO 생성
     * - 상태 코드 설정
     * - 첨부파일 정보 포함
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
     * 구매 요청 품목을 DTO로 변환
     */
    private PurchaseRequestItemDTO convertToItemDto(PurchaseRequestItem item) {
        PurchaseRequestItemDTO itemDto = new PurchaseRequestItemDTO();
        itemDto.setId(item.getId());
        itemDto.setItemId(item.getItem().getId());
        itemDto.setItemName(item.getItem().getName());

        // 단위 코드 설정
        if (item.getUnitParentCode() != null) {
            itemDto.setUnitParentCode(item.getUnitParentCode().getCodeValue());
        }
        if (item.getUnitChildCode() != null) {
            itemDto.setUnitChildCode(item.getUnitChildCode().getCodeValue());
        }

        itemDto.setSpecification(item.getSpecification());
        itemDto.setQuantity(item.getQuantity());
        itemDto.setUnitPrice(item.getUnitPrice());
        itemDto.setTotalPrice(item.getTotalPrice());
        itemDto.setDeliveryRequestDate(item.getDeliveryRequestDate());

        return itemDto;
    }

    /**
     * 품목 엔티티로 변환 (단일 메서드)
     */
    private PurchaseRequestItem convertToItemEntity(PurchaseRequestItemDTO itemDto) {
        PurchaseRequestItem item = new PurchaseRequestItem();

        // 품목 조회
        Item foundItem = itemRepository.findById(itemDto.getItemId())
                .orElseThrow(() -> new EntityNotFoundException("Item not found"));
        item.setItem(foundItem);

        // 단위 코드 조회
        ParentCode unitParentCode = parentCodeRepository.findByCodeValue(itemDto.getUnitParentCode());
        ChildCode unitChildCode = childCodeRepository.findByCodeValue(itemDto.getUnitChildCode());
        item.setUnitParentCode(unitParentCode);
        item.setUnitChildCode(unitChildCode);

        item.setSpecification(itemDto.getSpecification());

        // 수량 처리
        if (itemDto.getQuantity() == null || itemDto.getQuantity() == 0) {
            item.setQuantity(1);
        } else {
            item.setQuantity(itemDto.getQuantity());
        }

        item.setUnitPrice(itemDto.getUnitPrice());
        item.setDeliveryRequestDate(itemDto.getDeliveryRequestDate());

        return item;
    }

    /**
     * 품목 엔티티로 변환 (구매 요청과 연결)
     */
    private PurchaseRequestItem convertToItemEntity(PurchaseRequestItemDTO itemDto, GoodsRequest goodsRequest) {
        PurchaseRequestItem item = convertToItemEntity(itemDto);
        item.setPurchaseRequest(goodsRequest);
        return item;
    }

    /**
     * 구매 요청 품목 처리
     */
    private void processGoodsRequestItems(GoodsRequest goodsRequest, GoodsRequestDTO goodsRequestDTO) {
        if (goodsRequestDTO.getItems() != null) {
            List<PurchaseRequestItem> items = goodsRequestDTO.getItems().stream()
                    .map(itemDto -> {
                        PurchaseRequestItem item = convertToItemEntity(itemDto, goodsRequest);
                        item.calculateTotalPrice(); // 총액 계산
                        return item;
                    })
                    .collect(Collectors.toList());
            purchaseRequestItemRepository.saveAll(items);
            goodsRequest.setItems(items);
        }
    }

    /**
     * 첨부파일을 DTO로 변환
     */
    private PurchaseRequestAttachmentDTO convertAttachmentToDto(PurchaseRequestAttachment attachment) {
        return PurchaseRequestAttachmentDTO.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .filePath(attachment.getFilePath())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .build();
    }

    /**
     * 첨부파일 처리
     */
    private void processAttachments(PurchaseRequest purchaseRequest, MultipartFile[] files) {
        for (MultipartFile file : files) {
            try {
                String fileName = StringUtils.cleanPath(file.getOriginalFilename())
                        .replaceAll("[^a-zA-Z0-9.-]", "_");

                Path baseDir = Paths.get(uploadPath).toAbsolutePath();
                String subDir = "pr_" + purchaseRequest.getId();
                Path targetDir = baseDir.resolve(subDir);

                Files.createDirectories(targetDir);

                String uniqueFileName = System.currentTimeMillis() + "_" + fileName;
                Path targetPath = targetDir.resolve(uniqueFileName);

                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                String relativePath = Paths.get(subDir, uniqueFileName).toString().replace("\\", "/");

                PurchaseRequestAttachment attachment = PurchaseRequestAttachment.builder()
                        .fileName(fileName)
                        .filePath(relativePath)
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .purchaseRequest(purchaseRequest)
                        .build();

                attachmentRepository.save(attachment);

            } catch (IOException e) {
                log.error("파일 저장 실패: {}", e.getMessage(), e);
                throw new RuntimeException("파일 처리 중 오류 발생", e);
            }
        }
    }
}