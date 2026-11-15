import { Route, Routes } from 'react-router';
import { RequireAuth } from './components/auth/RequireAuth.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { HomePage } from './pages/home/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { MoviePage } from './pages/movie/MoviePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { RatingsPage } from './pages/RatingsPage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { WatchlistPage } from './pages/WatchlistPage.jsx';

/** Every page of the site and its address. */
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="movie/:id" element={<MoviePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="start" element={<OnboardingPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="ratings" element={<RatingsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
