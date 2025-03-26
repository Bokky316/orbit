import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Snackbar
} from "@mui/material";

/**
 * 계약 완료 시 자동으로 발주를 생성하는 통합 컴포넌트
 * ContractDetailPage 내에서 사용됩니다.
 */
const ContractOrderIntegration = ({
  contractId,
  contractStatus,
  onOrderCreated
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const navigate = useNavigate();

  // 계약 상태가 '완료'로 변경되면 다이얼로그 표시
  useEffect(() => {
    if (contractStatus === "완료") {
      // 이미 발주가 생성되었는지 확인
      checkExistingOrder();
    }
  }, [contractId, contractStatus]);

  // 기존 발주 확인
  const checkExistingOrder = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}bidding-orders/by-contract/${contractId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // 이미 발주가 있으면 ID 저장
          setOrderId(data[0].id);
          showSnackbar("이미 이 계약에 대한 발주가 생성되어 있습니다.");
        } else {
          // 발주가 없으면 생성 다이얼로그 표시
          setOpenDialog(true);
        }
      }
    } catch (err) {
      console.error("발주 확인 오류:", err);
    }
  };

  // 발주 자동 생성
  const createOrderFromContract = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_URL}bidding-orders/auto-create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contractId: contractId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "발주 생성 실패");
      }

      const data = await response.json();
      setOrderId(data.id);

      // 성공 메시지 표시
      showSnackbar("발주가 성공적으로 생성되었습니다.");

      // 부모 컴포넌트에 알림
      if (onOrderCreated) {
        onOrderCreated(data.id);
      }
    } catch (err) {
      console.error("발주 생성 실패:", err);
      setError(`발주 생성 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setCreating(false);
      setOpenDialog(false);
    }
  };

  // 스낵바 메시지 표시
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // 발주 상세 페이지로 이동
  const navigateToOrder = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  };

  return (
    <>
      {/* 발주 생성 확인 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>발주 자동 생성</DialogTitle>
        <DialogContent>
          <DialogContentText>
            계약이 완료되어 발주를 자동으로 생성할 수 있습니다. 지금 발주를
            생성하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={creating}>
            취소
          </Button>
          <Button
            onClick={createOrderFromContract}
            color="primary"
            disabled={creating}
            startIcon={creating ? <CircularProgress size={20} /> : null}>
            {creating ? "처리 중..." : "발주 생성"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 발주 생성 완료 또는 기존 발주 알림 */}
      {orderId && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={navigateToOrder}>
              발주 보기
            </Button>
          }>
          이 계약에 대한 발주가 생성되어 있습니다. (발주 번호: {orderId})
        </Alert>
      )}

      {/* 오류 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={
          <Button color="primary" size="small" onClick={navigateToOrder}>
            발주 보기
          </Button>
        }
      />
    </>
  );
};

export default ContractOrderIntegration;
