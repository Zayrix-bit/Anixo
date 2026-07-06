import { X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ReportModal({ activeEpisode, reportDetails, setReportDetails, toggleReportIssue, submitReport, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121418] w-full max-w-[480px] rounded-[4px] shadow-2xl border border-white/15 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-white mb-1">{t('report.issue')}</h2>
            <p className="text-white/30 text-[12px] font-medium uppercase tracking-wider">{t('report.episodeLabel')}<span className="text-discord-500">{activeEpisode}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/30 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-0 space-y-6">
          <p className="text-[13px] text-white/50 leading-relaxed font-normal">
            {t('report.description')}
          </p>

          {/* Issue Categories */}
          <div className="grid grid-cols-2 gap-4">
            {[
              "Video broken", 
              "Audio not synced", 
              "Subtitle not synced", 
              "Server not working"
            ].map((issue) => (
              <label key={issue} className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => toggleReportIssue(issue)}
                  className={`w-4 h-4 border transition-all flex items-center justify-center ${reportDetails.issues.includes(issue) ? 'bg-discord-600 border-discord-600' : 'bg-white/5 border-white/10 group-hover:border-white/30'}`}
                >
                  {reportDetails.issues.includes(issue) && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <span className={`text-[12px] transition-colors ${reportDetails.issues.includes(issue) ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>{issue}</span>
              </label>
            ))}
          </div>

          {/* Other Details */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{t('report.otherDetails')}</label>
            <textarea
              value={reportDetails.other}
              onChange={(e) => setReportDetails(prev => ({ ...prev, other: e.target.value }))}
              placeholder="Please share more details about the issue you're encountering."
              className="w-full bg-white/5 border border-white/10 rounded-sm p-4 text-[13px] text-white placeholder:text-white/10 outline-none focus:border-discord-600/50 transition-all min-h-[120px] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={submitReport}
            disabled={reportDetails.issues.length === 0 && !reportDetails.other.trim()}
            className="w-full bg-discord-600 hover:bg-discord-700 disabled:bg-white/5 disabled:text-white/10 text-white font-bold text-[13px] py-4 uppercase tracking-[0.2em] transition-all"
          >
            {t('report.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
