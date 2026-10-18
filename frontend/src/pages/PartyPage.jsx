import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Flame,
  PartyPopper,
  Play,
  Pause,
  Copy,
  Check,
  ExternalLink,
  Search,
  Users,
  Crown,
  Sparkles,
  Clock,
  Music,
  Plus,
  Radio,
  ChevronUp,
  ChevronDown,
  LogOut,
  Share2,
  Sliders,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { audioService } from "@/lib/audioService";
import { EqualizerModal } from "@/components/EqualizerModal";
import { QRCode } from "@/components/QRCode.jsx";

const STUDIO_TRACKS = [
  {
    key: "bustin",
    title: "Bustin Loose With Lead",
    artist: "Audionautix",
    genre: "Рок",
    duration: "2:08",
    duration_seconds: 128,
  },
  {
    key: "funk90",
    title: "90 Seconds Of Funk",
    artist: "Audionautix",
    genre: "Фанк",
    duration: "1:31",
    duration_seconds: 91,
  },
  {
    key: "cents5",
    title: "5 Cents Back",
    artist: "Audionautix",
    genre: "Рок",
    duration: "1:54",
    duration_seconds: 114,
  },
  {
    key: "fallingsky",
    title: "Falling Sky",
    artist: "Audionautix",
    genre: "Хаус",
    duration: "4:12",
    duration_seconds: 252,
  },
  {
    key: "dawn",
    title: "Первые лучи",
    artist: "Volna Studio",
    genre: "Эмбиент",
    duration: "0:48",
    duration_seconds: 48,
  },
  {
    key: "city",
    title: "После пар",
    artist: "Volna Studio",
    genre: "Лоу-фай",
    duration: "0:56",
    duration_seconds: 56,
  },
  {
    key: "orbit",
    title: "Орбита",
    artist: "Volna Studio",
    genre: "Электроника",
    duration: "0:52",
    duration_seconds: 52,
  },
  {
    key: "rain",
    title: "Тихий двор",
    artist: "Volna Studio",
    genre: "Инди",
    duration: "0:44",
    duration_seconds: 44,
  },
  {
    key: "night",
    title: "Ночной маршрут",
    artist: "Volna Studio",
    genre: "Синтвейв",
    duration: "1:00",
    duration_seconds: 60,
  },
  {
    key: "sea",
    title: "Морской бриз",
    artist: "Volna Studio",
    genre: "Чилаут",
    duration: "0:50",
    duration_seconds: 50,
  },
];

const GENRES = ["Все жанры", "Рок", "Фанк", "Хаус", "Эмбиент", "Лоу-фай", "Электроника", "Инди", "Синтвейв", "Чилаут"];

function fmt2(n) {
  return String(n).padStart(2, "0");
}

function fmtTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${fmt2(h)}:${fmt2(m)}:${fmt2(s)}`;
}

export function PartyPage() {
  const { id: routeRoomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: _authUser } = useAuth();

  const [activePartyId, setActivePartyId] = useState(null);
  const [partyState, setPartyState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Landing inputs
  const [createTitle, setCreateTitle] = useState("Субботний Движ 🔥");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [modalAddTrack, setModalAddTrack] = useState(false);
  const [modalStop, setModalStop] = useState(false);
  const [eqOpen, setEqOpen] = useState(false);
  const [isFXActive, setIsFXActive] = useState(audioService.isFXActive);
  const [volume, setVolumeState] = useState(audioService.volume);
  const [modalInvite, setModalInvite] = useState(false);
  const [serverAddress, setServerAddress] = useState("");
  const [addTrackTab, setAddTrackTab] = useState("library"); // library | custom
  const [trackSearch, setTrackSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Все жанры");
  const [customTitle, setCustomTitle] = useState("");
  const [customArtist, setCustomArtist] = useState("");
  const [customGenre, setCustomGenre] = useState("Поп");

  // Fetch LAN IP from bootstrap for invites
  useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => (r.ok ? r.json() : null))
      .then((bData) => {
        if (bData?.sharing?.base_url) {
          setServerAddress(bData.sharing.base_url);
        }
      })
      .catch(() => {});
  }, []);

  // Local timers & UI
  const [elapsedTimer, setElapsedTimer] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Player state
  const [player, setPlayer] = useState({
    trackId: null,
    playing: false,
    progress: 0,
    elapsed: 0,
  });

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Unlock audio on click
  useEffect(() => {
    const unlock = () => audioService.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Subscribe to audioService
  useEffect(() => {
    const unsub = audioService.subscribe((state) => {
      if (state.track) {
        setPlayer({
          trackId: state.track.id,
          playing: state.isPlaying,
          progress: state.progress,
          elapsed: state.seconds,
        });
      }
    });
    const unsubEQ = audioService.subscribeEQ((st) => {
      setIsFXActive(st.isFXActive);
    });
    return () => {
      unsub();
      unsubEQ();
    };
  }, []);

  // Load party state function
  const fetchPartyState = useCallback(async (partyId) => {
    if (!partyId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/parties/${partyId}/state`, { headers });
      if (!res.ok) {
        if (res.status === 404) {
          setActivePartyId(null);
          setPartyState(null);
        }
        return;
      }
      const data = await res.json();
      setPartyState(data);
      if (data?.party?.started_at && data?.party?.is_active) {
        const diff = Math.max(
          0,
          Math.floor((Date.now() - new Date(data.party.started_at).getTime()) / 1000)
        );
        setElapsedTimer(diff);
      }

      // Synchronize audio playback
      if (data?.playback) {
        const pb = data.playback;
        if (pb.state === "playing" && pb.current_track_id) {
          const tr = data.tracks?.find((t) => String(t.id) === String(pb.current_track_id));
          if (tr) {
            setPlayer((p) => ({ ...p, trackId: tr.id, playing: true }));
            if (audioService.currentTrack?.id !== tr.id || !audioService.isPlaying) {
              audioService.play({
                ...tr,
                library_key: tr.library_key || "bustin",
              }).catch(() => {});
            }
          }
        } else if (pb.state === "paused" && audioService.isPlaying) {
          audioService.pause();
          setPlayer((p) => ({ ...p, playing: false }));
        }
      }
    } catch {
      // offline / network error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize: check query param ?join=... or active party
  useEffect(() => {
    const joinCode = searchParams.get("join") || searchParams.get("code");
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (joinCode) {
      setLoading(true);
      fetch("/api/parties/join", {
        method: "POST",
        headers,
        body: JSON.stringify({ invite_code: joinCode.trim().toUpperCase() }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.party_id) {
            setActivePartyId(data.party_id);
            fetchPartyState(data.party_id);
            showToast(`🔥 Вы успешно присоединились к тусовке «${data.title}»!`);
            // Clean up URL without reload
            navigate(location.pathname, { replace: true });
          } else {
            showToast("Не удалось подключиться по инвайт-коду");
            setLoading(false);
          }
        })
        .catch(() => {
          showToast("Ошибка сети при подключении к вечеринке");
          setLoading(false);
        });
      return;
    }

    // Check active party
    setLoading(true);
    fetch("/api/parties/active", { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.has_active && data?.party_id) {
          setActivePartyId(data.party_id);
          fetchPartyState(data.party_id);
        } else {
          setActivePartyId(null);
          setPartyState(null);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [searchParams, fetchPartyState, navigate, showToast]);

  // WebSocket for real-time party updates
  useEffect(() => {
    if (!activePartyId) return;

    let ws = null;
    let reconnectTimer = null;
    let isMounted = true;

    function connectPartyWs() {
      if (!isMounted) return;
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws/parties/${activePartyId}`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type === "party_updated") {
              fetchPartyState(activePartyId);
              if (data?.action === "track_added" && data?.extra?.track) {
                showToast(`🎶 Добавлен трек: ${data.extra.track.title}`);
              } else if (data?.action === "participant_joined" && data?.extra?.user) {
                showToast(`👋 ${data.extra.user.display_name} присоединился к тусовке!`);
              } else if (data?.action === "party_stopped") {
                showToast("⏹ Хост завершил вечеринку");
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          if (isMounted) reconnectTimer = setTimeout(connectPartyWs, 2000);
        };
        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch {
        if (isMounted) reconnectTimer = setTimeout(connectPartyWs, 2000);
      }
    }

    connectPartyWs();
    const pollInterval = setInterval(() => fetchPartyState(activePartyId), 4000);

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollInterval) clearInterval(pollInterval);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [activePartyId, fetchPartyState, showToast]);

  // Live timer tick
  useEffect(() => {
    if (!partyState?.party?.is_active || !partyState?.party?.started_at) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - new Date(partyState.party.started_at).getTime()) / 1000)
      );
      setElapsedTimer(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [partyState?.party?.is_active, partyState?.party?.started_at]);

  // Create party handler
  const handleCreateParty = async () => {
    if (!createTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch("/api/parties/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: createTitle.trim(),
          community_id: routeRoomId || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.party_id) {
        setActivePartyId(data.party_id);
        await fetchPartyState(data.party_id);
        showToast("🔥 Вечеринка успешно создана! Инвайт готов.");
      } else {
        showToast(data.detail || "Не удалось создать вечеринку");
      }
    } catch {
      showToast("Ошибка сети при создании вечеринки");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Join party by code handler
  const handleJoinParty = async () => {
    if (!joinCodeInput.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch("/api/parties/join", {
        method: "POST",
        headers,
        body: JSON.stringify({
          invite_code: joinCodeInput.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (res.ok && data?.party_id) {
        setActivePartyId(data.party_id);
        await fetchPartyState(data.party_id);
        showToast(`🎉 Добро пожаловать на тусовку «${data.title}»!`);
      } else {
        showToast(data.detail || "Вечеринка не найдена или уже завершена");
      }
    } catch {
      showToast("Ошибка сети при подключении к вечеринке");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stop party handler (Host only)
  const handleStopParty = async () => {
    if (!activePartyId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/parties/${activePartyId}/stop`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        setModalStop(false);
        showToast("⏹ Вечеринка завершена.");
        await fetchPartyState(activePartyId);
      } else {
        const err = await res.json();
        showToast(err.detail || "Ошибка завершения тусовки");
      }
    } catch {
      showToast("Не удалось подключиться к серверу");
    }
  };

  const effectiveServer =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? window.location.origin
      : serverAddress || (typeof window !== "undefined" ? window.location.origin : "");
  const partyInviteUrl = `${effectiveServer}/party?join=${partyState?.party?.invite_code || ""}`;

  // Copy Invite link for friends and open QR modal
  const handleCopyInvite = async () => {
    if (!partyState?.party?.invite_code) return;
    setModalInvite(true);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(partyInviteUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = partyInviteUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsLinkCopied(true);
      showToast("🔗 Ссылка-инвайт скопирована! QR-код готов.");
      setTimeout(() => setIsLinkCopied(false), 3000);
    } catch {
      showToast("Открываем окно с инвайтом");
    }
  };

  // Export tracklist for Yandex Music
  const handleExportYandex = async () => {
    const list = partyState?.tracks || [];
    if (list.length === 0) {
      showToast("В плейлисте вечеринки пока нет треков для экспорта");
      return;
    }
    const textToCopy = list
      .map((t) => `${t.artist.trim()} - ${t.title.trim()}`)
      .join("\n");

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      showToast(`✓ Скопировано ${list.length} треков в формате Яндекс Музыки!`);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      showToast("Ошибка при копировании в буфер обмена");
    }
  };

  // Add track to party queue
  const handleAddTrack = async (trackMeta) => {
    if (!activePartyId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const payload = {
        key: trackMeta.key || null,
        title: trackMeta.title,
        artist: trackMeta.artist,
        genre: trackMeta.genre || "Вечеринка",
        duration_seconds: trackMeta.duration_seconds || 45,
      };
      const res = await fetch(`/api/parties/${activePartyId}/tracks`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setModalAddTrack(false);
        showToast(`🎶 Трек «${trackMeta.title}» добавлен в очередь тусовки!`);
        fetchPartyState(activePartyId);
      } else {
        const err = await res.json();
        showToast(err.detail || "Ошибка добавления трека");
      }
    } catch {
      showToast("Не удалось отправить трек");
    }
  };

  // Vote for track
  const handleVote = async (trackId, dir) => {
    if (!activePartyId || !partyState?.tracks) return;
    const t = partyState.tracks.find((x) => x.id === trackId);
    if (!t) return;
    const currentVote = t.my_vote ?? 0;
    const nextVote = currentVote === dir ? 0 : dir;

    // Optimistic update
    setPartyState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tracks: prev.tracks.map((x) =>
          x.id === trackId
            ? {
                ...x,
                my_vote: nextVote,
                score: (x.score || 0) + (nextVote - currentVote),
              }
            : x
        ),
      };
    });

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      await fetch(`/api/parties/${activePartyId}/tracks/${trackId}/vote`, {
        method: "POST",
        headers,
        body: JSON.stringify({ value: nextVote }),
      });
      fetchPartyState(activePartyId);
    } catch {}
  };

  // Host playback control
  const handlePlayTrack = async (track) => {
    if (!activePartyId) return;
    const isHost = partyState?.is_host;

    if (!isHost) {
      // Guests listen to the audio stream
      audioService.unlock();
      if (player.trackId === track.id && player.playing) {
        showToast("🎧 Вы синхронно слушаете эфир хоста");
      } else {
        audioService.play({
          ...track,
          library_key: track.library_key || "bustin",
        });
        showToast(`🎧 Локальное воспроизведение: ${track.title}`);
      }
      return;
    }

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (player.trackId === track.id && player.playing) {
      audioService.pause();
      setPlayer((p) => ({ ...p, playing: false }));
      await fetch(`/api/parties/${activePartyId}/tracks/${track.id}/pause`, {
        method: "POST",
        headers,
      }).catch(() => {});
    } else {
      audioService.play({
        ...track,
        library_key: track.library_key || "bustin",
      });
      setPlayer({ trackId: track.id, playing: true, progress: 0, elapsed: 0 });
      await fetch(`/api/parties/${activePartyId}/tracks/${track.id}/play`, {
        method: "POST",
        headers,
      }).catch(() => {});
    }
  };

  // Filtered tracks for Add modal
  const filteredStudioTracks = STUDIO_TRACKS.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
      t.artist.toLowerCase().includes(trackSearch.toLowerCase());
    const matchGenre = selectedGenre === "Все жанры" || t.genre === selectedGenre;
    return matchSearch && matchGenre;
  });

  const currentPlayingTrack =
    partyState?.tracks?.find((t) => t.id === player.trackId) ||
    partyState?.tracks?.find((t) => t.id === partyState?.playback?.current_track_id) ||
    null;

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. СОСТОЯНИЕ: НЕТ АКТИВНОЙ ВЕЧЕРИНКИ (LANDING СТРАНИЦА)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!loading && (!activePartyId || !partyState?.party?.is_active)) {
    return (
      <div className="w-full max-w-5xl mx-auto py-4 sm:py-8 px-2 sm:px-4 pb-32">
        {/* Хедер лендинга */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-4">
            <Flame size={13} className="text-yellow-400" />
            ИЗОЛИРОВАННЫЙ PARTY MODE
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 sm:mb-4">
            Вечеринка в ритме ✨
          </h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed px-2">
            Отдельное независимое пространство для совместного прослушивания: своя очередь треков, инвайт-код для друзей, живое голосование и синхронный звук.
          </p>
        </div>

        {/* Две карточки: Создать или Войти */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* КАРТОЧКА СОЗДАНИЯ */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#18160f] border border-[#382f15] p-5 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 flex items-center justify-center text-neutral-950 mb-4 sm:mb-6 shadow-xl shadow-yellow-500/25">
                <PartyPopper size={24} className="sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 sm:mb-2">Создать тусовку</h2>
              <p className="text-xs text-neutral-400 mb-4 sm:mb-6 leading-relaxed">
                Вы станете хостом, получите персональный инвайт-код и сможете управлять общим воспроизведением.
              </p>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 sm:mb-2">
                    Название вечеринки
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="Золотой Движ ✨"
                    className="w-full bg-[#12110b] border border-[#302914] rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-base sm:text-sm text-white placeholder-neutral-600 outline-none focus:border-yellow-400 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {["Золотой Движ ✨", "Хакатон Night ⚡", "Пятничный Чилл 🌴", "Afterparty 🎧"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCreateTitle(preset)}
                      className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-[#221e12] border border-[#382f15] text-neutral-300 hover:text-yellow-300 hover:border-yellow-500/40 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateParty}
              disabled={isSubmitting || !createTitle.trim()}
              className="mt-6 sm:mt-8 w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-105 text-neutral-950 font-bold text-sm tracking-wide shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <Flame size={18} />
              <span>{isSubmitting ? "Создание..." : "Запустить вечеринку"}</span>
            </button>
          </div>

          {/* КАРТОЧКА ВХОДА ПО КОДУ */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#18160f] border border-[#382f15] p-5 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#241f10] border border-[#4a3d16] flex items-center justify-center text-yellow-400 mb-4 sm:mb-6 shadow-xl shadow-yellow-500/10">
                <Users size={24} className="sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 sm:mb-2">Присоединиться</h2>
              <p className="text-xs text-neutral-400 mb-4 sm:mb-6 leading-relaxed">
                Введите инвайт-код, который вам отправил хост вечеринки (например, <span className="text-yellow-400 font-mono">P8X9K2</span>).
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 sm:mb-2">
                  Инвайт-код вечеринки
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="PXXXXX"
                  maxLength={12}
                  className="w-full bg-[#12110b] border border-[#302914] rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-base sm:text-lg font-mono tracking-widest text-yellow-400 placeholder-neutral-700 outline-none focus:border-yellow-400 transition-colors uppercase text-center"
                />
              </div>

              <div className="mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#12110b] border border-[#2b2413] text-xs text-neutral-400 leading-relaxed">
                💡 <span className="text-yellow-300 font-semibold">Совет:</span> Вы также можете просто перейти по прямой ссылке-инвайту, и подключение произойдет автоматически!
              </div>
            </div>

            <button
              onClick={handleJoinParty}
              disabled={isSubmitting || !joinCodeInput.trim()}
              className="mt-6 sm:mt-8 w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#262010] border border-[#4a3d16] hover:bg-[#332b14] text-yellow-400 hover:text-yellow-300 font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <Share2 size={18} />
              <span>{isSubmitting ? "Подключение..." : "Войти на вечеринку"}</span>
            </button>
          </div>
        </div>

        {/* Тост */}
        {toast && (
          <div className="fixed top-5 right-5 z-[200] bg-[#1a1a1a] border border-[#2e2e2e] text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl">
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. СОСТОЯНИЕ: АКТИВНАЯ ВЕЧЕРИНКА
  // ═══════════════════════════════════════════════════════════════════════════
  const party = partyState?.party || {};
  const tracksList = partyState?.tracks || [];
  const participants = partyState?.participants || [];
  const banger = partyState?.banger_track || null;
  const hitmaker = partyState?.hitmaker || null;
  const isHost = partyState?.is_host || false;

  return (
    <div className="w-full pb-36 max-w-7xl mx-auto">
      {/* ═══ ТОП БАР ВЕЧЕРИНКИ ════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-4 sm:mb-6 bg-gradient-to-br from-[#231d0d] via-[#1a1710] to-[#12110c] border border-[#3d3318] p-4 sm:p-6 shadow-2xl">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-25"
          style={{
            background: "radial-gradient(circle, #facc15 0%, #ca8a04 40%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          {/* Левая часть: Статус, название и инвайт */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border transition-all shadow-xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 border-yellow-300/40 text-neutral-950 shadow-yellow-500/25">
              <Flame size={24} className="sm:w-8 sm:h-8 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[10px] sm:text-xs font-black tracking-widest uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping inline-block" />
                  LIVE
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-neutral-300 bg-[#1e1a12] px-2.5 py-0.5 rounded-full border border-[#382f18]">
                  <Users size={11} className="text-yellow-400" />
                  {participants.length} чел
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-yellow-300 bg-yellow-950/50 px-2.5 py-0.5 rounded-full border border-yellow-700/50 font-mono font-bold tracking-wider">
                  Код: {party.invite_code}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-1.5">
                {party.title || "Вечеринка"}
                <span className="text-sm sm:text-base font-normal text-yellow-400">✨</span>
              </h1>
            </div>
          </div>

          {/* Правая часть: Таймер + Кнопка инвайта + Управление */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Таймер */}
            <div className="flex-1 sm:flex-initial bg-[#18160f] border border-[#382f15] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-center min-w-[85px]">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5 flex items-center justify-center gap-1">
                <Clock size={10} className="text-yellow-400" />
                В эфире
              </p>
              <p className="text-base sm:text-xl font-mono font-black tabular-nums text-white">
                {fmtTimer(elapsedTimer)}
              </p>
            </div>

            {/* Кнопка скопировать инвайт для друзей */}
            <button
              onClick={handleCopyInvite}
              className={cn(
                "flex-1 sm:flex-initial h-10 sm:h-12 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap",
                isLinkCopied
                  ? "bg-[#241f10] border border-[#4a3d16] text-yellow-300"
                  : "bg-[#262010] hover:bg-[#332b14] border border-[#4a3d16] text-yellow-400 hover:text-yellow-300"
              )}
            >
              {isLinkCopied ? (
                <>
                  <Check size={15} />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Share2 size={15} />
                  <span>Инвайт</span>
                </>
              )}
            </button>

            {/* Завершить тусовку (Хост) или Выйти */}
            {isHost ? (
              <button
                onClick={() => setModalStop(true)}
                className="h-10 sm:h-12 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                Завершить
              </button>
            ) : (
              <button
                onClick={() => {
                  setActivePartyId(null);
                  setPartyState(null);
                }}
                className="h-10 sm:h-12 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <LogOut size={14} />
                Выйти
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ОСНОВНОЙ КОНТЕНТ: 2 КОЛОНКИ ══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* ЛЕВАЯ КОЛОНКА (5 из 12) — Экспорт, Номинации, Гости */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
          {/* КАРТОЧКА 1: ЭКСПОРТ ДЛЯ ЯНДЕКС МУЗЫКИ */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#18160f] border border-[#2e2714] p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-2.5 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#241f10] border border-[#4a3d16] flex items-center justify-center text-yellow-400 shrink-0">
                <Music size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-yellow-400">ЭКСПОРТ СЕССИИ</p>
                <h3 className="text-base sm:text-lg font-bold text-white">Яндекс Музыка</h3>
              </div>
            </div>

            <p className="text-xs text-neutral-400 mb-4 sm:mb-5 leading-relaxed">
              Скопируйте очередь треков вечеринки в формате «Исполнитель - Трек» для мгновенного импорта в Яндекс Музыку.
            </p>

            <button
              onClick={handleExportYandex}
              className={cn(
                "w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer select-none active:scale-98",
                isCopied
                  ? "bg-[#241f10] border border-[#4a3d16] text-yellow-300"
                  : "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-105 text-neutral-950 font-bold shadow-yellow-500/20"
              )}
            >
              {isCopied ? (
                <>
                  <Check size={16} className="text-yellow-400" />
                  <span>Скопировано в буфер!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Скопировать для Яндекс Музыки</span>
                </>
              )}
            </button>

            <div className="mt-3.5 pt-3.5 sm:mt-4 sm:pt-4 border-t border-[#2b2413] flex items-center justify-between text-xs text-neutral-500">
              <span>{tracksList.length} треков тусовки</span>
              <a
                href="https://music.yandex.ru"
                target="_blank"
                rel="noreferrer"
                className="text-yellow-400 hover:text-yellow-300 font-medium inline-flex items-center gap-1 transition-colors"
              >
                Открыть Яндекс Музыку <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* КАРТОЧКА 2: НОМИНАЦИИ (БЭНГЕР И ХИТМЕЙКЕР) */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#18160f] border border-[#2e2714] p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col gap-3 sm:gap-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-neutral-300 flex items-center gap-2">
              <Sparkles size={14} className="text-yellow-400" /> Номинации вечеринки
            </h3>

            {/* Бэнгер */}
            <div className="bg-[#131109] border border-[#2b2413] rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-950/50 border border-yellow-700/50 px-2.5 py-0.5 rounded-full">
                  <Flame size={11} /> Главный бэнгер
                </span>
                <span
                  className={cn(
                    "text-xs font-black",
                    (banger?.score ?? 0) > 0
                      ? "text-yellow-400"
                      : (banger?.score ?? 0) < 0
                      ? "text-red-400"
                      : "text-neutral-400"
                  )}
                >
                  {(banger?.score ?? 0) > 0 ? `+${banger.score}` : (banger?.score ?? 0)} баллов
                </span>
              </div>

              {banger ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{banger.title}</p>
                    <p className="text-[11px] sm:text-xs text-neutral-400 truncate">{banger.artist}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Предложил: <span className="text-neutral-300 font-medium">{banger.contributor}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlayTrack(banger)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/25 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Воспроизвести"
                  >
                    <Play size={14} className="ml-0.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Пока нет треков в очереди</p>
              )}
            </div>

            {/* Хитмейкер */}
            <div className="bg-[#131109] border border-[#2b2413] rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-950/50 border border-yellow-700/50 px-2.5 py-0.5 rounded-full">
                  <Crown size={11} /> Главный хитмейкер
                </span>
                <span
                  className={cn(
                    "text-xs font-black",
                    (hitmaker?.total_score ?? 0) > 0
                      ? "text-yellow-400"
                      : (hitmaker?.total_score ?? 0) < 0
                      ? "text-red-400"
                      : "text-neutral-400"
                  )}
                >
                  {(hitmaker?.total_score ?? 0) > 0 ? `+${hitmaker.total_score}` : (hitmaker?.total_score ?? 0)} баллов
                </span>
              </div>

              {hitmaker ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-amber-400 to-yellow-600 text-neutral-950 font-black text-sm flex items-center justify-center shrink-0 shadow">
                    {hitmaker.avatar || "У"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{hitmaker.name}</p>
                    <p className="text-[11px] sm:text-xs text-neutral-400">
                      Предложил треков: {hitmaker.tracks_count}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Предлагайте треки, чтобы стать хитмейкером</p>
              )}
            </div>
          </div>

          {/* КАРТОЧКА 3: ГОСТИ ВЕЧЕРИНКИ */}
          <div className="rounded-2xl sm:rounded-3xl bg-[#18160f] border border-[#2e2714] p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                <Users size={14} className="text-yellow-400" /> Гости тусовки
              </h3>
              <span className="text-xs text-neutral-400">{participants.length} человек</span>
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#131109] border border-[#2b2413]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#241f10] border border-[#4a3d16] text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {p.avatar || "Г"}
                    </div>
                    <span className="text-xs font-semibold text-white truncate">
                      {p.display_name}
                    </span>
                  </div>

                  <div>
                    {p.is_host || p.role === "host" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-300 bg-yellow-950/50 border border-yellow-700/50 px-2 py-0.5 rounded-full">
                        <Crown size={10} /> ХОСТ
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 bg-[#1e1b12] px-2 py-0.5 rounded-full border border-[#382f18]">
                        Гость
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (7 из 12) — Живая очередь тусовки */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl sm:rounded-3xl bg-[#18160f] border border-[#2e2714] p-4 sm:p-6 shadow-xl">
            {/* Заголовок очереди и кнопка добавить трек */}
            <div className="flex items-center justify-between mb-4 sm:mb-5 flex-wrap gap-2.5">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-yellow-400">ОЧЕРЕДЬ ТУСОВКИ</p>
                <h2 className="text-lg sm:text-xl font-bold text-white">Треки на вечеринке</h2>
              </div>

              <button
                onClick={() => setModalAddTrack(true)}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-105 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={15} />
                Добавить трек
              </button>
            </div>

            {/* Список треков */}
            <div className="flex flex-col gap-2">
              {tracksList.map((track, idx) => {
                const isPlaying =
                  (player.trackId === track.id && player.playing) ||
                  (partyState?.playback?.current_track_id === track.id && partyState?.playback?.state === "playing");
                const medals = ["🥇", "🥈", "🥉"];
                const yandexQuery = encodeURIComponent(`${track.artist} ${track.title}`);
                const yandexUrl = `https://music.yandex.ru/search?text=${yandexQuery}`;

                return (
                  <div
                    key={track.id}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all group",
                      isPlaying
                        ? "bg-[#241f10] border-[#4a3d16]"
                        : "bg-[#131109] border-[#2b2413] hover:bg-[#1b170c] hover:border-[#382f15]"
                    )}
                  >
                    {/* Ранг / Медаль */}
                    <div className="w-5 sm:w-6 text-center shrink-0">
                      {idx < 3 ? (
                        <span className="text-sm sm:text-base select-none">{medals[idx]}</span>
                      ) : (
                        <span className="text-xs font-bold text-neutral-500">{idx + 1}</span>
                      )}
                    </div>

                    {/* Обложка и Play */}
                    <div
                      className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-600/35 border border-yellow-500/30 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden shadow-md"
                      onClick={() => handlePlayTrack(track)}
                      title={isHost ? "Хост: включить у всех" : "Слушать локально"}
                    >
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {isPlaying ? (
                          <Pause size={15} className="text-yellow-400 fill-yellow-400" />
                        ) : (
                          <Play size={15} className="text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Название и исполнитель */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs sm:text-sm font-semibold truncate",
                          isPlaying ? "text-yellow-300" : "text-white"
                        )}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                        {track.artist} · <span className="text-neutral-500">{track.genre}</span>
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5 truncate">
                        Предложил: <span className="text-neutral-300">@{track.contributor || "гость"}</span>
                      </p>
                    </div>

                    {/* Баллы */}
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-extrabold px-1.5 sm:px-2 py-0.5 rounded-lg border tabular-nums shrink-0",
                        (track.score || 0) > 0
                          ? "text-yellow-400 bg-[#29220e] border-[#453716]"
                          : (track.score || 0) < 0
                          ? "text-red-400 bg-red-950/40 border-red-800/40"
                          : "text-neutral-400 bg-[#1b1912] border-[#2e291b]"
                      )}
                    >
                      {(track.score || 0) > 0 ? `+${track.score}` : (track.score ?? 0)}
                    </span>

                    {/* Голосование */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleVote(track.id, 1)}
                        className={cn(
                          "w-6 h-5 rounded flex items-center justify-center transition-colors cursor-pointer",
                          track.my_vote === 1
                            ? "bg-[#332a12] text-yellow-400"
                            : "text-neutral-500 hover:text-neutral-200"
                        )}
                        title="Голосовать «За»"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleVote(track.id, -1)}
                        className={cn(
                          "w-6 h-5 rounded flex items-center justify-center transition-colors cursor-pointer",
                          track.my_vote === -1
                            ? "bg-red-950/40 text-red-400"
                            : "text-neutral-500 hover:text-neutral-200"
                        )}
                        title="Голосовать «Против»"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Поиск в Яндекс Музыке */}
                    <a
                      href={yandexUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#18160f] border border-[#2b2413] hover:bg-[#221e12] hover:border-yellow-500/50 text-neutral-400 hover:text-yellow-400 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                      title="Найти трек в Яндекс Музыке"
                    >
                      <Search size={13} />
                    </a>
                  </div>
                );
              })}

              {tracksList.length === 0 && (
                <div className="py-16 text-center text-neutral-500 text-sm">
                  Очередь тусовки пуста. Нажмите «+ Добавить трек»!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ МИНИ-ПЛЕЕР ВНИЗУ ═════════════════════════════════════════════════ */}
      <div className="fixed bottom-[58px] md:bottom-0 left-0 right-0 z-40 bg-[#121008]/95 backdrop-blur-xl border-t border-[#332a14]">
        <div className="h-0.5 w-full bg-neutral-800/80">
          <div
            className="h-full bg-yellow-400 shadow-[0_0_8px_#facc15] transition-[width] duration-500"
            style={{ width: `${player.progress}%` }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-600 flex items-center justify-center text-neutral-950 shrink-0 shadow">
              <Music size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">
                  {currentPlayingTrack?.title ?? "Общий эфир"}
                </p>
                {player.playing && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-yellow-300 bg-[#241f10] border border-[#4a3d16] px-1.5 py-0.2 rounded-md">
                    <Radio size={10} className="animate-pulse" /> LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[240px]">
                {currentPlayingTrack?.artist ?? "Вечеринка"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Контрол громкости */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => {
                  const nextVol = volume === 0 ? 0.7 : 0;
                  setVolumeState(nextVol);
                  audioService.setVolume(nextVol);
                }}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={volume === 0 ? "Включить звук" : "Выключить звук"}
              >
                {volume === 0 ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolumeState(v);
                  audioService.setVolume(v);
                }}
                className="w-16 lg:w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                title={`Громкость: ${Math.round(volume * 100)}%`}
              />
            </div>

            {/* Кнопка вызова эквалайзера */}
            <button
              onClick={() => setEqOpen(true)}
              className={cn(
                "relative h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95",
                isFXActive
                  ? "bg-[#241f10] border-yellow-400/60 text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.25)]"
                  : "bg-[#18160f] border-[#2e2714] text-neutral-400 hover:text-white hover:border-[#3d3319]"
              )}
              title="3-полосный эквалайзер и DJ-эффекты"
            >
              <Sliders size={14} className={isFXActive ? "text-yellow-400" : ""} />
              <span className="hidden sm:inline">EQ</span>
              {isFXActive && (
                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15] animate-pulse" />
              )}
            </button>

            <button
              onClick={() => {
                if (currentPlayingTrack) handlePlayTrack(currentPlayingTrack);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[#241f10] border border-[#4a3d16] text-yellow-400 hover:bg-[#332b14] transition-colors cursor-pointer"
              title={isHost ? "Хост: Play / Pause для всех" : "Слушать локально"}
            >
              {player.playing ? (
                <Pause size={16} className="fill-yellow-400 text-yellow-400" />
              ) : (
                <Play size={16} className="fill-yellow-400 text-yellow-400 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ МОДАЛКА ЭКВАЛАЙЗЕРА ═════════════════════════════════════════════ */}
      <EqualizerModal open={eqOpen} onOpenChange={setEqOpen} />

      {/* ═══ ТОСТ-УВЕДОМЛЕНИЯ ════════════════════════════════════════════════ */}
      {toast && (
        <div className="fixed top-5 right-5 z-[200] bg-[#1a1a1a] border border-[#2e2e2e] text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* ═══ МОДАЛКА: ДОБАВИТЬ ТРЕК НА ВЕЧЕРИНКУ ═════════════════════════════ */}
      <Dialog open={modalAddTrack} onOpenChange={setModalAddTrack}>
        <DialogContent className="sm:max-w-[600px] bg-[#18160f] border-[#382f15] text-white max-h-[85vh] flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-950/50 border border-yellow-700/50 text-yellow-400 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white m-0">
                Добавить трек на вечеринку
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400 m-0">
                Трек мгновенно появится в изолированной очереди тусовки у всех участников.
              </DialogDescription>
            </div>
          </div>

          {/* Вкладки: Библиотека / Свой трек */}
          <div className="flex gap-2 border-b border-[#2e2714] pb-3 mb-3">
            <button
              onClick={() => setAddTrackTab("library")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                addTrackTab === "library"
                  ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Из библиотеки студии
            </button>
            <button
              onClick={() => setAddTrackTab("custom")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                addTrackTab === "custom"
                  ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Ввести вручную
            </button>
          </div>

          {addTrackTab === "library" ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3.5 top-3 text-neutral-500" />
                <input
                  type="text"
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  placeholder="Поиск по названию или исполнителю..."
                  className="w-full bg-[#12110b] border border-[#2e2714] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>

              {/* Жанры */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-2 shrink-0">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0",
                      selectedGenre === g
                        ? "bg-[#282211] text-yellow-300 border border-[#4a3d16] font-bold"
                        : "bg-[#14120a] text-neutral-400 hover:text-white"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Список треков библиотеки */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[300px]">
                {filteredStudioTracks.map((tr) => (
                  <div
                    key={tr.key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#131109] border border-[#2b2413] hover:border-[#3d3319] transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-semibold text-white truncate">{tr.title}</p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {tr.artist} · <span className="text-neutral-500">{tr.genre}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddTrack(tr)}
                      className="px-3 py-1.5 rounded-xl bg-[#241f10] border border-[#4a3d16] text-yellow-300 text-xs font-bold hover:bg-[#332b14] transition-colors cursor-pointer shrink-0"
                    >
                      + В очередь
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Название трека</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Например: Ягода Малинка"
                  className="w-full bg-[#12110b] border border-[#2e2714] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Исполнитель</label>
                <input
                  type="text"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="Например: Хабиб"
                  className="w-full bg-[#12110b] border border-[#2e2714] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Жанр</label>
                <input
                  type="text"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Поп, Хип-хоп, Рок..."
                  className="w-full bg-[#12110b] border border-[#2e2714] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>

              <button
                onClick={() =>
                  handleAddTrack({
                    title: customTitle,
                    artist: customArtist,
                    genre: customGenre,
                  })
                }
                disabled={!customTitle.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-105 text-neutral-950 font-bold text-xs tracking-wide shadow-lg cursor-pointer mt-3 disabled:opacity-50"
              >
                Добавить трек в тусовку
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ МОДАЛКА: ЗАВЕРШЕНИЕ ВЕЧЕРИНКИ ═══════════════════════════════════ */}
      <Dialog open={modalStop} onOpenChange={setModalStop}>
        <DialogContent className="sm:max-w-[420px] bg-[#18160f] border-[#382f15] text-white">
          <DialogTitle className="text-lg font-bold text-white m-0">
            Завершить вечеринку?
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400 m-0">
            Сессия вечеринки будет закрыта, а воспроизведение остановлено.
          </DialogDescription>
          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={() => setModalStop(false)}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleStopParty}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
            >
              Завершить
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ МОДАЛКА: ПРИГЛАШЕНИЕ НА ВЕЧЕРИНКУ С QR ═════════════════════════ */}
      <Dialog open={modalInvite} onOpenChange={setModalInvite}>
        <DialogContent className="sm:max-w-[440px] bg-[#18160f] border-[#382f15] text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#241f10] border border-[#4a3d16] text-yellow-400">
            <Share2 size={18} />
          </div>
          <DialogTitle className="text-xl font-bold text-white m-0">
            Позвать друзей на тусовку
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400 m-0">
            Покажи QR на экране или поделись ссылкой — друзья сразу подключатся к вечеринке.
          </DialogDescription>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                Ссылка для входа
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={partyInviteUrl}
                  className="flex-1 bg-[#14120a] border border-[#2e2614] rounded-xl px-3 py-2 text-xs text-yellow-300 font-mono outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(partyInviteUrl);
                    setIsLinkCopied(true);
                    setTimeout(() => setIsLinkCopied(false), 2000);
                    showToast("Ссылка скопирована!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-950/50 border border-yellow-700/50 text-yellow-300 text-xs font-semibold hover:bg-yellow-900/50 transition-colors shrink-0 cursor-pointer"
                >
                  {isLinkCopied ? <Check size={14} className="text-yellow-400" /> : <Copy size={14} />}
                  {isLinkCopied ? "Скопировано" : "Копировать"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                Код тусовки
              </label>
              <div className="flex items-center justify-between bg-[#1c180e] border border-[#3d3215] rounded-xl px-4 py-2.5">
                <span className="text-xl font-black tracking-widest text-yellow-300">
                  {partyState?.party?.invite_code || "PARTY"}
                </span>
                <span className="text-xs text-neutral-400">Введи при входе</span>
              </div>
            </div>
            <div className="rounded-xl bg-[#14120a] border border-[#2e2614] p-4 flex items-center gap-4">
              <div className="shrink-0 bg-white rounded-xl p-2 shadow-xs flex items-center justify-center">
                <QRCode
                  value={partyInviteUrl}
                  size={76}
                  fgColor="#000000"
                  bgColor="#ffffff"
                  margin={1}
                  className="rounded-md"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Сканируй и залетай</p>
                <p className="text-xs text-neutral-400 mt-1 leading-snug">
                  Наведи камеру телефона на QR-код для мгновенного входа.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
