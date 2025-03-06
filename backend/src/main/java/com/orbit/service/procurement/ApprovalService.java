package com.orbit.service.procurement;

import com.orbit.dto.procurement.ApprovalDTO;
import com.orbit.dto.procurement.ApprovalResponseDTO;
import com.orbit.entity.Member;
import com.orbit.entity.procurement.Approval;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.exception.ProjectNotFoundException;
import com.orbit.repository.MemberRepository;
import com.orbit.repository.procurement.ApprovalRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 결재 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@Transactional
public class ApprovalService {

    private static final Logger logger = LoggerFactory.getLogger(ApprovalService.class);

    private final ApprovalRepository approvalRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final MemberRepository memberRepository;

    /**
     * 생성자를 통한 의존성 주입
     * @param approvalRepository 결재 리포지토리
     * @param purchaseRequestRepository 구매 요청 리포지토리
     * @param memberRepository 멤버 리포지토리
     */
    public ApprovalService(ApprovalRepository approvalRepository,
                           PurchaseRequestRepository purchaseRequestRepository,
                           MemberRepository memberRepository) {
        this.approvalRepository = approvalRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.memberRepository = memberRepository;
    }

    /**
     * 모든 결재 정보를 조회합니다.
     * @return 결재 정보 목록
     */
    @Transactional(readOnly = true)
    public List<ApprovalResponseDTO> getAllApprovals() {
        List<Approval> approvals = approvalRepository.findAll();
        return approvals.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 결재 ID로 결재 정보를 조회합니다.
     * @param id 결재 ID
     * @return 조회된 결재 정보 (Optional)
     */
    @Transactional(readOnly = true)
    public Optional<ApprovalResponseDTO> getApprovalById(Long id) {
        logger.info("Retrieving approval by id: {}", id);
        return approvalRepository.findById(id)
                .map(this::convertToDto);
    }

    /**
     * 새로운 결재 정보를 생성합니다.
     * @param approvalDTO 생성할 결재 정보
     * @return 생성된 결재 정보
     */
    public ApprovalResponseDTO createApproval(ApprovalDTO approvalDTO) {
        Approval approval = convertToEntity(approvalDTO);
        logger.info("Creating a new approval: {}", approval);
        Approval savedApproval = approvalRepository.save(approval);
        return convertToDto(savedApproval);
    }

    /**
     * 결재 정보를 업데이트합니다.
     * @param id 업데이트할 결재 ID
     * @param approvalDTO 업데이트할 결재 정보
     * @return 업데이트된 결재 정보
     * @throws ProjectNotFoundException 결재를 찾을 수 없을 경우
     */
    public ApprovalResponseDTO updateApproval(Long id, ApprovalDTO approvalDTO) {
        logger.info("Updating approval with id: {}, details: {}", id, approvalDTO);
        Approval approval = approvalRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("Approval not found with id: " + id));

        // TODO: Approval 업데이트 로직 구현

        Approval updatedApproval = approvalRepository.save(approval);
        return convertToDto(updatedApproval);
    }

    /**
     * ApprovalDTO를 Approval 엔티티로 변환합니다.
     * @param approvalDTO 변환할 ApprovalDTO
     * @return 변환된 Approval 엔티티
     */
    private Approval convertToEntity(ApprovalDTO approvalDTO) {
        Approval approval = new Approval();

        PurchaseRequest purchaseRequest = purchaseRequestRepository.findById(approvalDTO.getPurchaseRequestId())
                .orElseThrow(() -> new ProjectNotFoundException("Purchase request not found with id: " + approvalDTO.getPurchaseRequestId()));
        approval.setPurchaseRequest(purchaseRequest);

        Member approver = memberRepository.findById(approvalDTO.getApproverId())
                .orElseThrow(() -> new ProjectNotFoundException("Approver not found with id: " + approvalDTO.getApproverId()));
        approval.setApprover(approver);

        // TODO: Approval 속성 설정

        return approval;
    }

    /**
     * Approval 엔티티를 ApprovalResponseDTO로 변환합니다.
     * @param approval 변환할 Approval 엔티티
     * @return 변환된 ApprovalResponseDTO
     */
    private ApprovalResponseDTO convertToDto(Approval approval) {
        ApprovalResponseDTO approvalResponseDTO = new ApprovalResponseDTO();
        approvalResponseDTO.setId(approval.getId());
        approvalResponseDTO.setPurchaseRequestId(approval.getPurchaseRequest().getId());
        approvalResponseDTO.setApproverId(approval.getApprover().getId());
        approvalResponseDTO.setApprovalDate(approval.getApprovalDate());
        approvalResponseDTO.setStatus(approval.getStatus().toString());
        approvalResponseDTO.setComments(approval.getComments());
        return approvalResponseDTO;
    }
}
