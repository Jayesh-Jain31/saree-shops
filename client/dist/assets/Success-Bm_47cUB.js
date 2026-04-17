import{j as e,p as D,W as z,a8 as S,a9 as C,y as P,D as n,aa as T,l as E}from"./index-DPttoM1y.js";import{r as u,c as I,L as f}from"./react-vendor-CyCy6wxS.js";import"./redux-vendor-CsaMfXa5.js";import"./axios-vendor-DsPaXkF5.js";import"./ui-vendor-B4i_83wd.js";const L=()=>{const[c,o]=u.useState(!1);return u.useEffect(()=>{const a=setTimeout(()=>o(!0),2800);return()=>clearTimeout(a)},[]),e.jsxs("div",{className:"truck-scene",children:[e.jsx("div",{className:"road",children:e.jsx("div",{className:"road-line"})}),e.jsxs("div",{className:"truck",children:[e.jsxs("div",{className:"cab",children:[e.jsx("div",{className:"windshield"}),e.jsx("div",{className:"headlight"}),e.jsx("div",{className:"beam"})]}),e.jsx("div",{className:"body",children:e.jsx("span",{className:"cargo-icon",children:"🛍️"})}),e.jsx("div",{className:"wheel wheel-front"}),e.jsx("div",{className:"wheel wheel-rear"})]}),e.jsxs("div",{className:`success-badge ${c?"visible":""}`,children:[e.jsx("span",{children:"🎉"}),e.jsx("span",{className:"badge-text",children:"Order Placed!"})]}),e.jsx("style",{children:`
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
      `})]})},Y=()=>{const o=I().state||{},{address:a,items:r,totalAmount:x,deliveryCharge:i=0,paymentMethod:l="COD",estimatedDelivery:m,orderDate:d}=o,j=a&&r&&r.length>0,y=s=>s?new Date(s).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"",N=s=>s?new Date(s).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"",v=()=>{if(m)return m;const s=new Date;return s.setDate(s.getDate()+5),`By ${s.toLocaleDateString("en-IN",{day:"numeric",month:"long"})}`};return e.jsx("div",{className:"min-h-screen bg-gray-50 py-8 px-4",children:e.jsxs("div",{className:"max-w-lg mx-auto",children:[e.jsxs("div",{className:"text-center mb-6",children:[e.jsx(L,{}),e.jsx("h1",{className:"text-2xl font-bold text-gray-800 mb-1 mt-2",children:"Order Placed!"}),e.jsx("p",{className:"text-gray-500 text-sm",children:"Thank you! Your order has been confirmed."}),d&&e.jsxs("p",{className:"text-xs text-gray-400 mt-1",children:[y(d)," at ",N(d)]})]}),j?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"bg-white rounded-2xl border shadow-sm p-4 mb-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(D,{className:"text-green-500",size:16}),e.jsx("h2",{className:"font-bold text-sm text-gray-800",children:"Delivery Information"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(z,{className:"text-gray-400 mt-0.5 flex-shrink-0",size:12}),e.jsxs("div",{className:"text-xs text-gray-600",children:[e.jsxs("p",{className:"font-semibold text-gray-700 mb-0.5",children:[a.name," · ",a.mobile]}),e.jsx("p",{children:a.address_line}),e.jsxs("p",{children:[a.city,", ",a.state," - ",a.pincode]}),e.jsx("p",{children:a.country})]})]}),e.jsxs("div",{className:"flex items-center gap-2 pt-2 border-t",children:[e.jsx(S,{className:"text-green-500",size:14}),e.jsxs("p",{className:"text-xs text-green-700 font-semibold",children:["Estimated Delivery: ",v()]})]})]})]}),e.jsxs("div",{className:"bg-white rounded-2xl border shadow-sm p-4 mb-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(C,{className:"text-blue-500",size:14}),e.jsxs("h2",{className:"font-bold text-sm text-gray-800",children:["Items Ordered (",r.length,")"]})]}),e.jsx("div",{className:"space-y-2 max-h-56 overflow-y-auto pr-1",children:r.map((s,w)=>{var g;const t=s.productId,p=(g=t==null?void 0:t.image)==null?void 0:g[0],h=(t==null?void 0:t.name)||"Product",k=P((t==null?void 0:t.price)||0,(t==null?void 0:t.discount)||0),b=s.quantity||1;return e.jsxs("div",{className:"flex items-center gap-3 py-2 border-b last:border-0",children:[p&&e.jsx("img",{src:p,alt:h,className:"w-12 h-12 object-contain rounded-lg border bg-gray-50 flex-shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-medium text-gray-700 line-clamp-2",children:h}),e.jsxs("p",{className:"text-[11px] text-gray-400 mt-0.5",children:["Qty: ",b]})]}),e.jsx("p",{className:"text-xs font-bold text-gray-700 flex-shrink-0",children:n(k*b)})]},w)})})]}),e.jsxs("div",{className:"bg-white rounded-2xl border shadow-sm p-4 mb-6",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(T,{className:"text-purple-500",size:16}),e.jsx("h2",{className:"font-bold text-sm text-gray-800",children:"Payment Summary"})]}),e.jsxs("div",{className:"space-y-1.5 text-xs",children:[e.jsxs("div",{className:"flex justify-between text-gray-600",children:[e.jsx("span",{children:"Subtotal"}),e.jsx("span",{children:n(Math.max(0,x-i))})]}),e.jsxs("div",{className:"flex justify-between text-gray-600",children:[e.jsx("span",{children:"Delivery"}),e.jsx("span",{className:i===0?"text-green-600 font-semibold":"",children:i===0?"FREE":n(i)})]}),e.jsxs("div",{className:"flex justify-between font-bold text-gray-800 border-t pt-1.5 text-sm",children:[e.jsx("span",{children:"Total Paid"}),e.jsx("span",{children:n(x)})]}),e.jsxs("div",{className:"flex items-center gap-1.5 pt-1 text-gray-500",children:[e.jsx(E,{size:11}),e.jsx("span",{children:l==="COD"?"Cash on Delivery":l==="Wallet"?"Paid via Wallet":`Paid via ${l}`})]})]})]})]}):e.jsx("div",{className:"bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center",children:e.jsx("p",{className:"text-green-700 text-sm font-medium",children:"Your order has been confirmed! You will receive updates soon."})}),e.jsx(f,{to:"/",className:"block w-full text-center btn-primary font-semibold py-3.5 rounded-xl transition-all text-sm",children:"Go To Home"}),e.jsx(f,{to:"/my-orders",className:"block w-full text-center border border-gray-300 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-all mt-3 text-sm",children:"View My Orders"})]})})};export{Y as default};
