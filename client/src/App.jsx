import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { setUserDetails } from './store/userSlice';
import { setAllCategory, setAllSubCategory, setLoadingCategory } from './store/productSlice';
import { useDispatch } from 'react-redux';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import { handleAddItemCart } from './store/cartProduct'
import GlobalProvider from './provider/GlobalProvider';
import { FaWhatsapp } from "react-icons/fa";
import CartMobileLink from './components/CartMobile';
import { applyTheme } from './utils/themeColors';

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)

  const fetchUser = async () => {
    const userData = await fetchUserDetails()
    dispatch(setUserDetails(userData.data))
  }

  const fetchCategory = async () => {
    try {
      dispatch(setLoadingCategory(true))
      const response = await Axios({ ...SummaryApi.getCategory })
      const { data: responseData } = response
      if (responseData.success) {
        dispatch(setAllCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name))))
      }
    } catch (error) {
    } finally {
      dispatch(setLoadingCategory(false))
    }
  }

  const fetchSubCategory = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getSubCategory })
      const { data: responseData } = response
      if (responseData.success) {
        dispatch(setAllSubCategory(responseData.data.sort((a, b) => a.name.localeCompare(b.name))))
      }
    } catch (error) {}
  }

  const fetchSettings = async () => {
    try {
      const response = await Axios({ ...SummaryApi.getSettings })
      if (response.data.success) {
        const s = response.data.data
        setWhatsappNumber(s.whatsapp_number || '')
        setWhatsappEnabled(s.whatsapp_enabled !== 'false' && !!s.whatsapp_number)

        // Apply saved theme color
        if (s.theme_color) {
          applyTheme(s.theme_color)
        }
      }
    } catch (error) {}
  }

  useEffect(() => {
    fetchUser()
    fetchCategory()
    fetchSubCategory()
    fetchSettings()
  }, [])

  const showWhatsApp = whatsappEnabled && whatsappNumber

  return (
    <GlobalProvider>
      <Header />
      <main className='min-h-[78vh]'>
        <Outlet />
      </main>
      <Footer />
      <Toaster />

      {/* WhatsApp floating button — bottom RIGHT */}
      {showWhatsApp && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target='_blank'
          rel='noopener noreferrer'
          className='fixed bottom-20 right-4 z-50 flex items-center justify-center w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110'
          style={{ backgroundColor: '#25D366' }}
          aria-label='Chat on WhatsApp'
        >
          <FaWhatsapp size={30} />
        </a>
      )}

      {location.pathname !== '/checkout' && <CartMobileLink />}
    </GlobalProvider>
  )
}

export default App
