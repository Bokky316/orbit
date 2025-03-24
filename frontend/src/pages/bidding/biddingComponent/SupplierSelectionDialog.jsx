//SupplierRegistrationInitializer 와 ItemDataInitializer 의 데이터구조를 고려하여 작성함

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
  FilterList as FilterIcon
} from "@mui/icons-material";

// 공급자 선택 모달 컴포넌트
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

  // 구매 요청의 품목 카테고리 추출
  const requestCategories = useMemo(() => {
    if (!purchaseRequest || !purchaseRequest.items) return [];

    const categories = new Set();

    // 구매 요청 품목에서 카테고리 추출 로직
    const items = purchaseRequest.items || [];
    items.forEach((item) => {
      if (item.category) categories.add(item.category);
      if (item.sourcingCategory) categories.add(item.sourcingCategory);
    });

    return Array.from(categories);
  }, [purchaseRequest]);

  // 모든 소싱 카테고리 추출 (필터용)
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

  // 추천 비즈니스 타입 (구매 요청에 맞는)
  const recommendedBusinessTypes = useMemo(() => {
    // 구매 요청 타입이나 카테고리에 따른 비즈니스 타입 추천 로직
    // 비즈니스 로직에 맞게 수정 필요
    return purchaseRequest?.requestType ? [purchaseRequest.requestType] : [];
  }, [purchaseRequest]);

  // 필터링된 공급자 목록
  const filteredSuppliers = useMemo(() => {
    if (!Array.isArray(suppliers)) {
      console.error("suppliers가 배열이 아닙니다:", suppliers);
      return [];
    }

    let filtered = suppliers;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        (supplier) =>
          supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.businessNo?.includes(searchTerm) ||
          supplier.id?.toString().includes(searchTerm)
      );
    }

    // 카테고리 필터 적용
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (supplier) =>
          supplier.sourcingCategory === categoryFilter ||
          supplier.sourcingSubCategory === categoryFilter
      );
    }

    // 카테고리 관련성 점수 계산 (관련 카테고리 먼저 정렬)
    // 1. 구매 요청 카테고리와 직접 일치하는 경우 - 가장 높은 우선순위
    // 2. 구매 요청 카테고리와 하위 카테고리 일치하는 경우 - 중간 우선순위
    // 3. 일치하지 않는 경우 - 낮은 우선순위
    if (requestCategories.length > 0) {
      filtered = filtered.sort((a, b) => {
        const aDirectMatch = requestCategories.includes(a.sourcingCategory);
        const bDirectMatch = requestCategories.includes(b.sourcingCategory);

        const aSubMatch = requestCategories.includes(a.sourcingSubCategory);
        const bSubMatch = requestCategories.includes(b.sourcingSubCategory);

        if (aDirectMatch && !bDirectMatch) return -1;
        if (!aDirectMatch && bDirectMatch) return 1;
        if (aSubMatch && !bSubMatch) return -1;
        if (!aSubMatch && bSubMatch) return 1;

        return 0;
      });
    }

    return filtered;
  }, [suppliers, searchTerm, categoryFilter, requestCategories]);

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 카테고리 필터 변경 핸들러
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // 공급자가 구매 요청 카테고리와 관련 있는지 확인
  const isSupplierRelevant = (supplier) => {
    if (requestCategories.length === 0) return false;

    return requestCategories.some(
      (category) =>
        supplier.sourcingCategory === category ||
        supplier.sourcingSubCategory === category
    );
  };

  // 컴포넌트 초기화
  useEffect(() => {
    // 모달이 열릴 때마다 검색어 초기화
    if (open) {
      setSearchTerm("");
      setCategoryFilter("all");
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          height: "90vh",
          display: "flex",
          flexDirection: "column"
        }
      }}>
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
        <Typography variant="h6" sx={{ lineHeight: 1 }}>
          공급자 선택
        </Typography>
        <IconButton
          color="inherit"
          onClick={onClose}
          size="small"
          sx={{ p: 0.5 }}>
          ✕
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pt: 2
        }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            bgcolor: "background.paper",
            pb: 2
          }}>
          <Grid container spacing={2}>
            <Grid item xs={10}>
              <TextField
                fullWidth
                label="업체명, 사업자등록번호 검색"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ height: "100%" }}
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterIcon />}>
                필터
              </Button>
            </Grid>
          </Grid>

          {showFilters && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>소싱 카테고리</InputLabel>
                <Select
                  value={categoryFilter}
                  label="소싱 카테고리"
                  onChange={handleCategoryFilterChange}>
                  <MenuItem value="all">전체 카테고리</MenuItem>
                  {allSourcingCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category} {requestCategories.includes(category) && "⭐"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}>
            선택된 공급자: {selectedSuppliers.length}개
          </Typography>
        </Box>

        {requestCategories.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="primary">
              <InfoIcon
                fontSize="small"
                sx={{ verticalAlign: "middle", mr: 0.5 }}
              />
              품목 카테고리와 관련된 공급자를 우선 표시합니다.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
              {requestCategories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onClick={() => setCategoryFilter(category)}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ flexGrow: 1, overflowY: "auto", pt: 1 }}>
          <List disablePadding>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => {
                const isRelevant = isSupplierRelevant(supplier);
                return (
                  <ListItem
                    key={supplier.id}
                    disableGutters
                    sx={{
                      mb: 1,
                      border: "1px solid",
                      borderColor: isRelevant ? "primary.main" : "divider",
                      borderRadius: 1,
                      overflow: "hidden",
                      bgcolor: isRelevant ? "primary.50" : "inherit"
                    }}>
                    <ListItemButton
                      onClick={() => onSelect(supplier)}
                      selected={selectedSuppliers.some(
                        (s) => s.id === supplier.id
                      )}
                      sx={{
                        p: 2,
                        "&.Mui-selected": {
                          backgroundColor: "primary.light"
                        }
                      }}>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              noWrap>
                              {selectedSuppliers.some(
                                (s) => s.id === supplier.id
                              )
                                ? "✓ "
                                : ""}
                              {supplier.name}
                              {isRelevant && " ⭐"}
                            </Typography>
                            <Box>
                              <Chip
                                label={supplier.businessType || "업종 미지정"}
                                color={
                                  recommendedBusinessTypes.includes(
                                    supplier.businessType
                                  )
                                    ? "primary"
                                    : "default"
                                }
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={
                                  supplier.sourcingCategory || "카테고리 미지정"
                                }
                                color={
                                  requestCategories.includes(
                                    supplier.sourcingCategory
                                  )
                                    ? "secondary"
                                    : "default"
                                }
                                size="small"
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mt: 1,
                              alignItems: "center"
                            }}>
                            <Typography variant="body2" noWrap>
                              사업자등록번호: {supplier.businessNo || "미등록"}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap>
                              {supplier.sourcingSubCategory &&
                                `${supplier.sourcingSubCategory}`}
                              {supplier.sourcingDetailCategory &&
                                ` > ${supplier.sourcingDetailCategory}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })
            ) : (
              <ListItem>
                <ListItemText
                  primary="검색 결과가 없습니다."
                  primaryTypographyProps={{ align: "center" }}
                  secondary="다른 검색어나 필터 조건을 사용해보세요."
                  secondaryTypographyProps={{ align: "center" }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="secondary">
          취소
        </Button>
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
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      businessNo: PropTypes.string,
      businessType: PropTypes.string,
      sourcingCategory: PropTypes.string,
      sourcingSubCategory: PropTypes.string,
      sourcingDetailCategory: PropTypes.string
    })
  ),
  selectedSuppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    })
  ),
  onSelect: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  purchaseRequest: PropTypes.shape({
    id: PropTypes.number,
    requestType: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        itemName: PropTypes.string,
        specification: PropTypes.string,
        category: PropTypes.string,
        sourcingCategory: PropTypes.string
      })
    )
  })
};

// 기본값 설정
SupplierSelectionDialog.defaultProps = {
  suppliers: [],
  selectedSuppliers: [],
  purchaseRequest: null
};

export default SupplierSelectionDialog;
