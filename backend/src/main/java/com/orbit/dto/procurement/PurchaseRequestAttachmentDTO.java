package com.orbit.dto.procurement;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class PurchaseRequestAttachmentDTO {
    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
}
