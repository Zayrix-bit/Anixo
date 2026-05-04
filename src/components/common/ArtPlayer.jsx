import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

const ArtPlayer = ({ src, type, poster, subtitles = [], onEnded, onTimeUpdate, onReady, initialTime = 0, className, autoSkip, skipTimes, videoQuality = 'best', onQualityChange, availableQualities = [] }) => {
    const artRef = useRef(null);
    const artInstance = useRef(null);

    useEffect(() => {
        if (!src) return;

        const isHls = type === 'hls' || src.includes('.m3u8');

        // Build quality options from actual available qualities
        const customSettings = [];
        const numericQualities = availableQualities.filter(q => /^\d+/.test(q));

        if (!isHls && onQualityChange) {
            let qualityOptions;

            if (numericQualities.length > 0) {
                // Sort descending (1080 → 720 → 480 → 360)
                numericQualities.sort((a, b) => parseInt(b) - parseInt(a));
                qualityOptions = [
                    { html: 'Auto', value: 'best', default: videoQuality === 'best' },
                    ...numericQualities.map(q => ({
                        html: `${q}p`,
                        value: q,
                        default: videoQuality === q,
                    }))
                ];
            } else {
                // No numeric qualities available — show standard options as fallback
                qualityOptions = [
                    { html: 'Auto', value: 'best', default: videoQuality === 'best' },
                    { html: '1080p', value: '1080', default: videoQuality === '1080' },
                    { html: '720p', value: '720', default: videoQuality === '720' },
                    { html: '480p', value: '480', default: videoQuality === '480' },
                    { html: '360p', value: '360', default: videoQuality === '360' },
                ];
            }

            const currentLabel = videoQuality === 'best' ? 'Auto' : `${videoQuality}p`;

            customSettings.push({
                name: 'quality',
                width: 150,
                html: 'Quality',
                tooltip: currentLabel,
                selector: qualityOptions,
                onSelect: function (item) {
                    if (onQualityChange) onQualityChange(item.value);
                    return item.html;
                },
            });
        }

        // Setup Audio Context for Volume Boost
        let audioCtx = null;
        let gainNode = null;
        let sourceNode = null;

        const setupAudioBoost = (videoElement) => {
            if (audioCtx) return;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                sourceNode = audioCtx.createMediaElementSource(videoElement);
                gainNode = audioCtx.createGain();
                
                sourceNode.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                // Default to Ultra (4.0)
                gainNode.gain.value = 4.0;
            } catch (err) {
                console.error("Audio Boost not supported or failed:", err);
            }
        };

        // Always show Subtitle Toggle (Handles both external and embedded HLS subtitles)
        customSettings.push({
            name: 'subtitleToggle',
            width: 150,
            html: 'Subtitles',
            tooltip: 'On',
            selector: [
                { html: 'On', value: 'on', default: true },
                { html: 'Off', value: 'off' },
            ],
            onSelect: function (item) {
                const player = artInstance.current;
                if (!player) return item.html;
                
                const show = item.value === 'on';
                
                // 1. Toggle Artplayer's custom subtitle plugin
                if (player.subtitle) {
                    player.subtitle.show = show;
                }
                
                // 2. Force disable/enable native HTML5 text tracks
                if (player.video && player.video.textTracks) {
                    for (let i = 0; i < player.video.textTracks.length; i++) {
                        // 'disabled' strictly prevents rendering, 'hidden' might still render in some browsers/hls setups
                        player.video.textTracks[i].mode = show ? 'showing' : 'disabled';
                    }
                }

                // 3. Force disable HLS.js specific subtitle tracks
                if (player.hls) {
                    if (!show) {
                        player.hls.subtitleTrack = -1; // -1 means disable
                        player.hls.subtitleDisplay = false;
                    } else {
                        player.hls.subtitleDisplay = true;
                        // Try to re-enable the first available subtitle track
                        if (player.hls.subtitleTracks && player.hls.subtitleTracks.length > 0) {
                            player.hls.subtitleTrack = 0;
                        }
                    }
                }
                
                player.setting.update({ name: 'subtitleToggle', tooltip: item.html });
                return item.html;
            },
        });

        customSettings.push({
            name: 'audioBoost',
            width: 200,
            html: 'Audio Boost',
            tooltip: 'Ultra (400%)',
            selector: [
                { html: 'Normal (100%)', value: 1.0 },
                { html: 'Boost (150%)', value: 1.5 },
                { html: 'Loud (200%)', value: 2.0 },
                { html: 'Max (300%)', value: 3.0 },
                { html: 'Ultra (400%)', value: 4.0, default: true },
            ],
            onSelect: function (item) {
                const player = artInstance.current;
                if (!player) return item.html;
                
                if (!audioCtx) {
                    setupAudioBoost(player.video);
                }
                
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }

                if (gainNode) {
                    gainNode.gain.value = item.value;
                    player.setting.update({ name: 'audioBoost', tooltip: item.html });
                }
                
                return item.html;
            },
        });

        const art = new Artplayer({
            container: artRef.current,
            url: src,
            poster: poster,
            type: isHls ? 'm3u8' : 'mp4',
            volume: 1.0,
            isLive: false,
            muted: false,
            autoplay: false,
            autoPlayback: false,
            pip: true,
            autoSize: true,
            screenshot: true,
            setting: true,
            settings: customSettings,
            loop: false,
            flip: true,
            playbackRate: true,
            aspectRatio: true,
            fullscreen: true,
            fullscreenWeb: true,
            subtitleOffset: true,
            mutex: true,
            backdrop: true,
            playsInline: true,
            airplay: true,
            theme: '#ff0000',
            layers: [
                {
                    name: 'mutedIndicator',
                    html: `
                        <div class="flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm px-5 py-3 rounded-xl hover:bg-black/70 transition-colors pointer-events-auto cursor-pointer border border-white/10 shadow-lg">
                            <svg class="w-8 h-8 text-white/90 mb-1 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                            <span class="text-white/90 font-bold tracking-widest uppercase text-[11px] drop-shadow-md">Tap to Unmute</span>
                        </div>
                    `,
                    style: {
                        position: 'absolute',
                        top: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'none',
                        zIndex: 99,
                    },
                    click: function () {
                        if (artInstance.current) {
                            artInstance.current.muted = false;
                            if (artInstance.current.volume === 0) artInstance.current.volume = 1;
                        }
                    }
                },
            ],
            controls: [
                {
                    position: 'right',
                    html: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
                    tooltip: 'Download',
                    click: function () {
                        const downloadUrl = src.includes('#')
                            ? src.replace('#', '&download=1#')
                            : `${src}&download=1`;
                        window.open(downloadUrl, '_blank');
                    },
                },
            ],
            moreVideoAttr: {
                crossOrigin: 'anonymous',
            },
            customType: {
                m3u8: function (video, url, art) {
                    if (Hls.isSupported()) {
                        if (art.hls) art.hls.destroy();
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        art.hls = hls;
                        
                        hls.on(Hls.Events.MANIFEST_PARSED, function () {
                            const levels = hls.levels;
                            if (levels && levels.length > 0) {
                                const quality = levels.map((item, index) => ({
                                    html: item.height ? `${item.height}p` : 'Auto',
                                    url: url,
                                    level: index,
                                    default: index === 0,
                                }));
                                
                                // Add Auto option
                                quality.unshift({
                                    html: 'Auto',
                                    url: url,
                                    level: -1,
                                    default: true,
                                });

                                art.setting.update({
                                    name: 'quality',
                                    width: 150,
                                    html: 'Quality',
                                    tooltip: 'Auto',
                                    selector: quality,
                                    onSelect: function (item) {
                                        art.hls.currentLevel = item.level;
                                        art.setting.update({ name: 'quality', tooltip: item.html });
                                        return item.html;
                                    },
                                });
                            }
                        });
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    }
                },
            },
            subtitle: {
                url: subtitles[0]?.url || '',
                type: 'vtt',
                style: {
                    color: '#fff',
                    fontSize: '20px',
                },
                encoding: 'utf-8',
            },
        });

        artInstance.current = art;

        const updateMutedIndicator = () => {
            const isMuted = art.muted || art.volume === 0;
            if (art.layers.mutedIndicator) {
                art.layers.mutedIndicator.style.display = isMuted ? 'block' : 'none';
            }
        };

        art.on('ready', updateMutedIndicator);
        art.on('video:volumechange', updateMutedIndicator);

        // Automatically apply Ultra Boost when video plays
        art.on('play', () => {
            if (!audioCtx) {
                setupAudioBoost(art.video);
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        });

        art.on('video:ended', () => {
            if (onEnded) onEnded();
            window.postMessage({ event: "complete", type: "ended" }, "*");
        });

        art.on('video:timeupdate', () => {
            const currentTime = art.video.currentTime;
            const duration = art.video.duration;

            // --- Auto Skip Logic (OP/ED) ---
            if (autoSkip && skipTimes) {
                // Check OP
                if (skipTimes.op && currentTime >= skipTimes.op[0] && currentTime < skipTimes.op[1]) {
                    console.info(`[ArtPlayer] Auto-skipping OP: ${skipTimes.op[0]}s -> ${skipTimes.op[1]}s`);
                    art.currentTime = skipTimes.op[1];
                }
                // Check ED
                if (skipTimes.ed && currentTime >= skipTimes.ed[0] && currentTime < skipTimes.ed[1]) {
                    console.info(`[ArtPlayer] Auto-skipping ED: ${skipTimes.ed[0]}s -> ${skipTimes.ed[1]}s`);
                    art.currentTime = skipTimes.ed[1];
                }
            }

            if (onTimeUpdate) onTimeUpdate(currentTime, duration);
            window.postMessage({ event: "timeupdate", currentTime, duration }, "*");
        });

        art.on('ready', () => {
            if (onReady) onReady();
            if (initialTime > 0) {
                art.currentTime = initialTime;
            }

            // Smart Autoplay: Try to play with sound, fallback to muted if blocked
            art.play().catch(() => {
                console.info('[ArtPlayer] Autoplay with sound blocked, falling back to muted.');
                art.muted = true;
                art.play();
            });
        });

        const handleMessage = (e) => {
            if (e.data?.event === "skip") {
                const amount = e.data.amount || 0;
                art.currentTime = Math.max(0, Math.min(art.video.duration, art.currentTime + amount));
            }
        };
        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
            if (art) {
                try {
                    // Clean up HLS instance if it exists
                    if (art.hls) {
                        art.hls.destroy();
                        art.hls = null;
                    }
                    art.destroy();
                } catch (err) {
                    console.warn("ArtPlayer destroy error:", err);
                }
            }
        };
    }, [src, poster, type, initialTime, autoSkip, skipTimes, videoQuality]);

    return <div ref={artRef} className={className} style={{ width: '100%', height: '100%' }}></div>;
};

export default ArtPlayer;
