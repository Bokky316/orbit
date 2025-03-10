import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Grid, Box, Divider, Chip, Table,
  TableHead, TableBody, TableRow, TableCell, Button, TextField,
  CircularProgress, Alert, Tooltip, Stack, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";

// 결과별 스타일 정보
const resultStatusMap = {
  "검수대기": { color: "default", icon: <HistoryIcon />, text: "검수대기" },
  "합격": { color: "success", icon: <CheckCircleIcon />, text: "합격" },
  "불합격": { color: "error", icon: <ErrorIcon />, text: "불합격" },
  "반품요청": { color: "warning", icon: <WarningIcon />, text: "반품요청" },
  "재검수요청": { color: "info", icon: <InfoIcon />, text: "재검수요청" }
};

// 평가 상태별 스타일
const evaluationStatusStyles = {
  "정상": { color: "success.main", bgcolor: "success.light", icon: <CheckCircleIcon fontSize="small" /> },
  "양호": { color: "success.main", bgcolor: "success.light", icon: <CheckCircleIcon fontSize="small" /> },
  "일치": { color: "success.main", bgcolor: "success.light", icon: <CheckCircleIcon fontSize="small" /> },
  "부족": { color: "error.main", bgcolor: "error.light", icon: <ErrorIcon fontSize="small" /> },
  "불량": { color: "error.main", bgcolor: "error.light", icon: <ErrorIcon fontSize="small" /> },
  "불일치": { color: "error.main", bgcolor: "error.light", icon: <ErrorIcon fontSize="small" /> },
  "초과": { color: "warning.main", bgcolor: "warning.light", icon: <WarningIcon fontSize="small" /> }
};

