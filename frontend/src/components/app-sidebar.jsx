import { useState } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  ListMusic,
  Library,
  Heart,
  Plus,
  Trash2,
  Users,
  KeyRound,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CreateCommunityDialog } from "./CreateCommunityDialog";
import { JoinByCodeDialog } from "./JoinByCodeDialog";
import { InviteFriendsDialog } from "./InviteFriendsDialog";

const items = [
  { title: "Главная", url: "/", icon: Home },
  { title: "Плейлист", url: "/playlist", icon: ListMusic },
  { title: "Медиатека", url: "/library", icon: Library },
  { title: "Избранное", url: "/favorites", icon: Heart },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const [communities, setCommunities] = useState([
    { id: 1, name: "Мое сообщество", url: "/community/1" },
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleCreateCommunity = (communityName) => {
    const newId = Date.now();
    setCommunities((prev) => [
      ...prev,
      {
        id: newId,
        name: communityName,
        url: `/community/${newId}`,
      },
    ]);
  };

  const handleRemoveCommunity = (idToRemove) => {
    setCommunities((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleJoinByCode = (inviteCode) => {
    const newId = Date.now();
    setCommunities((prev) => [
      ...prev,
      {
        id: newId,
        name: `Сообщество (${inviteCode})`,
        url: `/community/${newId}`,
      },
    ]);
  };

  return (
    <Sidebar>
      {/* Самый верхний уровень: Логотип сайта и кнопка сворачивания */}
      <SidebarHeader
        className={cn(
          "border-b border-[#262626]/60 p-3 transition-all",
          open
            ? "flex-row items-center justify-between"
            : "flex-col items-center justify-center gap-3 px-2 py-3"
        )}
        style={{
          display: "flex",
          justifyContent: open ? "space-between" : "center",
          alignItems: "center",
        }}
      >
        {open ? (
          <>
            <Link
              to="/"
              className="flex items-center gap-3 px-2 py-1 rounded-xl transition-colors hover:bg-neutral-800/50 select-none min-w-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#a3e635] shadow-xs">
                <svg
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                >
                  <rect x="7.5" y="13" width="3" height="10" rx="1.5" fill="#171717" />
                  <rect x="12.5" y="9" width="3" height="18" rx="1.5" fill="#171717" />
                  <rect x="17.5" y="6" width="3" height="24" rx="1.5" fill="#171717" />
                  <rect x="22.5" y="9" width="3" height="18" rx="1.5" fill="#171717" />
                  <rect x="27.5" y="13" width="3" height="10" rx="1.5" fill="#171717" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white flex items-baseline truncate">
                ритм<span className="text-[#a3e635] text-2xl font-black">.</span>
              </span>
            </Link>
            <SidebarTrigger />
          </>
        ) : (
          <>
            <SidebarTrigger />
            <Link
              to="/"
              title="ритм."
              className="flex items-center justify-center rounded-xl transition-colors hover:bg-neutral-800/50 select-none p-1"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#a3e635] shadow-xs">
                <svg
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                >
                  <rect x="7.5" y="13" width="3" height="10" rx="1.5" fill="#171717" />
                  <rect x="12.5" y="9" width="3" height="18" rx="1.5" fill="#171717" />
                  <rect x="17.5" y="6" width="3" height="24" rx="1.5" fill="#171717" />
                  <rect x="22.5" y="9" width="3" height="18" rx="1.5" fill="#171717" />
                  <rect x="27.5" y="13" width="3" height="10" rx="1.5" fill="#171717" />
                </svg>
              </div>
            </Link>
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {open && <SidebarGroupLabel>Музыка</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} title={item.title}>
                      <item.icon />
                      {open && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Разделительная черта */}
        <SidebarSeparator />

        {/* Твои сообщества */}
        <SidebarGroup>
          {open ? (
            <div className="flex items-center justify-between pr-2 mb-1">
              <SidebarGroupLabel>Твои сообщества</SidebarGroupLabel>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
                title="Добавить сообщество"
                aria-label="Добавить сообщество"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">+</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center mb-1 w-full">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
                title="Добавить сообщество"
                aria-label="Добавить сообщество"
              >
                <Plus className="h-5 w-5" />
                <span className="sr-only">+</span>
              </button>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {communities.map((community) => (
                <SidebarMenuItem key={community.id} className="group relative">
                  <SidebarMenuButton asChild className={cn(open ? "pr-8" : "justify-center px-0")}>
                    <Link to={community.url} title={community.name}>
                      <Users className="h-4 w-4 shrink-0" />
                      {open && <span className="truncate">{community.name}</span>}
                    </Link>
                  </SidebarMenuButton>
                  {open && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveCommunity(community.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-[#333] hover:text-red-400 transition-opacity transition-colors cursor-pointer"
                      title="Удалить сообщество"
                      aria-label="Удалить сообщество"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Удалить</span>
                    </button>
                  )}
                </SidebarMenuItem>
              ))}

              {/* Кнопка "Вступить по коду" */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsJoinOpen(true)}
                  className={cn("text-neutral-400 hover:text-white", !open && "justify-center px-0")}
                  title="Вступить по коду"
                >
                  <KeyRound className="h-4 w-4 shrink-0" />
                  {open && <span>Вступить по коду</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Самый нижний уровень */}
      <SidebarFooter className="border-t border-[#262626]/60 p-2 mt-auto flex items-center justify-center transition-all duration-300">
        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          title="Музыка лучше вместе — Пригласи друзей"
          className={cn(
            "rounded-2xl bg-[#1c231d] border border-[#2b392d] flex items-center text-left hover:bg-[#232e25] transition-all duration-300 ease-in-out cursor-pointer group overflow-hidden",
            open
              ? "w-full h-[70px] p-2 gap-3"
              : "w-[50px] h-[50px] p-0 gap-0 justify-center mx-auto"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#293d2c] text-[#a3e635]">
            <Headphones className="h-5 w-5" />
          </div>
          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden shrink-0",
              open ? "w-[160px] opacity-100" : "w-0 opacity-0 pointer-events-none"
            )}
          >
            <div className="w-[160px]">
              <div className="text-sm font-bold text-white leading-tight truncate">
                Музыка лучше вместе
              </div>
              <div className="text-xs text-neutral-400 leading-snug mt-0.5 line-clamp-2">
                Пригласи друзей и выбирайте, что слушать
              </div>
            </div>
          </div>
        </button>
      </SidebarFooter>

      {/* Модальное окно создания сообщества */}
      <CreateCommunityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreateCommunity={handleCreateCommunity}
      />

      {/* Модальное окно вступления по коду */}
      <JoinByCodeDialog
        open={isJoinOpen}
        onOpenChange={setIsJoinOpen}
        onJoinByCode={handleJoinByCode}
      />

      {/* Модальное окно приглашения на волну */}
      <InviteFriendsDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </Sidebar>
  );
}