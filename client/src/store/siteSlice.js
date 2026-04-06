import { createSlice } from '@reduxjs/toolkit'

const siteSlice = createSlice({
  name: 'site',
  initialState: { name: 'Binkeyit' },
  reducers: {
    setSiteName: (state, action) => {
      state.name = action.payload
    }
  }
})

export const { setSiteName } = siteSlice.actions
export default siteSlice.reducer
