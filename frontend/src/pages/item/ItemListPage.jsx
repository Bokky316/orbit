// src/pages/item/ItemListPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import {
  fetchAllItems,
  fetchAllCategories,
  deactivateItem,
  selectItems,
  selectCategories,
  selectItemCategoryLoading
} from '@redux/itemCategorySlice';

import ConfirmDialog from '@components/common/ConfirmDialog';

const ItemListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectItems);
  const categories = useSelector(selectCategories);
  const isLoading = useSelector(selectItemCategoryLoading);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    dispatch(fetchAllItems());
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const handleEditItem = (item) => {
    navigate(`/items/edit/${item.id}`);
  };

  const handleDeleteItem = (item) => {
    setSelectedItem(item);
    setOpenConfirmDialog(true);
  };

  const confirmDeleteItem = async () => {
    if (selectedItem) {
      await dispatch(deactivateItem(selectedItem.id));
      dispatch(fetchAllItems());
      setOpenConfirmDialog(false);
    }
  };

  const filteredItems = selectedCategory
    ? items.filter(item => item.categoryId === selectedCategory)
    : items;

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">아이템 관리</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>카테고리 필터</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="카테고리 필터"
            >
              <MenuItem value="">전체 카테고리</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/items/new')}
          >
            아이템 추가
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>아이템명</TableCell>
              <TableCell>코드</TableCell>
              <TableCell>카테고리</TableCell>
              <TableCell>규격</TableCell>
              <TableCell>표준가격</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell>{item.specification || '-'}</TableCell>
                <TableCell>{item.standardPrice.toLocaleString()}원</TableCell>
                <TableCell>
                  <Chip
                    label={item.useYn === 'Y' ? '활성' : '비활성'}
                    color={item.useYn === 'Y' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={openConfirmDialog}
        title="아이템 비활성화"
        content="이 아이템을 비활성화하시겠습니까?"
        onConfirm={confirmDeleteItem}
        onClose={() => setOpenConfirmDialog(false)}
      />
    </Container>
  );
};

export default ItemListPage;