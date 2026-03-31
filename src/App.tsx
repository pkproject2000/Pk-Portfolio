/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { About } from './pages/About';
import { PublicPortfolio } from './pages/PublicPortfolio';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="studentfolio-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="about" element={<About />} />
            <Route path="login" element={<Login />} />
            <Route path="u/:username" element={<PublicPortfolio />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
