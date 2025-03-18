package com.orbit.service.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingDto;
import com.orbit.dto.bidding.BiddingEvaluationDto;
import com.orbit.dto.bidding.BiddingParticipationDto;
import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.bidding.BiddingSupplier;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingEvaluationRepository;
import com.orbit.repository.bidding.BiddingParticipationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.BiddingSupplierRepository;
import com.orbit.repository.commonCode.ChildCodeRepository;
import com.orbit.repository.commonCode.ParentCodeRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;
import com.orbit.util.BiddingNumberUtil;
import com.orbit.util.PriceCalculator;
import com.orbit.util.PriceCalculator.PriceResult;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 관련 비즈니스 로직을 처리하는 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingService {
    private final BiddingRepository biddingRepository;
    private final BiddingParticipationRepository participationRepository;
    private final BiddingEvaluationRepository evaluationRepository;
    private final BiddingContractRepository contractRepository;
    private final BiddingSupplierRepository supplierRepository;
    private final BiddingOrderRepository orderRepository;
    private final BiddingEvaluationService evaluationService;
    private final MemberRepository memberRepository;
    private final NotificationRepository notificationRepository;
    private final ParentCodeRepository parentCodeRepository;
    private final ChildCodeRepository childCodeRepository;
    private final SupplierRegistrationRepository supplierRegistrationRepository;
    private final ResourceLoader resourceLoader;

    @Value("${uploadPath}")
    private String uploadPath;

/*    @Transactional(readOnly = true)
    public List<String> getBiddingStatusHistoryReasons(Long biddingId) {
        List<StatusHistory> histories = biddingRepository.findStatusHistoriesByBiddingId(biddingId);
        return histories.stream()
                .map(StatusHistory::getReason)
                .filter(reason -> reason != null)
                .collect(Collectors.toList());
    }*/

    // 파일 유효성 검사 메서드 추가
    private void validateFile(MultipartFile file) {
        // 파일 크기 제한 (50MB)
        long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 50MB를 초과할 수 없습니다: " + file.getOriginalFilename());
        }

        // 허용된 파일 타입 검사
        String[] ALLOWED_TYPES = {
            "image/jpeg", "image/png", "image/gif", 
            "application/pdf", 
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        };

        String contentType = file.getContentType();
        boolean isValidType = Arrays.stream(ALLOWED_TYPES)
            .anyMatch(type -> type.equals(contentType));

        if (!isValidType) {
            throw new IllegalArgumentException("지원되지 않는 파일 형식입니다: " + file.getOriginalFilename());
        }
    }

    // 고유한 파일명 생성 메서드 추가
    private String generateUniqueFilename(String originalFilename) {
        String uuid = UUID.randomUUID().toString();
        String extension = "";
        
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        
        return uuid + extension;
    }

    @Transactional
    public BiddingDto addAttachmentsToBidding(Long biddingId, MultipartFile[] files, Member currentMember) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));

        // 파일 저장 경로 생성 (연/월 기준)
        LocalDate now = LocalDate.now();
        String uploadPath = String.format("%s/biddings/%d/%02d", 
            this.uploadPath, now.getYear(), now.getMonthValue());
        
        Path uploadDir = Paths.get(uploadPath);
        
        // 디렉토리 생성
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 디렉토리 생성 실패", e);
        }

        // 첨부파일 처리
        for (MultipartFile file : files) {
            // 파일 유효성 검사
            validateFile(file);

            try {
                // 고유한 파일명 생성
                String originalFilename = file.getOriginalFilename();
                String uniqueFilename = generateUniqueFilename(originalFilename);
                Path targetPath = uploadDir.resolve(uniqueFilename);

                // 파일 저장
                file.transferTo(targetPath);

                // 파일 경로 저장
                bidding.addAttachment(targetPath.toString());
            } catch (IOException e) {
                throw new RuntimeException("파일 저장 중 오류 발생: " + file.getOriginalFilename(), e);
            }
        }

        // 업데이트된 입찰 공고 저장
        bidding = biddingRepository.save(bidding);

        // 업데이트된 입찰 공고 반환
        return convertToDto(bidding);
    }

    @Transactional
    public Resource downloadAttachment(Long biddingId, String filename) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));

        // 파일 경로 확인
        Optional<String> filePath = bidding.getAttachmentPaths().stream()
                .filter(path -> path.endsWith(filename))
                .findFirst();

        if (filePath.isEmpty()) {
            throw new EntityNotFoundException("파일을 찾을 수 없습니다: " + filename);
        }

        try {
            // 파일 리소스 생성
            Path path = Paths.get(filePath.get());
            Resource resource = new UrlResource(path.toUri());

            // 파일 존재 및 읽기 가능 여부 확인
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("파일을 읽을 수 없습니다: " + filename);
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("파일 다운로드 중 오류 발생: " + filename, e);
        }
    }

    @Transactional
    public void deleteAttachments(Long biddingId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));

        // 모든 첨부파일 삭제
        for (String filePath : bidding.getAttachmentPaths()) {
            try {
                Files.deleteIfExists(Paths.get(filePath));
            } catch (IOException e) {
                log.error("파일 삭제 중 오류 발생: {}", filePath, e);
            }
        }

        // 첨부파일 목록 초기화
        bidding.getAttachmentPaths().clear();
        biddingRepository.save(bidding);
    }

    /**
     * 입찰 공고 목록 조회
     * 
     * @param params 필터링 파라미터 (status, startDate, endDate)
     * @return 입찰 공고 DTO 목록
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingList(Map<String, Object> params) {
        BiddingStatus status = params.get("status") != null ? (BiddingStatus) params.get("status") : null;
        LocalDateTime startDate = params.get("startDate") != null ? (LocalDateTime) params.get("startDate") : null;
        LocalDateTime endDate = params.get("endDate") != null ? (LocalDateTime) params.get("endDate") : null;
        
        List<Bidding> biddings = biddingRepository.findBiddingsByFilter(status, startDate, endDate);
        
        if (statusCode != null) {
            // 상태 코드로 필터링
            // ParentCode 객체 먼저 찾기
            Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
            if (parentCode.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
            }
            
            Optional<ChildCode> status = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), statusCode);
            if (status.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + statusCode);
            }
            
            biddings = biddingRepository.findByStatusChildAndStartDateGreaterThanEqualAndEndDateLessThanEqual(status.get(), startDate, endDate);
        } else {
            biddings = biddingRepository.findByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate);
        }
        
        if (statusCode != null) {
            // 상태 코드로 필터링
            // ParentCode 객체 먼저 찾기
            Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
            if (parentCode.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
            }
            
            Optional<ChildCode> status = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), statusCode);
            if (status.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + statusCode);
            }
            
            biddings = biddingRepository.findByStatusChildAndStartDateGreaterThanEqualAndEndDateLessThanEqual(status.get(), startDate, endDate);
        } else {
            biddings = biddingRepository.findByStartDateGreaterThanEqualAndEndDateLessThanEqual(startDate, endDate);
        }
        
        return biddings.stream()
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
    }


    /**
     * 특정 상태의 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsByStatus(String status) {
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        Optional<ChildCode> statusCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), status);
        if (statusCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + status);
        }
        
        List<Bidding> biddings = biddingRepository.findByStatusChild(statusCode.get());
        return biddings.stream()
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
    }


    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsInvitedSupplier(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsInvitedSupplier(supplierId);
        return biddings.stream()
                .map(BiddingDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 공급사가 참여한 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsParticipatedBySupplier(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsParticipatedBySupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 상태의 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsByStatus(String status) {
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        Optional<ChildCode> statusCode = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), status);
        if (statusCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + status);
        }
        
        List<Bidding> biddings = biddingRepository.findByStatusChild(statusCode.get());
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsInvitedSupplier(Long supplierId) {
        // 멤버로 공급사 정보 조회
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
                
        List<Bidding> biddings = biddingRepository.findBiddingsInvitedSupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 공급사가 참여한 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingDto> getBiddingsParticipatedBySupplier(Long supplierId) {
        List<Bidding> biddings = biddingRepository.findBiddingsParticipatedBySupplier(supplierId);
        return biddings.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 입찰 공고 상세 조회
     * 
     * @param id 입찰 공고 ID
     * @return 입찰 공고 DTO
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public BiddingDto getBiddingById(Long id) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        return convertToDto(bidding);
    }

    /**
     * 입찰 공고 생성
     */
    @Transactional
    public BiddingDto createBidding(BiddingFormDto formDto) {
        // 입찰 번호 생성
        String bidNumber = BiddingNumberUtil.generateBidNumber();
        
        // 입찰 공고 엔티티 생성
        Bidding bidding = formDto.toEntity();
        
        // 입찰 번호 설정
        bidding.setBidNumber(bidNumber);
        
        // 상태 코드 설정
        Optional<ParentCode> statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (statusParent.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        Optional<ChildCode> pendingStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent.get(), "PENDING");
        if (pendingStatus.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: PENDING");
        }
        
        bidding.setStatusParent(statusParent.get());
        bidding.setStatusChild(pendingStatus.get());
        
        // 입찰 방식 코드 설정
        String methodCode = formDto.getMethodChild() != null ? formDto.getMethodChild().getCodeValue() : null;
        if (methodCode != null) {
            Optional<ParentCode> methodParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "METHOD");
            if (methodParent.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 방식 코드 그룹입니다: BIDDING_METHOD");
            }
            
            Optional<ChildCode> methodChild = childCodeRepository.findByParentCodeAndCodeValue(methodParent.get(), methodCode);
            if (methodChild.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 방식 코드입니다: " + methodCode);
            }
            
            bidding.setMethodParent(methodParent.get());
            bidding.setMethodChild(methodChild.get());
        }
        
        // 가격 재계산
        bidding.recalculatePrices();
        
        // 다중 공급자 정보 처리
        if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
            bidding.setDescription("공급자 ID: " + String.join(", ", 
                formDto.getSupplierIds().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList())));
        }
        
        // 엔티티 저장
        bidding = biddingRepository.save(bidding);
        
        // 상태 이력 추가
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.BIDDING)
                .bidding(bidding)
                .fromStatus(null)
                .toStatus(pendingStatus.get())
                .reason("입찰 공고 생성")
                .changedAt(LocalDateTime.now())
                .build();
        
        bidding.getStatusHistories().add(history);
        
        // 공급사 초대 처리
        if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
            for (Long supplierId : formDto.getSupplierIds()) {
                try {
                    // 공급사 조회
                    Member supplier = memberRepository.findById(supplierId)
                            .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
                    
                    // 공급사 초대 생성 (수정된 메서드 사용)
                    BiddingSupplier supplierInvitation = new BiddingSupplier();
                    supplierInvitation.setBidding(bidding);
                    supplierInvitation.setSupplier(supplier);
                    supplierInvitation.setCompanyName(supplier.getCompanyName());
                    supplierInvitation.setNotificationSent(false);
                    
                    // 초대 저장
                    bidding.getSuppliers().add(supplierInvitation);
                    supplierRepository.save(supplierInvitation);
                    
                    // 알림 발송 (새로운 방식)
                    supplierInvitation.sendNotification(
                        notificationRepository,
                        memberRepository,
                        "새로운 입찰 공고 초대",
                        "입찰 공고 '" + bidding.getTitle() + "'에 참여 요청이 왔습니다. 확인해주세요."
                    );
                } catch (Exception e) {
                    log.error("공급사 초대 중 오류 발생: {}", e.getMessage());
                }
            }
        }
        
        // 최종 저장
        bidding = biddingRepository.save(bidding);
        
        return convertToDto(bidding);
    }


