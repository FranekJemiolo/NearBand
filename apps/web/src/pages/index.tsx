import React, { useState } from 'react';
import Head from 'next/head';
import { Radio, Mic, ShieldAlert, Wifi, Navigation, Volume2, Download, Zap } from 'lucide-react';
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

  const regenerateHandle = () => {
    setHandle(generatePhoneticHandle());
  };

  const handlePttDown = () => {
    setIsTransmitting(true);
    setCountdown(30);
  };

  const handlePttUp = () => {
    setIsTransmitting(false);
    setCountdown(30);
  };

  return (
    <div className="min-h-screen bg-radio-dark text-gray-100 flex flex-col selection:bg-radio-amber selection:text-black">
      <Head>
        <title>NearBand | Anonymous Location-Based Mobile CB Radio</title>
        <meta
          name="description"
          content="NearBand is a modern, location-based mobile CB radio app. Voice-only, strictly ephemeral, geofenced to a 5-mile radius."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <header className="border-b border-gray-800 bg-[#0d0e12]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-radio-amber/10 border border-radio-amber/30 flex items-center justify-center text-radio-amber">
              <Radio className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-wider uppercase font-mono text-white">
              Near<span className="text-radio-amber">Band</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-mono">
              v1.0.0
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/FranekJemiolo/NearBand/releases"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-mono bg-radio-amber hover:bg-yellow-400 text-black px-4 py-2 rounded font-semibold transition"
            >
              <Download className="w-4 h-4" />
              <span>Get APK / IPA</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-16">
        {/* Intro */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-radio-amber/30 bg-radio-amber/5 text-radio-amber text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Strict 5-Mile Proximity Voice Network</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-mono text-white">
            Analog CB Radio Spirit, <span className="text-radio-amber">Zero Static Accounts.</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed font-sans">
            NearBand connects you strictly to voices within an 8 km (~5-mile) radius across 40 open
            channels. Anonymous phonetic handles reset each session. Overlapping transmissions
            collide naturally.
          </p>
        </section>

        {/* Interactive Radio Simulator */}
        <section className="bg-radio-card border border-gray-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radio-amber/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Tuner screen */}
            <div className="lg:col-span-7 bg-black border border-gray-800 rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-gray-400 uppercase">
                    GPS Geofence: 5.0 MILES ACTIVE
                  </span>
                </div>
                <button
                  onClick={regenerateHandle}
                  className="text-xs font-mono text-radio-amber hover:underline flex items-center space-x-1"
                >
                  <span>Handle: {handle}</span>
                </button>
              </div>

              {/* Big Channel Display */}
              <div className="bg-[#0b0c0e] rounded-lg p-6 border border-gray-800/80 text-center space-y-2">
                <div className="text-xs font-mono text-gray-500 tracking-widest uppercase">
                  ACTIVE CHANNEL
                </div>
                <div className="text-7xl font-mono font-bold text-radio-amber tracking-tighter">
                  CH {channel.toString().padStart(2, '0')}
                </div>
                <div className="text-xs font-mono text-gray-400">
                  {channel === 19 ? 'HIGHWAY & EMERGENCIES' : 'LOCAL OPEN BAND'}
                </div>
              </div>

              {/* Channel Selector */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>CH {CB_MIN_CHANNEL}</span>
                  <span>SELECT CHANNEL</span>
                  <span>CH {CB_MAX_CHANNEL}</span>
                </div>
                <input
                  type="range"
                  min={CB_MIN_CHANNEL}
                  max={CB_MAX_CHANNEL}
                  value={channel}
                  onChange={e => setChannel(Number(e.target.value))}
                  className="w-full accent-radio-amber cursor-pointer"
                />
              </div>

              {/* Status Meter */}
              <div className="flex items-center justify-between text-xs font-mono bg-gray-900/50 p-3 rounded border border-gray-800 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>SQUELCH: LEVEL 2</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>GRID: CELL_37d7_m122</span>
                </div>
              </div>
            </div>

            {/* PTT Trigger & Controls */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                TRANSMITTER SIMULATOR (HOLD TO TALK)
              </div>

              <button
                onMouseDown={handlePttDown}
                onMouseUp={handlePttUp}
                onTouchStart={handlePttDown}
                onTouchEnd={handlePttUp}
                className={`w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-xl select-none ${
                  isTransmitting
                    ? 'bg-red-600/20 border-red-500 shadow-red-500/20 text-red-400 animate-pulse'
                    : 'bg-radio-card hover:bg-[#181920] border-radio-amber/50 text-radio-amber shadow-radio-amber/10'
                }`}
              >
                <Mic
                  className={`w-12 h-12 mb-2 ${isTransmitting ? 'text-red-400' : 'text-radio-amber'}`}
                />
                <span className="font-mono font-bold text-sm tracking-wider">
                  {isTransmitting ? 'TRANSMITTING' : 'PUSH TO TALK'}
                </span>
                {isTransmitting && (
                  <span className="font-mono text-xs text-red-300 mt-1">
                    {countdown}s remaining
                  </span>
                )}
              </button>

              <p className="text-xs text-gray-500 max-w-xs font-mono">
                Hard 30s timeout protects channels from hot mics. Hardware volume buttons on mobile
                trigger native PTT.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-radio-card border border-gray-800 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-lg">5-Mile Spatial Geofence</h3>
            <p className="text-sm text-gray-400">
              Powered by Redis GEO and spatial geohash grids. Only users physically in your 8 km
              radius populate your audio room.
            </p>
          </div>

          <div className="bg-radio-card border border-gray-800 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-radio-amber/10 border border-radio-amber/20 flex items-center justify-center text-radio-amber">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-lg">Overlapping Audio SFU</h3>
            <p className="text-sm text-gray-400">
              Configured with LiveKit to bypass speaker suppression. Multiple speakers collide and
              &quot;step on&quot; each other authentically.
            </p>
          </div>

          <div className="bg-radio-card border border-gray-800 p-6 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-white text-lg">Vote-to-Squelch & Anti-Spoof</h3>
            <p className="text-sm text-gray-400">
              Hardware mock checks, server-side velocity limits, and peer voting locally mute
              disruptive handles in 24h rolling windows.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#09090c] py-8 text-center text-xs font-mono text-gray-500">
        <p>NearBand - Open Source Mobile CB Radio &bull; FranekJemiolo</p>
      </footer>
    </div>
  );
}
