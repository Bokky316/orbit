// src/redux/store.js

import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from 'redux';
import projectReducer from "./projectSlice";
import purchaseRequestReducer from "./purchaseRequestSlice";
import approvalReducer from "./approvalSlice";
// import authReducer from "@/store/authSlice"; // 예시로 추가, 필요에 따라 사용
// import uiReducer from '@/store/uiSlice'; // 예시로 추가, 필요에 따라 사용

/**
 * Redux Persist의 설정을 정의합니다.
 * - key : localStorage에 저장될 키 이름을 지정합니다.
 * - storage: 상태를 저장할 스토리지를 정의합니다. 여기서는 localStorage를 사용합니다.
 * - whitelist: Redux의 어떤 리듀서를 저장할지 결정합니다.
 */
const persistConfig = {
    key: "root",
    storage,
    whitelist: ["project", "purchaseRequest", "approval"], // 프로젝트, 구매 요청, 결재 관련 리듀서만 저장
};

/**
 * 루트 리듀서 생성
 * - combineReducers를 사용하여 여러 리듀서를 하나로 병합
 */
const rootReducer = combineReducers({
    project: projectReducer,
    purchaseRequest: purchaseRequestReducer,
    approval: approvalReducer,
    // auth: authReducer, // 예시로 추가, 필요에 따라 사용
    // ui: uiReducer, // 예시로 추가, 필요에 따라 사용
});

/**
 * Persisted Reducer 생성
 * - Redux Persist 설정을 적용한 리듀서를 생성
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Redux Store 생성
 * - Redux Toolkit의 configureStore 사용
 * - Middleware 설정에서 Redux Persist 관련 액션을 무시하도록 serializableCheck 조정
 */
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, "persist/PERSIST", "persist/REHYDRATE"],
                ignoredActionPaths: ['payload.error', 'meta.arg'],
                // ignoredPaths: ['survey.responses'], // survey 관련 설정 제거
            },
        }),
});

/**
 * Redux Persistor 생성
 * - persistStore를 사용하여 Redux Store와 Redux Persist를 연결
 * - 상태가 localStorage에 저장되고 복구될 수 있도록 설정
 */
export const persistor = persistStore(store);