/**
 * 입찰 공고 생성
 */
    @Transactional
    public BiddingDto createBidding(BiddingFormDto formDto) {
        // 입찰 번호 생성
        String bidNumber = generateBidNumber();
        
        // 입찰 공고 엔티티 생성
        Bidding bidding = formDto.toEntity();
        
        // 입찰 번호 설정
        bidding.setBidNumber(bidNumber);
        
        // 가격 재계산
        bidding.recalculatePrices();
        
        // 다중 공급자 정보 처리
        if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
            bidding.setDescription("공급자 ID: " + String.join(", ", 
                formDto.getSupplierIds().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList())));
        }

        // if (formDto.getSupplierIds() != null && !formDto.getSupplierIds().isEmpty()) {
        //     List<Supplier> suppliers = supplierRepository.findAllById(formDto.getSupplierIds());
            
        //     // 공급자 정보를 companyName으로 설정
        //     bidding.setCompanyName(
        //         suppliers.stream()
        //             .map(Supplier::getCompanyName)
        //             .collect(Collectors.joining(", "))
        //     );
            
        //     // 공급자-입찰 관계 설정
        //     suppliers.forEach(bidding::addSupplier);
        // }
        
        // 엔티티 저장
        bidding = biddingRepository.save(bidding);
        
        // 상태 이력 추가
        /*StatusHistory history = StatusHistory.builder()
                .fromStatus(null)
                .toStatus(bidding.getStatus())
                .entityType(StatusHistory.EntityType.BIDDING)
                .changedAt(LocalDateTime.now())
                .bidding(bidding)
                .build();
        bidding.addStatusHistory(history);*/
        
        return BiddingDto.fromEntity(bidding);
    }
    /**
     * 입찰 공고 수정
     */
    @Transactional
