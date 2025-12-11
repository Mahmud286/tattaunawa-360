import React, { useState, useEffect } from 'react';

interface VideoModalProps {
  expertName: string;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ expertName, onClose }) => {
  const [duration, setDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-[60] flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-4xl bg-black sm:rounded-2xl overflow-hidden shadow-2xl relative h-full sm:h-auto sm:aspect-video flex flex-col">
        {/* Main Video Feed (Mocked) */}
        <div className="flex-1 bg-slate-800 relative">
          <img 
            src="https://picsum.photos/1280/720?grayscale" 
            alt="Remote Feed" 
            className="w-full h-full object-cover opacity-60" 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                {expertName.charAt(0)}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide px-4">{expertName}</h2>
              <p className="text-blue-300 animate-pulse mt-2">Connected • {formatTime(duration)}</p>
            </div>
          </div>

          {/* User Self View */}
          <div className="absolute top-4 right-4 sm:top-auto sm:bottom-4 sm:right-4 w-32 h-24 sm:w-48 sm:h-36 bg-slate-700 rounded-lg overflow-hidden border-2 border-slate-600 shadow-lg z-10">
             <div className="w-full h-full bg-slate-600 flex items-center justify-center text-slate-400 text-xs">
                {camOn ? "Your Camera" : "Camera Off"}
             </div>
          </div>
          
          <button onClick={onClose} className="absolute top-4 left-4 sm:hidden bg-black/50 p-2 rounded-full text-white">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Controls */}
        <div className="h-20 sm:h-24 bg-slate-900 flex items-center justify-center gap-6 sm:gap-8 pb-4 sm:pb-0">
           <button 
             onClick={() => setMicOn(!micOn)}
             className={`p-3 sm:p-4 rounded-full ${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors`}
           >
             {micOn ? (
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             ) : (
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="2 2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
             )}
           </button>
           
           <button 
             onClick={onClose}
             className="p-3 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors px-6 sm:px-8"
           >
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2 2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
           </button>

           <button 
             onClick={() => setCamOn(!camOn)}
             className={`p-3 sm:p-4 rounded-full ${camOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors`}
           >
             {camOn ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;