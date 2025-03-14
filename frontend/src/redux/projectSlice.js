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
                // 에러 응답 처리 개선
                const errorText = await response.text();
                throw new Error(`${errorText || '프로젝트 삭제 실패'}`);
            }
            return id;
        } catch (error) {
            console.error('프로젝트 삭제 중 오류 발생:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 프로젝트를 생성하는 비동기 액션 (JSON)
 */
export const createProject = createAsyncThunk(
    'project/createProject',
    async (projectData, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
 * 프로젝트를 파일과 함께 생성하는 비동기 액션 (Multipart/form-data)
 */
export const createProjectWithFiles = createAsyncThunk(
    'project/createProjectWithFiles',
    async ({ projectData, files }, { rejectWithValue }) => {
        try {
            const formData = new FormData();

            // 프로젝트 데이터를 JSON 문자열로 추가
            formData.append('projectDTO', JSON.stringify(projectData));

            // 파일 추가
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            // Content-Type 헤더를 명시적으로 설정하지 않음 (브라우저가 자동으로 설정)
            const response = await fetchWithAuth(`${API_URL}projects`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create project: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating project with files:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 단일 프로젝트 조회 비동기 액션
 */
export const fetchProjectById = createAsyncThunk(
    'project/fetchProjectById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects/${id}`);
            if (!response.ok) throw new Error('프로젝트 조회 실패');
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 프로젝트 상태 변경 액션
 */
export const updateProjectStatus = createAsyncThunk(
    'project/updateStatus',
    async ({ id, statusType, statusCode }, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ statusType, statusCode })
            });
            if (!response.ok) throw new Error('상태 업데이트 실패');
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 프로젝트를 수정하는 비동기 액션 (JSON)
 */
export const updateProject = createAsyncThunk(
    'project/updateProject',
    async ({ id, projectData }, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}projects/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
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
 * 프로젝트를 파일과 함께 수정하는 비동기 액션 (Multipart/form-data)
 */
export const updateProjectWithFiles = createAsyncThunk(
    'project/updateProjectWithFiles',
    async ({ id, projectData, files }, { rejectWithValue }) => {
        try {
            const formData = new FormData();

            // 프로젝트 데이터를 JSON 문자열로 추가
            formData.append('projectDTO', JSON.stringify(projectData));

            // 파일 추가
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            // Content-Type 헤더를 명시적으로 설정하지 않음 (브라우저가 자동으로 설정)
            const response = await fetchWithAuth(`${API_URL}projects/${id}`, {
                method: 'PUT',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update project: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating project with files:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
  * 프로젝트에 첨부파일 추가 액션
  */
 export const addAttachmentsToProject = createAsyncThunk(
     'project/addAttachments',
     async ({ id, files }, { rejectWithValue }) => {
         try {
             const formData = new FormData();

             // 파일 추가
             for (let i = 0; i < files.length; i++) {
                 formData.append('files', files[i]);
             }

             // Content-Type 헤더를 명시적으로 설정하지 않음 (브라우저가 자동으로 설정)
             const response = await fetchWithAuth(`${API_URL}projects/${id}/attachments`, {
                 method: 'POST',
                 body: formData,
             });

             if (!response.ok) {
                 const errorText = await response.text();
                 throw new Error(`Failed to upload attachments: ${response.status} - ${errorText}`);
             }

             const data = await response.json();
             return data;
         } catch (error) {
             console.error('Error uploading attachments:', error);
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
        },
        resetProjectState: (state) => {
            state.projects = [];
            state.filters = initialState.filters;
        }
    },
    extraReducers: (builder) => {
        builder
            // fetchProjects
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

            // deleteProject
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

            // createProject
            .addCase(createProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.loading = false;
                state.projects.push(action.payload);
            })
            .addCase(createProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // createProjectWithFiles
            .addCase(createProjectWithFiles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProjectWithFiles.fulfilled, (state, action) => {
                state.loading = false;
                state.projects.push(action.payload);
            })
            .addCase(createProjectWithFiles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // updateProject
            .addCase(updateProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = state.projects.map(project =>
                    project.id === action.payload.id ? action.payload : project
                );
            })
            .addCase(updateProject.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // updateProjectWithFiles
            .addCase(updateProjectWithFiles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProjectWithFiles.fulfilled, (state, action) => {
                state.loading = false;
                state.projects = state.projects.map(project =>
                    project.id === action.payload.id ? action.payload : project
                );
            })
            .addCase(updateProjectWithFiles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // fetchProjectById
            .addCase(fetchProjectById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectById.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.projects.findIndex(p => p.id === action.payload.id);
                if (index === -1) {
                    state.projects.push(action.payload);
                } else {
                    state.projects[index] = action.payload;
                }
            })
            .addCase(fetchProjectById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // updateProjectStatus
            .addCase(updateProjectStatus.fulfilled, (state, action) => {
                const index = state.projects.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.projects[index] = {
                        ...state.projects[index],
                        ...action.payload
                    };
                }
            })

            // addAttachmentsToProject
            .addCase(addAttachmentsToProject.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addAttachmentsToProject.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.projects.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.projects[index] = action.payload;
                }
            })
            .addCase(addAttachmentsToProject.rejected, (state, action) => {
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
    resetProjectState,
    setStatus
} = projectSlice.actions;

export default projectSlice.reducer;