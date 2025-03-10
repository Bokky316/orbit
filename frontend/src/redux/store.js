// src/redux/store.js

import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from 'redux';
import projectReducer from "./projectSlice";
import purchaseRequestReducer from "./purchaseRequestSlice";
import approvalReducer from "./approvalSlice";
import authReducer from "./authSlice"; // authSlice 추가
import supplierReducer from "./supplier/supplierSlice";

/**
 * Redux Persist의 설정을 정의합니다.
 * - key : localStorage에 저장될 키 이름을 지정합니다.
 * - storage: 상태를 저장할 스토리지를 정의합니다. 여기서는 localStorage를 사용합니다.
 * - whitelist: Redux의 어떤 리듀서를 저장할지 결정합니다.
 */
const persistConfig = {
    key: "root",
    storage,
    whitelist: ["project", "purchaseRequest", "approval", "auth", "supplier"], // auth 리듀서 추가
};

/**
 * 루트 리듀서 생성
 * - combineReducers를 사용하여 여러 리듀서를 하나로 병합
 * - auth 리듀서를 추가하여 인증 관련 상태 관리
 */
const rootReducer = combineReducers({
    project: projectReducer,
    purchaseRequest: purchaseRequestReducer,
    approval: approvalReducer,
    auth: authReducer, // auth 리듀서 추가
    supplier: supplierReducer,
});

/**
 * Persisted Reducer 생성
 * - Redux Persist 설정을 적용한 리듀서를 생성
 * - 이를 통해 auth 상태를 포함한 모든 상태가 로컬 스토리지에 저장되고 복원됨
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Redux Store 생성
 * - Redux Toolkit의 configureStore 사용
 * - Middleware 설정에서 Redux Persist 관련 액션을 무시하도록 serializableCheck 조정
 * - auth 리듀서가 포함된 persistedReducer를 사용하여 스토어 구성
 */
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, "persist/PERSIST", "persist/REHYDRATE"],
                ignoredActionPaths: ['payload.error', 'meta.arg'],
            },
        }),
});

/**
 * Redux Persistor 생성
 * - persistStore를 사용하여 Redux Store와 Redux Persist를 연결
 * - 상태가 localStorage에 저장되고 복구될 수 있도록 설정
 * - auth 상태를 포함한 모든 상태가 자동으로 저장되고 복원됨
 */
export const persistor = persistStore(store);
