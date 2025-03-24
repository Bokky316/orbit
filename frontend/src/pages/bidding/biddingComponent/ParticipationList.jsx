import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip
} from "@mui/material";
import {
  BiddingStatus,
  BiddingMethod,
  UserRole
} from "./../helpers/biddingTypes";

/**
 * 참여 목록 컴포넌트 - 정가제안과 가격제안을 모두 지원
 */
function ParticipationList({
  participations,
  bidding,
  userRole,
  onEvaluate,
  onSelectWinner,
  onCreateContract
}) {
  if (!bidding || !participations) return null;

  // 낙찰자가 있는지 확인
  const hasSelectedBidder = participations.some((p) => p.isSelectedBidder);

  // 권한 체크
  const canEvaluate =
    userRole === UserRole.ADMIN || userRole === UserRole.BUYER;
  const canSelect =
    canEvaluate && bidding.status?.childCode === BiddingStatus.CLOSED;
  const canContract =
    canEvaluate &&
    hasSelectedBidder &&
    bidding.status?.childCode === BiddingStatus.CLOSED;

  // 정가제안인지 가격제안인지에 따라 다른 컬럼 구성
  const isPriceSuggestion = bidding.bidMethod === BiddingMethod.OPEN_PRICE;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>공급사</TableCell>
            {isPriceSuggestion && <TableCell>제안 내용</TableCell>}
            <TableCell align="right">단가</TableCell>
            <TableCell align="right">수량</TableCell>
            <TableCell align="right">총액</TableCell>
            <TableCell>평가</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>액션</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participations.map((participation) => (
            <TableRow
              key={participation.id}
              sx={
                participation.isSelectedBidder
                  ? { bgcolor: "rgba(76, 175, 80, 0.1)" }
                  : {}
              }>
              <TableCell>{participation.companyName}</TableCell>
              {isPriceSuggestion && (
                <TableCell>{participation.proposalText || "-"}</TableCell>
              )}
              <TableCell align="right">
                {formatNumber(participation.unitPrice)}원
              </TableCell>
              <TableCell align="right">{participation.quantity}</TableCell>
              <TableCell align="right">
                {formatNumber(participation.totalAmount)}원
              </TableCell>
              <TableCell>
                {participation.isEvaluated ? (
                  <Chip
                    label={`${participation.evaluationScore || 0}점`}
                    color="success"
                    size="small"
                  />
                ) : canEvaluate ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => onEvaluate && onEvaluate(participation)}>
                    평가하기
                  </Button>
                ) : (
                  "미평가"
                )}
              </TableCell>
              <TableCell>
                {participation.isSelectedBidder ? (
                  <Chip label="낙찰자" color="success" size="small" />
                ) : (
                  "대기중"
                )}
              </TableCell>
              <TableCell>
                {canSelect && !hasSelectedBidder && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      onSelectWinner && onSelectWinner(participation)
                    }
                    disabled={!participation.isEvaluated}>
                    낙찰자 선정
                  </Button>
                )}

                {canContract && participation.isSelectedBidder && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() =>
                      onCreateContract && onCreateContract(participation)
                    }
                    sx={{ ml: 1 }}>
                    계약 생성
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ParticipationList;
