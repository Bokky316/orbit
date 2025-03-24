import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
  Autocomplete,
  Chip,
  Alert
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import moment from "moment";
import axios from "axios";

// 스타일 컴포넌트
const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  margin: theme.spacing(1, 0),
  '& .label': {
    width: '30%',
    fontWeight: 500,
    color: theme.palette.text.secondary
  },
  '& .value': {
    width: '70%'
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  margin: theme.spacing(2, 0, 1)
}));

// 금액 형식 변환 함수
const formatCurrency = (amount) => {
  if (!amount) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

const DeliveryCreatePage = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  // 상태 관리
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(moment());
  const [receiverName, setReceiverName] = useState(currentUser?.name || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    // Redux에 사용자 정보가 없으면 백엔드에서 가져오기
    if (currentUser?.name) {
      setReceiverName(currentUser.name);
    } else {
      axios.get("/api/members/me", { withCredentials: true })
        .then(response => {
          setReceiverName(response.data.name);
        })
        .catch(error => {
          console.error("사용자 정보를 불러오는 중 오류 발생:", error);
        });
    }
  }, [currentUser]);

  // 발주 목록 조회
  const fetchOrders = async (searchQuery = "") => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        searchQuery
          ? `${API_URL}orders/number/${encodeURIComponent(searchQuery)}` // 또는 다른 적절한 검색 엔드포인트
          : `${API_URL}orders/available-ids`
      );

      if (response.ok) {
        const data = await response.json();
        // 응답 데이터가 배열이 아닌 경우 배열로 변환
        const ordersArray = Array.isArray(data) ? data : data.content || [data];
        setOrders(ordersArray.filter((order) => order && order.id));
      } else {
        console.error("발주 목록 조회 실패:", response.status);
      }
    } catch (error) {
      console.error("발주 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 발주 목록 조회
  useEffect(() => {
    fetchOrders();
  }, []);

  // 발주 선택 시 상세 정보 조회
  const handleOrderSelect = async (event, newValue) => {
    setSelectedOrder(null);
    if (newValue) {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`${API_URL}orders/${newValue.id}/detail`);
        if (response.ok) {
          const data = await response.json();
          setSelectedOrder(data);
          setSearchText("");
        } else {
          console.error("발주 상세 조회 실패:", response.status);
        }
      } catch (error) {
        console.error("발주 상세 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 검색어 변경 시 실시간 검색
  const handleSearchInputChange = (event, newInputValue, reason) => {
    if (reason === "reset" || reason === "select-option") {
      return;
    }
    setSearchText(newInputValue);
  };

  // 검색어 변경 시 실시간 검색 (디바운스)
  useEffect(() => {
    if (!searchText || searchText.trim() === "") {
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchOrders(searchText);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrder) {
      alert("발주를 선택해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      // 요청 데이터 구성
      const requestData = {
        biddingOrderId: selectedOrder.id,
        deliveryDate: deliveryDate.format("YYYY-MM-DD"),
        receiverId: currentUser.id,
        receiverName: receiverName,
        supplierId: selectedOrder.supplierId,
        supplierName: selectedOrder.supplierName,
        purchaseRequestItemId: selectedOrder.purchaseRequestItem?.id || selectedOrder.purchaseRequestItemId || null,
        deliveryItemId: selectedOrder.purchaseRequestItem?.id || selectedOrder.purchaseRequestItemId || null,
        itemQuantity: selectedOrder.quantity,
        notes: notes
      };

      console.log("요청할 데이터:", JSON.stringify(requestData, null, 2));

      const response = await fetchWithAuth(`${API_URL}deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        alert("입고가 성공적으로 등록되었습니다.");
        navigate(`/deliveries/${data.id}`);
      } else {
        const errorData = await response.text();
        alert(`입고 등록 실패: ${errorData}`);
      }
    } catch (error) {
      alert(`오류 발생: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* 상단 네비게이션 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/deliveries")}
        >
          목록으로
        </Button>
      </Box>

      {/* 페이지 제목 및 상태 */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h1">
            입고 등록
          </Typography>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        {/* 발주 선택 영역 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <SectionTitle variant="h6">발주 선택</SectionTitle>
          <Divider sx={{ mb: 2 }} />

          <Autocomplete
            options={orders}
            getOptionLabel={(option) => `발주번호: ${option.orderNumber} - ${option.title || "제목 없음"}`}
            isOptionEqualToValue={(option, value) => option.orderNumber === value.orderNumber}
            onChange={handleOrderSelect}
            onInputChange={handleSearchInputChange}
            renderOption={(props, option) => (
              <li {...props} key={option.orderNumber}>
                발주번호: {option.orderNumber} - {option.title || "제목 없음"}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="발주 선택"
                placeholder="발주번호 또는 제목으로 검색..."
                helperText="입고 처리할 발주를 선택하세요"
              />
            )}
          />

          {!selectedOrder && (
            <Alert severity="info" sx={{ mt: 2 }}>
              발주를 선택하면 해당 정보가 자동으로 표시됩니다.
            </Alert>
          )}
        </Paper>

        {/* 발주 정보 영역 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <SectionTitle variant="h6">발주 정보</SectionTitle>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <InfoRow>
                <Typography className="label">발주번호:</Typography>
                <Typography className="value">
                  {selectedOrder ? selectedOrder.orderNumber || '-' : '미선택'}
                </Typography>
              </InfoRow>
              <InfoRow>
                <Typography className="label">발주일:</Typography>
                <Typography className="value">
                  {selectedOrder && selectedOrder.approvedAt
                    ? moment(selectedOrder.approvedAt).format('YYYY-MM-DD')
                    : '미선택'}
                </Typography>
              </InfoRow>
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoRow>
                <Typography className="label">공급업체명:</Typography>
                <Typography className="value">
                  {selectedOrder ? selectedOrder.supplierName || '-' : '미선택'}
                </Typography>
              </InfoRow>
              <InfoRow>
                <Typography className="label">총 금액:</Typography>
                <Typography className="value">
                  {selectedOrder && selectedOrder.totalAmount
                    ? formatCurrency(selectedOrder.totalAmount)
                    : '미선택'}
                </Typography>
              </InfoRow>
            </Grid>
          </Grid>
        </Paper>

        {/* 품목 정보 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <SectionTitle variant="h6">품목 정보</SectionTitle>
          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>품목ID</TableCell>
                  <TableCell>품목명</TableCell>
                  <TableCell>발주수량</TableCell>
                  <TableCell>입고수량</TableCell>
                  <TableCell>단가</TableCell>
                  <TableCell>총액</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedOrder ? (
                  <TableRow>
                    <TableCell>{selectedOrder?.purchaseRequestItem?.id || selectedOrder?.purchaseRequestItemId || '-'}</TableCell>
                    <TableCell>{selectedOrder.itemName || '-'}</TableCell>
                    <TableCell>{selectedOrder.quantity || '-'}</TableCell>
                    <TableCell>{selectedOrder.quantity || '-'}</TableCell>
                    <TableCell>
                      {selectedOrder.unitPrice ? formatCurrency(selectedOrder.unitPrice) : '-'}
                    </TableCell>
                    <TableCell>
                      {selectedOrder.totalAmount ? formatCurrency(selectedOrder.totalAmount) : '-'}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      발주를 선택하면 품목 정보가 표시됩니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 입고 정보 입력 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <SectionTitle variant="h6">입고 정보</SectionTitle>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={15} justifyContent="center">
            <Grid item xs={12} md={5}>
              <InfoRow>
                <Typography className="label">입고일:</Typography>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    value={deliveryDate}
                    onChange={(date) => setDeliveryDate(date)}
                    format="YYYY-MM-DD"
                    slotProps={{
                      textField: {
                        size: "small",
                        required: true,
                        helperText: "실제 입고된 날짜를 선택하세요",
                        sx: { width: '100%' }
                      },
                    }}
                  />
                </LocalizationProvider>
              </InfoRow>
            </Grid>
            <Grid item xs={12} md={5}>
              <InfoRow>
                <Typography className="label">담당자:</Typography>
                <TextField
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  size="small"
                  required
                  helperText="입고를 처리한 담당자 이름을 입력하세요"
                  sx={{ width: '100%' }}
                />
              </InfoRow>
            </Grid>
          </Grid>
        </Paper>

        {/* 비고 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <SectionTitle variant="h6">비고</SectionTitle>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            variant="filled"
            minRows={3}
            maxRows={6}
            placeholder="추가 정보가 있으면 입력하세요"
            margin="normal"
          />
        </Paper>

        {/* 하단 버튼 영역 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!selectedOrder || submitting}
            sx={{ minWidth: 120 }}
          >
            {submitting ? <CircularProgress size={24} /> : "입고 등록"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/deliveries")}
            sx={{ minWidth: 120 }}
          >
            취소
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default DeliveryCreatePage;