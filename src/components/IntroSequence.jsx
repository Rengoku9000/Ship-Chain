import React, { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const TOTAL_FRAMES_S1 = 300;
const TOTAL_FRAMES_S2 = 150;
const TOTAL_FRAMES = TOTAL_FRAMES_S1 + TOTAL_FRAMES_S2;

const padStr = (num) => String(num).padStart(3, '0');

const getFramePath = (index) => {
    if (index < TOTAL_FRAMES_S1) {
        return `/s1/ezgif-frame-${padStr(index + 1)}.png`;
    } else {
        const s2Index = index - TOTAL_FRAMES_S1;
        return `/s2/ezgif-frame-${padStr(s2Index + 1)}.png`;
    }
};

const IntroSequence = ({ appState, onStateChange }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [loadedCount, setLoadedCount] = useState(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const scrollProgressRef = useRef(0);
    const currentStateRef = useRef(appState);

    useEffect(() => {
        currentStateRef.current = appState;
    }, [appState]);

    const scale = useTransform(scrollYProgress, [0, 0.7], [1, 1.15]);
    const brightness = useTransform(scrollYProgress, [0, 0.7], [1, 0.4]);
    // Text overlay transforms (15% threshold)
    const textOpacity = useTransform(scrollYProgress, [0.1, 0.15, 0.25, 0.3], [0, 1, 1, 0]);
    const textY = useTransform(scrollYProgress, [0.1, 0.3], [20, -40]);

    useEffect(() => {
        let loaded = 0;
        const imgArray = new Array(TOTAL_FRAMES);

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFramePath(i);
            img.onload = () => {
                loaded++;
                setLoadedCount(loaded);
            };
            imgArray[i] = img;
        }
        setImages(imgArray);
    }, []);

    useEffect(() => {
        const unsub = scrollYProgress.on("change", (latest) => {
            scrollProgressRef.current = latest;

            let nextState = 'INTRO';
            if (latest >= 0.6 && latest < 0.85) nextState = 'FEATURES';
            if (latest >= 0.85) nextState = 'AUTH';

            // Prevent reverting from DASHBOARD via scroll
            if (currentStateRef.current === 'DASHBOARD') return;

            if (currentStateRef.current !== nextState) {
                currentStateRef.current = nextState;
                onStateChange(nextState);
            }
        });
        return () => unsub();
    }, [scrollYProgress, onStateChange]);

    useEffect(() => {
        if (images.length === 0 || loadedCount === 0 || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const renderFrame = () => {
            // Keep rendering frame so DASHBOARD has lively background
            //            if (appState === 'DASHBOARD') return;

            if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth;
            if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight;

            const progress = scrollProgressRef.current;
            let frameIndex = Math.floor(progress * TOTAL_FRAMES);
            if (frameIndex >= TOTAL_FRAMES) frameIndex = TOTAL_FRAMES - 1;
            if (frameIndex < 0) frameIndex = 0;

            const img = images[frameIndex];

            if (img && img.complete && img.width > 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const hRatio = canvas.width / img.width;
                const vRatio = canvas.height / img.height;
                const ratio = Math.max(hRatio, vRatio);
                const centerShift_x = (canvas.width - img.width * ratio) / 2;
                const centerShift_y = (canvas.height - img.height * ratio) / 2;

                ctx.drawImage(
                    img,
                    0, 0, img.width, img.height,
                    centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
                );
            }

            animationFrameId = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [images, loadedCount, appState]);

    const percentageLoaded = Math.floor((loadedCount / TOTAL_FRAMES) * 100);

    return (
        <div ref={containerRef} className="relative w-full">

            {/* Fixed Animation Layer */}
            <div className="fixed inset-0 z-0 w-full h-full overflow-hidden flex items-center justify-center bg-black">
                {/* Loading Overlay */}
                {percentageLoaded < 10 && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-cyan-400 font-mono text-sm">
                        Loading Intelligence... {percentageLoaded}%
                    </div>
                )}

                <motion.div
                    style={{
                        scale,
                        filter: useTransform(brightness, b => `brightness(${b}) blur(${appState === 'AUTH' ? '12px' : '0px'})`),
                    }}
                    className="w-full h-full transform-gpu transition-[filter] duration-1000 ease-in-out"
                >
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                    />
                </motion.div>
            </div>

            {/* Fixed UI Layer for text overlay */}
            <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
                <motion.div
                    style={{ opacity: textOpacity, y: textY }}
                    className="text-center px-4"
                >
                    <h2 className="text-3xl md:text-5xl font-light tracking-widest text-[#e0ffff] text-glow uppercase">
                        Decoding supply chain intelligence...
                    </h2>
                </motion.div>
            </div>

            {/* Scroll Spacer creates correct scroll height */}
            <div style={{ height: "300vh" }} />

        </div>
    );
};

export default IntroSequence;
