import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import {
  Radio,
  Mic,
  ShieldAlert,
  Navigation,
  Volume2,
  Download,
  Zap,
  RefreshCw,
  Smartphone,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import {
  generatePhoneticHandle,
  CB_MIN_CHANNEL,
  CB_MAX_CHANNEL,
  DEFAULT_CHANNEL,
} from '@nearband/shared';

export default function Home() {
  const [handle, setHandle] = useState('Rusty Falcon');
  const [channel, setChannel] = useState(DEFAULT_CHANNEL);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [pttMode, setPttMode] = useState<'hold' | 'tap'>('hold');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTransmitting) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsTransmitting(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(30);
    }
    return () => clearInterval(timer);
  }, [isTransmitting]);

  const regenerateHandle = () => {
    setHandle(generatePhoneticHandle());
  };

  const handlePttDown = () => {
    if (pttMode === 'hold') {
      setIsTransmitting(true);
    }
  };

  const handlePttUp = () => {
    if (pttMode === 'hold') {
      setIsTransmitting(false);
    }
  };

  const handlePttClick = () => {
    if (pttMode === 'tap') {
      setIsTransmitting(!isTransmitting);
    }
  };

  return (
    <div className="min-h-screen bg-radio-dark text-gray-100 flex flex-col selection:bg-radio-amber selection:text-black">
      <Head>
        <title>NearBand | Location-Based Mobile CB Radio</title>
        <meta
          name="description"
          content="NearBand is a modern, location-based mobile CB radio app. Voice-only, strictly ephemeral, geofenced to a 5-mile radius."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation Header */}
      <header className="border-b border-gray-800/80 bg-[#0c0d12]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-radio-amber/40 shadow-lg shadow-radio-amber/10">
              <Image
                src="/icon.png"
                alt="NearBand Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-wider font-mono text-white">
                NEAR<span className="text-radio-amber">BAND</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                v1.0.0
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/FranekJemiolo/NearBand"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-gray-400 hover:text-white transition flex items-center space-x-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com/FranekJemiolo/NearBand/releases"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-mono bg-radio-amber hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-radio-amber/20"
            >
              <Download className="w-4 h-4" />
              <span>Get App</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-20">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-radio-amber/30 bg-radio-amber/5 text-radio-amber text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Strict 5-Mile (8 km) Proximity CB Radio</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight font-mono text-white leading-tight">
            Analog Radio Spirit. <br />
            <span className="text-radio-amber">Zero Static Accounts.</span>
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed font-sans max-w-2xl mx-auto">
            NearBand connects you strictly to human voices within an 8 km radius across 40 open
            channels. Anonymous phonetic callsigns reset on app launch. Audio transmissions collide
            and overlap naturally.
          </p>

          {/* Release Download Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="https://github.com/FranekJemiolo/NearBand/releases/tag/v1.0.0"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-3 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 px-5 py-3 rounded-xl transition group"
            >
              <Smartphone className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] font-mono text-gray-400 uppercase">
                  Download For Android
                </div>
                <div className="text-xs font-mono font-bold text-white">APK / AAB (v1.0.0)</div>
              </div>
            </a>

            <a
              href="https://github.com/FranekJemiolo/NearBand/releases/tag/v1.0.0"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-3 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 px-5 py-3 rounded-xl transition group"
            >
              <Smartphone className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] font-mono text-gray-400 uppercase">
                  Download For iOS
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  Ad-Hoc / TestFlight .IPA
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* Live Interactive Tuner & Simulator */}
        <section className="bg-radio-card border border-gray-800/90 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-radio-amber/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Tuner screen */}
            <div className="lg:col-span-7 bg-black border border-gray-800 rounded-xl p-6 space-y-6 shadow-inner">
              <div className="flex justify-between items-center border-b border-gray-800/80 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-gray-400 uppercase">
                    Spatial Geofence: 5.0 MILES ACTIVE
                  </span>
                </div>
                <button
                  onClick={regenerateHandle}
                  className="text-xs font-mono text-radio-amber hover:text-yellow-400 flex items-center space-x-1.5 transition"
                  title="Click to randomize ephemeral handle"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Callsign: {handle}</span>
                </button>
              </div>

              {/* Big Channel Display */}
              <div className="bg-[#0c0d12] rounded-lg p-6 border border-gray-800/90 text-center space-y-2">
                <div className="text-[11px] font-mono text-gray-500 tracking-widest uppercase">
                  ACTIVE FREQUENCY
                </div>
                <div className="text-7xl font-mono font-bold text-radio-amber tracking-tighter">
                  CH {channel.toString().padStart(2, '0')}
                </div>
                <div className="text-xs font-mono text-gray-400">
                  {channel === 19 ? 'HIGHWAY & EMERGENCIES' : 'LOCAL OPEN BAND'}
                </div>
              </div>

              {/* Channel Selector Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>CH {CB_MIN_CHANNEL}</span>
                  <span className="text-gray-500 font-bold">40-CHANNEL TUNER</span>
                  <span>CH {CB_MAX_CHANNEL}</span>
                </div>
                <input
                  type="range"
                  min={CB_MIN_CHANNEL}
                  max={CB_MAX_CHANNEL}
                  value={channel}
                  onChange={e => setChannel(Number(e.target.value))}
                  className="w-full accent-radio-amber cursor-pointer h-2 bg-gray-800 rounded-lg"
                />
              </div>

              {/* Status Meter */}
              <div className="flex items-center justify-between text-xs font-mono bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>SQUELCH: AUTO</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>GRID: CELL_37d7_m122</span>
                </div>
              </div>
            </div>

            {/* PTT Trigger & Controls */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-gray-400 uppercase">MODE:</span>
                <button
                  onClick={() => setPttMode(pttMode === 'hold' ? 'tap' : 'hold')}
                  className="text-xs font-mono bg-gray-800 border border-gray-700 px-3 py-1 rounded font-bold text-radio-amber hover:bg-gray-700 transition"
                >
                  {pttMode.toUpperCase()} TO TALK
                </button>
              </div>

              <button
                onMouseDown={handlePttDown}
                onMouseUp={handlePttUp}
                onTouchStart={handlePttDown}
                onTouchEnd={handlePttUp}
                onClick={handlePttClick}
                className={`w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-xl select-none ${
                  isTransmitting
                    ? 'bg-red-600/20 border-red-500 shadow-red-500/30 text-red-400 animate-pulse'
                    : 'bg-radio-card hover:bg-[#181a24] border-radio-amber/50 text-radio-amber shadow-radio-amber/10'
                }`}
              >
                <Mic
                  className={`w-12 h-12 mb-2 ${isTransmitting ? 'text-red-400' : 'text-radio-amber'}`}
                />
                <span className="font-mono font-bold text-sm tracking-wider">
                  {isTransmitting ? 'TRANSMITTING' : 'PUSH TO TALK'}
                </span>
                {isTransmitting && (
                  <span className="font-mono text-xs text-red-300 mt-1">{countdown}s limit</span>
                )}
              </button>

              <p className="text-xs text-gray-400 max-w-xs font-mono">
                Strict 30s broadcast limit prevents hot mics. Hardware volume buttons on your phone
                trigger PTT natively.
              </p>
            </div>
          </div>
        </section>

        {/* High-Resolution Mobile Mockup Screenshots */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              Tactile High-Contrast Interface
            </h2>
            <p className="text-sm text-gray-400 font-sans">
              Built for speed and eyes-free operation. Night mode defaults with vivid neon
              indicators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-radio-card border border-gray-800 rounded-2xl p-4 space-y-3 flex flex-col items-center">
              <div className="rounded-xl overflow-hidden border border-gray-800 shadow-2xl max-w-[280px]">
                <Image
                  src="/screenshots/tuner.jpg"
                  alt="NearBand Tuner Interface Mockup"
                  width={360}
                  height={640}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="font-mono font-bold text-white text-sm">Minimalist Channel Tuner</h3>
                <p className="text-xs text-gray-400">
                  CH 1-40 with large touch targets and hold PTT
                </p>
              </div>
            </div>

            <div className="bg-radio-card border border-gray-800 rounded-2xl p-4 space-y-3 flex flex-col items-center">
              <div className="rounded-xl overflow-hidden border border-gray-800 shadow-2xl max-w-[280px]">
                <Image
                  src="/screenshots/transmitting.jpg"
                  alt="NearBand Active Broadcasting Mockup"
                  width={360}
                  height={640}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="font-mono font-bold text-white text-sm">
                  Active Voice Transmission
                </h3>
                <p className="text-xs text-gray-400">
                  Pulsing red transmitter state with 30s countdown
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-radio-card border border-gray-800 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-lg">1. Pure Proximity</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Tied strictly to physical geography (~5-mile / 8 km radius). When you travel, you
              seamlessly transition between spatial grids. No global chatrooms.
            </p>
          </div>

          <div className="bg-radio-card border border-gray-800 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-radio-amber/10 border border-radio-amber/20 flex items-center justify-center text-radio-amber">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-lg">2. 40 Open Channels</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Channel 19 for highways & emergencies, 1-40 for local conversation. Empty channels
              remain completely silent with zero ambient synthetic noise.
            </p>
          </div>

          <div className="bg-radio-card border border-gray-800 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-lg">3. True Ephemerality</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              No logins, accounts, phone numbers, or metadata saved. On session close, your callsign
              evaporates forever.
            </p>
          </div>
        </section>

        {/* Architectural Specs Summary */}
        <section className="bg-black border border-gray-800 rounded-2xl p-8 space-y-6">
          <h2 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Under The Hood</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono text-gray-400">
            <div className="border border-gray-800/80 p-4 rounded-lg space-y-2">
              <span className="text-radio-amber font-bold uppercase">
                WebRTC LiveKit Unmanaged Mixing
              </span>
              <p className="text-gray-300">
                Bypasses speaker suppression to simulate true analog frequency collision where
                multiple voices step on each other.
              </p>
            </div>

            <div className="border border-gray-800/80 p-4 rounded-lg space-y-2">
              <span className="text-emerald-400 font-bold uppercase">
                Background Execution & Hardware PTT
              </span>
              <p className="text-gray-300">
                Hardware volume buttons trigger PTT directly from the pocket. iOS UIBackgroundModes
                and Android Foreground Services keep audio alive when minimized.
              </p>
            </div>

            <div className="border border-gray-800/80 p-4 rounded-lg space-y-2">
              <span className="text-cyan-400 font-bold uppercase">Client-Side VAD Noise Gate</span>
              <p className="text-gray-300">
                Local audio power analysis pauses outgoing RTP transmission after 2 seconds of
                silence, resuming instantly when speech is detected.
              </p>
            </div>

            <div className="border border-gray-800/80 p-4 rounded-lg space-y-2">
              <span className="text-red-400 font-bold uppercase">
                Anti-Spoofing & Vote-to-Squelch
              </span>
              <p className="text-gray-300">
                Rejects mock provider reports and velocity jumps exceeding 250 m/s. Peer voting
                mutes disruptive callsigns within a 24-hour rolling ledger.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#09090c] py-8 text-center text-xs font-mono text-gray-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>NearBand &bull; Open Source Mobile CB Radio</p>
          <p>&copy; 2026 Franek Jemiolo &bull; MIT Licensed</p>
        </div>
      </footer>
    </div>
  );
}
