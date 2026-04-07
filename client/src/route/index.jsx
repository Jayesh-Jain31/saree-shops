import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import App from "../App";

// ── Critical path: loaded immediately ────────────────────────────────────────
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminPermision from "../layouts/AdminPermision";

// ── Lazy-loaded user pages ────────────────────────────────────────────────────
const SearchPage         = lazy(() => import("../pages/SearchPage"));
const ForgotPassword     = lazy(() => import("../pages/ForgotPassword"));
const OtpVerification    = lazy(() => import("../pages/OtpVerification"));
const ResetPassword      = lazy(() => import("../pages/ResetPassword"));
const UserMenuMobile     = lazy(() => import("../pages/UserMenuMobile"));
const Dashboard          = lazy(() => import("../layouts/Dashboard"));
const Profile            = lazy(() => import("../pages/Profile"));
const MyOrders           = lazy(() => import("../pages/MyOrders"));
const Address            = lazy(() => import("../pages/Address"));
const ProductListPage    = lazy(() => import("../pages/ProductListPage"));
const ProductDisplayPage = lazy(() => import("../pages/ProductDisplayPage"));
const CartMobile         = lazy(() => import("../pages/CartMobile"));
const CheckoutPage       = lazy(() => import("../pages/CheckoutPage"));
const Success            = lazy(() => import("../pages/Success"));
const Cancel             = lazy(() => import("../pages/Cancel"));
const OrderDetails       = lazy(() => import("../pages/OrderDetails"));
const Wishlist           = lazy(() => import("../pages/Wishlist"));
const MyReturns          = lazy(() => import("../pages/MyReturns"));
const Wallet             = lazy(() => import("../pages/Wallet"));
const PolicyPage         = lazy(() => import("../pages/PolicyPage"));
const AllCategoriesPage  = lazy(() => import("../pages/AllCategoriesPage"));

// ── Lazy-loaded admin pages ───────────────────────────────────────────────────
const CategoryPage       = lazy(() => import("../pages/CategoryPage"));
const SubCategoryPage    = lazy(() => import("../pages/SubCategoryPage"));
const UploadProduct      = lazy(() => import("../pages/UploadProduct"));
const ProductAdmin       = lazy(() => import("../pages/ProductAdmin"));
const CouponAdmin        = lazy(() => import("../pages/CouponAdmin"));
const AdminOrders        = lazy(() => import("../pages/AdminOrders"));
const AdminDashboard     = lazy(() => import("../pages/AdminDashboard"));
const DeliveryZoneAdmin  = lazy(() => import("../pages/DeliveryZoneAdmin"));
const BannerAdmin        = lazy(() => import("../pages/BannerAdmin"));
const AdminReturns       = lazy(() => import("../pages/AdminReturns"));
const SiteSettings       = lazy(() => import("../pages/SiteSettings"));
const AdminFraud         = lazy(() => import("../pages/AdminFraud"));

// ── Spinner shown while a lazy page loads ────────────────────────────────────
const PageLoader = () => (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
);
const Lazy = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

const router = createBrowserRouter([
    {
        path : "/",
        element : <App/>,
        children : [
            { path : "",                element : <Home/> },
            { path : "search",          element : <Lazy><SearchPage/></Lazy> },
            { path : "login",           element : <Login/> },
            { path : "register",        element : <Register/> },
            { path : "forgot-password", element : <Lazy><ForgotPassword/></Lazy> },
            { path : "verification-otp",element : <Lazy><OtpVerification/></Lazy> },
            { path : "reset-password",  element : <Lazy><ResetPassword/></Lazy> },
            { path : "user",            element : <Lazy><UserMenuMobile/></Lazy> },
            {
                path : "dashboard",
                element : <Lazy><Dashboard/></Lazy>,
                children : [
                    { path : "profile",         element : <Lazy><Profile/></Lazy> },
                    { path : "myorders",        element : <Lazy><MyOrders/></Lazy> },
                    { path : "address",         element : <Lazy><Address/></Lazy> },
                    { path : "category",        element : <AdminPermision><Lazy><CategoryPage/></Lazy></AdminPermision> },
                    { path : "subcategory",     element : <AdminPermision><Lazy><SubCategoryPage/></Lazy></AdminPermision> },
                    { path : "upload-product",  element : <AdminPermision><Lazy><UploadProduct/></Lazy></AdminPermision> },
                    { path : "product",         element : <AdminPermision><Lazy><ProductAdmin/></Lazy></AdminPermision> },
                    { path : "coupons",         element : <AdminPermision><Lazy><CouponAdmin/></Lazy></AdminPermision> },
                    { path : "order/:id",       element : <Lazy><OrderDetails/></Lazy> },
                    { path : "wishlist",        element : <Lazy><Wishlist/></Lazy> },
                    { path : "admin-orders",    element : <AdminPermision><Lazy><AdminOrders/></Lazy></AdminPermision> },
                    { path : "admin-dashboard", element : <AdminPermision><Lazy><AdminDashboard/></Lazy></AdminPermision> },
                    { path : "delivery-zones",  element : <AdminPermision><Lazy><DeliveryZoneAdmin/></Lazy></AdminPermision> },
                    { path : "banners",         element : <AdminPermision><Lazy><BannerAdmin/></Lazy></AdminPermision> },
                    { path : "my-returns",      element : <Lazy><MyReturns/></Lazy> },
                    { path : "admin-returns",   element : <AdminPermision><Lazy><AdminReturns/></Lazy></AdminPermision> },
                    { path : "wallet",          element : <Lazy><Wallet/></Lazy> },
                    { path : "site-settings",    element : <AdminPermision><Lazy><SiteSettings/></Lazy></AdminPermision> },
                    { path : "fraud-detection", element : <AdminPermision><Lazy><AdminFraud/></Lazy></AdminPermision> },
                ]
            },
            {
                path : ":category",
                children : [
                    { path : ":subCategory", element : <Lazy><ProductListPage/></Lazy> }
                ]
            },
            { path : "product/:product", element : <Lazy><ProductDisplayPage/></Lazy> },
            { path : "cart",             element : <Lazy><CartMobile/></Lazy> },
            { path : "checkout",         element : <Lazy><CheckoutPage/></Lazy> },
            { path : "success",          element : <Lazy><Success/></Lazy> },
            { path : "cancel",           element : <Lazy><Cancel/></Lazy> },
            { path : "page/:slug",       element : <Lazy><PolicyPage/></Lazy> },
            { path : "categories",       element : <Lazy><AllCategoriesPage/></Lazy> },
        ]
    }
]);

export default router;
