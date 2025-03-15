package com.orbit.repository.supplier;

import com.orbit.entity.supplier.SupplierAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierAttachmentRepository extends JpaRepository<SupplierAttachment, Long> {

}
