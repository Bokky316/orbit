
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  purchaseRequests: [],
  filters: {
    searchTerm: '',
    requestDate: '',
    status: ''
  }
};

const purchaseRequestSlice = createSlice({
  name: 'purchaseRequest',
  initialState,
  reducers: {
    setPurchaseRequests: (state, action) => {
      state.purchaseRequests = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    setRequestDate: (state, action) => {
      state.filters.requestDate = action.payload;
    },
    setStatus: (state, action) => {
      state.filters.status = action.payload;
    }
  }
});

export const {
  setPurchaseRequests,
  setSearchTerm,
  setRequestDate,
  setStatus
} = purchaseRequestSlice.actions;

export default purchaseRequestSlice.reducer;
