import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography
} from "@mui/material";

function SupplierList({ suppliers }) {
  if (!suppliers || suppliers.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body1">초대된 공급사가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>공급사명</TableCell>
            <TableCell>사업자번호</TableCell>
            <TableCell>카테고리</TableCell>
            <TableCell>담당자</TableCell>
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
                {supplier.contactName || "-"}
                {supplier.contactEmail && ` (${supplier.contactEmail})`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SupplierList;
