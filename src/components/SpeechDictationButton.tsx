import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Loader2, Volume2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { soundFeedback } from '../utils/feedback';

interface SpeechDictationButtonProps {
  onTranscript: (newText: string) => void;
  currentValue?: string;
  lang?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  appendMode?: boolean; // If true, appends to currentValue; if false, replaces or appends with space
}

export default function SpeechDictationButton({
  onTranscript,
  currentValue = '',
  lang = 'th-TH',
  buttonSize = 'sm',
  className = '',
  title = 'ถอดความด้วยเสียง (Dictate notes with voice)',
  appendMode = true,
}: SpeechDictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore cleanup error
        }
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('เบราว์เซอร์ของคุณยังไม่รองรับการพิมพ์ด้วยเสียง (Web Speech API)');
      return;
    }

    try {
      soundFeedback.click();
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        toast('กำลังฟังเสียงพูด... พูดข้อความรายละเอียดได้เลย', {
          icon: '🎙️',
          duration: 3000,
        });
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += transcript;
          } else {
            interimStr += transcript;
          }
        }

        if (interimStr) {
          setInterimTranscript(interimStr);
        }

        if (finalStr.trim()) {
          const trimmedFinal = finalStr.trim();
          let updatedText = trimmedFinal;
          
          if (appendMode && currentValue && currentValue.trim()) {
            // Append with space if needed
            const needsSpace = !currentValue.endsWith(' ') && !currentValue.endsWith('\n');
            updatedText = `${currentValue}${needsSpace ? ' ' : ''}${trimmedFinal}`;
          }

          onTranscript(updatedText);
          setInterimTranscript('');
          soundFeedback.success();
          toast.success('ถอดความเสียงบันทึกสำเร็จ');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('กรุณาอนุญาตการใช้ไมโครโฟนในเบราว์เซอร์');
        } else if (event.error === 'no-speech') {
          // No speech detected, quietly ignore or inform
        } else if (event.error !== 'aborted') {
          toast.error(`ข้อผิดพลาดการจดจำเสียง: ${event.error}`);
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      toast.error('ไม่สามารถเปิดใช้งานไมโครโฟนได้');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        soundFeedback.click();
        recognitionRef.current.stop();
      } catch (e) {
        // ignore error
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Size styling
  const sizeClasses = 
    buttonSize === 'lg' ? 'p-2.5 rounded-2xl' :
    buttonSize === 'md' ? 'p-2 rounded-xl' :
    'p-1.5 rounded-lg';

  const iconSize = 
    buttonSize === 'lg' ? 18 :
    buttonSize === 'md' ? 16 :
    14;

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="เบราว์เซอร์นี้ไม่รองรับ Web Speech API"
        className={`text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50 ${sizeClasses} ${className}`}
      >
        <MicOff size={iconSize} />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? 'กดเพื่อหยุดฟัง (Stop listening)' : title}
        className={`relative transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 font-bold text-xs ${
          isListening
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-400 ring-offset-1 dark:ring-offset-slate-900'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700'
        } ${sizeClasses} ${className}`}
      >
        {isListening ? (
          <>
            <Square size={iconSize} className="fill-white" />
            <span className="hidden sm:inline text-[11px] font-black pl-0.5">หยุดฟัง</span>
          </>
        ) : (
          <>
            <Mic size={iconSize} />
            <span className="sr-only">พูดบอกรายละเอียด</span>
          </>
        )}
      </button>

      {/* Interim transcript popup floating hint when listening */}
      {isListening && (
        <div className="absolute right-0 bottom-full mb-2 z-50 min-w-[200px] max-w-[300px] p-2.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-rose-500/40 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center space-x-1.5 text-rose-400 font-extrabold text-[11px] mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            <Volume2 size={12} className="animate-bounce" />
            <span>กำลังฟังเสียงถอดความ...</span>
          </div>
          <p className="text-[11px] text-slate-200 italic line-clamp-2">
            {interimTranscript ? `"${interimTranscript}"` : 'กำลังรอฟังข้อความพูด...'}
          </p>
        </div>
      )}
    </div>
  );
}
