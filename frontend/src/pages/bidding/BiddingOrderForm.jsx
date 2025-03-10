import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Button,
  Typography,
  TextField,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Stack,
  CircularProgress
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import moment from "moment";

const BiddingOrderForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [formValues, setFormValues] = useState({
    biddingId: "",
    biddingParticipationId: "",
    title: "",
    expectedDeliveryDate: null,
    description: "",
    terms: "",
    supplierId: "",
    supplierName: "",
    quantity: 0,
    unitPrice: 0,
    supplyPrice: 0,
    vat: 0,
    totalAmount: 0,
    status: "DRAFT"
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [biddings, setBiddings] = useState([]);
  const [selectedBidding, setSelectedBidding] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [selectedParticipation, setSelectedParticipation] = useState(null);
  const [user, setUser] = useState({ id: 1 }); // 로그인 사용자 정보 (임시)
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // 초기 데이터 로드
  useEffect(() => {
    const fetchBiddings = async () => {
      try {
        const response = await fetch("/api/biddings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("입찰 목록 조회에 실패했습니다.");
        }

        const data = await response.json();
        setBiddings(data);
      } catch (error) {
        console.error("입찰 목록 조회 중 오류 발생:", error);
        alert("입찰 목록을 불러오는 데 실패했습니다.");
      }
    };

    fetchBiddings();

    if (isEdit && id) {
      fetchOrderDetail();
    }
  }, [isEdit, id, token]);

  // 발주 상세 정보 조회 (수정 모드)
  const fetchOrderDetail = async () => {
    setInitialLoading(true);
    try {
      const response = await fetch(`/api/bidding-orders/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("발주 상세 조회에 실패했습니다.");
      }

      const orderData = await response.json();

      // 입찰 참여자 목록 조회
      await fetchParticipations(orderData.biddingId);

      // 폼 값 설정
      setFormValues({
        ...orderData,
        expectedDeliveryDate: orderData.expectedDeliveryDate
          ? moment(orderData.expectedDeliveryDate)
          : null
      });

      setSelectedBidding(orderData.biddingId);
      setSelectedParticipation(orderData.biddingParticipationId);
    } catch (error) {
      console.error("발주 상세 조회 중 오류 발생:", error);
      alert("발주 정보를 불러오는 데 실패했습니다.");
    } finally {
      setInitialLoading(false);
    }
  };

  // 입찰 선택 시 참여자 목록 조회
  const fetchParticipations = async (biddingId) => {
    if (!biddingId) return;

    try {
      const response = await fetch(
        `/api/bidding-participations/bidding/${biddingId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("입찰 참여자 목록 조회에 실패했습니다.");
      }

      const data = await response.json();
      setParticipations(data);
    } catch (error) {
      console.error("입찰 참여자 목록 조회 중 오류 발생:", error);
      alert("입찰 참여자 목록을 불러오는 데 실패했습니다.");
    }
  };

  // 입찰 선택 시 핸들러
  const handleBiddingChange = async (e) => {
    const value = e.target.value;
    setSelectedBidding(value);
    setFormValues((prev) => ({
      ...prev,
      biddingId: value,
      biddingParticipationId: "",
      supplierId: "",
      supplierName: "",
      biddingItemId: "",
      quantity: 0,
      unitPrice: 0,
      supplyPrice: 0,
      vat: 0,
      totalAmount: 0
    }));
    await fetchParticipations(value);
  };

  // 참여자 선택 시 핸들러
  const handleParticipationChange = (e) => {
    const value = e.target.value;
    setSelectedParticipation(value);

    const selectedParticipant = participations.find((p) => p.id === value);
    if (selectedParticipant) {
      setFormValues((prev) => ({
        ...prev,
        biddingParticipationId: value,
        supplierId: selectedParticipant.supplierId,
        supplierName: selectedParticipant.supplierName,
        biddingItemId: selectedParticipant.biddingItemId,
        quantity: selectedParticipant.quantity,
        unitPrice: selectedParticipant.unitPrice,
        supplyPrice: selectedParticipant.supplyPrice,
        vat: selectedParticipant.vat,
        totalAmount: selectedParticipant.totalAmount,
        expectedDeliveryDate: selectedParticipant.deliveryDate
          ? moment(selectedParticipant.deliveryDate)
          : null
      }));
    }
  };

  // 폼 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 날짜 선택 핸들러
  const handleDateChange = (date) => {
    setFormValues((prev) => ({
      ...prev,
      expectedDeliveryDate: date
    }));
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formValues.title.trim()) newErrors.title = "발주 제목을 입력해주세요";
    if (!formValues.expectedDeliveryDate)
      newErrors.expectedDeliveryDate = "예상 납품일을 선택해주세요";
    if (!isEdit && !formValues.biddingId)
      newErrors.biddingId = "입찰을 선택해주세요";
    if (!isEdit && !formValues.biddingParticipationId)
      newErrors.biddingParticipationId = "낙찰자를 선택해주세요";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 발주 저장
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const formData = {
        ...formValues,
        expectedDeliveryDate: formValues.expectedDeliveryDate
          ? formValues.expectedDeliveryDate.format("YYYY-MM-DD")
          : null,
        selectedBidder: true,
        bidderSelectedAt: new Date().toISOString(),
        createdBy: user.id
      };

      let responseData;

      if (isEdit) {
        // 발주 수정
        const response = await fetch(`/api/bidding-orders/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error("발주 수정에 실패했습니다.");
        }

        responseData = await response.json();
        alert("발주가 성공적으로 수정되었습니다.");
      } else {
        // 발주 생성
        const response = await fetch(
          `/api/bidding-orders/close-bidding/${formData.biddingId}/select-bidder/${formData.biddingParticipationId}?userId=${user.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error("발주 생성에 실패했습니다.");
        }

        responseData = await response.json();
        alert("낙찰자가 선정되고 발주가 성공적으로 생성되었습니다.");
      }

      navigate(`/bidding-orders/${responseData.id}`);
    } catch (error) {
      console.error("발주 저장 중 오류 발생:", error);
      alert("발주 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    navigate(isEdit ? `/bidding-orders/${id}` : "/bidding-orders");
  };

  if (initialLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          발주 정보를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="bidding-order-form">
        <Paper elevation={3}>
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate("/bidding-orders")}>
                  목록으로
                </Button>
                <Typography variant="h6">
                  {isEdit ? "발주 수정" : "새 발주 생성"}
                </Typography>
              </Stack>
            }
          />
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    기본 정보
                  </Typography>
                </Grid>

                {!isEdit && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl
                        fullWidth
                        variant="outlined"
                        error={!!errors.biddingId}
                        disabled={isEdit}>
                        <InputLabel id="bidding-select-label">입찰</InputLabel>
                        <Select
                          labelId="bidding-select-label"
                          id="biddingId"
                          name="biddingId"
                          value={formValues.biddingId}
                          onChange={handleBiddingChange}
                          label="입찰">
                          <MenuItem value="">선택하세요</MenuItem>
                          {biddings.map((bidding) => (
                            <MenuItem key={bidding.id} value={bidding.id}>
                              {bidding.bidNumber} - {bidding.title}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.biddingId && (
                          <FormHelperText>{errors.biddingId}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl
                        fullWidth
                        variant="outlined"
                        error={!!errors.biddingParticipationId}
                        disabled={!selectedBidding || isEdit}>
                        <InputLabel id="participation-select-label">
                          낙찰자 (입찰 참여자)
                        </InputLabel>
                        <Select
                          labelId="participation-select-label"
                          id="biddingParticipationId"
                          name="biddingParticipationId"
                          value={formValues.biddingParticipationId}
                          onChange={handleParticipationChange}
                          label="낙찰자 (입찰 참여자)">
                          <MenuItem value="">선택하세요</MenuItem>
                          {participations.map((participation) => (
                            <MenuItem
                              key={participation.id}
                              value={participation.id}>
                              {participation.supplierName} -{" "}
                              {participation.totalAmount.toLocaleString()}원
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.biddingParticipationId && (
                          <FormHelperText>
                            {errors.biddingParticipationId}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </>
                )}

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="title"
                    name="title"
                    label="발주 제목"
                    variant="outlined"
                    value={formValues.title}
                    onChange={handleChange}
                    error={!!errors.title}
                    helperText={errors.title}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="예상 납품일"
                    value={formValues.expectedDeliveryDate}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        error: !!errors.expectedDeliveryDate,
                        helperText: errors.expectedDeliveryDate,
                        required: true
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="description"
                    name="description"
                    label="발주 설명"
                    variant="outlined"
                    value={formValues.description}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    placeholder="발주에 대한 상세 설명"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="terms"
                    name="terms"
                    label="계약 조건"
                    variant="outlined"
                    value={formValues.terms}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    placeholder="계약 조건 및 특이사항"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    공급자 및 금액 정보
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="supplierId"
                    name="supplierId"
                    label="공급자 ID"
                    variant="outlined"
                    value={formValues.supplierId}
                    disabled
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="supplierName"
                    name="supplierName"
                    label="공급자명"
                    variant="outlined"
                    value={formValues.supplierName}
                    disabled
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="quantity"
                    name="quantity"
                    label="수량"
                    variant="outlined"
                    type="number"
                    value={formValues.quantity}
                    disabled
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="unitPrice"
                    name="unitPrice"
                    label="단가"
                    variant="outlined"
                    type="number"
                    value={formValues.unitPrice}
                    disabled
                    required
                    InputProps={{
                      endAdornment: <Typography variant="body2">원</Typography>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="supplyPrice"
                    name="supplyPrice"
                    label="공급가액"
                    variant="outlined"
                    type="number"
                    value={formValues.supplyPrice}
                    disabled
                    InputProps={{
                      endAdornment: <Typography variant="body2">원</Typography>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="vat"
                    name="vat"
                    label="부가세"
                    variant="outlined"
                    type="number"
                    value={formValues.vat}
                    disabled
                    InputProps={{
                      endAdornment: <Typography variant="body2">원</Typography>
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="totalAmount"
                    name="totalAmount"
                    label="총액"
                    variant="outlined"
                    type="number"
                    value={formValues.totalAmount}
                    disabled
                    required
                    InputProps={{
                      endAdornment: <Typography variant="body2">원</Typography>
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ mt: 3, mb: 2 }} />
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleCancel}
                      startIcon={<CancelIcon />}
                      sx={{ mr: 2 }}>
                      취소
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      disabled={loading}>
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : isEdit ? (
                        "수정하기"
                      ) : (
                        "발주 생성"
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Paper>
      </div>
    </LocalizationProvider>
  );
};

export default BiddingOrderForm;
