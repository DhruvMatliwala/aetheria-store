'use client';

import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Download Official PGSharp APK',
    description:
      'Uninstall the standard Pokémon GO app from the Play Store. Download and install the PGSharp Android APK directly from the official website.',
    actionUrl: 'https://pgsharp.com',
    actionText: 'Download APK',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Launch & Sign In',
    description:
      'Open the PGSharp app on your Android device and log into your Pokémon GO trainer account (Google, Facebook, Pokémon Trainer Club, or Niantic Kids).',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Activate Your 30-Day License',
    description:
      'Tap the on-screen PGSharp floating star/joystick icon → Navigate to Settings → Tap "Activate" → Paste your 30-day Standard License Key exactly as copied.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    step: '04',
    title: 'Unlock Full Global Power',
    description:
      'Teleport anywhere in Tokyo, Zaragoza, or New York, enable 60 FPS mode, utilize the 100% IV radar scanner feed, auto-walk, and instant quick catch.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function ActivationGuide() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      {/* Section Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-cyan-400" />
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-400 font-semibold">
            TRAINER QUICK-START
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-white font-normal tracking-tight">
          4-Step Activation Guide
        </h2>
      </div>

      {/* Stepped Cards List */}
      <div className="space-y-3.5">
        {STEPS.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-neutral-950/80 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              {/* Step Number & Icon */}
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/10 group-hover:border-cyan-500/40 flex flex-col items-center justify-center flex-shrink-0 text-cyan-400 transition-colors shadow-md">
                <div className="group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[9px] font-mono text-neutral-500 font-bold mt-0.5">{item.step}</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-medium text-white font-sans group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed max-w-lg">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Optional Quick Link Button */}
            {item.actionUrl && (
              <a
                href={item.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-stretch sm:self-auto px-4 py-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-400/30 text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                id="pgsharp-download-link"
              >
                <span>{item.actionText}</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Official Download Banner Callout */}
      <div className="mt-6 p-5 rounded-3xl bg-neutral-950/90 border border-cyan-500/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white font-sans">Official APK Installation</h4>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">Always verify downloads are sourced directly from pgsharp.com.</p>
          </div>
        </div>

        <a
          href="https://pgsharp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-cyan-400 hover:text-black font-semibold text-xs font-sans transition-all duration-200 shadow-md active:scale-95 whitespace-nowrap flex items-center gap-1.5"
        >
          <span>Visit pgsharp.com</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