public BiddingDto createBidding(BiddingDto biddingDto) {
    // 입찰 번호 생성 (예: BID-년도-일련번호)
    String bidNumber = "BID-" + LocalDateTime.now().getYear() + "-" 
                     + String.format("%04d", biddingRepository.count() + 1);
    biddingDto.setBidNumber(bidNumber);
    
    // 필드명 매핑 처리
    if (biddingDto.getBiddingConditions() != null) {
        biddingDto.setConditions(biddingDto.getBiddingConditions());
    }
    
    // 가격제안 방식일 경우 금액 계산
    if (biddingDto.getBidMethod() == BidMethod.PRICE_SUGGESTION) {
        calculateBiddingPrices(biddingDto);
    }
    
    // 다중 공급자 정보 처리
    if (biddingDto.getSupplierIds() != null && !biddingDto.getSupplierIds().isEmpty()) {
        // description 필드에 공급자 정보 저장 (임시 방법)
        // 실제로는 별도 테이블을 생성하는 것이 좋음
        biddingDto.setDescription("공급자 ID: " + String.join(", ", 
            biddingDto.getSupplierIds().stream()
                .map(Object::toString)
                .collect(Collectors.toList())));
    }
    
    Bidding bidding = biddingDto.toEntity();
    bidding = biddingRepository.save(bidding);
    
    return BiddingDto.fromEntity(bidding);
}

    /**
     * 입찰 공고 수정
     * 
     * @param id 입찰 공고 ID
     * @param biddingDto 수정할 입찰 공고 정보
     * @return 수정된 입찰 공고 DTO
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
    @Transactional
    public BiddingDto updateBidding(Long id, BiddingDto biddingDto) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        // 이전 상태 저장 (상태 변경 이력 추적용)
        ChildCode oldStatus = bidding.getStatusChild();
        
        // 기본 정보 업데이트
        bidding.setTitle(formDto.getTitle());
        bidding.setDescription(formDto.getDescription());
        bidding.setStartDate(formDto.getStartDate());
        bidding.setEndDate(formDto.getEndDate());
        bidding.setConditions(formDto.getConditions());
        bidding.setInternalNote(formDto.getInternalNote());
        bidding.setQuantity(formDto.getQuantity());
        bidding.setUnitPrice(formDto.getUnitPrice());
        
        // 첨부파일 처리
        if (formDto.getAttachmentPaths() != null) {
            bidding.setAttachmentPaths(formDto.getAttachmentPaths());
        }
        
        // 상태 코드 업데이트 (변경이 있는 경우)
        String statusCode = formDto.getStatusChild() != null ? formDto.getStatusChild().getCodeValue() : null;
        if (statusCode != null) {
            Optional<ParentCode> statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
            if (statusParent.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
            }
            
            Optional<ChildCode> newStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent.get(), statusCode);
            if (newStatus.isPresent() && !newStatus.get().equals(oldStatus)) {
                bidding.setStatusChild(newStatus.get());
                
                // 상태 변경 이력 추가
                StatusHistory history = StatusHistory.builder()
                        .entityType(StatusHistory.EntityType.BIDDING)
                        .bidding(bidding)
                        .fromStatus(oldStatus)
                        .toStatus(newStatus.get())
                        .reason(formDto.getDescription()) // 상태 변경 이유는 설명에서 가져옴
                        .changedAt(LocalDateTime.now())
                        .build();
                
                bidding.getStatusHistories().add(history);
            }
        }
        
        // 입찰 방식 코드 업데이트 (변경이 있는 경우)
        String methodCode = formDto.getMethodChild() != null ? formDto.getMethodChild().getCodeValue() : null;
        if (methodCode != null) {
            Optional<ParentCode> methodParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "METHOD");
            if (methodParent.isEmpty()) {
                throw new IllegalArgumentException("유효하지 않은 방식 코드 그룹입니다: BIDDING_METHOD");
            }
            
            Optional<ChildCode> newMethod = childCodeRepository.findByParentCodeAndCodeValue(methodParent.get(), methodCode);
            if (newMethod.isPresent()) {
                bidding.setMethodChild(newMethod.get());
            }
        }
        
        // 가격 재계산
        bidding.recalculatePrices();
        
        // 엔티티 저장
        bidding = biddingRepository.save(bidding);
        
        return convertToDto(bidding);
    }

    /**
     * 입찰 공고 삭제
     * 
     * @param id 입찰 공고 ID
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
    @Transactional
    public void deleteBidding(Long id) {
        if (!biddingRepository.existsById(id)) {
            throw new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id);
        }
        
        biddingRepository.deleteById(id);
    }

    /**
     * 입찰 상태 변경
     */
    @Transactional
    public BiddingDto changeBiddingStatus(Long id, String status, String reason) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        // 이전 상태 저장
        ChildCode oldStatus = bidding.getStatusChild();
        
        // ParentCode 객체 먼저 찾기
        Optional<ParentCode> parentCode = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (parentCode.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        // 새 상태 코드 조회
        Optional<ChildCode> newStatus = childCodeRepository.findByParentCodeAndCodeValue(parentCode.get(), status);
        if (newStatus.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: " + status);
        }
        
        // 상태 변경 및 알림 발송 (수정된 메서드 사용)
        bidding.changeStatus(newStatus.get(), reason, null, memberRepository, notificationRepository);
        
        // 엔티티 저장
        bidding = biddingRepository.save(bidding);
        
        return convertToDto(bidding);
    }

    /**
     * 상태 변경 이력 조회
     */
    @Transactional(readOnly = true)
    public List<StatusHistory> getBiddingStatusHistories(Long biddingId) {
        return biddingRepository.findStatusHistoriesByBiddingId(biddingId);
    }

    /**
     * 입찰 참여
     * 
     * @param participationDto 입찰 참여 DTO
     * @return 생성된 입찰 참여 DTO
     */
    @Transactional
    public BiddingParticipationDto participateInBidding(BiddingParticipationDto participationDto) {
        // 입찰 참여 검증
        validateBiddingParticipation(participationDto);
        
        Bidding bidding = biddingRepository.findById(participationDto.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participationDto.getBiddingId()));
        
        BiddingParticipation participation = participationDto.toEntity();
        
        // 참여 정보 설정
        participation.setSubmittedAt(LocalDateTime.now());
        
        // 공급사 정보 설정 (이름 등)
        if (participation.getSupplierId() != null) {
            Member supplier = memberRepository.findById(participation.getSupplierId())
                    .orElse(null);
            if (supplier != null) {
                participation.setCompanyName(supplier.getCompanyName());
            }
        }
        
        // 가격 계산
        calculateParticipationPrices(participation, bidding.getQuantity());
        
        // 가격 계산
        calculateParticipationPrices(participation, bidding.getQuantity());
        
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }
    
    /**
     * 입찰 참여 목록 조회
     * 
     * @param biddingId 입찰 공고 ID
     * @return 입찰 참여 DTO 목록
     */
    @Transactional(readOnly = true)
    public List<BiddingParticipationDto> getBiddingParticipations(Long biddingId) {
        List<BiddingParticipation> participations = participationRepository.findByBiddingId(biddingId);
        
        return participations.stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 입찰 참여 상세 조회
     * 
     * @param id 입찰 참여 ID
     * @return 입찰 참여 DTO
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public BiddingParticipationDto getParticipationById(Long id) {
        BiddingParticipation participation = participationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + id));
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 입찰 상태 변경
     */
    @Transactional
    public BiddingDto changeBiddingStatus(Long id, String status, String reason) {
        Bidding bidding = biddingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + id));
        
        // 이전 상태 저장
        SystemStatus oldStatus = bidding.getStatus();
        
        // 새 상태 설정
        SystemStatus newStatus = new SystemStatus("BIDDING", status);
        bidding.setStatus(newStatus);
        
        // 상태 이력 추가
        /*StatusHistory history = StatusHistory.builder()
                .fromStatus(oldStatus)
                .toStatus(newStatus)
                .entityType(StatusHistory.EntityType.BIDDING)
                .changedAt(LocalDateTime.now())
                .bidding(bidding)
                .reason(reason)  // reason 추가
                .build();
        
        bidding.addStatusHistory(history);*/
        
        return BiddingDto.fromEntity(bidding);
    }

    /**
     * 상태 변경 이력 조회
     */
