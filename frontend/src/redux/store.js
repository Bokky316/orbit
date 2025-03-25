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

/**
* Redux Persist의 설정을 정의합니다.
* - key : localStorage에 저장될 키 이름을 지정합니다.
* - storage: 상태를 저장할 스토리지를 정의합니다. 여기서는 localStorage를 사용합니다.
* - whitelist: Redux의 어떤 리듀서를 저장할지 결정합니다.
*/
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
   "memberDashboard"
 ]
};

/**
* 루트 리듀서 생성
* - combineReducers를 사용하여 여러 리듀서를 하나로 병합
*/
const rootReducer = combineReducers({
 project: projectReducer,
 purchaseRequest: purchaseRequestReducer,
 purchaseRequestDashboard: purchaseRequestDashboardReducer,
 approval: approvalReducer,
 approvalAdmin: approvalAdminReducer,
 supplier: supplierReducer,
 auth: authReducer,
 commonCode: commonCodeReducer,
 itemCategory: itemCategoryReducer,
 memberDashboard: memberDashboardReducer
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
         "purchaseRequest/wsUpdate",
         "purchaseRequestDashboard/wsUpdate"
       ],
       ignoredActionPaths: ["payload.error", "meta.arg"]
     }
   }).concat([websocketMiddleware, dashboardWebsocketMiddleware])
});

/**
* Redux Persistor 생성
* - persistStore를 사용하여 Redux Store와 Redux Persist를 연결
* - 상태가 localStorage에 저장되고 복구될 수 있도록 설정
* - 모든 상태가 자동으로 저장되고 복원됨
*/
export const persistor = persistStore(store);