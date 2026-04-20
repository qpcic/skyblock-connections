"use client";

import React from 'react';

interface GuessedToastProps {
    message: string | null;
}

export default function GuessedToast({ message }: GuessedToastProps) {
    if (!message) return null;

    return (
        <>
            <div style={{
                position: 'fixed',
                bottom: '50%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1a1a1a',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: '999px',
                fontSize: '0.95rem',
                fontWeight: 500,
                zIndex: 9999,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                animation: 'fadeInUp 0.2s ease',
            }}>
                {message}
            </div>
            <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
        </>
    );
}