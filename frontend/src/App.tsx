import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RecentMatchesPage } from './pages/RecentMatchesPage'
import { ByDatePage } from './pages/ByDatePage'
import { FindPlayerPage } from './pages/FindPlayerPage'
import { TodayStandingsPage } from './pages/TodayStandingsPage'
import { PastStandingsPage } from './pages/PastStandingsPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<RecentMatchesPage />} />
        <Route path="by-date" element={<ByDatePage />} />
        <Route path="by-player" element={<FindPlayerPage />} />
        <Route path="leaderboard/today" element={<TodayStandingsPage />} />
        <Route path="leaderboard/historical" element={<PastStandingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
