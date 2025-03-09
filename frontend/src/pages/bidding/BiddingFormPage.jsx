import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  CircularProgress
} from "@mui/material";

function BiddingFormPage(props) {
  const { mode = "create", biddingId, onSave, onCancel } = props;

  // 초기 상태 설정
  const initialFormData = {
    purchaseRequestCode: "",
    purchaseRequestName: "",
    suppliers: [], // 공급자 배열로 변경
    itemQuantity: 0,
    unitPrice: 0,
    supplyPrice: 0,
    vat: 0,
    billingUnit: "",
    biddingConditions: "",
    deadline: "",
    internalNote: "",
    status: "대기중",
    bidMethod: "FIXED_PRICE" // 기본값: 정가제안
  };

  // 임의의 구매요청 리스트 샘플 데이터
  const samplePurchaseRequests = [
    {
      id: 1001,
      projectId: 5001,
      title: "서버 장비 구매",
      description: "데이터 센터 확장을 위한 서버 장비 구매",
      totalAmount: 50000000,
      status: "승인완료",
      requestDate: "2025-02-10",
      deliveryDate: "2025-04-15",
      items: [
        {
          itemId: 101,
          name: "고성능 서버",
          quantity: 5,
          unitPrice: 8000000,
          supplyPrice: 40000000,
          vat: 4000000,
          totalPrice: 44000000
        },
        {
          itemId: 102,
          name: "네트워크 스위치",
          quantity: 2,
          unitPrice: 3000000,
          supplyPrice: 6000000,
          vat: 600000,
          totalPrice: 6600000
        }
      ]
    },
    {
      id: 1002,
      projectId: 5002,
      title: "개발자 PC 구매",
      description: "신규 개발팀을 위한 고성능 PC 10대",
      totalAmount: 25000000,
      status: "승인완료",
      requestDate: "2025-02-15",
      deliveryDate: "2025-03-20",
      items: [
        {
          itemId: 201,
          name: "개발자용 워크스테이션",
          quantity: 10,
          unitPrice: 2500000,
          supplyPrice: 25000000,
          vat: 2500000,
          totalPrice: 27500000
        }
      ]
    },
    {
      id: 1003,
      projectId: 5003,
      title: "클라우드 서비스 구독",
      description: "연간 클라우드 스토리지 및 서비스 구독",
      totalAmount: 36000000,
      status: "승인완료",
      requestDate: "2025-01-20",
      deliveryDate: "2025-02-01",
      items: [
        {
          itemId: 301,
          name: "클라우드 스토리지 서비스 (연간)",
          quantity: 1,
          unitPrice: 24000000,
          supplyPrice: 24000000,
          vat: 2400000,
          totalPrice: 26400000
        },
        {
          itemId: 302,
          name: "클라우드 컴퓨팅 리소스 (연간)",
          quantity: 1,
          unitPrice: 12000000,
          supplyPrice: 12000000,
          vat: 1200000,
          totalPrice: 13200000
        }
      ]
    },
    {
      id: 1004,
      projectId: 5004,
      title: "네트워크 장비 업그레이드",
      description: "본사 네트워크 인프라 업그레이드",
      totalAmount: 45000000,
      status: "승인완료",
      requestDate: "2025-02-25",
      deliveryDate: "2025-04-10",
      items: [
        {
          itemId: 401,
          name: "코어 라우터",
          quantity: 2,
          unitPrice: 15000000,
          supplyPrice: 30000000,
          vat: 3000000,
          totalPrice: 33000000
        },
        {
          itemId: 402,
          name: "방화벽 장비",
          quantity: 3,
          unitPrice: 5000000,
          supplyPrice: 15000000,
          vat: 1500000,
          totalPrice: 16500000
        }
      ]
    },
    {
      id: 1005,
      projectId: 5005,
      title: "소프트웨어 라이센스 구매",
      description: "개발 및 디자인 팀을 위한 소프트웨어 라이센스",
      totalAmount: 18000000,
      status: "승인완료",
      requestDate: "2025-03-01",
      deliveryDate: "2025-03-15",
      items: [
        {
          itemId: 501,
          name: "개발 IDE 라이센스",
          quantity: 20,
          unitPrice: 500000,
          supplyPrice: 10000000,
          vat: 1000000,
          totalPrice: 11000000
        },
        {
          itemId: 502,
          name: "디자인 소프트웨어 라이센스",
          quantity: 10,
          unitPrice: 800000,
          supplyPrice: 8000000,
          vat: 800000,
          totalPrice: 8800000
        }
      ]
    }
  ];

  // 임의의 공급자 리스트 샘플 데이터
  const sampleSuppliers = [
    {
      id: 2001,
      name: "테크놀로지 주식회사",
      businessNumber: "123-45-67890",
      contact: "02-1234-5678",
      email: "sales@techcorp.com",
      address: "서울시 강남구 테헤란로 123"
    },
    {
      id: 2002,
      name: "글로벌 IT 솔루션",
      businessNumber: "234-56-78901",
      contact: "02-2345-6789",
      email: "contact@globalit.com",
      address: "서울시 서초구 서초대로 456"
    },
    {
      id: 2003,
      name: "네트워크 시스템즈",
      businessNumber: "345-67-89012",
      contact: "02-3456-7890",
      email: "info@networksystems.com",
      address: "서울시 마포구 마포대로 789"
    },
    {
      id: 2004,
      name: "클라우드 서비스 프로바이더",
      businessNumber: "456-78-90123",
      contact: "02-4567-8901",
      email: "support@cloudsp.com",
      address: "서울시 영등포구 여의대로 321"
    },
    {
      id: 2005,
      name: "디지털 인프라 솔루션",
      businessNumber: "567-89-01234",
      contact: "02-5678-9012",
      email: "sales@digitalinfra.com",
      address: "서울시 송파구 올림픽로 654"
    }
  ];

  // 상태 관리
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isPurchaseRequestModalOpen, setIsPurchaseRequestModalOpen] =
    useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState(
    samplePurchaseRequests
  );
  const [suppliers, setSuppliers] = useState(sampleSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);

  // 수정 모드일 경우 데이터 가져오기
  useEffect(() => {
    if (mode === "edit" && biddingId) {
      try {
        setIsLoading(true);
        // 임의의 샘플 입찰 공고 데이터 (수정 모드용)
        const sampleBiddingData = {
          id: biddingId,
          purchaseRequestCode: "1002",
          purchaseRequestName: "개발자 PC 구매",
          suppliers: [
            {
              id: 2002,
              name: "글로벌 IT 솔루션",
              businessNumber: "234-56-78901",
              contact: "02-2345-6789",
              email: "contact@globalit.com",
              address: "서울시 서초구 서초대로 456"
            },
            {
              id: 2005,
              name: "디지털 인프라 솔루션",
              businessNumber: "567-89-01234",
              contact: "02-5678-9012",
              email: "sales@digitalinfra.com",
              address: "서울시 송파구 올림픽로 654"
            }
          ],
          itemQuantity: 10,
          unitPrice: 2500000,
          supplyPrice: 25000000,
          vat: 2500000,
          billingUnit: "개",
          biddingConditions:
            "1. 납품은 구매 확정 후 1개월 내에 이루어져야 함\n2. 모든 제품은 공식 유통 제품이어야 함\n3. A/S 보증기간은 최소 1년 이상",
          deadline: "2025-04-15",
          internalNote: "개발팀 요청에 따른 장비 구매, 예산 승인 완료",
          status: "진행중",
          bidMethod: "FIXED_PRICE"
        };

        // 1초 후 샘플 데이터로 폼 설정 (로딩 효과 시뮬레이션)
        setTimeout(() => {
          setFormData(sampleBiddingData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("데이터 로딩 중 오류 발생:", error);
        setIsLoading(false);
      }
    }
  }, [mode, biddingId]);

  // 금액 계산 로직
  function calculatePrices(quantity, price) {
    const supplyPrice = price * quantity;
    const vat = supplyPrice * 0.1;

    setFormData((prev) => ({
      ...prev,
      supplyPrice,
      vat,
      itemQuantity: quantity,
      unitPrice: price
    }));
  }

  // 입력 핸들러
  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  // 셀렉트 변경 핸들러
  function handleSelectChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  // 수량 및 단가 변경 핸들러
  function handleNumberChange(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // 수량이나 단가가 변경되면 금액 재계산
    if (name === "itemQuantity") {
      calculatePrices(value, formData.unitPrice);
    } else if (name === "unitPrice") {
      calculatePrices(formData.itemQuantity, value);
    }
  }

  // 날짜 변경 핸들러
  function handleDateChange(event) {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      deadline: value
    }));
  }

  // 파일 변경 핸들러
  function handleFileChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setFileList((prev) => [...prev, ...newFiles]);

      // formData에도 파일 정보 추가
      setFormData((prev) => ({
        ...prev,
        files: [...(prev.files || []), ...newFiles]
      }));
    }
  }

  // 서버에 전송할 데이터 형식으로 변환
  function transformFormDataToApiFormat() {
    // 백엔드 API에 맞는 형식으로 데이터 변환
    const apiData = {
      bidNumber: formData.bidNumber || null, // 수정 모드에서만 사용됨
      purchaseRequestId: parseInt(formData.purchaseRequestCode) || null,
      title: formData.purchaseRequestName,
      description:
        formData.suppliers.map((s) => s.name).join(", ") + "와의 거래",
      bidMethod: formData.bidMethod,
      status:
        formData.status === "대기중"
          ? "PENDING"
          : formData.status === "진행중"
          ? "ONGOING"
          : formData.status === "마감"
          ? "CLOSED"
          : "CANCELED",
      startDate: new Date().toISOString(),
      endDate: formData.deadline
        ? new Date(formData.deadline + "T23:59:59").toISOString()
        : null,
      conditions: formData.biddingConditions,
      internalNote: formData.internalNote,
      quantity: formData.itemQuantity,
      unitPrice: formData.unitPrice,
      // 나머지 필드는 서비스에서 계산됨
      createdBy: 1 // 임시 사용자 ID
    };

    return apiData;
  }

  // 저장 핸들러
  async function handleSave() {
    if (formData.purchaseRequestCode === "") {
      alert("구매 요청을 선택해주세요.");
      return;
    }

    if (formData.suppliers.length === 0) {
      alert("공급자를 한 명 이상 선택해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      const apiData = transformFormDataToApiFormat();

      // API 엔드포인트 및 메서드 설정
      const endpoint =
        mode === "create" ? "/api/biddings" : `/api/biddings/${biddingId}`;
      const method = mode === "create" ? "POST" : "PUT";

      // 인증 토큰 (실제 토큰으로 대체 필요)
      const token = localStorage.getItem("authToken") || "temp-token";

      // API 호출
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "입찰 공고 저장에 실패했습니다.");
      }

      const result = await response.json();

      if (onSave) {
        onSave(result);
      } else {
        alert(
          "입찰 공고가 성공적으로 " +
            (mode === "create" ? "등록" : "수정") +
            "되었습니다."
        );
        console.log("저장된 데이터:", result);
        // 성공 후 리디렉션 등 추가 작업
      }
    } catch (error) {
      console.error("입찰 공고 저장 중 오류:", error);
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // 취소 핸들러
  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      console.log("작업 취소");
      // 취소 로직 (예: 이전 페이지로 돌아가기)
      if (
        window.confirm(
          "작업을 취소하시겠습니까? 입력한 데이터는 저장되지 않습니다."
        )
      ) {
        setFormData(initialFormData);
      }
    }
  }

  // 구매 요청 선택 핸들러
  function handlePurchaseRequestSelect(request) {
    // 선택한 구매 요청의 첫 번째 아이템 정보를 가져옴
    const item =
      request.items && request.items.length > 0 ? request.items[0] : null;

    setFormData((prev) => ({
      ...prev,
      purchaseRequestCode: request.id.toString(),
      purchaseRequestName: request.title,
      itemQuantity: item ? item.quantity : 0,
      unitPrice: item ? item.unitPrice : 0,
      supplyPrice: item ? item.supplyPrice : 0,
      vat: item ? item.vat : 0
    }));

    setSelectedItemDetails(item);
    setIsPurchaseRequestModalOpen(false);
  }

  // 공급자 선택 핸들러
  function handleSupplierSelect(supplier) {
    setFormData((prev) => {
      // 이미 선택된 공급자인지 확인
      const isAlreadySelected = prev.suppliers.some(
        (s) => s.id === supplier.id
      );

      if (isAlreadySelected) {
        // 이미 선택된 공급자라면 제거 (토글)
        return {
          ...prev,
          suppliers: prev.suppliers.filter((s) => s.id !== supplier.id)
        };
      } else {
        // 새 공급자 추가
        return {
          ...prev,
          suppliers: [...prev.suppliers, supplier]
        };
      }
    });
    // 모달은 닫지 않고 여러 공급자 선택 가능하게 함
  }

  // 공급자 선택 완료 핸들러
  function handleSupplierSelectionComplete() {
    setIsSupplierModalOpen(false);
  }

  // 구매 요청 검색 필터링
  const filteredPurchaseRequests = purchaseRequests.filter(
    (request) =>
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toString().includes(searchTerm)
  );

  // 공급자 검색 필터링
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
      supplier.id.toString().includes(supplierSearchTerm)
  );

  // 로딩 중일 때
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh"
        }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {mode === "create" ? "입찰 공고 등록" : "입찰 공고 수정"}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* 구매 요청 선택 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="구매 요청 코드"
              name="purchaseRequestCode"
              value={formData.purchaseRequestCode}
              onClick={() => setIsPurchaseRequestModalOpen(true)}
              InputProps={{ readOnly: true }}
              helperText="클릭하여 구매 요청을 선택하세요"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="구매 요청명"
              name="purchaseRequestName"
              value={formData.purchaseRequestName}
              InputProps={{ readOnly: true }}
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
                border: "1px solid #e0e0e0",
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
                        <Typography variant="body2">{supplier.name}</Typography>
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
            <Button
              variant="outlined"
              onClick={() => setIsSupplierModalOpen(true)}
              startIcon={<span>+</span>}>
              공급자 선택
            </Button>
          </Grid>

          {/* 품목 및 수량 */}
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
              disabled={formData.bidMethod === "PRICE_SUGGESTION"}
              helperText={
                formData.bidMethod === "PRICE_SUGGESTION"
                  ? "가격제안 방식에서는 수정 불가"
                  : ""
              }
            />
          </Grid>

          {/* 가격 관련 입력 */}
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
              disabled={formData.bidMethod === "PRICE_SUGGESTION"}
              helperText={
                formData.bidMethod === "PRICE_SUGGESTION"
                  ? "가격제안 방식에서는 수정 불가"
                  : ""
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="공급가액"
              name="supplyPrice"
              value={formData.supplyPrice.toLocaleString()}
              InputProps={{ readOnly: true }}
              disabled={formData.bidMethod === "PRICE_SUGGESTION"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="부가세"
              name="vat"
              value={formData.vat.toLocaleString()}
              InputProps={{ readOnly: true }}
              disabled={formData.bidMethod === "PRICE_SUGGESTION"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="총액"
              name="totalAmount"
              value={(formData.supplyPrice + formData.vat).toLocaleString()}
              InputProps={{ readOnly: true }}
              disabled={formData.bidMethod === "PRICE_SUGGESTION"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="billing-unit-label">과금 단위</InputLabel>
              <Select
                labelId="billing-unit-label"
                name="billingUnit"
                value={formData.billingUnit}
                label="과금 단위"
                onChange={handleSelectChange}>
                <MenuItem value="개">개</MenuItem>
                <MenuItem value="세트">세트</MenuItem>
                <MenuItem value="개월">개월</MenuItem>
                <MenuItem value="시간">시간</MenuItem>
                <MenuItem value="건">건</MenuItem>
                <MenuItem value="라이센스">라이센스</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">상태</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                label="상태"
                onChange={handleSelectChange}>
                <MenuItem value="대기중">대기중</MenuItem>
                <MenuItem value="진행중">진행중</MenuItem>
                <MenuItem value="마감">마감</MenuItem>
                <MenuItem value="취소">취소</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="bid-method-label">입찰 방식</InputLabel>
              <Select
                labelId="bid-method-label"
                name="bidMethod"
                value={formData.bidMethod}
                label="입찰 방식"
                onChange={handleSelectChange}>
                <MenuItem value="FIXED_PRICE">정가제안</MenuItem>
                <MenuItem value="PRICE_SUGGESTION">가격제안</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 입찰 조건 및 마감 시간 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="입찰 조건"
              name="biddingConditions"
              multiline
              rows={4}
              value={formData.biddingConditions}
              onChange={handleInputChange}
              placeholder="예: 1. 납품 일정 2. 품질 요구사항 3. 결제 조건 등"
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
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          {/* 비고 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="비고 (내부용)"
              name="internalNote"
              multiline
              rows={4}
              value={formData.internalNote}
              onChange={handleInputChange}
              placeholder="내부 참고사항을 입력하세요"
            />
          </Grid>

          {/* 파일 업로드 */}
          <Grid item xs={12}>
            <Button variant="contained" component="label">
              파일 등록
              <input type="file" multiple hidden onChange={handleFileChange} />
            </Button>
            {fileList.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">선택된 파일:</Typography>
                <List>
                  {fileList.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

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
                          {request.items.length} | 총 금액:{" "}
                          {request.totalAmount.toLocaleString()}원 | 납기일:{" "}
                          {request.deliveryDate}
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

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          {mode === "create" ? "등록" : "수정"}
        </Button>
        <Button variant="outlined" onClick={handleCancel}>
          취소
        </Button>
      </Box>
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
