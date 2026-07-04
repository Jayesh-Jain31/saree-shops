import{j as e,x as V,a6 as Q,ak as J,al as K,aj as U,D as r,am as X,a5 as Z,r as O,A as ee,S as te,P as se}from"./index-B_RhYDNT.js";import{r as d,c as ae,L as P}from"./react-vendor-Dt2ouSKP.js";import"./redux-vendor-BjsoHN6Y.js";import"./axios-vendor-DsPaXkF5.js";import"./ui-vendor-B--rFs1Q.js";const ie=()=>{const[u,a]=d.useState(!1);return d.useEffect(()=>{const t=setTimeout(()=>a(!0),2800);return()=>clearTimeout(t)},[]),e.jsxs("div",{className:"truck-scene",children:[e.jsx("div",{className:"road",children:e.jsx("div",{className:"road-line"})}),e.jsxs("div",{className:"truck",children:[e.jsxs("div",{className:"cab",children:[e.jsx("div",{className:"windshield"}),e.jsx("div",{className:"headlight"}),e.jsx("div",{className:"beam"})]}),e.jsx("div",{className:"body",children:e.jsx("span",{className:"cargo-icon",children:"🛍️"})}),e.jsx("div",{className:"wheel wheel-front"}),e.jsx("div",{className:"wheel wheel-rear"})]}),e.jsxs("div",{className:`success-badge ${u?"visible":""}`,children:[e.jsx("span",{children:"🎉"}),e.jsx("span",{className:"badge-text",children:"Order Placed!"})]}),e.jsx("style",{children:`
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
      `})]})},de=()=>{var j;const a=ae().state||{},[t,S]=d.useState(null),[T,L]=d.useState(!0);d.useEffect(()=>{(async()=>{var m;try{const l=((m=(await ee({...te.getOrderItems})).data)==null?void 0:m.data)||[];l.length>0&&S(l[0])}catch{}finally{L(!1)}})()},[]);const z=a.items||[],I=a.address,E=()=>{const s=t==null?void 0:t.delivery_address_snapshot;return s&&(s.address_line||s.name)?s:I||null},F=()=>{const s=(t==null?void 0:t.payment_status)||"";return s==="CASH ON DELIVERY"?"COD":s==="PAID"?"Online":s==="WALLET"?"Wallet":s==="PARTIAL COD"?"Partial COD":a.paymentMethod||"Online"},n=E(),g=(t==null?void 0:t.totalAmt)??a.totalAmount??0,x=(t==null?void 0:t.deliveryCharge)??a.deliveryCharge??0,M=(t==null?void 0:t.subTotalAmt)??a.subTotalAmt??0,p=(t==null?void 0:t.couponDiscount)??a.couponDiscount??0,f=(t==null?void 0:t.couponCode)??a.couponCode??"",o=F(),_=(t==null?void 0:t.prepaidAmount)??a.prepaidAmount??0,R=(t==null?void 0:t.codAmount)??a.codAmount??0,G=(t==null?void 0:t.partialCodPercent)??a.partialCodPercent??0,h=(t==null?void 0:t.createdAt)||a.orderDate,b=((j=t==null?void 0:t.items)==null?void 0:j.length)>0?t.items:z,$=n&&b.length>0,W=s=>s?new Date(s).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"",Y=s=>s?new Date(s).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"",H=()=>{if(a.estimatedDelivery)return a.estimatedDelivery;const s=new Date;return s.setDate(s.getDate()+5),`By ${s.toLocaleDateString("en-IN",{day:"numeric",month:"long"})}`};return T?e.jsx("div",{className:"min-h-screen bg-gray-50 flex items-center justify-center",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"w-10 h-10 border-4 border-primary-color border-t-transparent rounded-full animate-spin mx-auto mb-3"}),e.jsx("p",{className:"text-gray-500 text-sm",children:"Loading order details..."})]})}):e.jsx("div",{className:"min-h-screen bg-gray-50 py-8 px-4",children:e.jsxs("div",{className:"max-w-lg mx-auto",children:[e.jsxs("div",{className:"text-center mb-6",children:[e.jsx(ie,{}),e.jsx("h1",{className:"text-2xl font-bold text-gray-800 mb-1 mt-2",children:"Order Placed!"}),e.jsx("p",{className:"text-gray-500 text-sm",children:"Thank you! Your order has been confirmed."}),h&&e.jsxs("p",{className:"text-xs text-gray-400 mt-1",children:[W(h)," at ",Y(h)]})]}),$?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"bg-white rounded-2xl border shadow-sm p-4 mb-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(V,{className:"text-green-500",size:16}),e.jsx("h2",{className:"font-bold text-sm text-gray-800",children:"Delivery Information"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(Q,{className:"text-gray-400 mt-0.5 flex-shrink-0",size:12}),e.jsxs("div",{className:"text-xs text-gray-600",children:[n.name&&e.jsxs("p",{className:"font-semibold text-gray-700 mb-0.5",children:[n.name," · ",n.mobile]}),!n.name&&n.mobile&&e.jsx("p",{className:"font-semibold text-gray-700 mb-0.5",children:n.mobile}),e.jsx("p",{children:n.address_line}),e.jsxs("p",{children:[n.city,", ",n.state," - ",n.pincode]}),e.jsx("p",{children:n.country})]})]}),e.jsxs("div",{className:"flex items-center gap-2 pt-2 border-t",children:[e.jsx(J,{className:"text-green-500",size:14}),e.jsxs("p",{className:"text-xs text-green-700 font-semibold",children:["Estimated Delivery: ",H()]})]})]})]}),e.jsxs("div",{className:"bg-white rounded-2xl border shadow-sm p-4 mb-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(K,{className:"text-blue-500",size:14}),e.jsxs("h2",{className:"font-bold text-sm text-gray-800",children:["Items Ordered (",b.length,")"]})]}),e.jsx("div",{className:"space-y-2 max-h-56 overflow-y-auto pr-1",children:b.map((s,m)=>{var v,D,k,C,A;const i=s.productId||{},l=((v=i==null?void 0:i.image)==null?void 0:v[0])||((k=(D=s.product_details)==null?void 0:D.image)==null?void 0:k[0]),y=(i==null?void 0:i.name)||((C=s.product_details)==null?void 0:C.name)||"Product",c=s.isFreeGift||!1,N=s.price||(i==null?void 0:i.price)||0,q=((A=s.product_details)==null?void 0:A.discount)??(i==null?void 0:i.discount)??0,B=c?0:se(N,q),w=s.quantity||1;return e.jsxs("div",{className:`flex items-center gap-3 py-2 border-b last:border-0 ${c?"bg-rose-50 -mx-1 px-1 rounded-lg":""}`,children:[l&&e.jsx("img",{src:l,alt:y,className:`w-12 h-12 object-contain rounded-lg border flex-shrink-0 ${c?"bg-white border-rose-100":"bg-gray-50"}`}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsx("p",{className:"text-xs font-medium text-gray-700 line-clamp-1",children:y}),c&&e.jsxs("span",{className:"inline-flex items-center gap-0.5 text-[9px] font-bold uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded-full tracking-wide flex-shrink-0",children:[e.jsx(U,{size:7})," Free Gift"]})]}),e.jsxs("p",{className:"text-[11px] text-gray-400 mt-0.5",children:["Qty: ",w]})]}),c?e.jsxs("div",{className:"flex-shrink-0 text-right",children:[e.jsx("span",{className:"text-[10px] line-through text-gray-400 block",children:r(N)}),e.jsx("span",{className:"text-xs font-bold text-rose-600",children:"₹0"})]}):e.jsx("p",{className:"text-xs font-bold text-gray-700 flex-shrink-0",children:r(B*w)})]},m)})})]}),e.jsxs("div",{className:"bg-white rounded-2xl border shadow-sm p-4 mb-6",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-3",children:[e.jsx(X,{className:"text-purple-500",size:16}),e.jsx("h2",{className:"font-bold text-sm text-gray-800",children:"Payment Summary"})]}),e.jsxs("div",{className:"space-y-1.5 text-xs",children:[e.jsxs("div",{className:"flex justify-between text-gray-600",children:[e.jsx("span",{children:"Subtotal"}),e.jsx("span",{children:r(M||Math.max(0,g+p-x))})]}),e.jsxs("div",{className:"flex justify-between text-gray-600",children:[e.jsx("span",{children:"Delivery"}),e.jsx("span",{className:x===0?"text-green-600 font-semibold":"",children:x===0?"FREE":r(x)})]}),p>0&&e.jsxs("div",{className:"flex justify-between text-green-600",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(Z,{size:10}),f?`Coupon (${f})`:"Coupon Discount"]}),e.jsxs("span",{className:"font-semibold",children:["- ",r(p)]})]}),e.jsxs("div",{className:"flex justify-between font-bold text-gray-800 border-t pt-1.5 text-sm",children:[e.jsx("span",{children:o==="COD"?"Grand Total":"Total Paid"}),e.jsx("span",{children:r(g)})]}),o==="Partial COD"&&e.jsxs("div",{className:"space-y-1 pt-1 border-t mt-1",children:[e.jsxs("div",{className:"flex justify-between text-xs text-indigo-600",children:[e.jsx("span",{children:"Online Paid"}),e.jsx("span",{className:"font-semibold",children:r(_)})]}),e.jsxs("div",{className:"flex justify-between text-xs text-amber-600",children:[e.jsx("span",{children:"COD (on delivery)"}),e.jsx("span",{className:"font-semibold",children:r(R)})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 pt-1 text-gray-500",children:[e.jsx(O,{size:11}),e.jsx("span",{children:o==="COD"?"Cash on Delivery":o==="Partial COD"?`Partial COD — ${G}% online + rest on delivery`:o==="Wallet"?"Paid via Wallet":"Paid via Razorpay"})]})]})]})]}):e.jsx("div",{className:"bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center",children:e.jsx("p",{className:"text-green-700 text-sm font-medium",children:"Your order has been confirmed! You will receive updates soon."})}),e.jsx(P,{to:"/",className:"block w-full text-center btn-primary font-semibold py-3.5 rounded-xl transition-all text-sm",children:"Go To Home"}),e.jsx(P,{to:"/dashboard/myorders",className:"block w-full text-center border border-gray-300 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-all mt-3 text-sm",children:"View My Orders"})]})})};export{de as default};
