package com.orbit.repository.supplier;

import com.orbit.entity.supplier.SupplierRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRegistrationRepository extends JpaRepository<SupplierRegistration, Long> {
    List<SupplierRegistration> findByStatusChildCode(String childCode);

    Optional<SupplierRegistration> findByBusinessNo(String businessNo);
}
