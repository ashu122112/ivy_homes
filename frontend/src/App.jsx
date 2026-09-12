import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import { DataProvider } from './context/DataContext';
import { FavouritesProvider } from './context/FavouritesContext';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import FavouritesPage from './pages/FavouritesPage';
import RentalsPage from './pages/RentalsPage';
import ProjectsPage from './pages/ProjectsPage';
import InsightsPage from './pages/InsightsPage';
import './index.css';

const TOKEN_KEY = 'ivy_homes_token';
const EMAIL_KEY = 'ivy_homes_email';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '');

  function handleLogin(newToken, email) {
    setToken(newToken);
    setUserEmail(email);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(EMAIL_KEY, email);
  }

  function handleLogout() {
    setToken('');
    setUserEmail('');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <DataProvider token={token}>
        <FavouritesProvider userEmail={userEmail}>
          <Routes>
            <Route
              element={<Layout userEmail={userEmail} onLogout={handleLogout} />}
            >
              <Route index element={<ListingsPage />} />
              <Route path="listing/:id" element={<ListingDetailPage token={token} />} />
              <Route path="saved" element={<FavouritesPage />} />
              <Route path="rentals" element={<RentalsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </FavouritesProvider>
      </DataProvider>
    </BrowserRouter>
  );
}
