import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography
} from "@mui/material";
import moment from "moment";

/**
 * 초대된 공급사 목록 컴포넌트
 */
function SupplierList({ suppliers }) {
  if (!suppliers || suppliers.length === 0) {
    return <Typography variant="body1">초대된 공급사가 없습니다.</Typography>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>공급사명</TableCell>
            <TableCell>사업자번호</TableCell>
            <TableCell>초대 상태</TableCell>
            <TableCell>응답 시간</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>{supplier.companyName}</TableCell>
              <TableCell>{supplier.businessNo || "-"}</TableCell>
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
              <TableCell>
                {supplier.responseDate
                  ? moment(supplier.responseDate).format("YYYY-MM-DD HH:mm")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SupplierList;
