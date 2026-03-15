import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RecentMatchesPage } from "@/pages/RecentMatchesPage";
import { MatchesPage } from "@/pages/MatchesPage";
import { TodayStandingsPage } from "@/pages/TodayStandingsPage";
import { PastStandingsPage } from "@/pages/PastStandingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<RecentMatchesPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="leaderboard/today" element={<TodayStandingsPage />} />
        <Route path="leaderboard/historical" element={<PastStandingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
