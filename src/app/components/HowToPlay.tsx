"use client";

import React, { useState } from 'react';

export default function HowToPlay() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Inline Button meant for the LIVES row */}
            <button
                onClick={() => setIsOpen(true)}
                className="btn-base btn-secondary !py-1 !px-3 text-xs font-bold ml-4"
                title="How to Play"
            >
                How to play?
            </button>

        {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setIsOpen(false)}
                    style={{ zIndex: 100 }}
                >
                    <div
                        className="modal-content text-left max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="modal-title text-2xl mb-4 text-center">How to Play</h2>

                        <div className="opacity-90 text-sm md:text-base mb-6 space-y-2">
                            <div>Find groups of 4 that share a common theme.</div>
                            <div>Press 'Submit' to check your guess.</div>
                            <div>Find all groups without making 4 mistakes!</div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 pb-2">
                            <p className="text-xs font-semibold mb-3 opacity-70 uppercase tracking-wider">Category
                                Examples:</p>
                            <div className="flex items-center gap-2 text-xs">
                                {/* Using the new custom classes */}
                                <span className="text-green-example text-sm">Pets</span>
                                <span className="opacity-40">,</span>
                                <span className="text-purple-example"> Shen Items</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="btn-base btn-primary w-full how-to-play-button-gap"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}