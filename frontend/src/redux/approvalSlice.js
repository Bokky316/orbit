// src/store/slices/approvalSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  approvals: [],
  filters: {
    searchTerm: '',
    requestDate: ''
  }
};

const approvalSlice = createSlice({
  name: 'approval',
  initialState,
  reducers: {
    setApprovals: (state, action) => {
      state.approvals = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    setRequestDate: (state, action) => {
      state.filters.requestDate = action.payload;
    }
  }
});

export const {
  setApprovals,
  setSearchTerm,
  setRequestDate
} = approvalSlice.actions;

export default approvalSlice.reducer;
