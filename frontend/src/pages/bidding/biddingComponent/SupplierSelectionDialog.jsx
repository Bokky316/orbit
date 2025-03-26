// SupplierSelectionDialog.js
import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from "@mui/material";
import {
  Search as SearchIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from "@mui/icons-material";

function SupplierSelectionDialog({
  open,
  onClose,
  suppliers,
  selectedSuppliers,
  onSelect,
  onComplete,
  purchaseRequest
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const requestCategories = useMemo(() => {
    if (!purchaseRequest || !purchaseRequest.items) return [];
    const categories = new Set();
    purchaseRequest.items.forEach((item) => {
      if (item.category) categories.add(item.category);
      if (item.sourcingCategory) categories.add(item.sourcingCategory);
    });
    return Array.from(categories);
  }, [purchaseRequest]);

  const allSourcingCategories = useMemo(() => {
    if (!Array.isArray(suppliers)) return [];
    const categories = new Set();
    suppliers.forEach((supplier) => {
      if (supplier.sourcingCategory) {
        categories.add(supplier.sourcingCategory);
      }
    });
    return Array.from(categories).sort();
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (!Array.isArray(suppliers)) return [];
    let filtered = suppliers;
    if (searchTerm) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.businessNo?.includes(searchTerm) ||
          supplier.id?.toString().includes(searchTerm)
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (supplier) =>
          supplier.sourcingCategory === categoryFilter ||
          supplier.sourcingSubCategory === categoryFilter
      );
    }
    if (requestCategories.length > 0) {
      filtered = filtered.sort((a, b) => {
        const aMatch = requestCategories.includes(a.sourcingCategory) ? 1 : 0;
        const bMatch = requestCategories.includes(b.sourcingCategory) ? 1 : 0;
        return bMatch - aMatch;
      });
    }
    return filtered;
  }, [suppliers, searchTerm, categoryFilter, requestCategories]);

  const isSupplierRelevant = (supplier) => {
    return requestCategories.some(
      (cat) =>
        supplier.sourcingCategory === cat ||
        supplier.sourcingSubCategory === cat
    );
  };

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setCategoryFilter("all");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          px: 2
        }}>
        <Typography variant="h6">공급자 선택</Typography>
        <IconButton color="inherit" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={10}>
            <TextField
              fullWidth
              label="업체명, 사업자등록번호 검색"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters((prev) => !prev)}>
              필터
            </Button>
          </Grid>
        </Grid>

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>소싱 카테고리</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="소싱 카테고리">
                <MenuItem value="all">전체 카테고리</MenuItem>
                {allSourcingCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat} {requestCategories.includes(cat) ? "⭐" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {requestCategories.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="primary">
              <InfoIcon
                fontSize="small"
                sx={{ mr: 0.5, verticalAlign: "middle" }}
              />
              품목 카테고리와 관련된 공급자를 우선 표시합니다.
            </Typography>
            <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {requestCategories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  variant="outlined"
                  onClick={() => setCategoryFilter(cat)}
                />
              ))}
            </Box>
          </Box>
        )}

        <List>
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier) => (
              <ListItem
                key={supplier.id}
                disableGutters
                sx={{ mb: 1, border: "1px solid #ccc", borderRadius: 1 }}>
                <ListItemButton
                  onClick={() => onSelect(supplier)}
                  selected={selectedSuppliers.some(
                    (s) => s.id === supplier.id
                  )}>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between"
                        }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {supplier.name} {isSupplierRelevant(supplier) && "⭐"}
                        </Typography>
                        <Chip
                          label={supplier.businessType || "업종 미지정"}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between"
                        }}>
                        <Typography variant="body2">
                          사업자등록번호: {supplier.businessNo || "-"}
                        </Typography>
                        <Typography variant="body2">
                          {supplier.sourcingCategory} &gt;{" "}
                          {supplier.sourcingSubCategory || "-"}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <Box sx={{ textAlign: "center", p: 3 }}>
              <Typography variant="body2">검색 결과가 없습니다.</Typography>
            </Box>
          )}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={onComplete}
          variant="contained"
          color="primary"
          disabled={selectedSuppliers.length === 0}>
          선택 완료 ({selectedSuppliers.length}개)
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SupplierSelectionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  suppliers: PropTypes.array.isRequired,
  selectedSuppliers: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  purchaseRequest: PropTypes.object
};

export default SupplierSelectionDialog;
