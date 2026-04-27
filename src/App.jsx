import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import IntroSequence from './components/IntroSequence';
import FloatingAuthTab from './components/FloatingAuthTab';
import FeatureHighlights from './components/FeatureHighlights';
import TopNavbar from './components/TopNavbar';
import AuthAnimationSequence from './components/AuthAnimationSequence';
import Dashboard from './components/dashboard/Dashboard';
import { logoutUser, subscribeToAuthState } from './lib/authService';

function App() {
    // Current visible primary block: INTRO, FEATURES, AUTH, DASHBOARD
    const [appState, setAppState] = useState('INTRO');
    const [authAction, setAuthAction] = useState('signin');
    const [systemState, setSystemState] = useState('idle'); // 'idle', 'animating', 'active'
    const [animationProgress, setAnimationProgress] = useState(0);
    const [showDashboard, setShowDashboard] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const handleStateChange = (newState) => {
        setAppState(newState);
    };

    const handleLogin = () => {
        setSystemState('idle');
    };

    const handleLogout = async () => {
        await logoutUser();
        setCurrentUser(null);
        setAppState('INTRO');
        setSystemState('idle');
        setShowDashboard(false);
        setAnimationProgress(0);
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

    useEffect(() => {
        const unsubscribe = subscribeToAuthState((user) => {
            setCurrentUser(user);
            if (user) {
                setShowDashboard(true);
                setSystemState('active');
                setAppState('DASHBOARD');
            } else {
                setSystemState('idle');
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="relative bg-[#0b1f2a] w-full min-h-screen overflow-hidden">
            {appState !== 'DASHBOARD' && appState !== 'AUTH' && (
                <TopNavbar onOpenAuth={(view) => {
                    setAuthAction(view);
                    setAppState('AUTH');
                }} />
            )}

            {appState === 'AUTH' && systemState === 'idle' && (
                <TopNavbar onOpenAuth={(view) => {
                    setAuthAction(view);
                }} />
            )}

            {/* Intro sequence always runs so background doesn't cut out, unless system is active */}
            {systemState !== 'active' && (
                <IntroSequence appState={appState} onStateChange={handleStateChange} />
            )}

            {/* Cinematic Transition Sequence */}
            <AuthAnimationSequence
                playing={systemState === 'animating'}
                visible={systemState === 'animating' && animationProgress < 0.95}
                onProgress={(p) => {
                    setAnimationProgress(p);
                    if (p > 0.85 && !showDashboard) {
                        setShowDashboard(true);
                    }
                }}
                onComplete={() => {
                    setSystemState('active');
                    setAppState('DASHBOARD');
                }}
            />

            {/* Feature Highlights Overlay */}
            <AnimatePresence>
                {appState === 'FEATURES' && systemState === 'idle' && (
                    <FeatureHighlights />
                )}
            </AnimatePresence>

            {/* Floating Auth Tab Overlay */}
            <AnimatePresence>
                {appState === 'AUTH' && systemState !== 'active' && (
                    <FloatingAuthTab
                        onLogin={handleLogin}
                        initialView={authAction}
                        onClose={() => setAppState('INTRO')}
                        animationProgress={animationProgress}
                    />
                )}
            </AnimatePresence>

            {/* Dashboard State Overlay */}
            <AnimatePresence>
                {showDashboard && (
                    <div className="fixed inset-0 z-40 pointer-events-none flex p-8">
                        {/* Background Video Layer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                            className="absolute inset-0 -z-10 bg-[#0b1f2a] overflow-hidden"
                        >
                            <video
                                src="/Firefly create a seamless looping background video for a premium global logistics dashboard with a m.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-60 blur-sm brightness-90 scale-105"
                                style={{ pointerEvents: 'none' }}
                            />
                            {/* Radial masking gradient softened to reveal more center detail */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b1f2aa0_0%,_#0b1f2a50_30%,_transparent_70%)] pointer-events-none" />
                            {/* Original bottom-up overlay lightened for contrast balance */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020b14]/80 via-[#0b1f2a]/50 to-transparent pointer-events-none" />
                        </motion.div>

                        {/* Render newly orchestrated modular dashboard components */}
                        <Dashboard currentUser={currentUser} onLogout={handleLogout} />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
