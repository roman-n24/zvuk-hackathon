import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full p-6 min-w-0 transition-all duration-300">
        {children}
      </main>
    </SidebarProvider>
  );
}