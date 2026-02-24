"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceInput({
  value = "",
  onChange,
  placeholder = "Type or speak...",
  className = "",
  disabled = false,
  defaultLanguage = "en-US", // en-US | hi-IN
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState(null);
  const [language, setLanguage] = useState(defaultLanguage);
  const inputRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = language;

    recognitionInstance.onresult = (event) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }

      if (finalTranscript) {
        const formattedText = finalTranscript.replace(/\s+/g, " ").trim();
        const currentValue = value || "";

        const input = inputRef.current;
        if (input) {
          const start = input.selectionStart ?? currentValue.length;
          const end = input.selectionEnd ?? currentValue.length;

          const before = currentValue.substring(0, start);
          const after = currentValue.substring(end);

          onChange?.(`${before}${formattedText} ${after}`);
        } else {
          onChange?.(currentValue + " " + formattedText);
        }
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        alert(
          "Microphone access denied! Please allow microphone permission."
        );
      }

      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognition || disabled) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.lang = language; // ensure latest language
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Recognition start error:", error);
      }
    }
  };

  const toggleLanguage = () => {
    if (isListening) return; // prevent switching while active
    setLanguage((prev) => (prev === "en-US" ? "hi-IN" : "en-US"));
  };

  if (!isSupported) return null;

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 pr-20"
      />

      {/* Language Toggle */}
      <button
        type="button"
        onClick={toggleLanguage}
        disabled={disabled || isListening}
        className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
      >
        {language === "en-US" ? "EN" : "HI"}
      </button>

      {/* Mic Button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`absolute right-2 p-1.5 rounded-full transition-all ${
          isListening
            ? "bg-red-100 text-red-600 animate-pulse"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
    </div>
  );
}