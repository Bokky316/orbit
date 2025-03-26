import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

// 계약 초안 생성 페이지
const ContractDraftPage = () => {
  const { id } = useParams(); // biddingId
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const biddingId = id || queryParams.get("biddingId");
  const participationId = queryParams.get("participationId");
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    contractTitle: "",
    contractNote: "",
    startDate: moment(),
    endDate: moment().add(3, "months"),
    totalAmount: "",
    supplierName: ""
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [biddingData, setBiddingData] = useState(null);
  const [error, setError] = useState(null);

  // 입찰 정보 가져오기
  useEffect(() => {
    const fetchBiddingData = async () => {
      if (!biddingId || !participationId) {
        setError("입찰 ID와 참여 ID가 필요합니다.");
        return;
      }

      setLoading(true);
      try {
        // 입찰 정보 API 호출
        const response = await fetchWithAuth(`${API_URL}biddings/${biddingId}`);

        if (!response.ok) {
          throw new Error("입찰 정보를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        console.log("입찰 데이터:", data);

        // 참여 정보 API 호출
        const participationResponse = await fetchWithAuth(
          `${API_URL}biddings/${biddingId}/participations/${participationId}`
        );

        if (!participationResponse.ok) {
          throw new Error("참여 정보를 불러오는데 실패했습니다.");
        }

        const participationData = await participationResponse.json();
        console.log("참여 데이터:", participationData);

        setBiddingData({
          ...data,
          participation: participationData
        });

        // 입찰 정보를 기반으로 폼 초기값 설정
        setFormData((prev) => ({
          ...prev,
          contractTitle: `${data.purchaseRequestItemName || "상품"} 구매 계약`,
          totalAmount: participationData.totalAmount
            ? participationData.totalAmount.toString()
            : data.totalAmount
            ? data.totalAmount.toString()
            : "",
          supplierName: participationData.companyName || ""
        }));

        setLoading(false);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    fetchBiddingData();
  }, [biddingId, participationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field, date) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  const handleCreateContract = async () => {
    // 유효성 검증
    if (!formData.contractTitle.trim()) {
      alert("계약 제목을 입력해주세요.");
      return;
    }

    setCreating(true);
    try {
      // 계약 초안 생성 API 호출
      const response = await fetchWithAuth(
        `${API_URL}bidding-contracts/draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            biddingId: biddingId,
            participationId: participationId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "계약 초안 생성에 실패했습니다.");
      }

      const result = await response.json();
      console.log("계약 초안 생성 결과:", result);

      // 생성된 계약 정보 업데이트
      const updateResponse = await fetchWithAuth(
        `${API_URL}bidding-contracts/${result.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: result.id,
            title: formData.contractTitle,
            note: formData.contractNote,
            startDate: formData.startDate.format("YYYY-MM-DD"),
            endDate: formData.endDate.format("YYYY-MM-DD"),
            totalAmount: parseFloat(formData.totalAmount.replace(/,/g, ""))
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || "계약 정보 업데이트에 실패했습니다."
        );
      }

      const updatedContract = await updateResponse.json();

      alert("계약 초안이 생성되었습니다.");
      navigate(`/contracts/${updatedContract.id}`);
    } catch (err) {
      console.error("계약 생성 실패:", err);
      alert(`계약 생성 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // 금액 포맷팅
  const formatCurrency = (value) => {
    if (!value) return "";
    // 숫자만 추출
    const numericValue = value.replace(/[^\d]/g, "");
    // 천 단위 콤마 추가
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatCurrency(value);
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  if (loading) {
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
      <Typography variant="h4" gutterBottom>
        계약 초안 생성
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" color="text.secondary">
          입찰번호: {biddingData?.bidNumber || "-"}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 계약 기본 정보 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="계약 제목"
                name="contractTitle"
                value={formData.contractTitle}
                onChange={handleChange}
                margin="normal"
                required
              />

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      label="계약 시작일"
                      value={formData.startDate}
                      onChange={(newDate) =>
                        handleDateChange("startDate", newDate)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          margin: "normal"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      label="계약 종료일"
                      value={formData.endDate}
                      onChange={(newDate) =>
                        handleDateChange("endDate", newDate)
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          margin: "normal"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="계약 금액"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleCurrencyChange}
                margin="normal"
                InputProps={{
                  endAdornment: <Typography variant="body2">원</Typography>
                }}
              />

              <TextField
                fullWidth
                label="공급업체"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                margin="normal"
                disabled
              />
            </CardContent>
          </Card>
        </Grid>

        {/* 계약 세부 정보 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                계약 세부 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="계약 비고"
                name="contractNote"
                value={formData.contractNote}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={4}
                placeholder="계약에 관한 추가 정보나 비고 사항을 입력하세요"
              />

              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom>
                  계약 상태
                </Typography>
                <Chip label="초안" color="default" />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom>
                  서명 상태
                </Typography>
                <Chip label="미서명" color="default" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 계약 조항 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                기본 계약 조항
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                계약 초안 생성 시 기본 계약 조항이 자동으로 추가됩니다. 계약
                생성 후 상세 페이지에서 조항을 확인하고 필요시 수정할 수
                있습니다.
              </Alert>

              <Typography variant="body2" color="text.secondary">
                1. 계약 목적
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2. 계약 금액 및 지불 조건
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. 계약 기간
              </Typography>
              <Typography variant="body2" color="text.secondary">
                4. 계약 당사자의 의무
              </Typography>
              <Typography variant="body2" color="text.secondary">
                5. 계약 해지 및 변경
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          disabled={creating}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateContract}
          disabled={creating}>
          {creating ? "생성 중..." : "계약 초안 생성"}
        </Button>
      </Box>
    </Box>
  );
};

export default ContractDraftPage;
