// src/App.js

import React from "react";
import { Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import Home from "./pages/Home.jsx";
import BiddingListPage from "./pages/bidding/BiddingListPage";
import BiddingFormPage from "./pages/bidding/BiddingFormPage";
import ErrorPage from "./pages/error/ErrorPage";
import ProjectListPage from "./pages/procurement/ProjectListPage.jsx";
import ProjectDetailPage from "./pages/procurement/ProjectDetailPage.jsx";
import PurchaseRequestListPage from "./pages/procurement/PurchaseRequestListPage.jsx";
import PurchaseRequestDetailPage from "./pages/procurement/PurchaseRequestDetailPage.jsx";
import ApprovalListPage from "./pages/procurement/ApprovalListPage.jsx";
import ApprovalDetailPage from "./pages/procurement/ApprovalDetailPage.jsx";

/**
 * React 애플리케이션의 메인 컴포넌트
 * @returns {JSX.Element}
 */
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Routes>
          {/* Home 페이지 */}
          <Route path="/" element={<Home />} />

          {/* 입찰 관련 페이지 */}
          <Route path="/biddings" element={<BiddingListPage />} />
          <Route
            path="/biddings/new"
            element={<BiddingFormPage mode="create" />}
          />
          <Route
            path="/biddings/edit/:id"
            element={<BiddingFormPage mode="edit" />}
          />

          {/* 프로젝트 관리 페이지 */}
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />

          {/* 구매 요청 관리 페이지 */}
          <Route path="/purchase-requests" element={<PurchaseRequestListPage />} />
          <Route path="/purchase-requests/:id" element={<PurchaseRequestDetailPage />} />

          {/* 결재 관리 페이지 */}
          <Route path="/approvals" element={<ApprovalListPage />} />
          <Route path="/approvals/:id" element={<ApprovalDetailPage />} />

          {/* 에러 페이지 */}
          <Route path="*" element={<ErrorPage type="notFound" />} />
        </Routes>
      </PersistGate>
    </Provider>
  );
}

export default App;
