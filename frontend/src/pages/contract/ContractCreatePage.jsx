import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader
} from "@mui/material";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

function ContractCreatePage() {
  const { biddingId, participationId } = useParams();
  const navigate = useNavigate();
  const sigCanvas = useRef({});
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidding, setBidding] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [contractData, setContractData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    deliveryDate: "",
    description: "",
    status: "초안",
    signatureStatus: "미서명"
  });

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 입찰 정보 가져오기
        const biddingResponse = await fetchWithAuth(
          `${API_URL}biddings/${biddingId}`
        );
        if (!biddingResponse.ok) {
          throw new Error("입찰 정보를 가져오는데 실패했습니다.");
        }
        const biddingData = await biddingResponse.json();
        setBidding(biddingData);

        // 참여 정보 가져오기
        const participationResponse = await fetchWithAuth(
          `${API_URL}biddings/participations/${participationId}`
        );
        if (!participationResponse.ok) {
          throw new Error("참여 정보를 가져오는데 실패했습니다.");
        }
        const participationData = await participationResponse.json();
        setParticipation(participationData);

        // 기본 종료일 설정 (3개월 후)
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        setContractData((prev) => ({
          ...prev,
          endDate: endDate.toISOString().split("T")[0]
        }));
      } catch (err) {
        console.error("데이터 로드 오류:", err);
        setError(`데이터를 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (biddingId && participationId) {
      fetchData();
    }
  }, [biddingId, participationId]);

  // 입력 데이터 변경 처리
  const handleChange = (e) => {
    setContractData({
      ...contractData,
      [e.target.name]: e.target.value
    });
  };

  // 서명 초기화
  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  // 서명 이미지 저장
  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) {
      return null;
    }
    return sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
  };

  // 단계 이동 처리
  const handleNext = () => {
    // 유효성 검사
    if (activeStep === 0) {
      if (!contractData.endDate) {
        setError("계약 종료일은 필수 항목입니다.");
        return;
      }
      if (new Date(contractData.endDate) < new Date(contractData.startDate)) {
        setError("계약 종료일은 시작일 이후여야 합니다.");
        return;
      }
      setError(null);
    }

    if (activeStep === 1) {
      if (sigCanvas.current.isEmpty()) {
        setError("전자 서명을 해주세요.");
        return;
      }
      setError(null);
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // 계약 제출
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const signatureImage = saveSignature();
      if (!signatureImage) {
        setError("서명이 필요합니다.");
        setLoading(false);
        return;
      }

      // 서명 이미지를 Base64로 저장
      const signatureData = signatureImage.split(",")[1]; // Base64 데이터 부분만 추출

      // 계약 데이터 준비
      const contractPayload = {
        biddingId: bidding.id,
        biddingParticipationId: participation.id,
        transactionNumber: `CNT-${bidding.bidNumber}-${new Date()
          .getTime()
          .toString()
          .substr(-6)}`,
        supplierId: participation.supplierId,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        totalAmount: participation.totalAmount,
        quantity: bidding.quantity,
        unitPrice: participation.unitPrice,
        deliveryDate: contractData.deliveryDate || null,
        status: "서명중",
        signatureStatus: "내부서명",
        description: contractData.description,
        signatureData: signatureData // Base64 서명 데이터
      };

      // 계약 생성 API 호출
      const response = await fetchWithAuth(`${API_URL}contracts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(contractPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`계약 생성 실패: ${errorText}`);
      }

      // 성공 메시지 표시 및 상세 페이지로 이동
      alert("계약이 성공적으로 생성되었습니다.");
      navigate(`/biddings/${biddingId}`);
    } catch (err) {
      console.error("계약 생성 오류:", err);
      setError(`계약 생성 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 취소 처리
  const handleCancel = () => {
    const confirmed = window.confirm(
      "계약 작성을 취소하시겠습니까? 입력한 데이터는 저장되지 않습니다."
    );
    if (confirmed) {
      navigate(`/biddings/${biddingId}`);
    }
  };

  // 스텝 정의
  const steps = ["계약 정보 입력", "전자 서명", "확인 및 완료"];

  if (loading && !bidding) {
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

  if (error && !bidding) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate(`/biddings/${biddingId}`)}>
          돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        계약 작성
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                계약 기본 정보
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                name="startDate"
                label="계약 시작일"
                type="date"
                fullWidth
                value={contractData.startDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                name="endDate"
                label="계약 종료일"
                type="date"
                fullWidth
                value={contractData.endDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="deliveryDate"
                label="납기일"
                type="date"
                fullWidth
                value={contractData.deliveryDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="계약 설명"
                multiline
                rows={4}
                fullWidth
                value={contractData.description}
                onChange={handleChange}
              />
            </Grid>

            {bidding && participation && (
              <Grid item xs={12}>
                <Card sx={{ mt: 3 }}>
                  <CardHeader title="입찰 및 공급자 정보" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          입찰 번호
                        </Typography>
                        <Typography variant="body1">
                          {bidding.bidNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          공급자
                        </Typography>
                        <Typography variant="body1">
                          {participation.supplierName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          구매 요청명
                        </Typography>
                        <Typography variant="body1">{bidding.title}</Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          수량
                        </Typography>
                        <Typography variant="body1">
                          {bidding.quantity?.toLocaleString() || "-"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          단가
                        </Typography>
                        <Typography variant="body1">
                          {participation.unitPrice?.toLocaleString() || "-"}원
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          총액
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {participation.totalAmount?.toLocaleString() || "-"}원
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {activeStep === 1 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
            <Typography variant="h5" gutterBottom>
              전자 서명
            </Typography>
            <Typography variant="body2" gutterBottom>
              아래 영역에 마우스나 터치로 서명해 주세요.
            </Typography>
            <Paper
              elevation={3}
              sx={{
                width: "100%",
                height: 300,
                my: 3,
                border: "1px solid #ccc"
              }}>
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  width: "100%",
                  height: 300,
                  className: "signature-canvas"
                }}
                backgroundColor="rgba(255, 255, 255, 0)"
              />
            </Paper>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearSignature}
              sx={{ alignSelf: "flex-end" }}>
              서명 지우기
            </Button>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              계약 정보 확인
            </Typography>
            <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    입찰 번호
                  </Typography>
                  <Typography variant="body1">{bidding?.bidNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    공급자
                  </Typography>
                  <Typography variant="body1">
                    {participation?.supplierName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    품목명
                  </Typography>
                  <Typography variant="body1">
                    {bidding?.title || "-"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약 시작일
                  </Typography>
                  <Typography variant="body1">
                    {contractData.startDate}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약 종료일
                  </Typography>
                  <Typography variant="body1">
                    {contractData.endDate}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    납기일
                  </Typography>
                  <Typography variant="body1">
                    {contractData.deliveryDate || "-"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    계약 설명
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                    {contractData.description || "-"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    수량
                  </Typography>
                  <Typography variant="body1">
                    {bidding?.quantity?.toLocaleString() || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    단가
                  </Typography>
                  <Typography variant="body1">
                    {participation?.unitPrice?.toLocaleString() || "-"}원
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    총액
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {participation?.totalAmount?.toLocaleString() || "-"}원
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    서명
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      border: "1px solid #eee",
                      p: 1,
                      maxWidth: 400
                    }}>
                    {sigCanvas.current.isEmpty ? (
                      <Typography variant="body2" color="text.secondary">
                        서명 미리보기 없음
                      </Typography>
                    ) : (
                      <img
                        src={saveSignature()}
                        alt="서명 미리보기"
                        style={{ maxWidth: "100%", maxHeight: 150 }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button variant="outlined" color="inherit" onClick={handleCancel}>
          취소
        </Button>
        <Box>
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              이전
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              다음
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}>
              계약 생성
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ContractCreatePage;
