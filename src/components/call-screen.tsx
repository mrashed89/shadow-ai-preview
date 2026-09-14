"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, PhoneOff, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiraPresence } from "@/components/mira-presence";
import { ScreenShareNotice } from "@/components/screen-share-notice";
import { AgeClock } from "@/components/age-clock";
import { getBuddy } from "@/lib/buddies";
import { getTimeOfDay, type TimeOfDay } from "@/lib/time-of-day";
import { cn } from "@/lib/utils";

type ChatMsg = { role: "user" | "assistant"; content: string };

type BuddyInfo = {
  id: string;
  name: string;
  lockedAt: string;
  daysTogether: number;
  ageLabel: string;
};

type Props = {
  userName: string;
  buddy: BuddyInfo;
  initialMemory: Record<string, string>;
  autoStart?: boolean;
};

export function CallScreen({ userName, buddy, initialMemory, autoStart = true }: Props) {
  const router = useRouter();
  const buddyMeta = getBuddy(buddy.id) ?? getBuddy("mira")!;
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [noticeOpen, setNoticeOpen] = useState(autoStart);
  const [connected, setConnected] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [guiding, setGuiding] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [mode, setMode] = useState<"live" | "mock" | null>(null);
  const [listening, setListening] = useState(false);
  const [memory, setMemory] = useState(initialMemory);

  const displayRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMsg[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setTimeOfDay(getTimeOfDay());
    const id = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, guiding]);

  const stopShare = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (displayRef.current) displayRef.current.srcObject = null;
    setSharing(false);
  }, []);

  const endCall = useCallback(() => {
    recognitionRef.current?.stop();
    stopShare();
    setConnected(false);
    router.push("/");
  }, [router, stopShare]);

  const captureFrame = useCallback(async (): Promise<string | null> => {
    const video = displayRef.current;
    if (!video || !video.videoWidth) return null;
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    const maxW = 1024;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const flashSpeaking = useCallback((ms = 2200) => {
    setSpeaking(true);
    if (speakTimer.current) clearTimeout(speakTimer.current);
    speakTimer.current = setTimeout(() => setSpeaking(false), ms);
  }, []);

  const askGuide = useCallback(
    async (text: string, opts?: { silentUser?: boolean }) => {
      setGuiding(true);
      setError(null);
      const history = messagesRef.current.slice(-8);
      if (!opts?.silentUser && text.trim()) {
        setMessages((m) => [...m, { role: "user", content: text.trim() }]);
      }

      try {
        const frameDataUrl = await captureFrame();
        const res = await fetch("/api/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim() || "Looking at my screen — what should I do next?",
            frameDataUrl,
            history,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Guidance failed");
        setMode(data.mode);
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
        flashSpeaking();
        if (data.memoryUpdates) {
          setMemory((prev) => ({ ...prev, ...data.memoryUpdates }));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not reach Shadow");
      } finally {
        setGuiding(false);
      }
    },
    [captureFrame, flashSpeaking],
  );

  const startCallWithShare = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen share isn’t supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      });
      streamRef.current = stream;
      if (displayRef.current) {
        displayRef.current.srcObject = stream;
        await displayRef.current.play().catch(() => undefined);
      }
      setSharing(true);
      setConnected(true);
      setNoticeOpen(false);

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setSharing(false);
      });

      flashSpeaking(1800);
      const greeting =
        timeOfDay === "night"
          ? `Hey ${userName.split(" ")[0]} — I'm in (cozy mode). I can see your shared screen. What are we doing?`
          : `Hey ${userName.split(" ")[0]} — I'm in. I can see your shared screen. What are we doing?`;
      setMessages([
        {
          role: "assistant",
          content: greeting,
        },
      ]);

      window.setTimeout(() => {
        void askGuide("Looking at my screen — orient me and suggest the first click.", {
          silentUser: true,
        });
      }, 900);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Screen share was cancelled";
      if (
        /dismissed|denied|cancel|NotAllowed/i.test(msg) ||
        (e as { name?: string })?.name === "NotAllowedError"
      ) {
        setError("Screen share is required for the call. Try again when you’re ready.");
        setNoticeOpen(true);
      } else {
        setError(msg);
      }
      setConnected(false);
    } finally {
      setBusy(false);
    }
  }, [askGuide, flashSpeaking, userName, timeOfDay]);

  const toggleVoice = () => {
    const SR =
      typeof window !== "undefined"
        ? (window as unknown as {
            SpeechRecognition?: new () => SpeechRecognitionLike;
            webkitSpeechRecognition?: new () => SpeechRecognitionLike;
          }).SpeechRecognition ||
          (window as unknown as {
            webkitSpeechRecognition?: new () => SpeechRecognitionLike;
          }).webkitSpeechRecognition
        : undefined;

    if (!SR) {
      setError("Voice input isn’t supported here — type instead.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInput(transcript);
        void askGuide(transcript);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || guiding) return;
    const text = input;
    setInput("");
    void askGuide(text);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--bg)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(124,58,237,0.22),transparent_45%),radial-gradient(ellipse_at_90%_80%,rgba(76,29,149,0.18),transparent_40%)]" />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg tracking-tight">Shadow AI</p>
          <p className="text-xs text-white/45">
            Call with {buddy.name}
            {mode ? ` · ${mode === "live" ? "Live vision" : "Demo guidance"}` : ""}
          </p>
        </div>
        <div className="hidden max-w-xs sm:block">
          <AgeClock
            daysTogether={buddy.daysTogether}
            ageLabel={buddy.ageLabel}
            lockedAt={buddy.lockedAt}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-4 px-4 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <section className="space-y-3">
          <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/50 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5 text-xs text-white/50">
              <span>Your shared screen</span>
              <span className={sharing ? "text-emerald-300/90" : "text-amber-200/80"}>
                {sharing ? "Live share" : "Waiting for share"}
              </span>
            </div>
            <div className="relative aspect-video bg-[#07050c]">
              <video
                ref={displayRef}
                muted
                playsInline
                autoPlay
                className={cn("h-full w-full object-contain", !sharing && "opacity-0")}
              />
              {!sharing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <Sparkles className="h-6 w-6 text-[var(--accent-bright)]" />
                  <p className="text-sm text-white/70">Screen share appears here once the call starts.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="sm:hidden">
            <AgeClock
              daysTogether={buddy.daysTogether}
              ageLabel={buddy.ageLabel}
              lockedAt={buddy.lockedAt}
            />
          </div>

          {memory.lastTask ? (
            <p className="text-xs text-white/40">
              Memory · last task: <span className="text-white/65">{memory.lastTask}</span>
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <MiraPresence
            name={buddyMeta.name}
            timeOfDay={timeOfDay}
            portraitDay={buddyMeta.portraitDay}
            portraitNight={buddyMeta.portraitNight}
            speaking={speaking || guiding}
            connected={connected}
            className="mx-auto w-full max-w-sm lg:max-w-none"
          />

          <div className="flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/40 backdrop-blur">
            <div className="border-b border-white/8 px-4 py-2.5 text-xs text-white/45">
              Live guidance
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn(
                    "max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-[var(--accent)]/15 text-white/90"
                      : "ml-auto bg-white/10 text-white/85",
                  )}
                >
                  {m.content}
                </div>
              ))}
              {guiding ? (
                <div className="rounded-2xl bg-[var(--accent)]/10 px-3 py-2 text-sm text-white/55">
                  {buddy.name} is looking…
                </div>
              ) : null}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={onSubmit} className="flex gap-2 border-t border-white/8 p-3">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={toggleVoice}
                aria-label={listening ? "Stop listening" : "Voice input"}
                className={listening ? "border-[var(--accent)]/50" : ""}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={connected ? "Ask Mira what to click…" : "Start the call first"}
                disabled={!connected || guiding}
              />
              <Button type="submit" size="icon" disabled={!connected || guiding || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/8 bg-black/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/45">
            {error ? <span className="text-rose-300">{error}</span> : "Buddy pick is forever · Mira ages with you"}
          </p>
          <div className="flex items-center gap-2">
            {!connected ? (
              <Button variant="call" onClick={() => setNoticeOpen(true)}>
                CALL
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  disabled={guiding || !sharing}
                  onClick={() => void askGuide("What should I click next?")}
                >
                  Look again
                </Button>
                <Button variant="danger" onClick={endCall}>
                  <PhoneOff className="h-4 w-4" />
                  End
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ScreenShareNotice
        open={noticeOpen && !connected}
        buddyName={buddy.name}
        onCancel={() => {
          setNoticeOpen(false);
          if (!connected) router.push("/");
        }}
        onConfirm={() => void startCallWithShare()}
        busy={busy}
      />
    </div>
  );
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results?: { [index: number]: { [index: number]: { transcript?: string } } };
};
