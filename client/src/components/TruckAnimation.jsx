import React, { useEffect, useState } from 'react'

/* Pure CSS truck driving animation — no external deps */
const TruckAnimation = () => {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 2800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className='truck-scene'>
      {/* ── Road track ── */}
      <div className='road'>
        <div className='road-line' />
      </div>

      {/* ── Truck ── */}
      <div className='truck'>
        {/* Cab */}
        <div className='cab'>
          <div className='windshield' />
          <div className='headlight' />
          {/* Beam */}
          <div className='beam' />
        </div>
        {/* Body / cargo */}
        <div className='body'>
          {/* Saree icon on side */}
          <span className='cargo-icon'>🛍️</span>
        </div>
        {/* Wheels */}
        <div className='wheel wheel-front' />
        <div className='wheel wheel-rear' />
      </div>

      {/* ── Success badge fades in after truck passes ── */}
      <div className={`success-badge ${done ? 'visible' : ''}`}>
        <span>🎉</span>
        <span className='badge-text'>Order Placed!</span>
      </div>

      <style>{`
        .truck-scene {
          position: relative;
          width: 100%;
          height: 90px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        /* Road */
        .road {
          position: absolute;
          bottom: 18px;
          left: 0; right: 0;
          height: 22px;
          background: #1e293b;
          border-radius: 100px;
        }
        .road-line {
          position: absolute;
          top: 50%;
          left: 0; right: 0;
          height: 2px;
          transform: translateY(-50%);
          background: repeating-linear-gradient(
            90deg,
            #fff 0px, #fff 18px,
            transparent 18px, transparent 32px
          );
          opacity: 0.3;
          animation: roadScroll 0.4s linear infinite;
        }
        @keyframes roadScroll {
          from { background-position: 0 0; }
          to   { background-position: -50px 0; }
        }

        /* Truck */
        .truck {
          position: absolute;
          bottom: 28px;
          left: -120px;
          width: 110px;
          height: 44px;
          animation: truckDrive 2.4s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes truckDrive {
          0%   { left: -120px; }
          60%  { left: calc(50% - 55px); }
          80%  { left: calc(50% - 55px); }
          100% { left: calc(100% + 20px); }
        }

        /* Cab (front box) */
        .cab {
          position: absolute;
          right: 0;
          bottom: 10px;
          width: 30px;
          height: 30px;
          background: #3b82f6;
          border-radius: 4px 6px 0 0;
        }
        .windshield {
          position: absolute;
          top: 4px; right: 3px;
          width: 14px; height: 12px;
          background: #93c5fd;
          border-radius: 2px;
        }
        .headlight {
          position: absolute;
          bottom: 5px; right: 2px;
          width: 6px; height: 4px;
          background: #fef08a;
          border-radius: 1px;
          box-shadow: 0 0 6px 2px rgba(254,240,138,0.9);
        }

        /* Headlight beam */
        .beam {
          position: absolute;
          bottom: 6px;
          right: -26px;
          width: 24px;
          height: 10px;
          background: linear-gradient(to right, rgba(254,240,138,0.7), transparent);
          clip-path: polygon(0 20%, 100% 0%, 100% 100%, 0 80%);
          animation: beamPulse 0.6s ease-in-out infinite alternate;
        }
        @keyframes beamPulse {
          from { opacity: 0.7; }
          to   { opacity: 1; }
        }

        /* Cargo body */
        .body {
          position: absolute;
          left: 0;
          bottom: 10px;
          width: 76px;
          height: 30px;
          background: #ec4899;
          border-radius: 3px 0 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cargo-icon {
          font-size: 14px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        /* Wheels */
        .wheel {
          position: absolute;
          bottom: 2px;
          width: 14px; height: 14px;
          background: #0f172a;
          border: 2px solid #64748b;
          border-radius: 50%;
          animation: spin 0.4s linear infinite;
        }
        .wheel::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          border: 1.5px solid #94a3b8;
          border-top-color: transparent;
        }
        .wheel-front { right: 4px; }
        .wheel-rear  { left: 10px; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Success badge */
        .success-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.6);
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white;
          padding: 8px 20px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 15px;
          opacity: 0;
          transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1);
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(236,72,153,0.35);
        }
        .success-badge.visible {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        .badge-text {
          font-size: 14px;
          letter-spacing: 0.3px;
        }
      `}</style>
    </div>
  )
}

export default TruckAnimation
