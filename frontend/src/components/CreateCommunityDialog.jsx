import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateCommunityDialog({
  open,
  onOpenChange,
  onCreateCommunity,
  children,
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateCommunity?.(name.trim());
    setName("");
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[440px] text-left">
        {/* Иконка двух людей */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200">
          <img
            src="/icons/users.svg"
            alt="Иконка двух людей"
            className="h-5 w-5 brightness-125"
          />
        </div>

        {/* Параграф: НОВОЕ СООБЩЕСТВО */}
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 m-0">
          НОВОЕ СООБЩЕСТВО
        </p>

        {/* Заголовок: Создадим свою волну? */}
        <DialogTitle className="text-xl font-bold text-white m-0">
          Создадим свою волну?
        </DialogTitle>

        {/* Параграф: Придумай название — и зови друзей собирать общий плейлист */}
        <DialogDescription asChild>
          <p className="text-sm text-neutral-400 m-0">
            Придумай название — и зови друзей собирать общий плейлист
          </p>
        </DialogDescription>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="flex flex-col items-start gap-4 w-full mt-2">
          <div className="flex flex-col items-start gap-2 w-full">
            <label
              htmlFor="community-name-input"
              className="text-sm font-medium text-neutral-200"
            >
              Название сообщества
            </label>
            <input
              id="community-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например ПрогИнж-4 или ПИ"
              className="w-full rounded-lg border border-neutral-700 bg-[#262626] px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200 active:scale-[0.99]"
          >
            <img src="/icons/plus.svg" alt="+" className="h-4 w-4" />
            <span>Создать сообщество</span>
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
