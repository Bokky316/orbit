import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";

import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";

import { BiddingStatus, BiddingMethod } from "./helpers/biddingTypes";

import { canParticipateInBidding } from "./helpers/SupplierBiddingHelpers";

import {
  getStatusText,
  getBidMethodText
} from "./helpers/commonBiddingHelpers";

function SupplierBiddingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bidding, setBidding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participationData, setParticipationData] = useState({
    unitPrice: 0,
    quantity: 1,
    proposalText: ""
  });
  const [participationDialogOpen, setParticipationDialogOpen] = useState(false);

  // 입찰 공고 상세 정보 가져오기
  const fetchBiddingDetail = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/supplier/biddings/${id}`
      );
      if (!response.ok) {
        throw new Error("입찰 공고 정보를 불러올 수 없습니다.");
      }
      const data = await response.json();
      setBidding(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 입찰 참여 처리
  const handleParticipate = async () => {
    try {
      const participationPayload = {
        biddingId: bidding.id,
        unitPrice: participationData.unitPrice,
        quantity: participationData.quantity,
        proposalText: participationData.proposalText
      };

      const response = await fetchWithAuth(
        `${API_URL}/supplier/bidding-participations/${bidding.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(participationPayload)
        }
      );

      if (!response.ok) {
        throw new Error("입찰 참여 중 오류가 발생했습니다.");
      }

      // 성공 처리
      alert("입찰에 성공적으로 참여했습니다.");
      setParticipationDialogOpen(false);
      fetchBiddingDetail(); // 상세 정보 새로고침
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchBiddingDetail();
  }, [id]);

  // 로딩 및 에러 상태 처리
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!bidding) return <div>입찰 공고를 찾을 수 없습니다.</div>;

  // 참여 가능 여부 확인
  const isParticipationPossible = canParticipateInBidding(
    bidding,
    currentUser.supplierId
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        입찰 공고 상세
      </Typography>

      {/* 기본 정보 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              공고 번호
            </Typography>
            <Typography variant="body1">{bidding.bidNumber}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              공고명
            </Typography>
            <Typography variant="body1">{bidding.title}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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
          {/* 추가 상세 정보 렌더링 */}
        </Grid>
      </Paper>

      {/* 참여 섹션 */}
      {isParticipationPossible && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setParticipationDialogOpen(true)}>
          입찰 참여
        </Button>
      )}

      {/* 참여 대화상자 */}
      <Dialog
        open={participationDialogOpen}
        onClose={() => setParticipationDialogOpen(false)}>
        <DialogTitle>입찰 참여</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="단가"
                type="number"
                value={participationData.unitPrice}
                onChange={(e) =>
                  setParticipationData((prev) => ({
                    ...prev,
                    unitPrice: Number(e.target.value)
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="수량"
                type="number"
                value={participationData.quantity}
                onChange={(e) =>
                  setParticipationData((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value)
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="제안 내용"
                multiline
                rows={4}
                value={participationData.proposalText}
                onChange={(e) =>
                  setParticipationData((prev) => ({
                    ...prev,
                    proposalText: e.target.value
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParticipationDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleParticipate}
            color="primary"
            variant="contained">
            참여
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SupplierBiddingDetailPage;
