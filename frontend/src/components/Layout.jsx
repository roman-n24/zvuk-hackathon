import { useLocation, Link } from "react-router-dom";
import {
  Headphones,
  Home,
  ListMusic,
  Flame,
  Library,
  Heart,
  Menu,
} from "lucide-react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchBar } from "@/components/SearchBar";
import { CommunitySwitcher } from "@/components/CommunitySwitcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Главная", url: "/", icon: Home },
  { title: "Плейлист", url: "/playlist", icon: ListMusic },
  { title: "Вечеринка", url: "/party", icon: Flame, badge: "LIVE" },
  { title: "Медиатека", url: "/library", icon: Library },
  { title: "Избранное", url: "/favorites", icon: Heart },
];

function LayoutInner({ children }) {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();

  const isPartyPage =
    location.pathname === "/party" ||
    location.pathname.startsWith("/party") ||
    location.pathname.endsWith("/party");
  const isPlaylistPage =
    !isPartyPage &&
    (location.pathname === "/playlist" ||
      location.pathname.startsWith("/playlist/") ||
      location.pathname.startsWith("/community"));
  const isLibraryPage = location.pathname === "/library";
  const isHomePage = location.pathname === "/";

  return (
    <>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen bg-[#121212] text-white">
        {/* ─── МОБИЛЬНЫЙ ВЕРХНИЙ ХЕДЕР (< md) ─── */}
        <div className="md:hidden sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-[#262626]/80 px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1b1b1b] border border-[#282828] text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Открыть меню сообществ"
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2 select-none">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FDE047] shadow-xs">
                <svg
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <rect x="7.5" y="13" width="3" height="10" rx="1.5" fill="#171717" />
                  <rect x="12.5" y="9" width="3" height="18" rx="1.5" fill="#171717" />
                  <rect x="17.5" y="6" width="3" height="24" rx="1.5" fill="#171717" />
                  <rect x="22.5" y="9" width="3" height="18" rx="1.5" fill="#171717" />
                  <rect x="27.5" y="13" width="3" height="10" rx="1.5" fill="#171717" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-white flex items-baseline">
                ритм<span className="text-[#FDE047] text-xl font-black">.</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isPlaylistPage && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#242016] border border-[#4a3f24] text-[#FDE047]">
                Плейлист
              </span>
            )}
            {isPartyPage && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                PARTY
              </span>
            )}
          </div>
        </div>

        {/* ─── МОБИЛЬНЫЙ ПОДХЕДЕР (для переключателя сообществ или поиска на главной) ─── */}
        <div className="md:hidden px-3.5 pt-2">
          {isPlaylistPage ? (
            <div className="pb-2">
              <CommunitySwitcher />
            </div>
          ) : isHomePage ? (
            <div className="pb-2">
              <SearchBar placeholder="Поиск музыки (нечеткий поиск с опечатками)..." />
            </div>
          ) : null}
        </div>

        {/* ─── ДЕСКТОПНАЯ ВЕРХНЯЯ ШАПКА (>= md) ─── */}
        <header
          className={cn(
            "hidden md:block w-full px-6 lg:px-8 z-30",
            isLibraryPage
              ? "pt-6 pb-6 bg-[#121212]"
              : "sticky top-0 pt-5 pb-3 bg-[#121212]/95 backdrop-blur-sm"
          )}
        >
          {isPlaylistPage ? (
            <CommunitySwitcher />
          ) : isLibraryPage ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#242016] border border-[#4a3f24] text-[#FDE047] text-xs font-semibold uppercase tracking-wider mb-2">
                <Headphones className="h-3.5 w-3.5" />
                <span>Студийная фонотека Volna Studio</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Медиатека
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                Фирменные звуковые дорожки без авторских ограничений. Слушайте, тестируйте в реальном времени и добавляйте в плейлисты ваших сообществ.
              </p>
            </div>
          ) : isHomePage ? (
            <div className="w-full">
              <SearchBar placeholder="Поиск музыки по названию, автору или жанру..." />
            </div>
          ) : null}
        </header>

        {/* ─── ОСНОВНОЕ СОДЕРЖИМОЕ СТРАНИЦЫ ─── */}
        <main className="flex-1 w-full px-3.5 sm:px-6 md:px-8 pt-2 sm:pt-4 pb-36 md:pb-28 min-w-0 transition-all duration-300">
          {children}
        </main>

        {/* ─── МОБИЛЬНЫЙ НИЖНИЙ НАВБАР (< md) ─── */}
        <nav
          aria-label="Мобильная навигация"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-t border-[#262626] flex items-center justify-around h-[58px] px-1 pb-[env(safe-area-inset-bottom)]"
        >
          {NAV_ITEMS.map((item) => {
            const isItemActive =
              item.url === "/"
                ? location.pathname === "/"
                : item.url === "/playlist"
                ? isPlaylistPage
                : item.url === "/party"
                ? isPartyPage
                : location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);

            return (
              <Link
                key={item.title}
                to={item.url}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors select-none",
                  isItemActive
                    ? "text-[#FDE047]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-[62px]">
                  {item.title}
                </span>
                {isItemActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#FDE047]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  return (
    <SidebarProvider className="bg-[#121212] text-white">
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}