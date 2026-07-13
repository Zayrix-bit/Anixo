import { useState, useEffect, useRef } from "react";
import { Users, Crown, Send, RefreshCw, LogOut, ArrowDown, Link, StopCircle } from "lucide-react";

export default function WatchTogetherSidebar({
  wtRoom,
  wtMessages,
  wtTypingUsers,
  onSendMessage,
  onTypingAction,
  onSyncNow,
  onLeave,
  onEndRoom,
  userId,
}) {
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const chatContainerRef = useRef(null);
  const isFirstRender = useRef(true);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
      setUnreadCount(0);
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
    if (atBottom && unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      scrollToBottom();
      isFirstRender.current = false;
      return;
    }
    
    if (wtMessages.length === 0) return;

    const lastMsg = wtMessages[wtMessages.length - 1];
    const isMyMessage = lastMsg.userId === userId;

    if (isAtBottom || isMyMessage) {
      // Small timeout ensures DOM is updated before scrolling
      setTimeout(scrollToBottom, 10);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCount(prev => prev + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wtMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText("");
      setTimeout(scrollToBottom, 10);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (onTypingAction) onTypingAction(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (onTypingAction) {
      onTypingAction(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTypingAction(false);
      }, 2000);
    }
  };

  return (
    <div 
      className="w-full h-[600px] border border-white/15 bg-[#0d0d0d] flex flex-col overflow-hidden relative"
      style={{ clipPath: 'polygon(15px 0%, 100% 0%, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0% 100%, 0% 15px)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/15 flex items-center justify-between shrink-0 bg-[#111] min-h-[60px]">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-discord-500" />
            Watch Together
          </h2>
          {wtRoom?.hostId && (
            <div className="text-[10px] text-white/50 mt-1 font-medium flex items-center gap-1.5">
              <span>Hosted by</span>
              <span className="text-white font-bold">{wtRoom.members?.find(m => m.id === wtRoom.hostId)?.displayName || 'Unknown'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-sm transition-all"
            title="Copy Invite Link"
          >
            <Link size={16} />
          </button>

          {!wtRoom.isHost && (
            <button
              onClick={onSyncNow}
              className="p-2 text-white/40 hover:text-discord-500 hover:bg-discord-500/10 rounded-sm transition-all"
              title="Force Sync with Host"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {wtRoom.isHost && (
            <button
              onClick={onEndRoom}
              className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-all"
              title="End Room"
            >
              <StopCircle size={16} />
            </button>
          )}

          <div className="w-px h-4 bg-white/10 mx-1"></div>

          <button
            onClick={onLeave}
            className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-all"
            title="Leave Room"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="p-3 border-b border-white/10 shrink-0 max-h-[120px] overflow-y-auto scrollbar-hide">
        <h3 className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">
          Members ({wtRoom.members.length})
        </h3>
        <div className="flex flex-col gap-2">
          {wtRoom.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {member.avatar ? (
                  <img src={member.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                    {member.displayName?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <span 
                  onClick={() => window.open(`/user/${member.id}`, '_blank')}
                  className={`text-[12px] font-medium cursor-pointer hover:underline ${member.id === userId ? "text-discord-400" : "text-white/80"}`}
                  title="View Profile"
                >
                  {member.displayName}
                  {member.id === userId && " (You)"}
                </span>
              </div>
              {member.id === wtRoom.hostId && (
                <Crown size={12} className="text-yellow-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative"
      >
        {wtMessages.map((msg) => (
          <div key={msg._id} className={`flex flex-col ${msg.type === 'system' ? 'items-center' : (msg.userId === userId ? 'items-end' : 'items-start')}`}>
            {msg.type === 'system' ? (
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                {msg.text}
              </span>
            ) : (
              <div className={`max-w-[85%] flex flex-col ${msg.userId === userId ? 'items-end' : 'items-start'}`}>
                {msg.userId !== userId && (
                  <span className="text-[10px] text-white/50 mb-0.5 ml-1 flex items-center gap-1">
                    <span 
                      onClick={() => window.open(`/user/${msg.userId}`, '_blank')}
                      className="cursor-pointer hover:underline hover:text-white transition-colors"
                      title="View Profile"
                    >
                      {msg.displayName}
                    </span>
                    {msg.isHost && <Crown size={10} className="text-yellow-500" />}
                  </span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words ${msg.userId === userId ? 'bg-discord-600 text-white rounded-br-sm' : 'bg-white/10 text-white/90 rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="relative shrink-0">
        {/* Unread Messages Badge */}
        {unreadCount > 0 && (
          <button 
            onClick={scrollToBottom}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-discord-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-sm shadow-lg flex items-center gap-1.5 hover:bg-discord-700 transition-colors animate-in slide-in-from-bottom-2 z-10 border border-white/15"
          >
            <ArrowDown size={12} />
            {unreadCount} New {unreadCount === 1 ? 'Message' : 'Messages'}
          </button>
        )}

        {/* Typing Indicator */}
        {wtTypingUsers && wtTypingUsers.filter(u => u.userId !== userId).length > 0 && (
          <div className="absolute -top-6 left-4 text-[10px] text-white/50 italic animate-pulse font-medium bg-black/40 px-2 rounded-t-md">
            {wtTypingUsers.filter(u => u.userId !== userId).length === 1 
              ? `${wtTypingUsers.filter(u => u.userId !== userId)[0].displayName} is typing...`
              : `${wtTypingUsers.filter(u => u.userId !== userId).map(u => u.displayName).join(', ')} are typing...`}
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 border-t border-white/15 bg-[#111]">
          <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full bg-[#1a1a1a] border border-white/10 text-white text-[13px] rounded-sm py-2.5 pl-4 pr-12 focus:outline-none focus:border-discord-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-1.5 p-1.5 bg-discord-600 text-white rounded-sm hover:bg-discord-700 disabled:opacity-50 disabled:hover:bg-discord-600 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
