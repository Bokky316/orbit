package com.orbit.service.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.entity.Member;
import com.orbit.entity.supplier.SupplierRegistration;
import com.orbit.repository.MemberRepository;
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
        supplier.setCompanyName("ABC Company"); // ✅ 회사명 추가
        supplier.setName("홍길동"); // ✅ 이름 추가 (NULL 방지)
        supplier.setPassword("securepassword123"); // ✅ 비밀번호 추가 (NULL 방지)
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
                "전자기기",
                mockFile
        );

        // Then
        assertNotNull(registration);
        assertEquals(SupplierStatus.PENDING, registration.getStatus());
    }
}
