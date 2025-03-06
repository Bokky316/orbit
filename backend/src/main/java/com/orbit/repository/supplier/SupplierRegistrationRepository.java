package com.orbit.repository.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.entity.supplier.SupplierRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRegistrationRepository extends JpaRepository<SupplierRegistration, Long> {
    List<SupplierRegistration> findByStatus(SupplierStatus status);

    Optional<SupplierRegistration> findByBusinessNo(String businessNo);
}
