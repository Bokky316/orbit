import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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
  Alert,
  Chip
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import moment from "moment";

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <form onSubmit={handleSubmit}>
        {/* 상단 네비게이션 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
          >
            입고 상세로 돌아가기
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          입고일, 담당자, 비고 정보만 수정 가능합니다. 다른 정보를 수정하려면 입고를 삭제 후 다시 등록해주세요.
        </Alert>

        {/* 입고 제목 및 상태 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h1">
              입고 번호 : {delivery.deliveryNumber}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', mt: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', mr: 4, alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>담당자:</Typography>
              <TextField
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                size="small"
                required
                variant="standard"
                sx={{ minWidth: 150 }}
              />
            </Box>
          </Box>
        </Paper>

        {/* 기본 정보 - 수정 가능 필드 통합 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <SectionTitle variant="h6">기본 정보</SectionTitle>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <InfoRow>
                <Typography className="label">발주 번호:</Typography>
                <Typography className="value">{delivery.orderNumber || '-'}</Typography>
              </InfoRow>
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
                        variant: "standard",
                        sx: { width: '70%' }
                      },
                    }}
                  />
                </LocalizationProvider>
              </InfoRow>
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoRow>
                <Typography className="label">공급업체명:</Typography>
                <Typography className="value">{delivery.supplierName || '-'}</Typography>
              </InfoRow>
              <InfoRow>
                <Typography className="label">입고 처리 시간:</Typography>
                <Typography className="value">
                  {delivery.createdAt ? moment(delivery.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
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
                <TableRow>
                  <TableCell>{delivery.deliveryItemId || "-"}</TableCell>
                  <TableCell>{delivery.itemName || "-"}</TableCell>
                  <TableCell>{delivery.itemQuantity || "-"}</TableCell>
                  <TableCell>{delivery.itemQuantity || "-"}</TableCell>
                  <TableCell>
                    {formatCurrency(delivery.itemUnitPrice)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(delivery.totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 금액 요약 */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderRadius: 1,
          }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
              총액: <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                {formatCurrency(delivery.totalAmount)}
              </span>
            </Typography>
          </Box>
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
            startIcon={<SaveIcon />}
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
      </form>
    </Container>
  );
};

export default DeliveryEditPage;