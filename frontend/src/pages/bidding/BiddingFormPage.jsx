import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  CircularProgress,
  Alert,
  IconButton
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

// 헬퍼 함수 import
import {
  BiddingStatus,
  BiddingMethod,
  BillingUnits
} from "./helpers/biddingTypes";
import {
  INITIAL_FORM_DATA,
  transformFormDataToApiFormat,
  mapBiddingDataToFormData
} from "./helpers/commonBiddingHelpers";
import { validateBiddingForm } from "./helpers/BuyerBiddingHelpers";
import { usePermission } from "./helpers/permissionUtils";

// Dialog 컴포넌트 import
import SupplierSelectionDialog from "./biddingComponent/SupplierSelectionDialog";
import PurchaseRequestSelectionDialog from "./biddingComponent/PurchaseRequestSelectionDialog";

/**
 * 입찰 공고 등록/수정 페이지 컴포넌트
 */
function BiddingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = id ? "edit" : "create";
  const biddingId = id ? parseInt(id) : null;

  // Redux에서 인증 상태 가져오기
  const { user } = useSelector((state) => state.auth);

  // 권한 훅 사용
  const permissions = usePermission(user);

  // 상태 관리
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [originalBidMethod, setOriginalBidMethod] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // 모달 상태
  const [isPurchaseRequestModalOpen, setIsPurchaseRequestModalOpen] =
    useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // 현재 선택된 구매 요청 객체 가져오기
  const selectedPurchaseRequest = useMemo(() => {
    if (!formData.requestNumber) return null;
    return purchaseRequests.find(
      (req) => req.id === Number(formData.requestNumber)
    );
  }, [formData.requestNumber, purchaseRequests]);

  // 페이지 로드 시 권한 체크
  useEffect(() => {
    const checkPermission = () => {
      if (!user) {
        setHasPermission(false);
        return;
      }

      if (mode === "create") {
        setHasPermission(permissions.canCreateBidding);
      } else if (mode === "edit" && formData.status) {
        setHasPermission(permissions.canUpdateBidding(formData));
      }
    };

    checkPermission();
  }, [mode, user, formData.status, permissions]);

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // 동시에 여러 데이터 요청 처리
        await Promise.all([
          fetchSuppliers(),
          fetchPurchaseRequests(),
          mode === "edit" ? fetchBiddingData(biddingId) : Promise.resolve()
        ]);
      } catch (error) {
        console.error("초기 데이터 로딩 중 오류:", error);
        setRequestError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [mode, biddingId]);

  // 공급업체 목록 가져오기
  const fetchSuppliers = async () => {
    try {
      console.log("공급업체 목록 API 호출 시작");
      const response = await fetchWithAuth(
        `${API_URL}biddings/suppliers/active`
      );

      if (!response.ok) {
        throw new Error("공급사 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      console.log("공급업체 API 응답 데이터:", data);

      // 공급업체 데이터 정규화
      const normalizedSuppliers = data.map((supplier) => ({
        id: supplier.id,
        name: supplier.name || supplier.companyName,
        businessNo: supplier.businessNo || supplier.businessNumber,
        businessType: supplier.businessType,
        businessCategory: supplier.businessCategory,
        sourcingCategory: supplier.sourcingCategory,
        sourcingSubCategory: supplier.sourcingSubCategory,
        contact: supplier.phoneNumber || supplier.contactPhone,
        email: supplier.contactEmail || supplier.email
      }));

      setSuppliers(normalizedSuppliers);
    } catch (error) {
      console.error("공급사 목록 가져오기 실패:", error);
      throw error;
    }
  };

  // 구매 요청 목록 가져오기
  const fetchPurchaseRequests = async () => {
    try {
      console.log("구매 요청 목록 API 호출 시작");
      const response = await fetchWithAuth(
        `${API_URL}biddings/purchase-requests/active`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "구매 요청 목록을 가져오는데 실패했습니다."
        );
      }

      const data = await response.json();
      setPurchaseRequests(data || []);
    } catch (error) {
      console.error("구매 요청 목록 가져오기 실패:", error);
      throw error;
    }
  };

  // 입찰 공고 상세 정보 가져오기 (수정 모드)
  const fetchBiddingData = async (id) => {
    try {
      console.log("입찰 공고 상세 정보 API 호출 시작");
      const response = await fetchWithAuth(`${API_URL}biddings/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const biddingData = await response.json();
      console.log("서버에서 받은 데이터:", biddingData);

      // 필드명 매핑 - 기존 코드 유지
      if (biddingData.purchaseRequest) {
        biddingData.purchaseRequest.request_number =
          biddingData.purchaseRequest.requestNumber ||
          biddingData.purchaseRequest.id;
      }

      if (biddingData.purchaseRequestItem) {
        biddingData.purchaseRequestItem.purchase_request_item_id =
          biddingData.purchaseRequestItem.id;
        biddingData.purchaseRequestItem.delivery_location =
          biddingData.purchaseRequestItem.deliveryLocation;
        biddingData.purchaseRequestItem.delivery_request_date =
          biddingData.purchaseRequestItem.deliveryRequestDate;
      }

      // 데이터 변환
      const mappedFormData = mapBiddingDataToFormData(biddingData);

      // 입찰 조건 필드 매핑
      if (biddingData.conditions && !mappedFormData.biddingConditions) {
        mappedFormData.biddingConditions = biddingData.conditions;
      }

      // 납품 관련 정보 매핑
      if (biddingData.deliveryLocation) {
        mappedFormData.deliveryLocation = biddingData.deliveryLocation;
      }

      if (biddingData.deliveryDate) {
        mappedFormData.deliveryDate = biddingData.deliveryDate;
      }

      // 공급자 정보 처리
      if (biddingData.suppliers && Array.isArray(biddingData.suppliers)) {
        mappedFormData.suppliers = biddingData.suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name || supplier.companyName,
          businessNo: supplier.businessNo || supplier.businessNumber,
          businessType: supplier.businessType,
          businessCategory: supplier.businessCategory,
          sourcingCategory: supplier.sourcingCategory,
          sourcingSubCategory: supplier.sourcingSubCategory,
          contact: supplier.phoneNumber || supplier.contactPhone,
          email: supplier.contactEmail || supplier.email
        }));
      } else if (
        biddingData.invitedSuppliers &&
        Array.isArray(biddingData.invitedSuppliers)
      ) {
        // invitedSuppliers 필드에 정보가 있는 경우
        mappedFormData.suppliers = biddingData.invitedSuppliers.map(
          (supplier) => ({
            id: supplier.id,
            name: supplier.name || supplier.companyName,
            businessNo: supplier.businessNo || supplier.businessNumber,
            businessType: supplier.businessType,
            businessCategory: supplier.businessCategory,
            sourcingCategory: supplier.sourcingCategory,
            sourcingSubCategory: supplier.sourcingSubCategory,
            contact: supplier.phoneNumber || supplier.contactPhone,
            email: supplier.contactEmail || supplier.email
          })
        );
      }

      console.log("매핑된 데이터:", mappedFormData);

      setFormData(mappedFormData);
      setOriginalBidMethod(mappedFormData.bidMethod);

      // 첨부 파일 정보 처리
      if (biddingData.filePath) {
        setFileList([{ name: biddingData.filePath }]);
      } else if (
        biddingData.attachments &&
        Array.isArray(biddingData.attachments)
      ) {
        setFileList(
          biddingData.attachments.map((attachment) => ({
            name: attachment.fileName || attachment.originalFileName,
            path: attachment.filePath
          }))
        );
      }

      // 선택된 요청 저장
      if (biddingData.purchaseRequest) {
        setSelectedRequest(biddingData.purchaseRequest);
      }
    } catch (error) {
      console.error("입찰 공고 데이터 로딩 중 오류:", error);
      throw error;
    }
  };

  // 필드 수정 가능 여부 결정 함수
  const isFieldEditable = (fieldName) => {
    // 수정 모드가 아니면 모든 필드 활성화
    if (mode !== "edit") return true;

    // 수정 가능한 필드 목록
    const editableFields = [
      "title",
      "startDate",
      "endDate",
      "biddingConditions",
      "conditions",
      "internalNote"
    ];

    return editableFields.includes(fieldName);
  };

  // 공급자 선택 수정 가능 여부
  const canEditSuppliers =
    mode !== "edit" ||
    (mode === "edit" && formData.status === BiddingStatus.PENDING);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      switch (name) {
        case "status":
          return {
            ...prev,
            status: value
          };
        case "bidMethod":
          return {
            ...prev,
            bidMethod: value,
            ...(value === BiddingMethod.OPEN_PRICE && {
              itemQuantity: 0,
              unitPrice: 0
            })
          };
        case "biddingConditions":
          return {
            ...prev,
            biddingConditions: value,
            conditions: value
          };
        default:
          return {
            ...prev,
            [name]: type === "checkbox" ? checked : value
          };
      }
    });

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (fieldName, newDate) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: newDate ? moment(newDate).format("YYYY-MM-DD") : ""
    }));
  };

  // 숫자 필드 변경 핸들러
  const handleNumberChange = (name, value) => {
    const safeValue = Math.max(0, Number(value) || 0);

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: safeValue
      };

      if (name === "quantity" || name === "unitPrice") {
        const quantity = name === "quantity" ? safeValue : prev.quantity;
        const unitPrice = name === "unitPrice" ? safeValue : prev.unitPrice;
        const supplyPrice = quantity * unitPrice;
        const vat = Math.round(supplyPrice * 0.1);
        const totalAmount = supplyPrice + vat;

        return {
          ...updated,
          supplyPrice,
          vat,
          totalAmount
        };
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 구매 요청 및 품목 선택 완료 핸들러
  const handlePurchaseRequestComplete = (request, itemId, item) => {
    if (!request || !item) return;

    const quantity = Number(item.quantity) || 1;
    const unitPrice = parseFloat(item.unitPrice || 0);
    const supplyPrice = quantity * unitPrice;
    const vat = Math.round(supplyPrice * 0.1);
    const totalAmount = supplyPrice + vat;

    setFormData((prev) => ({
      ...prev,
      requestNumber: request.request_number || request.id,
      requestName: request.title || request.requestName,
      purchaseRequestId: request.id,
      purchaseRequestItems: [item],
      selectedItems: [itemId],
      purchaseRequestItemId: itemId,
      quantity,
      unitPrice,
      supplyPrice,
      vat,
      totalAmount,
      deliveryLocation: item.deliveryLocation || "",
      deliveryDate: item.deliveryRequestDate || "",
      deadline: request.deadline || "",
      status: "PENDING"
    }));
    setSelectedRequest(request);
    setIsPurchaseRequestModalOpen(false);
  };

  // 공급자 선택 핸들러
  const handleSupplierSelect = (supplier) => {
    setFormData((prev) => {
      const exists = prev.suppliers.some((s) => s.id === supplier.id);
      const updated = exists
        ? prev.suppliers.filter((s) => s.id !== supplier.id)
        : [...prev.suppliers, supplier];
      return { ...prev, suppliers: updated };
    });
  };

  // 공급자 선택 완료 핸들러
  const handleSupplierSelectionComplete = () => {
    setIsSupplierModalOpen(false);
  };

  // 파일 변경 핸들러
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      const isValidType = [
        "image/jpeg",
        "image/png",
        "application/pdf",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ].includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024;
      if (!isValidType) alert(`지원되지 않는 파일 형식: ${file.name}`);
      if (!isValidSize)
        alert(`파일 크기가 너무 큽니다 (최대 50MB): ${file.name}`);
      return isValidType && isValidSize;
    });

    setFileList((prev) => {
      const updated = [...prev, ...validFiles];
      setFormData((prevForm) => ({ ...prevForm, files: updated }));
      return updated;
    });
  };

  // 파일 다운로드 핸들러
  const handleFileDownload = async (filename) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/download-file?filename=${encodeURIComponent(
          filename
        )}`,
        {
          method: "GET"
        }
      );
      if (!response.ok) throw new Error("다운로드 실패");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("파일 다운로드 실패");
    }
  };

  // 파일 삭제 핸들러
  const handleFileDelete = (fileToDelete) => {
    setFileList((prev) => {
      const updated = prev.filter(
        (file) => file.name !== fileToDelete.name && file !== fileToDelete
      );
      setFormData((prevForm) => ({ ...prevForm, files: updated }));
      return updated;
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        status: formData.status?.childCode || formData.status,
        method: formData.bidMethod?.childCode || formData.bidMethod,
        supplierIds: formData.suppliers?.map((s) => s.id) || [],
        biddingPeriod: {
          startDate: formData.startDate,
          endDate: formData.endDate
        }
      };

      const apiUrl = `${API_URL}biddings${
        mode === "edit" ? `/${biddingId}` : ""
      }`;

      const res = await fetchWithAuth(apiUrl, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // ✅ 응답 확인

      const responseText = await res.text();

      if (!res.ok) {
        throw new Error(responseText || "입찰 요청 실패");
      }

      const result = JSON.parse(responseText); // 이미 JSON 형태일 경우 생략 가능

      // 파일 업로드가 필요한 경우 처리
      if (
        formData.files &&
        formData.files.length > 0 &&
        formData.files.some((f) => f instanceof File)
      ) {
        const fileFormData = new FormData();
        formData.files.forEach((file) => {
          if (file instanceof File) {
            fileFormData.append("files", file);
          }
        });

        try {
          const fileResponse = await fetchWithAuth(
            `${API_URL}biddings/${result.id}/attachments`,
            {
              method: "POST",
              credentials: "include",
              body: fileFormData
            }
          );

          if (fileResponse.ok) {
            console.log("첨부 파일 업로드 성공");
          } else {
            console.warn("첨부 파일 업로드 실패");
          }
        } catch (uploadError) {
          console.error("파일 업로드 중 오류:", uploadError);
        }
      }

      // 성공 메시지 표시 및 이동
      setSuccessMessage(
        `입찰 공고가 성공적으로 ${mode === "edit" ? "수정" : "등록"}되었습니다.`
      );
      setShowSuccess(true);
      setTimeout(() => navigate(`/biddings/${result.id}`), 1500);
    } catch (err) {
      console.error("handleSubmit 에러:", err);
      alert(err.message || "저장 실패");
    } finally {
      setSubmitting(false);
    }
  };

  // 수정 모드일 경우 데이터 가져오기
  useEffect(() => {
    const fetchBiddingData = async () => {
      if (mode === "edit" && biddingId) {
        try {
          setIsLoading(true);

          // API를 통해 입찰 공고 상세 정보 가져오기
          const response = await fetchWithAuth(
            `${API_URL}biddings/${biddingId}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const biddingData = await response.json();
          console.log("서버에서 받은 데이터:", biddingData);

          // biddingHelpers의 mapBiddingDataToFormData 함수 사용
          const mappedFormData = mapBiddingDataToFormData(biddingData);

          // 입찰 조건 필드 매핑 보장
          if (biddingData.conditions && !mappedFormData.biddingConditions) {
            mappedFormData.biddingConditions = biddingData.conditions;
          }

          console.log("매핑된 데이터:", mappedFormData);

          setFormData(mappedFormData);
          setOriginalBidMethod(mappedFormData.bidMethod);

          // 첨부 파일 정보 처리
          if (biddingData.filePath) {
            setFileList([{ name: biddingData.filePath }]);
          }

          // 수정 모드에서는 공급자 정보도 정확히 가져와야 함
          if (
            !mappedFormData.suppliers ||
            mappedFormData.suppliers.length === 0
          ) {
            // 공급자 정보가 없는 경우, description에서 추출 시도
            if (mappedFormData.description) {
              const companyName = mappedFormData.description
                .split(",")
                .map((name) => name.trim());
              // 가능하다면 이름으로 공급자 객체 찾기
              const foundSuppliers = suppliers.filter((s) =>
                companyName.includes(s.name)
              );

              if (foundSuppliers.length > 0) {
                mappedFormData.suppliers = foundSuppliers;
                setFormData((prev) => ({ ...prev, suppliers: foundSuppliers }));
              }
            }
          }
        } catch (error) {
          console.error("입찰 공고 데이터 로딩 중 오류:", error);
          setRequestError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSuppliers();
    fetchPurchaseRequests();
    fetchBiddingData();
  }, [mode, biddingId]);

  // 성공 응답 처리를 위한 헬퍼 함수
  const handleSuccessResponse = async (response) => {
    const result = await response.json();
    console.log(`입찰 공고 ${mode === "edit" ? "수정" : "등록"} 성공:`, result);

    // 파일 처리 (있는 경우)
    if (
      formData.files &&
      formData.files.length > 0 &&
      formData.files.some((f) => f instanceof File)
    ) {
      const fileFormData = new FormData();

      formData.files.forEach((file) => {
        if (file instanceof File) {
          fileFormData.append("files", file);
        }
      });

      try {
        const fileResponse = await fetch(
          `${API_URL}biddings/${result.id}/attachments`,
          {
            method: "POST",
            credentials: "include", // 중요: 쿠키 포함
            body: fileFormData
          }
        );

        if (fileResponse.ok) {
          console.log("첨부 파일이 성공적으로 업로드되었습니다.");
        } else {
          console.warn("첨부 파일 업로드 실패 (계속 진행)");
        }
      } catch (fileError) {
        console.warn("첨부 파일 업로드 중 오류 (계속 진행):", fileError);
      }
    }

    // 성공 메시지 표시
    setSuccessMessage(
      `입찰 공고가 성공적으로 ${mode === "edit" ? "수정" : "등록"}되었습니다.`
    );
    setShowSuccess(true);

    // 상세 페이지로 이동
    setTimeout(() => {
      navigate(`/biddings/${result.id}`);
    }, 1500);

    return result;
  };

  // 취소 핸들러
  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "작업을 취소하시겠습니까? 입력한 데이터는 저장되지 않습니다."
    );
    if (confirmCancel) {
      navigate("/biddings");
    }
  };

  useEffect(() => {
    console.log("📦 최종 제출 payload 확인", {
      purchaseRequestId: formData.purchaseRequestId,
      purchaseRequestItemId: formData.purchaseRequestItemId
    });
  }, [formData]);

  // 파일 리스트 렌더링
  const renderFileList = () => {
    return (
      <Box sx={{ mt: 2 }}>
        {fileList.map((file, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              p: 1,
              border: "1px solid #e0e0e0",
              borderRadius: 1
            }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AttachFileIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                {typeof file === "string" ? file : file.name}
              </Typography>
            </Box>
            <Box>
              {typeof file === "string" && (
                <IconButton
                  size="small"
                  onClick={() => handleFileDownload(file)}
                  title="다운로드">
                  <DownloadIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={() => handleFileDelete(file)}
                title="삭제">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // 파일 첨부 input 컴포넌트
  const renderFileUploadInput = () => (
    <>
      <input
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        onChange={handleFileChange}
        id="contained-button-file"
        style={{ display: "none" }}
      />
      <label htmlFor="contained-button-file">
        <Button
          variant="outlined"
          component="span"
          startIcon={<AttachFileIcon />}
          disabled={mode === "edit"}>
          파일 첨부
        </Button>
      </label>
    </>
  );

  // 로딩 중 표시
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  };

  // 파일 첨부 input 수정
  const renderFileUploadInput = () => (
    <>
      <input
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        onChange={handleFileChange}
        id="contained-button-file"
        style={{ display: "none" }}
      />
      <label htmlFor="contained-button-file">
        <Button
          variant="contained"
          component="span"
          startIcon={<AttachFileIcon />}
          disabled={mode === "edit"}>
          파일 첨부
        </Button>
      </label>
    </>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {mode === "create" ? "입찰 공고 등록" : "입찰 공고 수정"}
      </Typography>

      {/* 에러 메시지 표시 */}
      {requestError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {requestError}
        </Alert>
      )}

      {/* 성공 메시지 표시 */}
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            {/* 구매 요청 선택 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구매 요청 코드"
                name="requestNumber"
                value={formData.requestNumber}
                onClick={() => {
                  if (mode === "create") {
                    setIsPurchaseRequestModalOpen(true);
                  }
                }}
                InputProps={{
                  readOnly: true,
                  style: { cursor: mode === "create" ? "pointer" : "default" }
                }}
                error={!!errors.requestNumber}
                helperText={
                  errors.requestNumber ||
                  (mode === "create" ? "클릭하여 구매 요청을 선택하세요" : "")
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구매 요청명"
                name="requestName"
                value={formData.requestName}
                InputProps={{ readOnly: true }}
                margin="normal"
              />
            </Grid>
            {/* 공급자 선택 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                거래처(공급자)
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${
                    errors.suppliers ? "#d32f2f" : "#e0e0e0"
                  }`,
                  borderRadius: 1,
                  minHeight: "100px",
                  mb: 1
                }}>
                {formData.suppliers && formData.suppliers.length > 0 ? (
                  <Grid container spacing={1}>
                    {formData.suppliers.map((supplier) => (
                      <Grid item key={supplier.id}>
                        <Box
                          sx={{
                            bgcolor: "primary.light",
                            color: "white",
                            p: 1,
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                          }}>
                          <Typography variant="body2">
                            {supplier.name}
                          </Typography>
                          <Button
                            size="small"
                            sx={{ minWidth: "auto", p: 0, color: "white" }}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                suppliers: prev.suppliers.filter(
                                  (s) => s.id !== supplier.id
                                )
                              }));
                            }}>
                            ×
                          </Button>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    선택된 공급자가 없습니다.
                  </Typography>
                )}
              </Box>
              {errors.suppliers && (
                <Typography color="error" variant="caption">
                  {errors.suppliers}
                </Typography>
              )}
              <Button
                variant="outlined"
                onClick={() => setIsSupplierModalOpen(true)}
                startIcon={<span>+</span>}
                disabled={mode === "edit"}>
                공급자 선택
              </Button>
            </Grid>

            {/* 입찰 정보 */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="bid-method-label">입찰 방식</InputLabel>
                <Select
                  labelId="bid-method-label"
                  name="bidMethod"
                  value={
                    mode === "create" ? formData.bidMethod : originalBidMethod
                  }
                  label="입찰 방식"
                  onChange={handleChange}
                  disabled={mode === "edit"}>
                  <MenuItem value={BiddingMethod.FIXED_PRICE}>
                    정가제안
                  </MenuItem>
                  <MenuItem value={BiddingMethod.OPEN_PRICE}>가격제안</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">상태</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status?.childCode || "PENDING"}
                  label="상태"
                  onChange={handleChange}
                  disabled={mode === "edit"}>
                  <MenuItem value={BiddingStatus.PENDING}>대기중</MenuItem>
                  <MenuItem value={BiddingStatus.ONGOING}>진행중</MenuItem>
                  <MenuItem value={BiddingStatus.CLOSED}>마감</MenuItem>
                  <MenuItem value={BiddingStatus.CANCELED}>취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 제목 필드 (필수) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="입찰 공고 제목"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                error={!!errors.title}
                helperText={errors.title}
                disabled={!isFieldEditable("title")}
                margin="normal"
              />
            </Grid>

            {/* 납품 관련 정보 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="납품 장소"
                name="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={handleChange}
                margin="normal"
                error={!!errors.deliveryLocation}
                helperText={errors.deliveryLocation}
              />
            </Grid>

            {/* 수량 및 단가 정보 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="품목 수량"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  handleNumberChange("quantity", Number(e.target.value))
                }
                disabled={
                  mode === "edit" ||
                  formData.bidMethod === BiddingMethod.OPEN_PRICE
                }
                error={!!errors.quantity}
                helperText={errors.quantity}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="단가"
                name="unitPrice"
                type="number"
                value={formData.unitPrice}
                onChange={(e) =>
                  handleNumberChange("unitPrice", Number(e.target.value))
                }
                disabled={
                  mode === "edit" ||
                  formData.bidMethod === BiddingMethod.OPEN_PRICE ||
                  formData.selectedItems.length > 1
                }
                error={!!errors.unitPrice}
                helperText={errors.unitPrice}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="billing-unit-label">과금 단위</InputLabel>
                <Select
                  labelId="billing-unit-label"
                  name="billingUnit"
                  value={formData.billingUnit}
                  label="과금 단위"
                  onChange={handleChange}
                  disabled={formData.selectedItems.length > 1}>
                  {BillingUnits.map((unit) => (
                    <MenuItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="납품 요청일"
                  value={
                    formData.deliveryDate ? moment(formData.deliveryDate) : null
                  }
                  onChange={(newDate) =>
                    handleDateChange("deliveryDate", newDate)
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      error: !!errors.deliveryDate,
                      helperText: errors.deliveryDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="입찰 시작일"
                  value={formData.startDate ? moment(formData.startDate) : null}
                  onChange={(newDate) => handleDateChange("startDate", newDate)}
                  disabled={!isFieldEditable("title")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      margin: "normal",
                      error: !!errors.startDate,
                      helperText: errors.startDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="입찰 마감일"
                  value={formData.endDate ? moment(formData.endDate) : null}
                  onChange={(newDate) => handleDateChange("endDate", newDate)}
                  disabled={!isFieldEditable("title")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      margin: "normal",
                      error: !!errors.endDate,
                      helperText: errors.endDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* 금액 표시 (읽기 전용) */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="공급가액"
                value={formData.supplyPrice.toLocaleString()}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="부가세"
                value={formData.vat.toLocaleString()}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="합계 금액"
                value={formData.totalAmount.toLocaleString()}
                InputProps={{
                  readOnly: true,
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
                margin="normal"
              />
            </Grid>

            {/* 입찰 조건 필드 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="입찰 조건"
                name="biddingConditions"
                multiline
                variant="filled"
                minRows={4}
                maxRows={8}
                value={formData.biddingConditions}
                onChange={handleChange}
                placeholder="예: 1. 납품 일정 2. 품질 요구사항 3. 결제 조건 등"
                required
                error={!!errors.biddingConditions}
                helperText={errors.biddingConditions}
                disabled={!isFieldEditable("title")}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고 (내부용)"
                name="internalNote"
                multiline
                variant="filled"
                minRows={4}
                maxRows={8}
                value={formData.internalNote}
                onChange={handleChange}
                placeholder="내부 참고사항을 입력하세요"
                disabled={!isFieldEditable("title")}
                margin="normal"
              />
            </Grid>
          </Grid>
          {/* 첨부 파일 */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              첨부 파일
            </Typography>
            {renderFileList()}
            {renderFileUploadInput()}
          </Box>
        </Paper>

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : mode === "create" ? (
              "등록"
            ) : (
              "수정"
            )}
          </Button>
          <Button
            variant="outlined"
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}>
            취소
          </Button>
        </Box>
      </form>

      {/* 구매 요청 선택 모달 */}
      <PurchaseRequestSelectionDialog
        open={isPurchaseRequestModalOpen}
        onClose={() => setIsPurchaseRequestModalOpen(false)}
        purchaseRequests={purchaseRequests}
        onComplete={handlePurchaseRequestComplete}
        initialPurchaseRequest={selectedPurchaseRequest}
        initialSelectedItems={formData.selectedItems}
      />

      {/* 공급자 선택 모달 */}
      <SupplierSelectionDialog
        open={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        suppliers={suppliers}
        selectedSuppliers={formData.suppliers}
        onSelect={handleSupplierSelect}
        onComplete={handleSupplierSelectionComplete}
        purchaseRequest={selectedPurchaseRequest}
      />
    </Box>
  );
}

// PropTypes 정의
BiddingFormPage.propTypes = {
  mode: PropTypes.oneOf(["create", "edit"]),
  biddingId: PropTypes.number,
  onSave: PropTypes.func,
  onCancel: PropTypes.func
};

export default BiddingFormPage;
