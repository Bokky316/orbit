/*
package com.orbit.service.supplier;

import com.orbit.dto.supplier.SupplierRegistrationDto;
import com.orbit.entity.member.Member;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;
import com.orbit.service.FileService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
@ExtendWith(MockitoExtension.class)
public class SupplierRegistrationServiceTest {
    @Autowired
    private SupplierRegistrationService supplierRegistrationService;

    @Autowired
    private SupplierRegistrationRepository supplierRegistrationRepository;

    @Autowired
    private MemberRepository memberRepository;

    @MockBean
    private FileService fileService;

    @Test
    void 협력업체_등록_성공() throws IOException {
        // Given
        // 테스트용 회원 저장
        Member supplier = new Member();
        supplier.setUsername("supplier1");
        supplier.setEmail("supplier@example.com");
        supplier.setCompanyName("ABC Company");
        supplier.setName("홍길동");
        supplier.setPassword("1234");
        supplier.setRole(Member.Role.SUPPLIER);
        memberRepository.save(supplier);

        // 테스트용 파일 생성
        MockMultipartFile mockFile = new MockMultipartFile(
                "businessFile",
                "file.pdf",
                "application/pdf",
                "dummy data".getBytes()
        );

        // 파일 저장 mock 처리
        when(fileService.saveFile(any(MultipartFile.class), anyString()))
                .thenReturn("business-licenses/test-file.pdf");

        // DTO 객체 생성
        SupplierRegistrationDto dto = SupplierRegistrationDto.builder()
                .businessNo("123-45-67890")
                .ceoName("홍길동")
                .businessType("전자기기 판매")
                .businessCategory("전자기기")
                .sourcingCategory("전자제품")
                .sourcingSubCategory("스마트폰")
                .phoneNumber("02-1234-5678")
                .headOfficeAddress("서울시 강남구 테헤란로 123")
                .comments("추가 의견 없음")
                .businessFileImage(mockFile)
                .build();

        // When
        SupplierRegistrationDto resultDto = supplierRegistrationService.register(dto, supplier.getId());

        // Then
        assertNotNull(resultDto);
        assertEquals(supplier.getId(), resultDto.getSupplierId());
        assertEquals("ABC Company", supplier.getCompanyName());
        assertEquals("홍길동", resultDto.getCeoName());
        assertEquals("전자기기 판매", resultDto.getBusinessType());
        assertEquals("전자기기", resultDto.getBusinessCategory());
        assertEquals("전자제품", resultDto.getSourceingCategory());
        assertEquals("스마트폰", resultDto.getSourceingSubCategory());
        assertEquals("02-1234-5678", resultDto.getPhoneNumber());
        assertEquals("서울시 강남구 테헤란로 123", resultDto.getHeadOfficeAddress());
        assertEquals("추가 의견 없음", resultDto.getComments());
        assertEquals("대기중", resultDto.getStatus());

        // DB에 저장된 내용 확인
        SupplierRegistration savedRegistration = supplierRegistrationRepository.findByBusinessNo("123-45-67890")
                .orElse(null);
        assertNotNull(savedRegistration);
        assertEquals(SupplierRegistration.RegistrationStatus.대기중, savedRegistration.getStatus());
    }

    @Test
    void 협력업체_승인_성공() throws IOException {
        // Given
        // 테스트용 회원 저장
        Member supplier = new Member();
        supplier.setUsername("supplier1");
        supplier.setEmail("supplier@example.com");
        supplier.setCompanyName("ABC Company");
        supplier.setName("홍길동");
        supplier.setPassword("1234");
        supplier.setRole(Member.Role.SUPPLIER);
        memberRepository.save(supplier);

        // 등록 데이터 생성
        SupplierRegistration registration = SupplierRegistration.builder()
                .supplier(supplier)
                .businessNo("123-45-67890")
                .ceoName("홍길동")
                .businessType("전자기기 판매")
                .businessCategory("전자기기")
                .sourcingCategory("전자제품")
                .sourcingSubCategory("스마트폰")
                .phoneNumber("02-1234-5678")
                .headOfficeAddress("서울시 강남구 테헤란로 123")
                .comments("추가 의견 없음")
                .businessFile("business-licenses/test-file.pdf")
                .build();

        // 생성 시 자동으로 대기중 상태로 설정됨
        supplierRegistrationRepository.save(registration);

        // When
        SupplierRegistrationDto approvedDto = supplierRegistrationService.approve(registration.getId());

        // Then
        assertEquals("승인", approvedDto.getStatus());

        // DB에서 확인
        SupplierRegistration updatedRegistration = supplierRegistrationRepository.findById(registration.getId())
                .orElse(null);
        assertNotNull(updatedRegistration);
        assertEquals(SupplierRegistration.RegistrationStatus.승인, updatedRegistration.getStatus());
    }

    @Test
    void 협력업체_거절_성공() throws IOException {
        // Given
        // 테스트용 회원 저장
        Member supplier = new Member();
        supplier.setUsername("supplier1");
        supplier.setEmail("supplier@example.com");
        supplier.setCompanyName("ABC Company");
        supplier.setName("홍길동");
        supplier.setPassword("1234");
        supplier.setRole(Member.Role.SUPPLIER);
        memberRepository.save(supplier);

        // 등록 데이터 생성
        SupplierRegistration registration = SupplierRegistration.builder()
                .supplier(supplier)
                .businessNo("123-45-67890")
                .ceoName("홍길동")
                .businessType("전자기기 판매")
                .businessCategory("전자기기")
                .sourcingCategory("전자제품")
                .sourcingSubCategory("스마트폰")
                .phoneNumber("02-1234-5678")
                .headOfficeAddress("서울시 강남구 테헤란로 123")
                .comments("추가 의견 없음")
                .businessFile("business-licenses/test-file.pdf")
                .build();

        // 생성 시 자동으로 대기중 상태로 설정됨
        supplierRegistrationRepository.save(registration);

        String rejectionReason = "서류 미비";

        // When
        SupplierRegistrationDto rejectedDto = supplierRegistrationService.reject(registration.getId(), rejectionReason);

        // Then
        assertEquals("거절", rejectedDto.getStatus());
        assertEquals(rejectionReason, rejectedDto.getRejectionReason());

        // DB에서 확인
        SupplierRegistration updatedRegistration = supplierRegistrationRepository.findById(registration.getId())
                .orElse(null);
        assertNotNull(updatedRegistration);
        assertEquals(SupplierRegistration.RegistrationStatus.거절, updatedRegistration.getStatus());
        assertEquals(rejectionReason, updatedRegistration.getRejectionReason());
    }
}*/
