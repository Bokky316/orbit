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
  StepLabel,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from "@mui/material";

import {
  InfoOutlined as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  Update as UpdateIcon
} from "@mui/icons-material";

import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import { BiddingStatus, BiddingMethod, UserRole } from "./helpers/biddingTypes";
import {
  getStatusText,
  getBidMethodText,
  formatNumber
} from "./helpers/commonBiddingHelpers";

import PermissionService, { usePermission } from "./helpers/permissionUtils";

import { useNotificationsWebSocket } from "@/hooks/useNotificationsWebSocket";
import { useToastNotifications } from "@/hooks/useToastNotifications";

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
    detailInfo: true,
    suppliers: true,
    conditions: false,
    attachments: false,
    participations: true,
    statusHistory: false
  });

  // 알림 WebSocket 및 Toast 연결
  const { toast } = useToastNotifications();

  const handleNotification = (notification) => {
    toast({
      title: notification.title,
      description: notification.content,
      severity: "info",
      duration: 5000
    });
  };

  useNotificationsWebSocket(user, handleNotification);

  const permission = usePermission(user);

  const currentStatus = bidding?.status?.childCode || bidding?.status;

  const statusCode = bidding
    ? typeof bidding.status === "object"
      ? bidding.status.childCode
      : bidding.status
    : null;

  const isClosed =
    (bidding?.status?.childCode || bidding?.status) === BiddingStatus.CLOSED;

  console.log("bidding.status:", bidding?.status);
  console.log("bidding.status.childCode:", bidding?.status?.childCode);

  const userPosition = user?.position?.toLowerCase();
  const userRole = user?.roles?.[0]?.replace("ROLE_", "").toUpperCase();

  // 모달 상태
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isWinnerConfirmOpen, setIsWinnerConfirmOpen] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 평가 다이얼로그 상태
  const [evaluationDialogState, setEvaluationDialogState] = useState({
    open: false,
    participationId: null,
    supplierName: ""
  });

  // 상태 변경 다이얼로그 상태
  const [statusChangeDialog, setStatusChangeDialog] = useState({
    open: false,
    newStatus: "",
    reason: ""
  });
  const [statusHistories, setStatusHistories] = useState([]);

  // 입찰 프로세스 단계
  const biddingSteps = [
    { label: "입찰 등록", value: BiddingStatus.PENDING },
    { label: "입찰 진행", value: BiddingStatus.ONGOING },
    { label: "평가 및 낙찰", value: BiddingStatus.CLOSED },
    { label: "계약 및 발주", value: "CONTRACT" }
  ];

  // 상태 변경 가능한 상태 목록
  const availableStatusChanges = useMemo(() => {
    if (!bidding) return [];

    const currentStatus = bidding.status?.childCode || bidding.status;

    switch (currentStatus) {
      case BiddingStatus.PENDING:
        return [
          { code: BiddingStatus.ONGOING, text: "입찰 진행" },
          { code: BiddingStatus.CANCELED, text: "입찰 취소" }
        ];
      case BiddingStatus.ONGOING:
        return [
          { code: BiddingStatus.CLOSED, text: "입찰 마감" },
          { code: BiddingStatus.CANCELED, text: "입찰 취소" }
        ];
      default:
        return [];
    }
  }, [bidding]);

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
      console.log("서버에서 받은 bidding 데이터:", data);
      console.log("현재 status 값:", data.status);

      setBidding(data);

      // 참여 목록, 공급사 목록 등 추가 데이터 패치
      await Promise.all([
        fetchParticipations(id),
        fetchSuppliers(id),
        fetchStatusHistory(id)
      ]);
    } catch (error) {
      setError(error.message);
      console.error("입찰 공고 상세 정보 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. getStatusText 함수 오버라이드 (기존 함수에 문제가 있을 경우)
  // helpers/commonBiddingHelpers.js에 있는 함수를 수정하기 어렵다면
  // 컴포넌트 내에 새 함수를 추가합니다.
  const getStatusDisplayText = (status) => {
    if (!status) return "알 수 없음";

    // 객체인 경우
    if (typeof status === "object") {
      if (status.childCode) {
        return getStatusCodeDisplayText(status.childCode);
      }
      return status.name || "알 수 없음";
    }

    // 문자열인 경우
    return getStatusCodeDisplayText(status);
  };

  const getStatusCodeDisplayText = (statusCode) => {
    switch (statusCode) {
      case BiddingStatus.PENDING:
        return "대기중";
      case BiddingStatus.ONGOING:
        return "진행중";
      case BiddingStatus.CLOSED:
        return "마감";
      case BiddingStatus.CANCELED:
        return "취소";
      default:
        return statusCode || "알 수 없음";
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
        `${API_URL}biddings/${biddingId}/invited-suppliers`
      );
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        console.error("공급사 목록 응답 오류:", response.status);
      }
    } catch (error) {
      console.error("공급사 목록 로딩 실패:", error);
    }
  };

  const fetchStatusHistory = async (biddingId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}biddings/${biddingId}/status-history`
      );
      if (response.ok) {
        const data = await response.json();
        setStatusHistories(data);
      }
    } catch (error) {
      console.error("상태 변경 이력 로딩 실패:", error);
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

      await fetchBiddingDetails();
      alert("입찰이 성공적으로 마감되었습니다.");
    } catch (error) {
      console.error("입찰 마감 중 오류:", error);
      alert(`오류 발생: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 입찰 삭제 핸들러
  const handleDeleteBidding = async () => {
    try {
      setIsLoading(true);
      setDeleteConfirmOpen(false);

      const response = await fetchWithAuth(`${API_URL}biddings/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("입찰 공고 삭제에 실패했습니다.");
      }

      alert("입찰 공고가 성공적으로 삭제되었습니다.");
      navigate("/biddings");
    } catch (error) {
      console.error("입찰 공고 삭제 중 오류:", error);
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 상태 변경 핸들러
  const handleStatusChange = async () => {
    try {
      setIsLoading(true);
      console.log("상태 변경 요청:", {
        status: statusChangeDialog.newStatus,
        reason: statusChangeDialog.reason
      });

      const res = await fetchWithAuth(`${API_URL}biddings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusChangeDialog.newStatus,
          reason: statusChangeDialog.reason
        })
      });

      if (!res.ok) throw new Error("상태 변경 실패");

      alert("상태 변경 완료");

      // fetchBidding() 대신 fetchBiddingDetails() 함수 호출
      await fetchBiddingDetails();
    } catch (e) {
      console.error("상태 변경 오류:", e);
      alert(e.message);
    } finally {
      setStatusChangeDialog({ open: false, newStatus: "", reason: "" });
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
        `${API_URL}/evaluations/${id}/select-winner`,
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
      // API 호출을 통한 평가 저장(직접 API 호출은 BiddingEvaluationDialog에서 처리)

      // 참여 목록 다시 가져오기
      await fetchParticipations(id);

      // 성공 메시지
      console.log("평가가 성공적으로 저장되었습니다:", evaluation);

      // 평가 결과 반환 (중요: Promise를 반환하도록 함)
      return evaluation;
    } catch (error) {
      console.error("평가 처리 중 오류:", error);
      // 오류를 다시 throw하여 다이얼로그에서 처리하도록 함
      throw error;
    }
  };

  // 계약 초안 생성 핸들러
  const handleCreateContract = async () => {
    if (!bidding || !selectedParticipation) return;

    try {
      setIsLoading(true);
      setContractModalOpen(false);

      const response = await fetchWithAuth(`${API_URL}/contracts/draft`, {
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

  // 권한 체크 부분 수정
  const canEdit = useMemo(() => {
    return permission.canUpdateBidding(bidding);
  }, [bidding, permission]);

  const canDelete = useMemo(() => {
    return PermissionService.checkPermission(user, "delete", currentStatus);
  }, [user, currentStatus]);

  const canChangeStatus = useMemo(() => {
    return permission.canChangeBiddingStatus(
      currentStatus,
      BiddingStatus.ONGOING
    );
  }, [permission, currentStatus]);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth(`${API_URL}biddings/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      alert("삭제 완료");
      navigate("/biddings");
    } catch (e) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const canManageBidding = useMemo(() => {
    return permission.canUpdateBidding(bidding);
  }, [bidding, permission]);

  const canChangeBiddingStatus = useMemo(() => {
    return permission.canChangeBiddingStatus(
      currentStatus,
      BiddingStatus.ONGOING
    );
  }, [bidding, permission]);

  const canDeleteBidding = useMemo(() => {
    return PermissionService.checkPermission(user, "delete", currentStatus);
  }, [bidding, user]);

  const canCloseBidding = useMemo(() => {
    return currentStatus === BiddingStatus.ONGOING && canManageBidding;
  }, [currentStatus, canManageBidding]);

  const canEvaluate = useMemo(() => {
    if (!bidding || !user) return false;
    if (bidding.status?.childCode !== BiddingStatus.CLOSED) return false;

    return permission.canSelectWinner(bidding);
  }, [bidding, user, permission]);

  const canEvaluateEachParticipation = useMemo(() => {
    if (!bidding || !user) return false;

    const statusCode =
      typeof bidding.status === "object"
        ? bidding.status.childCode
        : bidding.status;

    return statusCode === BiddingStatus.CLOSED;
  }, [bidding, user]);

  const canSelectWinner = useMemo(() => {
    if (!bidding || !user) return false;
    if (bidding.status?.childCode !== BiddingStatus.CLOSED) return false;

    const hasWinner = participations.some((p) => p.isSelectedBidder);
    const allEvaluated =
      participations.length > 0 && participations.every((p) => p.isEvaluated);

    return !hasWinner && allEvaluated && permission.canSelectWinner(bidding);
  }, [bidding, user, participations, permission]);

  const canCreateContract = useMemo(() => {
    if (!bidding || !user) return false;
    if (bidding.status?.childCode !== BiddingStatus.CLOSED) return false;

    // 낙찰자가 있는지 확인
    const selectedBidder = participations.find((p) => p.isSelectedBidder);
    if (!selectedBidder) return false;

    // 이미 계약이 있는지 확인
    const hasContract = bidding.contracts && bidding.contracts.length > 0;
    if (hasContract) return false;

    return permission.canCreateContractDraft(bidding);
  }, [bidding, user, participations, permission]);

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

          {/* 상태 변경 버튼 */}
          {canChangeStatus && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<UpdateIcon />}
              onClick={() => {
                // 현재 상태에 따라 적절한 다음 상태 선택
                const nextStatus =
                  currentStatus === BiddingStatus.PENDING
                    ? BiddingStatus.ONGOING
                    : currentStatus === BiddingStatus.ONGOING
                    ? BiddingStatus.CLOSED
                    : BiddingStatus.PENDING;

                setStatusChangeDialog({
                  open: true,
                  newStatus: nextStatus,
                  reason: ""
                });
              }}
              sx={{ mr: 1 }}>
              상태 변경
            </Button>
          )}
          {canEdit && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              sx={{ mr: 1 }}
              onClick={() => navigate(`/biddings/${id}/edit`)}>
              수정
            </Button>
          )}
          {canDelete && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteConfirmOpen(true)}>
              삭제
            </Button>
          )}
        </Box>
      </Box>
      {/* 프로세스 진행 상태 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper
          activeStep={
            currentStatus === BiddingStatus.PENDING
              ? 0
              : currentStatus === BiddingStatus.ONGOING
              ? 1
              : currentStatus === BiddingStatus.CLOSED
              ? 2
              : 0
          }
          alternativeLabel>
          {["등록", "진행", "마감"].map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
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
              <Typography variant="subtitle2">입찰 번호</Typography>
              <Typography>{bidding.bidNumber || "-"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">상태</Typography>
              <Chip label={getStatusDisplayText(bidding.status)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">입찰 방식</Typography>
              <Typography>{getBidMethodText(bidding.bidMethod)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">입찰 기간</Typography>
              <Typography>
                {bidding.biddingPeriod?.startDate} ~{" "}
                {bidding.biddingPeriod?.endDate}
              </Typography>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title="상세 정보"
          icon={<AssignmentIcon />}
          expanded={expandedSections.detailInfo}
          onToggle={() => toggleSection("detailInfo")}
        />
        <Collapse in={expandedSections.detailInfo}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">구매요청 번호</Typography>
              <Typography>
                {bidding.purchaseRequest?.requestNumber || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">품목</Typography>
              <Typography>{bidding.purchaseRequestItemName || "-"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">납품장소</Typography>
              <Typography>{bidding.deliveryLocation || "-"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">납품 요청일</Typography>
              <Typography>
                {bidding.deliveryRequestDate
                  ? moment(bidding.deliveryRequestDate).format("YYYY-MM-DD")
                  : "-"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">수량</Typography>
              <Typography>{bidding.quantity || 0}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">단가</Typography>
              <Typography>{formatNumber(bidding.unitPrice)} 원</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2">총액</Typography>
              <Typography>{formatNumber(bidding.totalAmount)} 원</Typography>
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
          {suppliers.length > 0 ? (
            <SupplierList suppliers={suppliers} />
          ) : (
            <Typography variant="body1">초대된 공급사가 없습니다.</Typography>
          )}
        </Collapse>
      </Paper>
      {/* 정가제안용 선택된 공급사 섹션 */}
      {bidding.bidMethod === BiddingMethod.OPEN_PRICE &&
        suppliers.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <SectionHeader
              title={`정가제안 - 선택된 공급사 (${suppliers.length})`}
              icon={<AssignmentIcon />}
              expanded={true}
              onToggle={() => {}}
            />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>공급사명</TableCell>
                    <TableCell>사업자번호</TableCell>
                    <TableCell>카테고리</TableCell>
                    <TableCell>초대 상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>{supplier.companyName}</TableCell>
                      <TableCell>{supplier.businessNo || "-"}</TableCell>
                      <TableCell>
                        {supplier.sourcingCategory || "-"}{" "}
                        {supplier.sourcingSubCategory &&
                          `> ${supplier.sourcingSubCategory}`}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            supplier.accepted
                              ? "수락"
                              : supplier.responseDate
                              ? "거부"
                              : "대기중"
                          }
                          color={
                            supplier.accepted
                              ? "success"
                              : supplier.responseDate
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
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
              isClosed={isClosed}
              canEvaluateEach={canEvaluateEachParticipation}
              canSelectWinner={canSelectWinner}
              canCreateContract={canCreateContract}
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

      {/* 상태 변경 이력 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <SectionHeader
          title="상태 변경 이력"
          icon={<HistoryIcon />}
          expanded={expandedSections.statusHistory}
          onToggle={() => toggleSection("statusHistory")}
        />
        <Collapse in={expandedSections.statusHistory}>
          {statusHistories.length > 0 ? (
            <List>
              {statusHistories.map((history, index) => (
                <ListItem
                  key={index}
                  divider={index < statusHistories.length - 1}>
                  <ListItemIcon>
                    <UpdateIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${getStatusText(
                      history.previousStatus
                    )} → ${getStatusText(history.newStatus)}`}
                    secondary={`${moment(history.changeDate).format(
                      "YYYY-MM-DD HH:mm"
                    )} | ${history.changedBy || "시스템"} | ${
                      history.reason || "사유 없음"
                    }`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1">상태 변경 이력이 없습니다.</Typography>
          )}
        </Collapse>
      </Paper>
      {/* 삭제 모달 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>정말로 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
      {/* 상태 변경 모달 */}
      <Dialog
        open={statusChangeDialog.open}
        onClose={() =>
          setStatusChangeDialog({ open: false, newStatus: "", reason: "" })
        }>
        <DialogTitle>상태 변경</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1">새 상태 선택</Typography>
            {availableStatusChanges.map((status) => (
              <Button
                key={status.code}
                variant={
                  statusChangeDialog.newStatus === status.code
                    ? "contained"
                    : "outlined"
                }
                color="primary"
                onClick={() =>
                  setStatusChangeDialog({
                    ...statusChangeDialog,
                    newStatus: status.code
                  })
                }
                sx={{ mr: 1, mt: 1 }}>
                {status.text}
              </Button>
            ))}
          </Box>
          <TextField
            fullWidth
            label="변경 사유"
            value={statusChangeDialog.reason}
            onChange={(e) =>
              setStatusChangeDialog({
                ...statusChangeDialog,
                reason: e.target.value
              })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setStatusChangeDialog({ open: false, newStatus: "", reason: "" })
            }>
            취소
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            color="primary"
            disabled={!statusChangeDialog.newStatus}>
            변경
          </Button>
        </DialogActions>
      </Dialog>
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
