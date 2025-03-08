package com.orbit.service.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.entity.member.Member;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.supplier.SupplierRegistrationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

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

    @Test
    void 협력업체_등록_성공() {
        // Given
        Member supplier = new Member();
        supplier.setUsername("supplier1");
        supplier.setEmail("supplier@example.com");
        supplier.setCompanyName("ABC Company");
        supplier.setName("홍길동");
        supplier.setPassword("1234");
        supplier.setRole(Member.Role.SUPPLIER);
        memberRepository.save(supplier);

        MockMultipartFile mockFile = new MockMultipartFile(
                "businessFile",
                "file.pdf",
                "application/pdf",
                "dummy data".getBytes()
        );

        // When
        SupplierRegistration registration = supplierRegistrationService.registerSupplier(
                supplier.getId(),
                "123-45-67890",
                "홍길동", // 대표자명
                "전자기기 판매", // 업태
                "전자기기", // 업종
                "전자제품", // 소싱대분류
                "스마트폰", // 소싱중분류
                "02-1234-5678", // 전화번호
                "서울시 강남구 테헤란로 123", // 본사 주소
                "추가 의견 없음", // 의견
                mockFile // 사업자등록증 파일
        );

        // Then
        assertNotNull(registration);
        assertEquals(SupplierStatus.PENDING, registration.getStatus());
        assertEquals("ABC Company", registration.getSupplier().getCompanyName());
        assertEquals("홍길동", registration.getCeoName());
        assertEquals("전자기기 판매", registration.getBusinessType());
        assertEquals("전자기기", registration.getBusinessCategory());
        assertEquals("전자제품", registration.getSourcingCategory());
        assertEquals("스마트폰", registration.getSourcingSubCategory());
        assertEquals("02-1234-5678", registration.getPhoneNumber());
        assertEquals("서울시 강남구 테헤란로 123", registration.getHeadOfficeAddress());
        assertEquals("추가 의견 없음", registration.getComments());
    }
}