const InspectionDetailPage = ({ userRole = "BUYER" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [contract, setContract] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState("");

  // 데이터 로드
  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        setLoading(true);

        // 실제 구현에서는 API 호출로 대체
        // const response = await fetch(`/api/inspections/${id}`);
        // if (!response.ok) throw new Error('검수 정보 로드 실패');
        // const data = await response.json();

        // 샘플 데이터 (실제로는 API 응답으로 대체)
        setTimeout(() => {
          // 검수 정보
          const inspectionData = {
            id: id,
            contract_id: "CNT-2025-003",
            inspector_id: "USR-123",
            inspector_name: "홍길동",
            inspection_date: "2025-03-08",
            result: "불합격",
            comments: "포장이 손상된 상태로 배송되어 불합격 처리합니다. 내부 제품은 이상 없으나 포장 상태가 고객에게 제공하기에 적절하지 않습니다.",
            quantity_status: "정상",
            quality_status: "양호",
            packaging_status: "불량",
            spec_match_status: "일치",
            created_at: "2025-03-08T14:30:00",
            updated_at: "2025-03-08T15:45:00"
          };

          // 계약 정보 (관련 테이블)
          const contractData = {
            id: "CNT-2025-003",
            transaction_number: "TR-2025-003",
            supplier_id: "SUP-456",
            supplier_name: "ABC 공급업체",
            product_name: "비타민C 정제",
            product_spec: "500mg, 100정",
            start_date: "2025-02-01",
            end_date: "2025-12-31",
            total_amount: 500000,
            quantity: 100,
            unit_price: 5000,
            delivery_date: "2025-03-05",
            actual_delivery_date: "2025-03-04",
            status: "활성"
          };

          // 검수 관련 첨부파일
          const filesData = [
            { id: 1, inspection_id: id, file_path: "/uploads/inspections/report_123.pdf", file_name: "검수보고서.pdf", file_type: "application/pdf", file_size: 1024000, upload_date: "2025-03-08T15:30:00", description: "검수 보고서" },
            { id: 2, inspection_id: id, file_path: "/uploads/inspections/package_img.jpg", file_name: "포장상태사진.jpg", file_type: "image/jpeg", file_size: 2048000, upload_date: "2025-03-08T15:35:00", description: "손상된 포장 사진" }
          ];

          setInspection(inspectionData);
          setContract(contractData);
          setFiles(filesData);
          setLoading(false);
        }, 800); // 로딩 시뮬레이션

      } catch (err) {
        console.error('데이터 로드 오류:', err);
        setError('검수 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchInspectionData();
  }, [id]);

  // 작업 처리 (재검수 요청, 반품 요청 등)
  const handleAction = async (type) => {
    setActionType(type);
    setDialogOpen(true);
  };

  // 작업 확인
  const handleConfirmAction = async () => {
    try {
      setDialogOpen(false);

      // API 호출 로직 (실제 구현에서 대체)
      // const response = await fetch(`/api/inspections/${id}/actions`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action: actionType })
      // });

      // 임시 상태 업데이트
      if (actionType === "reinspection") {
        setInspection({ ...inspection, result: "재검수요청" });
      } else if (actionType === "return") {
        setInspection({ ...inspection, result: "반품요청" });
      }

      // 알림 표시 등 추가 UI 피드백
    } catch (err) {
      console.error('작업 처리 오류:', err);
    }
  };

  // 뒤로 가기
  const handleGoBack = () => {
    navigate(-1);
  };

  // 로딩 중
  if (loading) return (
    <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <CircularProgress />
    </Container>
  );

  // 오류 발생
  if (error) return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        sx={{ mt: 2 }}
      >
        목록으로 돌아가기
      </Button>
    </Container>
  );

  // 데이터 없음
  if (!inspection || !contract) return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Alert severity="warning">검수 정보를 찾을 수 없습니다.</Alert>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        sx={{ mt: 2 }}
      >
        목록으로 돌아가기
      </Button>
    </Container>
  );

  // 상태 정보 가져오기
  const statusInfo = resultStatusMap[inspection.result] || resultStatusMap["검수대기"];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        {/* 헤더 영역 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            size="small"
            onClick={handleGoBack}
          >
            목록
          </Button>

          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>
            검수 상세 정보
          </Typography>

          <Chip
            icon={statusInfo.icon}
            label={statusInfo.text}
            color={statusInfo.color}
            size="medium"
            sx={{ fontWeight: 'bold', px: 1 }}
          />
        </Box>

        {/* 계약/검수 기본 정보 카드 */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">계약 번호</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{contract.transaction_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">공급업체</Typography>
                <Typography variant="body1">{contract.supplier_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">검수자</Typography>
                <Typography variant="body1">{inspection.inspector_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">검수일</Typography>
                <Typography variant="body1">{inspection.inspection_date}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">예상 납기일</Typography>
                <Typography variant="body1">{contract.delivery_date}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">실제 납기일</Typography>
                <Typography variant="body1">{contract.actual_delivery_date}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 제품 정보 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InventoryIcon color="primary" /> 제품 정보
          </Typography>
          <Divider sx={{ mb: 2 }} />

         <Grid container spacing={2}>
           <Grid item xs={6} sm={2.4}>
             <Typography variant="body2" color="text.secondary">품목명</Typography>
             <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{contract.product_name}</Typography>
           </Grid>
           <Grid item xs={6} sm={2.4}>
             <Typography variant="body2" color="text.secondary">규격</Typography>
             <Typography variant="body1">{contract.product_spec}</Typography>
           </Grid>
           <Grid item xs={4} sm={2.4}>
             <Typography variant="body2" color="text.secondary">수량</Typography>
             <Typography variant="body1">{contract.quantity}개</Typography>
           </Grid>
           <Grid item xs={4} sm={2.4}>
             <Typography variant="body2" color="text.secondary">단가</Typography>
             <Typography variant="body1">{contract.unit_price.toLocaleString()}원</Typography>
           </Grid>
           <Grid item xs={4} sm={2.4}>
             <Typography variant="body2" color="text.secondary">총 금액</Typography>
             <Typography variant="body1">{contract.total_amount.toLocaleString()}원</Typography>
           </Grid>
         </Grid>
        </Box>

        {/* 검수 평가 결과 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ReceiptIcon color="primary" /> 검수 평가 결과
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell><strong>평가 항목</strong></TableCell>
                  <TableCell><strong>결과</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: "수량 상태", field: "quantity_status" },
                  { label: "품질 상태", field: "quality_status" },
                  { label: "포장 상태", field: "packaging_status" },
                  { label: "규격 일치 여부", field: "spec_match_status" }
                ].map(({ label, field }) => {
                  const status = inspection[field];
                  const style = evaluationStatusStyles[status] || {};

                  return (
                    <TableRow key={field}>
                      <TableCell>{label}</TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: style.color,
                          backgroundColor: style.bgcolor,
                          borderRadius: 1,
                          px: 1,
                          py: 0.5
                        }}>
                          {style.icon}
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {status}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* 검수 의견 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoIcon color="primary" /> 검수 의견
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TextField
            fullWidth
            multiline
            rows={4}
            value={inspection.comments || ""}
            InputProps={{ readOnly: true }}
            variant="outlined"
          />
        </Box>

        {/* 첨부 파일 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AttachFileIcon color="primary" /> 첨부 파일
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {files && files.length > 0 ? (
            <Stack spacing={1}>
              {files.map((file) => (
                <Button
                  key={file.id}
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  href={file.file_path}
                  download={file.file_name}
                >
                  <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                    <Typography variant="body2" noWrap>{file.file_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.description} ({(file.file_size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">첨부된 파일이 없습니다.</Typography>
          )}
        </Box>

        {/* 작업 버튼 영역 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, flexWrap: 'wrap' }}>
          {/* 공급자만 볼 수 있는 버튼 */}
          {userRole === "SUPPLIER" && inspection.result === "불합격" && (
            <>
              <Button
                variant="contained"
                color="info"
                startIcon={<InfoIcon />}
                onClick={() => handleAction("reinspection")}
              >
                재검수 요청
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<LocalShippingIcon />}
                onClick={() => handleAction("return")}
              >
                반품 요청
              </Button>
            </>
          )}

          {/* 검수자/관리자만 볼 수 있는 버튼 */}
          {(userRole === "BUYER" || userRole === "ADMIN") && inspection.result === "재검수요청" && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate(`/inspections/${id}/edit`)}
            >
              재검수 수행
            </Button>
          )}

          {/* 모든 사용자가 볼 수 있는 버튼 */}
          <Button
            variant="outlined"
            onClick={handleGoBack}
          >
            목록으로 돌아가기
          </Button>
        </Box>
      </Paper>

      {/* 작업 확인 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>
          {actionType === "reinspection" ? "재검수 요청" : "반품 요청"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === "reinspection"
              ? "해당 검수에 대해 재검수를 요청하시겠습니까? 요청 후에는 검수자에게 알림이 전송됩니다."
              : "해당 제품에 대해 반품을 요청하시겠습니까? 요청 후에는 구매자에게 알림이 전송됩니다."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="inherit">취소</Button>
          <Button onClick={handleConfirmAction} color="primary" variant="contained" autoFocus>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InspectionDetailPage;