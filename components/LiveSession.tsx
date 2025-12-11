import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
// [AN GYARA AN CIRE] import { MOCK_CONSULTANTS } from '../constants';
import { createPcmBlob, decodeAudioData, PCM_SAMPLE_RATE_INPUT, PCM_SAMPLE_RATE_OUTPUT } from '../services/liveAudioUtils';
import { Consultant } from '../types'; // [AN ƘARA] Shigo da Consultant type

interface LiveSessionProps {
  onClose: () => void;
  // [AN ƘARA] Karɓi jerin masu ba da shawara a matsayin prop
  availableConsultants: Consultant[];
}

// [AN GYARA] An karɓi availableConsultants a matsayin prop
const LiveSession: React.FC<LiveSessionProps> = ({ onClose, availableConsultants }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0); // For user mic feedback
  
  // Refs to hold instances
  const sessionRef = useRef<any>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const isAiSpeakingRef = useRef(false); // Ref for animation loop access

  // Sync state with ref
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Setup Audio Contexts
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: PCM_SAMPLE_RATE_INPUT
        });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: PCM_SAMPLE_RATE_OUTPUT
        });

        inputContextRef.current = inputCtx;
        outputContextRef.current = outputCtx;

        // Setup Analysers
        const inputAnalyser = inputCtx.createAnalyser();
        inputAnalyser.fftSize = 64; // Low res for bars
        inputAnalyser.smoothingTimeConstant = 0.8;
        inputAnalyserRef.current = inputAnalyser;

        const outputAnalyser = outputCtx.createAnalyser();
        outputAnalyser.fftSize = 64;
        outputAnalyser.smoothingTimeConstant = 0.8;
        outputAnalyserRef.current = outputAnalyser;

        // 2. Setup System Instruction
        // [AN GYARA] Maimakon MOCK_CONSULTANTS, yanzu muna amfani da availableConsultants (daga props)
        const consultantContext = availableConsultants.map(c => ({
          id: c.id,
          name: c.name,
          title: c.title,
          category: c.category,
          languages: c.languages,
          bio: c.bio,
          rate: c.hourlyRate
        }));

        const systemInstruction = `
          You are the Tattaunawa360 Voice Assistant. 
          Your goal is to help users find the perfect expert consultant by voice.
          Speak naturally, concisely, and helpfully.
          
          Here is the list of available verified consultants:
          ${JSON.stringify(consultantContext)}

          If asked about specific experts, use the provided list.
          If the user speaks another language (French, Hausa, Arabic, Spanish), reply in that language.
        `;

        // 3. Connect to Live API
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
          },
          callbacks: {
            onopen: async () => {
              if (!mounted) return;
              setStatus('connected');
              console.log("Live session connected");

              // Start Microphone Stream
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = inputCtx.createMediaStreamSource(stream);
                
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcmBlob = createPcmBlob(inputData);
                  
                  // Calculate volume for UI feedback (simple RMS)
                  let sum = 0;
                  for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                  }
                  const rms = Math.sqrt(sum / inputData.length);
                  setVolumeLevel(Math.min(1, rms * 5)); // Boost factor for visibility

                  sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                  });
                };

                // Routing: Source -> Analyser -> Processor -> Gain(Mute) -> Destination
                // We mute the destination so we don't hear ourselves, but keep the chain alive for Chrome
                const gainNode = inputCtx.createGain();
                gainNode.gain.value = 0;

                source.connect(inputAnalyser);
                inputAnalyser.connect(processor);
                processor.connect(gainNode);
                gainNode.connect(inputCtx.destination);

              } catch (err) {
                console.error("Mic Error:", err);
                setErrorMessage("Microphone access failed.");
                setStatus('error');
              }
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (!mounted) return;

              // Handle Audio Output
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                const audioBuffer = await decodeAudioData(audioData, outputCtx);
                
                // Scheduling
                const now = outputCtx.currentTime;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                
                // Route: Source -> Analyser -> Destination
                source.connect(outputAnalyser);
                outputAnalyser.connect(outputCtx.destination);
                
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
                };
                
                source.start(nextStartTimeRef.current);
                sourcesRef.current.add(source);
                setIsAiSpeaking(true);
                
                nextStartTimeRef.current += audioBuffer.duration;
              }

              // Handle Interruption
              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = outputContextRef.current?.currentTime || 0;
                setIsAiSpeaking(false);
              }
            },
            onclose: () => {
              if (mounted) console.log("Session closed");
            },
            onerror: (err) => {
              console.error("Session Error:", err);
              if (mounted) {
                setStatus('error');
                setErrorMessage("Connection lost.");
              }
            }
          }
        });

        sessionRef.current = sessionPromise;

      } catch (e: any) {
        console.error("Setup Error:", e);
        setErrorMessage(e.message || "Failed to start session");
        setStatus('error');
      }
    };

    startSession();

    return () => {
      mounted = false;
      // Cleanup
      if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
      }
      if (inputContextRef.current) inputContextRef.current.close();
      if (outputContextRef.current) outputContextRef.current.close();
      sourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [availableConsultants]); // [AN GYARA] An ƙara availableConsultants a matsayin dependency

  // Visualizer Loop
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      
      // Clear
      ctx.clearRect(0, 0, width, height);

      // Determine active analyser
      // If AI is speaking, visualize Output. If not, visualize Input (User).
      const currentAnalyser = isAiSpeakingRef.current 
        ? outputAnalyserRef.current 
        : inputAnalyserRef.current;
      
      if (!currentAnalyser) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = currentAnalyser.frequencyBinCount; // fftSize / 2
      const dataArray = new Uint8Array(bufferLength);
      currentAnalyser.getByteFrequencyData(dataArray);

      // Styling based on mode
      const isUser = !isAiSpeakingRef.current;
      const barColor = isUser ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)'; // Green vs Blue

      const barWidth = (width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Boost heights slightly for better visual
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = height * percent * 0.8; 

        // Draw symmetric from middle vertically
        const y = (height - barHeight) / 2;

        ctx.fillStyle = barColor;
        
        // Rounded caps look nice
        // But for performance, simple rects
        if (barHeight > 2) {
            ctx.fillRect(x, y, barWidth - 2, barHeight);
        }

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // Run once, relies on refs

  return (
    <div className="absolute inset-0 bg-slate-50 z-10 flex flex-col items-center justify-between p-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'connected' ? 'bg-green-500 animate-pulse' : 
              status === 'error' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className={`text-sm font-bold ${
              status === 'error' ? 'text-red-600' : 'text-slate-700'
            }`}>
                {status === 'connected' ? 'LIVE' : 
                 status === 'error' ? 'ERROR' : 
                 'CONNECTING...'}
            </span>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Signal Strength Indicator */}
             <div className="flex items-end gap-0.5 h-5" title={
                 status === 'connected' ? "Connection: Good" :
                 status === 'connecting' ? "Connection: Fair" : "Connection: Poor"
             }>
                <div className={`w-1.5 rounded-sm ${status === 'error' ? 'bg-red-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-green-500'} h-2`}></div>
                <div className={`w-1.5 rounded-sm ${status === 'error' ? 'bg-slate-200' : status === 'connecting' ? 'bg-yellow-500' : 'bg-green-500'} h-3`}></div>
                <div className={`w-1.5 rounded-sm ${status === 'error' ? 'bg-slate-200' : status === 'connecting' ? 'bg-slate-200' : 'bg-green-500'} h-5`}></div>
             </div>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </div>

      {status === 'connecting' && (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Establishing secure connection...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
           </div>
           <p className="text-red-600 font-medium">{errorMessage}</p>
        </div>
      )}

      {status === 'connected' && (
        <div className="flex flex-col items-center w-full flex-grow justify-center gap-8">
           
           <div className="text-center">
             <h3 className="text-xl font-bold text-slate-900 mb-1">
                 {isAiSpeaking ? "Gemini is speaking..." : "Listening..."}
             </h3>
             <p className="text-slate-400 text-sm">
                 {isAiSpeaking ? "Interactive Voice Mode" : "Go ahead, I'm listening"}
             </p>
           </div>

           {/* Canvas Visualizer */}
           <div className="relative w-full h-32 flex items-center justify-center bg-white rounded-2xl shadow-inner border border-slate-100 overflow-hidden">
             <canvas 
               ref={canvasRef} 
               width={400} 
               height={128} 
               className="w-full h-full object-cover opacity-90"
             />
             
             {/* Fallback Pulse if Canvas Fails or just decoration */}
             {!isAiSpeaking && volumeLevel < 0.05 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-ping"></div>
                </div>
             )}
           </div>

           {/* Mic Indicator */}
           <div className={`transition-all duration-300 p-4 rounded-full ${isAiSpeaking ? 'bg-slate-100' : 'bg-blue-50 border-4 border-blue-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isAiSpeaking ? 'text-slate-300' : 'text-blue-600'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
           </div>

        </div>
      )}

      {/* Footer Controls */}
      <div className="w-full mt-auto pt-6">
         <button 
           onClick={onClose} 
           className="w-full bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2 2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
           </svg>
           End Voice Session
         </button>
      </div>

    </div>
  );
};

export default LiveSession;