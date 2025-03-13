// PurchaseRequestService.java
package com.orbit.service.procurement;

import com.orbit.dto.approval.ApprovalLineCreateDTO;
import com.orbit.dto.approval.DepartmentDTO;
import com.orbit.dto.item.CategoryDTO;
import com.orbit.dto.item.ItemDTO;
import com.orbit.dto.member.MemberDTO;
import com.orbit.dto.procurement.*;
import com.orbit.entity.approval.Department;
import com.orbit.entity.procurement.*;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.item.Item;
import com.orbit.entity.member.Member;
import com.orbit.entity.project.Project;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.approval.DepartmentRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.item.CategoryRepository;
import com.orbit.repository.item.ItemRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.ProjectRepository;
import com.orbit.repository.procurement.PurchaseRequestAttachmentRepository;
import com.orbit.entity.item.Category;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import com.orbit.security.dto.MemberSecurityDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
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
    private final CategoryRepository categoryRepository;
    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final ApprovalLineService approvalLineService;


    @Value("${uploadPath}")
    private String uploadPath;

    /**
     * 구매 요청 생성 (핵심 로직)
     */
    public PurchaseRequestDTO createPurchaseRequest(PurchaseRequestDTO purchaseRequestDTO, MultipartFile[] files) {
        // 1. DTO -> Entity 변환
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);
        purchaseRequest.setRequestDate(LocalDate.now());

        // 2. 초기 상태 설정
        setInitialStatus(purchaseRequest);

        // 3. 요청자(회원) 정보 설정 - DTO에서 전달받은 memberId 사용
        if (purchaseRequestDTO.getMemberId() != null) {
            Member member = memberRepository.findById(purchaseRequestDTO.getMemberId())
                    .orElseThrow(() -> new ResourceNotFoundException("ID " + purchaseRequestDTO.getMemberId() + "에 해당하는 사용자가 없습니다."));
            purchaseRequest.setMember(member);
        }

        // 4. 프로젝트 정보 설정
        if (purchaseRequestDTO.getProjectId() != null && !purchaseRequestDTO.getProjectId().isEmpty()) {
            try {
                Long projectId = Long.parseLong(purchaseRequestDTO.getProjectId());
                Project project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new ResourceNotFoundException("ID " + projectId + "에 해당하는 프로젝트가 없습니다."));
                purchaseRequest.setProject(project);
            } catch (NumberFormatException e) {
                log.error("프로젝트 ID 변환 실패: {}", e.getMessage());
                throw new IllegalArgumentException("유효하지 않은 프로젝트 ID 형식입니다: " + purchaseRequestDTO.getProjectId());
            }
        }

        // 5. 저장 및 첨부 파일 처리
        PurchaseRequest savedRequest = purchaseRequestRepository.save(purchaseRequest);
        processAttachments(savedRequest, files);

        // 6. 물품 요청 시 품목 처리
        if (savedRequest instanceof GoodsRequest && purchaseRequestDTO instanceof GoodsRequestDTO) {
            processGoodsRequestItems((GoodsRequest) savedRequest, (GoodsRequestDTO) purchaseRequestDTO);
        }

        approvalLineService.createAutoApprovalLine(
                ApprovalLineCreateDTO.builder()
                        .purchaseRequestId(savedRequest.getId())
                        .build()
        );

        return convertToDto(savedRequest);
    }

    /**
     * 현재 인증된 사용자 정보 가져오기
     */
    private Member getCurrentMember() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof MemberSecurityDto) {
            MemberSecurityDto memberSecurityDto = (MemberSecurityDto) authentication.getPrincipal();
            return memberRepository.findById(memberSecurityDto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("ID " + memberSecurityDto.getId() + "에 해당하는 사용자가 없습니다."));
        }
        throw new RuntimeException("인증된 사용자 정보를 찾을 수 없습니다.");
    }

    /**
     * 구매 요청 업데이트
     */
    public PurchaseRequestDTO updatePurchaseRequest(Long id, PurchaseRequestDTO purchaseRequestDTO) {
        // 1. ID로 기존 엔티티 조회
        PurchaseRequest existingRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 구매 요청이 없습니다."));

        // 2. 엔티티 업데이트 (updateEntity 메서드 활용)
        updateEntity(existingRequest, purchaseRequestDTO);

        // 3. 프로젝트 정보 업데이트
        if (purchaseRequestDTO.getProjectId() != null && !purchaseRequestDTO.getProjectId().isEmpty()) {
            try {
                Long projectId = Long.parseLong(purchaseRequestDTO.getProjectId());
                Project project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new ResourceNotFoundException("ID " + projectId + "에 해당하는 프로젝트가 없습니다."));
                existingRequest.setProject(project);
            } catch (NumberFormatException e) {
                log.error("프로젝트 ID 변환 실패: {}", e.getMessage());
                throw new IllegalArgumentException("유효하지 않은 프로젝트 ID 형식입니다: " + purchaseRequestDTO.getProjectId());
            }
        }

        // 4. 저장 후 DTO 변환
        PurchaseRequest updatedRequest = purchaseRequestRepository.save(existingRequest);
        return convertToDto(updatedRequest);
    }

    /**
     * 구매 요청 삭제
     */
    public boolean deletePurchaseRequest(Long id) {
        // 1. ID로 기존 엔티티 조회 (존재 여부 확인)
        PurchaseRequest existingRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 구매 요청이 없습니다."));

        // 2. 삭제
        purchaseRequestRepository.delete(existingRequest);
        return true;
    }

    /**
     * 특정 ID의 구매 요청 조회
     */
    @Transactional(readOnly = true)
    public PurchaseRequestDTO getPurchaseRequestById(Long id) {
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 구매 요청이 없습니다."));

        PurchaseRequestDTO dto = convertToDto(purchaseRequest);

        // GOODS 타입이고 items가 null인 경우 빈 리스트로 초기화
        if ("GOODS".equals(dto.getBusinessType()) && dto.getItems() == null) {
            dto.setItems(new ArrayList<>());
        }

        return dto;
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
     * 첨부 파일 추가
     */
    public PurchaseRequestDTO addAttachmentsToPurchaseRequest(Long id, MultipartFile[] files) {
        // 1. 구매 요청 조회
        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 구매 요청이 없습니다."));

        // 2. 첨부 파일 처리
        processAttachments(purchaseRequest, files);
        return convertToDto(purchaseRequest);
    }

    /**
     * 첨부 파일 다운로드
     */
    public Resource downloadAttachment(Long attachmentId) {
        // 1. 첨부 파일 조회
        PurchaseRequestAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + attachmentId + "에 해당하는 첨부 파일이 없습니다."));

        // 2. 파일 경로 확인 및 Resource 생성
        Path file = Paths.get(uploadPath).resolve(attachment.getFilePath());
        Resource resource = new FileSystemResource(file);

        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("파일을 다운로드할 수 없습니다: " + attachment.getFileName());
        }

        return resource;
    }

    /**
     * 엔티티를 DTO로 변환 (핵심)
     */
    private PurchaseRequestDTO convertToDto(PurchaseRequest entity) {
        PurchaseRequestDTO dto;

        // 1. 타입에 따라 DTO 생성 및 초기화
        if (entity instanceof SIRequest) {
            dto = convertToSiDto((SIRequest) entity);
        } else if (entity instanceof MaintenanceRequest) {
            dto = convertToMaintenanceDto((MaintenanceRequest) entity);
        } else if (entity instanceof GoodsRequest) {
            dto = convertToGoodsDto((GoodsRequest) entity);
        } else {
            throw new IllegalArgumentException("잘못된 PurchaseRequest 타입");
        }

        // 2. 공통 속성 설정
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

        // 3. 프로젝트 정보 설정
        if (entity.getProject() != null) {
            dto.setProjectId(entity.getProject().getId().toString());
            dto.setProjectName(entity.getProject().getProjectName());
        }

        // 4. 요청자(회원) 정보 설정
        if (entity.getMember() != null) {
            dto.setMemberId(entity.getMember().getId());
            dto.setMemberName(entity.getMember().getName());
            dto.setMemberCompany(entity.getMember().getCompanyName());
        }

        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().getFullCode());
        }

        // 5. 첨부 파일 설정
        dto.setAttachments(entity.getAttachments().stream()
                .map(this::convertAttachmentToDto)
                .collect(Collectors.toList()));

        return dto;
    }

    /**
     * DTO를 엔티티로 변환 (핵심)
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
        return entity;
    }

    /**
     * MaintenanceRequestDTO -> MaintenanceRequest 변환
     */
    private MaintenanceRequest convertToMaintenanceEntity(MaintenanceRequestDTO dto) {
        MaintenanceRequest entity = new MaintenanceRequest();
        entity.setContractStartDate(dto.getContractStartDate());
        entity.setContractEndDate(dto.getContractEndDate());
        entity.setContractAmount(dto.getContractAmount() != null ? dto.getContractAmount() : BigDecimal.ZERO);
        entity.setContractDetails(dto.getContractDetails());
        return entity;
    }

    /**
     * GoodsRequestDTO -> GoodsRequest 변환
     */
    private GoodsRequest convertToGoodsEntity(GoodsRequestDTO dto) {
        GoodsRequest goodsRequest = new GoodsRequest();

        // 아이템 처리
        List<PurchaseRequestItem> items = dto.getItems().stream()
                .map(itemDto -> {
                    // 아이템 존재 여부 확인
                    Item item = itemRepository.findById(itemDto.getItemId().toString())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Item ID " + itemDto.getItemId() + "에 해당하는 품목이 없습니다."
                            ));

                    PurchaseRequestItem pri = new PurchaseRequestItem();
                    pri.setItem(item);
                    pri.setQuantity(itemDto.getQuantity());
                    pri.setUnitPrice(item.getStandardPrice()); // ✅ standardPrice 사용
                    pri.setTotalPrice(item.getStandardPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
                    pri.setSpecification(item.getSpecification());
                    pri.setUnitParentCode(item.getUnitParentCode());
                    pri.setUnitChildCode(item.getUnitChildCode());
                    pri.setPurchaseRequest(goodsRequest);
                    return pri;
                }).collect(Collectors.toList());

        goodsRequest.setItems(items);

        return goodsRequest;
    }

    /**
     * 첨부 파일 DTO 변환
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
     * 구매 요청 품목 DTO 변환
     */
    private PurchaseRequestItemDTO convertToItemDto(PurchaseRequestItem item) {
        PurchaseRequestItemDTO itemDto = new PurchaseRequestItemDTO();
        itemDto.setId(item.getId());
        // Long 타입 변환 대신 String으로 직접 할당
        itemDto.setItemId(item.getItem().getId());
        itemDto.setItemName(item.getItem().getName());
        if (item.getUnitParentCode() != null) {
            itemDto.setUnitParentCode(item.getUnitParentCode().getCodeName());
            if (item.getUnitChildCode() != null) {
                itemDto.setUnitChildCode(item.getUnitChildCode().getCodeName());
            }
        }
        itemDto.setSpecification(item.getSpecification());
        itemDto.setQuantity(item.getQuantity());
        itemDto.setUnitPrice(item.getUnitPrice());
        itemDto.setTotalPrice(item.getTotalPrice());
        itemDto.setDeliveryRequestDate(item.getDeliveryRequestDate());
        return itemDto;
    }

    /**
     * 엔티티 업데이트 (공통)
     */
    private void updateEntity(PurchaseRequest entity, PurchaseRequestDTO dto) {
        entity.setRequestName(dto.getRequestName());
        entity.setCustomer(dto.getCustomer());
        entity.setBusinessDepartment(dto.getBusinessDepartment());
        entity.setBusinessManager(dto.getBusinessManager());
        entity.setBusinessType(dto.getBusinessType());
        entity.setBusinessBudget(dto.getBusinessBudget());
        entity.setSpecialNotes(dto.getSpecialNotes());
        entity.setManagerPhoneNumber(dto.getManagerPhoneNumber());
        updateStatusCode(entity, dto.getStatus());

        // 타입별 업데이트 분리
        if (entity instanceof SIRequest && dto instanceof SIRequestDTO) {
            updateSiRequest((SIRequest) entity, (SIRequestDTO) dto);
        } else if (entity instanceof MaintenanceRequest && dto instanceof MaintenanceRequestDTO) {
            updateMaintenanceRequest((MaintenanceRequest) entity, (MaintenanceRequestDTO) dto);
        } else if (entity instanceof GoodsRequest && dto instanceof GoodsRequestDTO) {
            updateGoodsRequest((GoodsRequest) entity, (GoodsRequestDTO) dto);
        }
    }

    /**
     * SIRequest 업데이트
     */
    private void updateSiRequest(SIRequest entity, SIRequestDTO dto) {
        entity.setProjectStartDate(dto.getProjectStartDate());
        entity.setProjectEndDate(dto.getProjectEndDate());
        entity.setProjectContent(dto.getProjectContent());
    }

    /**
     * MaintenanceRequest 업데이트
     */
    private void updateMaintenanceRequest(MaintenanceRequest entity, MaintenanceRequestDTO dto) {
        entity.setContractStartDate(dto.getContractStartDate());
        entity.setContractEndDate(dto.getContractEndDate());
        entity.setContractAmount(dto.getContractAmount() != null ? dto.getContractAmount() : BigDecimal.ZERO);
        entity.setContractDetails(dto.getContractDetails());
    }

    /**
     * GoodsRequest 업데이트
     */
    private void updateGoodsRequest(GoodsRequest entity, GoodsRequestDTO dto) {
        // 기존 아이템 제거 후 새 아이템 추가
        entity.getItems().clear();
        List<PurchaseRequestItem> newItems = dto.getItems().stream()
                .map(itemDto -> {
                    PurchaseRequestItem item = convertToItemEntity(itemDto, entity);
                    // 명시적으로 양방향 관계 설정 (addItem 메서드 활용)
                    entity.addItem(item);
                    return item;
                })
                .collect(Collectors.toList());
    }

    /**
     * 품목 엔티티로 변환 (GoodsRequest 연관관계 설정)
     */
    private PurchaseRequestItem convertToItemEntity(PurchaseRequestItemDTO itemDto, GoodsRequest goodsRequest) {
        Item foundItem = itemRepository.findById(itemDto.getItemId().toString())
                .orElseThrow(() -> new ResourceNotFoundException("Item ID " + itemDto.getItemId() + "에 해당하는 품목이 없습니다."));

        PurchaseRequestItem item = new PurchaseRequestItem();
        item.setItem(foundItem);
        item.setPurchaseRequest(goodsRequest); // PurchaseRequest 설정
        item.setGoodsRequest(goodsRequest);    // 여기에 GoodsRequest도 추가 설정

        // 단위 코드 조회 및 설정
        if(itemDto.getUnitParentCode() != null){
            ParentCode unitParentCode = parentCodeRepository.findByCodeName(itemDto.getUnitParentCode());

            if(unitParentCode != null){
                ChildCode unitChildCode = childCodeRepository.findByParentCodeAndCodeValue(unitParentCode, itemDto.getUnitChildCode()).orElse(null); // Optional 처리
                item.setUnitParentCode(unitParentCode);
                item.setUnitChildCode(unitChildCode);
            }
        }

        item.setSpecification(itemDto.getSpecification());

        // 수량 및 금액 설정
        item.setQuantity(itemDto.getQuantity() == null || itemDto.getQuantity() == 0 ? 1 : itemDto.getQuantity());
        item.setUnitPrice(itemDto.getUnitPrice());
        item.setTotalPrice(itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())));
        item.setDeliveryRequestDate(itemDto.getDeliveryRequestDate());
        return item;
    }

    /**
     * 초기 상태 설정
     */
    private void setInitialStatus(PurchaseRequest purchaseRequest) {
        ParentCode parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("PURCHASE_REQUEST", "STATUS")
                .orElseThrow(() -> new ResourceNotFoundException("ParentCode(PURCHASE_REQUEST, STATUS)를 찾을 수 없습니다."));

        ChildCode childCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode, "REQUESTED")
                .orElseThrow(() -> new ResourceNotFoundException("ChildCode(REQUESTED)를 찾을 수 없습니다."));

        SystemStatus status = new SystemStatus(parentCode.getCodeName(), childCode.getCodeValue());
        purchaseRequest.setStatus(status);
    }

    /**
     * 상태 코드 업데이트
     */
    private void updateStatusCode(PurchaseRequest entity, String statusCode) {
        if (statusCode != null) {
            String[] statusParts = statusCode.split("-");
            if (statusParts.length == 3) {
                ParentCode parentCode = parentCodeRepository
                        .findByEntityTypeAndCodeGroup(statusParts[0], statusParts[1])
                        .orElseThrow(() -> new ResourceNotFoundException("ParentCode(" + statusParts[0] + ", " + statusParts[1] + ")를 찾을 수 없습니다."));

                ChildCode childCode = childCodeRepository
                        .findByParentCodeAndCodeValue(parentCode, statusParts[2])
                        .orElseThrow(() -> new ResourceNotFoundException("ChildCode(" + statusParts[2] + ")를 찾을 수 없습니다."));

                SystemStatus status = new SystemStatus(parentCode.getCodeName(), childCode.getCodeValue());
                entity.setStatus(status);
            } else {
                log.warn("잘못된 상태 코드 형식: {}", statusCode);
            }
        }
    }

    /**
     * 첨부 파일 처리
     */
    private void processAttachments(PurchaseRequest purchaseRequest, MultipartFile[] files) {
        if (files == null || files.length == 0) return;

        try {
            Path baseDir = Paths.get(uploadPath).toAbsolutePath();
            String subDir = "pr_" + purchaseRequest.getId();
            Path targetDir = baseDir.resolve(subDir);
            Files.createDirectories(targetDir);

            for (MultipartFile file : files) {
                String fileName = StringUtils.cleanPath(file.getOriginalFilename()).replaceAll("[^a-zA-Z0-9.-]", "_");
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
            }
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("파일 처리 중 오류 발생", e);
        }
    }

    private void processGoodsRequestItems(GoodsRequest goodsRequest, GoodsRequestDTO goodsRequestDTO) {
        if (goodsRequestDTO.getItems() != null) {
            // 1. 기존 아이템 제거
            goodsRequest.getItems().clear();

            // 2. 새 아이템 추가 (addItem 메서드 활용)
            goodsRequestDTO.getItems().forEach(itemDto -> {
                PurchaseRequestItem item = convertToItemEntity(itemDto, goodsRequest);
                goodsRequest.addItem(item); // GoodsRequest의 addItem 메서드 사용
            });
        }
    }

    // 아이템 전체 조회 메서드 추가
    @Transactional(readOnly = true)
    public List<ItemDTO> getAllItems() {
        List<Item> items = itemRepository.findAll();
        return items.stream()
                .map(this::convertToItemDTO)
                .collect(Collectors.toList());
    }

    private ItemDTO convertToItemDTO(Item item) {
        return ItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .specification(item.getSpecification())
                .unitParentCode(
                        item.getUnitParentCode() != null ?
                                item.getUnitParentCode().getCodeGroup() : null
                )
                .unitChildCode(
                        item.getUnitChildCode() != null ?
                                item.getUnitChildCode().getCodeValue() : null
                )
                .standardPrice(item.getStandardPrice())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        // 활성화된 카테고리만 조회 (useYn = 'Y')
        List<Category> categories = categoryRepository.findAllActive();
        return categories.stream()
                .map(CategoryDTO::from)
                .collect(Collectors.toList());
    }


    /**
     * 부서 엔티티를 DTO로 변환
     */
    private DepartmentDTO convertToDepartmentDTO(Department department) {
        return DepartmentDTO.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .description(department.getDescription())
                .teamLeaderLevel(department.getTeamLeaderLevel())
                .middleManagerLevel(department.getMiddleManagerLevel())
                .upperManagerLevel(department.getUpperManagerLevel())
                .executiveLevel(department.getExecutiveLevel())
                .build();
    }

    /**
     * 사용자 엔티티를 DTO로 변환
     */
    private MemberDTO convertToMemberDTO(Member member) {
        MemberDTO dto = MemberDTO.builder()
                .id(member.getId())
                .username(member.getUsername())
                .name(member.getName())
                .email(member.getEmail())
                .contactNumber(member.getContactNumber())
                .companyName(member.getCompanyName())
                .enabled(member.isEnabled())
                .role(member.getRole().name())
                .build();

        // 부서 정보 설정
        if (member.getDepartment() != null) {
            dto.setDepartment(MemberDTO.DepartmentInfo.builder()
                    .id(member.getDepartment().getId())
                    .name(member.getDepartment().getName())
                    .code(member.getDepartment().getCode())
                    .build());
        }

        // 직급 정보 설정
        if (member.getPosition() != null) {
            dto.setPosition(MemberDTO.PositionInfo.builder()
                    .id(member.getPosition().getId())
                    .name(member.getPosition().getName())
                    .level(member.getPosition().getLevel())
                    .build());
        }

        return dto;
    }

    /**
     * 모든 부서 목록 조회
     */
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        List<Department> departments = departmentRepository.findAll();
        return departments.stream()
                .map(this::convertToDepartmentDTO)
                .collect(Collectors.toList());
    }

    /**
     * 특정 부서 정보 조회
     */
    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 부서가 없습니다."));
        return convertToDepartmentDTO(department);
    }

    /**
     * 모든 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<MemberDTO> getAllMembers() {
        List<Member> members = memberRepository.findAll();
        return members.stream()
                .map(this::convertToMemberDTO)
                .collect(Collectors.toList());
    }

    /**
     * 특정 부서에 속한 사용자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<MemberDTO> getMembersByDepartment(Long departmentId) {
        List<Member> members = memberRepository.findByDepartmentId(departmentId);
        return members.stream()
                .map(this::convertToMemberDTO)
                .collect(Collectors.toList());
    }
}