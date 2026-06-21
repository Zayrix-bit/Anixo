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

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head>
      <body>
        <script>
          atOptions = {
            'key' : '41feeb0d0418514f2c25b35780bc88ed',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script src="https://www.highperformanceformat.com/41feeb0d0418514f2c25b35780bc88ed/invoke.js"></script>
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

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head>
      <body>
        <script>
          atOptions = {
            'key' : '2e3d69816973ce46100c1352a0a696f7',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script src="https://www.highperformanceformat.com/2e3d69816973ce46100c1352a0a696f7/invoke.js"></script>
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