/*    @Transactional(readOnly = true)
    public List<StatusHistory> getBiddingStatusHistories(Long biddingId) {
        return biddingRepository.findStatusHistoriesByBiddingId(biddingId);
    }*/

    /**
     * 입찰 참여 검증
     * 
     * @param participation 입찰 참여 DTO
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     * @throws IllegalStateException 입찰 참여가 유효하지 않은 경우
     */
    private void validateBiddingParticipation(BiddingParticipationDto participation) {
        Bidding bidding = biddingRepository.findById(participation.getBiddingId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + participation.getBiddingId()));
        
        // 상태 코드 확인
        if (bidding.getStatusChild() != null) {
            String statusCode = bidding.getStatusChild().getCodeValue();
            
            // 진행중 상태가 아니면 참여 불가
            if (!"ONGOING".equals(statusCode)) {
                throw new IllegalStateException("현재 참여 가능한 상태가 아닙니다. 현재 상태: " + bidding.getStatusChild().getCodeName());
            }
        }
        
        // 마감일이 지났는지 확인
        if (LocalDateTime.now().isAfter(bidding.getEndDate())) {
            throw new IllegalStateException("입찰 마감일이 지났습니다.");
        }
        
        // 이미 참여한 공급자인지 확인
        if (participationRepository.existsByBiddingIdAndSupplierId(
                participation.getBiddingId(), participation.getSupplierId())) {
            throw new IllegalStateException("이미 참여한 입찰입니다.");
        }
    }

   
    
   
   
    /**
     * 낙찰자 선정
     * 
     * @param biddingId 입찰 공고 ID
     * @return 선정된 낙찰자의 평가 DTO (없으면 null)
     */
    @Transactional(readOnly = true)
    public BiddingEvaluationDto selectWinningBid(Long biddingId) {
        List<BiddingEvaluation> evaluations = evaluationRepository.findTopByBiddingIdOrderByTotalScoreDesc(biddingId);
        
        if (evaluations.isEmpty()) {
            return null;
        }
        
        return BiddingEvaluationDto.fromEntity(evaluations.get(0));
    }

    /**
     * 공급사 참여 의사 확인
     */
    @Transactional
    public BiddingParticipationDto confirmSupplierParticipation(Long participationId) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.confirmParticipation();
        participation = participationRepository.save(participation);
        
        return BiddingParticipationDto.fromEntity(participation);
    }

    /**
     * 낙찰자 선정 (최고 점수 기준)
     */
    @Transactional
    public SimplifiedContractDto createContract(SimplifiedContractDto contractDto) {
        // 낙찰자 선정
        BiddingEvaluationDto winningBid = selectWinningBid(contractDto.getBiddingId());

        if (winningBid == null) {
            throw new IllegalStateException("낙찰자가 선정되지 않았습니다.");
        }
        
        if (evaluations.isEmpty()) {
            throw new IllegalStateException("해당 입찰의 평가 정보가 없습니다.");
        }
        
        // 최고 점수 평가 찾기
        BiddingEvaluation highestScoringEvaluation = evaluations.stream()
                .max((e1, e2) -> {
                    // null 처리 및 점수 비교
                    final Integer score1 = e1.getTotalScore() != null ? e1.getTotalScore() : 0;
                    final Integer score2 = e2.getTotalScore() != null ? e2.getTotalScore() : 0;
                    return score1.compareTo(score2);
                })
                .orElseThrow(() -> new EntityNotFoundException("해당 입찰의 평가 정보를 찾을 수 없습니다. ID: " + biddingId));
        
        BiddingParticipation participation = participationRepository.findById(winningBid.getBiddingParticipationId())
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + winningBid.getBiddingParticipationId()));
        
        // 새 낙찰자 선정
        highestScoringEvaluation.selectAsBidder(notificationRepository, memberRepository);
        BiddingEvaluation savedEvaluation = evaluationRepository.save(highestScoringEvaluation);
        
        // 입찰 공고에서도 낙찰자 선정 처리
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        // 참여 정보 조회
        BiddingParticipation participation = participationRepository.findById(savedEvaluation.getBiddingParticipationId())
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + savedEvaluation.getBiddingParticipationId()));
        
        // 낙찰자 선정
        bidding.selectBidder(participation, savedEvaluation, memberRepository, notificationRepository);
        
        // 입찰 상태 변경 (마감 상태로)
        Optional<ParentCode> statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (statusParent.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        Optional<ChildCode> closedStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent.get(), "CLOSED");
        if (closedStatus.isPresent() && !closedStatus.get().equals(bidding.getStatusChild())) {
            bidding.changeStatus(closedStatus.get(), "낙찰자 선정으로 인한 마감", null, memberRepository, notificationRepository);
        }
        
        biddingRepository.save(bidding);
        
        return BiddingEvaluationDto.fromEntity(savedEvaluation);
    }
    
    /**
     * 수동으로 낙찰자 선정
     */
    @Transactional
    public BiddingEvaluationDto selectBidderManually(Long biddingId, Long evaluationId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
                
        BiddingEvaluation originalEvaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new EntityNotFoundException("평가 정보를 찾을 수 없습니다. ID: " + evaluationId));
                
        final Long participationId = originalEvaluation.getBiddingParticipationId();
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 기존 낙찰자 초기화
        List<BiddingEvaluation> previousWinners = evaluationRepository.findByBiddingIdAndIsSelectedBidderTrue(biddingId);
        previousWinners.forEach(BiddingEvaluation::cancelSelectedBidder);
        evaluationRepository.saveAll(previousWinners);
        
        // 새 낙찰자 선정
        originalEvaluation.selectAsBidder(notificationRepository, memberRepository);
        BiddingEvaluation savedEvaluation = evaluationRepository.save(originalEvaluation);
        
        bidding.selectBidder(participation, savedEvaluation, memberRepository, notificationRepository);
        
        // 입찰 상태 변경 (마감 상태로)
        Optional<ParentCode> statusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING", "STATUS");
        if (statusParent.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_STATUS");
        }
        
        Optional<ChildCode> closedStatus = childCodeRepository.findByParentCodeAndCodeValue(statusParent.get(), "CLOSED");
        if (closedStatus.isPresent() && !closedStatus.get().equals(bidding.getStatusChild())) {
            bidding.changeStatus(closedStatus.get(), "수동 낙찰자 선정으로 인한 마감", null, memberRepository, notificationRepository);
        }
        
        biddingRepository.save(bidding);
        
        return BiddingEvaluationDto.fromEntity(savedEvaluation);
    }

    /**
     * 입찰 공고별 낙찰자 목록 조회
     */
    @Transactional(readOnly = true)
    public List<SimplifiedContractDto> getContractList(Map<String, Object> params) {
        List<SimplifiedContract> contracts;
        
        // 입찰 ID로 필터링
        if (params.containsKey("biddingId")) {
            Long biddingId = (Long) params.get("biddingId");
            contracts = contractRepository.findByBiddingId(biddingId);
        } 
        // 상태로 필터링
        else if (params.containsKey("status")) {
            ContractStatus status = (ContractStatus) params.get("status");
            contracts = contractRepository.findByStatus(status);
        } 
        // 전체 조회
        else {
            contracts = contractRepository.findAll();
        }
        
        return contracts.stream()
                .map(SimplifiedContractDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 입찰에 초대된 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getInvitedSuppliers(Long biddingId) {
        List<BiddingSupplier> suppliers = supplierRepository.findByBiddingId(biddingId);
        
        return suppliers.stream()
                .map(supplier -> BiddingSupplierDto.fromEntityWithBusinessNo(supplier, supplierRegistrationRepository))
                .collect(Collectors.toList());
    }
    
    /**
     * 공급사 초대
     */
    @Transactional
    public BiddingSupplierDto inviteSupplier(Long biddingId, Long supplierId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
                
        // 멤버 조회
        Member supplier = memberRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("공급사를 찾을 수 없습니다. ID: " + supplierId));
        
        // 이미 초대된 공급사인지 확인
        if (supplierRepository.existsByBiddingIdAndSupplierId(biddingId, supplierId)) {
            throw new IllegalStateException("이미 초대된 공급사입니다.");
        }
        
        // 공급사 초대 생성
        BiddingSupplier supplierInvitation = new BiddingSupplier();
        supplierInvitation.setBidding(bidding);
        supplierInvitation.setSupplier(supplier);
        supplierInvitation.setCompanyName(supplier.getCompanyName());
        supplierInvitation.setNotificationSent(false);
        
        // 공급사 초대 저장
        bidding.getSuppliers().add(supplierInvitation);
        supplierInvitation = supplierRepository.save(supplierInvitation);
        
        // 알림 발송
        supplierInvitation.sendNotification(
            notificationRepository,
            memberRepository,
            "새로운 입찰 공고 초대",
            "입찰 공고 '" + bidding.getTitle() + "'에 참여 요청이 왔습니다. 확인해주세요."
        );
        
        return BiddingSupplierDto.fromEntityWithBusinessNo(supplierInvitation, supplierRegistrationRepository);
    }

    /**
     * 계약 초안 생성
     */
    @Transactional
    public Long createContractDraft(Long biddingId, Long participationId) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
                
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 계약 초안 생성
        BiddingContract contract = bidding.createContractDraft(participation, memberRepository, notificationRepository);
        
        // 계약 번호 생성 및 설정
        String contractNumber = BiddingNumberUtil.generateContractNumberFromBidNumber(bidding.getBidNumber());
        contract.setTransactionNumber(contractNumber);
        
        // 계약 상태 설정
        Optional<ParentCode> contractStatusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_CONTRACT", "STATUS");
        if (contractStatusParent.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드 그룹입니다: BIDDING_CONTRACT_STATUS");
        }
        
        Optional<ChildCode> draftStatus = childCodeRepository.findByParentCodeAndCodeValue(contractStatusParent.get(), "DRAFT");
        if (draftStatus.isEmpty()) {
            throw new IllegalArgumentException("유효하지 않은 상태 코드입니다: DRAFT");
        }
        
        contract.setStatusParent(contractStatusParent.get());
        contract.setStatusChild(draftStatus.get());
        
        contract = contractRepository.save(contract);
        
        // 상태 이력 추가
        StatusHistory history = StatusHistory.builder()
                .entityType(StatusHistory.EntityType.CONTRACT)
                .biddingContract(contract)
                .fromStatus(null)
                .toStatus(draftStatus.get())
                .reason("계약 초안 생성")
                .changedAt(LocalDateTime.now())
                .build();
        
        contract.getStatusHistories().add(history);
        contractRepository.save(contract);
        
        return contract.getId();
    }
    
    /**
     * 발주 생성
     */
    @Transactional
    public Long createOrder(Long biddingId, Long participationId, String createdById) {
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
                
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 발주 생성
        BiddingOrder order = bidding.createOrder(participation, createdById, memberRepository, notificationRepository);
        
        // 발주 번호 자동 생성
        String orderNumber = BiddingNumberUtil.generateOrderNumber();
        order.setOrderNumber(orderNumber);
        
        // 발주 상태 설정 우선 주석
        /*
        Optional<ParentCode> orderStatusParent = parentCodeRepository.findByEntityTypeAndCodeGroup("BIDDING_ORDER", "STATUS");
        if (orderStatusParent.isPresent()) {
            Optional<ChildCode> draftStatus = childCodeRepository.findByParentCodeAndCodeValue(orderStatusParent.get(), "DRAFT");
            if (draftStatus.isPresent()) {
                // 상태 설정 로직 필요
            }
        }
        */
        
        order = orderRepository.save(order);
        
        // 참여 정보 발주 상태 업데이트
        participation.setOrderCreated(true);
        participationRepository.save(participation);
        
        return order.getId();
    }
    
    /**
     * Bidding 엔티티를 BiddingDto로 변환 (공급사 정보 포함)
     */
    private BiddingDto convertToDto(Bidding bidding) {
        BiddingDto dto = BiddingDto.fromEntity(bidding);
        
        // 공급사 정보 변환 (사업자번호 포함)
        if (bidding.getSuppliers() != null && !bidding.getSuppliers().isEmpty()) {
            List<BiddingSupplierDto> supplierDtos = bidding.getSuppliers().stream()
                .map(supplier -> BiddingSupplierDto.fromEntityWithBusinessNo(supplier, supplierRegistrationRepository))
                .collect(Collectors.toList());
            
            dto.setSuppliers(supplierDtos);
            dto.setTotalSuppliers(supplierDtos.size());
        }
        
        // 참여 정보 변환
        if (bidding.getParticipations() != null && !bidding.getParticipations().isEmpty()) {
            List<BiddingParticipationDto> participationDtos = bidding.getParticipations().stream()
                .map(BiddingParticipationDto::fromEntity)
                .collect(Collectors.toList());
            
            dto.setParticipations(participationDtos);
            dto.setTotalParticipations(participationDtos.size());
        }
        
        return dto;
    }
    
    /**
     * 외부에서 총금액을 직접 설정할 경우 (예: DB에서 가져온 데이터)
     * 
     * @param participationId 입찰 참여 ID
     * @param totalAmount 설정할 총금액
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
    @Transactional
    public void updateParticipationTotalAmount(Long participationId, BigDecimal totalAmount) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        participation.setTotalAmount(totalAmount);
        participationRepository.save(participation);
    }
    
    /**
     * 테이블 간 금액 복사 (예: 입찰 참여 → 계약)
     * 
     * @param participationId 입찰 참여 ID
     * @param contract 계약 엔티티
     * @throws EntityNotFoundException 입찰 참여 정보를 찾을 수 없는 경우
     */
    @Transactional
    public void copyPricesFromParticipationToContract(Long participationId, SimplifiedContract contract) {
        BiddingParticipation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 참여 정보를 찾을 수 없습니다. ID: " + participationId));
        
        // 금액 관련 필드 복사
        contract.setQuantity(participation.getQuantity());
        contract.setUnitPrice(participation.getUnitPrice());
        contract.setSupplyPrice(participation.getSupplyPrice());
        contract.setVat(participation.getVat());
        contract.setTotalAmount(participation.getTotalAmount());
    }
    
    /**
     * 다양한 소스에서 금액 정보 가져오기 (통합 조회 메서드)
     * 
     * @param biddingId 입찰 공고 ID
     * @return 모든 금액 정보를 담은 맵
     * @throws EntityNotFoundException 입찰 공고를 찾을 수 없는 경우
     */
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getAllPriceInfo(Long biddingId) {
        Map<String, BigDecimal> priceInfo = new HashMap<>();
        
        // 입찰 정보
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        priceInfo.put("biddingUnitPrice", bidding.getUnitPrice());
        priceInfo.put("biddingSupplyPrice", bidding.getSupplyPrice());
        priceInfo.put("biddingVat", bidding.getVat());
        priceInfo.put("biddingTotalAmount", bidding.getTotalAmount());
        
        // 참여 정보 (낙찰자)
        List<BiddingParticipation> participations = participationRepository.findByBiddingId(biddingId);
        if (!participations.isEmpty()) {
            BiddingParticipation winner = participations.stream()
                    .max(Comparator.comparing(p -> evaluationRepository.findByBiddingParticipationId(p.getId())
                            .stream()
                            .mapToInt(BiddingEvaluation::getTotalScore)
                            .max()
                            .orElse(0)))
                    .orElse(null);
            
            if (winner != null) {
                priceInfo.put("participationUnitPrice", winner.getUnitPrice());
                priceInfo.put("participationSupplyPrice", winner.getSupplyPrice());
                priceInfo.put("participationVat", winner.getVat());
                priceInfo.put("participationTotalAmount", winner.getTotalAmount());
            }
        }
        
        // 계약 정보
        List<SimplifiedContract> contracts = contractRepository.findByBiddingId(biddingId);
        if (!contracts.isEmpty()) {
            SimplifiedContract contract = contracts.get(0);
            priceInfo.put("contractUnitPrice", contract.getUnitPrice());
            priceInfo.put("contractSupplyPrice", contract.getSupplyPrice());
            priceInfo.put("contractVat", contract.getVat());
            priceInfo.put("contractTotalAmount", contract.getTotalAmount());
        }
        
        return priceInfo;
    }
}