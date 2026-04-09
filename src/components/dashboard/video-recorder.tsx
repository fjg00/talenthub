"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Video, Square, Mic, MicOff, Loader2 } from "lucide-react";

interface VideoRecorderProps {
  onComplete: (videoBlob: Blob, transcript: string, durationSeconds: number) => void;
  maxDurationSeconds?: number;
}

export function VideoRecorder({
  onComplete,
  maxDurationSeconds = 180,
}: VideoRecorderProps) {
  const t = useTranslations("interview");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [hasCamera, setHasCamera] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera preview
  const initCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setHasCamera(false);
    }
  }, []);

  useEffect(() => {
    initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    if (!stream) return;
    setIsPreparing(true);

    chunksRef.current = [];
    transcriptRef.current = "";
    setTranscript("");
    setElapsed(0);

    // Setup MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      onComplete(blob, transcriptRef.current, duration);
    };

    // Setup Speech Recognition for live transcript
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript = result[0].transcript;
          }
        }

        if (finalTranscript) {
          transcriptRef.current += finalTranscript;
        }
        setTranscript(transcriptRef.current + interimTranscript);
      };

      recognition.onerror = () => {
        // Speech recognition error — continue recording without transcript
      };

      recognition.onend = () => {
        // Restart if still recording
        if (mediaRecorderRef.current?.state === "recording") {
          try {
            recognition.start();
          } catch {
            // already started
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    }

    // Start recording
    recorder.start(1000);
    startTimeRef.current = Date.now();
    setIsRecording(true);
    setIsPreparing(false);

    // Timer
    timerRef.current = setInterval(() => {
      const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= maxDurationSeconds) {
        stopRecording();
      }
    }, 1000);
  }, [stream, maxDurationSeconds, onComplete]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!hasCamera) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
        <Video className="mx-auto h-10 w-10 text-error/50" />
        <p className="mt-2 text-sm text-error">{t("noCameraAccess")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="aspect-video w-full mirror"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute start-4 top-4 flex items-center gap-2 rounded-full bg-error/90 px-3 py-1 text-sm font-medium text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {formatTime(elapsed)} / {formatTime(maxDurationSeconds)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isPreparing || !stream}
            className="inline-flex items-center gap-2 rounded-xl bg-error px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPreparing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Video className="h-5 w-5" />
            )}
            {isPreparing ? t("preparing") : t("startRecording")}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Square className="h-5 w-5" />
            {t("stopRecording")}
          </button>
        )}
      </div>

      {/* Live Transcript */}
      {(isRecording || transcript) && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            {isRecording ? (
              <Mic className="h-4 w-4 animate-pulse text-error" />
            ) : (
              <MicOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {t("liveTranscript")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {transcript || t("speakNow")}
          </p>
        </div>
      )}
    </div>
  );
}
