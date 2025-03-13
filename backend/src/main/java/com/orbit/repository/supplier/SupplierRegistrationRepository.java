package com.orbit.repository.supplier;

import com.orbit.entity.member.Member;
import com.orbit.entity.supplier.SupplierRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRegistrationRepository extends JpaRepository<SupplierRegistration, Long> {
    List<SupplierRegistration> findByStatusChildCode(String childCode);

    // 특정 공급자(Member)에 해당하는 등록 정보 조회
    List<SupplierRegistration> findBySupplier(Member supplier);

    // 특정 공급자(Member)와 상태에 해당하는 등록 정보 조회
    List<SupplierRegistration> findBySupplierAndStatusChildCode(Member supplier, String childCode);

    Optional<SupplierRegistration> findByBusinessNo(String businessNo);
}