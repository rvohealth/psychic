import { configureStore } from '@reduxjs/toolkit'
import psyStore from 'psy/store'

const store = configureStore({
  reducer: {
    psy: psyStore,
  },
})

export default store
