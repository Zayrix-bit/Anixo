import React, { useState, useEffect } from 'react';
import { X, Send, Mail } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    subject: 'Report a Bug / Broken Link',
    message: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock API call simulation
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', email: '', subject: 'Report a Bug / Broken Link', message: '' });
        onClose();
      }, 3000);
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const subjects = [
    "Report a Bug / Broken Link",
    "Request an Anime",
    "DMCA / Copyright Takedown",
    "Business / Advertising",
    "General Inquiry"
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#0b0d12] border border-white/10 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-discord-600/10 flex items-center justify-center text-discord-500">
              <Mail size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white/90">Contact Us</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
              <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                <Send size={24} className="translate-x-0.5" />
              </div>
              <h3 className="text-xl font-semibold text-white/90 mb-2">Message Sent</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">
                Thank you for reaching out. We will review your message and get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#161a23] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-discord-500/50 transition-shadow"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#161a23] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-discord-500/50 transition-shadow"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Subject
                </label>
                <div className="relative">
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-[#161a23] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:ring-1 focus:ring-discord-500/50 transition-shadow appearance-none cursor-pointer"
                  >
                    {subjects.map(sub => (
                      <option key={sub} value={sub} className="bg-[#0b0d12] text-white">
                        {sub}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full bg-[#161a23] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-discord-500/50 transition-shadow resize-none"
                  placeholder={
                    formData.subject.includes("Bug") 
                      ? "Please include details like the anime name, episode, or URL..." 
                      : formData.subject.includes("Request")
                      ? "Which anime are you looking for?"
                      : "How can we help?"
                  }
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-discord-600 hover:bg-discord-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
