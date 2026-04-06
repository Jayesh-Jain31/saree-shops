import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { setUserDetails } from './store/userSlice';
import { setAllCategory, setAllSubCategory, setLoadingCategory } from './store/productSlice';
import { useDispatch, useSelector } from 'react-redux';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';
import { handleAddItemCart } from './store/cartProduct'
import GlobalProvider from './provider/GlobalProvider';
import { FaWhatsapp, FaTools } from "react-icons/fa";
import CartMobileLink from './components/CartMobile';
import { applyTheme } from './utils/themeColors';
import { setSiteName, setLogoUrl } from './store/siteSlice';

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector(state => state.user)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('We are currently under maintenance. Please check back soon.')
  const [settingsLoaded, setSettingsLoaded] = useState(false)

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

        if (s.theme_color) {
          applyTheme(s.theme_color)
        }

        if (s.store_name) {
          dispatch(setSiteName(s.store_name))
          document.title = s.store_name
        }

        if (s.store_logo) {
          dispatch(setLogoUrl(s.store_logo))
        }

        setMaintenanceMode(s.maintenance_mode === 'true')
        setMaintenanceMessage(s.maintenance_message || 'We are currently under maintenance. Please check back soon.')
      }
    } catch (error) {
    } finally {
      setSettingsLoaded(true)
    }
  }

  useEffect(() => {
    fetchUser()
    fetchCategory()
    fetchSubCategory()
    fetchSettings()
  }, [])

  const showWhatsApp = whatsappEnabled && whatsappNumber
  const isAdmin = user?.role === 'ADMIN'
  const showMaintenance = settingsLoaded && maintenanceMode && !isAdmin

  return (
    <GlobalProvider>
      <Header />
      <main className='min-h-[78vh]'>
        <Outlet />
      </main>
      <Footer />
      <Toaster />

      {/* Maintenance mode overlay */}
      {showMaintenance && (
        <div className='fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-8 text-center'>
          <div className='w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6'>
            <FaTools className='text-orange-500' size={36} />
          </div>
          <h1 className='text-2xl font-bold text-gray-800 mb-3'>Under Maintenance</h1>
          <p className='text-gray-500 max-w-sm text-sm leading-relaxed'>{maintenanceMessage}</p>
          <p className='text-xs text-gray-400 mt-6'>We will be back shortly. Thank you for your patience.</p>
        </div>
      )}

      {/* WhatsApp floating button */}
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
