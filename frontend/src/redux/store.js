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
import purchaseRequestReducer, {
  websocketMiddleware
} from "./purchaseRequestSlice";
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
    "approval",
    "approvalAdmin",
    "supplier",
    "auth",
    "commonCode",
    "itemCategory",
    "notifications" // 알림 상태
  ]
};

const rootReducer = combineReducers({
  project: projectReducer,
  purchaseRequest: purchaseRequestReducer,
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

const persistedReducer = persistReducer(persistConfig, rootReducer);

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
          "purchaseRequest/wsUpdate"
        ],
        ignoredActionPaths: ["payload.error", "meta.arg"]
      }
    }).concat(websocketMiddleware) // 웹소켓 미들웨어 추가
});

export const persistor = persistStore(store);
