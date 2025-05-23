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
import ContractCreatePage from "./pages/contract/ContractCreatePage";
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
import ApprovalLineAdministration from "@/pages/approval/ApprovalLineAdministration";
import SupplierListPage from "@/pages/supplier/SupplierListPage";
import SupplierRegistrationPage from "@/pages/supplier/SupplierRegistrationPage";
import SupplierReviewPage from "@/pages/supplier/SupplierReviewPage";
import SupplierApprovalListPage from "@/pages/supplier/SupplierApprovalListPage";
import CommonCodeManagement from "@/pages/commonCode/CommonCodeManagement";
import CategoryListPage from "@pages/item/CategoryListPage";
import CategoryFormPage from "@pages/item/CategoryFormPage";
import ItemListPage from "@pages/item/ItemListPage";
import ItemFormPage from "@pages/item/ItemFormPage";
import DeliveryListPage from "@/pages/delivery/DeliveryListPage";
import DeliveryCreatePage from "@/pages/delivery/DeliveryCreatePage";
import DeliveryDetailPage from "@/pages/delivery/DeliveryDetailPage";
import DeliveryEditPage from "@/pages/delivery/DeliveryEditPage";
import InvoicesListPage from "@/pages/invoice/InvoicesListPage"
import InvoiceDetailPage from "@/pages/invoice/InvoiceDetailPage"
import InvoiceEditPage from "@/pages/invoice/InvoiceEditPage"
import InvoiceCreatePage from "@/pages/invoice/InvoiceCreatePage"
import PaymentListPage from '@/pages/payment/PaymentListPage';
import PaymentDetailPage from '@/pages/payment/PaymentDetailPage';
import PaymentCreatePage from '@/pages/payment/PaymentCreatePage';
import ChartDashboard from '@/pages/statistics/ChartDashboard';
import AdminMemberPage from "@/pages/member/AdminMemberPage";

function AppContent() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const auth = useSelector((state) => state.auth);
  const isSupplier = auth?.roles?.some(
    (role) => role === "SUPPLIER" || role === "ROLE_SUPPLIER"
  );

  const DashboardPage = () => <MemberDashboard />;
  const SupplierDashboard = () => <div>공급자 대시보드 페이지</div>;
  const SupplierContractsPage = () => <div>공급사 계약 페이지 (개발 중)</div>;
  const SupplierOrdersPage = () => <div>공급사 주문 페이지 (개발 중)</div>;

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

              {!isSupplier && (
                <>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/purchase-requests/dashboard" element={<PurchaseRequestDashboard />} />
                  <Route path="/biddings" element={<BiddingListPage />} />
                  <Route path="/biddings/new" element={<BiddingFormPage mode="create" />} />
                  <Route path="/biddings/:id/edit" element={<BiddingFormPage mode="edit" />} />
                  <Route path="/biddings/:id" element={<BiddingDetailPage />} />
                  <Route path="/biddings/evaluations" element={<BiddingEvaluationListPage />} />
                  <Route path="/biddings/evaluations/:id" element={<BiddingEvaluationDetailPage />} />
                  <Route path="/contracts" element={<ContractsListPage />} />
                  <Route path="/contracts/new" element={<ContractCreatePage />} />
                  <Route path="/orders" element={<BiddingOrderListPage />} />
                  <Route path="/orders/:id" element={<BiddingOrderDetailPage />} />
                  <Route path="/projects" element={<ProjectListPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/projects/new" element={<ProjectCreatePage />} />
                  <Route path="/projects/edit/:id" element={<ProjectEditPage />} />
                  <Route path="/purchase-requests" element={<PurchaseRequestListPage />} />
                  <Route path="/purchase-requests/:id" element={<PurchaseRequestDetailPage />} />
                  <Route path="/purchase-requests/new" element={<PurchaseRequestCreatePage />} />
                  <Route path="/purchase-requests/edit/:id" element={<PurchaseRequestEditPage />} />
                  <Route path="/approvals" element={<ApprovalListPage />} />
                  <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
                  <Route path="/approval-management" element={<ApprovalManagementPage />} />
                  <Route path="/approval-lines" element={<ApprovalLineAdministration />} />
                  <Route path="/deliveries" element={<DeliveryListPage />} />
                  <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
                  <Route path="/deliveries/edit/:id" element={<DeliveryEditPage />} />
                  <Route path="/deliveries/new" element={<DeliveryCreatePage />} />
                  <Route path="/invoices" element={<InvoicesListPage />} />
                  <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                  <Route path="/invoices/edit/:id" element={<InvoiceEditPage />} />
                  <Route path="/invoices/create" element={<InvoiceCreatePage />} />
                  <Route path="/payments" element={<PaymentListPage />} />
                  <Route path="/payments/:id" element={<PaymentDetailPage />} />
                  <Route path="/payments/create" element={<PaymentCreatePage />} />
                  <Route path="/supplier" element={<SupplierListPage />} />
                  <Route path="/supplier/registrations" element={<SupplierRegistrationPage />} />
                  <Route path="/supplier/review/:id" element={<SupplierReviewPage />} />
                  <Route path="/supplier/approval" element={<SupplierApprovalListPage />} />
                  <Route path="/supplier/edit/:id" element={<SupplierRegistrationPage />} />
                  <Route path="/categories" element={<CategoryListPage />} />
                  <Route path="/categories/new" element={<CategoryFormPage mode="create" />} />
                  <Route path="/categories/edit/:id" element={<CategoryFormPage mode="edit" />} />
                  <Route path="/items" element={<ItemListPage />} />
                  <Route path="/items/new" element={<ItemFormPage mode="create" />} />
                  <Route path="/items/edit/:id" element={<ItemFormPage mode="edit" />} />
                  <Route path="/chart" element={<ChartDashboard />} />
                  <Route path="/common-codes" element={<CommonCodeManagement />} />
                  <Route path="/members" element={<AdminMemberPage />} />
                </>
              )}
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