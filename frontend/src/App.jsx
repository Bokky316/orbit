import React from "react";
import { useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";

import Home from "@/pages/Home";
import Login from "@/pages/member/Login";
import RegisterMember from "@/pages/member/RegisterMember";
import RegisterSupplier from "@/pages/member/RegisterSupplier";
import BiddingListPage from "@/pages/bidding/BiddingListPage";
import BiddingDetailPage from "./pages/bidding/BiddingDetailPage";
import BiddingFormPage from "@/pages/bidding/BiddingFormPage";
import BiddingEvaluationListPage from "./pages/bidding/BiddingEvaluationListPage";
import BiddingEvaluationDetailPage from "./pages/bidding/BiddingEvaluationDetailPage";
import SupplierBiddingListPage from "./pages/bidding/SupplierBiddingListPage";
import SupplierBiddingDetailPage from "./pages/bidding/SupplierBiddingDetailPage";
import ContractsListPage from "./pages/contract/ContractsListPage";
import ContractDetailPage from "./pages/contract/ContractDetailPage";
import ContractSignPage from "./pages/contract/ContractSignPage";
import SupplierContractsListPage from "./pages/contract/SupplierContractsListPage";
import SupplierContractDetailPage from "./pages/contract/SupplierContractDetailPage";
import BiddingOrderListPage from "./pages/order/BiddingOrderListPage";
import BiddingOrderDetailPage from "./pages/order/BiddingOrderDetailPage";
import SupplierOrdersListPage from "./pages/order/SupplierOrdersListPage";
import SupplierOrderDetailPage from "./pages/order/SupplierOrderDetailPage";
import ErrorPage from "@/pages/error/ErrorPage";
import ProjectListPage from "@/pages/procurement/ProjectListPage";
import ProjectDetailPage from "@/pages/procurement/ProjectDetailPage";
import ProjectCreatePage from "@/pages/procurement/ProjectCreatePage";
import ProjectEditPage from "@/pages/procurement/ProjectEditPage";
import PurchaseRequestListPage from "@/pages/procurement/PurchaseRequestListPage";
import PurchaseRequestDetailPage from "@/pages/procurement/PurchaseRequestDetailPage";
import PurchaseRequestCreatePage from "@/pages/procurement/PurchaseRequestCreatePage";
import PurchaseRequestEditPage from "@/pages/procurement/PurchaseRequestEditPage";
import PurchaseRequestDashboard from "@/pages/procurement/PurchaseRequestDashboard";
import MemberDashboard from "@/pages/dashboard/MemberDashboard";
import ApprovalListPage from "@/pages/approval/ApprovalListPage";
import ApprovalDetailPage from "@/pages/approval/ApprovalDetailPage";
import ApprovalManagementPage from "@/pages/approval/ApprovalManagementPage";
import ApprovalLineAdministration from '@/pages/approval/ApprovalLineAdministration';
import InvoicesListPage from "@/pages/invoice/InvoicesListPage"
import InvoiceDetailPage from "@/pages/invoice/InvoiceDetailPage"
import InvoiceEditPage from "@/pages/invoice/InvoiceEditPage"
/* import InvoiceCreatePage from "@/pages/invoice/InvoiceCreatePage"
import PaymentListPage from '@/pages/payment/PaymentListPage';
import PaymentProcessPage from '@/pages/payment/PaymentProcessPage'; */
import SupplierListPage from "@/pages/supplier/SupplierListPage";
import SupplierRegistrationPage from "@/pages/supplier/SupplierRegistrationPage";
import SupplierReviewPage from "@/pages/supplier/SupplierReviewPage";
import SupplierApprovalListPage from "@/pages/supplier/SupplierApprovalListPage";
import CommonCodeManagement from '@/pages/commonCode/CommonCodeManagement';
import CategoryListPage from "@pages/item/CategoryListPage";
import CategoryFormPage from "@pages/item/CategoryFormPage";
import ItemListPage from "@pages/item/ItemListPage";
import ItemFormPage from "@pages/item/ItemFormPage";
import DeliveryListPage from "@/pages/delivery/DeliveryListPage";
import DeliveryCreatePage from "@/pages/delivery/DeliveryCreatePage";
import DeliveryDetailPage from "@/pages/delivery/DeliveryDetailPage";
import DeliveryEditPage from "@/pages/delivery/DeliveryEditPage";
import InvoicesListPage from "@/pages/invoice/InvoicesListPage";
import InvoiceDetailPage from "@/pages/invoice/InvoiceDetailPage";
import InvoiceEditPage from "@/pages/invoice/InvoiceEditPage";
import InvoiceCreatePage from "@/pages/invoice/InvoiceCreatePage";
import PaymentListPage from "@/pages/payment/PaymentListPage";
import PaymentDetailPage from "@/pages/payment/PaymentDetailPage";
import PaymentCreatePage from "@/pages/payment/PaymentCreatePage";
import ChartDashboard from "@/pages/statistics/ChartDashboard";
import AdminMemberPage from "@/pages/member/AdminMemberPage";

import DashboardPage from "@/pages/dashboard/DashboardPage";
import SupplierDashboard from "@/pages/dashboard/SupplierDashboard";
import ApprovalListPage from "@/pages/procurement/ApprovalListPage";
import ApprovalDetailPage from "@/pages/procurement/ApprovalDetailPage";
import ApprovalManagementPage from "@/pages/approval/ApprovalManagementPage"; // 추가
import DeliveryListPage from "@/pages/delivery/DeliveryListPage"
import DeliveryCreatePage from "@/pages/delivery/DeliveryCreatePage"
import DeliveryDetailPage from "@/pages/delivery/DeliveryDetailPage"
import DeliveryEditPage from "@/pages/delivery/DeliveryEditPage"

/**
 * AppContent 컴포넌트: 라우팅 설정 및 페이지 레이아웃 관리
 * @returns {JSX.Element} - 전체 앱 콘텐츠
 */

function AppContent() {
  const { isLoggedIn, roles, user } = useSelector((state) => state.auth);
  const roleList = roles || user?.roles || [];
  const isSupplier = roleList.some(
    (role) => role === "SUPPLIER" || role === "ROLE_SUPPLIER"
  );

  console.log("auth 상태:", { isLoggedIn, roleList, isSupplier });
  const DashboardPage = () => <MemberDashboard />;

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<RegisterMember />} />
          <Route path="/signup/supplier" element={<RegisterSupplier />} />

          {isLoggedIn ? (
            <Route element={<Home />}>
              <Route path="/" element={isSupplier ? <SupplierDashboard /> : <DashboardPage />} />

              {isSupplier && (
                <>
                  <Route path="/suppliers/dashboard" element={<SupplierDashboard />} />
                  <Route path="/suppliers/biddings" element={<SupplierBiddingListPage />} />
                  <Route path="/suppliers/biddings/:id" element={<SupplierBiddingDetailPage />} />
                  <Route path="/suppliers/contracts" element={<SupplierContractsListPage />} />
                  <Route path="/suppliers/contracts/:id" element={<SupplierContractDetailPage />} />
                  <Route path="/suppliers/orders" element={<SupplierOrdersListPage />} />
                  <Route path="/suppliers/orders/:id" element={<SupplierOrderDetailPage />} />
                </>
              )}

              {/* 입고 관리 */}
              <Route path="/deliveries" element={<DeliveryListPage />} />
              <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
              <Route path="/deliveries/edit/:id" element={<DeliveryEditPage />} />
              <Route
                path="/deliveries/new"
                element={<DeliveryCreatePage />}
              />

              {/* 송장 관리 */}
              <Route path="/invoices" element={<InvoicesListPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/invoices/edit/:id" element={<InvoiceEditPage />} />
              {/* <Route path="/invoices/create" element={<InvoiceCreatePage />} />
              <Route path="/payments" element={<PaymentListPage />} />
              <Route path="/payments/:invoiceId" element={<PaymentProcessPage />} /> */}

                  {/* 송장 관리 */}
                  <Route path="/invoices" element={<InvoicesListPage />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                  <Route
                    path="/invoices/edit/:id"
                    element={<InvoiceEditPage />}
                  />
                  <Route
                    path="/invoices/create"
                    element={<InvoiceCreatePage />}
                  />

                  {/* 지불 관리 */}
                  <Route path="/payments" element={<PaymentListPage />} />
                  <Route path="/payments/:id" element={<PaymentDetailPage />} />
                  <Route
                    path="/payments/create"
                    element={<PaymentCreatePage />}
                  />

                  {/* 협력사 관리 */}
                  <Route path="/supplier" element={<SupplierListPage />} />
                  <Route
                    path="/supplier/registrations"
                    element={<SupplierRegistrationPage />}
                  />
                  <Route
                    path="/supplier/review/:id"
                    element={<SupplierReviewPage />}
                  />
                  <Route
                    path="/supplier/approval"
                    element={<SupplierApprovalListPage />}
                  />
                  <Route
                    path="/supplier/edit/:id"
                    element={<SupplierRegistrationPage />}
                  />

                {/* 입고 관리 */}
                <Route path="/deliveries" element={<DeliveryListPage />} />
                <Route path="/deliveries/new" element={<DeliveryCreatePage />} />

                {/* 송장 관리 */}
                <Route path="/invoices" element={<InvoicesListPage />} />
                <Route path="/invoices/create" element={<InvoiceCreatePage />} />

                {/* 지불 관리 */}
                <Route path="/payments" element={<PaymentListPage />} />
                <Route path="/payments/:invoiceId" element={<PaymentProcessPage />} />

                  {/* 통계 관리 */}
                  <Route path="/chart" element={<ChartDashboard />} />

                  {/* 공통 코드 관리 */}
                  <Route
                    path="/common-codes"
                    element={<CommonCodeManagement />}
                  />

                  {/* 사용자 관리 */}
                  <Route path="/members" element={<AdminMemberPage />} />
                </>
              )}
              {/* 404 페이지 */}
              <Route path="*" element={<ErrorPage type="notFound" />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;