import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
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
  InputAdornment,
  Chip
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import moment from "moment";

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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* 헤더 영역 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            입고 등록
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/deliveries")}
          >
            목록으로
          </Button>
        </Box>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* 발주 선택 영역 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    발주 정보 선택
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Autocomplete
                    options={orders}
                    getOptionLabel={(option) => `발주번호: ${option.orderNumber} - ${option.title || "제목 없음"}`}
                    isOptionEqualToValue={(option, value) => option.orderNumber === value.orderNumber}
                    onChange={handleOrderSelect}
                    renderOption={(props, option) => (
                      <li {...props} key={option.orderNumber}>
                        발주번호: {option.orderNumber} - {option.title || "제목 없음"}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="발주 선택" />
                    )}
                  />
                </Grid>

                {/* 발주 정보 표시 - 항상 표시 */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ bgcolor: "#f9f9f9" }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        발주 정보
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            발주번호
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {selectedOrder ? (selectedOrder.orderNumber || `-`) : "미선택"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            공급업체명
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {selectedOrder ? (
                              <>
                                {selectedOrder.supplierName || `-`}
                              </>
                            ) : "미선택"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            발주일
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {selectedOrder ? (
                                selectedOrder.approvedAt ? moment(selectedOrder.approvedAt).format('YYYY-MM-DD') : `-`
                              ) : "미선택"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            총 금액
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {selectedOrder ? (
                              selectedOrder.totalAmount ? selectedOrder.totalAmount.toLocaleString() + " 원" : `-`
                            ) : "미선택"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 품목 정보 테이블 - 항상 표시 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    품목 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="10%" align="center">품목ID</TableCell>
                          <TableCell width="10%" align="center">품목명</TableCell>
                          <TableCell width="10%" align="center">발주수량</TableCell>
                          <TableCell width="10%" align="center">입고수량</TableCell>
                          <TableCell width="10%" align="center">단가</TableCell>
                          <TableCell width="10%" align="center">총액</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder ? (
                          <TableRow>
                            <TableCell align="center">{selectedOrder?.purchaseRequestItem?.id || selectedOrder?.purchaseRequestItemId || `-`}</TableCell>
                            <TableCell align="center">{selectedOrder.itemName || `-`}</TableCell>
                            <TableCell align="center">{selectedOrder.quantity || `-`}</TableCell>
                            <TableCell align="center">{selectedOrder.quantity || `-`}</TableCell>
                            <TableCell align="center">
                              {selectedOrder.unitPrice ? selectedOrder.unitPrice.toLocaleString() : `-`}
                            </TableCell>
                            <TableCell align="center">
                              {selectedOrder.totalAmount ? selectedOrder.totalAmount.toLocaleString() : `-`}
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
                </Grid>

                {/* 입고 정보 입력 영역 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    입고 정보 입력
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      label="입고일"
                      value={deliveryDate}
                      onChange={(date) => setDeliveryDate(date)}
                      format="YYYY-MM-DD"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          helperText: "실제 입고된 날짜를 선택하세요",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="입고 담당자"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    required
                    helperText="입고를 처리한 담당자 이름을 입력하세요"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="비고"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    multiline
                    rows={3}
                    helperText="추가 정보가 있으면 입력하세요"
                  />
                </Grid>

                {/* 버튼 영역 */}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
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
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default DeliveryCreatePage;