// src/store/slices/projectSlice.js

import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {object} ProjectState
 * @property {array} projects - 프로젝트 목록
 * @property {object} filters - 검색 및 필터 조건
 */

const initialState = {
  projects: [],
  filters: {
    searchTerm: '',
    startDate: '',
    endDate: '',
    status: ''
  }
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    /**
     * 프로젝트 목록을 설정합니다.
     * @param {ProjectState} state - 현재 상태
     * @param {object} action - 액션 객체
     * @param {array} action.payload - 프로젝트 목록
     */
    setProjects: (state, action) => {
      state.projects = action.payload;
    },
    /**
     * 검색어를 설정합니다.
     * @param {ProjectState} state - 현재 상태
     * @param {object} action - 액션 객체
     * @param {string} action.payload - 검색어
     */
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    /**
     * 시작 날짜를 설정합니다.
     * @param {ProjectState} state - 현재 상태
     * @param {object} action - 액션 객체
     * @param {string} action.payload - 시작 날짜
     */
    setStartDate: (state, action) => {
      state.filters.startDate = action.payload;
    },
    /**
     * 종료 날짜를 설정합니다.
     * @param {ProjectState} state - 현재 상태
     * @param {object} action - 액션 객체
     * @param {string} action.payload - 종료 날짜
     */
    setEndDate: (state, action) => {
      state.filters.endDate = action.payload;
    },
    /**
     * 상태 필터를 설정합니다.
     * @param {ProjectState} state - 현재 상태
     * @param {object} action - 액션 객체
     * @param {string} action.payload - 상태 필터
     */
    setStatus: (state, action) => {
      state.filters.status = action.payload;
    }
  }
});

export const {
  setProjects,
  setSearchTerm,
  setStartDate,
  setEndDate,
  setStatus
} = projectSlice.actions;

export default projectSlice.reducer;
