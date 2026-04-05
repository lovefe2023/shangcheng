/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Category from './pages/Category';
import Cart from './pages/Cart';
import Partner from './pages/Partner';
import Profile from './pages/Profile';
import Team from './pages/Team';
import Orders from './pages/Orders';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import OrderDetails from './pages/OrderDetails';
import Settings from './pages/Settings';
import AccountSettings from './pages/AccountSettings';
import PersonalInfo from './pages/PersonalInfo';
import MemberDetails from './pages/MemberDetails';
import Sales from './pages/Sales';
import PartnerRecruit from './pages/PartnerRecruit';
import PartnerRecruitDetails from './pages/PartnerRecruitDetails';
import PartnerInvite from './pages/PartnerInvite';
import PartnerIncome from './pages/PartnerIncome';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Addresses from './pages/Addresses';
import Login from './pages/Login';
import Register from './pages/Register';
import SalesDetails from './pages/SalesDetails';
import Withdraw from './pages/Withdraw';
import TeamSales from './pages/TeamSales';
import Coupons from './pages/Coupons';
import MyCoupons from './pages/MyCoupons';
import GroupBuy from './pages/GroupBuy';
import ShareGroupBuy from './pages/ShareGroupBuy';
import PartnerPackage from './pages/PartnerPackage';
import CategoryList from './pages/CategoryList';
import FaqCommission from './pages/FaqCommission';
import FaqUpgrade from './pages/FaqUpgrade';
import FaqInvite from './pages/FaqInvite';
import NewPartnersToday from './pages/NewPartnersToday';
import Leaderboard from './pages/Leaderboard';
import MyCellar from './pages/MyCellar';
import Privileges from './pages/Privileges';
import FlashSale from './pages/FlashSale';
import Notifications from './pages/Notifications';
import NotificationDetails from './pages/NotificationDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import AdminEditProduct from './pages/admin/AdminEditProduct';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetails from './pages/admin/AdminOrderDetails';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAddUser from './pages/admin/AdminAddUser';
import AdminUserDetails from './pages/admin/AdminUserDetails';
import AdminEditUser from './pages/admin/AdminEditUser';
import AdminPartners from './pages/admin/AdminPartners';
import AdminAddPartner from './pages/admin/AdminAddPartner';
import AdminPartnerDetails from './pages/admin/AdminPartnerDetails';
import AdminEditPartner from './pages/admin/AdminEditPartner';
import AdminPartnerAudit from './pages/admin/AdminPartnerAudit';
import AdminTeamMemberDetails from './pages/admin/AdminTeamMemberDetails';
import AdminFinance from './pages/admin/AdminFinance';
import AdminMarketing from './pages/admin/AdminMarketing';
import AdminCreateCampaign from './pages/admin/AdminCreateCampaign';
import AdminCreateFlashSale from './pages/admin/AdminCreateFlashSale';
import AdminCreateGroupBuy from './pages/admin/AdminCreateGroupBuy';
import AdminGroupBuyDetails from './pages/admin/AdminGroupBuyDetails';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminCreateCoupon from './pages/admin/AdminCreateCoupon';
import AdminCouponRecords from './pages/admin/AdminCouponRecords';
import AdminDistribution from './pages/admin/AdminDistribution';
import AdminWithdrawal from './pages/admin/AdminWithdrawal';
import AdminContent from './pages/admin/AdminContent';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCellar from './pages/admin/AdminCellar';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';
import AdminEditFlashSale from './pages/admin/AdminEditFlashSale';
import AdminEditGroupBuy from './pages/admin/AdminEditGroupBuy';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/add" element={<AdminAddProduct />} />
          <Route path="products/edit/:id" element={<AdminEditProduct />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetails />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/add" element={<AdminAddUser />} />
          <Route path="users/:id" element={<AdminUserDetails />} />
          <Route path="users/edit/:id" element={<AdminEditUser />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="partners/add" element={<AdminAddPartner />} />
          <Route path="partners/audit" element={<AdminPartnerAudit />} />
          <Route path="partners/team-member/:id" element={<AdminTeamMemberDetails />} />
          <Route path="partners/:id" element={<AdminPartnerDetails />} />
          <Route path="partners/edit/:id" element={<AdminEditPartner />} />
          <Route path="finance" element={<AdminFinance />} />
          <Route path="marketing" element={<AdminMarketing />} />
          <Route path="marketing/create" element={<AdminCreateCampaign />} />
          <Route path="marketing/flash-sale/create" element={<AdminCreateFlashSale />} />
          <Route path="marketing/flash-sale/edit/:id" element={<AdminEditFlashSale />} />
          <Route path="marketing/group-buy/create" element={<AdminCreateGroupBuy />} />
          <Route path="marketing/group-buy/edit/:id" element={<AdminEditGroupBuy />} />
          <Route path="marketing/group-buy/details/:id" element={<AdminGroupBuyDetails />} />
          <Route path="marketing/coupons" element={<AdminCoupons />} />
          <Route path="marketing/coupons/create" element={<AdminCreateCoupon />} />
          <Route path="marketing/coupons/records/:id" element={<AdminCouponRecords />} />
          <Route path="distribution" element={<AdminDistribution />} />
          <Route path="withdrawal" element={<AdminWithdrawal />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="cellar" element={<AdminCellar />} />
          <Route path="leaderboard" element={<AdminLeaderboard />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Client Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="category" element={<Category />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="payment" element={<Payment />} />
          <Route path="partner" element={<Partner />} />
          <Route path="partner/recruit" element={<PartnerRecruit />} />
          <Route path="partner/recruit/details" element={<PartnerRecruitDetails />} />
          <Route path="partner/invite" element={<PartnerInvite />} />
          <Route path="partner/income" element={<PartnerIncome />} />
          <Route path="partner/new-today" element={<NewPartnersToday />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="my-cellar" element={<MyCellar />} />
          <Route path="profile" element={<Profile />} />
          <Route path="privileges" element={<Privileges />} />
          <Route path="flash-sale" element={<FlashSale />} />
          <Route path="team" element={<Team />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="order/:id" element={<OrderDetails />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/account" element={<AccountSettings />} />
          <Route path="personal-info" element={<PersonalInfo />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="member/:id" element={<MemberDetails />} />
          <Route path="sales" element={<Sales />} />
          <Route path="sales/details" element={<SalesDetails />} />
          <Route path="withdraw" element={<Withdraw />} />
          <Route path="team-sales" element={<TeamSales />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="my-coupons" element={<MyCoupons />} />
          <Route path="group-buy" element={<GroupBuy />} />
          <Route path="share-group-buy" element={<ShareGroupBuy />} />
          <Route path="partner-package" element={<PartnerPackage />} />
          <Route path="category-list/:type" element={<CategoryList />} />
          <Route path="faq/commission" element={<FaqCommission />} />
          <Route path="faq/upgrade" element={<FaqUpgrade />} />
          <Route path="faq/invite" element={<FaqInvite />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="notification/:id" element={<NotificationDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}
