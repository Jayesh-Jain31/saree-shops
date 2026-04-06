import { createSlice } from '@reduxjs/toolkit'

const siteSlice = createSlice({
  name: 'site',
  initialState: {
    name: 'Binkeyit',
    logoUrl: '',
  },
  reducers: {
    setSiteName: (state, action) => {
      state.name = action.payload
    },
    setLogoUrl: (state, action) => {
      state.logoUrl = action.payload
    },
  }
})

export const { setSiteName, setLogoUrl } = siteSlice.actions
export default siteSlice.reducer
