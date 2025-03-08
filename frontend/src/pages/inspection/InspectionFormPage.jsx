import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
<<<<<<< HEAD
  Container, Paper, Typography, Grid, Box, Divider, Chip, Table,
  TableHead, TableBody, TableRow, TableCell, Button, TextField,
  CircularProgress, Alert, Tooltip, Stack, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  Select, MenuItem, IconButton, FormControl, InputLabel
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InventoryIcon from "@mui/icons-material/Inventory";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// 결과별 스타일 정보
const resultStatusMap = {
  "검수대기": { color: "default", icon: <HistoryIcon />, text: "검수대기" },
  "합격": { color: "success", icon: <CheckCircleIcon />, text: "합격" },
  "불합격": { color: "error", icon: <ErrorIcon />, text: "불합격" },
  "반품요청": { color: "warning", icon: <WarningIcon />, text: "반품요청" },
  "재검수요청": { color: "info", icon: <InfoIcon />, text: "재검수요청" }
};

// 평가 항목 옵션과 스타일
const evaluationOptions = {
  "quantity_status": [
    { value: "정상", color: "success.main", icon: <CheckCircleIcon fontSize="small" /> },
    { value: "부족", color: "error.main", icon: <ErrorIcon fontSize="small" /> },
    { value: "초과", color: "warning.main", icon: <WarningIcon fontSize="small" /> }
  ],
  "quality_status": [
    { value: "양호", color: "success.main", icon: <CheckCircleIcon fontSize="small" /> },
    { value: "불량", color: "error.main", icon: <ErrorIcon fontSize="small" /> }
  ],
  "packaging_status": [
    { value: "양호", color: "success.main", icon: <CheckCircleIcon fontSize="small" /> },
    { value: "불량", color: "error.main", icon: <ErrorIcon fontSize="small" /> }
  ],
  "spec_match_status": [
    { value: "일치", color: "success.main", icon: <CheckCircleIcon fontSize="small" /> },
    { value: "불일치", color: "error.main", icon: <ErrorIcon fontSize="small" /> }
  ]
};
=======
  Container, Paper, Typography, Grid, Box, Divider, Chip, Table, TableHead, TableBody, TableRow, TableCell, Button, Checkbox, TextField, Select, MenuItem
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
>>>>>>> 8b696b94 (feat: 검수 페이지 추가 및 개선)

const InspectionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
<<<<<<< HEAD
  const [contract, setContract] = useState(null);
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [formChanged, setFormChanged] = useState(false);

  // 유효성 검사 상태
  const [validation, setValidation] = useState({
    quantity_status: true,
    quality_status: true,
    packaging_status: true,
    spec_match_status: true,
    result: true,
    comments: true
  });

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
            inspection_date: new Date().toISOString().split('T')[0],
            result: id.includes("new") ? "" : "불합격",
            comments: id.includes("new") ? "" : "포장이 손상된 상태로 배송되어 불합격 처리합니다. 내부 제품은 이상 없으나 포장 상태가 고객에게 제공하기에 적절하지 않습니다.",
            quantity_status: id.includes("new") ? "" : "정상",
            quality_status: id.includes("new") ? "" : "양호",
            packaging_status: id.includes("new") ? "" : "불량",
            spec_match_status: id.includes("new") ? "" : "일치",
            created_at: "2025-03-08T14:30:00",
            updated_at: "2025-03-08T15:45:00",
            status: id.includes("new") ? "검수대기" : "재검수요청"
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

          setInspection(inspectionData);
          setContract(contractData);
          setComments(inspectionData.comments || "");
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

  // 입력 필드 변경 핸들러
  const handleEvaluationChange = (field, value) => {
    setInspection(prev => ({ ...prev, [field]: value }));
    setValidation(prev => ({ ...prev, [field]: value !== "" }));
    setFormChanged(true);
  };

  // 검수 결과 변경 핸들러
  const handleResultChange = (event) => {
    setInspection(prev => ({ ...prev, result: event.target.value }));
    setValidation(prev => ({ ...prev, result: event.target.value !== "" }));
    setFormChanged(true);
  };

  // 검수 의견 변경 핸들러
  const handleCommentsChange = (e) => {
    setComments(e.target.value);
    setValidation(prev => ({ ...prev, comments: e.target.value.trim() !== "" }));
    setFormChanged(true);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
      setFormChanged(true);
    }
  };

  // 파일 삭제 핸들러
  const handleFileDelete = (indexToDelete) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToDelete));
    setFormChanged(true);
  };

  // 폼 검증
  const validateForm = () => {
    const newValidation = {
      quantity_status: inspection.quantity_status !== "",
      quality_status: inspection.quality_status !== "",
      packaging_status: inspection.packaging_status !== "",
      spec_match_status: inspection.spec_match_status !== "",
      result: inspection.result !== "",
      comments: comments.trim() !== ""
    };

    setValidation(newValidation);
    return Object.values(newValidation).every(v => v === true);
  };

  // 검수 결과 제출 핸들러
  const handleSubmit = () => {
    if (validateForm()) {
      setConfirmDialogOpen(true);
    } else {
      // 스크롤을 첫 번째 오류 필드로 이동
      const firstErrorField = Object.keys(validation).find(key => !validation[key]);
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // 제출 확인
  const handleConfirmSubmit = async () => {
    try {
      setConfirmDialogOpen(false);

      // 실제 API 호출 로직
      // const formData = new FormData();
      // formData.append('inspectionId', id);
      // formData.append('quantity_status', inspection.quantity_status);
      // formData.append('quality_status', inspection.quality_status);
      // formData.append('packaging_status', inspection.packaging_status);
      // formData.append('spec_match_status', inspection.spec_match_status);
      // formData.append('result', inspection.result);
      // formData.append('comments', comments);

      // attachments.forEach(file => {
      //   formData.append('attachments', file);
      // });

      // const response = await fetch(`/api/inspections/${id}`, {
      //   method: 'PUT',
      //   body: formData
      // });

      // if (!response.ok) throw new Error('검수 결과 저장 실패');

      console.log("검수 결과 저장 성공:", {
        quantity_status: inspection.quantity_status,
        quality_status: inspection.quality_status,
        packaging_status: inspection.packaging_status,
        spec_match_status: inspection.spec_match_status,
        result: inspection.result,
        comments: comments,
        attachments: attachments.map(f => f.name)
      });

      // 데이터 저장 후 목록 페이지로 이동
      navigate('/inspections');

    } catch (err) {
      console.error('검수 결과 저장 오류:', err);
      setError('검수 결과 저장에 실패했습니다.');
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (formChanged) {
      setCancelDialogOpen(true);
    } else {
      navigate(-1);
    }
  };

  // 취소 확인
  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    navigate(-1);
  };

  // 뒤로 가기
  const handleGoBack = () => {
    if (formChanged) {
      setCancelDialogOpen(true);
    } else {
      navigate(-1);
    }
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
        onClick={() => navigate(-1)}
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
        onClick={() => navigate(-1)}
        sx={{ mt: 2 }}
      >
        목록으로 돌아가기
      </Button>
    </Container>
  );

  // 상태 정보 가져오기
  const statusInfo = resultStatusMap[inspection.status] || resultStatusMap["검수대기"];

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
            {id.includes("new") ? "검수 결과 등록" : "검수 결과 수정"}
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
        <Box sx={{ mb: 4 }} id="evaluation-section">
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ReceiptIcon color="primary" /> 검수 평가
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell width="30%"><strong>평가 항목</strong></TableCell>
                  <TableCell><strong>결과</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: "수량 상태", field: "quantity_status", options: evaluationOptions.quantity_status },
                  { label: "품질 상태", field: "quality_status", options: evaluationOptions.quality_status },
                  { label: "포장 상태", field: "packaging_status", options: evaluationOptions.packaging_status },
                  { label: "규격 일치 여부", field: "spec_match_status", options: evaluationOptions.spec_match_status }
                ].map(({ label, field, options }) => (
                  <TableRow key={field}>
                    <TableCell>
                      {label}
                      {!validation[field] && (
                        <Typography color="error" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          * 필수 항목입니다
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth id={field} error={!validation[field]}>
                        <Select
                          value={inspection[field] || ""}
                          onChange={(e) => handleEvaluationChange(field, e.target.value)}
                          displayEmpty
                          renderValue={(selected) => {
                            if (!selected) {
                              return <Typography color="text.secondary">선택하세요</Typography>;
                            }

                            const option = options.find(opt => opt.value === selected);
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: option?.color }}>
                                {option?.icon}
                                <Typography fontWeight="medium">{selected}</Typography>
                              </Box>
                            );
                          }}
                        >
                          <MenuItem value="" disabled>선택하세요</MenuItem>
                          {options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: option.color }}>
                                {option.icon}
                                <Typography>{option.value}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* 검수 결과 선택 */}
        <Box sx={{ mb: 4 }} id="result">
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoIcon color="primary" /> 검수 결과
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <FormControl fullWidth error={!validation.result}>
            <InputLabel>검수 결과</InputLabel>
            <Select
              value={inspection.result || ""}
              onChange={handleResultChange}
              label="검수 결과"
            >
              <MenuItem value="" disabled>선택하세요</MenuItem>
              <MenuItem value="합격">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                  <CheckCircleIcon />
                  <Typography>합격</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="불합격">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                  <ErrorIcon />
                  <Typography>불합격</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="반품요청">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                  <WarningIcon />
                  <Typography>반품요청</Typography>
                </Box>
              </MenuItem>
            </Select>
            {!validation.result && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 1.5 }}>
                * 검수 결과를 선택해주세요
              </Typography>
            )}
          </FormControl>
        </Box>

        {/* 검수 의견 섹션 */}
        <Box sx={{ mb: 4 }} id="comments">
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoIcon color="primary" /> 검수 의견
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TextField
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={handleCommentsChange}
            placeholder="검수 의견을 입력하세요."
            error={!validation.comments}
            helperText={!validation.comments ? "검수 의견을 입력해주세요" : ""}
          />
        </Box>

        {/* 첨부 파일 섹션 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AttachFileIcon color="primary" /> 첨부 파일
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {attachments.length > 0 ? (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {attachments.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                    <AttachFileIcon color="action" />
                    <Typography variant="body2" noWrap>{file.name || `파일_${index + 1}`}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleFileDelete(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ mb: 2 }}>첨부된 파일이 없습니다.</Typography>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            component="label"
          >
=======
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [returnRequested, setReturnRequested] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  useEffect(() => {
    setInspection({
          id,
          contractId: "CNT-2025-003",
          supplierName: "ABC 공급업체",
          productName: "비타민C",
          quantity: 100,
          expectedDelivery: "2025-03-05",
          actualDelivery: "2025-03-04",
          unitPrice: 5000,
          totalAmount: 500000,
          trackingInfo: "TRACK123456789",
          productSpec: "500mg, 100정",
          inspectionDate: "2025-03-08",
          inspectorName: "홍길동",
          status: "대기중",
          quantity_status: "부족",
          quality_status: "양호",
          packaging_status: "불량",
          spec_match_status: "일치",
          result: "불합격",
          returnReason: "포장 손상됨",
          attachments: ["파일_123.pdf"]
        });
      }, [id]);

  const handleEvaluationChange = (index, field, value) => {
    const updatedEvaluation = [...inspection.evaluation];
    updatedEvaluation[index][field] = value;
    setInspection({ ...inspection, evaluation: updatedEvaluation });
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

    // ✅ 검수 상태 변경 핸들러
    const handleResultChange = (event) => {
      setInspection({ ...inspection, result: event.target.value });
    };

    // ✅ 검수 결과 선택 옵션 (역할에 따라 다르게 표시)
    const getResultOptions = () => {
      return ["합격", "불합격", "반품 요청"];
    };

    // ✅ 검수 결과 등록 핸들러
    const handleSubmit = () => {
      console.log("검수 결과 저장:", inspection.result);
      console.log("검수 의견:", comments);
      navigate(-1); // 이전 페이지로 이동
    };

  if (!inspection) return <p>로딩 중...</p>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>🔍 검수 결과 등록</Typography>

        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Chip label={inspection.status} color="warning" sx={{ fontSize: 16, px: 2, py: 1 }} />
          <Typography variant="subtitle1"><strong>검수자:</strong> {inspection.inspectorName}</Typography>
          <Typography variant="subtitle1"><strong>검수일자:</strong> {inspection.inspectionDate}</Typography>
        </Box>

        {/* 검수 정보 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📌 검수 정보</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography><strong>계약 번호:</strong> {inspection.contractId}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>공급업체:</strong> {inspection.supplierName}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>품목명:</strong> {inspection.productName}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>수량:</strong> {inspection.quantity}개</Typography></Grid>
            <Grid item xs={6}><Typography><strong>예상 납기:</strong> {inspection.expectedDelivery}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>실제 납기:</strong> {inspection.actualDelivery}</Typography></Grid>
          </Grid>
        </Box>

        {/* 검수 항목 평가 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📋 검수 항목 평가</Typography>
          <Divider sx={{ mb: 2 }} />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>항목</strong></TableCell>
                <TableCell><strong>평가 결과</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { label: "수량 상태", field: "quantity_status", options: ["정상", "부족", "초과"] },
                { label: "품질 상태", field: "quality_status", options: ["양호", "불량"] },
                { label: "포장 상태", field: "packaging_status", options: ["양호", "불량"] },
                { label: "규격 일치 여부", field: "spec_match_status", options: ["일치", "불일치"] }
              ].map(({ label, field, options }) => (
                <TableRow key={field}>
                  <TableCell>{label}</TableCell>
                  <TableCell>
                    <Select
                      fullWidth
                      value={inspection[field] || ""}
                      onChange={(e) => handleEvaluationChange(field, e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">선택</MenuItem>
                      {options.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* 검수 의견 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📝 검수 의견</Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            multiline
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="검수 의견을 입력하세요."
          />
        </Box>

        {/* 첨부 파일 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📎 첨부 파일</Typography>
          <Divider sx={{ mb: 2 }} />
          {attachments.map((file, index) => (
            <Button key={index} variant="outlined" startIcon={<AttachFileIcon />}>
              {file.name}
            </Button>
          ))}
          <Button variant="outlined" component="label">
>>>>>>> 8b696b94 (feat: 검수 페이지 추가 및 개선)
            파일 추가
            <input type="file" hidden multiple onChange={handleFileUpload} />
          </Button>
        </Box>

<<<<<<< HEAD
        {/* 제출 버튼 영역 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            size="large"
          >
            저장하기
          </Button>
          <Button
            variant="outlined"
            onClick={handleCancel}
            size="large"
          >
            취소
          </Button>
        </Box>
      </Paper>

      {/* 검수 결과 저장 확인 다이얼로그 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>검수 결과 저장</DialogTitle>
        <DialogContent>
          <DialogContentText>
            검수 결과를 저장하시겠습니까? 저장 후에는 공급업체에게 알림이 전송됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">취소</Button>
          <Button onClick={handleConfirmSubmit} color="primary" variant="contained" autoFocus>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 취소 확인 다이얼로그 */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>작업 취소</DialogTitle>
        <DialogContent>
          <DialogContentText>
            변경 사항이 저장되지 않습니다. 정말 취소하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="primary" variant="contained">
            계속 작업
          </Button>
          <Button onClick={handleConfirmCancel} color="inherit">
            취소하기
          </Button>
        </DialogActions>
      </Dialog>
=======
        {/* 검수 상태 입력 폼 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">📌 검수 상태 선택</Typography>
          <Divider sx={{ mb: 2 }} />
          <Select
            fullWidth
            value={inspection.result}
            onChange={handleResultChange}
          >
            {getResultOptions().map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* 등록 버튼 */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            검수 결과 등록
          </Button>
        </Box>
      </Paper>
>>>>>>> 8b696b94 (feat: 검수 페이지 추가 및 개선)
    </Container>
  );
};

<<<<<<< HEAD
export default InspectionFormPage;
=======
export default InspectionFormPage;
>>>>>>> 8b696b94 (feat: 검수 페이지 추가 및 개선)
