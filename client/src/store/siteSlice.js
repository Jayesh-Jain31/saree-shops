import { createSlice } from '@reduxjs/toolkit'

const siteSlice = createSlice({
  name: 'site',
  initialState: {
    name: '',
    logoUrl: '',
    announcement: '',
    announcementEnabled: false,
    settings: {},
  },
  reducers: {
    setSiteName: (state, action) => {
      state.name = action.payload
    },
    setLogoUrl: (state, action) => {
      state.logoUrl = action.payload
    },
    setAnnouncement: (state, action) => {
      state.announcement = action.payload
    },
    setAnnouncementEnabled: (state, action) => {
      state.announcementEnabled = action.payload
    },
    setSiteSettings: (state, action) => {
      state.settings = action.payload
    },
  }
})

export const { setSiteName, setLogoUrl, setAnnouncement, setAnnouncementEnabled, setSiteSettings } = siteSlice.actions
export default siteSlice.reducer
