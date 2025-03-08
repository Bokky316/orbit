import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Grid, Box, Divider, Chip, Table, TableHead, TableBody, TableRow, TableCell, Button, Checkbox, TextField, Select, MenuItem
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const InspectionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
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
            파일 추가
            <input type="file" hidden multiple onChange={handleFileUpload} />
          </Button>
        </Box>

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
    </Container>
  );
};

export default InspectionFormPage;
