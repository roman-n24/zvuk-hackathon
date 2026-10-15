import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  children,
  ...props
}) {
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
    },
    [open, setOpenProp]
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, [setOpen]);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div
        className={cn("flex min-h-screen w-full bg-white text-neutral-900", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children, ...props }) {
  const { open } = useSidebar();

  return (
    <aside
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "relative flex flex-col border-r border-[#262626] bg-[#171717] text-neutral-100 transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-0 -translate-x-full overflow-hidden border-none",
        className
      )}
      {...props}
    >
      <div className="flex h-full w-64 flex-col">{children}</div>
    </aside>
  );
}

export function SidebarTrigger({ className, onClick, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
      aria-label="Toggle Sidebar"
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

export function SidebarContent({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-1 flex-col gap-2 overflow-auto p-4", className)}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }) {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({ className, ...props }) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider",
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }) {
  return <div className={cn("w-full text-sm", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }) {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1 list-none p-0 m-0", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({ className, ...props }) {
  return <li className={cn("relative", className)} {...props} />;
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  children,
  ...props
}) {
  const baseClasses = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-[#262626] hover:text-white [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
    isActive && "bg-[#262626] text-white font-semibold",
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(baseClasses, children.props.className),
      ...props,
    });
  }

  return (
    <button type="button" className={baseClasses} {...props}>
      {children}
    </button>
  );
}
