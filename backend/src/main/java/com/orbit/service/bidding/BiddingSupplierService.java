package com.orbit.service.bidding;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.bidding.BiddingSupplierDto;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingSupplier;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.bidding.BiddingSupplierRepository;
import com.orbit.repository.member.MemberRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingSupplierService {
    private final BiddingSupplierRepository supplierRepository;
    private final BiddingRepository biddingRepository;
    private final MemberRepository memberRepository;
    private final NotificationRepository notificationRepository;

    /**
     * 초대된 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getAllSuppliers() {
        List<BiddingSupplier> suppliers = supplierRepository.findAll();
        return suppliers.stream()
                .map(BiddingSupplierDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 입찰 공고에 초대된 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getSuppliersByBiddingId(Long biddingId) {
        List<BiddingSupplier> suppliers = supplierRepository.findByBiddingId(biddingId);
        return suppliers.stream()
                .map(BiddingSupplierDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getSuppliersBySupplierId(Long supplierId) {
        List<BiddingSupplier> suppliers = supplierRepository.findBySupplierId(supplierId);
        return suppliers.stream()
                .map(BiddingSupplierDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 입찰 공고에 공급사 초대
     */
    @Transactional
    public BiddingSupplierDto inviteSupplier(Long biddingId, Long supplierId) {
        // 입찰 공고 조회
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        // 이미 초대된 공급사인지 확인
        if (supplierRepository.existsByBiddingIdAndSupplierId(biddingId, supplierId)) {
            throw new IllegalStateException("이미 초대된 공급사입니다.");
        }
        
        // 공급사 초대
        BiddingSupplier supplier = bidding.inviteSupplier(supplierId, memberRepository, notificationRepository);
        supplier = supplierRepository.save(supplier);
        
        return BiddingSupplierDto.fromEntity(supplier);
    }
    
    /**
     * 초대 응답 - 참여
     */
    @Transactional
    public BiddingSupplierDto respondWithParticipation(Long biddingId, Long supplierId) {
        BiddingSupplier supplier = getSupplierByBiddingIdAndSupplierId(biddingId, supplierId);
        
        supplier.participate(notificationRepository, memberRepository);
        supplier = supplierRepository.save(supplier);
        
        return BiddingSupplierDto.fromEntity(supplier);
    }
    
    /**
     * 초대 응답 - 거부
     */
    @Transactional
    public BiddingSupplierDto respondWithRejection(Long biddingId, Long supplierId, String reason) {
        BiddingSupplier supplier = getSupplierByBiddingIdAndSupplierId(biddingId, supplierId);
        
        supplier.reject(reason, notificationRepository, memberRepository);
        supplier = supplierRepository.save(supplier);
        
        return BiddingSupplierDto.fromEntity(supplier);
    }
    
    /**
     * 알림 발송되지 않은 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getNonNotifiedSuppliers(Long biddingId) {
        List<BiddingSupplier> suppliers = supplierRepository.findNonNotifiedSuppliers(biddingId);
        return suppliers.stream()
                .map(BiddingSupplierDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 참여 의사를 밝힌 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getParticipatingSuppliers(Long biddingId) {
        List<BiddingSupplier> suppliers = supplierRepository.findParticipatingSuppliers(biddingId);
        return suppliers.stream()
                .map(BiddingSupplierDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 참여를 거부한 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getRejectedSuppliers(Long biddingId) {
        List<BiddingSupplier> suppliers = supplierRepository.findRejectedSuppliers(biddingId);
        return suppliers.stream()
                .map(BiddingSupplierDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 응답하지 않은 공급사 목록 조회
     */
    @Transactional(readOnly = true)
    public List<BiddingSupplierDto> getNonRespondedSuppliers(Long biddingId) {
        List<BiddingSupplier> suppliers = supplierRepository.findNonRespondedSuppliers(biddingId);
        return suppliers.stream()
                .map(BiddingSupplierDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * 공급사 이름 업데이트
     */
    @Transactional
    public BiddingSupplierDto updateSupplierName(Long supplierId) {
        List<BiddingSupplier> suppliers = supplierRepository.findBySupplierId(supplierId);
        
        if (suppliers.isEmpty()) {
            throw new EntityNotFoundException("해당 공급사의 초대 정보가 없습니다. ID: " + supplierId);
        }
        
        for (BiddingSupplier supplier : suppliers) {
            supplier.updateSupplierName(memberRepository);
        }
        
        List<BiddingSupplier> updatedSuppliers = supplierRepository.saveAll(suppliers);
        
        return BiddingSupplierDto.fromEntity(updatedSuppliers.get(0));
    }
    
    /**
     * 알림 재전송
     */
    @Transactional
    public BiddingSupplierDto resendNotification(Long biddingId, Long supplierId) {
        BiddingSupplier supplier = getSupplierByBiddingIdAndSupplierId(biddingId, supplierId);
        
        Bidding bidding = biddingRepository.findById(biddingId)
                .orElseThrow(() -> new EntityNotFoundException("입찰 공고를 찾을 수 없습니다. ID: " + biddingId));
        
        supplier.sendNotification(
            notificationRepository, 
            memberRepository, 
            "입찰 공고 초대 알림",
            "입찰 공고 '" + bidding.getTitle() + "'에 참여 요청이 왔습니다. 확인해주세요."
        );
        
        supplier = supplierRepository.save(supplier);
        
        return BiddingSupplierDto.fromEntity(supplier);
    }
    
    /**
     * 특정 입찰 공고와 공급사로 초대 정보 조회
     */
    private BiddingSupplier getSupplierByBiddingIdAndSupplierId(Long biddingId, Long supplierId) {
        return supplierRepository.findByBiddingIdAndSupplierId(biddingId, supplierId)
                .orElseThrow(() -> new EntityNotFoundException("초대 정보를 찾을 수 없습니다."));
    }
}