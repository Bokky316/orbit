import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";

// 기존 리듀서들
import projectReducer from "./projectSlice";
import purchaseRequestReducer, { websocketMiddleware } from "./purchaseRequestSlice";
import purchaseRequestDashboardReducer, { websocketMiddleware as dashboardWebsocketMiddleware } from "./purchaseRequestDashboardSlice";
import approvalReducer from "./approvalSlice";
import approvalAdminReducer from "./approvalAdminSlice";
import supplierReducer from "./supplier/supplierSlice";
import authReducer from "./authSlice";
import commonCodeReducer from "./commonCodeSlice";
import itemCategoryReducer from "./itemCategorySlice";
import memberDashboardReducer from "./memberDashboardSlice";
// 알림 리듀서 추가
import notificationReducer from "./notificationSlice";
import biddingReducer from "./biddingSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "project",
    "purchaseRequest",
    "purchaseRequestDashboard",
    "approval",
    "approvalAdmin",
    "supplier",
    "auth",
    "commonCode",
    "itemCategory",
    "notifications" // 알림 상태
  ]
};

/**
 * 루트 리듀서 생성
 * - combineReducers를 사용하여 여러 리듀서를 하나로 병합
 * - purchaseRequestDashboard 리듀서 추가하여 구매요청 대시보드 관련 상태 관리
 */
const rootReducer = combineReducers({
  project: projectReducer,
  purchaseRequest: purchaseRequestReducer,
  purchaseRequestDashboard: purchaseRequestDashboardReducer, // 구매요청 대시보드 리듀서 추가
  approval: approvalReducer,
  approvalAdmin: approvalAdminReducer,
  supplier: supplierReducer,
  auth: authReducer,
  commonCode: commonCodeReducer,
  itemCategory: itemCategoryReducer,
  notifications: notificationReducer, // 알림 리듀서
  memberDashboard: memberDashboardReducer,
  bidding: biddingReducer
});

/**
 * Persisted Reducer 생성
 * - Redux Persist 설정을 적용한 리듀서를 생성
 * - 이를 통해 모든 상태가 로컬 스토리지에 저장되고 복원됨
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Redux Store 생성
 * - Redux Toolkit의 configureStore 사용
 * - Middleware 설정에서 Redux Persist 관련 액션을 무시하도록 serializableCheck 조정
 * - websocketMiddleware 추가 - 웹소켓 연결 및 메시지 관리
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          "persist/PERSIST",
          "persist/REHYDRATE",
          // 웹소켓 액션 추가
          "purchaseRequest/wsUpdate",
          "purchaseRequestDashboard/wsUpdate"
        ],
        ignoredActionPaths: ["payload.error", "meta.arg"]
      }
    }).concat([websocketMiddleware, dashboardWebsocketMiddleware]) // 웹소켓 미들웨어 추가
});

/**
 * Redux Persistor 생성
 * - persistStore를 사용하여 Redux Store와 Redux Persist를 연결
 * - 상태가 localStorage에 저장되고 복구될 수 있도록 설정
 * - 모든 상태가 자동으로 저장되고 복원됨
 */
export const persistor = persistStore(store);
