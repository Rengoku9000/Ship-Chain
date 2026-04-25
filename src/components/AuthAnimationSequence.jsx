import React, { useEffect, useRef, useState } from 'react';

const FPS = 60;
const TOTAL_FRAMES = 180;
const DURATION_MS = 2600; // ~2.6 seconds

// Easing function for smooth progression
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const AuthAnimationSequence = ({ playing, visible, onProgress, onComplete }) => {
    const canvasRef = useRef(null);
    const framesRef = useRef([]);
    const isCompletedRef = useRef(false);
    const [initialDrawLoaded, setInitialDrawLoaded] = useState(false);

    // Progressive preload
    useEffect(() => {
        let loadedCount = 0;

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = `/s3/ezgif-frame-${i.toString().padStart(3, '0')}.png`;
            img.onload = () => {
                loadedCount++;
                if (i === 1) {
                    setInitialDrawLoaded(true);
                }
            };
            framesRef.current.push(img);
        }
    }, []);

    // Draw the very first frame statically so it's ready when faded in
    useEffect(() => {
        if (!playing && initialDrawLoaded && canvasRef.current && framesRef.current[0] && framesRef.current[0].complete) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = framesRef.current[0];

            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;

            if (canvasRatio > imgRatio) {
                drawHeight = canvas.width / imgRatio;
            } else {
                drawWidth = canvas.height * imgRatio;
            }

            const offsetX = (canvas.width - drawWidth) / 2;
            const offsetY = (canvas.height - drawHeight) / 2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
    }, [initialDrawLoaded, playing]);

    useEffect(() => {
        if (!playing) return;

        let startTimestamp = null;
        let animationFrameId;
        const ctx = canvasRef.current.getContext('2d');
        const canvas = canvasRef.current;
        isCompletedRef.current = false;

        const render = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;

            let rawProgress = Math.min(elapsed / DURATION_MS, 1);
            const easedProgress = easeInOutCubic(rawProgress);

            const currentFrameIndex = Math.min(
                Math.floor(easedProgress * TOTAL_FRAMES),
                TOTAL_FRAMES - 1
            );

            if (onProgress) onProgress(easedProgress);

            const img = framesRef.current[currentFrameIndex];

            if (img && img.complete) {
                // Determine scale and drift
                const scale = 1 + (easedProgress * 0.04);
                const driftX = -(canvas.width * 0.015 * easedProgress);
                const driftY = -(canvas.height * 0.01 * easedProgress);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(scale, scale);
                ctx.translate(-canvas.width / 2 + driftX, -canvas.height / 2 + driftY);

                const canvasRatio = canvas.width / canvas.height;
                const imgRatio = img.width / img.height;
                let drawWidth = canvas.width;
                let drawHeight = canvas.height;

                if (canvasRatio > imgRatio) {
                    drawHeight = canvas.width / imgRatio;
                } else {
                    drawWidth = canvas.height * imgRatio;
                }

                const offsetX = (canvas.width - drawWidth) / 2;
                const offsetY = (canvas.height - drawHeight) / 2;

                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                // Crossfade
                const nextImg = framesRef.current[currentFrameIndex + 1];
                if (nextImg && nextImg.complete && currentFrameIndex < TOTAL_FRAMES - 1) {
                    const decimalPart = (easedProgress * TOTAL_FRAMES) % 1;
                    ctx.save();
                    ctx.globalAlpha = decimalPart;
                    ctx.drawImage(nextImg, offsetX, offsetY, drawWidth, drawHeight);
                    ctx.restore();
                }
                ctx.restore();
            }

            if (rawProgress < 1) {
                animationFrameId = requestAnimationFrame(render);
            } else if (!isCompletedRef.current) {
                isCompletedRef.current = true;
                if (onComplete) onComplete();
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => cancelAnimationFrame(animationFrameId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing]);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={`fixed inset-0 z-10 transition-opacity duration-[800ms] ease-out pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <canvas ref={canvasRef} className="w-full h-full object-cover block" />
        </div>
    );
};

export default AuthAnimationSequence;
