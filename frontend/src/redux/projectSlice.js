// src/redux/projectSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 프로젝트 목록을 가져오는 비동기 액션
 */
export const fetchProjects = createAsyncThunk(
    'project/fetchProjects',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'GET',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch projects: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 프로젝트를 삭제하는 비동기 액션
 */
export const deleteProject = createAsyncThunk(
    'project/deleteProject',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete project: ${response.status} - ${errorText}`);
            }
            return id;
        } catch (error) {
            console.error('Error deleting project:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 프로젝트를 생성하는 비동기 액션
 */
export const createProject = createAsyncThunk(
    'project/createProject',
    async (projectData, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                body: JSON.stringify(projectData),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create project: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating project:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 프로젝트를 수정하는 비동기 액션
 */
export const updateProject = createAsyncThunk(
    'project/updateProject',
    async ({ id, projectData }, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects/${id}`, {
                method: 'PUT',
                body: JSON.stringify(projectData),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update project: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating project:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 초기 상태 정의
 */
const initialState = {
    projects: [],
    filters: {
        searchTerm: '',
        startDate: '',
        endDate: '',
        status: ''
    },
    loading: false,
    error: null
};

/**
 * 슬라이스 생성
 */
const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        setProjects: (state, action) => {
            state.projects = action.payload;
        },
        setSearchTerm: (state, action) => {
            state.filters.searchTerm = action.payload;
        },
        setStartDate: (state, action) => {
            state.filters.startDate = action.payload;
        },
        setEndDate: (state, action) => {
            state.filters.endDate = action.payload;
        },
        setStatus: (state, action) => {
            state.filters.status = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = action.payload;
            })
            .addCase(fetchProjects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = state.projects.filter(project => project.id !== action.payload);
            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.loading = false;
                state.projects.push(action.payload); // 새로운 프로젝트를 목록에 추가
            })
            .addCase(createProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = state.projects.map(project =>
                    project.id === action.payload.id ? action.payload : project
                ); // 프로젝트 업데이트
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    setProjects,
    setSearchTerm,
    setStartDate,
    setEndDate,
    setStatus
} = projectSlice.actions;

export default projectSlice.reducer;
