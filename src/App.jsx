import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import IntroSequence from './components/IntroSequence';
import FloatingAuthTab from './components/FloatingAuthTab';
import FeatureHighlights from './components/FeatureHighlights';

function App() {
    const [appState, setAppState] = useState('INTRO'); // INTRO, FEATURES, AUTH, DASHBOARD

    const handleStateChange = (newState) => {
        setAppState(newState);
    };

    const handleLogin = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setAppState('DASHBOARD');
    };

    // Timer transition from FEATURES to AUTH
    useEffect(() => {
        let timer;
        if (appState === 'FEATURES') {
            timer = setTimeout(() => {
                setAppState(prev => prev === 'FEATURES' ? 'AUTH' : prev);
            }, 3500);
        }
        return () => clearTimeout(timer);
    }, [appState]);

    return (
        <div className="relative bg-black w-full">
            {/* Intro sequence handles its own fixed positioning and scrolling logic */}
            {appState !== 'DASHBOARD' && (
                <IntroSequence appState={appState} onStateChange={handleStateChange} />
            )}

            {/* Feature Highlights Overlay */}
            <AnimatePresence>
                {appState === 'FEATURES' && (
                    <FeatureHighlights />
                )}
            </AnimatePresence>

            {/* Floating Auth Tab Overlay */}
            <AnimatePresence>
                {appState === 'AUTH' && (
                    <FloatingAuthTab onLogin={handleLogin} />
                )}
            </AnimatePresence>

            {/* Dashboard State */}
            {appState === 'DASHBOARD' && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-8">
                    <h1 className="text-4xl md:text-6xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-4">
                        ChainGuard AI+ Dashboard
                    </h1>
                    <p className="text-gray-400 max-w-xl text-center text-lg font-light leading-relaxed">
                        Welcome to the intelligent supply chain system.
                    </p>
                </div>
            )}
        </div>
    );
}

export default App;
