import React, { createContext, useContext, useEffect, useState } from 'react'
import { dashboard311 as bundled311 } from '../data/dashboard311'
import { dashboardV2 as bundledV2 }  from '../data/dashboard311v2'
import { fetchDashboardV1, fetchDashboardV2 } from '../api/serverApi'

type D311 = typeof bundled311
type DV2  = typeof bundledV2

type DashboardData = {
  dashboard311: D311
  dashboardV2:  DV2
  isLive:       boolean  // true when data came from the server (not bundled fallback)
}

const DashboardContext = createContext<DashboardData>({
  dashboard311: bundled311,
  dashboardV2:  bundledV2,
  isLive:       false,
})

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData>({
    dashboard311: bundled311,
    dashboardV2:  bundledV2,
    isLive:       false,
  })

  useEffect(() => {
    Promise.all([fetchDashboardV1(), fetchDashboardV2()])
      .then(([v1, v2]) => {
        if (v1 && v2) {
          setData({ dashboard311: v1 as D311, dashboardV2: v2 as DV2, isLive: true })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <DashboardContext.Provider value={data}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardData(): DashboardData {
  return useContext(DashboardContext)
}
