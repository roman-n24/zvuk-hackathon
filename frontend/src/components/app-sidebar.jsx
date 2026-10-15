import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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
} from "lucide-react";
import { Link } from "react-router-dom";

const items = [
  { title: "Главная", url: "/", icon: Home },
  { title: "Плейлист", url: "/playlist", icon: ListMusic },
  { title: "Медиатека", url: "/library", icon: Library },
  { title: "Избранное", url: "/favorites", icon: Heart },
];

export function AppSidebar() {
  const [communities, setCommunities] = useState([
    { id: 1, name: "Мое сообщество", url: "/community/1" },
  ]);

  const handleAddCommunity = () => {
    const newId = Date.now();
    setCommunities((prev) => [
      ...prev,
      {
        id: newId,
        name: `Сообщество ${prev.length + 1}`,
        url: `/community/${newId}`,
      },
    ]);
  };

  const handleRemoveCommunity = (idToRemove) => {
    setCommunities((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleJoinByCode = () => {
    // Действие по кнопке без открытия модального окна (по требованию)
    console.log("Вступить по коду");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Музыка</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Разделительная черта */}
        <SidebarSeparator />
        <br className="hidden" />

        {/* Твои сообщества */}
        <SidebarGroup>
          <div className="flex items-center justify-between pr-2">
            <SidebarGroupLabel>Твои сообщества</SidebarGroupLabel>
            <button
              type="button"
              onClick={handleAddCommunity}
              className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-[#262626] hover:text-white transition-colors"
              title="Добавить сообщество"
              aria-label="Добавить сообщество"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">+</span>
            </button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {communities.map((community) => (
                <SidebarMenuItem key={community.id} className="group relative">
                  <SidebarMenuButton asChild className="pr-8">
                    <Link to={community.url}>
                      <Users className="h-4 w-4" />
                      <span className="truncate">{community.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveCommunity(community.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-[#333] hover:text-red-400 transition-opacity transition-colors"
                    title="Удалить сообщество"
                    aria-label="Удалить сообщество"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Удалить</span>
                  </button>
                </SidebarMenuItem>
              ))}

              {/* Кнопка "Вступить по коду" */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleJoinByCode}
                  className="text-neutral-400 hover:text-white"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Вступить по коду</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}