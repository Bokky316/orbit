import { BiddingStatus, BiddingMethod } from "./biddingTypes";

export const getStatusText = (status) => {
  const statusMap = {
    [BiddingStatus.PENDING]: "대기중",
    [BiddingStatus.ONGOING]: "진행중",
    [BiddingStatus.CLOSED]: "마감",
    [BiddingStatus.CANCELED]: "취소"
  };

  return status?.childCode ? statusMap[status.childCode] : "대기중";
};

export const getBidMethodText = (method) => {
  const methodMap = {
    [BiddingMethod.FIXED_PRICE]: "정가제안",
    [BiddingMethod.OPEN_PRICE]: "가격제안"
  };

  return methodMap[method] || "정가제안";
};

export const transformFormDataToApiFormat = (formData, user) => {
  const now = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 7);

  const supplierDescription = Array.isArray(formData.suppliers)
    ? formData.suppliers.map((s) => s.companyName || s.name || "").join(", ")
    : "";

  return {
    purchaseRequestId: formData.purchaseRequestCode
      ? Number(formData.purchaseRequestCode)
      : null,
    purchaseRequestItemId: formData.purchaseRequestItemId
      ? Number(formData.purchaseRequestItemId)
      : null,
    title: formData.purchaseRequestName || "",
    description: supplierDescription || formData.description || "",
    bidMethod: formData.bidMethod || BiddingMethod.FIXED_PRICE,
    status: formData.status?.childCode || BiddingStatus.PENDING,
    startDate: formData.startDate || now.toISOString(),
    endDate: formData.deadline
      ? new Date(formData.deadline + "T23:59:59").toISOString()
      : defaultEndDate.toISOString(),
    conditions: formData.biddingConditions || formData.conditions || "",
    internalNote: formData.internalNote || "",
    quantity: Number(formData.itemQuantity) || 1,
    unitPrice: Number(formData.unitPrice) || 0,
    supplyPrice: Number(formData.supplyPrice) || 0,
    vat: Number(formData.vat) || 0,
    totalAmount: Number(formData.totalAmount) || 0,
    supplierIds: Array.isArray(formData.suppliers)
      ? formData.suppliers.map((s) => Number(s.id))
      : [],
    attachments: formData.files
      ? formData.files.map((file) => ({
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size
        }))
      : []
  };
};

export const mapBiddingDataToFormData = (biddingData) => {
  let suppliers =
    biddingData.suppliers?.map((s) => ({ id: s.supplierId })) || [];

  if (biddingData.description && suppliers.length > 0) {
    const companyNames = biddingData.description
      .split(",")
      .map((name) => name.trim());

    companyNames.forEach((name, index) => {
      if (index < suppliers.length) {
        suppliers[index].companyName = name;
        suppliers[index].name = name;
      }
    });
  }

  return {
    purchaseRequestCode: biddingData.id?.toString() || "",
    purchaseRequestName: biddingData.title || "",
    suppliers: suppliers,
    itemQuantity: biddingData.quantity || 0,
    unitPrice: biddingData.unitPrice || 0,
    supplyPrice: biddingData.supplyPrice || 0,
    vat: biddingData.vat || 0,
    biddingConditions: biddingData.conditions || "",
    deadline: biddingData.endDate
      ? new Date(biddingData.endDate).toISOString().split("T")[0]
      : "",
    bidMethod: biddingData.bidMethod || BiddingMethod.FIXED_PRICE,
    status: biddingData.status || {
      parentCode: "BIDDING",
      childCode: BiddingStatus.PENDING
    }
  };
};
