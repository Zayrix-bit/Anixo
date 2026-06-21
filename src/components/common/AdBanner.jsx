import React, { useEffect, useRef } from 'react';

export function AdBanner728x90() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.hasChildNodes()) return;

    const hostname = window.location.hostname;
    const isBuzz = hostname.includes('anixo.buzz');
    const adKey = isBuzz ? '9a7c3e1f939b5adb39ff408aaf45db1e' : '41feeb0d0418514f2c25b35780bc88ed';
    const adDomain = isBuzz ? 'dependedunmoved.com' : 'www.highperformanceformat.com';

    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.innerHTML = `atOptions = {
      'key' : '${adKey}',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };`;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://${adDomain}/${adKey}/invoke.js`;

    containerRef.current.appendChild(conf);
    containerRef.current.appendChild(script);

  }, []);

  return (
    <div className="w-full flex justify-center py-3 overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}

export function AdBanner300x250() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.hasChildNodes()) return;

    const hostname = window.location.hostname;
    const isBuzz = hostname.includes('anixo.buzz');
    const adKey = isBuzz ? '2e3ec9b3c3b6d88d98ef03a219c31831' : '2e3d69816973ce46100c1352a0a696f7';
    const adDomain = isBuzz ? 'dependedunmoved.com' : 'www.highperformanceformat.com';

    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.innerHTML = `atOptions = {
      'key' : '${adKey}',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };`;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://${adDomain}/${adKey}/invoke.js`;

    containerRef.current.appendChild(conf);
    containerRef.current.appendChild(script);

  }, []);

  return (
    <div className="w-full flex justify-center py-3 overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}

export function AdNativeBanner() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.hasChildNodes()) return;

    const containerId = "container-640fe83b0b8dad53cd77f5258e0536a1";

    // Prevent double injection
    if (document.getElementById(containerId)) return;

    // Create container div
    const div = document.createElement('div');
    div.id = containerId;
    containerRef.current.appendChild(div);

    // Only load Native Banner on anixo.online (No tag for anixo.buzz yet)
    if (window.location.hostname.includes('anixo.buzz')) return;

    // Create script
    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = "false";
    script.src = "//pl29825672.effectivecpmnetwork.com/640fe83b0b8dad53cd77f5258e0536a1/invoke.js";
    containerRef.current.appendChild(script);

  }, []);

  return (
    <div className="w-full flex justify-center py-4 my-2 px-2 overflow-hidden bg-[#0d0d0d]/30 border-y border-white/5">
      <div ref={containerRef} className="w-full max-w-[1400px] overflow-x-auto" />
    </div>
  );
}
