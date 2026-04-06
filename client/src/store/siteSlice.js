import { createSlice } from '@reduxjs/toolkit'

const siteSlice = createSlice({
  name: 'site',
  initialState: {
    name: 'Binkeyit',
    logoUrl: '',
    announcement: '',
    announcementEnabled: false,
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
  }
})

export const { setSiteName, setLogoUrl, setAnnouncement, setAnnouncementEnabled } = siteSlice.actions
export default siteSlice.reducer
