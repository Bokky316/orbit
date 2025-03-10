package com.orbit.dto.procurement;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PurchaseRequestAttachmentDTO {
    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
}
