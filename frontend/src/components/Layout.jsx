import { useLocation } from "react-router-dom";
import { Headphones } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchBar } from "@/components/SearchBar";
import { CommunitySwitcher } from "@/components/CommunitySwitcher";
import { cn } from "@/lib/utils";

export default function Layout({ children }) {
  const location = useLocation();
  const isPlaylistPage =
    location.pathname === "/playlist" ||
    location.pathname.startsWith("/playlist/") ||
    location.pathname.startsWith("/community");
  const isLibraryPage = location.pathname === "/library";

  return (
    <SidebarProvider className="bg-[#121212] text-white">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen bg-[#121212] text-white">
        {/* Верхняя шапка: на странице плейлиста переключатель сообществ, на медиатеке заголовок медиатеки, на остальных поиск */}
        <header
          className={cn(
            "w-full px-8 z-40",
            isLibraryPage
              ? "pt-6 pb-8 bg-[#121212]"
              : "sticky top-0 pt-5 pb-3 bg-[#121212]/95 backdrop-blur-sm"
          )}
        >
          {isPlaylistPage ? (
            <CommunitySwitcher />
          ) : isLibraryPage ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e261d] border border-[#2e402d] text-[#a3e635] text-xs font-semibold uppercase tracking-wider mb-5">
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
          ) : location.pathname === "/" ? (
            <SearchBar />
          ) : null}
        </header>

        {/* Основное содержимое страницы */}
        <main className="flex-1 w-full px-8 pb-8 min-w-0 transition-all duration-300">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}