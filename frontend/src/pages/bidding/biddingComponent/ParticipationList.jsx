import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Tooltip,
  IconButton
} from "@mui/material";
import {
  StarRate as WinnerIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon
} from "@mui/icons-material";
import moment from "moment";
import { formatNumber } from "../helpers/commonBiddingHelpers";

function ParticipationList({
  participations,
  bidding,
  isClosed,
  canEvaluateEach,
  canSelectWinner,
  canCreateContract,
  onEvaluate,
  onSelectWinner,
  onCreateContract
}) {
  const hasWinner = participations.some((p) => p.isSelectedBidder);

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>공급사명</TableCell>
            <TableCell>참여일시</TableCell>
            <TableCell align="right">제안 단가</TableCell>
            <TableCell align="right">제안 총액</TableCell>
            <TableCell>평가상태</TableCell>
            <TableCell>상태</TableCell>
            <TableCell align="right">작업</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participations.map((p) => {
            const showEvaluateButton =
              isClosed && canEvaluateEach && !p.isEvaluated;

            // 디버깅 출력
            console.log(`[참여자: ${p.companyName}]`, {
              전달받은_isClosed: isClosed,
              canEvaluateEach,
              isEvaluated: p.isEvaluated,
              showEvaluateButton
            });

            return (
              <TableRow key={p.id}>
                <TableCell>
                  {p.companyName}
                  {p.isSelectedBidder && (
                    <Tooltip title="낙찰자">
                      <WinnerIcon
                        color="warning"
                        sx={{ ml: 1, verticalAlign: "middle" }}
                      />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  {moment(p.participationDate).format("YYYY-MM-DD HH:mm")}
                </TableCell>
                <TableCell align="right">
                  {formatNumber(p.unitPrice)} 원
                </TableCell>
                <TableCell align="right">
                  {formatNumber(p.totalAmount)} 원
                </TableCell>
                <TableCell>
                  {p.isEvaluated ? (
                    <Chip
                      label={`${p.evaluationScore || 0}점`}
                      color="success"
                      size="small"
                    />
                  ) : isClosed ? (
                    <Chip label="미평가" color="warning" size="small" />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {p.isSelectedBidder ? (
                    <Chip label="낙찰" color="success" size="small" />
                  ) : isClosed && hasWinner ? (
                    <Chip label="탈락" color="error" size="small" />
                  ) : (
                    <Chip label="참여" color="info" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {/* 평가 버튼 */}
                  {showEvaluateButton && (
                    <Tooltip title="평가하기">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEvaluate(p)}
                        sx={{ mr: 1 }}>
                        <AssessmentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* 낙찰자 선정 버튼 */}
                  {isClosed &&
                    canSelectWinner &&
                    !hasWinner &&
                    p.isEvaluated && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => onSelectWinner(p)}
                        sx={{ mr: 1 }}>
                        낙찰
                      </Button>
                    )}

                  {/* 계약 초안 버튼 */}
                  {isClosed && canCreateContract && p.isSelectedBidder && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<DescriptionIcon />}
                      onClick={() => onCreateContract(p)}>
                      계약
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ParticipationList;
