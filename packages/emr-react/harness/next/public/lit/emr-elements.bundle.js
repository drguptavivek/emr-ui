var Ct=globalThis,It=Ct.ShadowRoot&&(Ct.ShadyCSS===void 0||Ct.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,se=Symbol(),Pr=new WeakMap,ct=class{constructor(t,e,r){if(this._$cssResult$=!0,r!==se)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(It&&t===void 0){let r=e!==void 0&&e.length===1;r&&(t=Pr.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&Pr.set(e,t))}return t}toString(){return this.cssText}},Rr=s=>new ct(typeof s=="string"?s:s+"",void 0,se),A=(s,...t)=>{let e=s.length===1?s[0]:t.reduce((r,a,n)=>r+(p=>{if(p._$cssResult$===!0)return p.cssText;if(typeof p=="number")return p;throw Error("Value passed to 'css' function must be a 'css' function result: "+p+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+s[n+1],s[0]);return new ct(e,s,se)},Nr=(s,t)=>{if(It)s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let r=document.createElement("style"),a=Ct.litNonce;a!==void 0&&r.setAttribute("nonce",a),r.textContent=e.cssText,s.appendChild(r)}},ie=It?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let r of t.cssRules)e+=r.cssText;return Rr(e)})(s):s;var{is:rs,defineProperty:ss,getOwnPropertyDescriptor:is,getOwnPropertyNames:as,getOwnPropertySymbols:os,getPrototypeOf:ns}=Object,Ot=globalThis,Lr=Ot.trustedTypes,ls=Lr?Lr.emptyScript:"",ds=Ot.reactiveElementPolyfillSupport,ut=(s,t)=>s,ht={toAttribute(s,t){switch(t){case Boolean:s=s?ls:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch{e=null}}return e}},Tt=(s,t)=>!rs(s,t),Ur={attribute:!0,type:String,converter:ht,reflect:!1,useDefault:!1,hasChanged:Tt};Symbol.metadata??=Symbol("metadata"),Ot.litPropertyMetadata??=new WeakMap;var R=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=Ur){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let r=Symbol(),a=this.getPropertyDescriptor(t,r,e);a!==void 0&&ss(this.prototype,t,a)}}static getPropertyDescriptor(t,e,r){let{get:a,set:n}=is(this.prototype,t)??{get(){return this[e]},set(p){this[e]=p}};return{get:a,set(p){let h=a?.call(this);n?.call(this,p),this.requestUpdate(t,h,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ur}static _$Ei(){if(this.hasOwnProperty(ut("elementProperties")))return;let t=ns(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(ut("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ut("properties"))){let e=this.properties,r=[...as(e),...os(e)];for(let a of r)this.createProperty(a,e[a])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[r,a]of e)this.elementProperties.set(r,a)}this._$Eh=new Map;for(let[e,r]of this.elementProperties){let a=this._$Eu(e,r);a!==void 0&&this._$Eh.set(a,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let r=new Set(t.flat(1/0).reverse());for(let a of r)e.unshift(ie(a))}else t!==void 0&&e.push(ie(t));return e}static _$Eu(t,e){let r=e.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let r of e.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Nr(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,r){this._$AK(t,r)}_$ET(t,e){let r=this.constructor.elementProperties.get(t),a=this.constructor._$Eu(t,r);if(a!==void 0&&r.reflect===!0){let n=(r.converter?.toAttribute!==void 0?r.converter:ht).toAttribute(e,r.type);this._$Em=t,n==null?this.removeAttribute(a):this.setAttribute(a,n),this._$Em=null}}_$AK(t,e){let r=this.constructor,a=r._$Eh.get(t);if(a!==void 0&&this._$Em!==a){let n=r.getPropertyOptions(a),p=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:ht;this._$Em=a;let h=p.fromAttribute(e,n.type);this[a]=h??this._$Ej?.get(a)??h,this._$Em=null}}requestUpdate(t,e,r,a=!1,n){if(t!==void 0){let p=this.constructor;if(a===!1&&(n=this[t]),r??=p.getPropertyOptions(t),!((r.hasChanged??Tt)(n,e)||r.useDefault&&r.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(p._$Eu(t,r))))return;this.C(t,e,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:r,reflect:a,wrapped:n},p){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,p??e??this[t]),n!==!0||p!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(e=void 0),this._$AL.set(t,e)),a===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[a,n]of this._$Ep)this[a]=n;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[a,n]of r){let{wrapped:p}=n,h=this[a];p!==!0||this._$AL.has(a)||h===void 0||this.C(a,void 0,n,h)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(e)):this._$EM()}catch(r){throw t=!1,this._$EM(),r}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};R.elementStyles=[],R.shadowRootOptions={mode:"open"},R[ut("elementProperties")]=new Map,R[ut("finalized")]=new Map,ds?.({ReactiveElement:R}),(Ot.reactiveElementVersions??=[]).push("2.1.2");var ce=globalThis,Dr=s=>s,Mt=ce.trustedTypes,jr=Mt?Mt.createPolicy("lit-html",{createHTML:s=>s}):void 0,Fr="$lit$",D=`lit$${Math.random().toFixed(9).slice(2)}$`,Yr="?"+D,ps=`<${Yr}>`,K=document,yt=()=>K.createComment(""),bt=s=>s===null||typeof s!="object"&&typeof s!="function",ue=Array.isArray,cs=s=>ue(s)||typeof s?.[Symbol.iterator]=="function",ae=`[ 	
\f\r]`,mt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Br=/-->/g,qr=/>/g,Y=RegExp(`>|${ae}(?:([^\\s"'>=/]+)(${ae}*=${ae}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Hr=/'/g,Vr=/"/g,Wr=/^(?:script|style|textarea|title)$/i,he=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),i=he(1),$=he(2),As=he(3),Z=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),zr=new WeakMap,W=K.createTreeWalker(K,129);function Kr(s,t){if(!ue(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return jr!==void 0?jr.createHTML(t):t}var us=(s,t)=>{let e=s.length-1,r=[],a,n=t===2?"<svg>":t===3?"<math>":"",p=mt;for(let h=0;h<e;h++){let b=s[h],f,w,v=-1,P=0;for(;P<b.length&&(p.lastIndex=P,w=p.exec(b),w!==null);)P=p.lastIndex,p===mt?w[1]==="!--"?p=Br:w[1]!==void 0?p=qr:w[2]!==void 0?(Wr.test(w[2])&&(a=RegExp("</"+w[2],"g")),p=Y):w[3]!==void 0&&(p=Y):p===Y?w[0]===">"?(p=a??mt,v=-1):w[1]===void 0?v=-2:(v=p.lastIndex-w[2].length,f=w[1],p=w[3]===void 0?Y:w[3]==='"'?Vr:Hr):p===Vr||p===Hr?p=Y:p===Br||p===qr?p=mt:(p=Y,a=void 0);let U=p===Y&&s[h+1].startsWith("/>")?" ":"";n+=p===mt?b+ps:v>=0?(r.push(f),b.slice(0,v)+Fr+b.slice(v)+D+U):b+D+(v===-2?h:U)}return[Kr(s,n+(s[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]},ft=class s{constructor({strings:t,_$litType$:e},r){let a;this.parts=[];let n=0,p=0,h=t.length-1,b=this.parts,[f,w]=us(t,e);if(this.el=s.createElement(f,r),W.currentNode=this.el.content,e===2||e===3){let v=this.el.content.firstChild;v.replaceWith(...v.childNodes)}for(;(a=W.nextNode())!==null&&b.length<h;){if(a.nodeType===1){if(a.hasAttributes())for(let v of a.getAttributeNames())if(v.endsWith(Fr)){let P=w[p++],U=a.getAttribute(v).split(D),kt=/([.?@])?(.*)/.exec(P);b.push({type:1,index:n,name:kt[2],strings:U,ctor:kt[1]==="."?ne:kt[1]==="?"?le:kt[1]==="@"?de:st}),a.removeAttribute(v)}else v.startsWith(D)&&(b.push({type:6,index:n}),a.removeAttribute(v));if(Wr.test(a.tagName)){let v=a.textContent.split(D),P=v.length-1;if(P>0){a.textContent=Mt?Mt.emptyScript:"";for(let U=0;U<P;U++)a.append(v[U],yt()),W.nextNode(),b.push({type:2,index:++n});a.append(v[P],yt())}}}else if(a.nodeType===8)if(a.data===Yr)b.push({type:2,index:n});else{let v=-1;for(;(v=a.data.indexOf(D,v+1))!==-1;)b.push({type:7,index:n}),v+=D.length-1}n++}}static createElement(t,e){let r=K.createElement("template");return r.innerHTML=t,r}};function rt(s,t,e=s,r){if(t===Z)return t;let a=r!==void 0?e._$Co?.[r]:e._$Cl,n=bt(t)?void 0:t._$litDirective$;return a?.constructor!==n&&(a?._$AO?.(!1),n===void 0?a=void 0:(a=new n(s),a._$AT(s,e,r)),r!==void 0?(e._$Co??=[])[r]=a:e._$Cl=a),a!==void 0&&(t=rt(s,a._$AS(s,t.values),a,r)),t}var oe=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:r}=this._$AD,a=(t?.creationScope??K).importNode(e,!0);W.currentNode=a;let n=W.nextNode(),p=0,h=0,b=r[0];for(;b!==void 0;){if(p===b.index){let f;b.type===2?f=new gt(n,n.nextSibling,this,t):b.type===1?f=new b.ctor(n,b.name,b.strings,this,t):b.type===6&&(f=new pe(n,this,t)),this._$AV.push(f),b=r[++h]}p!==b?.index&&(n=W.nextNode(),p++)}return W.currentNode=K,a}p(t){let e=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,e),e+=r.strings.length-2):r._$AI(t[e])),e++}},gt=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,r,a){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=r,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=rt(this,t,e),bt(t)?t===d||t==null||t===""?(this._$AH!==d&&this._$AR(),this._$AH=d):t!==this._$AH&&t!==Z&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):cs(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==d&&bt(this._$AH)?this._$AA.nextSibling.data=t:this.T(K.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:r}=t,a=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=ft.createElement(Kr(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===a)this._$AH.p(e);else{let n=new oe(a,this),p=n.u(this.options);n.p(e),this.T(p),this._$AH=n}}_$AC(t){let e=zr.get(t.strings);return e===void 0&&zr.set(t.strings,e=new ft(t)),e}k(t){ue(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,r,a=0;for(let n of t)a===e.length?e.push(r=new s(this.O(yt()),this.O(yt()),this,this.options)):r=e[a],r._$AI(n),a++;a<e.length&&(this._$AR(r&&r._$AB.nextSibling,a),e.length=a)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let r=Dr(t).nextSibling;Dr(t).remove(),t=r}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},st=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,r,a,n){this.type=1,this._$AH=d,this._$AN=void 0,this.element=t,this.name=e,this._$AM=a,this.options=n,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=d}_$AI(t,e=this,r,a){let n=this.strings,p=!1;if(n===void 0)t=rt(this,t,e,0),p=!bt(t)||t!==this._$AH&&t!==Z,p&&(this._$AH=t);else{let h=t,b,f;for(t=n[0],b=0;b<n.length-1;b++)f=rt(this,h[r+b],e,b),f===Z&&(f=this._$AH[b]),p||=!bt(f)||f!==this._$AH[b],f===d?t=d:t!==d&&(t+=(f??"")+n[b+1]),this._$AH[b]=f}p&&!a&&this.j(t)}j(t){t===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},ne=class extends st{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===d?void 0:t}},le=class extends st{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==d)}},de=class extends st{constructor(t,e,r,a,n){super(t,e,r,a,n),this.type=5}_$AI(t,e=this){if((t=rt(this,t,e,0)??d)===Z)return;let r=this._$AH,a=t===d&&r!==d||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,n=t!==d&&(r===d||a);a&&this.element.removeEventListener(this.name,this,r),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},pe=class{constructor(t,e,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){rt(this,t)}};var hs=ce.litHtmlPolyfillSupport;hs?.(ft,gt),(ce.litHtmlVersions??=[]).push("3.3.3");var Zr=(s,t,e)=>{let r=e?.renderBefore??t,a=r._$litPart$;if(a===void 0){let n=e?.renderBefore??null;r._$litPart$=a=new gt(t.insertBefore(yt(),n),n,void 0,e??{})}return a._$AI(s),a};var me=globalThis,j=class extends R{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Zr(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Z}};j._$litElement$=!0,j.finalized=!0,me.litElementHydrateSupport?.({LitElement:j});var ms=me.litElementPolyfillSupport;ms?.({LitElement:j});(me.litElementVersions??=[]).push("4.2.2");var Jr={preset:"clinical-slate",scheme:"light",fontStack:"inter",radius:"standard",density:"standard",fontScale:"1"},vt={inter:{label:"Inter Variable (Clinical I/l + Tabular)",sans:"'Inter Variable', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",mono:"'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",features:'"cv05" 1, "cv08" 1, "ss03" 1, "zero" 1'},"ibm-plex":{label:"IBM Plex Sans + IBM Plex Mono",sans:"'IBM Plex Sans', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",mono:"'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",features:'"zero" 1, "ss01" 1'},atkinson:{label:"Atkinson Hyperlegible (Low-Vision / Ophthal)",sans:"'Atkinson Hyperlegible', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",mono:"'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",features:'"zero" 1'},system:{label:"System UI Native",sans:"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",mono:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",features:"normal"}},Pt={"clinical-slate":{light:{label:"Clinical Slate (Default)",primary:"#475f70",primaryHover:"#d4e0e6",primaryContrast:"#344b5a",primarySoft:"#e3ebef",primaryBorder:"#b2c4ce",focus:"#5f7f92"},dark:{label:"Clinical Slate (Dark)",primary:"#c5d5df",primaryHover:"#435966",primaryContrast:"#e8eff3",primarySoft:"#334755",primaryBorder:"#708998",focus:"#8fb0c2"}},"surgical-teal":{light:{label:"Surgical Teal",primary:"#0f766e",primaryHover:"#ccfbf1",primaryContrast:"#115e59",primarySoft:"#e6fffa",primaryBorder:"#5eead4",focus:"#0d9488"},dark:{label:"Surgical Teal (Dark)",primary:"#5eead4",primaryHover:"#115e59",primaryContrast:"#ccfbf1",primarySoft:"#134e4a",primaryBorder:"#2dd4bf",focus:"#2dd4bf"}},"royal-blue":{light:{label:"Hospital Blue",primary:"#1d4ed8",primaryHover:"#dbeafe",primaryContrast:"#1e3a8a",primarySoft:"#eff6ff",primaryBorder:"#93c5fd",focus:"#2563eb"},dark:{label:"Hospital Blue (Dark)",primary:"#93c5fd",primaryHover:"#1e3a8a",primaryContrast:"#dbeafe",primarySoft:"#172554",primaryBorder:"#60a5fa",focus:"#60a5fa"}},"forest-emerald":{light:{label:"Clinical Emerald",primary:"#15803d",primaryHover:"#dcfce7",primaryContrast:"#14532d",primarySoft:"#f0fdf4",primaryBorder:"#86efac",focus:"#16a34a"},dark:{label:"Clinical Emerald (Dark)",primary:"#86efac",primaryHover:"#14532d",primaryContrast:"#dcfce7",primarySoft:"#052e16",primaryBorder:"#4ade80",focus:"#4ade80"}},"ophthal-dark-room":{light:{label:"Ophthalmology Dark-Room (Low Glare)",primary:"#7dd3fc",primaryHover:"#1e293b",primaryContrast:"#e0f2fe",primarySoft:"#0f172a",primaryBorder:"#38bdf8",focus:"#38bdf8",background:"#050811",surface:"#0b1120",surfaceSoft:"#111827",surfaceRaised:"#1e293b",border:"#334155",text:"#e2e8f0",textMuted:"#94a3b8"},dark:{label:"Ophthalmology Dark-Room (Low Glare)",primary:"#7dd3fc",primaryHover:"#1e293b",primaryContrast:"#e0f2fe",primarySoft:"#0f172a",primaryBorder:"#38bdf8",focus:"#38bdf8",background:"#050811",surface:"#0b1120",surfaceSoft:"#111827",surfaceRaised:"#1e293b",border:"#334155",text:"#e2e8f0",textMuted:"#94a3b8"}}},Rt={sharp:{label:"Sharp (0px)",px:0},crisp:{label:"Crisp (6px)",px:6},standard:{label:"Standard (8px)",px:8},soft:{label:"Soft (12px)",px:12}},Nt={compact:{label:"Compact (36px)",heightPx:36,compactPx:28},standard:{label:"Standard (44px)",heightPx:44,compactPx:32},touch:{label:"Touch (48px)",heightPx:48,compactPx:36}};function ys(s){let t=s.preset==="ophthal-dark-room"?"dark":s.scheme,e=Pt[s.preset][t],r=vt[s.fontStack],a=Rt[s.radius].px,n=Nt[s.density],p=Number(s.fontScale)||1,h=f=>`${Math.round(f*p*1e4)/1e4}rem`,b={"--emr-primary":s.customBrandHex||e.primary,"--emr-primary-hover":e.primaryHover,"--emr-primary-contrast":e.primaryContrast,"--emr-primary-soft":e.primarySoft,"--emr-primary-border":e.primaryBorder,"--emr-focus":e.focus,"--emr-font-family":r.sans,"--emr-font-mono":r.mono,"--emr-font-features":r.features,"--emr-radius":`${a}px`,"--emr-radius-sm":`${Math.max(0,Math.round(a*.65))}px`,"--emr-radius-lg":`${Math.round(a*1.4)}px`,"--emr-control-height":`${n.heightPx}px`,"--emr-compact-height":`${n.compactPx}px`,"--emr-text-2xs":h(.6875),"--emr-text-xs":h(.75),"--emr-text-sm":h(.8125),"--emr-text-md":h(.875),"--emr-text-lg":h(1),"--emr-text-xl":h(1.25),"--emr-text-2xl":h(1.5),"--emr-weight-regular":"400","--emr-weight-medium":"500","--emr-weight-semibold":"600","--emr-weight-bold":"700"};return e.background&&(b["--emr-background"]=e.background),e.surface&&(b["--emr-surface"]=e.surface),e.surfaceSoft&&(b["--emr-surface-soft"]=e.surfaceSoft),e.surfaceRaised&&(b["--emr-surface-raised"]=e.surfaceRaised),e.border&&(b["--emr-border"]=e.border),e.text&&(b["--emr-text"]=e.text),e.textMuted&&(b["--emr-text-muted"]=e.textMuted),b}function Gr(s,t){if(typeof document>"u")return;let e=t??document.documentElement,r=ys(s);for(let[a,n]of Object.entries(r))e.style.setProperty(a,n);e.style.fontFeatureSettings=vt[s.fontStack].features,e.style.fontVariantNumeric="tabular-nums"}var y=A`
  :host {
    display: block;
    box-sizing: border-box;
    color: var(--emr-text, #263847);
    font-family: var(--emr-font-family, 'Inter Variable', Inter, system-ui, sans-serif);
    font-feature-settings: var(--emr-font-features, "cv05" 1, "cv08" 1, "ss03" 1, "zero" 1);
    font-variant-numeric: tabular-nums;
    line-height: var(--emr-leading-normal, 1.45);
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .emr-card {
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius-lg, 12px);
    background: var(--emr-surface, #fffefa);
    padding: 16px;
    display: grid;
    gap: 12px;
  }

  .emr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .emr-title {
    margin: 0;
    font-size: var(--emr-text-lg, 1rem);
    font-weight: var(--emr-weight-bold, 700);
    color: var(--emr-text, #263847);
  }

  .emr-muted {
    margin: 0;
    font-size: var(--emr-text-sm, 0.8125rem);
    color: var(--emr-text-muted, #5c6c78);
  }

  .emr-control {
    min-height: var(--emr-control-height, 44px);
    height: var(--emr-control-height, 44px);
    padding: 0 12px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    font: inherit;
    font-size: var(--emr-text-md, 0.875rem);
    font-variant-numeric: tabular-nums;
    width: 100%;
  }

  .emr-control:focus-visible,
  .emr-btn:focus-visible,
  .emr-chip:focus-visible {
    outline: 2px solid var(--emr-focus, #5f7f92);
    outline-offset: -2px;
  }

  .emr-btn {
    min-height: var(--emr-control-height, 44px);
    height: var(--emr-control-height, 44px);
    padding: 0 16px;
    border: 1px solid var(--emr-primary-border, #b2c4ce);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-primary-soft, #e3ebef);
    color: var(--emr-primary-contrast, #344b5a);
    font: inherit;
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-semibold, 600);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    white-space: nowrap;
  }

  .emr-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover, #d4e0e6);
  }

  .emr-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .emr-btn--secondary {
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text, #263847);
    border-color: var(--emr-border, #c7d3da);
  }

  .emr-btn--outline {
    background: var(--emr-surface, #fffefa);
    color: var(--emr-primary, #475f70);
    border-color: var(--emr-primary-border, #b2c4ce);
  }

  .emr-btn--danger {
    background: var(--emr-danger-soft, #fcecec);
    color: var(--emr-danger, #a44949);
    border-color: var(--emr-danger, #a44949);
  }

  .emr-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid var(--emr-border, #c7d3da);
    background: var(--emr-neutral-soft, #e8eef1);
    color: var(--emr-text, #263847);
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-semibold, 600);
  }

  .emr-badge--info { background: var(--emr-info-soft, #e8f0f4); color: var(--emr-info, #486f86); border-color: var(--emr-info, #486f86); }
  .emr-badge--success { background: var(--emr-success-soft, #e8f5ec); color: var(--emr-success, #2b7650); border-color: var(--emr-success, #2b7650); }
  .emr-badge--warning { background: var(--emr-warning-soft, #fbf4de); color: var(--emr-warning, #8a651f); border-color: var(--emr-warning, #8a651f); }
  .emr-badge--danger { background: var(--emr-danger-soft, #fcecec); color: var(--emr-danger, #a44949); border-color: var(--emr-danger, #a44949); }

  .emr-field {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .emr-label {
    font-size: var(--emr-text-sm, 0.8125rem);
    font-weight: var(--emr-weight-semibold, 600);
    color: var(--emr-text, #263847);
  }

  .emr-hint {
    font-size: var(--emr-text-xs, 0.75rem);
    color: var(--emr-text-muted, #5c6c78);
  }

  .emr-error {
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-medium, 500);
    color: var(--emr-danger, #a44949);
  }
`,m=class extends j{static{this.styles=[y]}emitIntent(t){this.dispatchEvent(new CustomEvent("intent",{detail:t,bubbles:!0,composed:!0}))}emitValueChange(t){this.dispatchEvent(new CustomEvent("valueChange",{detail:t,bubbles:!0,composed:!0}))}};function l(s,t){typeof customElements<"u"&&!customElements.get(s)&&customElements.define(s,t)}function x(s,t=18){let e=(()=>{switch(s){case"calendar":return $`<rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />`;case"clock":return $`<circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />`;case"eye":return $`<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />`;case"eye-off":return $`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.4 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" /><line x1="2" y1="2" x2="22" y2="22" />`;case"lock":return $`<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />`;case"unlock":return $`<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.8-1" />`;case"plus":return $`<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />`;case"minus":return $`<line x1="5" y1="12" x2="19" y2="12" />`;case"check":return $`<polyline points="20 6 9 17 4 12" />`;case"close":return $`<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />`;case"chevron-down":return $`<polyline points="6 9 12 15 18 9" />`;case"chevron-up":return $`<polyline points="18 15 12 9 6 15" />`;case"chevron-left":return $`<polyline points="15 18 9 12 15 6" />`;case"chevron-right":return $`<polyline points="9 18 15 12 9 6" />`;case"search":return $`<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" />`;case"warning":return $`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />`;case"info":return $`<circle cx="12" cy="12" r="9" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />`;case"danger":return $`<circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />`;case"trash":return $`<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />`;default:return $`<circle cx="12" cy="12" r="8" />`}})();return $`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${e}</svg>`}var bs={attribute:!0,type:String,converter:ht,reflect:!1,hasChanged:Tt},fs=(s=bs,t,e)=>{let{kind:r,metadata:a}=e,n=globalThis.litPropertyMetadata.get(a);if(n===void 0&&globalThis.litPropertyMetadata.set(a,n=new Map),r==="setter"&&((s=Object.create(s)).wrapped=!0),n.set(e.name,s),r==="accessor"){let{name:p}=e;return{set(h){let b=t.get.call(this);t.set.call(this,h),this.requestUpdate(p,b,s,!0,h)},init(h){return h!==void 0&&this.C(p,void 0,s,h),h}}}if(r==="setter"){let{name:p}=e;return function(h){let b=this[p];t.call(this,h),this.requestUpdate(p,b,s,!0,h)}}throw Error("Unsupported decorator location: "+r)};function o(s){return(t,e)=>typeof e=="object"?fs(s,t,e):((r,a,n)=>{let p=a.hasOwnProperty(n);return a.constructor.createProperty(n,r),p?Object.getOwnPropertyDescriptor(a,n):void 0})(s,t,e)}var c=function(s,t,e,r){var a=arguments.length,n=a<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,e):r,p;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,r);else for(var h=s.length-1;h>=0;h--)(p=s[h])&&(n=(a<3?p(n):a>3?p(t,e,n):p(t,e))||n);return a>3&&n&&Object.defineProperty(t,e,n),n},g=A`
  .stepper-wrap {
    display: inline-flex;
    align-items: center;
    width: 200px;
    max-width: 100%;
    height: var(--emr-control-height, 44px);
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    overflow: hidden;
  }
  .stepper-btn {
    width: 38px;
    height: 100%;
    border: 0;
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text, #263847);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .stepper-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover, #d4e0e6);
  }
  .stepper-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    background: transparent;
    color: var(--emr-text, #263847);
    text-align: center;
    font: inherit;
    font-variant-numeric: tabular-nums;
  }
  .date-wrap {
    display: inline-flex;
    align-items: center;
    width: 220px;
    max-width: 100%;
    height: var(--emr-control-height, 44px);
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    overflow: hidden;
  }
  .date-icon-box {
    width: 40px;
    height: 100%;
    border-left: 1px solid var(--emr-border, #c7d3da);
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text-muted, #5c6c78);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .option-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, auto-fit), minmax(140px, 1fr));
    gap: 8px;
  }
  .option-tile {
    min-height: var(--emr-control-height, 44px);
    padding: 0 12px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font: inherit;
    font-size: var(--emr-text-md, 0.875rem);
    font-weight: var(--emr-weight-medium, 500);
    text-align: left;
  }
  .option-tile[aria-checked="true"],
  .option-tile[aria-pressed="true"] {
    border-color: var(--emr-primary, #475f70);
    background: var(--emr-primary-soft, #e3ebef);
    color: var(--emr-primary-contrast, #344b5a);
  }
  .indicator {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border: 1.5px solid var(--emr-border, #c7d3da);
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .indicator--radio {
    border-radius: 999px;
  }
  .option-tile[aria-checked="true"] .indicator,
  .option-tile[aria-pressed="true"] .indicator {
    border-color: var(--emr-primary, #475f70);
    background: var(--emr-primary, #475f70);
    color: #fff;
  }
  .tabs-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    padding-bottom: 6px;
  }
  .vas-track {
    width: 100%;
    accent-color: var(--emr-primary, #475f70);
  }
  .columns-grid {
    display: grid;
    grid-template-columns: repeat(var(--emr-cols, 2), minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }
`,it=class extends m{constructor(){super(...arguments),this.label="",this.variant="primary",this.disabled=!1}static{this.styles=[y,g]}render(){let t=this.variant==="primary"?"emr-btn":`emr-btn emr-btn--${this.variant}`;return i`<button type="button" part="button" class=${t} ?disabled=${this.disabled} @click=${()=>this.dispatchEvent(new CustomEvent("clicked",{bubbles:!0,composed:!0}))}>
      ${this.label}<slot></slot>
    </button>`}};c([o({type:String})],it.prototype,"label",void 0);c([o({type:String})],it.prototype,"variant",void 0);c([o({type:Boolean})],it.prototype,"disabled",void 0);var I=class extends m{constructor(){super(...arguments),this.controlId="",this.label="",this.value="",this.placeholder="",this.hint="",this.error="",this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<div class="emr-field" part="field">
      ${this.label?i`<label class="emr-label" for=${this.controlId}>${this.label}</label>`:d}
      <input
        id=${this.controlId}
        part="control"
        class="emr-control"
        type="text"
        .value=${this.value??""}
        placeholder=${this.placeholder}
        ?readonly=${this.readOnly}
        @input=${t=>{let e=t.target.value;this.value=e,this.emitValueChange(e||null)}}
      />
      ${this.error?i`<span class="emr-error">${this.error}</span>`:this.hint?i`<span class="emr-hint">${this.hint}</span>`:d}
    </div>`}};c([o({type:String})],I.prototype,"controlId",void 0);c([o({type:String})],I.prototype,"label",void 0);c([o({type:String})],I.prototype,"value",void 0);c([o({type:String})],I.prototype,"placeholder",void 0);c([o({type:String})],I.prototype,"hint",void 0);c([o({type:String})],I.prototype,"error",void 0);c([o({type:Boolean})],I.prototype,"readOnly",void 0);var k=class extends m{constructor(){super(...arguments),this.controlId="",this.label="",this.value=null,this.step=1,this.hint="",this.error="",this.readOnly=!1}static{this.styles=[y,g]}stepBy(t){if(this.readOnly)return;let e=this.value??0,r=Math.round((e+t*(this.step||1))*1e4)/1e4;this.min!==void 0&&r<this.min&&(r=this.min),this.max!==void 0&&r>this.max&&(r=this.max),this.value=r,this.emitValueChange(r)}render(){return i`<div class="emr-field" part="field">
      ${this.label?i`<label class="emr-label" for=${this.controlId}>${this.label}</label>`:d}
      <div class="stepper-wrap" part="stepper">
        ${this.readOnly?d:i`<button type="button" class="stepper-btn" aria-label="Decrease value" @click=${()=>this.stepBy(-1)}>${x("minus",15)}</button>`}
        <input
          id=${this.controlId}
          part="control"
          class="stepper-input"
          type="text"
          inputmode="decimal"
          .value=${this.value===null||this.value===void 0?"":String(this.value)}
          ?readonly=${this.readOnly}
          @input=${t=>{let e=t.target.value.trim(),r=e===""?null:Number(e);(r===null||Number.isFinite(r))&&(this.value=r,this.emitValueChange(r))}}
        />
        ${this.readOnly?d:i`<button type="button" class="stepper-btn" aria-label="Increase value" @click=${()=>this.stepBy(1)}>${x("plus",15)}</button>`}
      </div>
      ${this.error?i`<span class="emr-error">${this.error}</span>`:this.hint?i`<span class="emr-hint">${this.hint}</span>`:d}
    </div>`}};c([o({type:String})],k.prototype,"controlId",void 0);c([o({type:String})],k.prototype,"label",void 0);c([o({type:Number})],k.prototype,"value",void 0);c([o({type:Number})],k.prototype,"min",void 0);c([o({type:Number})],k.prototype,"max",void 0);c([o({type:Number})],k.prototype,"step",void 0);c([o({type:String})],k.prototype,"hint",void 0);c([o({type:String})],k.prototype,"error",void 0);c([o({type:Boolean})],k.prototype,"readOnly",void 0);var O=class extends m{constructor(){super(...arguments),this.controlId="",this.label="",this.value=null,this.precision="day",this.hint="",this.error="",this.readOnly=!1}static{this.styles=[y,g]}render(){let t=this.precision==="month"?"month":this.precision==="year"?"number":"date";return i`<div class="emr-field" part="field">
      ${this.label?i`<label class="emr-label" for=${this.controlId}>${this.label}</label>`:d}
      <div class="date-wrap" part="control">
        <input
          id=${this.controlId}
          class="stepper-input"
          type=${t}
          placeholder=${this.precision==="year"?"YYYY":this.precision==="month"?"YYYY-MM":"YYYY-MM-DD"}
          .value=${this.value??""}
          ?readonly=${this.readOnly}
          @input=${e=>{let r=e.target.value||null;this.value=r,this.emitValueChange(r)}}
        />
        <span class="date-icon-box">${x("calendar",16)}</span>
      </div>
      ${this.error?i`<span class="emr-error">${this.error}</span>`:this.hint?i`<span class="emr-hint">${this.hint}</span>`:d}
    </div>`}};c([o({type:String})],O.prototype,"controlId",void 0);c([o({type:String})],O.prototype,"label",void 0);c([o({type:String})],O.prototype,"value",void 0);c([o({type:String})],O.prototype,"precision",void 0);c([o({type:String})],O.prototype,"hint",void 0);c([o({type:String})],O.prototype,"error",void 0);c([o({type:Boolean})],O.prototype,"readOnly",void 0);var B=class extends m{constructor(){super(...arguments),this.controlId="",this.label="",this.value=null,this.precision="minute",this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<div class="emr-field" part="field">
      ${this.label?i`<label class="emr-label" for=${this.controlId}>${this.label}</label>`:d}
      <div class="date-wrap" style="width: 170px;" part="control">
        <input
          id=${this.controlId}
          class="stepper-input"
          type="time"
          step=${this.precision==="second"?"1":"60"}
          .value=${this.value??""}
          ?readonly=${this.readOnly}
          @input=${t=>{let e=t.target.value||null;this.value=e,this.emitValueChange(e)}}
        />
        <span class="date-icon-box">${x("clock",16)}</span>
      </div>
    </div>`}};c([o({type:String})],B.prototype,"controlId",void 0);c([o({type:String})],B.prototype,"label",void 0);c([o({type:String})],B.prototype,"value",void 0);c([o({type:String})],B.prototype,"precision",void 0);c([o({type:Boolean})],B.prototype,"readOnly",void 0);var q=class extends m{constructor(){super(...arguments),this.controlId="",this.label="",this.value=null,this.precision="minute",this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<div class="emr-field" part="field">
      ${this.label?i`<label class="emr-label" for=${this.controlId}>${this.label}</label>`:d}
      <input
        id=${this.controlId}
        class="emr-control"
        style="max-width: 280px;"
        type="datetime-local"
        step=${this.precision==="second"?"1":"60"}
        .value=${(this.value??"").replace(/Z$/,"")}
        ?readonly=${this.readOnly}
        @input=${t=>{let e=t.target.value||null;this.value=e,this.emitValueChange(e)}}
      />
    </div>`}};c([o({type:String})],q.prototype,"controlId",void 0);c([o({type:String})],q.prototype,"label",void 0);c([o({type:String})],q.prototype,"value",void 0);c([o({type:String})],q.prototype,"precision",void 0);c([o({type:Boolean})],q.prototype,"readOnly",void 0);var J=class extends m{constructor(){super(...arguments),this.label="",this.value=null,this.options=[],this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<div class="emr-field" part="field">
      ${this.label?i`<span class="emr-label">${this.label}</span>`:d}
      <div class="option-grid">
        ${this.options.map(t=>{let e=this.value===t.value;return i`<button
            type="button"
            class="option-tile"
            aria-pressed=${e}
            ?disabled=${this.readOnly||t.disabled}
            @click=${()=>{let r=e?null:String(t.value);this.value=r,this.emitValueChange(r)}}
          >
            <span class="indicator indicator--radio">${e?x("check",11):d}</span>
            <span>${t.label}</span>
          </button>`})}
      </div>
    </div>`}};c([o({type:String})],J.prototype,"label",void 0);c([o({type:String})],J.prototype,"value",void 0);c([o({attribute:!1})],J.prototype,"options",void 0);c([o({type:Boolean})],J.prototype,"readOnly",void 0);var H=class extends m{constructor(){super(...arguments),this.label="",this.value=null,this.unit=null,this.units=[],this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<div class="emr-field">
      ${this.label?i`<span class="emr-label">${this.label}</span>`:d}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <emr-number-input
          .value=${this.value}
          .readOnly=${this.readOnly}
          @valueChange=${t=>{this.value=t.detail,this.emitValueChange(t.detail)}}
        ></emr-number-input>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${this.units.map(t=>i`<button
              type="button"
              class="option-tile"
              style="min-width:64px;"
              aria-pressed=${this.unit===t.value}
              ?disabled=${this.readOnly}
              @click=${()=>{this.unit=String(t.value),this.dispatchEvent(new CustomEvent("unitChange",{detail:this.unit,bubbles:!0,composed:!0}))}}
            >${t.label}</button>`)}
        </div>
      </div>
    </div>`}};c([o({type:String})],H.prototype,"label",void 0);c([o({type:Number})],H.prototype,"value",void 0);c([o({type:String})],H.prototype,"unit",void 0);c([o({attribute:!1})],H.prototype,"units",void 0);c([o({type:Boolean})],H.prototype,"readOnly",void 0);var V=class extends m{constructor(){super(...arguments),this.label="",this.firstValue="",this.secondValue="",this.separator="/",this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<div class="emr-field">
      ${this.label?i`<span class="emr-label">${this.label}</span>`:d}
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <input class="emr-control" style="width:132px;" .value=${this.firstValue??""} ?readonly=${this.readOnly}
          @input=${t=>{this.firstValue=t.target.value||null,this.dispatchEvent(new CustomEvent("firstValueChange",{detail:this.firstValue,bubbles:!0,composed:!0}))}} />
        <span class="emr-muted">${this.separator}</span>
        <input class="emr-control" style="width:132px;" .value=${this.secondValue??""} ?readonly=${this.readOnly}
          @input=${t=>{this.secondValue=t.target.value||null,this.dispatchEvent(new CustomEvent("secondValueChange",{detail:this.secondValue,bubbles:!0,composed:!0}))}} />
      </div>
    </div>`}};c([o({type:String})],V.prototype,"label",void 0);c([o({type:String})],V.prototype,"firstValue",void 0);c([o({type:String})],V.prototype,"secondValue",void 0);c([o({type:String})],V.prototype,"separator",void 0);c([o({type:Boolean})],V.prototype,"readOnly",void 0);var G=class extends m{constructor(){super(...arguments),this.label="",this.checked=!1,this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<button
      type="button"
      role="checkbox"
      class="option-tile"
      aria-checked=${this.checked}
      ?disabled=${this.readOnly}
      @click=${()=>{this.readOnly||(this.checked=!this.checked,this.dispatchEvent(new CustomEvent("checkedChange",{detail:this.checked,bubbles:!0,composed:!0})),this.emitValueChange(this.checked))}}
    >
      <span class="indicator">${this.checked?x("check",11):d}</span>
      <span>${this.label}<slot></slot></span>
    </button>`}};c([o({type:String})],G.prototype,"label",void 0);c([o({type:Boolean})],G.prototype,"checked",void 0);c([o({type:Boolean})],G.prototype,"readOnly",void 0);var ye=class extends G{},z=class extends m{constructor(){super(...arguments),this.label="",this.value=null,this.options=[],this.orientation="horizontal",this.readOnly=!1}static{this.styles=[y,g]}render(){return i`<div class="emr-field" role="radiogroup" aria-label=${this.label}>
      ${this.label?i`<span class="emr-label">${this.label}</span>`:d}
      <div class="option-grid" style=${this.orientation==="vertical"?"--cols: 1;":""}>
        ${this.options.map(t=>{let e=this.value===t.value;return i`<button
            type="button"
            role="radio"
            class="option-tile"
            aria-checked=${e}
            ?disabled=${this.readOnly||t.disabled}
            @click=${()=>{this.value=String(t.value),this.emitValueChange(this.value)}}
          >
            <span class="indicator indicator--radio">${e?x("check",11):d}</span>
            <span>${t.label}</span>
          </button>`})}
      </div>
    </div>`}};c([o({type:String})],z.prototype,"label",void 0);c([o({type:String})],z.prototype,"value",void 0);c([o({attribute:!1})],z.prototype,"options",void 0);c([o({type:String})],z.prototype,"orientation",void 0);c([o({type:Boolean})],z.prototype,"readOnly",void 0);var Q=class extends m{constructor(){super(...arguments),this.tone="neutral",this.label=""}static{this.styles=[y,g]}render(){let t=this.badge?.tone??this.tone,e=this.badge?.label??this.label;return i`<span part="badge" class="emr-badge emr-badge--${t}">${e}<slot></slot></span>`}};c([o({type:String})],Q.prototype,"tone",void 0);c([o({type:String})],Q.prototype,"label",void 0);c([o({attribute:!1})],Q.prototype,"badge",void 0);var be=class extends Q{},xt=class extends m{constructor(){super(...arguments),this.tone="info",this.title=""}static{this.styles=[y,g]}render(){return i`<div role="status" class="emr-card emr-badge--${this.tone}" style="border-radius:var(--emr-radius, 8px);padding:12px;">
      ${this.title?i`<strong style="display:block;">${this.title}</strong>`:d}
      <div><slot></slot></div>
    </div>`}};c([o({type:String})],xt.prototype,"tone",void 0);c([o({type:String})],xt.prototype,"title",void 0);var at=class extends m{constructor(){super(...arguments),this.title="",this.description="",this.state="empty"}static{this.styles=[y,g]}render(){return i`<div class="emr-card" style="text-align:center;">
      <p class="emr-title">${this.title||this.state}</p>
      ${this.description?i`<p class="emr-muted">${this.description}</p>`:d}
      <slot></slot>
    </div>`}};c([o({type:String})],at.prototype,"title",void 0);c([o({type:String})],at.prototype,"description",void 0);c([o({type:String})],at.prototype,"state",void 0);var ot=class extends m{constructor(){super(...arguments),this.label="",this.query="",this.options=[]}static{this.styles=[y,g]}render(){return i`<div class="emr-field">
      ${this.label?i`<span class="emr-label">${this.label}</span>`:d}
      <input class="emr-control" type="search" .value=${this.query} placeholder="Search…"
        @input=${t=>{this.query=t.target.value,this.dispatchEvent(new CustomEvent("queryChange",{detail:this.query,bubbles:!0,composed:!0}))}} />
      <div class="option-grid">
        ${this.options.map(t=>i`<button type="button" class="option-tile" @click=${()=>this.emitValueChange(t.value)}>${t.label}</button>`)}
      </div>
    </div>`}};c([o({type:String})],ot.prototype,"label",void 0);c([o({type:String})],ot.prototype,"query",void 0);c([o({attribute:!1})],ot.prototype,"options",void 0);var $t=class extends m{constructor(){super(...arguments),this.tabs=[],this.activeTab=null}static{this.styles=[y,g]}render(){return i`<div role="tablist" class="tabs-bar">
      ${this.tabs.map(t=>{let e=this.activeTab===t.value;return i`<button
          type="button"
          role="tab"
          class="option-tile"
          aria-selected=${e}
          aria-pressed=${e}
          @click=${()=>{this.activeTab=String(t.value),this.dispatchEvent(new CustomEvent("tabChange",{detail:this.activeTab,bubbles:!0,composed:!0})),this.emitValueChange(this.activeTab)}}
        >${t.label}</button>`})}
    </div>`}};c([o({attribute:!1})],$t.prototype,"tabs",void 0);c([o({type:String})],$t.prototype,"activeTab",void 0);var Ut=class extends m{constructor(){super(...arguments),this.label=""}static{this.styles=[y,g]}render(){return i`<div role="separator" style="display:flex;align-items:center;gap:8px;margin:8px 0;">
      <div style="flex:1;height:1px;background:var(--emr-border,#c7d3da);"></div>
      ${this.label?i`<span class="emr-muted">${this.label}</span>`:d}
      <div style="flex:1;height:1px;background:var(--emr-border,#c7d3da);"></div>
    </div>`}};c([o({type:String})],Ut.prototype,"label",void 0);var X=class extends m{constructor(){super(...arguments),this.label="",this.min=0,this.max=10,this.value=null}static{this.styles=[y,g]}render(){let t=[];for(let e=this.min;e<=this.max;e++)t.push(e);return i`<div class="emr-field">
      ${this.label?i`<span class="emr-label">${this.label}</span>`:d}
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${t.map(e=>i`<button
            type="button"
            class="option-tile"
            style="min-width:44px;justify-content:center;"
            aria-pressed=${this.value===e}
            @click=${()=>{this.value=e,this.emitValueChange(e)}}
          >${e}</button>`)}
      </div>
    </div>`}};c([o({type:String})],X.prototype,"label",void 0);c([o({type:Number})],X.prototype,"min",void 0);c([o({type:Number})],X.prototype,"max",void 0);c([o({type:Number})],X.prototype,"value",void 0);var F=class extends m{constructor(){super(...arguments),this.label="",this.min=0,this.max=10,this.step=.1,this.value=null}static{this.styles=[y,g]}render(){return i`<div class="emr-field">
      <div class="emr-header">
        ${this.label?i`<span class="emr-label">${this.label}</span>`:d}
        <span class="emr-badge emr-badge--info">${this.value??"Unmarked"} / ${this.max}</span>
      </div>
      <input
        type="range"
        class="vas-track"
        min=${this.min}
        max=${this.max}
        step=${this.step}
        .value=${String(this.value??this.min)}
        @input=${t=>{let e=Number(t.target.value);this.value=e,this.emitValueChange(e)}}
      />
    </div>`}};c([o({type:String})],F.prototype,"label",void 0);c([o({type:Number})],F.prototype,"min",void 0);c([o({type:Number})],F.prototype,"max",void 0);c([o({type:Number})],F.prototype,"step",void 0);c([o({type:Number})],F.prototype,"value",void 0);var Dt=class extends m{constructor(){super(...arguments),this.title=""}static{this.styles=[y,g]}render(){return i`<section class="emr-card" part="card">
      ${this.title?i`<h3 class="emr-title">${this.title}</h3>`:d}
      <slot></slot>
    </section>`}};c([o({type:String})],Dt.prototype,"title",void 0);var jt=class extends m{constructor(){super(...arguments),this.columns=2}static{this.styles=[y,g]}render(){let t=Math.max(1,Math.min(6,this.columns||2));return i`<div class="columns-grid" style="--emr-cols: ${t};"><slot></slot></div>`}};c([o({type:Number})],jt.prototype,"columns",void 0);var E=class extends m{constructor(){super(...arguments),this.field="",this.value="",this.remarks="",this.notes=""}static{this.styles=[y,g]}render(){return i`<div class="columns-grid" style="--emr-cols: 4; padding: 8px 0; border-bottom: 1px solid var(--emr-border,#c7d3da);">
      <strong>${this.field}</strong>
      <span>${this.value}</span>
      <span class="emr-muted">${this.remarks}</span>
      <span class="emr-muted">${this.notes}</span>
    </div>`}};c([o({type:String})],E.prototype,"field",void 0);c([o({type:String})],E.prototype,"value",void 0);c([o({type:String})],E.prototype,"remarks",void 0);c([o({type:String})],E.prototype,"notes",void 0);var nt=class extends m{constructor(){super(...arguments),this.value="",this.attribution=""}static{this.styles=[y,g]}render(){return i`<div class="emr-card" style="padding:10px;">
      ${this.badge?i`<emr-badge .badge=${this.badge}></emr-badge>`:d}
      ${this.value?i`<strong>${this.value}</strong>`:d}
      ${this.attribution?i`<span class="emr-muted">${this.attribution}</span>`:d}
    </div>`}};c([o({attribute:!1})],nt.prototype,"badge",void 0);c([o({type:String})],nt.prototype,"value",void 0);c([o({type:String})],nt.prototype,"attribution",void 0);var St=class extends m{constructor(){super(...arguments),this.steps=[],this.activeStepId=""}static{this.styles=[y,g]}render(){return i`<ol style="display:flex;gap:8px;flex-wrap:wrap;list-style:none;padding:0;margin:0;">
      ${this.steps.map((t,e)=>i`<li>
          <button
            type="button"
            class="option-tile"
            aria-current=${t.id===this.activeStepId?"step":"false"}
            aria-pressed=${t.id===this.activeStepId}
            @click=${()=>this.dispatchEvent(new CustomEvent("stepSelected",{detail:t.id,bubbles:!0,composed:!0}))}
          >
            <strong>${e+1}.</strong> <span>${t.label}</span>
          </button>
        </li>`)}
    </ol>`}};c([o({attribute:!1})],St.prototype,"steps",void 0);c([o({type:String})],St.prototype,"activeStepId",void 0);var Bt=class extends m{static{this.styles=[y,g]}render(){let t=this.model;return t?i`<div class="emr-card" @click=${()=>this.dispatchEvent(new CustomEvent("statSelected",{detail:t.label,bubbles:!0,composed:!0}))}>
      <span class="emr-muted">${t.label}</span>
      <strong style="font-size:var(--emr-text-2xl,1.5rem);">${t.value}</strong>
    </div>`:d}};c([o({attribute:!1})],Bt.prototype,"model",void 0);function Qr(){l("emr-button",it),l("emr-text-input",I),l("emr-number-input",k),l("emr-date-input",O),l("emr-time-input",B),l("emr-datetime-input",q),l("emr-select",J),l("emr-quantity-input",H),l("emr-paired-input",V),l("emr-checkbox",G),l("emr-toggle",ye),l("emr-radio-group",z),l("emr-badge",Q),l("emr-chip",be),l("emr-alert",xt),l("emr-state-message",at),l("emr-search-select",ot),l("emr-tabs",$t),l("emr-separator",Ut),l("emr-likert",X),l("emr-vas",F),l("emr-card",Dt),l("emr-columns",jt),l("emr-field-value-row",E),l("emr-status-cell",nt),l("emr-stage-stepper",St),l("emr-stat-tile",Bt)}var _=function(s,t,e,r){var a=arguments.length,n=a<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,e):r,p;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,r);else for(var h=s.length-1;h>=0;h--)(p=s[h])&&(n=(a<3?p(n):a>3?p(t,e,n):p(t,e))||n);return a>3&&n&&Object.defineProperty(t,e,n),n},dt=A`
  .slot-line {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: stretch;
  }
  .slot-tile {
    flex: 1 1 130px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
  }
  .slot-tile--on {
    border-color: var(--emr-primary, #475f70);
    background: var(--emr-primary-soft, #e3ebef);
  }
`,tt=class extends m{constructor(){super(...arguments),this.label="",this.hint="",this.error="",this.required=!1}static{this.styles=[y,dt]}render(){return i`<div class="emr-field" part="frame">
      ${this.label?i`<label class="emr-label">${this.label}${this.required?i`<span style="color:var(--emr-danger,#a44949);"> *</span>`:d}</label>`:d}
      <slot></slot>
      ${this.error?i`<span class="emr-error">${this.error}</span>`:this.hint?i`<span class="emr-hint">${this.hint}</span>`:d}
    </div>`}};_([o({type:String})],tt.prototype,"label",void 0);_([o({type:String})],tt.prototype,"hint",void 0);_([o({type:String})],tt.prototype,"error",void 0);_([o({type:Boolean})],tt.prototype,"required",void 0);var lt=class extends m{constructor(){super(...arguments),this.readOnly=!1}static{this.styles=[y,dt]}render(){let t=this.definition;if(!t)return d;let e=this.model?.value??null;return i`<emr-field-frame .label=${t.label} .hint=${t.hint??""} .error=${this.model?.error??""} ?required=${!!t.required}>
      ${t.type==="integer"||t.type==="decimal"?i`<emr-number-input .value=${typeof e=="number"?e:null} .readOnly=${this.readOnly} @valueChange=${r=>this.emitValueChange(r.detail)}></emr-number-input>`:t.type==="date"?i`<emr-date-input .value=${typeof e=="string"?e:null} .readOnly=${this.readOnly} @valueChange=${r=>this.emitValueChange(r.detail)}></emr-date-input>`:t.type==="boolean"?i`<emr-checkbox .label=${t.label} .checked=${!!e} .readOnly=${this.readOnly} @valueChange=${r=>this.emitValueChange(r.detail)}></emr-checkbox>`:i`<emr-text-input .value=${typeof e=="string"?e:""} .readOnly=${this.readOnly} @valueChange=${r=>this.emitValueChange(r.detail)}></emr-text-input>`}
    </emr-field-frame>`}};_([o({attribute:!1})],lt.prototype,"definition",void 0);_([o({attribute:!1})],lt.prototype,"model",void 0);_([o({type:Boolean})],lt.prototype,"readOnly",void 0);var qt=class extends m{static{this.styles=[y,dt]}render(){let t=this.model;return t?i`<div class="emr-field">
      <span class="emr-label">${t.definition.presentation.label}</span>
      <input
        class="emr-control"
        type="search"
        .value=${t.query}
        placeholder=${t.definition.presentation.hint??"Search terminology\u2026"}
        ?readonly=${!!t.readOnly}
        @input=${e=>this.emitIntent({type:"queryChangeRequested",query:e.target.value})}
      />
      ${t.options.length?i`<div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${t.options.map(e=>i`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"conceptSelected",concept:e})}>
                ${e.display} (${e.code})
              </button>`)}
          </div>`:d}
    </div>`:d}};_([o({attribute:!1})],qt.prototype,"model",void 0);var Ht=class extends m{static{this.styles=[y,dt]}render(){let t=this.model;return t?i`<section class="emr-card">
      <div class="emr-header">
        <h4 class="emr-title">${t.title??"Attestation"}</h4>
      </div>
      ${t.statement?i`<p class="emr-muted">${t.statement}</p>`:d}
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        ${t.signatories.map(e=>i`<span class="emr-badge emr-badge--${e.status.tone}">${e.displayName} · ${e.status.label}</span>`)}
        ${!t.readOnly&&t.canSign?i`<button type="button" class="emr-btn" @click=${()=>this.emitIntent({type:"signRequested"})}>${t.signLabel??"Sign"}</button>`:d}
        ${!t.readOnly&&t.canAmend?i`<button type="button" class="emr-btn emr-btn--outline" @click=${()=>this.emitIntent({type:"amendRequested"})}>${t.amendLabel??"Amend"}</button>`:d}
      </div>
    </section>`:d}};_([o({attribute:!1})],Ht.prototype,"model",void 0);var N=class extends m{constructor(){super(...arguments),this.label="When to take",this.slots=[],this.presets=[],this.value=null,this.unitLabel="tablets",this.readOnly=!1}static{this.styles=[y,dt]}render(){let t=new Map((this.value??[]).map(r=>[r.id,r])),e=this.slots.map(r=>t.get(r.id)?.amount??0).join(" - ");return i`<div class="emr-field">
      <div class="emr-header">
        <span class="emr-label">${this.label} <span class="emr-badge">${e}</span></span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${this.presets.map(r=>i`<button
              type="button"
              class="emr-btn emr-btn--secondary"
              style="min-height:30px;height:30px;padding:0 10px;"
              ?disabled=${this.readOnly}
              @click=${()=>{let a=this.slots.filter(n=>r.slotIds.includes(n.id)).map(n=>({id:n.id,label:n.label,timeHint:n.timeHint,amount:1}));this.value=a,this.emitValueChange(a)}}
            >${r.label}</button>`)}
        </div>
      </div>
      <div class="slot-line">
        ${this.slots.map(r=>{let a=t.get(r.id),n=!!a;return i`<div class="slot-tile ${n?"slot-tile--on":""}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${r.label}</strong>
              ${r.timeHint?i`<span class="emr-muted">${r.timeHint}</span>`:d}
            </div>
            <button
              type="button"
              class="emr-btn emr-btn--secondary"
              style="min-height:32px;height:32px;"
              ?disabled=${this.readOnly}
              @click=${()=>{let p=[...this.value??[]],h=n?p.filter(b=>b.id!==r.id):[...p,{id:r.id,label:r.label,timeHint:r.timeHint,amount:1}];this.value=h,this.emitValueChange(h)}}
            >
              ${n?i`${x("check",14)} ${a?.amount??1} ${this.unitLabel}`:`0 ${this.unitLabel}`}
            </button>
          </div>`})}
      </div>
    </div>`}};_([o({type:String})],N.prototype,"label",void 0);_([o({attribute:!1})],N.prototype,"slots",void 0);_([o({attribute:!1})],N.prototype,"presets",void 0);_([o({attribute:!1})],N.prototype,"value",void 0);_([o({type:String})],N.prototype,"unitLabel",void 0);_([o({type:Boolean})],N.prototype,"readOnly",void 0);var Vt=class extends m{static{this.styles=[y,dt]}render(){let t=this.model;return t?i`<div class="emr-field">
      <span class="emr-label">${t.label}</span>
      <div style="display:flex;gap:8px;">
        <input
          class="emr-control"
          .value=${t.value}
          ?readonly=${!!t.readOnly}
          @input=${e=>this.emitValueChange(e.target.value)}
        />
        ${t.readOnly?d:i`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"scanRequested"})}>Scan</button>`}
      </div>
    </div>`:d}};_([o({attribute:!1})],Vt.prototype,"model",void 0);function Xr(){l("emr-field-frame",tt),l("emr-typed-field",lt),l("emr-coded-input",qt),l("emr-attestation",Ht),l("emr-schedule-slot-picker",N),l("emr-identifier-entry",Vt)}var S=function(s,t,e,r){var a=arguments.length,n=a<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,e):r,p;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,r);else for(var h=s.length-1;h>=0;h--)(p=s[h])&&(n=(a<3?p(n):a>3?p(t,e,n):p(t,e))||n);return a>3&&n&&Object.defineProperty(t,e,n),n},T=A`
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    font-size: var(--emr-text-sm, 0.8125rem);
  }
  th {
    background: var(--emr-surface-raised, #eff3f5);
    color: var(--emr-text-muted, #5c6c78);
    font-weight: var(--emr-weight-bold, 700);
  }
  .toolbar-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
`,et=class extends m{constructor(){super(...arguments),this.title="",this.description="",this.collapsed=!1}static{this.styles=[y,T]}render(){return i`<section class="emr-card" part="section">
      <header class="emr-header">
        <div>
          <h3 class="emr-title">${this.title}</h3>
          ${this.description?i`<p class="emr-muted">${this.description}</p>`:d}
        </div>
        ${this.status?i`<emr-badge .badge=${this.status}></emr-badge>`:d}
      </header>
      ${this.collapsed?d:i`<div><slot></slot></div>`}
    </section>`}};S([o({type:String})],et.prototype,"title",void 0);S([o({type:String})],et.prototype,"description",void 0);S([o({attribute:!1})],et.prototype,"status",void 0);S([o({type:Boolean})],et.prototype,"collapsed",void 0);var pt=class extends m{constructor(){super(...arguments),this.title="",this.items=[],this.readOnly=!1}static{this.styles=[y,T]}render(){return i`<section class="emr-card">
      <header class="emr-header">
        <h4 class="emr-title">${this.title}</h4>
        ${this.readOnly?d:i`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"entryAdded"})}>+ Add entry</button>`}
      </header>
      <slot></slot>
    </section>`}};S([o({type:String})],pt.prototype,"title",void 0);S([o({attribute:!1})],pt.prototype,"items",void 0);S([o({type:Boolean})],pt.prototype,"readOnly",void 0);var wt=class extends m{static{this.styles=[y,T]}render(){let t=this.definition,e=this.model;return!t&&!e?d:i`<form class="emr-card" @submit=${r=>r.preventDefault()}>
      ${t?i`<header class="emr-header"><h2 class="emr-title">${t.label}</h2></header>
            ${t.sections.map(r=>i`<emr-section-card .title=${r.label} .description=${r.description??""}>
                <div style="display:grid;gap:12px;">
                  ${r.blocks.map(a=>a.kind!=="matrix"&&a.kind!=="repeatable"?i`<emr-typed-field
                          .definition=${a}
                          .model=${e?.fields[a.id]}
                          .readOnly=${!!e?.readOnly}
                          @valueChange=${n=>this.emitIntent({type:"fieldEditRequested",fieldId:a.id,value:n.detail})}
                        ></emr-typed-field>`:d)}
                </div>
              </emr-section-card>`)}`:d}
    </form>`}};S([o({attribute:!1})],wt.prototype,"definition",void 0);S([o({attribute:!1})],wt.prototype,"model",void 0);var C=class extends m{constructor(){super(...arguments),this.title="Clinical list",this.items=[],this.readOnly=!1}static{this.styles=[y,T]}render(){return i`<section class="emr-card">
      <header class="emr-header">
        <h3 class="emr-title">${this.title}</h3>
        ${this.readOnly?d:i`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"addRequested"})}>+ Add</button>`}
      </header>
      <ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px;">
        ${this.items.map(t=>i`<li style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid var(--emr-border,#c7d3da);border-radius:var(--emr-radius,8px);">
            <div>
              <strong>${t.title}</strong>
              ${t.subtitle?i`<div class="emr-muted">${t.subtitle}</div>`:d}
            </div>
            ${t.badges?.[0]?i`<emr-badge .badge=${t.badges[0]}></emr-badge>`:d}
          </li>`)}
      </ul>
    </section>`}};S([o({type:String})],C.prototype,"title",void 0);S([o({attribute:!1})],C.prototype,"items",void 0);S([o({type:Boolean})],C.prototype,"readOnly",void 0);var _t=class extends m{static{this.styles=[y,T]}render(){let t=this.definition;return t?i`<section class="emr-card">
      <h3 class="emr-title">${t.label}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Finding</th>
              ${t.columns.map(e=>i`<th>${e.label}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${t.rows.map(e=>i`<tr>
                <th>${e.label}</th>
                ${t.columns.map(r=>{let a=this.model?.[e.id]?.[r.id];return i`<td>${a?.value??"\u2014"}</td>`})}
              </tr>`)}
          </tbody>
        </table>
      </div>
    </section>`:d}};S([o({attribute:!1})],_t.prototype,"definition",void 0);S([o({attribute:!1})],_t.prototype,"model",void 0);var Oi={},zt=class extends m{static{this.styles=[y,T]}render(){let t=this.model;return t?i`<div class="emr-card">
      <div class="toolbar-row" role="toolbar">
        ${t.tools.map(e=>i`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${t.selectedToolId===e.id}
            ?disabled=${!!t.readOnly}
            @click=${()=>this.emitIntent({type:"toolSelected",toolId:e.id})}
          >${e.label}</button>`)}
      </div>
    </div>`:d}};S([o({attribute:!1})],zt.prototype,"model",void 0);var Ft=class extends m{static{this.styles=[y,T]}render(){let t=this.model;return t?i`<section class="emr-card">
      <h4 class="emr-title">Annotations</h4>
      <ol style="margin:0;padding-left:20px;display:grid;gap:6px;">
        ${t.items.map(e=>i`<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <span>${e.layer.label}</span>
            <div class="toolbar-row">
              <button type="button" class="emr-btn emr-btn--secondary" style="min-height:30px;height:30px;padding:0 8px;"
                @click=${()=>this.emitIntent({type:"layerVisibilityToggleRequested",layerId:e.layer.id})}>
                ${x(e.layer.visible===!1?"eye-off":"eye",14)}
              </button>
              <button type="button" class="emr-btn emr-btn--secondary" style="min-height:30px;height:30px;padding:0 8px;"
                @click=${()=>this.emitIntent({type:"layerLockToggleRequested",layerId:e.layer.id})}>
                ${x(e.locked?"lock":"unlock",14)}
              </button>
            </div>
          </li>`)}
      </ol>
    </section>`:d}};S([o({attribute:!1})],Ft.prototype,"model",void 0);var Yt=class extends m{static{this.styles=[y,T]}render(){let t=this.model;return t?i`<section class="emr-card">
      <div class="toolbar-row">
        ${t.options.map(e=>i`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${t.selectedId===e.id}
            @click=${()=>this.emitIntent({type:"templateSelected",templateId:e.id})}
          >${e.label}</button>`)}
      </div>
    </section>`:d}};S([o({attribute:!1})],Yt.prototype,"model",void 0);var Wt=class extends m{static{this.styles=[y,T]}render(){let t=this.model;return t?i`<div class="emr-card">
      <div class="toolbar-row">
        ${t.ticks.map(e=>i`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${t.selectedTickId===e.id}
            @click=${()=>this.emitIntent({type:"tickSelected",tickId:e.id})}
          >${e.label}</button>`)}
      </div>
    </div>`:d}};S([o({attribute:!1})],Wt.prototype,"model",void 0);var Kt=class extends m{static{this.styles=[y,T]}render(){let t=this.model;return t?i`<section class="emr-card">
      ${t.caption?i`<h3 class="emr-title">${t.caption}</h3>`:d}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${t.columns.map(e=>i`<th @click=${()=>e.sortable&&this.emitIntent({type:"sortChanged",columnId:e.id,direction:"asc"})}>
                  ${e.label}
                </th>`)}
            </tr>
          </thead>
          <tbody>
            ${t.rows.map(e=>i`<tr @click=${()=>this.emitIntent({type:"rowActivated",id:e.id})}>
                ${t.columns.map(r=>{let a=e.cells[r.id],n=typeof a=="string"||typeof a=="number"?String(a):a?.text??"\u2014";return i`<td>${n}</td>`})}
              </tr>`)}
          </tbody>
        </table>
      </div>
    </section>`:d}};S([o({attribute:!1})],Kt.prototype,"model",void 0);var At=class extends m{constructor(){super(...arguments),this.columnId=""}render(){return i`<slot></slot>`}};S([o({type:String})],At.prototype,"columnId",void 0);S([o({type:Object})],At.prototype,"cellModel",void 0);function Er(){l("emr-section-card",et),l("emr-repeatable-group",pt),l("emr-clinical-form",wt),l("emr-clinical-list",C),l("emr-clinical-matrix",_t),l("emr-annotation-toolbar",zt),l("emr-annotation-list",Ft),l("emr-image-template-picker",Yt),l("emr-time-axis",Wt),l("emr-data-table",Kt),l("emr-clinical-cell-renderer",At)}var M=function(s,t,e,r){var a=arguments.length,n=a<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,e):r,p;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,r);else for(var h=s.length-1;h>=0;h--)(p=s[h])&&(n=(a<3?p(n):a>3?p(t,e,n):p(t,e))||n);return a>3&&n&&Object.defineProperty(t,e,n),n},L=A`
  .rx-grid {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
  }
  .rx-grid th {
    padding: 8px 10px;
    text-align: left;
    font-size: var(--emr-text-xs, 0.75rem);
    color: var(--emr-text-muted, #5c6c78);
    background: var(--emr-surface-raised, #eff3f5);
    border-bottom: 1px solid var(--emr-border, #c7d3da);
  }
  .rx-grid td {
    padding: 10px;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    vertical-align: top;
  }
  .rx-icon-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 6px;
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .rx-icon-btn--danger {
    border-color: var(--emr-danger, #a44949);
    color: var(--emr-danger, #a44949);
  }
  .rx-mini-stepper {
    display: inline-flex;
    align-items: center;
    height: 30px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: 6px;
    background: var(--emr-surface, #fffefa);
    overflow: hidden;
  }
  .rx-mini-btn {
    width: 24px;
    height: 100%;
    border: 0;
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text, #263847);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .rx-mini-val {
    min-width: 32px;
    padding: 0 6px;
    text-align: center;
    font-family: var(--emr-font-mono, monospace);
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-bold, 700);
  }
`,fe=class extends C{constructor(){super(...arguments),this.title="Medications"}},ge=class extends C{constructor(){super(...arguments),this.title="Allergies"}},ve=class extends C{constructor(){super(...arguments),this.title="Chronic diseases"}},xe=class extends C{constructor(){super(...arguments),this.title="Significant personal history"}},Zt=class extends m{static{this.styles=[y,L]}render(){let t=this.model;if(!t)return d;let e=t.identifiers[0]?.value??t.patientId;return i`<section class="emr-card" part="banner">
      <div class="emr-header">
        <div>
          <h2 class="emr-title">${t.displayName}</h2>
          <p class="emr-muted">${e} · ${t.ageLabel} · ${t.sexLabel} · ${t.careSettingLabel} (${t.locationLabel})</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          ${t.criticality?i`<emr-badge .badge=${t.criticality}></emr-badge>`:d}
          ${t.allergyStatus?i`<emr-badge .badge=${t.allergyStatus}></emr-badge>`:d}
          <button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-expanded=${t.expanded}
            @click=${()=>this.emitIntent({type:"expandedChangeRequested",expanded:!t.expanded})}
          >
            ${t.expanded?"Hide details":"Show details"}
          </button>
        </div>
      </div>
    </section>`}};M([o({attribute:!1})],Zt.prototype,"model",void 0);var Jt=class extends m{static{this.styles=[y,L]}render(){let t=this.model;if(!t)return d;let e=t.slots.map(r=>r.amount??0).join(" - ");return i`<section class="emr-card" part="dose-schedule">
      <div class="emr-header">
        <div>
          <span class="emr-muted">${t.medication.formLabel}</span>
          <h3 class="emr-title">${t.medication.label} ${t.medication.strength??""}</h3>
        </div>
        ${t.status?i`<emr-badge .badge=${t.status}></emr-badge>`:d}
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <strong>${t.frequency.label}</strong>
        ${t.slots.length?i`<span class="emr-badge">${e}</span>`:d}
        ${t.duration?i`<span class="emr-muted">Duration: ${t.duration}</span>`:d}
      </div>
      ${!t.readOnly&&t.canEdit?i`<div><button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"editRequested"})}>Edit schedule</button></div>`:d}
    </section>`}};M([o({attribute:!1})],Jt.prototype,"model",void 0);var Gt=class extends m{static{this.styles=[y,L]}render(){let t=this.model;return t?i`<section class="emr-card">
      <div class="emr-header">
        <h3 class="emr-title">${t.instrumentLabel}</h3>
        ${t.result?i`<span class="emr-badge emr-badge--${t.result.bandTone??"neutral"}">${t.result.total} · ${t.result.bandLabel??""}</span>`:d}
      </div>
      ${t.result?.interpretation?i`<p class="emr-muted">${t.result.interpretation}</p>`:d}
      ${t.canRecompute?i`<div><button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"recomputeRequested",instrumentId:t.id})}>Recompute</button></div>`:d}
    </section>`:d}};M([o({attribute:!1})],Gt.prototype,"model",void 0);var Qt=class extends m{static{this.styles=[y,L]}formatAmt(t,e){let r=t.slots.find(a=>a.id===e)?.amount??0;return r<=0?"0":r===.5?"\xBD":String(r)}render(){let t=this.model;if(!t)return d;let e=!!t.readOnly;return i`<section class="emr-card" part="prescribing-table" style="padding:0;overflow:hidden;">
      <header class="emr-header" style="padding:12px 16px;border-bottom:1px solid var(--emr-border,#c7d3da);background:var(--emr-surface-soft,#f1f4f5);">
        <div>
          <h3 class="emr-title">${t.title??"Medication Prescribing Table"}</h3>
          <p class="emr-muted">Use − / + to step doses & duration, and ↑ / ↓ / + / − to reorder or remove rows.</p>
        </div>
        ${t.status?i`<emr-badge .badge=${t.status}></emr-badge>`:d}
      </header>
      <div style="overflow-x:auto;">
        <table class="rx-grid">
          <thead>
            <tr>
              <th>Drug Name &amp; Strength</th>
              <th>Dose (Qty &amp; Unit)</th>
              <th>Frequency (OD/BD/TDS/HS/SOS · M–A–E–N)</th>
              <th>Route &amp; Site</th>
              <th>Duration (− / +)</th>
              <th>Spcl Instructions</th>
              <th>+ / − / ↑ / ↓</th>
            </tr>
          </thead>
          <tbody>
            ${t.rows.map((r,a)=>{let n=a===0,p=a===t.rows.length-1,h=r.form==="tablet"?.5:1,b=r.doseAmount??r.slots.find(f=>(f.amount??0)>0)?.amount??1;return i`<tr>
                <td>
                  <div style="display:grid;gap:4px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <strong>#${a+1}</strong>
                      <input class="emr-control" style="height:34px;min-height:34px;" .value=${r.drugName} ?readonly=${e} placeholder="Search Backend Formulary API…"
                        @input=${f=>{let w=f.target.value;this.emitIntent({type:"drugNameChanged",rowId:r.id,drugName:w}),this.emitIntent({type:"formularySearchRequested",rowId:r.id,query:w})}} />
                      <input class="emr-control" style="width:84px;height:34px;min-height:34px;" .value=${r.strength} ?readonly=${e} placeholder="500 mg"
                        @input=${f=>this.emitIntent({type:"strengthChanged",rowId:r.id,strength:f.target.value})} />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;font-family:var(--emr-font-mono);">
                      <span class="emr-badge emr-badge--neutral">API Form: ${r.formLabel||r.form}</span>
                      ${r.formularyCode?i`<span class="emr-muted">${r.formularyCode}</span>`:d}
                      ${r.stockStatus?i`<span class="emr-muted">· ${r.stockStatus}</span>`:d}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="rx-mini-stepper">
                    ${e?d:i`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"doseStepped",rowId:r.id,delta:-h})}>${x("minus",12)}</button>`}
                    <span class="rx-mini-val">${b}${r.unitLabel?` ${r.unitLabel}`:""}</span>
                    ${e?d:i`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"doseStepped",rowId:r.id,delta:h})}>${x("plus",12)}</button>`}
                  </div>
                </td>
                <td>
                  <div style="display:grid;gap:4px;">
                    <span style="font-family:var(--emr-font-mono);font-size:12px;font-weight:700;">${r.frequencyCode??""} ${r.patternLabel?`(${r.patternLabel})`:""}</span>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      ${t.slotDefinitions.map(f=>i`<div style="display:grid;gap:2px;">
                          <span class="emr-muted" style="font-size:11px;">${f.shortLabel??f.label}</span>
                          <div class="rx-mini-stepper">
                            ${e?d:i`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"slotStepped",rowId:r.id,slotId:f.id,delta:-h})}>${x("minus",12)}</button>`}
                            <span class="rx-mini-val">${this.formatAmt(r,f.id)}</span>
                            ${e?d:i`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"slotStepped",rowId:r.id,slotId:f.id,delta:h})}>${x("plus",12)}</button>`}
                          </div>
                        </div>`)}
                    </div>
                  </div>
                </td>
                <td>
                  <span style="font-size:12px;">${r.route}${r.site?` \xB7 ${r.site.toUpperCase()}`:""}</span>
                </td>
                <td>
                  <div class="rx-mini-stepper">
                    ${e?d:i`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"durationStepped",rowId:r.id,delta:-1})}>${x("minus",12)}</button>`}
                    <span class="rx-mini-val">${r.durationCount??"\u2014"} ${r.durationUnit}</span>
                    ${e?d:i`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"durationStepped",rowId:r.id,delta:1})}>${x("plus",12)}</button>`}
                  </div>
                </td>
                <td>
                  <input class="emr-control" style="height:34px;min-height:34px;" .value=${r.instructions} ?readonly=${e} placeholder="Spcl instructions…"
                    @input=${f=>this.emitIntent({type:"instructionsChanged",rowId:r.id,instructions:f.target.value})} />
                </td>
                <td>
                  ${e?d:i`<div style="display:grid;gap:4px;">
                        <div style="display:flex;gap:4px;">
                          <button type="button" class="rx-icon-btn" aria-label="Insert row below"
                            @click=${()=>this.emitIntent({type:"rowAddRequested",afterRowId:r.id})}>
                            ${x("plus",13)}
                          </button>
                          <button type="button" class="rx-icon-btn rx-icon-btn--danger" ?disabled=${t.rows.length<=1} aria-label="Remove row"
                            @click=${()=>this.emitIntent({type:"rowRemoveRequested",rowId:r.id})}>
                            ${x("minus",13)}
                          </button>
                          <button type="button" class="rx-icon-btn" ?disabled=${n} aria-label="Move row up"
                            @click=${()=>this.emitIntent({type:"rowMoveRequested",rowId:r.id,direction:"up"})}>
                            ${x("chevron-up",13)}
                          </button>
                          <button type="button" class="rx-icon-btn" ?disabled=${p} aria-label="Move row down"
                            @click=${()=>this.emitIntent({type:"rowMoveRequested",rowId:r.id,direction:"down"})}>
                            ${x("chevron-down",13)}
                          </button>
                        </div>
                        <div style="display:flex;gap:4px;">
                          <button type="button" class="rx-icon-btn" style="width:auto;padding:0 6px;font-size:10px;font-weight:700;" aria-label="Add Step-Down row"
                            @click=${()=>this.emitIntent({type:"rowStepTitrationRequested",rowId:r.id,direction:"down"})}>
                            ↘ Step-Dn
                          </button>
                          <button type="button" class="rx-icon-btn" style="width:auto;padding:0 6px;font-size:10px;font-weight:700;" aria-label="Add Step-Up row"
                            @click=${()=>this.emitIntent({type:"rowStepTitrationRequested",rowId:r.id,direction:"up"})}>
                            ↗ Step-Up
                          </button>
                        </div>
                      </div>`}
                </td>
              </tr>`})}
          </tbody>
        </table>
      </div>
      <footer class="emr-header" style="padding:12px 16px;background:var(--emr-surface-soft,#f1f4f5);">
        ${e?d:i`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"rowAddRequested"})}>+ Add medicine row</button>`}
        ${!t.readOnly&&t.canSign?i`<button type="button" class="emr-btn" @click=${()=>this.emitIntent({type:"signRequested"})}>Sign prescription</button>`:d}
      </footer>
    </section>`}};M([o({attribute:!1})],Qt.prototype,"model",void 0);var u=class extends m{constructor(){super(...arguments),this.headingId="",this.surfaceTitle="Clinical Surface"}static{this.styles=[y,L]}render(){let t=this.model??{},e=typeof t.title=="string"&&t.title||typeof t.displayName=="string"&&t.displayName||this.surfaceTitle;return i`<section class="emr-card" part="surface" aria-labelledby=${this.headingId||d}>
      <header class="emr-header">
        <h3 class="emr-title" id=${this.headingId||d}>${e}</h3>
      </header>
      <slot></slot>
    </section>`}};M([o({attribute:!1})],u.prototype,"model",void 0);M([o({type:String})],u.prototype,"headingId",void 0);var $e=class extends u{constructor(){super(...arguments),this.surfaceTitle="Patient List"}},Se=class extends u{constructor(){super(...arguments),this.surfaceTitle="Encounter Timeline"}},we=class extends u{constructor(){super(...arguments),this.surfaceTitle="Application Shell"}},_e=class extends u{constructor(){super(...arguments),this.surfaceTitle="Primary Navigation"}},Ae=class extends u{constructor(){super(...arguments),this.surfaceTitle="Right Flyout Panel"}},ke=class extends u{constructor(){super(...arguments),this.surfaceTitle="Staged Safety Checklist"}},Ce=class extends u{constructor(){super(...arguments),this.surfaceTitle="Pre-Anaesthesia Checklist"}},Ie=class extends u{constructor(){super(...arguments),this.surfaceTitle="Family Pedigree"}},Oe=class extends u{constructor(){super(...arguments),this.surfaceTitle="Document Upload Queue"}},Te=class extends u{constructor(){super(...arguments),this.surfaceTitle="Patient Documents"}},Me=class extends u{constructor(){super(...arguments),this.surfaceTitle="Document Viewer"}},Pe=class extends u{constructor(){super(...arguments),this.surfaceTitle="Hierarchy Order Picker"}},Re=class extends u{constructor(){super(...arguments),this.surfaceTitle="Order Details"}},Ne=class extends u{constructor(){super(...arguments),this.surfaceTitle="Favourites Panel"}},Le=class extends u{constructor(){super(...arguments),this.surfaceTitle="Clinical Annotation Canvas"}},Ue=class extends u{constructor(){super(...arguments),this.surfaceTitle="Diagnostic Result Summary"}},De=class extends u{constructor(){super(...arguments),this.surfaceTitle="Spectacle Prescription"}},je=class extends u{constructor(){super(...arguments),this.surfaceTitle="OCT Finding Record"}},Be=class extends u{constructor(){super(...arguments),this.surfaceTitle="Meridian Cross"}},qe=class extends u{constructor(){super(...arguments),this.surfaceTitle="Ocular Motility Chart"}},He=class extends u{constructor(){super(...arguments),this.surfaceTitle="Observation Flowsheet"}},Ve=class extends u{constructor(){super(...arguments),this.surfaceTitle="Observation Trend"}},ze=class extends u{constructor(){super(...arguments),this.surfaceTitle="Clinical Transcript"}},Fe=class extends u{constructor(){super(...arguments),this.surfaceTitle="Evidence Suggestion List"}},Ye=class extends u{constructor(){super(...arguments),this.surfaceTitle="Capture Status Bar"}},We=class extends u{constructor(){super(...arguments),this.surfaceTitle="Medication Reconciliation"}},Ke=class extends u{constructor(){super(...arguments),this.surfaceTitle="OPD Work Queue"}},Ze=class extends u{constructor(){super(...arguments),this.surfaceTitle="Consent Capture"}},Je=class extends u{constructor(){super(...arguments),this.surfaceTitle="Consent Review"}},Ge=class extends u{constructor(){super(...arguments),this.surfaceTitle="Consent Receipt"}},Qe=class extends u{constructor(){super(...arguments),this.surfaceTitle="Consent Status Badge"}},Xe=class extends u{constructor(){super(...arguments),this.surfaceTitle="Data Sharing Grants"}},Ee=class extends u{constructor(){super(...arguments),this.surfaceTitle="Access Log"}},tr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Rights Requests"}},er=class extends u{constructor(){super(...arguments),this.surfaceTitle="Privacy Centre"}},rr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Patient Identity Card"}},sr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Identifier Check Prompt"}},ir=class extends u{constructor(){super(...arguments),this.surfaceTitle="Link Cards"}},ar=class extends u{constructor(){super(...arguments),this.surfaceTitle="Contact Attempt Form"}},or=class extends u{constructor(){super(...arguments),this.surfaceTitle="Contact Attempt Summary"}},nr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Merge Compare"}},lr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Draft Record List"}},dr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Arrival Linker"}},pr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Spectacle Delivery"}},cr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Booked Not Delivered List"}},ur=class extends u{constructor(){super(...arguments),this.surfaceTitle="Cataract Episode Card"}},hr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Patient History Timeline"}},mr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Record Diff"}},yr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Upload Queue"}},br=class extends u{constructor(){super(...arguments),this.surfaceTitle="Bar Chart"}},fr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Funnel Chart"}},gr=class extends u{constructor(){super(...arguments),this.surfaceTitle="PIN Pad"}},vr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Login Form"}},xr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Bottom Tab Bar"}},$r=class extends u{constructor(){super(...arguments),this.surfaceTitle="Sync Status Pill"}},Sr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Toast Notification"}},wr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Modal Sheet"}},_r=class extends u{constructor(){super(...arguments),this.surfaceTitle="Top Bar Search"}},Ar=class extends u{constructor(){super(...arguments),this.surfaceTitle="Application Top Bar"}},Xt=class extends m{static{this.styles=[y,L]}render(){let t=this.model;if(!t)return d;let e=t.studies.find(r=>r.id===t.activeStudyId)??t.studies[0];return i`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="emr-badge emr-badge--info">DICOMweb PACS</span>
            <strong>${t.title??"Multi-Viewport PACS & DICOMweb Compare Viewer"}</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${["1-up","2-up-od-os","2-up-compare"].map(r=>i`<button type="button" class="emr-btn emr-btn--small ${t.layoutMode===r?"emr-btn--primary":""}"
                @click=${()=>this.emitIntent({type:"layoutModeChanged",layoutMode:r})}>
                ${r==="1-up"?"\u25A3 1-Up Single":r==="2-up-od-os"?"\u25EB 2-Up OD vs OS":"\u21C4 2-Up Active vs Prior"}
              </button>`)}
          </div>
        </header>

        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${t.studies.map(r=>i`<button type="button" class="emr-btn emr-btn--small ${r.id===e?.id?"emr-btn--primary":""}"
              @click=${()=>this.emitIntent({type:"studySelected",studyId:r.id})}>
              [${r.modality}] ${r.bodyPart} (${r.accessionNumber})
            </button>`)}
        </div>

        ${e?i`
              <div style="padding:12px;border-radius:8px;background:#09111a;color:#e2e8f0;font-family:var(--emr-font-mono);display:grid;gap:8px;">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;font-size:12px;color:#38bdf8;">
                  <strong>[${e.modality}] ${e.title} (${t.layoutMode.toUpperCase()})</strong>
                  <span>Slice ${e.currentSlice}/${e.sliceCount} · W/L: ${e.windowPreset} · Zoom: ${e.zoomPercent}%</span>
                </div>
                <div style="color:#f59e0b;font-size:12px;font-weight:700;">Caliper: ${e.caliperMeasurementLabel??"\u2014"}</div>
                <div style="font-size:12px;font-family:var(--emr-font-family);color:#cbd5e1;">${e.radiologistImpression}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button type="button" class="emr-btn emr-btn--small" @click=${()=>this.emitIntent({type:"sliceStepped",studyId:e.id,delta:-1})}>− Slice</button>
                  <button type="button" class="emr-btn emr-btn--small" @click=${()=>this.emitIntent({type:"sliceStepped",studyId:e.id,delta:1})}>+ Slice</button>
                  <button type="button" class="emr-btn emr-btn--small" @click=${()=>this.emitIntent({type:"invertToggled",studyId:e.id})}>Invert LUT</button>
                  <button type="button" class="emr-btn emr-btn--small emr-btn--primary" @click=${()=>this.emitIntent({type:"impressionPulledToNote",studyId:e.id,text:e.radiologistImpression})}>↳ Pull Impression to Note</button>
                </div>
              </div>
            `:d}
      </section>
    `}};M([o({type:Object})],Xt.prototype,"model",void 0);var Et=class extends m{static{this.styles=[y,L]}render(){let t=this.model;return t?i`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="emr-badge emr-badge--info">SPECIALTY EXAM</span>
            <strong>${t.title??"Multi-Specialty Examination & Dosing Matrix"}</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${["ophthalmology","pediatrics","dermatology","oncology"].map(e=>i`<button type="button" class="emr-btn emr-btn--small ${t.activeSpecialty===e?"emr-btn--primary":""}"
                @click=${()=>this.emitIntent({type:"specialtyChanged",specialty:e})}>
                ${e.toUpperCase()}
              </button>`)}
          </div>
        </header>

        ${t.activeSpecialty==="ophthalmology"?i`
              <div style="display:flex;gap:6px;">
                <button type="button" class="emr-btn emr-btn--small" @click=${()=>this.emitIntent({type:"ophthalmicApplyWnlAll"})}>✓ All WNL (OU)</button>
                <button type="button" class="emr-btn emr-btn--small" @click=${()=>this.emitIntent({type:"ophthalmicCopyOdToOs"})}>⇄ Copy OD → OS</button>
              </div>
              <table class="rx-grid" style="min-width:600px;">
                <thead><tr><th>Ocular Structure</th><th>Right Eye (OD)</th><th>Left Eye (OS)</th></tr></thead>
                <tbody>
                  ${t.ophthalmicRows.map(e=>i`<tr>
                      <td><strong>${e.structureLabel}</strong><div class="emr-muted" style="font-size:11px;">${e.segment}</div></td>
                      <td>${e.odValue}</td>
                      <td>${e.osValue}</td>
                    </tr>`)}
                </tbody>
              </table>
            `:t.activeSpecialty==="pediatrics"?i`<div style="padding:10px;border-radius:8px;background:var(--emr-surface-soft);font-family:var(--emr-font-mono);">
                Weight: <strong>${t.pediatrics.weightKg} kg</strong> (${t.pediatrics.weightCentileLabel}) · Target: ${t.pediatrics.targetDrugLabel} = <strong>${t.pediatrics.calculatedMgPerDose} mg (${t.pediatrics.calculatedMlPerDose} mL via Oral Syringe)</strong>
              </div>`:t.activeSpecialty==="dermatology"?i`<div style="padding:10px;border-radius:8px;background:var(--emr-surface-soft);font-family:var(--emr-font-mono);">
                  Affected BSA: <strong>${t.dermatology.totalBsaPercent}%</strong> · Single Application: <strong>${t.dermatology.totalFtuPerApp} FTU</strong> · 14d BD Total: <strong>${t.dermatology.totalGramsFor14DaysBd} g</strong>
                </div>`:i`<div style="padding:10px;border-radius:8px;background:var(--emr-surface-soft);font-family:var(--emr-font-mono);">
                  <strong>${t.oncology.regimenName}</strong> · Cycle ${t.oncology.cycleNumber} · BSA: ${t.oncology.bsaM2} m² · Dose Level: ${t.oncology.doseReductionPercent}% · ANC: ${t.oncology.ancCountLabel}
                </div>`}
      </section>
    `:d}};M([o({type:Object})],Et.prototype,"model",void 0);var te=class extends m{static{this.styles=[y,L]}render(){let t=this.model;return t?i`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <strong>${t.title??"Inpatient eMAR & Nursing Kardex"}</strong>
            <div class="emr-muted" style="font-size:12px;font-family:var(--emr-font-mono);">${t.wardBedLabel} · ${t.shiftLabel} · Nurse: ${t.nurseLabel}</div>
          </div>
          <span class="emr-badge emr-badge--success">BCMA Barcode Verified</span>
        </header>
        <div style="overflow-x:auto;">
          <table class="rx-grid" style="min-width:740px;">
            <thead>
              <tr>
                <th>Ordered Medication (Backend API Form &amp; Route)</th>
                ${t.timeColumns.map(e=>i`<th>${e.timeLabel} (${e.slotLabel})</th>`)}
              </tr>
            </thead>
            <tbody>
              ${t.orders.map(e=>i`<tr>
                  <td>
                    <strong>${e.drugName} ${e.strength}</strong>
                    <div class="emr-muted" style="font-size:11px;font-family:var(--emr-font-mono);">
                      API Form: ${e.formLabel} · ${e.doseLabel} · ${e.frequencyCode} · ${e.routeLabel}
                    </div>
                  </td>
                  ${t.timeColumns.map(r=>{let n=e.administrations.find(p=>p.slotId===r.id)?.status??"not-due";return i`<td>
                      <button type="button" class="emr-btn emr-btn--small ${n==="given"?"emr-btn--primary":""}"
                        ?disabled=${n==="not-due"}
                        @click=${()=>this.emitIntent({type:"slotStatusCycled",orderId:e.id,slotId:r.id})}>
                        ${n.toUpperCase()}
                      </button>
                    </td>`})}
                </tr>`)}
            </tbody>
          </table>
        </div>
      </section>
    `:d}};M([o({type:Object})],te.prototype,"model",void 0);var ee=class extends m{static{this.styles=[y,L]}render(){let t=this.model;return t?i`
      <section class="emr-card" style="padding:16px;display:grid;gap:12px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-bottom:2px solid var(--emr-primary);padding-bottom:10px;">
          <div>
            <strong>${t.facilityName}</strong>
            <div class="emr-muted" style="font-size:12px;">${t.facilityDepartment} · ${t.documentMode==="opd-rx"?"OPD PRESCRIPTION":"IPD DISCHARGE SUMMARY"}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="emr-btn emr-btn--small ${t.documentMode==="opd-rx"?"emr-btn--primary":""}"
              @click=${()=>this.emitIntent({type:"documentModeChanged",mode:"opd-rx"})}>OPD Rx</button>
            <button type="button" class="emr-btn emr-btn--small ${t.documentMode==="ipd-discharge"?"emr-btn--primary":""}"
              @click=${()=>this.emitIntent({type:"documentModeChanged",mode:"ipd-discharge"})}>IPD Summary</button>
            <button type="button" class="emr-btn emr-btn--small emr-btn--primary"
              @click=${()=>this.emitIntent({type:"printTriggered"})}>Print (.emr-print)</button>
          </div>
        </header>
        <div style="font-size:12px;">
          <strong>Patient:</strong> ${t.patientName} (${t.patientAgeSex}) · <strong>Encounter:</strong> ${t.encounterId} · <strong>Allergies:</strong> ${t.allergiesSummary.join(", ")}
        </div>
        <table class="rx-grid" style="min-width:680px;">
          <thead>
            <tr>
              <th>1. Drug &amp; API Form</th>
              <th>2. Dose Qty</th>
              <th>3. Freq (M-A-E-N)</th>
              <th>4. Route/Site</th>
              <th>5. Duration &amp; Dispense</th>
              <th>6. Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${t.prescriptions.map((e,r)=>i`<tr>
                <td><strong>${r+1}. ${e.drugName} ${e.strength}</strong><div class="emr-muted" style="font-size:11px;">API Form: ${e.formLabel}</div></td>
                <td>${e.doseQtyUnit}</td>
                <td><strong>${e.frequencyPattern}</strong></td>
                <td>${e.routeSite}</td>
                <td>${e.durationLabel} ${e.dispenseTotalLabel?i`<div style="color:var(--emr-success);font-weight:700;font-size:11px;">${e.dispenseTotalLabel}</div>`:d}</td>
                <td>${e.instructions}</td>
              </tr>`)}
          </tbody>
        </table>
      </section>
    `:d}};M([o({type:Object})],ee.prototype,"model",void 0);function ts(){l("emr-medication-list",fe),l("emr-allergy-list",ge),l("emr-chronic-disease-list",ve),l("emr-personal-history-list",xe),l("emr-patient-banner",Zt),l("emr-patient-list",$e),l("emr-timeline",Se),l("emr-app-shell",we),l("emr-left-nav",_e),l("emr-right-flyout",Ae),l("emr-staged-checklist",ke),l("emr-pac-checklist",Ce),l("emr-family-pedigree",Ie),l("emr-document-upload-queue",Oe),l("emr-patient-documents",Te),l("emr-document-viewer",Me),l("emr-hierarchy-order-picker",Pe),l("emr-order-details",Re),l("emr-favourites-panel",Ne),l("emr-clinical-annotation-canvas",Le),l("emr-diagnostic-result-summary",Ue),l("emr-spectacle-prescription",De),l("emr-dose-schedule",Jt),l("emr-prescribing-table",Qt),l("emr-oct-finding-record",je),l("emr-meridian-cross",Be),l("emr-ocular-motility-chart",qe),l("emr-observation-flowsheet",He),l("emr-observation-trend",Ve),l("emr-clinical-transcript",ze),l("emr-evidence-suggestion-list",Fe),l("emr-capture-status-bar",Ye),l("emr-score-result-card",Gt),l("emr-medication-reconciliation",We),l("emr-work-queue",Ke),l("emr-consent-capture",Ze),l("emr-consent-review",Je),l("emr-consent-receipt",Ge),l("emr-consent-status-badge",Qe),l("emr-sharing-grants",Xe),l("emr-access-log",Ee),l("emr-rights-requests",tr),l("emr-privacy-centre",er),l("emr-patient-identity-card",rr),l("emr-identifier-check-prompt",sr),l("emr-link-cards",ir),l("emr-contact-attempt-form",ar),l("emr-contact-attempt-summary",or),l("emr-merge-compare",nr),l("emr-draft-record-list",lr),l("emr-arrival-linker",dr),l("emr-spectacle-delivery",pr),l("emr-booked-not-delivered-list",cr),l("emr-cataract-episode-card",ur),l("emr-patient-history-timeline",hr),l("emr-record-diff",mr),l("emr-upload-queue",yr),l("emr-bar-chart",br),l("emr-funnel-chart",fr),l("emr-pin-pad",gr),l("emr-login-form",vr),l("emr-bottom-tab-bar",xr),l("emr-sync-pill",$r),l("emr-toast",Sr),l("emr-sheet",wr),l("emr-top-bar-search",_r),l("emr-top-bar",Ar),l("emr-pacs-viewer",Xt),l("emr-specialty-exam-matrix",Et),l("emr-inpatient-mar",te),l("emr-encounter-summary-print",ee)}var gs=function(s,t,e,r){var a=arguments.length,n=a<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,e):r,p;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(s,t,e,r);else for(var h=s.length-1;h>=0;h--)(p=s[h])&&(n=(a<3?p(n):a>3?p(t,e,n):p(t,e))||n);return a>3&&n&&Object.defineProperty(t,e,n),n},kr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Field Generator"}},Cr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Terminology Search"}},Ir=class extends u{constructor(){super(...arguments),this.surfaceTitle="Validation Rule Editor"}},Or=class extends u{constructor(){super(...arguments),this.surfaceTitle="Field Library Picker"}},Tr=class extends u{constructor(){super(...arguments),this.surfaceTitle="EHR Template Composer"}},Mr=class extends u{constructor(){super(...arguments),this.surfaceTitle="Template Preview"}},vs=A`
  .customizer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 12px;
  }
  .pill-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
`,re=class extends m{constructor(){super(...arguments),this.config={...Jr}}static{this.styles=[y,vs]}updateConfig(t){this.config={...this.config,...t},Gr(this.config),this.emitValueChange(this.config),this.emitIntent({type:"themeConfigChanged",config:this.config})}render(){let t=this.config;return i`<section class="emr-card" part="customizer">
      <header class="emr-header">
        <div>
          <h3 class="emr-title">End-User Design & Typography Customizer</h3>
          <p class="emr-muted">Customize brand palette, border radius, control density, clinical font stack, and text scale at runtime.</p>
        </div>
      </header>
      <div class="customizer-grid">
        <div class="emr-field">
          <span class="emr-label">Brand Palette</span>
          <div class="pill-row">
            ${Object.keys(Pt).map(e=>{let r=Pt[e].light;return i`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${t.preset===e}
                @click=${()=>this.updateConfig({preset:e})}
              >
                <span class="swatch" style="background:${r.primary};"></span>
                ${r.label}
              </button>`})}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Corner Shape (Radius)</span>
          <div class="pill-row">
            ${Object.keys(Rt).map(e=>i`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${t.radius===e}
                @click=${()=>this.updateConfig({radius:e})}
              >${Rt[e].label}</button>`)}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Control Density</span>
          <div class="pill-row">
            ${Object.keys(Nt).map(e=>i`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${t.density===e}
                @click=${()=>this.updateConfig({density:e})}
              >${Nt[e].label}</button>`)}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Typography & Font Scale</span>
          <div class="pill-row">
            ${Object.keys(vt).map(e=>i`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:34px;height:34px;padding:0 10px;"
                aria-pressed=${t.fontStack===e}
                @click=${()=>this.updateConfig({fontStack:e})}
              >${vt[e].label}</button>`)}
          </div>
          <div class="pill-row" style="margin-top:4px;">
            ${["0.9","1","1.1","1.2"].map(e=>i`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="min-height:30px;height:30px;padding:0 10px;"
                aria-pressed=${t.fontScale===e}
                @click=${()=>this.updateConfig({fontScale:e})}
              >${Math.round(Number(e)*100)}%</button>`)}
          </div>
        </div>
      </div>
    </section>`}};gs([o({attribute:!1})],re.prototype,"config",void 0);function es(){l("emr-field-generator",kr),l("emr-terminology-search",Cr),l("emr-validation-rule-editor",Ir),l("emr-field-library-picker",Or),l("emr-template-composer",Tr),l("emr-template-preview",Mr),l("emr-theme-customizer",re)}function xs(){Qr(),Xr(),Er(),ts(),es()}typeof customElements<"u"&&xs();export{Jr as DEFAULT_EMR_CUSTOM_THEME,Nt as EMR_DENSITY_MAP,vt as EMR_FONT_STACKS,Pt as EMR_PALETTE_PRESETS,Rt as EMR_RADIUS_MAP,Ee as EmrAccessLogElement,xt as EmrAlertElement,ge as EmrAllergyListElement,Ft as EmrAnnotationListElement,zt as EmrAnnotationToolbarElement,we as EmrAppShellElement,dr as EmrArrivalLinkerElement,Ht as EmrAttestationElement,Q as EmrBadgeElement,br as EmrBarChartElement,cr as EmrBookedNotDeliveredListElement,xr as EmrBottomTabBarElement,it as EmrButtonElement,Ye as EmrCaptureStatusBarElement,Dt as EmrCardElement,ur as EmrCataractEpisodeCardElement,G as EmrCheckboxElement,be as EmrChipElement,ve as EmrChronicDiseaseListElement,Le as EmrClinicalAnnotationCanvasElement,At as EmrClinicalCellRendererElement,wt as EmrClinicalFormElement,C as EmrClinicalListElement,_t as EmrClinicalMatrixElement,ze as EmrClinicalTranscriptElement,qt as EmrCodedInputElement,jt as EmrColumnsElement,Ze as EmrConsentCaptureElement,Ge as EmrConsentReceiptElement,Je as EmrConsentReviewElement,Qe as EmrConsentStatusBadgeElement,ar as EmrContactAttemptFormElement,or as EmrContactAttemptSummaryElement,u as EmrControlledDomainElement,Oi as EmrCustomRenderers,Kt as EmrDataTableElement,O as EmrDateInputElement,q as EmrDateTimeInputElement,Ue as EmrDiagnosticResultSummaryElement,Oe as EmrDocumentUploadQueueElement,Me as EmrDocumentViewerElement,Jt as EmrDoseScheduleElement,lr as EmrDraftRecordListElement,ee as EmrEncounterSummaryPrintElement,Fe as EmrEvidenceSuggestionListElement,Ie as EmrFamilyPedigreeElement,Ne as EmrFavouritesPanelElement,tt as EmrFieldFrameElement,kr as EmrFieldGeneratorElement,Or as EmrFieldLibraryPickerElement,E as EmrFieldValueRowElement,fr as EmrFunnelChartElement,Pe as EmrHierarchyOrderPickerElement,sr as EmrIdentifierCheckPromptElement,Vt as EmrIdentifierEntryElement,Yt as EmrImageTemplatePickerElement,te as EmrInpatientMarElement,_e as EmrLeftNavElement,X as EmrLikertElement,ir as EmrLinkCardsElement,m as EmrLitElement,vr as EmrLoginFormElement,fe as EmrMedicationListElement,We as EmrMedicationReconciliationElement,nr as EmrMergeCompareElement,Be as EmrMeridianCrossElement,k as EmrNumberInputElement,He as EmrObservationFlowsheetElement,Ve as EmrObservationTrendElement,je as EmrOctFindingRecordElement,qe as EmrOcularMotilityChartElement,Re as EmrOrderDetailsElement,Ce as EmrPacChecklistElement,Xt as EmrPacsViewerElement,V as EmrPairedInputElement,Zt as EmrPatientBannerElement,Te as EmrPatientDocumentsElement,hr as EmrPatientHistoryTimelineElement,rr as EmrPatientIdentityCardElement,$e as EmrPatientListElement,xe as EmrPersonalHistoryListElement,gr as EmrPinPadElement,Qt as EmrPrescribingTableElement,er as EmrPrivacyCentreElement,H as EmrQuantityInputElement,z as EmrRadioGroupElement,mr as EmrRecordDiffElement,pt as EmrRepeatableGroupElement,Ae as EmrRightFlyoutElement,tr as EmrRightsRequestsElement,N as EmrScheduleSlotPickerElement,Gt as EmrScoreResultCardElement,ot as EmrSearchSelectElement,et as EmrSectionCardElement,J as EmrSelectElement,Ut as EmrSeparatorElement,Xe as EmrSharingGrantsElement,wr as EmrSheetElement,Et as EmrSpecialtyExamMatrixElement,pr as EmrSpectacleDeliveryElement,De as EmrSpectaclePrescriptionElement,St as EmrStageStepperElement,ke as EmrStagedChecklistElement,Bt as EmrStatTileElement,at as EmrStateMessageElement,nt as EmrStatusCellElement,$r as EmrSyncPillElement,$t as EmrTabsElement,Tr as EmrTemplateComposerElement,Mr as EmrTemplatePreviewElement,Cr as EmrTerminologySearchElement,I as EmrTextInputElement,re as EmrThemeCustomizerElement,Wt as EmrTimeAxisElement,B as EmrTimeInputElement,Se as EmrTimelineElement,Sr as EmrToastElement,ye as EmrToggleElement,Ar as EmrTopBarElement,_r as EmrTopBarSearchElement,lt as EmrTypedFieldElement,yr as EmrUploadQueueElement,Ir as EmrValidationRuleEditorElement,F as EmrVasElement,Ke as EmrWorkQueueElement,Gr as applyEmrCustomTheme,l as defineEmrElement,y as emrShadowStyles,xs as registerAllEmrElements,Qr as registerL1Elements,Xr as registerL2Elements,Er as registerL3Elements,ts as registerL4Elements,es as registerL6Elements,x as renderEmrSvgIcon,ys as resolveEmrThemeVariables};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
@lit/reactive-element/decorators/custom-element.js:
@lit/reactive-element/decorators/property.js:
@lit/reactive-element/decorators/state.js:
@lit/reactive-element/decorators/event-options.js:
@lit/reactive-element/decorators/base.js:
@lit/reactive-element/decorators/query.js:
@lit/reactive-element/decorators/query-all.js:
@lit/reactive-element/decorators/query-async.js:
@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
