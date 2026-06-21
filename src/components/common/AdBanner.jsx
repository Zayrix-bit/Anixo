import React, { useEffect, useRef } from 'react';

export function AdBanner728x90() {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    const container = containerRef.current;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = '728px';
    iframe.style.height = '90px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    container.appendChild(iframe);

    const hostname = window.location.hostname;
    const isBuzz = hostname.includes('anixo.buzz');
    const adKey = isBuzz ? '9a7c3e1f939b5adb39ff408aaf45db1e' : '41feeb0d0418514f2c25b35780bc88ed';
    const adDomain = isBuzz ? 'dependedunmoved.com' : 'www.highperformanceformat.com';

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head>
      <body>
        <script>
          atOptions = {
            'key' : '${adKey}',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script src="https://${adDomain}/${adKey}/invoke.js"></script>
      </body></html>
    `);
    iframeDoc.close();

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-3 overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}

export function AdBanner300x250() {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    const container = containerRef.current;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = '300px';
    iframe.style.height = '250px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    container.appendChild(iframe);

    const hostname = window.location.hostname;
    const isBuzz = hostname.includes('anixo.buzz');
    const adKey = isBuzz ? '2e3ec9b3c3b6d88d98ef03a219c31831' : '2e3d69816973ce46100c1352a0a696f7';
    const adDomain = isBuzz ? 'dependedunmoved.com' : 'www.highperformanceformat.com';

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head>
      <body>
        <script>
          atOptions = {
            'key' : '${adKey}',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script src="https://${adDomain}/${adKey}/invoke.js"></script>
      </body></html>
    `);
    iframeDoc.close();

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-3 overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}

export function AdNativeBanner() {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

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

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-4 my-2 px-2 overflow-hidden bg-[#0d0d0d]/30 border-y border-white/5">
      <div ref={containerRef} className="w-full max-w-[1400px] overflow-x-auto" />
    </div>
  );
}
