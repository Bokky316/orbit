import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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
  Alert
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from "@mui/icons-material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import moment from "moment";

const DeliveryEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  // 상태 관리
  const [delivery, setDelivery] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState(moment());
  const [receiverName, setReceiverName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 입고 정보 조회
  useEffect(() => {
    const fetchDeliveryDetail = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`${API_URL}deliveries/${id}`);

        if (!response.ok) {
          throw new Error(`입고 정보 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log('입고 정보 데이터:', data);
        setDelivery(data);

        // 입고일 설정
        if (data.deliveryDate) {
          setDeliveryDate(moment(data.deliveryDate));
        }

        // 담당자 설정
        setReceiverName(data.receiverName || currentUser?.name || "");

        // 비고 설정
        setNotes(data.notes || "");
      } catch (error) {
        console.error("입고 정보를 불러오는 중 오류 발생:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDeliveryDetail();
    }
  }, [id, currentUser]);

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!delivery) {
      alert("입고 정보가 없습니다.");
      return;
    }

    try {
      setSubmitting(true);

      // 요청 데이터 구성
      const requestData = {
        id: delivery.id,
        deliveryNumber: delivery.deliveryNumber,
        biddingOrderId: delivery.biddingOrderId || delivery.biddingOrder?.id,
        orderNumber: delivery.orderNumber,
        deliveryDate: deliveryDate.format("YYYY-MM-DD"),
        receiverId: delivery.receiverId || currentUser?.id,
        receiverName: receiverName,
        supplierId: delivery.supplierId,
        supplierName: delivery.supplierName,
        deliveryItemId: delivery.deliveryItemId,
        itemName: delivery.itemName,
        itemQuantity: delivery.itemQuantity,
        itemUnitPrice: delivery.itemUnitPrice,
        totalAmount: delivery.totalAmount,
        notes: notes
      };

      const response = await fetchWithAuth(`${API_URL}deliveries/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        alert("입고 정보가 성공적으로 수정되었습니다.");
        navigate(`/deliveries/${id}`);
      } else {
        const errorData = await response.text();
        throw new Error(`입고 수정 실패: ${errorData}`);
      }
    } catch (error) {
      alert(`오류 발생: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate(`/deliveries/${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          오류 발생: {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/deliveries")}
        >
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  if (!delivery) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          해당 입고 정보를 찾을 수 없습니다.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/deliveries")}
        >
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* 헤더 영역 */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" component="h1">
            입고 정보 수정
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
          >
            취소
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          입고일, 담당자, 비고 정보만 수정 가능합니다. 다른 정보를 수정하려면 입고를 삭제 후 다시 등록해주세요.
        </Alert>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* 입고 기본 정보 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    입고 기본 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Card variant="outlined" sx={{ bgcolor: "#f9f9f9" }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            입고번호
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {delivery.deliveryNumber || "-"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            발주번호
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {delivery.orderNumber || "-"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            공급업체명
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {delivery.supplierName || "-"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="subtitle2" color="text.secondary">
                            총액
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {delivery.totalAmount ? delivery.totalAmount.toLocaleString() + " 원" : "-"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 품목 정보 테이블 */}
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
                        <TableRow>
                          <TableCell align="center">{delivery.deliveryItemId || "-"}</TableCell>
                          <TableCell align="center">{delivery.itemName || "-"}</TableCell>
                          <TableCell align="center">{delivery.itemQuantity || "-"}</TableCell>
                          <TableCell align="center">{delivery.itemQuantity || "-"}</TableCell>
                          <TableCell align="center">
                            {delivery.itemUnitPrice ? delivery.itemUnitPrice.toLocaleString() : "-"}
                          </TableCell>
                          <TableCell align="center">
                            {delivery.totalAmount ? delivery.totalAmount.toLocaleString() : "-"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* 입고 정보 입력 영역 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    수정 가능한 정보
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
                      disabled={submitting}
                      sx={{ minWidth: 120 }}
                    >
                      {submitting ? <CircularProgress size={24} /> : "저장"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
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

export default DeliveryEditPage;