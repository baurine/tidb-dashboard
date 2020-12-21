import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

import { Root } from '@lib/components'
import { SingleCacheContext, useSingleCache } from '@lib/utils/useCache'

import { Detail, List } from './pages'

export default function () {
  const statementCacheMgr = useSingleCache()

  return (
    <Root>
      <SingleCacheContext.Provider value={statementCacheMgr}>
        <Router>
          <Routes>
            <Route path="/statement" element={<List />} />
            <Route path="/statement/detail" element={<Detail />} />
          </Routes>
        </Router>
      </SingleCacheContext.Provider>
    </Root>
  )
}

export * from './components'
export * from './pages'
export * from './utils/useStatementTableController'
export { default as useStatementTableController } from './utils/useStatementTableController'
