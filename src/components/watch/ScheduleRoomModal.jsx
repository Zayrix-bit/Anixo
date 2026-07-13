import { useState, useEffect } from "react";
import { X } from "lucide-react";

const getCurrentTime = () => Date.now();

export default function ScheduleRoomModal({ isOpen, onClose, onSchedule }) {
  const [minutes, setMinutes] = useState(15);
  const [customMinutes, setCustomMinutes] = useState("");
  const [now, setNow] = useState(getCurrentTime);

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to avoid synchronous setState warning during effect execution
      const timer = setTimeout(() => {
        setNow(getCurrentTime());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickSelect = (mins) => {
    setMinutes(mins);
    setCustomMinutes("");
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomMinutes(val);
    if (val && !isNaN(val) && parseInt(val, 10) > 0) {
      setMinutes(parseInt(val, 10));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (minutes > 0) {
      onSchedule(minutes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#161616] rounded-lg border border-white/10 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Schedule Room</h2>
            <p className="text-white/60 text-sm mt-1">Set a time for your Watch Together session</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            
            {/* Quick Select Options */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Quick select
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[15, 30, 60, 120].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleQuickSelect(mins)}
                    className={`py-2 rounded-md text-sm font-medium transition-colors border ${
                      minutes === mins && !customMinutes
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Time */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Custom duration (minutes)
              </label>
              <input 
                type="number"
                min="1"
                value={customMinutes}
                onChange={handleCustomChange}
                placeholder="e.g. 45"
                className="w-full bg-black/40 border border-white/10 rounded-md px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-discord-500 focus:bg-black/60 transition-colors"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-white/70 text-sm">
                Starts at: <span className="text-white font-medium ml-1">
                  {new Date(now + minutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-discord-600 hover:bg-discord-700 text-white font-medium py-3 rounded-md transition-colors mt-2"
            >
              Confirm schedule
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
