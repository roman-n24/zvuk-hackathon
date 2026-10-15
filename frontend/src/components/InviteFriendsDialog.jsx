import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Copy, Check, Info } from "lucide-react";

export function InviteFriendsDialog({ open, onOpenChange }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Временные данные для демонстрации до подключения бэкенда
  const communityCode = "RITM2026";
  const serverAddress = "http://127.0.0.1:5173";
  const inviteLink = `${serverAddress}/?join=${communityCode}`;

  const copyToClipboard = (text, type) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] text-left bg-[#171717] border-neutral-800 max-h-[90vh] overflow-y-auto">
        {/* Иконка Share в зеленом блоке */}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#233525] border border-[#2e4730] text-[#a3e635]">
          <Share2 className="h-5 w-5" />
        </div>

        {/* Тег ВМЕСТЕ ГРОМЧЕ */}
        <p className="text-xs font-bold uppercase tracking-wider text-[#a3e635] -mt-1 m-0">
          ВМЕСТЕ ГРОМЧЕ
        </p>

        {/* Заголовок */}
        <DialogTitle className="text-2xl font-bold text-white leading-tight -mt-1 m-0">
          Зови всех на свою волну.
        </DialogTitle>

        {/* Описание */}
        <DialogDescription asChild>
          <p className="text-sm text-neutral-400 leading-normal -mt-1 m-0">
            Поделись кодом или ссылкой. Друзья смогут слушать, добавлять треки и голосовать.
          </p>
        </DialogDescription>

        <div className="flex flex-col gap-3.5 mt-2 w-full">
          {/* Код сообщества */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Код сообщества
            </label>
            <div className="flex items-center justify-between rounded-xl bg-[#202521] border border-[#2a342c] px-4 py-2.5">
              <span className="font-bold text-lg tracking-widest text-white">
                {communityCode}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(communityCode, "code")}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#28322a] text-neutral-300 hover:bg-[#324035] hover:text-white transition-colors"
                title="Скопировать код"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-[#a3e635]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Адрес сервера */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Адрес сервера (для телефона — IP ноутбука)
            </label>
            <div className="rounded-xl bg-[#202521] border border-[#2a342c] px-3.5 py-2.5 text-sm text-neutral-300 font-mono">
              {serverAddress}
            </div>
          </div>

          {/* Ссылка для приглашения */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Ссылка для приглашения
            </label>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-[#202521] border border-[#2a342c] px-3.5 py-2 text-sm text-neutral-300">
              <span className="truncate font-mono text-xs text-neutral-300">
                {inviteLink}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(inviteLink, "link")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#28322a] text-neutral-300 hover:bg-[#324035] hover:text-white transition-colors"
                title="Скопировать ссылку"
              >
                {copiedLink ? (
                  <Check className="h-4 w-4 text-[#a3e635]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Баннер "Сканируй и голосуй" */}
          <div className="rounded-2xl bg-[#e3f7b8] p-3.5 flex items-center gap-3.5 text-neutral-900 mt-1">
            <div className="shrink-0 rounded-xl bg-white p-1.5 shadow-xs">
              <img
                src="/icons/qr-code.svg"
                alt="QR Code"
                className="h-16 w-16"
              />
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900">
                Сканируй и голосуй
              </h4>
              <p className="text-xs text-neutral-700 leading-snug mt-1">
                Покажи QR на проекторе — участники сразу попадут в плейлист.
              </p>
            </div>
          </div>

          {/* Подсказка внизу */}
          <div className="flex items-start gap-2 text-xs text-neutral-400 mt-0.5">
            <Info className="h-4 w-4 shrink-0 text-neutral-500 mt-0.5" />
            <span>
              Для телефонов ссылка должна содержать адрес компьютера в локальной сети или настроенный домен.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
