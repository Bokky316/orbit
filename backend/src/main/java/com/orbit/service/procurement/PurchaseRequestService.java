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

@Transactional
public class PurchaseRequestService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final ApprovalLineService approvalLineService;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Value("${uploadPath}")
    private String uploadPath;

    /**
     * 구매 요청 생성 (파일 업로드 포함)
     * @param purchaseRequestDTO 요청 정보
     * @param files 업로드 파일 배열 (nullable)
     */
    // createPurchaseRequest 메소드 수정
    @Transactional
    public PurchaseRequestDTO createPurchaseRequest(PurchaseRequestDTO purchaseRequestDTO, MultipartFile[] files) {
        // 1. DTO -> Entity 변환
        PurchaseRequest purchaseRequest = convertToEntity(purchaseRequestDTO);

        // 요청 날짜 설정
        purchaseRequest.setRequestDate(LocalDate.now());

        // 2. 파일 처리 (신규 로직)
        if (files != null && files.length > 0) {
            processAttachments(purchaseRequest, files); // 첨부파일 처리
        }

        // 3. DB 저장
        PurchaseRequest savedPurchaseRequest = purchaseRequestRepository.save(purchaseRequest);

        // 5. 종합적인 유효성 검증 추가
        validatePurchaseRequest(purchaseRequest);

        // 6. 저장 및 첨부 파일 처리
        PurchaseRequest savedRequest = purchaseRequestRepository.save(purchaseRequest);
        processAttachments(savedRequest, files);

        // 7. 물품 요청 시 품목 처리
        if (savedRequest instanceof GoodsRequest && purchaseRequestDTO instanceof GoodsRequestDTO) {
            processGoodsRequestItems((GoodsRequest) savedRequest, (GoodsRequestDTO) purchaseRequestDTO);
        }

        // 8. 결재선 자동 생성
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
    @Transactional
    public PurchaseRequestDTO updatePurchaseRequest(Long id, PurchaseRequestDTO purchaseRequestDTO, String username) {
        // 1. ID로 기존 엔티티 조회
        PurchaseRequest existingRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 구매 요청이 없습니다."));

        // 2. 수정 가능 여부 검증
        validatePurchaseRequestModifiable(existingRequest, username);

        // 3. 엔티티 업데이트
        updateEntity(existingRequest, purchaseRequestDTO);

        // 4. 프로젝트 정보 업데이트
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

        // 5. 종합적인 유효성 검증 추가
        validatePurchaseRequest(existingRequest);

        // 6. 저장 후 DTO 변환
        PurchaseRequest updatedRequest = purchaseRequestRepository.save(existingRequest);
        return convertToDto(updatedRequest);
    }

    /**
     * 구매 요청 삭제
     */
    @Transactional
    public boolean deletePurchaseRequest(Long id, String username) {
        // 1. ID로 기존 엔티티 조회
        PurchaseRequest existingRequest = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID " + id + "에 해당하는 구매 요청이 없습니다."));

        // 2. 삭제 가능 여부 검증
        validatePurchaseRequestDeletable(existingRequest, username);

        // 3. 삭제
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
     * 첨부파일 처리 메서드 (신규)
     * @param purchaseRequest 요청 엔티티
     * @param files 파일 배열
     */
    private void processAttachments(PurchaseRequest purchaseRequest, MultipartFile[] files) {
        for (MultipartFile file : files) {
            try {
                // 1. 파일 정보 추출 및 저장 경로 설정
                String fileName = StringUtils.cleanPath(file.getOriginalFilename());
                String filePath = uploadPath + "/pr_" + purchaseRequest.getId() + "/" + System.currentTimeMillis() + "_" + fileName;

                // 2. 디렉토리 생성 및 파일 저장
                Path targetLocation = Paths.get(filePath).toAbsolutePath().normalize();
                Files.createDirectories(targetLocation.getParent());
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                // 3. 첨부파일 엔티티 생성 및 저장
                PurchaseRequestAttachment attachment = new PurchaseRequestAttachment();
                attachment.setFileName(fileName);
                attachment.setFilePath(filePath);
                attachment.setFileType(file.getContentType());
                attachment.setFileSize(file.getSize());
                attachment.setPurchaseRequest(purchaseRequest); // 연관관계 설정

                attachmentRepository.save(attachment); // 첨부파일 DB에 저장

            } catch (IOException ex) {
                throw new RuntimeException("파일 저장 실패: " + ex.getMessage());
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
     * SIRequestDTO -> SIRequest 변환
     */
    private SIRequest convertToSiEntity(SIRequestDTO dto) {
        SIRequest entity = new SIRequest();
        entity.setProjectStartDate(dto.getProjectStartDate());
        entity.setProjectEndDate(dto.getProjectEndDate());
        entity.setProjectContent(dto.getProjectContent());

        return entity;

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
     * @param id 업데이트 대상 ID
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
     * 프로젝트와 구매요청 간 제약조건 검증
     */
    private void validatePurchaseRequestWithProject(PurchaseRequest purchaseRequest, Project project) {
        // 1. 예산 검증 - 현재 구매요청과 기존 구매요청의 총합이 프로젝트 예산을 초과하지 않아야 함
        BigDecimal totalBudget = calculateTotalBudgetUsed(project, purchaseRequest.getId());
        BigDecimal newRequestBudget = purchaseRequest.getBusinessBudget();

        if (project.getTotalBudget() != null) {
            BigDecimal projectBudget = BigDecimal.valueOf(project.getTotalBudget());

            if (totalBudget.add(newRequestBudget).compareTo(projectBudget) > 0) {
                throw new IllegalArgumentException(
                        "구매요청 예산 총합(" + totalBudget.add(newRequestBudget) +
                                ")이 프로젝트 예산(" + projectBudget + ")을 초과합니다."
                );
            }
        }

        // 2. 기간 검증 - 타입에 따라 다른 날짜 필드 검증
        LocalDate requestStartDate = null;
        LocalDate requestEndDate = null;

        if (purchaseRequest instanceof SIRequest) {
            SIRequest siRequest = (SIRequest) purchaseRequest;
            requestStartDate = siRequest.getProjectStartDate();
            requestEndDate = siRequest.getProjectEndDate();
        } else if (purchaseRequest instanceof MaintenanceRequest) {
            MaintenanceRequest maintenanceRequest = (MaintenanceRequest) purchaseRequest;
            requestStartDate = maintenanceRequest.getContractStartDate();
            requestEndDate = maintenanceRequest.getContractEndDate();
        }

        // 날짜 검증 로직
        if (requestStartDate != null && requestEndDate != null) {
            // 2.1. 시작일이 종료일보다 앞에 있어야 함
            if (requestStartDate.isAfter(requestEndDate)) {
                throw new IllegalArgumentException("구매요청의 시작일이 종료일보다 늦을 수 없습니다.");
            }

            // 2.2. 구매요청 기간이 프로젝트 기간 내에 있어야 함
            LocalDate projectStartDate = project.getProjectPeriod().getStartDate();
            LocalDate projectEndDate = project.getProjectPeriod().getEndDate();

            if (requestStartDate.isBefore(projectStartDate) || requestEndDate.isAfter(projectEndDate)) {
                throw new IllegalArgumentException(
                        "구매요청 기간(" + requestStartDate + " ~ " + requestEndDate +
                                ")이 프로젝트 기간(" + projectStartDate + " ~ " + projectEndDate + ")을 벗어납니다."
                );
            }
        }
    }

    /**
     * 프로젝트의 현재 사용된 총 예산 계산 (현재 구매요청 제외)
     */
    private BigDecimal calculateTotalBudgetUsed(Project project, Long currentRequestId) {
        // 프로젝트에 연결된, 현재 요청 외의 모든 구매요청의 예산 합계 계산
        return project.getPurchaseRequests().stream()
                .filter(pr -> currentRequestId == null || !pr.getId().equals(currentRequestId))
                .map(PurchaseRequest::getBusinessBudget)
                .filter(budget -> budget != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
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

    // 파일 다운로드 기능 추가
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
}