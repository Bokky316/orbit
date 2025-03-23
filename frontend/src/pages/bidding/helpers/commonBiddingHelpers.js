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
  console.log("백엔드에서 받은 원본 데이터:", biddingData); // 디버깅용

  let suppliers = [];

  // suppliers 필드 처리 - 백엔드 응답 구조에 맞게 수정
  if (biddingData.suppliers && Array.isArray(biddingData.suppliers)) {
    suppliers = biddingData.suppliers.map((s) => ({
      id: s.supplierId || (s.supplier && s.supplier.id),
      name:
        s.supplierName ||
        s.companyName ||
        (s.supplier && s.supplier.companyName),
      companyName:
        s.supplierName ||
        s.companyName ||
        (s.supplier && s.supplier.companyName)
    }));
  }

  return {
    purchaseRequestCode: biddingData.purchaseRequestId?.toString() || "",
    purchaseRequestItemId: biddingData.purchaseRequestItemId?.toString() || "",
    purchaseRequestName: biddingData.title || "",
    suppliers: suppliers,
    description: biddingData.description || "",
    itemQuantity: biddingData.quantity || 0,
    unitPrice: biddingData.unitPrice || 0,
    supplyPrice: biddingData.supplyPrice || 0,
    vat: biddingData.vat || 0,
    totalAmount: biddingData.totalAmount || 0,
    biddingConditions: biddingData.conditions || "",
    deadline: biddingData.endDate
      ? new Date(biddingData.endDate).toISOString().split("T")[0]
      : "",
    bidMethod: biddingData.bidMethod || BiddingMethod.FIXED_PRICE,
    status: biddingData.status || {
      parentCode: "BIDDING",
      childCode: BiddingStatus.PENDING
    },
    internalNote: biddingData.internalNote || ""
  };
};
