import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  IconButton,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Search as SearchIcon } from "@mui/icons-material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import moment from "moment";

const DeliveryCreatePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  // 상태 관리
  const [biddingOrders, setBiddingOrders] = useState([]); // 발주 목록
  const [selectedOrder, setSelectedOrder] = useState(null); // 선택된 발주 정보
  const [deliveryDate, setDeliveryDate] = useState(moment());
  const [manager, setManager] = useState(currentUser?.name || "");
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // 발주 목록 조회
  const fetchBiddingOrders = async (searchQuery = "") => {
    try {
      setLoading(true);
      // 여기서 경로 변경: 이제 available-ids 엔드포인트를 사용
      const response = await fetchWithAuth(
        searchQuery
          ? `${API_URL}orders/search?query=${encodeURIComponent(searchQuery)}`
          : `${API_URL}orders/available-ids`
      );
      console.log("발주 목록 조회 응답:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("발주 목록 데이터:", data);
        // 응답 데이터가 배열이 아닌 경우 배열로 변환
        const ordersArray = Array.isArray(data) ? data : data.content || [data];
        console.log("변환된 발주 목록:", ordersArray);
        setBiddingOrders(ordersArray.filter((order) => order && order.id));
      }
    } catch (error) {
      console.error("발주 목록 조회 실패:", error);
      setBiddingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 발주 목록 조회
  useEffect(() => {
    fetchBiddingOrders();
  }, []);

  // 발주 선택 시 상세 정보 조회
  const handleOrderSelect = async (event, newValue) => {
    setSelectedOrder(null); // 기존 선택 초기화
    if (newValue) {
      try {
        // 여기서 경로 변경: 이제 detail 엔드포인트를 사용
        const response = await fetchWithAuth(
          `${API_URL}orders/${newValue.id}/detail`
        );
        if (response.ok) {
          const data = await response.json();
          setSelectedOrder(data);
          setSearchText(""); // 검색어 초기화
        }
      } catch (error) {
        console.error("발주 정보 조회 실패:", error);
      }
    }
  };

  // 검색어 변경 시 실시간 검색
  const handleSearchInputChange = (event, newInputValue, reason) => {
    // 선택 이벤트나 clear 이벤트인 경우 무시
    if (reason === "reset" || reason === "select-option") {
      return;
    }
    setSearchText(newInputValue);
  };

  // 검색어 변경 시 실시간 검색 (디바운스)
  useEffect(() => {
    // 빈 검색어인 경우 요청하지 않음
    if (!searchText || searchText.trim() === "") {
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchBiddingOrders(searchText);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrder) {
      alert("발주를 선택해주세요.");
      return;
    }

    // 요청 데이터 구성
    const requestData = {
      biddingOrderId: selectedOrder.id,
      deliveryDate: deliveryDate.format("YYYY-MM-DD"),
      receiverId: currentUser.id,
      supplierId: selectedOrder.supplierId,
      supplierName: selectedOrder.supplierName,
      deliveryItemId:
        selectedOrder.purchaseRequestItem?.itemId || selectedOrder.itemId,
      totalAmount: selectedOrder.totalAmount,
      notes: "",
    };

    try {
      console.log("입고 등록 요청 데이터:", requestData);
      const response = await fetchWithAuth(`${API_URL}deliveries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        alert("입고가 성공적으로 등록되었습니다.");
        navigate("/deliveries");
      } else {
        const errorData = await response.text();
        alert(`오류 발생: ${errorData}`);
      }
    } catch (error) {
      alert(`오류 발생: ${error.message}`);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          입고 등록 (자동 검수 완료)
        </Typography>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* 발주 선택 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    발주 정보 선택
                  </Typography>
                  `
                  <Autocomplete
                    options={biddingOrders}
                    value={selectedOrder}
                    getOptionLabel={(option) => {
                      if (!option) return "";
                      return `발주 #${option.id} - ${
                        option.title || "제목 없음"
                      }`;
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return false;
                      // ID와 title로 비교하여 정확한 매칭
                      return (
                        option.id === value.id && option.title === value.title
                      );
                    }}
                    onChange={handleOrderSelect}
                    onInputChange={handleSearchInputChange}
                    loading={loading}
                    blurOnSelect={true}
                    clearOnBlur={true}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        발주 #{option.id} - {option.title || "제목 없음"}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="발주 선택"
                        required
                        helperText="발주 번호와 제목으로 검색"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* 발주 정보 표시 */}
                {selectedOrder && (
                  <>
                    <Grid item xs={12}>
                      <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="subtitle1">
                              발주 정보
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography>
                              발주번호: {selectedOrder.orderNumber}
                            </Typography>
                            <Typography>
                              공급업체: {selectedOrder.supplierName}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography>
                              발주일:{" "}
                              {moment(selectedOrder.orderDate).format(
                                "YYYY-MM-DD"
                              )}
                            </Typography>
                            <Typography>
                              품목: {selectedOrder.itemName || "품목 정보 없음"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>

                    {/* 품목 정보 테이블 */}
                    <Grid item xs={12}>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>품목</TableCell>
                              <TableCell>규격</TableCell>
                              <TableCell align="right">발주수량</TableCell>
                              <TableCell align="right">입고수량</TableCell>
                              <TableCell align="right">단가</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                {selectedOrder.itemName || "품목 정보 없음"}
                              </TableCell>
                              <TableCell>
                                {selectedOrder.specification || "-"}
                              </TableCell>
                              <TableCell align="right">
                                {selectedOrder.quantity}
                              </TableCell>
                              <TableCell align="right">
                                {selectedOrder.quantity}
                              </TableCell>
                              <TableCell align="right">
                                {selectedOrder.totalAmount?.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </>
                )}

                {/* 입고 정보 입력 */}
                <Grid item xs={6}>
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
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="담당자"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    required
                  />
                </Grid>

                {/* 버튼 */}
                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", justifyContent: "center", gap: 2 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!selectedOrder || loading}
                      sx={{ minWidth: 120 }}
                    >
                      등록
                    </Button>
                    <Button
                      variant="contained"
                      color="inherit"
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