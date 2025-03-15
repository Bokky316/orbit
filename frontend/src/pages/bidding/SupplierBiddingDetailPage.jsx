import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Link,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Input,
  InputAdornment
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/GetApp";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";

import {
  getStatusText,
  getBidMethodText
} from "./helpers/commonBiddingHelpers";

import {
  BiddingStatus,
  UserRole,
  BiddingMethod,
  canParticipateInBidding,
  calculateParticipationAmount,
  validatePriceProposal,
  prepareParticipationSubmission
} from "./helpers/supplierBiddingHelpers";

function SupplierBiddingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 상태 관리
  const [bidding, setBidding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [myParticipation, setMyParticipation] = useState(null);

  // 참여 관련 상태
  const [participationData, setParticipationData] = useState({
    unitPrice: 0,
    quantity: 1,
    note: ""
  });

  // 계산된 금액 상태
  const [calculatedAmount, setCalculatedAmount] = useState({
    supplyPrice: 0,
    vat: 0,
    totalAmount: 0
  });

  // 입력 유효성 검사 오류
  const [validationErrors, setValidationErrors] = useState({});

  // 사용자 정보 상태
  const [userSupplierInfo, setUserSupplierInfo] = useState(null);

  // 사용자 정보 가져오기 (공급사 정보)
  const fetchUserInfo = async () => {
    try {
      // 사용자 정보 API 호출
      const userResponse = await fetchWithAuth(`${API_URL}users/me`);
      if (!userResponse.ok) {
        throw new Error("사용자 정보를 불러올 수 없습니다.");
      }

      const userData = await userResponse.json();

      // 사용자가 공급사인 경우 공급사 정보 가져오기
      if (userData.role === UserRole.SUPPLIER) {
        const supplierResponse = await fetchWithAuth(
          `${API_URL}suppliers/by-user/${userData.id}`
        );
        if (supplierResponse.ok) {
          const supplierData = await supplierResponse.json();
          setUserSupplierInfo(supplierData);
        }
      }
    } catch (error) {
      console.error("사용자 정보 로드 중 오류:", error);
    }
  };

  // 입찰 공고 상세 정보 가져오기
  const fetchBiddingDetail = async () => {
    try {
      setLoading(true);

      const response = await fetchWithAuth(`${API_URL}biddings/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`입찰 공고 정보를 불러올 수 없습니다: ${errorText}`);
      }

      const responseText = await response.text();

      // 빈 응답 처리
      if (!responseText.trim()) {
        throw new Error("빈 응답이 반환되었습니다.");
      }

      const data = JSON.parse(responseText);
      setBidding(data);

      // 기본 참여 데이터 설정 (정가제안 방식인 경우 단가는 고정)
      if (data.bidMethod === BiddingMethod.FIXED_PRICE) {
        setParticipationData((prev) => ({
          ...prev,
          unitPrice: data.unitPrice || 0,
          quantity: data.quantity || 1
        }));

        // 금액 계산
        const amounts = calculateParticipationAmount(
          data.unitPrice,
          data.quantity
        );
        setCalculatedAmount(amounts);
      }

      // 내 참여 정보 확인
      if (userSupplierInfo && data.participations) {
        const myPart = data.participations.find(
          (p) => p.supplierId === userSupplierInfo.id
        );
        if (myPart) {
          setMyParticipation(myPart);
        }
      }
    } catch (error) {
      console.error("입찰 공고 상세 정보 로드 중 오류:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 입찰 참여 처리
  const handleParticipate = async () => {
    try {
      // 유효성 검증
      if (!userSupplierInfo) {
        throw new Error("공급사 정보가 없습니다. 로그인 후 다시 시도해주세요.");
      }

      // 참여 가능 여부 확인
      if (
        !canParticipateInBidding(bidding, UserRole.SUPPLIER, userSupplierInfo)
      ) {
        throw new Error("현재 입찰에 참여할 수 없습니다.");
      }

      // 가격 유효성 검사
      const validation = validatePriceProposal(
        participationData.unitPrice,
        participationData.quantity
      );

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error("입력값이 유효하지 않습니다.");
      }

      setSubmitting(true);

      // 참여 데이터 준비
      const participationPayload = prepareParticipationSubmission(
        bidding,
        participationData,
        userSupplierInfo
      );

      // API 호출
      const response = await fetchWithAuth(
        `${API_URL}supplier/biddings/${bidding.id}/participate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(participationPayload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`입찰 참여 중 오류가 발생했습니다: ${errorText}`);
      }

      // 성공 처리
      alert("입찰에 성공적으로 참여했습니다.");

      // 내 참여 정보 업데이트
      const data = await response.json();
      setMyParticipation(data);

      // 상세 정보 새로고침
      fetchBiddingDetail();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 첨부 파일 다운로드
  const downloadFile = async (filePath) => {
    try {
      const fileNameOnly = filePath.split("/").pop();

      const response = await fetchWithAuth(
        `${API_URL}biddings/${bidding.id}/files/${encodeURIComponent(
          fileNameOnly
        )}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("파일을 다운로드할 수 없습니다.");
      }

      // Blob으로 변환 및 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameOnly;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("파일 다운로드 중 오류:", error);
      alert(error.message);
    }
  };

  // 참여 데이터 변경 핸들러
  const handleParticipationChange = (e) => {
    const { name, value } = e.target;
    const numValue =
      name === "unitPrice" || name === "quantity" ? Number(value) : value;

    setParticipationData((prev) => ({
      ...prev,
      [name]: numValue
    }));

    // 가격제안 방식일 때 금액 재계산
    if (
      bidding?.bidMethod === BiddingMethod.OPEN_PRICE &&
      (name === "unitPrice" || name === "quantity")
    ) {
      const updatedData = {
        ...participationData,
        [name]: numValue
      };

      const unitPrice = name === "unitPrice" ? numValue : updatedData.unitPrice;
      const quantity = name === "quantity" ? numValue : updatedData.quantity;

      const amounts = calculateParticipationAmount(unitPrice, quantity);
      setCalculatedAmount(amounts);

      // 유효성 검사 오류 초기화
      setValidationErrors({});
    }
  };

  // 이 공급사가 초대되었는지 확인
  const isInvited = () => {
    return (
      bidding?.suppliers?.some((s) => s.supplierId === userSupplierInfo?.id) ||
      false
    );
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchUserInfo();
  }, []);

  // 사용자 정보가 로드된 후 입찰 정보 가져오기
  useEffect(() => {
    if (id && userSupplierInfo) {
      fetchBiddingDetail();
    }
  }, [id, userSupplierInfo]);

  // 로딩 상태
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

  // 오류 상태
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/supplier/biddings")}>
          목록으로
        </Button>
      </Box>
    );
  }

  // 입찰 공고가 없는 경우
  if (!bidding) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          입찰 공고를 찾을 수 없습니다
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/supplier/biddings")}>
          목록으로
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* 헤더 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}>
        <Typography variant="h4">입찰 공고 상세</Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/supplier/biddings")}>
          목록으로
        </Button>
      </Box>

      {/* 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          기본 정보
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 번호
            </Typography>
            <Typography variant="body1">{bidding.bidNumber}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              상태
            </Typography>
            <Chip
              label={getStatusText(bidding.status)}
              color={
                bidding.status?.childCode === BiddingStatus.PENDING
                  ? "default"
                  : bidding.status?.childCode === BiddingStatus.ONGOING
                  ? "primary"
                  : bidding.status?.childCode === BiddingStatus.CLOSED
                  ? "success"
                  : bidding.status?.childCode === BiddingStatus.CANCELED
                  ? "error"
                  : "default"
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              입찰 방식
            </Typography>
            <Typography variant="body1">
              {getBidMethodText(bidding.bidMethod)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              등록일
            </Typography>
            <Typography variant="body1">
              {bidding.createdAt
                ? new Date(bidding.createdAt).toLocaleDateString()
                : "-"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              제목
            </Typography>
            <Typography variant="body1">{bidding.title || "-"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              품목 수량
            </Typography>
            <Typography variant="body1">
              {bidding.quantity?.toLocaleString() || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              단가
            </Typography>
            <Typography variant="body1">
              {bidding.unitPrice
                ? `${bidding.unitPrice.toLocaleString()}원`
                : "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              총액
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {bidding.totalAmount
                ? `${bidding.totalAmount.toLocaleString()}원`
                : "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              마감일
            </Typography>
            <Typography variant="body1">
              {bidding.endDate ? (
                <>
                  {new Date(bidding.endDate).toLocaleDateString()} (
                  {new Date() > new Date(bidding.endDate)
                    ? "마감됨"
                    : `D-${Math.ceil(
                        (new Date(bidding.endDate) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      )}`}
                  )
                </>
              ) : (
                "-"
              )}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 입찰 조건 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          입찰 조건
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {bidding.conditions || "입찰 조건이 없습니다."}
        </Typography>
      </Paper>

      {/* 첨부 파일 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          첨부 파일
        </Typography>
        {bidding.attachmentPaths && bidding.attachmentPaths.length > 0 ? (
          <Box>
            {bidding.attachmentPaths.map((filePath, index) => (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  첨부파일 {index + 1}: {filePath.split("/").pop()}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadFile(filePath)}>
                  다운로드
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            첨부된 파일이 없습니다.
          </Typography>
        )}
      </Paper>

      {/* 참여 상태 표시 */}
      {myParticipation ? (
        <Paper sx={{ p: 3, mb: 3, bgcolor: "info.light" }}>
          <Typography variant="h5" sx={{ mb: 2, color: "white" }}>
            나의 참여 정보
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ color: "white" }}>
                제안 단가
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "white", fontWeight: "bold" }}>
                {myParticipation.unitPrice?.toLocaleString()}원
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ color: "white" }}>
                수량
              </Typography>
              <Typography variant="body1" sx={{ color: "white" }}>
                {myParticipation.quantity?.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ color: "white" }}>
                총액
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "white", fontWeight: "bold" }}>
                {myParticipation.totalAmount?.toLocaleString()}원
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ color: "white" }}>
                참여일
              </Typography>
              <Typography variant="body1" sx={{ color: "white" }}>
                {myParticipation.submittedAt
                  ? new Date(myParticipation.submittedAt).toLocaleDateString()
                  : "-"}
              </Typography>
            </Grid>

            {myParticipation.note && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: "white" }}>
                  참고 사항
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "white", whiteSpace: "pre-line" }}>
                  {myParticipation.note}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      ) : (
        // 참여 가능 여부에 따른 섹션 표시
        <>
          {/* 정가제안일 경우 초대 확인 */}
          {bidding.bidMethod === BiddingMethod.FIXED_PRICE && !isInvited() ? (
            <Paper sx={{ p: 3, mb: 3, bgcolor: "warning.light" }}>
              <Typography variant="h6" sx={{ color: "white" }}>
                초대된 공급사만 참여 가능한 입찰입니다.
              </Typography>
            </Paper>
          ) : // 참여 가능 여부에 따른 폼 표시
          canParticipateInBidding(
              bidding,
              UserRole.SUPPLIER,
              userSupplierInfo
            ) ? (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                입찰 참여
              </Typography>
              <Grid container spacing={3}>
                {/* 입찰 방식에 따른 입력 필드 */}
                {bidding.bidMethod === BiddingMethod.OPEN_PRICE ? (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!validationErrors.unitPrice}>
                      <InputLabel htmlFor="unitPrice">제안 단가</InputLabel>
                      <Input
                        id="unitPrice"
                        name="unitPrice"
                        type="number"
                        value={participationData.unitPrice}
                        onChange={handleParticipationChange}
                        endAdornment={
                          <InputAdornment position="end">원</InputAdornment>
                        }
                        inputProps={{ min: 0 }}
                      />
                      {validationErrors.unitPrice && (
                        <Typography color="error" variant="caption">
                          {validationErrors.unitPrice}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                ) : (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled>
                      <InputLabel htmlFor="fixedUnitPrice">
                        고정 단가
                      </InputLabel>
                      <Input
                        id="fixedUnitPrice"
                        value={bidding.unitPrice?.toLocaleString() || 0}
                        endAdornment={
                          <InputAdornment position="end">원</InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!validationErrors.quantity}>
                    <InputLabel htmlFor="quantity">수량</InputLabel>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={participationData.quantity}
                      onChange={handleParticipationChange}
                      inputProps={{ min: 1 }}
                    />
                    {validationErrors.quantity && (
                      <Typography color="error" variant="caption">
                        {validationErrors.quantity}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth disabled>
                    <InputLabel htmlFor="supplyPrice">공급가액</InputLabel>
                    <Input
                      id="supplyPrice"
                      value={calculatedAmount.supplyPrice.toLocaleString()}
                      endAdornment={
                        <InputAdornment position="end">원</InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth disabled>
                    <InputLabel htmlFor="vat">부가세</InputLabel>
                    <Input
                      id="vat"
                      value={calculatedAmount.vat.toLocaleString()}
                      endAdornment={
                        <InputAdornment position="end">원</InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth disabled>
                    <InputLabel htmlFor="totalAmount">총액</InputLabel>
                    <Input
                      id="totalAmount"
                      value={calculatedAmount.totalAmount.toLocaleString()}
                      endAdornment={
                        <InputAdornment position="end">원</InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="참고 사항"
                    name="note"
                    value={participationData.note}
                    onChange={handleParticipationChange}
                    multiline
                    rows={4}
                    placeholder="추가적인 설명이 있다면 작성해주세요."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleParticipate}
                      disabled={
                        submitting ||
                        (bidding.bidMethod === BiddingMethod.OPEN_PRICE &&
                          (!participationData.unitPrice ||
                            participationData.unitPrice <= 0))
                      }>
                      {submitting ? (
                        <CircularProgress size={24} />
                      ) : (
                        "입찰 참여"
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ) : bidding.status?.childCode !== BiddingStatus.ONGOING ? (
            <Paper sx={{ p: 3, mb: 3, bgcolor: "warning.light" }}>
              <Typography variant="h6" sx={{ color: "white" }}>
                현재 입찰 상태는 "{getStatusText(bidding.status)}"이므로 참여할
                수 없습니다.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, mb: 3, bgcolor: "info.light" }}>
              <Typography variant="h6" sx={{ color: "white" }}>
                입찰 참여 조건을 확인해주세요.
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}

export default SupplierBiddingDetailPage;
