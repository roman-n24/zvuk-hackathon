import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { MainPage } from "./pages/MainPage.jsx";
import { PlaylistPage } from "./pages/PlaylistPage.jsx";
import { LibraryPage } from "./pages/LibraryPage.jsx";
import { FavoritesPage } from "./pages/FavoritesPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import Layout from "./components/Layout.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import { useAuth } from "@/lib/auth";

// Контекст для предоставления треков библиотеки по всему приложению
export const LibraryContext = createContext({
  tracks: [],
  genres: ["Все жанры"],
  isLoading: false,
  refreshTracks: () => {},
});

export const useLibrary = () => useContext(LibraryContext);

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Динамическое состояние треков и жанров из базы данных FastAPI
  const [tracks, setTracks] = useState([]);
  const [genres, setGenres] = useState(["Все жанры"]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  // Запрос к FastAPI эндпоинту /api/library для получения треков из БД
  const fetchLibraryTracks = useCallback(async () => {
    try {
      const res = await fetch("/api/library");
      if (!res.ok) return;
      const data = await res.json();
      if (data) {
        const trackList = Array.isArray(data) ? data : (data.tracks || []);
        setTracks(trackList);
        if (data.genres && Array.isArray(data.genres) && data.genres.length > 0) {
          setGenres(data.genres);
        } else {
          const dynamicGenres = ["Все жанры", ...new Set(trackList.map((t) => t.genre).filter(Boolean))];
          setGenres(dynamicGenres);
        }
      }
    } catch (e) {
      console.error("Ошибка загрузки треков из базы данных:", e);
    } finally {
      setIsLoadingTracks(false);
    }
  }, []);

  // Первоначальная загрузка и реактивное обновление при добавлении/удалении треков
  useEffect(() => {
    fetchLibraryTracks();

    // Слушатели событий обновления и фокуса вкладки
    window.addEventListener("library_updated", fetchLibraryTracks);
    window.addEventListener("focus", fetchLibraryTracks);

    // Периодическая синхронизация (polling) для обновления списка при изменениях в БД
    const intervalId = setInterval(fetchLibraryTracks, 10000);

    return () => {
      window.removeEventListener("library_updated", fetchLibraryTracks);
      window.removeEventListener("focus", fetchLibraryTracks);
      clearInterval(intervalId);
    };
  }, [fetchLibraryTracks]);

  useEffect(() => {
    const isAuthPage = ["/register", "/login", "/auth"].includes(location.pathname);

    if (!isAuthenticated && !isAuthPage) {
      navigate("/auth", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("invite") || params.get("join") || params.get("code");
    if (code) {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      fetch("/api/join", {
        method: "POST",
        headers,
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.id) {
            if (data.access_token) {
              localStorage.setItem("token", data.access_token);
            }
            window.dispatchEvent(new Event("communities_updated"));
            navigate(`/community/${data.id}`, { replace: true });
          }
        })
        .catch(() => {});
    }
  }, [location.search, navigate]);
  
  return (
    <LibraryContext.Provider
      value={{
        tracks,
        genres,
        isLoading: isLoadingTracks,
        refreshTracks: fetchLibraryTracks,
      }}
    >
      <Layout>
        <div key={location.pathname} className="w-full">
          <Routes location={location}>
            <Route path="/" element={<MainPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<RegisterPage />} />
            <Route path="/auth" element={<RegisterPage />} />
            <Route path="/playlist" element={<PlaylistPage />} />
            <Route
              path="/library"
              element={
                <LibraryPage
                  tracks={tracks}
                  genres={genres}
                  isLoading={isLoadingTracks}
                  refreshTracks={fetchLibraryTracks}
                />
              }
            />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/community/:id" element={<PlaylistPage />} />
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                  <h2 className="text-xl font-bold text-white mb-2">Страница не найдена</h2>
                  <p className="text-sm">Вернитесь на главную страницу ритма</p>
                </div>
              }
            />
          </Routes>
        </div>
      </Layout>
    </LibraryContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}