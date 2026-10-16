import { Route, Routes, useLocation } from "react-router-dom";
import { MainPage } from "./pages/MainPage.jsx";
import { PlaylistPage } from "./pages/PlaylistPage.jsx";
import { LibraryPage } from "./pages/LibraryPage.jsx";
import { FavoritesPage } from "./pages/FavoritesPage.jsx";
import { CommunityPage } from "./pages/CommunityPage.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <div key={location.pathname} className="w-full">
        <Routes location={location}>
          <Route path="/" element={<MainPage />} />
          <Route path="/playlist" element={<PlaylistPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/community/:id" element={<CommunityPage />} />
          <Route path="*" element={<div className="text-neutral-500">Страница не найдена</div>} />
        </Routes>
      </div>
    </Layout>
  );
}