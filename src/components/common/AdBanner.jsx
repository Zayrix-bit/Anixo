import React, { useEffect, useRef } from 'react';

export function AdBanner728x90() {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.text = `
      atOptions = {
        'key' : '41feeb0d0418514f2c25b35780bc88ed',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;

    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = 'https://www.highperformanceformat.com/41feeb0d0418514f2c25b35780bc88ed/invoke.js';

    containerRef.current.appendChild(script1);
    containerRef.current.appendChild(script2);

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-3 overflow-hidden">
      <div ref={containerRef} className="max-w-[728px]" />
    </div>
  );
}

export function AdBanner300x250() {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    const script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.text = `
      atOptions = {
        'key' : '2e3d69816973ce46100c1352a0a696f7',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    const script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.src = 'https://www.highperformanceformat.com/2e3d69816973ce46100c1352a0a696f7/invoke.js';

    containerRef.current.appendChild(script1);
    containerRef.current.appendChild(script2);

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full flex justify-center py-3 overflow-hidden">
      <div ref={containerRef} className="max-w-[300px]" />
    </div>
  );
}
