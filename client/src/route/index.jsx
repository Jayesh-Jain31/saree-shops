import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import SearchPage from "../pages/SearchPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import OtpVerification from "../pages/OtpVerification";
import ResetPassword from "../pages/ResetPassword";
import UserMenuMobile from "../pages/UserMenuMobile";
import Dashboard from "../layouts/Dashboard";
import Profile from "../pages/Profile";
import MyOrders from "../pages/MyOrders";
import Address from "../pages/Address";
import CategoryPage from "../pages/CategoryPage";
import SubCategoryPage from "../pages/SubCategoryPage";
import UploadProduct from "../pages/UploadProduct";
import ProductAdmin from "../pages/ProductAdmin";
import AdminPermision from "../layouts/AdminPermision";
import ProductListPage from "../pages/ProductListPage";
import ProductDisplayPage from "../pages/ProductDisplayPage";
import CartMobile from "../pages/CartMobile";
import CheckoutPage from "../pages/CheckoutPage";
import Success from "../pages/Success";
import Cancel from "../pages/Cancel";
import CouponAdmin from "../pages/CouponAdmin";
import OrderDetails from "../pages/OrderDetails";
import Wishlist from "../pages/Wishlist";
import AdminDashboard from "../pages/AdminDashboard";
import AdminOrders from "../pages/AdminOrders";
import DeliveryZoneAdmin from "../pages/DeliveryZoneAdmin"
import BannerAdmin from "../pages/BannerAdmin";
import MyReturns from "../pages/MyReturns";
import AdminReturns from "../pages/AdminReturns";
import Wallet from "../pages/Wallet"
import SiteSettings from "../pages/SiteSettings";

const router = createBrowserRouter([
    {
        path : "/",
        element : <App/>,
        children : [
            {
                path : "",
                element : <Home/>
            },
            {
                path : "search",
                element : <SearchPage/>
            },
            {
                path : 'login',
                element : <Login/>
            },
            {
                path : "register",
                element : <Register/>
            },
            {
                path : "forgot-password",
                element : <ForgotPassword/>
            },
            {
                path : "verification-otp",
                element : <OtpVerification/>
            },
            {
                path : "reset-password",
                element : <ResetPassword/>
            },
            {
                path : "user",
                element : <UserMenuMobile/>
            },
            {
                path : "dashboard",
                element : <Dashboard/>,
                children : [
                    {
                        path : "profile",
                        element : <Profile/>
                    },
                    {
                        path : "myorders",
                        element : <MyOrders/>
                    },
                    {
                        path : "address",
                        element : <Address/>
                    },
                    {
                        path : 'category',
                        element : <AdminPermision><CategoryPage/></AdminPermision>
                    },
                    {
                        path : "subcategory",
                        element : <AdminPermision><SubCategoryPage/></AdminPermision>
                    },
                    {
                        path : 'upload-product',
                        element : <AdminPermision><UploadProduct/></AdminPermision>
                    },
                    {
                        path : 'product',
                        element : <AdminPermision><ProductAdmin/></AdminPermision>
                    },
                    {
                        path : 'coupons',
                        element : <AdminPermision><CouponAdmin/></AdminPermision>
                    },
                    {
                        path : 'order/:id',
                        element : <OrderDetails/>
                    },
                    {
                        path : 'wishlist',
                        element : <Wishlist/>
                    },
                    {
                        path : 'admin-orders',
                        element : <AdminPermision><AdminOrders/></AdminPermision>
                    },
                    {
                        path : 'admin-dashboard',
                        element : <AdminPermision><AdminDashboard/></AdminPermision>
                    },
                    {
                        path : 'delivery-zones',
                        element : <AdminPermision><DeliveryZoneAdmin/></AdminPermision>
                    },
                    {
                        path : 'banners',
                        element : <AdminPermision><BannerAdmin/></AdminPermision>
                    },
                    {
                        path : 'my-returns',
                        element : <MyReturns/>
                    },
                    {
                        path : 'admin-returns',
                        element : <AdminPermision><AdminReturns/></AdminPermision>
                    },
                    {
                        path : 'wallet',
                        element : <Wallet/>
                    },
                    {
                        path : 'site-settings',
                        element : <AdminPermision><SiteSettings/></AdminPermision>
                    }
                ]
            },
            {
                path : ":category",
                children : [
                    {
                        path : ":subCategory",
                        element : <ProductListPage/>
                    }
                ]
            },
            {
                path : "product/:product",
                element : <ProductDisplayPage/>
            },
            {
                path : 'cart',
                element : <CartMobile/>
            },
            {
                path : "checkout",
                element : <CheckoutPage/>
            },
            {
                path : "success",
                element : <Success/>
            },
            {
                path : 'cancel',
                element : <Cancel/>
            }
        ]
    }
])

export default router
