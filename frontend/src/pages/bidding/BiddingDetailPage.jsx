import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";

import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Stepper,
  Step,
  StepLabel
} from "@mui/material";

import {
  InfoOutlined as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon
} from "@mui/icons-material";

import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import { BiddingStatus, BiddingMethod, UserRole } from "./helpers/biddingTypes";
import {
  getStatusText,
  getBidMethodText,
  formatNumber
} from "./helpers/commonBiddingHelpers";

// 분리된 컴포넌트 임포트
import BiddingEvaluationDialog from "./biddingComponent/BiddingEvaluationDialog";
import ParticipationList from "./biddingComponent/ParticipationList";
import SupplierList from "./biddingComponent/SupplierList";
import SectionHeader from "./biddingComponent/SectionHeader";

function BiddingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  // 상태 관리
  const [bidding, setBidding] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    suppliers: true,
    conditions: false,
    attachments: false,
    participations: true
  });

  // 모달 상태
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isWinnerConfirmOpen, setIsWinnerConfirmOpen] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);

  // 평가 다이얼로그 상태
  const [evaluationDialogState, setEvaluationDialogState] = useState({
    open: false,
    participationId: null,
    supplierName: ""
  });

  // 입찰 프로세스 단계
  const biddingSteps = [
    { label: "입찰 등록", value: BiddingStatus.PENDING },
    { label: "입찰 진행", value: BiddingStatus.ONGOING },
    { label: "평가 및 낙찰", value: BiddingStatus.CLOSED },
    { label: "계약 및 발주", value: "CONTRACT" }
  ];

  // 현재 활성 단계 계산
  const activeStep = useMemo(() => {
    if (!bidding) return 0;

    const status = bidding.status?.childCode || bidding.status;

    switch (status) {
      case BiddingStatus.PENDING:
        return 0;
      case BiddingStatus.ONGOING:
        return 1;
      case BiddingStatus.CLOSED:
        // 계약이 있는 경우 마지막 단계로
        if (bidding.contracts && bidding.contracts.length > 0) {
          return 3;
        }
        return 2;
      default:
        return 0;
    }
  }, [bidding]);

  
  // 섹션 확장/축소 토글
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 데이터 가져오기 함수들
  const fetchBiddingDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`${API_URL}biddings/${id}`);

      if (!response.ok) {
        throw new Error("입찰 공고 정보를 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      setBidding(data);

      // 참여 목록, 공급사 목록 등 추가 데이터 패치
      await Promise.all([fetchParticipations(id), fetchSuppliers(id)]);
    } catch (error) {
      setError(error.message);
      console.error("입찰 공고 상세 정보 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParticipations = async (biddingId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/${biddingId}/participations`
      );
      if (response.ok) {
        const data = await response.json();
        setParticipations(data);
      }
    } catch (error) {
      console.error("참여 목록 로딩 실패:", error);
    }
  };

  const fetchSuppliers = async (biddingId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/${biddingId}/suppliers`
      );
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error("공급사 목록 로딩 실패:", error);
    }
  };

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    if (id) {
      fetchBiddingDetails();
    }
  }, [id]);

  // 입찰 마감 핸들러
  const handleCloseBidding = async () => {
    try {
      setIsLoading(true);
      setIsCloseConfirmOpen(false);

      const response = await fetchWithAuth(`${API_URL}biddings/${id}/close`, {
        method: "PUT"
      });

      if (!response.ok) {
        throw new Error("입찰 마감 처리에 실패했습니다.");
      }

      // 상태 새로고침
      fetchBiddingDetails();
      alert("입찰 공고가 성공적으로 마감되었습니다.");
    } catch (error) {
      console.error("입찰 마감 중 오류:", error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 낙찰자 선정 핸들러
  const handleSelectWinner = async () => {
    if (!selectedParticipation) return;

    try {
      setIsLoading(true);
      setIsWinnerConfirmOpen(false);

      const response = await fetchWithAuth(
        `${API_URL}evaluations/${id}/select-winner`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ participationId: selectedParticipation.id })
        }
      );

      if (!response.ok) {
        throw new Error("낙찰자 선정에 실패했습니다.");
      }

      // 상태 새로고침
      fetchBiddingDetails();
      alert("낙찰자가 성공적으로 선정되었습니다.");
    } catch (error) {
      console.error("낙찰자 선정 중 오류:", error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSelectedParticipation(null);
    }
  };

  // 평가 완료 핸들러
  const handleEvaluationComplete = async (evaluation) => {
    try {
      // 평가 목록 다시 가져오기
      await fetchParticipations(id);

      alert("평가가 성공적으로 제출되었습니다.");

      // 평가 다이얼로그 닫기
      setEvaluationDialogState({
        open: false,
        participationId: null,
        supplierName: ""
      });
    } catch (error) {
      console.error("평가 처리 중 오류:", error);
      alert(`평가 처리 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 계약 초안 생성 핸들러
  const handleCreateContract = async () => {
    if (!bidding || !selectedParticipation) return;

    try {
      setIsLoading(true);
      setContractModalOpen(false);

      const response = await fetchWithAuth(`${API_URL}contracts/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          biddingId: Number(id),
          participationId: selectedParticipation.id
        })
      });

      if (!response.ok) {
        throw new Error("계약 초안 생성에 실패했습니다.");
      }

      const data = await response.json();

      // 상태 새로고침
      fetchBiddingDetails();
      alert("계약 초안이 성공적으로 생성되었습니다.");

      // 계약 페이지로 이동
      navigate(`/contracts/${data.id}`);
    } catch (error) {
      console.error("계약 초안 생성 중 오류:", error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSelectedParticipation(null);
    }
  };

  // 권한 체크
  const canManageBidding = useMemo(() => {
    if (!bidding || !user) return false;
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.BUYER && bidding.createdBy === user.username)
      return true;
    return false;
  }, [bidding, user]);

  const canCloseBidding = useMemo(() => {
    if (!bidding || !user) return false;
    if (bidding.status?.childCode !== BiddingStatus.ONGOING) return false;
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.BUYER && bidding.createdBy === user.username)
      return true;
    return false;
  }, [bidding, user]);

  const canEvaluate = useMemo(() => {
    if (!bidding || !user) return false;
    if (bidding.status?.childCode !== BiddingStatus.CLOSED) return false;
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.BUYER && bidding.createdBy === user.username)
      return true;
    return false;
  }, [bidding, user]);

  const canSelectWinner = useMemo(() => {
    if (!bidding || !user) return false;
    if (bidding.status?.childCode !== BiddingStatus.CLOSED) return false;

    // 이미 낙찰자가 있는지 확인
    const hasWinner = participations.some((p) => p.isSelectedBidder);
    if (hasWinner) return false;

    // 모든 참여에 대한 평가가 완료되었는지 확인
    const allEvaluated =
      participations.length > 0 && participations.every((p) => p.isEvaluated);
    if (!allEvaluated) return false;

    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.BUYER && bidding.createdBy === user.username)
      return true;
    return false;
  }, [bidding, user, participations]);

  const canCreateContract = useMemo(() => {
    if (!bidding || !user) return false;
    if (bidding.status?.childCode !== BiddingStatus.CLOSED) return false;

    // 낙찰자가 있는지 확인
    const selectedBidder = participations.find((p) => p.isSelectedBidder);
    if (!selectedBidder) return false;

    // 이미 계약이 있는지 확인
    const hasContract = bidding.contracts && bidding.contracts.length > 0;
    if (hasContract) return false;

    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.BUYER && bidding.createdBy === user.username)
      return true;
    return false;
  }, [bidding, user, participations]);

  // 로딩 및 에러 상태 처리
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/biddings")}
          sx={{ mt: 2 }}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* 페이지 헤더 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3
        }}>
        <Typography variant="h4">입찰 공고 상세 정보</Typography>
        <Box>
          <Button
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={() => navigate("/biddings")}>
            목록으로
          </Button>
          {canManageBidding && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                sx={{ mr: 1 }}
                onClick={() => navigate(`/biddings/${id}/edit`)}
                disabled={bidding.status?.childCode === BiddingStatus.CLOSED}>
                수정
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                disabled={bidding.status?.childCode !== BiddingStatus.PENDING}>
                삭제
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* 프로세스 진행 상태 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {biddingSteps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* 기본 정보 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title="기본 정보"
          icon={<InfoIcon />}
          expanded={expandedSections.basicInfo}
          onToggle={() => toggleSection("basicInfo")}
        />
        <Collapse in={expandedSections.basicInfo}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                입찰 번호
              </Typography>
              <Typography variant="body1">
                {bidding.bidNumber || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                상태
              </Typography>
              <Chip
                label={getStatusText(bidding.status)}
                color={
                  bidding.status?.childCode === BiddingStatus.ONGOING
                    ? "primary"
                    : bidding.status?.childCode === BiddingStatus.CLOSED
                    ? "success"
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
                입찰 기간
              </Typography>
              <Typography variant="body1">
                {bidding.biddingPeriod?.startDate &&
                bidding.biddingPeriod?.endDate
                  ? `${moment(bidding.biddingPeriod.startDate).format(
                      "YYYY-MM-DD"
                    )} ~ ${moment(bidding.biddingPeriod.endDate).format(
                      "YYYY-MM-DD"
                    )}`
                  : "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                수량
              </Typography>
              <Typography variant="body1">{bidding.quantity || 0}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                단가
              </Typography>
              <Typography variant="body1">
                {formatNumber(bidding.unitPrice)} 원
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                총액
              </Typography>
              <Typography variant="body1">
                {formatNumber(bidding.totalAmount)} 원
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                세금계산서 발행여부
              </Typography>
              <Typography variant="body1">필요</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                설명
              </Typography>
              <Typography variant="body1">
                {bidding.description || "-"}
              </Typography>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* 조건 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title="입찰 조건"
          icon={<DescriptionIcon />}
          expanded={expandedSections.conditions}
          onToggle={() => toggleSection("conditions")}
        />
        <Collapse in={expandedSections.conditions}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {bidding.conditions || "입찰 조건이 등록되지 않았습니다."}
          </Typography>
        </Collapse>
      </Paper>

      {/* 초대된 공급사 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title={`초대된 공급사 (${suppliers.length})`}
          icon={<AssignmentIcon />}
          expanded={expandedSections.suppliers}
          onToggle={() => toggleSection("suppliers")}
        />
        <Collapse in={expandedSections.suppliers}>
          <SupplierList suppliers={suppliers} />
        </Collapse>
      </Paper>

      {/* 입찰 참여 현황 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title={`입찰 참여 현황 (${participations.length})`}
          icon={<AssignmentTurnedInIcon />}
          expanded={expandedSections.participations}
          onToggle={() => toggleSection("participations")}
          actionButton={
            canCloseBidding && (
              <Button
                variant="contained"
                color="warning"
                onClick={() => setIsCloseConfirmOpen(true)}
                sx={{ mr: 2 }}>
                입찰 마감
              </Button>
            )
          }
        />
        <Collapse in={expandedSections.participations}>
          {participations.length > 0 ? (
            <ParticipationList
              participations={participations}
              bidding={bidding}
              userRole={user?.role}
              onEvaluate={(participation) => {
                setEvaluationDialogState({
                  open: true,
                  participationId: participation.id,
                  supplierName: participation.companyName
                });
              }}
              onSelectWinner={(participation) => {
                setSelectedParticipation(participation);
                setIsWinnerConfirmOpen(true);
              }}
              onCreateContract={(participation) => {
                setSelectedParticipation(participation);
                setContractModalOpen(true);
              }}
            />
          ) : (
            <Typography variant="body1">
              아직 참여한 공급사가 없습니다.
            </Typography>
          )}
        </Collapse>
      </Paper>

      {/* 입찰 마감 확인 모달 */}
      <Dialog
        open={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}>
        <DialogTitle>입찰 마감 확인</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            입찰을 마감하시겠습니까? 마감 후에는 추가 참여가 불가능합니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCloseConfirmOpen(false)}>취소</Button>
          <Button
            onClick={handleCloseBidding}
            variant="contained"
            color="primary">
            마감하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 낙찰자 선정 확인 모달 */}
      <Dialog
        open={isWinnerConfirmOpen}
        onClose={() => setIsWinnerConfirmOpen(false)}>
        <DialogTitle>낙찰자 선정 확인</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {selectedParticipation?.companyName}을(를) 낙찰자로
            선정하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsWinnerConfirmOpen(false)}>취소</Button>
          <Button
            onClick={handleSelectWinner}
            variant="contained"
            color="primary">
            낙찰자 선정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 계약 생성 모달 */}
      <Dialog
        open={contractModalOpen}
        onClose={() => setContractModalOpen(false)}>
        <DialogTitle>계약 초안 생성</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {selectedParticipation?.companyName}와(과)의 계약 초안을
            생성하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            계약 금액: {formatNumber(selectedParticipation?.totalAmount || 0)}원
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractModalOpen(false)}>취소</Button>
          <Button
            onClick={handleCreateContract}
            variant="contained"
            color="primary">
            계약 초안 생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* 공급자 평가 다이얼로그 */}
      <BiddingEvaluationDialog
        open={evaluationDialogState.open}
        onClose={() =>
          setEvaluationDialogState({ ...evaluationDialogState, open: false })
        }
        participationId={evaluationDialogState.participationId}
        supplierName={evaluationDialogState.supplierName}
        bidNumber={bidding?.bidNumber}
        bidId={bidding?.id}
        onEvaluationComplete={handleEvaluationComplete}
      />
    </Box>
  );
}

export default BiddingDetailPage;
