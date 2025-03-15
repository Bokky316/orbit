import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

// 헬퍼 함수 import
import { BiddingStatus, BiddingMethod, UserRole } from "./helpers/biddingTypes";
import {
  getStatusText,
  getBidMethodText,
  transformFormDataToApiFormat,
  mapBiddingDataToFormData
} from "./helpers/commonBiddingHelpers";
import { validateBiddingForm } from "./helpers/BuyerBiddingHelpers";

// 초기 폼 데이터
const INITIAL_FORM_DATA = {
  purchaseRequestCode: "",
  purchaseRequestName: "",
  purchaseRequestItemId: null,
  title: "",
  description: "",
  suppliers: [],
  bidMethod: BiddingMethod.FIXED_PRICE,
  status: {
    parentCode: "BIDDING",
    childCode: BiddingStatus.PENDING
  },
  startDate: new Date().toISOString().split("T")[0],
  deadline: "",
  itemQuantity: 1,
  unitPrice: 0,
  supplyPrice: 0,
  vat: 0,
  totalAmount: 0,
  biddingConditions: "",
  conditions: "",
  internalNote: "",
  billingUnit: "개",
  files: []
};

function BiddingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const mode = id ? "edit" : "create";
  const biddingId = id ? parseInt(id) : null;

  // Redux에서 인증 상태 가져오기
  const { user } = useSelector((state) => state.auth);

  // 상태 관리
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [originalBidMethod, setOriginalBidMethod] = useState(null);

  // 모달 상태
  const [isPurchaseRequestModalOpen, setIsPurchaseRequestModalOpen] =
    useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  // 페이지 로드 시 suppliers 데이터 가져오기 함수 추가
  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`${API_URL}suppliers/active`);

      if (!response.ok) {
        throw new Error("공급사 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("공급사 목록 가져오기 실패:", error);
      setRequestError("공급사 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 구매 요청 목록 가져오기
  const fetchPurchaseRequests = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}purchase-requests/active`
      );
      if (!response.ok) {
        throw new Error("구매 요청 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      setPurchaseRequests(data || []);
    } catch (error) {
      console.error("구매 요청 목록 가져오기 실패:", error);
    }
  };

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      switch (name) {
        case "status":
          // 상세 페이지에서만 상태 변경 가능하도록 수정 모드에서는 변경 방지
          return mode === "create"
            ? {
                ...prev,
                status: {
                  parentCode: "BIDDING",
                  childCode: value
                }
              }
            : prev;

        case "bidMethod":
          // 최초 등록 시에만 입찰 방식 변경 가능
          return mode === "create"
            ? {
                ...prev,
                bidMethod: value,
                ...(value === "가격제안" && {
                  itemQuantity: 0,
                  unitPrice: 0
                })
              }
            : prev;

        case "biddingConditions": // 입찰 조건 필드 수정
          return {
            ...prev,
            biddingConditions: value,
            conditions: value // API 요청 시 conditions 필드로 매핑되도록
          };

        default:
          return {
            ...prev,
            [name]: type === "checkbox" ? checked : value
          };
      }
    });

    // 오류 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 수량 및 단가 변경 핸들러
  const handleNumberChange = (name, value) => {
    // 안전한 숫자 변환 적용
    const safeValue = Math.max(0, Number(value) || 0);

    setFormData((prev) => ({
      ...prev,
      [name]: safeValue
    }));

    // 수량이나 단가가 변경되면 금액 재계산
    if (name === "itemQuantity" || name === "unitPrice") {
      const quantity =
        name === "itemQuantity"
          ? safeValue
          : Math.max(0, Number(formData.itemQuantity) || 0);
      const unitPrice =
        name === "unitPrice"
          ? safeValue
          : Math.max(0, Number(formData.unitPrice) || 0);
      const supplyPrice = quantity * unitPrice;
      const vat = Math.round(supplyPrice * 0.1);
      const totalAmount = supplyPrice + vat;

      setFormData((prev) => ({
        ...prev,
        supplyPrice,
        vat,
        totalAmount
      }));
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      deadline: value
    }));
  };

  // 파일 타입 제한 및 최대 크기 설정
  const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  // 파일 변경 핸들러
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      // 파일 타입 및 크기 검증
      const isValidType = ALLOWED_FILE_TYPES.includes(file.type);
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        alert(`지원되지 않는 파일 형식입니다: ${file.name}`);
      }

      if (!isValidSize) {
        alert(`파일 크기가 너무 큽니다 (최대 50MB): ${file.name}`);
      }

      return isValidType && isValidSize;
    });

    // 기존 파일과 새 파일 병합
    setFileList((prev) => {
      const updatedFiles = [...prev, ...validFiles];

      // formData에도 파일 정보 업데이트
      setFormData((prevForm) => ({
        ...prevForm,
        files: updatedFiles
      }));

      return updatedFiles;
    });
  };

  // 파일 다운로드 핸들러
  const handleFileDownload = async (filename) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/download-file?filename=${encodeURIComponent(
          filename
        )}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("파일을 다운로드할 수 없습니다.");
      }

      // Blob으로 변환 및 다운로드
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("파일 다운로드 중 오류:", error);
      alert("파일을 다운로드할 수 없습니다.");
    }
  };

  // 파일 삭제 핸들러
  const handleFileDelete = (fileToDelete) => {
    setFileList((prev) => {
      const updatedFiles = prev.filter(
        (file) => file.name !== fileToDelete.name && file !== fileToDelete
      );

      // formData의 files도 업데이트
      setFormData((prevForm) => ({
        ...prevForm,
        files: updatedFiles
      }));

      return updatedFiles;
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사에 validateBiddingForm 헬퍼 함수 사용
    const { isValid, errors: validationErrors } = validateBiddingForm(
      formData,
      mode
    );

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setRequestError("");

      // API 데이터 준비
      const apiData = transformFormDataToApiFormat(formData, user);

      // 첨부 파일이 있는 경우 FormData로 변환
      if (formData.files && formData.files.length > 0) {
        const formDataObj = new FormData();

        // JSON 데이터 추가
        formDataObj.append("data", JSON.stringify(apiData));

        // 파일 추가
        formData.files.forEach((file) => {
          formDataObj.append("files", file);
        });

        // 파일 업로드 API 요청
        const response =
          mode === "create"
            ? await fetchWithAuth(`${API_URL}biddings/with-files`, {
                method: "POST",
                body: formDataObj
              })
            : await fetchWithAuth(`${API_URL}biddings/${id}/with-files`, {
                method: "PUT",
                body: formDataObj
              });

        if (!response.ok) {
          throw new Error(
            `입찰 공고 ${
              mode === "create" ? "등록" : "수정"
            }에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();

        alert(
          `입찰 공고가 성공적으로 ${
            mode === "create" ? "등록" : "수정"
          }되었습니다.`
        );
        navigate(`/biddings/${data.id}`);
      } else {
        // 일반 JSON 요청
        const response =
          mode === "create"
            ? await fetchWithAuth(`${API_URL}biddings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(apiData)
              })
            : await fetchWithAuth(`${API_URL}biddings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(apiData)
              });

        if (!response.ok) {
          throw new Error(
            `입찰 공고 ${
              mode === "create" ? "등록" : "수정"
            }에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();

        alert(
          `입찰 공고가 성공적으로 ${
            mode === "create" ? "등록" : "수정"
          }되었습니다.`
        );
        navigate(`/biddings/${data.id}`);
      }
    } catch (error) {
      console.error("입찰 공고 제출 오류:", error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
  }, [mode, biddingId, suppliers]);

  // 취소 핸들러
  function handleCancel() {
    const confirmCancel = window.confirm(
      "작업을 취소하시겠습니까? 입력한 데이터는 저장되지 않습니다."
    );
    if (confirmCancel) {
      navigate("/biddings");
    }
  }

  // 구매 요청 선택 핸들러
  const handlePurchaseRequestSelect = (request) => {
    const item =
      request.items && request.items.length > 0 ? request.items[0] : null;

    setFormData((prev) => ({
      ...prev,
      purchaseRequestCode: request.id.toString(),
      purchaseRequestName: request.title,
      purchaseRequestItemId: item ? item.itemId : null,
      itemQuantity: item ? item.quantity : 0,
      unitPrice: item ? item.unitPrice : 0,
      supplyPrice: item ? item.supplyPrice : 0,
      vat: item ? item.vat : 0,
      totalAmount: item ? item.supplyPrice + item.vat : 0
    }));

    setIsPurchaseRequestModalOpen(false);
  };

  // 공급자 선택 핸들러
  const handleSupplierSelect = (supplier) => {
    setFormData((prev) => {
      // 이미 선택된 공급자인지 확인
      const isSelected = prev.suppliers.some((s) => s.id === supplier.id);

      if (isSelected) {
        // 이미 선택된 경우 제거
        return {
          ...prev,
          suppliers: prev.suppliers.filter((s) => s.id !== supplier.id)
        };
      } else {
        // 새로 선택한 경우 추가
        return {
          ...prev,
          suppliers: [...prev.suppliers, supplier]
        };
      }
    });
  };

  // 공급자 선택 완료 핸들러
  function handleSupplierSelectionComplete() {
    setIsSupplierModalOpen(false);
  }

  // 구매 요청 검색 필터링
  const filteredPurchaseRequests = purchaseRequests.filter(
    (request) =>
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id?.toString().includes(searchTerm)
  );

  // 공급자 검색 필터링
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
      supplier.id?.toString().includes(supplierSearchTerm)
  );

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
              {/* 다운로드 버튼 (서버에서 온 파일인 경우만) */}
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

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            {/* 구매 요청 선택 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구매 요청 코드"
                name="purchaseRequestCode"
                value={formData.purchaseRequestCode}
                onClick={() =>
                  mode === "create" && setIsPurchaseRequestModalOpen(true)
                }
                InputProps={{
                  readOnly: mode === "edit"
                }}
                error={!!errors.purchaseRequestCode}
                helperText={
                  errors.purchaseRequestCode ||
                  (mode === "create" ? "클릭하여 구매 요청을 선택하세요" : "")
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구매 요청명"
                name="purchaseRequestName"
                value={formData.purchaseRequestName}
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
                {mode === "create" || mode === "edit" ? (
                  formData.suppliers && formData.suppliers.length > 0 ? (
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
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}>
                      선택된 공급자가 없습니다.
                    </Typography>
                  )
                ) : null}
              </Box>
              {errors.suppliers && (
                <Typography color="error" variant="caption">
                  {errors.suppliers}
                </Typography>
              )}
              {(mode === "create" || mode === "edit") && (
                <Button
                  variant="outlined"
                  onClick={() => setIsSupplierModalOpen(true)}
                  startIcon={<span>+</span>}>
                  공급자 선택
                </Button>
              )}
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
                  value={
                    mode === "create" ? formData.status.childCode : "PENDING"
                  }
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="품목 수량"
                name="itemQuantity"
                type="number"
                value={formData.itemQuantity}
                onChange={(e) =>
                  handleNumberChange("itemQuantity", Number(e.target.value))
                }
                disabled={
                  mode === "edit" ||
                  formData.bidMethod === BiddingMethod.OPEN_PRICE
                }
                error={!!errors.itemQuantity}
                helperText={errors.itemQuantity}
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
                  formData.bidMethod === BiddingMethod.OPEN_PRICE
                }
                error={!!errors.unitPrice}
                helperText={errors.unitPrice}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="마감 일자"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.deadline}
                helperText={errors.deadline}
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
                  onChange={handleChange}>
                  <MenuItem value="개">개</MenuItem>
                  <MenuItem value="세트">세트</MenuItem>
                  <MenuItem value="개월">개월</MenuItem>
                  <MenuItem value="시간">시간</MenuItem>
                  <MenuItem value="건">건</MenuItem>
                  <MenuItem value="라이센스">라이센스</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* 입찰 조건 필드 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="입찰 조건"
                name="biddingConditions"
                multiline
                rows={4}
                value={formData.biddingConditions}
                onChange={handleChange}
                placeholder="예: 1. 납품 일정 2. 품질 요구사항 3. 결제 조건 등"
                error={!!errors.biddingConditions}
                helperText={errors.biddingConditions}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="비고 (내부용)"
                name="internalNote"
                multiline
                rows={4}
                value={formData.internalNote}
                onChange={handleChange}
                placeholder="내부 참고사항을 입력하세요"
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
      <Dialog
        open={isPurchaseRequestModalOpen}
        onClose={() => setIsPurchaseRequestModalOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>구매 요청 선택</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="구매 요청명 또는 ID 검색"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <List sx={{ maxHeight: 400, overflow: "auto" }}>
            {filteredPurchaseRequests.length > 0 ? (
              filteredPurchaseRequests.map((request) => (
                <ListItem key={request.id} disablePadding>
                  <ListItemButton
                    onClick={() => handlePurchaseRequestSelect(request)}>
                    <ListItemText
                      primary={`${request.id}: ${request.title}`}
                      secondary={
                        <>
                          상태: {request.status} | 품목 수:{" "}
                          {request.items?.length || 0} | 총 금액:{" "}
                          {(request.totalAmount || 0).toLocaleString()}원 |
                          납기일: {request.deliveryDate}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="검색 결과가 없습니다." />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPurchaseRequestModalOpen(false)}>
            취소
          </Button>
        </DialogActions>
      </Dialog>

      {/* 공급자 선택 모달 */}
      <Dialog
        open={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        maxWidth="md"
        fullWidth>
        <DialogTitle>공급자 선택 (여러 업체 선택 가능)</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="공급자명 또는 ID 검색"
            variant="outlined"
            value={supplierSearchTerm}
            onChange={(e) => setSupplierSearchTerm(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}>
            선택된 공급자: {formData.suppliers.length}개
          </Typography>
          <List sx={{ maxHeight: 400, overflow: "auto" }}>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => {
                // 이미 선택된 공급자인지 확인
                const isSelected = formData.suppliers.some(
                  (s) => s.id === supplier.id
                );

                return (
                  <ListItem key={supplier.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSupplierSelect(supplier)}
                      selected={isSelected}
                      sx={{
                        backgroundColor: isSelected
                          ? "rgba(0, 114, 178, 0.1)"
                          : "transparent",
                        "&.Mui-selected": {
                          backgroundColor: "rgba(0, 114, 178, 0.1)"
                        },
                        "&.Mui-selected:hover": {
                          backgroundColor: "rgba(0, 114, 178, 0.2)"
                        }
                      }}>
                      <ListItemText
                        primary={
                          <Typography>
                            {isSelected && "✓ "}
                            {supplier.id}: {supplier.name}
                          </Typography>
                        }
                        secondary={
                          <>
                            사업자등록번호: {supplier.businessNumber} | 연락처:{" "}
                            {supplier.contact} | 이메일: {supplier.email}
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })
            ) : (
              <ListItem>
                <ListItemText primary="검색 결과가 없습니다." />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsSupplierModalOpen(false)}
            color="secondary">
            취소
          </Button>
          <Button
            onClick={handleSupplierSelectionComplete}
            color="primary"
            variant="contained">
            선택 완료 ({formData.suppliers.length}개)
          </Button>
        </DialogActions>
      </Dialog>
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
