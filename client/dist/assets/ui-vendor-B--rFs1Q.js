import{a as x,r as d}from"./react-vendor-Dt2ouSKP.js";var H={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},A=x.createContext&&x.createContext(H),U=["attr","size","title"];function B(t,e){if(t==null)return{};var r=Y(t,e),a,o;if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);for(o=0;o<i.length;o++)a=i[o],!(e.indexOf(a)>=0)&&Object.prototype.propertyIsEnumerable.call(t,a)&&(r[a]=t[a])}return r}function Y(t,e){if(t==null)return{};var r={};for(var a in t)if(Object.prototype.hasOwnProperty.call(t,a)){if(e.indexOf(a)>=0)continue;r[a]=t[a]}return r}function N(){return N=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(t[a]=r[a])}return t},N.apply(this,arguments)}function T(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter(function(o){return Object.getOwnPropertyDescriptor(t,o).enumerable})),r.push.apply(r,a)}return r}function C(t){for(var e=1;e<arguments.length;e++){var r=arguments[e]!=null?arguments[e]:{};e%2?T(Object(r),!0).forEach(function(a){Z(t,a,r[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):T(Object(r)).forEach(function(a){Object.defineProperty(t,a,Object.getOwnPropertyDescriptor(r,a))})}return t}function Z(t,e,r){return e=q(e),e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function q(t){var e=J(t,"string");return typeof e=="symbol"?e:e+""}function J(t,e){if(typeof t!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var a=r.call(t,e||"default");if(typeof a!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function L(t){return t&&t.map((e,r)=>x.createElement(e.tag,C({key:r},e.attr),L(e.child)))}function Wt(t){return e=>x.createElement(K,N({attr:C({},t.attr)},e),L(t.child))}function K(t){var e=r=>{var{attr:a,size:o,title:i}=t,s=B(t,U),n=o||r.size||"1em",l;return r.className&&(l=r.className),t.className&&(l=(l?l+" ":"")+t.className),x.createElement("svg",N({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},r.attr,a,s,{className:l,style:C(C({color:t.color||r.color},r.style),t.style),height:n,width:n,xmlns:"http://www.w3.org/2000/svg"}),i&&x.createElement("title",null,i),t.children)};return A!==void 0?x.createElement(A.Consumer,null,r=>e(r)):e(H)}let Q={data:""},V=t=>typeof window=="object"?((t?t.querySelector("#_goober"):window._goober)||Object.assign((t||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:t||Q,X=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,tt=/\/\*[^]*?\*\/|  +/g,M=/\n+/g,h=(t,e)=>{let r="",a="",o="";for(let i in t){let s=t[i];i[0]=="@"?i[1]=="i"?r=i+" "+s+";":a+=i[1]=="f"?h(s,i):i+"{"+h(s,i[1]=="k"?"":e)+"}":typeof s=="object"?a+=h(s,e?e.replace(/([^,])+/g,n=>i.replace(/(^:.*)|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):i):s!=null&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=h.p?h.p(i,s):i+":"+s+";")}return r+(e&&o?e+"{"+o+"}":o)+a},y={},W=t=>{if(typeof t=="object"){let e="";for(let r in t)e+=r+W(t[r]);return e}return t},et=(t,e,r,a,o)=>{let i=W(t),s=y[i]||(y[i]=(l=>{let c=0,u=11;for(;c<l.length;)u=101*u+l.charCodeAt(c++)>>>0;return"go"+u})(i));if(!y[s]){let l=i!==t?t:(c=>{let u,m,f=[{}];for(;u=X.exec(c.replace(tt,""));)u[4]?f.shift():u[3]?(m=u[3].replace(M," ").trim(),f.unshift(f[0][m]=f[0][m]||{})):f[0][u[1]]=u[2].replace(M," ").trim();return f[0]})(t);y[s]=h(o?{["@keyframes "+s]:l}:l,r?"":"."+s)}let n=r&&y.g?y.g:null;return r&&(y.g=y[s]),((l,c,u,m)=>{m?c.data=c.data.replace(m,l):c.data.indexOf(l)===-1&&(c.data=u?l+c.data:c.data+l)})(y[s],e,a,n),s},rt=(t,e,r)=>t.reduce((a,o,i)=>{let s=e[i];if(s&&s.call){let n=s(r),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;s=l?"."+l:n&&typeof n=="object"?n.props?"":h(n,""):n===!1?"":n}return a+o+(s??"")},"");function D(t){let e=this||{},r=t.call?t(e.p):t;return et(r.unshift?r.raw?rt(r,[].slice.call(arguments,1),e.p):r.reduce((a,o)=>Object.assign(a,o&&o.call?o(e.p):o),{}):r,V(e.target),e.g,e.o,e.k)}let G,_,S;D.bind({g:1});let b=D.bind({k:1});function at(t,e,r,a){h.p=e,G=t,_=r,S=a}function v(t,e){let r=this||{};return function(){let a=arguments;function o(i,s){let n=Object.assign({},i),l=n.className||o.className;r.p=Object.assign({theme:_&&_()},n),r.o=/ *go\d+/.test(l),n.className=D.apply(r,a)+(l?" "+l:"");let c=t;return t[0]&&(c=n.as||t,delete n.as),S&&c[0]&&S(n),G(c,n)}return o}}var it=t=>typeof t=="function",z=(t,e)=>it(t)?t(e):t,ot=(()=>{let t=0;return()=>(++t).toString()})(),R=(()=>{let t;return()=>{if(t===void 0&&typeof window<"u"){let e=matchMedia("(prefers-reduced-motion: reduce)");t=!e||e.matches}return t}})(),nt=20,j=new Map,st=1e3,F=t=>{if(j.has(t))return;let e=setTimeout(()=>{j.delete(t),w({type:4,toastId:t})},st);j.set(t,e)},lt=t=>{let e=j.get(t);e&&clearTimeout(e)},k=(t,e)=>{switch(e.type){case 0:return{...t,toasts:[e.toast,...t.toasts].slice(0,nt)};case 1:return e.toast.id&&lt(e.toast.id),{...t,toasts:t.toasts.map(i=>i.id===e.toast.id?{...i,...e.toast}:i)};case 2:let{toast:r}=e;return t.toasts.find(i=>i.id===r.id)?k(t,{type:1,toast:r}):k(t,{type:0,toast:r});case 3:let{toastId:a}=e;return a?F(a):t.toasts.forEach(i=>{F(i.id)}),{...t,toasts:t.toasts.map(i=>i.id===a||a===void 0?{...i,visible:!1}:i)};case 4:return e.toastId===void 0?{...t,toasts:[]}:{...t,toasts:t.toasts.filter(i=>i.id!==e.toastId)};case 5:return{...t,pausedAt:e.time};case 6:let o=e.time-(t.pausedAt||0);return{...t,pausedAt:void 0,toasts:t.toasts.map(i=>({...i,pauseDuration:i.pauseDuration+o}))}}},P=[],$={toasts:[],pausedAt:void 0},w=t=>{$=k($,t),P.forEach(e=>{e($)})},ct={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},dt=(t={})=>{let[e,r]=d.useState($);d.useEffect(()=>(P.push(r),()=>{let o=P.indexOf(r);o>-1&&P.splice(o,1)}),[e]);let a=e.toasts.map(o=>{var i,s;return{...t,...t[o.type],...o,duration:o.duration||((i=t[o.type])==null?void 0:i.duration)||(t==null?void 0:t.duration)||ct[o.type],style:{...t.style,...(s=t[o.type])==null?void 0:s.style,...o.style}}});return{...e,toasts:a}},ut=(t,e="blank",r)=>({createdAt:Date.now(),visible:!0,type:e,ariaProps:{role:"status","aria-live":"polite"},message:t,pauseDuration:0,...r,id:(r==null?void 0:r.id)||ot()}),O=t=>(e,r)=>{let a=ut(e,t,r);return w({type:2,toast:a}),a.id},p=(t,e)=>O("blank")(t,e);p.error=O("error");p.success=O("success");p.loading=O("loading");p.custom=O("custom");p.dismiss=t=>{w({type:3,toastId:t})};p.remove=t=>w({type:4,toastId:t});p.promise=(t,e,r)=>{let a=p.loading(e.loading,{...r,...r==null?void 0:r.loading});return t.then(o=>(p.success(z(e.success,o),{id:a,...r,...r==null?void 0:r.success}),o)).catch(o=>{p.error(z(e.error,o),{id:a,...r,...r==null?void 0:r.error})}),t};var pt=(t,e)=>{w({type:1,toast:{id:t,height:e}})},ft=()=>{w({type:5,time:Date.now()})},mt=t=>{let{toasts:e,pausedAt:r}=dt(t);d.useEffect(()=>{if(r)return;let i=Date.now(),s=e.map(n=>{if(n.duration===1/0)return;let l=(n.duration||0)+n.pauseDuration-(i-n.createdAt);if(l<0){n.visible&&p.dismiss(n.id);return}return setTimeout(()=>p.dismiss(n.id),l)});return()=>{s.forEach(n=>n&&clearTimeout(n))}},[e,r]);let a=d.useCallback(()=>{r&&w({type:6,time:Date.now()})},[r]),o=d.useCallback((i,s)=>{let{reverseOrder:n=!1,gutter:l=8,defaultPosition:c}=s||{},u=e.filter(g=>(g.position||c)===(i.position||c)&&g.height),m=u.findIndex(g=>g.id===i.id),f=u.filter((g,I)=>I<m&&g.visible).length;return u.filter(g=>g.visible).slice(...n?[f+1]:[0,f]).reduce((g,I)=>g+(I.height||0)+l,0)},[e]);return{toasts:e,handlers:{updateHeight:pt,startPause:ft,endPause:a,calculateOffset:o}}},gt=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,yt=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,bt=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ht=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${gt} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${yt} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${t=>t.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${bt} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,vt=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,xt=v("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${t=>t.secondary||"#e0e0e0"};
  border-right-color: ${t=>t.primary||"#616161"};
  animation: ${vt} 1s linear infinite;
`,wt=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,Ot=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Et=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${wt} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Ot} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${t=>t.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,jt=v("div")`
  position: absolute;
`,Pt=v("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,$t=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Nt=v("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${$t} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Ct=({toast:t})=>{let{icon:e,type:r,iconTheme:a}=t;return e!==void 0?typeof e=="string"?d.createElement(Nt,null,e):e:r==="blank"?null:d.createElement(Pt,null,d.createElement(xt,{...a}),r!=="loading"&&d.createElement(jt,null,r==="error"?d.createElement(ht,{...a}):d.createElement(Et,{...a})))},zt=t=>`
0% {transform: translate3d(0,${t*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Dt=t=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${t*-150}%,-1px) scale(.6); opacity:0;}
`,It="0%{opacity:0;} 100%{opacity:1;}",_t="0%{opacity:1;} 100%{opacity:0;}",St=v("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,kt=v("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,At=(t,e)=>{let r=t.includes("top")?1:-1,[a,o]=R()?[It,_t]:[zt(r),Dt(r)];return{animation:e?`${b(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Tt=d.memo(({toast:t,position:e,style:r,children:a})=>{let o=t.height?At(t.position||e||"top-center",t.visible):{opacity:0},i=d.createElement(Ct,{toast:t}),s=d.createElement(kt,{...t.ariaProps},z(t.message,t));return d.createElement(St,{className:t.className,style:{...o,...r,...t.style}},typeof a=="function"?a({icon:i,message:s}):d.createElement(d.Fragment,null,i,s))});at(d.createElement);var Mt=({id:t,className:e,style:r,onHeightUpdate:a,children:o})=>{let i=d.useCallback(s=>{if(s){let n=()=>{let l=s.getBoundingClientRect().height;a(t,l)};n(),new MutationObserver(n).observe(s,{subtree:!0,childList:!0,characterData:!0})}},[t,a]);return d.createElement("div",{ref:i,className:e,style:r},o)},Ft=(t,e)=>{let r=t.includes("top"),a=r?{top:0}:{bottom:0},o=t.includes("center")?{justifyContent:"center"}:t.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:R()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${e*(r?1:-1)}px)`,...a,...o}},Ht=D`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,E=16,Gt=({reverseOrder:t,position:e="top-center",toastOptions:r,gutter:a,children:o,containerStyle:i,containerClassName:s})=>{let{toasts:n,handlers:l}=mt(r);return d.createElement("div",{style:{position:"fixed",zIndex:9999,top:E,left:E,right:E,bottom:E,pointerEvents:"none",...i},className:s,onMouseEnter:l.startPause,onMouseLeave:l.endPause},n.map(c=>{let u=c.position||e,m=l.calculateOffset(c,{reverseOrder:t,gutter:a,defaultPosition:e}),f=Ft(u,m);return d.createElement(Mt,{id:c.id,key:c.id,onHeightUpdate:l.updateHeight,className:c.visible?Ht:"",style:f},c.type==="custom"?z(c.message,c):o?o(c):d.createElement(Tt,{toast:c,position:u}))}))},Rt=p;export{Wt as G,Gt as I,Rt as _};
