var he=class{state;listeners=new Set;destroyed=!1;constructor(e){this.state=e}getSnapshot(){return this.state}subscribe(e){return this.destroyed?()=>{}:(this.listeners.add(e),e(this.state),()=>this.listeners.delete(e))}setState(e){if(this.destroyed)return;let t=typeof e=="function"?e(this.state):e;if(!this.destroyed){this.state=t;for(let i of this.listeners){if(this.destroyed)break;i(this.state)}}}isDestroyed(){return this.destroyed}destroy(){this.destroyed||(this.destroyed=!0,this.listeners.clear(),this.onDestroy())}onDestroy(){}};var hr=class extends he{validateCell;constructor(e,t,i){super({schema:e,values:t}),this.validateCell=i}dispatch(e){if(!this.isDestroyed())switch(e.type){case"cellEditRequested":{this.setState(t=>{let i=t.schema.rows.find(f=>f.id===e.rowId),r=t.schema.columns.find(f=>f.id===e.columnId);if(!i||!r||i.applicableColumnIds&&!i.applicableColumnIds.includes(e.columnId))return t;let a=t.values[e.rowId];if(!a)return t;let l=a.cells[e.columnId];if(!l||l.readOnly||l.disabled)return t;let c={...l,value:e.value},p={...t,values:{...t.values,[e.rowId]:{...a,cells:{...a.cells,[e.columnId]:c}}}},h=this.validateCell?.(p,e.rowId,e.columnId);return{...p,values:{...p.values,[e.rowId]:{...p.values[e.rowId],cells:{...p.values[e.rowId]?.cells,[e.columnId]:{...c,error:h}}}}}});break}case"cellAssessmentStatusEditRequested":{this.setState(t=>{let i=t.values[e.rowId],r=i?.cells[e.columnId],a=t.schema.rows.find(p=>p.id===e.rowId)?.assessmentStatusOptions?.find(p=>p.value===e.status);if(!i||!r||r.readOnly||r.disabled||e.status!==null&&!a)return t;let{assessmentStatus:l,...c}=r;return{...t,values:{...t.values,[e.rowId]:{...i,cells:{...i.cells,[e.columnId]:a?{...r,assessmentStatus:a}:c}}}}});break}case"remarkEditRequested":{this.setState(t=>{let i=t.values[e.rowId];return!i||i.remarkReadOnly||i.remarkDisabled?t:{...t,values:{...t.values,[e.rowId]:{...i,remark:e.remark}}}});break}case"columnCopyRequested":{this.setState(t=>{let i={...t.values};for(let r of t.schema.rows){let a=i[r.id];if(!a)continue;let l=a.cells[e.fromColumnId],c=a.cells[e.toColumnId];!l||!c||c.readOnly||c.disabled||(i[r.id]={...a,cells:{...a.cells,[e.toColumnId]:{...c,value:l.value,modified:!0}}})}return{...t,values:i,lastExternalIntent:e}});break}case"cellFocused":case"customCellIntent":case"macroNormalRequested":this.setState(t=>({...t,lastExternalIntent:e}));break;default:this.assertNever(e)}}assertNever(e){throw new Error(`Unsupported clinical matrix intent: ${JSON.stringify(e)}`)}};var sn={id:"controller-matrix-example",label:"Fundus findings (controller example)",columns:[{id:"od",label:"Right eye (OD)"},{id:"os",label:"Left eye (OS)"}],rows:[{id:"disc",label:"Optic disc",type:"text"}]},on={disc:{cells:{od:{value:null},os:{value:"Supplied OS finding"}},remark:""}};var ur=globalThis,mr=ur.ShadowRoot&&(ur.ShadyCSS===void 0||ur.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,wa=Symbol(),nn=new WeakMap,Di=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==wa)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(mr&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=nn.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&nn.set(t,e))}return e}toString(){return this.cssText}},ln=n=>new Di(typeof n=="string"?n:n+"",void 0,wa),M=(n,...e)=>{let t=n.length===1?n[0]:e.reduce((i,r,a)=>i+(l=>{if(l._$cssResult$===!0)return l.cssText;if(typeof l=="number")return l;throw Error("Value passed to 'css' function must be a 'css' function result: "+l+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+n[a+1],n[0]);return new Di(t,n,wa)},dn=(n,e)=>{if(mr)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),r=ur.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,n.appendChild(i)}},Sa=mr?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return ln(t)})(n):n;var{is:Vl,defineProperty:jl,getOwnPropertyDescriptor:zl,getOwnPropertyNames:Fl,getOwnPropertySymbols:Ul,getPrototypeOf:Gl}=Object,gr=globalThis,cn=gr.trustedTypes,Yl=cn?cn.emptyScript:"",Wl=gr.reactiveElementPolyfillSupport,Ti=(n,e)=>n,Mi={toAttribute(n,e){switch(e){case Boolean:n=n?Yl:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},br=(n,e)=>!Vl(n,e),pn={attribute:!0,type:String,converter:Mi,reflect:!1,useDefault:!1,hasChanged:br};Symbol.metadata??=Symbol("metadata"),gr.litPropertyMetadata??=new WeakMap;var it=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=pn){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&jl(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){let{get:r,set:a}=zl(this.prototype,e)??{get(){return this[t]},set(l){this[t]=l}};return{get:r,set(l){let c=r?.call(this);a?.call(this,l),this.requestUpdate(e,c,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??pn}static _$Ei(){if(this.hasOwnProperty(Ti("elementProperties")))return;let e=Gl(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(Ti("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Ti("properties"))){let t=this.properties,i=[...Fl(t),...Ul(t)];for(let r of i)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let r of i)t.unshift(Sa(r))}else e!==void 0&&t.push(Sa(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return dn(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){let a=(i.converter?.toAttribute!==void 0?i.converter:Mi).toAttribute(t,i.type);this._$Em=e,a==null?this.removeAttribute(r):this.setAttribute(r,a),this._$Em=null}}_$AK(e,t){let i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let a=i.getPropertyOptions(r),l=typeof a.converter=="function"?{fromAttribute:a.converter}:a.converter?.fromAttribute!==void 0?a.converter:Mi;this._$Em=r;let c=l.fromAttribute(t,a.type);this[r]=c??this._$Ej?.get(r)??c,this._$Em=null}}requestUpdate(e,t,i,r=!1,a){if(e!==void 0){let l=this.constructor;if(r===!1&&(a=this[e]),i??=l.getPropertyOptions(e),!((i.hasChanged??br)(a,t)||i.useDefault&&i.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(l._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:a},l){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,l??t??this[e]),a!==!0||l!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,a]of this._$Ep)this[r]=a;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[r,a]of i){let{wrapped:l}=a,c=this[r];l!==!0||this._$AL.has(r)||c===void 0||this.C(r,void 0,a,c)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};it.elementStyles=[],it.shadowRootOptions={mode:"open"},it[Ti("elementProperties")]=new Map,it[Ti("finalized")]=new Map,Wl?.({ReactiveElement:it}),(gr.reactiveElementVersions??=[]).push("2.1.2");var Ia=globalThis,hn=n=>n,fr=Ia.trustedTypes,un=fr?fr.createPolicy("lit-html",{createHTML:n=>n}):void 0,Ca="$lit$",rt=`lit$${Math.random().toFixed(9).slice(2)}$`,Ra="?"+rt,Kl=`<${Ra}>`,_t=document,Bi=()=>_t.createComment(""),_i=n=>n===null||typeof n!="object"&&typeof n!="function",Oa=Array.isArray,vn=n=>Oa(n)||typeof n?.[Symbol.iterator]=="function",ka=`[ 	
\f\r]`,Ni=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,mn=/-->/g,gn=/>/g,Nt=RegExp(`>|${ka}(?:([^\\s"'>=/]+)(${ka}*=${ka}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),bn=/'/g,fn=/"/g,$n=/^(?:script|style|textarea|title)$/i,Aa=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),s=Aa(1),O=Aa(2),lc=Aa(3),Ae=Symbol.for("lit-noChange"),o=Symbol.for("lit-nothing"),yn=new WeakMap,Bt=_t.createTreeWalker(_t,129);function xn(n,e){if(!Oa(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return un!==void 0?un.createHTML(e):e}var wn=(n,e)=>{let t=n.length-1,i=[],r,a=e===2?"<svg>":e===3?"<math>":"",l=Ni;for(let c=0;c<t;c++){let p=n[c],h,f,g=-1,v=0;for(;v<p.length&&(l.lastIndex=v,f=l.exec(p),f!==null);)v=l.lastIndex,l===Ni?f[1]==="!--"?l=mn:f[1]!==void 0?l=gn:f[2]!==void 0?($n.test(f[2])&&(r=RegExp("</"+f[2],"g")),l=Nt):f[3]!==void 0&&(l=Nt):l===Nt?f[0]===">"?(l=r??Ni,g=-1):f[1]===void 0?g=-2:(g=l.lastIndex-f[2].length,h=f[1],l=f[3]===void 0?Nt:f[3]==='"'?fn:bn):l===fn||l===bn?l=Nt:l===mn||l===gn?l=Ni:(l=Nt,r=void 0);let b=l===Nt&&n[c+1].startsWith("/>")?" ":"";a+=l===Ni?p+Kl:g>=0?(i.push(h),p.slice(0,g)+Ca+p.slice(g)+rt+b):p+rt+(g===-2?c:b)}return[xn(n,a+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},Hi=class n{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let a=0,l=0,c=e.length-1,p=this.parts,[h,f]=wn(e,t);if(this.el=n.createElement(h,i),Bt.currentNode=this.el.content,t===2||t===3){let g=this.el.content.firstChild;g.replaceWith(...g.childNodes)}for(;(r=Bt.nextNode())!==null&&p.length<c;){if(r.nodeType===1){if(r.hasAttributes())for(let g of r.getAttributeNames())if(g.endsWith(Ca)){let v=f[l++],b=r.getAttribute(g).split(rt),x=/([.?@])?(.*)/.exec(v);p.push({type:1,index:a,name:x[2],strings:b,ctor:x[1]==="."?vr:x[1]==="?"?$r:x[1]==="@"?xr:Vt}),r.removeAttribute(g)}else g.startsWith(rt)&&(p.push({type:6,index:a}),r.removeAttribute(g));if($n.test(r.tagName)){let g=r.textContent.split(rt),v=g.length-1;if(v>0){r.textContent=fr?fr.emptyScript:"";for(let b=0;b<v;b++)r.append(g[b],Bi()),Bt.nextNode(),p.push({type:2,index:++a});r.append(g[v],Bi())}}}else if(r.nodeType===8)if(r.data===Ra)p.push({type:2,index:a});else{let g=-1;for(;(g=r.data.indexOf(rt,g+1))!==-1;)p.push({type:7,index:a}),g+=rt.length-1}a++}}static createElement(e,t){let i=_t.createElement("template");return i.innerHTML=e,i}};function Ht(n,e,t=n,i){if(e===Ae)return e;let r=i!==void 0?t._$Co?.[i]:t._$Cl,a=_i(e)?void 0:e._$litDirective$;return r?.constructor!==a&&(r?._$AO?.(!1),a===void 0?r=void 0:(r=new a(n),r._$AT(n,t,i)),i!==void 0?(t._$Co??=[])[i]=r:t._$Cl=r),r!==void 0&&(e=Ht(n,r._$AS(n,e.values),r,i)),e}var yr=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??_t).importNode(t,!0);Bt.currentNode=r;let a=Bt.nextNode(),l=0,c=0,p=i[0];for(;p!==void 0;){if(l===p.index){let h;p.type===2?h=new Zt(a,a.nextSibling,this,e):p.type===1?h=new p.ctor(a,p.name,p.strings,this,e):p.type===6&&(h=new wr(a,this,e)),this._$AV.push(h),p=i[++c]}l!==p?.index&&(a=Bt.nextNode(),l++)}return Bt.currentNode=_t,r}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},Zt=class n{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=o,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Ht(this,e,t),_i(e)?e===o||e==null||e===""?(this._$AH!==o&&this._$AR(),this._$AH=o):e!==this._$AH&&e!==Ae&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):vn(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==o&&_i(this._$AH)?this._$AA.nextSibling.data=e:this.T(_t.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=Hi.createElement(xn(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{let a=new yr(r,this),l=a.u(this.options);a.p(t),this.T(l),this._$AH=a}}_$AC(e){let t=yn.get(e.strings);return t===void 0&&yn.set(e.strings,t=new Hi(e)),t}k(e){Oa(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,r=0;for(let a of e)r===t.length?t.push(i=new n(this.O(Bi()),this.O(Bi()),this,this.options)):i=t[r],i._$AI(a),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=hn(e).nextSibling;hn(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Vt=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,a){this.type=1,this._$AH=o,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=a,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=o}_$AI(e,t=this,i,r){let a=this.strings,l=!1;if(a===void 0)e=Ht(this,e,t,0),l=!_i(e)||e!==this._$AH&&e!==Ae,l&&(this._$AH=e);else{let c=e,p,h;for(e=a[0],p=0;p<a.length-1;p++)h=Ht(this,c[i+p],t,p),h===Ae&&(h=this._$AH[p]),l||=!_i(h)||h!==this._$AH[p],h===o?e=o:e!==o&&(e+=(h??"")+a[p+1]),this._$AH[p]=h}l&&!r&&this.j(e)}j(e){e===o?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},vr=class extends Vt{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===o?void 0:e}},$r=class extends Vt{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==o)}},xr=class extends Vt{constructor(e,t,i,r,a){super(e,t,i,r,a),this.type=5}_$AI(e,t=this){if((e=Ht(this,e,t,0)??o)===Ae)return;let i=this._$AH,r=e===o&&i!==o||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,a=e!==o&&(i===o||r);r&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},wr=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Ht(this,e)}},Sn={M:Ca,P:rt,A:Ra,C:1,L:wn,R:yr,D:vn,V:Ht,I:Zt,H:Vt,N:$r,U:xr,B:vr,F:wr},Xl=Ia.litHtmlPolyfillSupport;Xl?.(Hi,Zt),(Ia.litHtmlVersions??=[]).push("3.3.3");var kn=(n,e,t)=>{let i=t?.renderBefore??e,r=i._$litPart$;if(r===void 0){let a=t?.renderBefore??null;i._$litPart$=r=new Zt(e.insertBefore(Bi(),a),a,void 0,t??{})}return r._$AI(n),r};var qa=globalThis,yt=class extends it{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=kn(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Ae}};yt._$litElement$=!0,yt.finalized=!0,qa.litElementHydrateSupport?.({LitElement:yt});var Ql=qa.litElementPolyfillSupport;Ql?.({LitElement:yt});(qa.litElementVersions??=[]).push("4.2.2");var Cn={preset:"clinical-slate",scheme:"light",fontStack:"inter",radius:"standard",density:"standard",fontScale:"1"},La={inter:{label:"Inter Variable (Clinical I/l + Tabular)",sans:"'Inter Variable', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",mono:"'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",features:'"cv05" 1, "cv08" 1, "ss03" 1, "zero" 1'},"ibm-plex":{label:"IBM Plex Sans + IBM Plex Mono",sans:"'IBM Plex Sans', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",mono:"'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",features:'"zero" 1, "ss01" 1'},atkinson:{label:"Atkinson Hyperlegible (Low-Vision / Ophthal)",sans:"'Atkinson Hyperlegible', 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",mono:"'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",features:'"zero" 1'},system:{label:"System UI Native",sans:"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",mono:"ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",features:"normal"}},Ea={"clinical-slate":{light:{label:"Clinical Slate (Default)",primary:"#475f70",primaryHover:"#d4e0e6",primaryContrast:"#344b5a",primarySoft:"#e3ebef",primaryBorder:"#b2c4ce",focus:"#5f7f92"},dark:{label:"Clinical Slate (Dark)",primary:"#c5d5df",primaryHover:"#435966",primaryContrast:"#e8eff3",primarySoft:"#334755",primaryBorder:"#708998",focus:"#8fb0c2"}},"surgical-teal":{light:{label:"Surgical Teal",primary:"#0f766e",primaryHover:"#ccfbf1",primaryContrast:"#115e59",primarySoft:"#e6fffa",primaryBorder:"#5eead4",focus:"#0d9488"},dark:{label:"Surgical Teal (Dark)",primary:"#5eead4",primaryHover:"#115e59",primaryContrast:"#ccfbf1",primarySoft:"#134e4a",primaryBorder:"#2dd4bf",focus:"#2dd4bf"}},"royal-blue":{light:{label:"Hospital Blue",primary:"#1d4ed8",primaryHover:"#dbeafe",primaryContrast:"#1e3a8a",primarySoft:"#eff6ff",primaryBorder:"#93c5fd",focus:"#2563eb"},dark:{label:"Hospital Blue (Dark)",primary:"#93c5fd",primaryHover:"#1e3a8a",primaryContrast:"#dbeafe",primarySoft:"#172554",primaryBorder:"#60a5fa",focus:"#60a5fa"}},"forest-emerald":{light:{label:"Clinical Emerald",primary:"#15803d",primaryHover:"#dcfce7",primaryContrast:"#14532d",primarySoft:"#f0fdf4",primaryBorder:"#86efac",focus:"#16a34a"},dark:{label:"Clinical Emerald (Dark)",primary:"#86efac",primaryHover:"#14532d",primaryContrast:"#dcfce7",primarySoft:"#052e16",primaryBorder:"#4ade80",focus:"#4ade80"}},"ophthal-dark-room":{light:{label:"Ophthalmology Dark-Room (Low Glare)",primary:"#7dd3fc",primaryHover:"#1e293b",primaryContrast:"#e0f2fe",primarySoft:"#0f172a",primaryBorder:"#38bdf8",focus:"#38bdf8",background:"#050811",surface:"#0b1120",surfaceSoft:"#111827",surfaceRaised:"#1e293b",border:"#334155",text:"#e2e8f0",textMuted:"#94a3b8"},dark:{label:"Ophthalmology Dark-Room (Low Glare)",primary:"#7dd3fc",primaryHover:"#1e293b",primaryContrast:"#e0f2fe",primarySoft:"#0f172a",primaryBorder:"#38bdf8",focus:"#38bdf8",background:"#050811",surface:"#0b1120",surfaceSoft:"#111827",surfaceRaised:"#1e293b",border:"#334155",text:"#e2e8f0",textMuted:"#94a3b8"}}},Pa={sharp:{label:"Sharp (0px)",px:0},crisp:{label:"Crisp (6px)",px:6},standard:{label:"Standard (8px)",px:8},soft:{label:"Soft (12px)",px:12}},Da={compact:{label:"Compact (36px)",heightPx:36,compactPx:28},standard:{label:"Standard (44px)",heightPx:44,compactPx:32},touch:{label:"Touch (48px)",heightPx:48,compactPx:36}};var Zl=`:where(:root) {
  --emr-background: #f6f8f9;
  --emr-surface: #fffefa;
  --emr-surface-soft: #f1f4f5;
  --emr-surface-raised: #ffffff;
  --emr-border: #c7d3da;
  --emr-text: #263847;
  --emr-text-muted: #5c6c78;
  --emr-primary: #475f70;
  --emr-primary-hover: #d4e0e6;
  --emr-primary-contrast: #344b5a;
  --emr-primary-soft: #e3ebef;
  --emr-primary-border: #b2c4ce;
  --emr-on-primary: #fffefa;
  --emr-focus: #5f7f92;
  --emr-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
  --emr-backdrop: rgba(15, 23, 42, 0.45);
  --emr-neutral-soft: #e8eef1;
  --emr-info: #486f86;
  --emr-info-soft: #e8f0f4;
  --emr-success: #2b7650;
  --emr-success-soft: #e8f5ec;
  --emr-warning: #8a651f;
  --emr-warning-soft: #fbf4de;
  --emr-danger: #a44949;
  --emr-danger-soft: #fcecec;
  --emr-radius: 8px;
  --emr-radius-sm: 5px;
  --emr-radius-lg: 12px;
  --emr-control-height: 44px;
  --emr-compact-height: 32px;
  --emr-text-2xs: 0.6875rem;
  --emr-text-xs: 0.75rem;
  --emr-text-sm: 0.8125rem;
  --emr-text-md: 0.875rem;
  --emr-text-lg: 1rem;
  --emr-text-xl: 1.25rem;
  --emr-text-2xl: 1.5rem;
  --emr-weight-regular: 400;
  --emr-weight-medium: 500;
  --emr-weight-semibold: 600;
  --emr-weight-bold: 700;
  --emr-leading-normal: 1.45;
  --emr-leading-tight: 1.2;
}`,In=!1;function Jl(){if(In||typeof document>"u"||!document.head||(In=!0,document.getElementById("emr-elements-default-tokens")))return;let n=document.createElement("style");n.id="emr-elements-default-tokens",n.textContent=Zl,document.head.prepend(n)}var w=M`
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

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .emr-card {
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius-lg, 12px);
    background: var(--emr-surface, #fffefa);
    padding: 16px;
    display: grid;
    gap: 12px;
  }

  .emr-card--flush {
    padding: 0;
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

  textarea.emr-control {
    height: auto;
    padding: 10px 12px;
    line-height: var(--emr-leading-normal, 1.45);
  }

  .emr-control:focus-visible,
  .emr-btn:focus-visible,
  .emr-chip:focus-visible {
    outline: 2px solid var(--emr-focus, #5f7f92);
    outline-offset: -2px;
  }

  .emr-btn {
    min-height: var(--emr-control-height, 44px);
    min-width: 44px;
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

  .emr-btn--ghost {
    background: transparent;
    color: var(--emr-text, #263847);
    border-color: transparent;
  }

  .emr-btn--ghost:hover:not(:disabled) {
    background: var(--emr-surface-soft, #f1f4f5);
  }

  .emr-btn--danger {
    background: var(--emr-danger-soft, #fcecec);
    color: var(--emr-danger, #a44949);
    border-color: var(--emr-danger, #a44949);
  }

  .emr-btn--sm,
  .emr-btn--small {
    min-height: var(--emr-control-height, 44px);
    height: var(--emr-control-height, 44px);
    padding: 0 12px;
    font-size: var(--emr-text-xs, 0.75rem);
  }

  .emr-btn--lg {
    min-height: 48px;
    height: 48px;
    padding: 0 22px;
    font-size: var(--emr-text-md, 0.875rem);
  }

  .emr-btn--block {
    width: 100%;
    display: flex;
  }

  .emr-badge,
  .emr-chip {
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

  .emr-badge--neutral { background: var(--emr-neutral-soft, #e8eef1); color: var(--emr-text, #263847); border-color: var(--emr-border, #c7d3da); }
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

  .emr-info {
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-medium, 500);
    color: var(--emr-info, #486f86);
  }

  .emr-warning {
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-medium, 500);
    color: var(--emr-warning, #8a651f);
  }

  .emr-error {
    font-size: var(--emr-text-xs, 0.75rem);
    font-weight: var(--emr-weight-medium, 500);
    color: var(--emr-danger, #a44949);
  }

  :host-context(.emr-print) {
    --emr-control-height: auto;
    --emr-compact-height: auto;
    color: #000;
  }

  :host-context(.emr-print) [data-emr-print="hide"],
  :host-context(.emr-print) .stepper-btn,
  :host-context(.emr-print) .date-icon-btn,
  :host-context(.emr-print) .date-icon-box {
    display: none !important;
  }

  :host-context(.emr-print) [hidden],
  :host-context(.emr-print) [data-collapsed] {
    display: revert !important;
  }

  :host-context(.emr-print) .emr-control,
  :host-context(.emr-print) input:not([type="checkbox"]):not([type="radio"]),
  :host-context(.emr-print) select,
  :host-context(.emr-print) textarea,
  :host-context(.emr-print) .stepper-wrap,
  :host-context(.emr-print) .date-wrap,
  :host-context(.emr-print) .select-trigger {
    height: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    color: #000 !important;
    appearance: none !important;
    resize: none !important;
    overflow: visible !important;
  }

  :host-context(.emr-print) textarea {
    white-space: pre-wrap !important;
  }

  :host-context(.emr-print) .emr-badge,
  :host-context(.emr-print) .emr-chip {
    height: auto !important;
    padding: 0 4px !important;
    border: 1px solid #666 !important;
    background: transparent !important;
    color: #000 !important;
  }

  :host-context(.emr-print) .emr-card {
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: none !important;
    background: #fff !important;
  }

  @media print {
    :host {
      --emr-control-height: auto;
      --emr-compact-height: auto;
      color: #000;
    }

    [data-emr-print="hide"],
    .stepper-btn,
    .date-icon-btn,
    .date-icon-box {
      display: none !important;
    }

    [hidden],
    [data-collapsed] {
      display: revert !important;
    }

    .emr-control,
    input:not([type="checkbox"]):not([type="radio"]),
    select,
    textarea,
    .stepper-wrap,
    .date-wrap,
    .select-trigger {
      height: auto !important;
      min-height: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
      color: #000 !important;
      appearance: none !important;
      resize: none !important;
      overflow: visible !important;
    }

    textarea {
      white-space: pre-wrap !important;
    }

    .emr-badge,
    .emr-chip {
      height: auto !important;
      padding: 0 4px !important;
      border: 1px solid #666 !important;
      background: transparent !important;
      color: #000 !important;
    }

    .emr-card {
      break-inside: avoid;
      page-break-inside: avoid;
      box-shadow: none !important;
      background: #fff !important;
    }
  }
`,ed=w,S=class extends yt{static{this.styles=[ed]}connectedCallback(){Jl(),super.connectedCallback()}emitIntent(e){this.dispatchEvent(new CustomEvent("intent",{detail:e,bubbles:!0,composed:!0}))}emitValueChange(e){this.dispatchEvent(new CustomEvent("valueChange",{detail:e,bubbles:!0,composed:!0}))}};function y(n,e){typeof customElements<"u"&&!customElements.get(n)&&customElements.define(n,e)}function R(n,e=18){let t=(()=>{switch(n){case"calendar":return O`<rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />`;case"clock":return O`<circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />`;case"eye":return O`<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />`;case"eye-off":return O`<path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.4 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" /><line x1="2" y1="2" x2="22" y2="22" />`;case"lock":return O`<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />`;case"unlock":return O`<rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.8-1" />`;case"plus":return O`<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />`;case"minus":return O`<line x1="5" y1="12" x2="19" y2="12" />`;case"check":return O`<polyline points="20 6 9 17 4 12" />`;case"close":return O`<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />`;case"chevron-down":return O`<polyline points="6 9 12 15 18 9" />`;case"chevron-up":return O`<polyline points="18 15 12 9 6 15" />`;case"chevron-left":return O`<polyline points="15 18 9 12 15 6" />`;case"chevron-right":return O`<polyline points="9 18 15 12 9 6" />`;case"search":return O`<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" />`;case"warning":return O`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />`;case"info":return O`<circle cx="12" cy="12" r="9" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />`;case"danger":return O`<circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />`;case"trash":return O`<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />`;case"upload":return O`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />`;case"download":return O`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />`;case"camera":return O`<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />`;case"scanner":return O`<polyline points="4 7 4 4 7 4" /><polyline points="17 4 20 4 20 7" /><polyline points="20 17 20 20 17 20" /><polyline points="7 20 4 20 4 17" /><line x1="3" y1="12" x2="21" y2="12" />`;case"mic":return O`<rect x="9" y="2" width="6" height="11" rx="3" /><path d="M19 10a7 7 0 0 1-14 0" /><line x1="12" y1="19" x2="12" y2="22" />`;case"phone":return O`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />`;case"file":return O`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />`;case"user":return O`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />`;case"pen":return O`<path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />`;case"copy":return O`<rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />`;case"crop":return O`<path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" />`;case"rotate-ccw":return O`<polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />`;case"rotate-cw":return O`<polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />`;case"flip-h":return O`<line x1="12" y1="3" x2="12" y2="21" /><polygon points="8 7 3 12 8 17 8 7" /><polygon points="16 7 21 12 16 17 16 7" />`;case"flip-v":return O`<line x1="3" y1="12" x2="21" y2="12" /><polygon points="7 8 12 3 17 8 7 8" /><polygon points="7 16 12 21 17 16 7 16" />`;case"zoom-in":return O`<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />`;case"zoom-out":return O`<circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /><line x1="8" y1="11" x2="14" y2="11" />`;case"maximize":return O`<polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />`;default:return O`<circle cx="12" cy="12" r="8" />`}})();return O`<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${t}</svg>`}var td={attribute:!0,type:String,converter:Mi,reflect:!1,hasChanged:br},id=(n=td,e,t)=>{let{kind:i,metadata:r}=t,a=globalThis.litPropertyMetadata.get(r);if(a===void 0&&globalThis.litPropertyMetadata.set(r,a=new Map),i==="setter"&&((n=Object.create(n)).wrapped=!0),a.set(t.name,n),i==="accessor"){let{name:l}=t;return{set(c){let p=e.get.call(this);e.set.call(this,c),this.requestUpdate(l,p,n,!0,c)},init(c){return c!==void 0&&this.C(l,void 0,n,c),c}}}if(i==="setter"){let{name:l}=t;return function(c){let p=this[l];e.call(this,c),this.requestUpdate(l,p,n,!0,c)}}throw Error("Unsupported decorator location: "+i)};function d(n){return(e,t)=>typeof t=="object"?id(n,e,t):((i,r,a)=>{let l=r.hasOwnProperty(a);return r.constructor.createProperty(a,i),l?Object.getOwnPropertyDescriptor(r,a):void 0})(n,e,t)}function T(n){return d({...n,state:!0,attribute:!1})}var at={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},kr=n=>(...e)=>({_$litDirective$:n,values:e}),Jt=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var{I:rd}=Sn,Rn=n=>n;var An=n=>n.strings===void 0,On=()=>document.createComment(""),ei=(n,e,t)=>{let i=n._$AA.parentNode,r=e===void 0?n._$AB:e._$AA;if(t===void 0){let a=i.insertBefore(On(),r),l=i.insertBefore(On(),r);t=new rd(a,l,n,n.options)}else{let a=t._$AB.nextSibling,l=t._$AM,c=l!==n;if(c){let p;t._$AQ?.(n),t._$AM=n,t._$AP!==void 0&&(p=n._$AU)!==l._$AU&&t._$AP(p)}if(a!==r||c){let p=t._$AA;for(;p!==a;){let h=Rn(p).nextSibling;Rn(i).insertBefore(p,r),p=h}}}return t},vt=(n,e,t=n)=>(n._$AI(e,t),n),ad={},Ir=(n,e=ad)=>n._$AH=e,qn=n=>n._$AH,Cr=n=>{n._$AR(),n._$AA.remove()};var I=kr(class extends Jt{constructor(n){if(super(n),n.type!==at.PROPERTY&&n.type!==at.ATTRIBUTE&&n.type!==at.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!An(n))throw Error("`live` bindings can only contain a single expression")}render(n){return n}update(n,[e]){if(e===Ae||e===o)return e;let t=n.element,i=n.name;if(n.type===at.PROPERTY){if(e===t[i])return Ae}else if(n.type===at.BOOLEAN_ATTRIBUTE){if(!!e===t.hasAttribute(i))return Ae}else if(n.type===at.ATTRIBUTE&&t.getAttribute(i)===e+"")return Ae;return Ir(n),e}});var Ta=class extends he{repository;liveSearch;request;requestSequence=0;timer;constructor(e,t,i){super({query:"",options:[],selected:[],loading:!1,page:1,pageSize:20,total:0,...t}),this.repository=e,this.liveSearch=i}dispatch(e){if(!this.isDestroyed())switch(e.type){case"queryChanged":{this.request?.abort();let t=++this.requestSequence;clearTimeout(this.timer);let i=this.liveSearch&&e.query.trim().length>=(this.liveSearch.minChars??0)?this.liveSearch.debounceMs:void 0;this.setState(r=>({...r,query:e.query,page:1,options:[],total:0,loading:i!==void 0,error:void 0})),!this.isDestroyed()&&t===this.requestSequence&&i!==void 0&&(this.timer=setTimeout(()=>{this.search()},Math.max(0,i)));return}case"pageChanged":this.setState(t=>({...t,page:e.page})),this.search();return;case"selectionChanged":this.setState(t=>({...t,selected:[...e.selected]}));return;case"searchRequested":case"retryRequested":this.search();return}}async search(){if(this.isDestroyed())return;clearTimeout(this.timer),this.request?.abort();let e=new AbortController;this.request=e;let t=++this.requestSequence,i=this.getSnapshot();if(this.setState(r=>({...r,loading:!0,error:void 0})),!(e.signal.aborted||this.isDestroyed()))try{let r=await this.repository.search({query:i.query,page:i.page,pageSize:i.pageSize,signal:e.signal});if(t!==this.requestSequence||e.signal.aborted)return;this.setState(a=>({...a,options:[...r.items],total:r.total,loading:!1}))}catch(r){if(e.signal.aborted||t!==this.requestSequence)return;this.setState(a=>({...a,loading:!1,error:r instanceof Error?r.message:"Search failed"}))}}onDestroy(){clearTimeout(this.timer),this.request?.abort()}};function sd(n,e){return{min:n?1:0,max:e?null:1}}function Ln(n){return{schemaVersion:"1.0",contract:{linkId:n.id,valueType:n.type,cardinality:sd(n.required??!1,!1),terminology:[],validation:[],unit:void 0,revision:void 0},presentation:{label:n.label,hint:n.hint,placeholder:n.placeholder,span:n.span,rows:n.rows,precision:n.precision,unitDisplay:n.unit,options:n.options,assessmentStatusOptions:n.assessmentStatusOptions,customRendererKey:n.customRendererKey}}}var Ma={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Na={width:1e3,height:1200},Ba=[{id:"abdomen-plain",version:1,group:"abdomen",label:"Abdomen \u2014 plain",region:"abdomen",view:"anterior",laterality:"bilateral",asset:"abdomen/abdomen-plain.svg",...Na,provenance:Ma,description:"Anterior abdominal wall outline from costal margins to inguinal ligaments, with the umbilicus marked."},{id:"abdomen-quadrants",version:1,group:"abdomen",label:"Abdomen \u2014 four quadrants",region:"abdomen",view:"anterior",laterality:"bilateral",asset:"abdomen/abdomen-quadrants.svg",...Na,provenance:Ma,description:"Anterior abdomen divided into four quadrants by vertical and horizontal lines through the umbilicus."},{id:"abdomen-nine-regions",version:1,group:"abdomen",label:"Abdomen \u2014 nine regions",region:"abdomen",view:"anterior",laterality:"bilateral",asset:"abdomen/abdomen-nine-regions.svg",...Na,provenance:Ma,description:"Anterior abdomen divided into nine regions by the midclavicular, subcostal and intertubercular planes."}];var st={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},_a=[{id:"mallampati-classes",version:1,group:"anaesthesia",label:"Mallampati classes I\u2013IV",region:"oropharynx",view:"open mouth, four classes",laterality:"midline",asset:"anaesthesia/mallampati-classes.svg",width:1600,height:800,provenance:st,description:"Four open-mouth views with the tongue protruded, side by side and labelled Class I to Class IV. Class I shows soft palate, fauces, uvula and pillars; Class II the soft palate, fauces and uvula; Class III the soft palate and base of the uvula; Class IV the hard palate only. The patient's right is on the viewer's left, marked R."},{id:"cormack-lehane-grades",version:1,group:"anaesthesia",label:"Cormack\u2013Lehane grades",region:"larynx",view:"laryngoscopic view, five grades",laterality:"midline",asset:"anaesthesia/cormack-lehane-grades.svg",width:1900,height:700,provenance:st,description:"Five circular laryngoscopic views side by side with the epiglottis anterior at the top: Grade 1 full glottis, Grade 2a posterior glottis, Grade 2b arytenoids only, Grade 3 epiglottis only and Grade 4 no laryngeal structures. Each is labelled with its grade."},{id:"airway-ett-sagittal",version:1,group:"anaesthesia",label:"Airway \u2014 endotracheal tube",region:"airway",view:"sagittal",laterality:"midline",asset:"anaesthesia/airway-ett-sagittal.svg",width:1400,height:1200,provenance:st,description:"Midsagittal head and neck airway facing the viewer's left, with nasal cavity and turbinates, tongue, hyoid, epiglottis rising behind the tongue base with the vallecula, larynx with vocal folds, trachea with C-rings to the carina, the oesophagus behind and the cervical spine. A cuffed endotracheal tube passes through the mouth, behind the epiglottis and through the cords, with its cuff just below the cords, a bevelled tip mid-trachea, an inflation line to a pilot balloon outside the mouth and a dashed depth mark at the lips. Anterior is on the left."},{id:"airway-lma-sagittal",version:1,group:"anaesthesia",label:"Airway \u2014 laryngeal mask",region:"airway",view:"sagittal",laterality:"midline",asset:"anaesthesia/airway-lma-sagittal.svg",width:1400,height:1200,provenance:st,description:"Midsagittal head and neck airway facing the viewer's left with a laryngeal mask airway seated over the laryngeal inlet, its tip at the upper oesophageal sphincter, airway tube through the mouth and pilot balloon outside. Nasal cavity, tongue, epiglottis, cords, trachea and oesophagus are shown. Anterior is on the left."},{id:"airway-tracheostomy-sagittal",version:1,group:"anaesthesia",label:"Airway \u2014 tracheostomy tube",region:"airway",view:"sagittal",laterality:"midline",asset:"anaesthesia/airway-tracheostomy-sagittal.svg",width:1400,height:1200,provenance:st,description:"Midsagittal head and neck airway facing the viewer's left with a cuffed tracheostomy tube entering through the anterior neck and anterior tracheal wall below the cricoid, cuff inflated, tip above the carina, neck flange at the skin and pilot balloon outside. Anterior is on the left."},{id:"front-of-neck-access",version:1,group:"anaesthesia",label:"Front-of-neck access landmarks",region:"neck",view:"anterior",laterality:"midline",asset:"anaesthesia/front-of-neck-access.svg",width:1100,height:1100,provenance:st,description:"Front of the neck with chin, hyoid, thyroid cartilage, the cricothyroid membrane highlighted with a dashed outline, cricoid cartilage, tracheal rings, sternocleidomastoid borders, clavicles and sternal notch: the midline landmarks for emergency front-of-neck access. The patient's right is on the viewer's left, marked R."},{id:"neuraxial-spine-lateral",version:1,group:"anaesthesia",label:"Neuraxial spine \u2014 lateral",region:"lumbosacral spine",view:"lateral",laterality:"midline",asset:"anaesthesia/neuraxial-spine-lateral.svg",width:1300,height:1400,provenance:st,description:"Lateral lumbosacral spine from T12 to S2 with vertebral bodies, discs, spinous processes and interspaces, the dural sac shaded as the subarachnoid space, the epidural space, the conus ending at L1\u2013L2 and the cauda equina, and Tuffier's intercristal line dashed at L4. Anterior is on the left and posterior (back skin) on the right."},{id:"upper-limb-block-sites-right",version:1,group:"anaesthesia",label:"Upper limb block sites \u2014 right",region:"right neck, shoulder and arm",view:"anterior",laterality:"right",asset:"anaesthesia/upper-limb-block-sites-right.svg",width:1300,height:1600,provenance:st,description:"Patient's right neck, shoulder, arm and hand from the front with palm forward, with circles and labels for the brachial plexus blocks (interscalene, supraclavicular, infraclavicular, axillary) and the radial, median and ulnar nerve blocks at the wrist. The patient's right is on the viewer's left, marked R; the midline is the dashed line at the right."},{id:"lower-limb-block-sites-right",version:1,group:"anaesthesia",label:"Lower limb block sites \u2014 right",region:"right lower limb",view:"anterior with posterior inset",laterality:"right",asset:"anaesthesia/lower-limb-block-sites-right.svg",width:1900,height:1800,provenance:st,description:"Patient's right lower limb from the front with circles and labels for femoral, fascia iliaca, adductor canal, superficial peroneal, deep peroneal and saphenous nerve block sites, plus a small posterior view of the knee to heel showing popliteal sciatic, posterior tibial and sural sites. The patient's right is on the viewer's left on the anterior view and on the viewer's right on the posterior inset."}];var Vi={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ji={width:1400,height:1e3},Ha=[{id:"anterior-segment-od",version:1,group:"anterior-segment",label:"Anterior segment \u2014 right eye (OD)",region:"right eye",view:"cross-section",laterality:"right",asset:"anterior-segment/anterior-segment-od.svg",...ji,provenance:Vi,description:"Slit-lamp style cross-section of the right anterior segment with anterior at the top: cornea, anterior chamber, iris, lens, angle, ciliary body and sclera; nasal side on the viewer's right, labelled OD, N and T."},{id:"anterior-segment-os",version:1,group:"anterior-segment",label:"Anterior segment \u2014 left eye (OS)",region:"left eye",view:"cross-section",laterality:"left",asset:"anterior-segment/anterior-segment-os.svg",...ji,provenance:Vi,description:"Slit-lamp style cross-section of the left anterior segment with anterior at the top: cornea, anterior chamber, iris, lens, angle, ciliary body and sclera; nasal side on the viewer's left, labelled OS, N and T."},{id:"angle-gonioscopy-od",version:1,group:"anterior-segment",label:"Angle gonioscopy chart \u2014 right eye (OD)",region:"right eye, iridocorneal angle",view:"gonioscopy chart",laterality:"right",asset:"anterior-segment/angle-gonioscopy-od.svg",...ji,provenance:Vi,description:"Gonioscopy angle chart of the right eye: concentric rings for Schwalbe's line, trabecular meshwork, scleral spur, ciliary body band and iris root, split into superior, nasal, inferior and temporal quadrants with clock hours 12, 3, 6 and 9; nasal on the viewer's right, labelled OD."},{id:"angle-gonioscopy-os",version:1,group:"anterior-segment",label:"Angle gonioscopy chart \u2014 left eye (OS)",region:"left eye, iridocorneal angle",view:"gonioscopy chart",laterality:"left",asset:"anterior-segment/angle-gonioscopy-os.svg",...ji,provenance:Vi,description:"Gonioscopy angle chart of the left eye: concentric rings for Schwalbe's line, trabecular meshwork, scleral spur, ciliary body band and iris root, split into superior, nasal, inferior and temporal quadrants with clock hours 12, 3, 6 and 9; nasal on the viewer's left, labelled OS."},{id:"angle-structures",version:1,group:"anterior-segment",label:"Iridocorneal angle structures",region:"iridocorneal angle",view:"enlarged cross-section",laterality:"not-applicable",asset:"anterior-segment/angle-structures.svg",...ji,provenance:Vi,description:"Enlarged schematic cross-section of the iridocorneal angle with anterior up: cornea, Schwalbe's line, trabecular meshwork, Schlemm's canal, scleral spur, ciliary body band, iris root, ciliary body and sclera."}];var zi={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Va=[{id:"back-whole",version:1,group:"back",label:"Back \u2014 whole",region:"back",view:"posterior",laterality:"bilateral",asset:"back/back-whole.svg",width:1e3,height:1400,provenance:zi,description:"Whole posterior trunk from neck to upper buttocks with scapulae, spinous-process midline from C7 to L5, iliac crests, posterior superior iliac spine dimples and gluteal cleft."},{id:"spine-cervical",version:1,group:"back",label:"Spine \u2014 cervical",region:"cervical spine",view:"posterior",laterality:"midline",asset:"back/spine-cervical.svg",width:1e3,height:1200,provenance:zi,description:"Posterior neck and lower occiput outline with the cervical spinous processes C2 to C7 and T1 along the midline and the superior nuchal line."},{id:"spine-thoracic",version:1,group:"back",label:"Spine \u2014 thoracic",region:"thoracic spine",view:"posterior",laterality:"midline",asset:"back/spine-thoracic.svg",width:1e3,height:1200,provenance:zi,description:"Posterior upper and mid back with spinous processes C7 and T1 to T12 along the midline and both scapulae as landmarks."},{id:"spine-lumbar",version:1,group:"back",label:"Spine \u2014 lumbar",region:"lumbar spine",view:"posterior",laterality:"midline",asset:"back/spine-lumbar.svg",width:1e3,height:1200,provenance:zi,description:"Posterior lumbar back with spinous processes T12 to S1 along the midline, paraspinal lines, twelfth ribs, iliac crests and posterior superior iliac spine dimples."},{id:"spine-sacral",version:1,group:"back",label:"Spine \u2014 sacral",region:"sacral spine",view:"posterior",laterality:"midline",asset:"back/spine-sacral.svg",width:1e3,height:1200,provenance:zi,description:"Posterior sacral region with the sacrum, median crest levels S1 to S5, coccyx, iliac crests, posterior superior iliac spine dimples and the upper gluteal cleft."}];var Te={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ja=[{id:"pelvis-hip-ap",version:1,group:"bony-joints",label:"Pelvis and hips \u2014 AP",region:"pelvis and hips",view:"anteroposterior",laterality:"bilateral",asset:"bony-joints/pelvis-hip-ap.svg",width:1400,height:1300,provenance:Te,description:"Anteroposterior pelvis with both hips: iliac wings with crest, ASIS and AIIS, L5 vertebra, sacrum and coccyx, sacroiliac joints, acetabula with rim and teardrop, femoral heads, necks and trochanters, Shenton's line, pubic symphysis, rami and obturator foramina. Patient's right is on the viewer's left (R and L marked)."},{id:"knee-bony-ap-right",version:1,group:"bony-joints",label:"Knee bones \u2014 right AP",region:"right knee",view:"anteroposterior",laterality:"right",asset:"bony-joints/knee-bony-ap-right.svg",width:1e3,height:1400,provenance:Te,description:"Right knee bones from the front: distal femur with both condyles, patella, tibial plateau with tibial spines and proximal fibula. The fibula (lateral side) is on the viewer's left."},{id:"knee-bony-ap-left",version:1,group:"bony-joints",label:"Knee bones \u2014 left AP",region:"left knee",view:"anteroposterior",laterality:"left",asset:"bony-joints/knee-bony-ap-left.svg",width:1e3,height:1400,provenance:Te,description:"Left knee bones from the front: distal femur with both condyles, patella, tibial plateau with tibial spines and proximal fibula. The fibula (lateral side) is on the viewer's right."},{id:"knee-bony-lateral-right",version:1,group:"bony-joints",label:"Knee bones \u2014 right lateral",region:"right knee",view:"lateral",laterality:"right",asset:"bony-joints/knee-bony-lateral-right.svg",width:1e3,height:1400,provenance:Te,description:"Right knee bones seen from the lateral side: distal femoral condyles, patella and tibial tuberosity anteriorly on the viewer's right, fibular head posteriorly on the left. Anterior and posterior are labelled."},{id:"knee-bony-lateral-left",version:1,group:"bony-joints",label:"Knee bones \u2014 left lateral",region:"left knee",view:"lateral",laterality:"left",asset:"bony-joints/knee-bony-lateral-left.svg",width:1e3,height:1400,provenance:Te,description:"Left knee bones seen from the lateral side: distal femoral condyles, patella and tibial tuberosity anteriorly on the viewer's left, fibular head posteriorly on the right. Anterior and posterior are labelled."},{id:"shoulder-bony-right",version:1,group:"bony-joints",label:"Shoulder bones \u2014 right AP",region:"right shoulder",view:"anteroposterior",laterality:"right",asset:"bony-joints/shoulder-bony-right.svg",width:1400,height:1100,provenance:Te,description:"Right glenohumeral joint from the front: proximal humerus on the viewer's left, glenoid, acromion, coracoid and scapula, with the clavicle running medially to the viewer's right."},{id:"shoulder-bony-left",version:1,group:"bony-joints",label:"Shoulder bones \u2014 left AP",region:"left shoulder",view:"anteroposterior",laterality:"left",asset:"bony-joints/shoulder-bony-left.svg",width:1400,height:1100,provenance:Te,description:"Left glenohumeral joint from the front: proximal humerus on the viewer's right, glenoid, acromion, coracoid and scapula, with the clavicle running medially to the viewer's left."},{id:"hand-bones-right-dorsal",version:1,group:"bony-joints",label:"Hand bones \u2014 right dorsal",region:"right hand",view:"dorsal",laterality:"right",asset:"bony-joints/hand-bones-right-dorsal.svg",width:1e3,height:1400,provenance:Te,description:"Right hand bones, dorsal view, fingers up and thumb on the viewer's left: the carpal bones (pisiform partly tucked behind the triquetrum), five metacarpals, phalanges with visible joint spaces, and the distal radius and ulna."},{id:"hand-bones-left-dorsal",version:1,group:"bony-joints",label:"Hand bones \u2014 left dorsal",region:"left hand",view:"dorsal",laterality:"left",asset:"bony-joints/hand-bones-left-dorsal.svg",width:1e3,height:1400,provenance:Te,description:"Left hand bones, dorsal view, fingers up and thumb on the viewer's right: the carpal bones (pisiform partly tucked behind the triquetrum), five metacarpals, phalanges with visible joint spaces, and the distal radius and ulna."},{id:"foot-bones-right-dorsal",version:1,group:"bony-joints",label:"Foot bones \u2014 right dorsal",region:"right foot",view:"dorsal",laterality:"right",asset:"bony-joints/foot-bones-right-dorsal.svg",width:800,height:1400,provenance:Te,description:"Right foot bones, dorsal view, toes up and the big toe medial on the viewer's left: talus, calcaneus, navicular, cuboid, three cuneiforms, five metatarsals and the phalanges of all toes."},{id:"foot-bones-left-dorsal",version:1,group:"bony-joints",label:"Foot bones \u2014 left dorsal",region:"left foot",view:"dorsal",laterality:"left",asset:"bony-joints/foot-bones-left-dorsal.svg",width:800,height:1400,provenance:Te,description:"Left foot bones, dorsal view, toes up and the big toe medial on the viewer's right: talus, calcaneus, navicular, cuboid, three cuneiforms, five metatarsals and the phalanges of all toes."},{id:"spine-bony-ap",version:1,group:"bony-joints",label:"Spine \u2014 AP",region:"spine",view:"anteroposterior",laterality:"midline",asset:"bony-joints/spine-bony-ap.svg",width:800,height:1600,provenance:Te,description:"Vertebral column from C1 to the coccyx from the front: cervical, thoracic with rib stubs and lumbar vertebrae, sacrum and coccyx, with level labels C1, C7, T1, T12, L1, L5 and S1. R is on the viewer's left."},{id:"spine-bony-lateral",version:1,group:"bony-joints",label:"Spine \u2014 lateral",region:"spine",view:"lateral",laterality:"midline",asset:"bony-joints/spine-bony-lateral.svg",width:800,height:1600,provenance:Te,description:"Vertebral column from C1 to the coccyx from the side, showing cervical and lumbar lordosis and thoracic kyphosis, vertebral bodies, intervertebral discs and spinous processes. Anterior is on the viewer's left; levels C1, C7, T1, T12, L1, L5, S1 are labelled."}];var En={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},za=[{id:"lund-browder-adult",version:1,group:"burns",label:"Lund and Browder chart \u2014 adult",region:"whole body",view:"burn chart",laterality:"bilateral",asset:"burns/lund-browder-adult.svg",width:1600,height:1100,provenance:En,description:"Adult anterior figure (left) and posterior figure (right) divided by dashed lines into head, neck, trunk, genitalia or buttocks, upper arms, forearms, hands, thighs, legs and feet. On the anterior figure the patient's right is on the viewer's left; on the posterior figure it is on the viewer's right. Each is marked R and L."},{id:"lund-browder-child",version:1,group:"burns",label:"Lund and Browder chart \u2014 child",region:"whole body",view:"burn chart",laterality:"bilateral",asset:"burns/lund-browder-child.svg",width:1600,height:1100,provenance:En,description:"Child anterior figure (left) and posterior figure (right) with a larger head and shorter legs, divided by dashed lines into the standard Lund and Browder regions. On the anterior figure the patient's right is on the viewer's left; on the posterior figure it is on the viewer's right. Each is marked R and L."}];var ot={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Pn={author:"Vector trace of an AI-generated illustration (generator not recorded)",licence:"Terms of the generating tool apply: confirm before release",reviewStatus:"unreviewed"},Fa=[{id:"tracheobronchial-tree",version:1,group:"cardiothoracic",label:"Tracheobronchial tree \u2014 segmental",region:"chest",view:"anterior",laterality:"bilateral",asset:"cardiothoracic/tracheobronchial-tree.svg",width:1400,height:1400,provenance:ot,description:"Anterior view of the trachea, carina, main, lobar and segmental bronchi with segment labels RB1 to RB10 and LB1+2 to LB10. Patient right on the viewer left."},{id:"bronchiole-alveolus",version:1,group:"cardiothoracic",label:"Bronchiole to alveolus \u2014 detail",region:"chest",view:"detail",laterality:"not-applicable",asset:"cardiothoracic/bronchiole-alveolus.svg",width:1400,height:1e3,provenance:ot,description:"Schematic of a terminal bronchiole leading to a respiratory bronchiole, alveolar ducts and alveolar sacs, with a capillary network sketched on one sac."},{id:"lungs-airway-overlay",version:1,group:"cardiothoracic",label:"Lungs with airway overlay",region:"chest",view:"anterior",laterality:"bilateral",asset:"cardiothoracic/lungs-airway-overlay.svg",width:1900,height:1200,provenance:ot,description:"Anterior view of both lungs: right oblique and horizontal fissures (RUL, RML, RLL) and left oblique fissure (LUL with lingula, LLL); right dome higher than left; cardiac notch with the lingula; costophrenic angles. The trachea, carina, main and lobar bronchi and their first segmental branches are drawn near the hila only, with the hila marked. A light cardiac silhouette in the mediastinal gap marks the heart borders, with a thin parietal pleura outline and costophrenic recess. The peripheral lung fields are left clear for lesion and bronchus annotation. Patient right on the viewer left."},{id:"heart-great-vessels-anterior",version:1,group:"cardiothoracic",label:"Heart and great vessels \u2014 anterior",region:"chest",view:"anterior",laterality:"midline",asset:"cardiothoracic/heart-great-vessels-anterior.svg",width:1700,height:1400,provenance:ot,description:"Anterior heart with ascending aorta and arch giving brachiocephalic trunk (bifurcating into right subclavian and right common carotid), left common carotid and left subclavian, the descending aorta passing behind the left pulmonary artery, SVC, IVC, left atrial appendage, right ventricle with the right AV and anterior interventricular grooves, and the pulmonary trunk dividing into the right and left pulmonary arteries. Pulmonary veins are posterior and not shown. Patient right on the viewer left."},{id:"heart-great-vessels-posterior",version:1,group:"cardiothoracic",label:"Heart and great vessels \u2014 posterior",region:"chest",view:"posterior",laterality:"midline",asset:"cardiothoracic/heart-great-vessels-posterior.svg",width:1800,height:1300,provenance:ot,description:"Posterior heart with the left atrium and four pulmonary veins, IVC, SVC, coronary sinus and descending aorta. Patient right on the viewer right."},{id:"heart-anterior-cutaway",version:1,group:"cardiothoracic",label:"Heart \u2014 anterior cutaway",region:"chest",view:"anterior cutaway",laterality:"midline",asset:"cardiothoracic/heart-anterior-cutaway.svg",width:680,height:880,provenance:Pn,description:"Unlabelled textbook-style anterior cutaway of the heart: right atrium and right ventricle, left atrium and left ventricle, septa, tricuspid and mitral valves with the aortic and pulmonary valves, SVC, IVC, ascending aorta with arch and three branches, pulmonary trunk and arteries, pulmonary veins and the trabeculated ventricular lining. Patient right on the viewer left (R and L marked)."},{id:"heart-anterior-cutaway-chordae",version:1,group:"cardiothoracic",label:"Heart \u2014 anterior cutaway with chordae",region:"chest",view:"anterior cutaway",laterality:"midline",asset:"cardiothoracic/heart-anterior-cutaway-chordae.svg",width:680,height:880,provenance:Pn,description:"The anterior heart cutaway with the chordae tendineae and papillary muscles drawn in both ventricles, otherwise unlabelled: chambers, septa, valves, SVC, IVC, aorta with arch branches, pulmonary trunk and arteries, pulmonary veins. Patient right on the viewer left (R and L marked)."},{id:"echo-parasternal-long-axis",version:1,group:"cardiothoracic",label:"Echo \u2014 parasternal long axis",region:"heart",view:"echo parasternal long axis",laterality:"not-applicable",asset:"cardiothoracic/echo-parasternal-long-axis.svg",width:1700,height:1200,provenance:ot,description:"Echo-style sector schematic of the parasternal long axis: RV on top, septum, LV, mitral valve, left atrium, aortic root with valve and the descending aorta behind the atrium. LV apex on the viewer left, aortic root on the viewer right."},{id:"echo-parasternal-short-axis",version:1,group:"cardiothoracic",label:"Echo \u2014 parasternal short axis",region:"heart",view:"echo parasternal short axis",laterality:"not-applicable",asset:"cardiothoracic/echo-parasternal-short-axis.svg",width:1700,height:1200,provenance:ot,description:"Echo-style sector schematic of the parasternal short axis at papillary level: circular LV with the six-segment ring and papillary muscles, and the RV crescent on the viewer left."},{id:"echo-apical-four-chamber",version:1,group:"cardiothoracic",label:"Echo \u2014 apical four-chamber",region:"heart",view:"echo apical four-chamber",laterality:"not-applicable",asset:"cardiothoracic/echo-apical-four-chamber.svg",width:1700,height:1200,provenance:ot,description:"Echo-style sector schematic of the apical four-chamber view with the apex at the top, LV on the viewer right and RV on the viewer left, with atria, septa and the mitral and tricuspid valves."},{id:"heart-valve-plane",version:1,group:"cardiothoracic",label:"Heart \u2014 valve plane",region:"chest",view:"base from above",laterality:"midline",asset:"cardiothoracic/heart-valve-plane.svg",width:1800,height:1200,provenance:ot,description:"Cardiac base seen from above with the atria removed: aortic valve cusps with coronary ostia, pulmonary valve, mitral anterior and posterior leaflets and tricuspid leaflets. Anterior at the top, patient right on the viewer right."}];var Dn={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Tn={width:1200,height:1200},Ua=[{id:"cornea-od",version:1,group:"cornea",label:"Cornea \u2014 right eye (OD)",region:"right eye",view:"face-on",laterality:"right",asset:"cornea/cornea-od.svg",...Tn,provenance:Dn,description:"Circular cornea of the right eye with limbus ring, dashed pupil outline, centre cross lines and clock-hour ticks with 12, 3, 6 and 9 labelled; nasal side on the viewer's right, labelled OD, N and T."},{id:"cornea-os",version:1,group:"cornea",label:"Cornea \u2014 left eye (OS)",region:"left eye",view:"face-on",laterality:"left",asset:"cornea/cornea-os.svg",...Tn,provenance:Dn,description:"Circular cornea of the left eye with limbus ring, dashed pupil outline, centre cross lines and clock-hour ticks with 12, 3, 6 and 9 labelled; nasal side on the viewer's left, labelled OS, N and T."}];var nt={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Ga=[{id:"dentition-adult",version:1,group:"dental-oral",label:"Dentition \u2014 adult",region:"teeth",view:"occlusal",laterality:"bilateral",asset:"dental-oral/dentition-adult.svg",width:1200,height:1500,provenance:nt,description:"Thirty-two permanent teeth in upper and lower arches, occlusal view, anterior teeth at the outer edge, patient's right on the viewer's left; no tooth numbers."},{id:"dentition-primary",version:1,group:"dental-oral",label:"Dentition \u2014 primary",region:"teeth",view:"occlusal",laterality:"bilateral",asset:"dental-oral/dentition-primary.svg",width:1200,height:1300,provenance:nt,description:"Twenty primary teeth in upper and lower arches, occlusal view, anterior teeth at the outer edge, patient's right on the viewer's left; no tooth numbers."},{id:"tooth-surfaces",version:1,group:"dental-oral",label:"Tooth \u2014 five surfaces",region:"tooth",view:"occlusal",laterality:"not-applicable",asset:"dental-oral/tooth-surfaces.svg",width:1e3,height:1e3,provenance:nt,description:"One generic tooth in occlusal view: occlusal surface in the centre with buccal above, lingual below, mesial on the viewer's left and distal on the viewer's right."},{id:"tongue",version:1,group:"dental-oral",label:"Tongue \u2014 dorsal",region:"tongue",view:"dorsal",laterality:"bilateral",asset:"dental-oral/tongue.svg",width:1e3,height:1200,provenance:nt,description:"Dorsal surface of the protruded tongue, base at the top and tip toward the viewer, with median sulcus, V-shaped sulcus terminalis, circumvallate papillae and foramen caecum."},{id:"palate",version:1,group:"dental-oral",label:"Palate \u2014 hard and soft",region:"palate",view:"inferior",laterality:"midline",asset:"dental-oral/palate.svg",width:1e3,height:1200,provenance:nt,description:"Roof of the mouth seen from below within the upper dental arch: incisive papilla and palatine rugae toward the viewer, median raphe, hard and soft palate and uvula at the top."},{id:"oral-cavity",version:1,group:"dental-oral",label:"Oral cavity \u2014 open mouth",region:"oral cavity",view:"open-mouth",laterality:"bilateral",asset:"dental-oral/oral-cavity.svg",width:1200,height:1e3,provenance:nt,description:"Open-mouth view of the oral cavity showing upper and lower front teeth, buccal mucosa, hard and soft palate, uvula, tonsils between the pillars, posterior pharyngeal wall and tongue; patient's right on the viewer's left."},{id:"tooth-profile",version:1,group:"dental-oral",label:"Tooth \u2014 longitudinal section",region:"tooth",view:"longitudinal",laterality:"not-applicable",asset:"dental-oral/tooth-profile.svg",width:1400,height:1400,provenance:nt,description:"One tooth in longitudinal section, crown up: enamel, dentine, pulp chamber, root canal, root, periodontal ligament, alveolar bone, gingiva and the cementoenamel junction."},{id:"tmj-right",version:1,group:"dental-oral",label:"TMJ \u2014 right",region:"right temporomandibular joint",view:"lateral",laterality:"right",asset:"dental-oral/tmj-right.svg",width:1200,height:1e3,provenance:nt,description:"Lateral schematic of the right temporomandibular joint, anterior toward the viewer's right: condyle, articular disc, articular eminence, glenoid fossa and external auditory meatus."},{id:"tmj-left",version:1,group:"dental-oral",label:"TMJ \u2014 left",region:"left temporomandibular joint",view:"lateral",laterality:"left",asset:"dental-oral/tmj-left.svg",width:1200,height:1e3,provenance:nt,description:"Lateral schematic of the left temporomandibular joint, anterior toward the viewer's left: condyle, articular disc, articular eminence, glenoid fossa and external auditory meatus."}];var Ya={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Wa=[{id:"thyroid-anterior",version:1,group:"endocrine-neck",label:"Thyroid \u2014 anterior neck",region:"neck",view:"anterior",laterality:"bilateral",asset:"endocrine-neck/thyroid-anterior.svg",width:1600,height:1200,provenance:Ya,description:"Anterior neck with the thyroid gland (right and left lobes joined by a thin isthmus, dashed pyramidal lobe variant), hyoid bone, thyroid and cricoid cartilages, trachea with rings, clavicles and sternal notch. Patient right on the viewer left."},{id:"thyroid-parathyroid-posterior",version:1,group:"endocrine-neck",label:"Thyroid and parathyroids \u2014 posterior",region:"neck",view:"posterior",laterality:"bilateral",asset:"endocrine-neck/thyroid-parathyroid-posterior.svg",width:1500,height:1200,provenance:Ya,description:"Posterior view of the thyroid lobes with the four parathyroid glands, recurrent laryngeal nerves in the tracheo-oesophageal grooves, trachea, oesophagus and inferior thyroid arteries. Patient right on the viewer right."},{id:"thyroid-transverse-section",version:1,group:"endocrine-neck",label:"Thyroid \u2014 transverse section",region:"neck",view:"transverse",laterality:"bilateral",asset:"endocrine-neck/thyroid-transverse-section.svg",width:1800,height:1100,provenance:Ya,description:"Axial neck section at the thyroid level, ultrasound style: trachea centred with the thyroid lobes and isthmus around it, carotids and internal jugular veins laterally, strap muscles and sternocleidomastoid, oesophagus and vertebra. Patient right on the viewer left, anterior up."}];var $t={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Ka=[{id:"middle-ear-schematic",version:1,group:"ent-head-neck",label:"Middle ear \u2014 coronal schematic",region:"right ear",view:"coronal",laterality:"right",asset:"ent-head-neck/middle-ear-schematic.svg",width:1400,height:1e3,provenance:$t,description:"Coronal schematic of the right ear, lateral on the viewer's left: external canal, tympanic membrane, middle-ear cavity with malleus, incus and stapes, oval and round windows, cochlea, semicircular canals and the eustachian tube."},{id:"mastoid-temporal-right",version:1,group:"ent-head-neck",label:"Mastoid and temporal \u2014 right",region:"right temporal region",view:"lateral",laterality:"right",asset:"ent-head-neck/mastoid-temporal-right.svg",width:1e3,height:1200,provenance:$t,description:"Right temporal region and mastoid from the side, anterior toward the viewer's right: pinna, mastoid tip, suprameatal (Macewen's) triangle, zygomatic root, and a dashed postauricular incision line."},{id:"mastoid-temporal-left",version:1,group:"ent-head-neck",label:"Mastoid and temporal \u2014 left",region:"left temporal region",view:"lateral",laterality:"left",asset:"ent-head-neck/mastoid-temporal-left.svg",width:1e3,height:1200,provenance:$t,description:"Left temporal region and mastoid from the side, anterior toward the viewer's left: pinna, mastoid tip, suprameatal (Macewen's) triangle, zygomatic root, and a dashed postauricular incision line."},{id:"larynx-laryngoscopy",version:1,group:"ent-head-neck",label:"Larynx \u2014 laryngoscopy",region:"larynx",view:"laryngoscopic",laterality:"bilateral",asset:"ent-head-neck/larynx-laryngoscopy.svg",width:1200,height:1e3,provenance:$t,description:"Laryngoscopic view with the anterior commissure at the top and the patient's right on the viewer's left: epiglottis, vallecula, aryepiglottic folds, arytenoids, false and true vocal cords in abduction, and the piriform fossae."},{id:"paranasal-sinuses-frontal",version:1,group:"ent-head-neck",label:"Paranasal sinuses \u2014 frontal",region:"paranasal sinuses",view:"anterior",laterality:"bilateral",asset:"ent-head-neck/paranasal-sinuses-frontal.svg",width:1200,height:1250,provenance:$t,description:"Frontal facial outline showing the frontal, ethmoid and maxillary sinuses, both orbits and the nasal cavity; patient's right on the viewer's left."},{id:"nasal-lateral-wall-right",version:1,group:"ent-head-neck",label:"Nasal lateral wall \u2014 right",region:"right nasal cavity",view:"sagittal",laterality:"right",asset:"ent-head-neck/nasal-lateral-wall-right.svg",width:1200,height:1e3,provenance:$t,description:"Sagittal view of the right lateral nasal wall, anterior to the left: inferior, middle and superior turbinates with their meatuses, sphenoid sinus, nasopharynx and the eustachian tube opening."},{id:"neck-levels-right",version:1,group:"ent-head-neck",label:"Neck levels \u2014 right",region:"right neck",view:"lateral",laterality:"right",asset:"ent-head-neck/neck-levels-right.svg",width:1e3,height:1400,provenance:$t,description:"Right lateral neck, anterior toward the viewer's right, with cervical lymph-node levels IA, IB, IIA, IIB, III, IV, VA, VB and VI as dashed boundaries, and the mandible, hyoid, sternocleidomastoid and clavicle as landmarks."},{id:"neck-levels-left",version:1,group:"ent-head-neck",label:"Neck levels \u2014 left",region:"left neck",view:"lateral",laterality:"left",asset:"ent-head-neck/neck-levels-left.svg",width:1e3,height:1400,provenance:$t,description:"Left lateral neck, anterior toward the viewer's left, with cervical lymph-node levels IA, IB, IIA, IIB, III, IV, VA, VB and VI as dashed boundaries, and the mandible, hyoid, sternocleidomastoid and clavicle as landmarks."}];var jt={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Xa=[{id:"ear-right-external",version:1,group:"ent",label:"Ear \u2014 right external",region:"right ear",view:"lateral",laterality:"right",asset:"ent/ear-right-external.svg",width:1e3,height:1200,provenance:jt,description:"Right external ear seen from the side, anterior toward the viewer's right, with helix, antihelix, tragus and lobule, and dashed preauricular and mastoid areas."},{id:"ear-left-external",version:1,group:"ent",label:"Ear \u2014 left external",region:"left ear",view:"lateral",laterality:"left",asset:"ent/ear-left-external.svg",width:1e3,height:1200,provenance:jt,description:"Left external ear seen from the side, anterior toward the viewer's left, with helix, antihelix, tragus and lobule, and dashed preauricular and mastoid areas."},{id:"tympanic-membrane-right",version:1,group:"ent",label:"Tympanic membrane \u2014 right",region:"right tympanic membrane",view:"otoscopic",laterality:"right",asset:"ent/tympanic-membrane-right.svg",width:1e3,height:1e3,provenance:jt,description:"Right eardrum as seen through an otoscope: handle of malleus rising toward 1 o'clock, umbo, light reflex at 5 o'clock, pars flaccida above, anterior margin on the viewer's right, quadrants divided by dashed lines."},{id:"tympanic-membrane-left",version:1,group:"ent",label:"Tympanic membrane \u2014 left",region:"left tympanic membrane",view:"otoscopic",laterality:"left",asset:"ent/tympanic-membrane-left.svg",width:1e3,height:1e3,provenance:jt,description:"Left eardrum as seen through an otoscope: handle of malleus rising toward 11 o'clock, umbo, light reflex at 7 o'clock, pars flaccida above, anterior margin on the viewer's left, quadrants divided by dashed lines."},{id:"nose-external",version:1,group:"ent",label:"Nose \u2014 external",region:"nose",view:"anterior",laterality:"bilateral",asset:"ent/nose-external.svg",width:1e3,height:1200,provenance:jt,description:"External nose from the front, from bridge to base, with alae, tip, nostrils and columella; patient's right on the viewer's left."},{id:"nasal-septum",version:1,group:"ent",label:"Nasal septum",region:"nasal septum",view:"sagittal",laterality:"midline",asset:"ent/nasal-septum.svg",width:1200,height:1e3,provenance:jt,description:"Schematic sagittal view of the nasal septum, anterior to the left, showing quadrangular cartilage, perpendicular plate of the ethmoid, vomer, maxillary crest and Little's area."},{id:"oropharynx",version:1,group:"ent",label:"Oropharynx \u2014 open mouth",region:"oropharynx",view:"open-mouth",laterality:"bilateral",asset:"ent/oropharynx.svg",width:1200,height:1e3,provenance:jt,description:"Open-mouth view of the throat showing palate, uvula, both tonsils between anterior and posterior pillars, posterior pharyngeal wall and tongue; patient's right on the viewer's left."}];var Mn={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Nn={width:1400,height:1e3},Qa=[{id:"external-eye-od",version:1,group:"eye-external",label:"External eye \u2014 right eye (OD)",region:"right eye",view:"external",laterality:"right",asset:"eye-external/external-eye-od.svg",...Nn,provenance:Mn,description:"Outline of the right eye seen from the front: upper and lower lids with lash line, lid creases, palpebral aperture, iris and pupil, and the caruncle at the nasal canthus; nasal side on the viewer's right, labelled OD, N and T."},{id:"external-eye-os",version:1,group:"eye-external",label:"External eye \u2014 left eye (OS)",region:"left eye",view:"external",laterality:"left",asset:"eye-external/external-eye-os.svg",...Nn,provenance:Mn,description:"Outline of the left eye seen from the front: upper and lower lids with lash line, lid creases, palpebral aperture, iris and pupil, and the caruncle at the nasal canthus; nasal side on the viewer's left, labelled OS, N and T."}];var Za={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Ja=[{id:"face-frontal",version:1,group:"face",label:"Face \u2014 frontal",region:"face",view:"frontal",laterality:"bilateral",asset:"face/face-frontal.svg",width:1e3,height:1200,provenance:Za,description:"Face seen from the front from hairline to chin, with eyebrows, eyes, nose, lips and ears as light landmarks. The patient's right is on the viewer's left, marked R."},{id:"face-right-profile",version:1,group:"face",label:"Face \u2014 right profile",region:"face",view:"right profile",laterality:"right",asset:"face/face-right-profile.svg",width:1e3,height:1200,provenance:Za,description:"Face seen in profile from the patient's right side, facing the viewer's right, with brow, eye, nose, lips, chin and ear as light landmarks. Anterior (A) is on the right of the image and posterior (P) on the left."},{id:"face-left-profile",version:1,group:"face",label:"Face \u2014 left profile",region:"face",view:"left profile",laterality:"left",asset:"face/face-left-profile.svg",width:1e3,height:1200,provenance:Za,description:"Face seen in profile from the patient's left side, facing the viewer's left, with brow, eye, nose, lips, chin and ear as light landmarks. Anterior (A) is on the left of the image and posterior (P) on the right."}];var Fi={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},es=[{id:"foot-right-dorsal",version:1,group:"feet",label:"Foot \u2014 right dorsal",region:"right foot",view:"dorsal",laterality:"right",asset:"feet/foot-right-dorsal.svg",width:800,height:1400,provenance:Fi,description:"Right foot dorsal view with the toes pointing up and the big toe, on the medial side, at the viewer's left; ankle crease, malleoli, tendon lines and toenails are marked."},{id:"foot-right-plantar",version:1,group:"feet",label:"Foot \u2014 right plantar",region:"right foot",view:"plantar",laterality:"right",asset:"feet/foot-right-plantar.svg",width:800,height:1400,provenance:Fi,description:"Right foot plantar view with the toes pointing up and the big toe, on the medial side, at the viewer's right; hindfoot, midfoot and forefoot regions, the ball of the foot and the arch edge are marked."},{id:"foot-left-dorsal",version:1,group:"feet",label:"Foot \u2014 left dorsal",region:"left foot",view:"dorsal",laterality:"left",asset:"feet/foot-left-dorsal.svg",width:800,height:1400,provenance:Fi,description:"Left foot dorsal view with the toes pointing up and the big toe, on the medial side, at the viewer's right; ankle crease, malleoli, tendon lines and toenails are marked."},{id:"foot-left-plantar",version:1,group:"feet",label:"Foot \u2014 left plantar",region:"left foot",view:"plantar",laterality:"left",asset:"feet/foot-left-plantar.svg",width:800,height:1400,provenance:Fi,description:"Left foot plantar view with the toes pointing up and the big toe, on the medial side, at the viewer's left; hindfoot, midfoot and forefoot regions, the ball of the foot and the arch edge are marked."},{id:"toenails",version:1,group:"feet",label:"Toenails \u2014 both feet",region:"toenails",view:"dorsal",laterality:"bilateral",asset:"feet/toenails.svg",width:1600,height:1e3,provenance:Fi,description:"Dorsal view of the forefoot and toes of both feet, toes up, big toes toward the middle; the left foot is on the viewer's left. Each of the ten toenails is shaded."}];var Ui={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ts=[{id:"genital-male-external",version:1,group:"genital-perineal",label:"Male external genitalia",region:"male external genitalia",view:"anterior",laterality:"midline",asset:"genital-perineal/genital-male-external.svg",width:1e3,height:1200,provenance:Ui,description:"Schematic anterior outline of the penis with glans, scrotum with median raphe and testes, inguinal folds and medial thighs; patient's right on the viewer's left."},{id:"genital-female-external",version:1,group:"genital-perineal",label:"Female external genitalia",region:"female external genitalia",view:"lithotomy",laterality:"midline",asset:"genital-perineal/genital-female-external.svg",width:1e3,height:1200,provenance:Ui,description:"Schematic lithotomy outline of the vulva with mons pubis, labia majora and minora, clitoris, urethral meatus, vaginal introitus, perineum and anus; anterior at the top."},{id:"perineum",version:1,group:"genital-perineal",label:"Perineum",region:"perineum",view:"lithotomy",laterality:"midline",asset:"genital-perineal/perineum.svg",width:1e3,height:1e3,provenance:Ui,description:"Lithotomy perineum diamond from pubic symphysis to coccyx between the ischial tuberosities, divided into urogenital and anal triangles with perineal body and anus; anterior at the top."},{id:"perianal",version:1,group:"genital-perineal",label:"Perianal region",region:"perianal",view:"lithotomy",laterality:"midline",asset:"genital-perineal/perianal.svg",width:1e3,height:1e3,provenance:Ui,description:"Lithotomy perianal outline with the anus and radial skin folds at the centre, two concentric perianal rings, anterior raphe and natal cleft; anterior at the top, labelled."},{id:"anal-canal-clock-face",version:1,group:"genital-perineal",label:"Anal canal \u2014 clock face",region:"anal canal",view:"lithotomy",laterality:"midline",asset:"genital-perineal/anal-canal-clock-face.svg",width:1e3,height:1e3,provenance:Ui,description:"Lithotomy clock face of the anal canal with all twelve hours marked, 12 o'clock anterior and 3 o'clock on the patient's left, with concentric perianal skin and anal canal rings."}];var xt={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},is=[{id:"oesophagus-endoscopy-map",version:1,group:"gi-tract",label:"Oesophagus \u2014 endoscopy map",region:"oesophagus",view:"anterior",laterality:"midline",asset:"gi-tract/oesophagus-endoscopy-map.svg",width:1e3,height:1400,provenance:xt,description:"Vertical oesophagus schematic with a distance scale from the incisors (15 to 40 cm), upper oesophageal sphincter, aortic arch and left main bronchus indentations, diaphragmatic hiatus, dashed Z-line and the gastro-oesophageal junction."},{id:"stomach-endoscopy-map",version:1,group:"gi-tract",label:"Stomach \u2014 endoscopy map",region:"stomach",view:"anterior",laterality:"midline",asset:"gi-tract/stomach-endoscopy-map.svg",width:1200,height:1200,provenance:xt,description:"Stomach outline from the oesophageal entry to the duodenal bulb with cardia, fundus, upper, mid and lower body, incisura angularis, antrum, pylorus (sphincter) and lesser and greater curvatures separated by dashed boundaries, plus a small circumferential wall key."},{id:"stomach-retroflexion",version:1,group:"gi-tract",label:"Stomach \u2014 retroflexed cardia view",region:"stomach",view:"retroflexed",laterality:"not-applicable",asset:"gi-tract/stomach-retroflexion.svg",width:1200,height:1200,provenance:xt,description:"Circular endoscopic field of the retroflexed view of the cardia, with the scope shaft passing through the gastro-oesophageal junction ring, fundal folds around it and the lesser and greater curve sides labelled."},{id:"duodenum-segments",version:1,group:"gi-tract",label:"Duodenum \u2014 segments D1 to D4",region:"duodenum",view:"anterior",laterality:"midline",asset:"gi-tract/duodenum-segments.svg",width:1e3,height:1e3,provenance:xt,description:"Duodenal C-loop from the pylorus through D1 (bulb), D2 with major and minor papillae, D3 and D4 to the duodenojejunal flexure, with the pancreatic head outlined lightly inside the loop."},{id:"colon-colonoscopy-map",version:1,group:"gi-tract",label:"Colon \u2014 colonoscopy map",region:"colon",view:"anterior",laterality:"midline",asset:"gi-tract/colon-colonoscopy-map.svg",width:1400,height:1200,provenance:xt,description:"Whole colon framed in the abdominal outline, from caecum with appendix, ileocaecal valve and terminal ileum through the hepatic flexure, transverse colon, splenic flexure and descending colon to the sigmoid loop, rectosigmoid junction, rectum and anal canal, with approximate distance-from-anal-verge ticks at 15, 30, 40 and 60 cm and the anal verge at 0 cm."},{id:"sigmoid-rectum",version:1,group:"gi-tract",label:"Sigmoid and rectum",region:"rectum",view:"anterior",laterality:"midline",asset:"gi-tract/sigmoid-rectum.svg",width:1200,height:1200,provenance:xt,description:"Sigmoid colon, rectosigmoid junction, rectum in upper, middle and lower thirds with distance ticks at 5, 10 and 15 cm from the anal verge, valves of Houston, anorectal junction and anal canal."},{id:"small-bowel-overview",version:1,group:"gi-tract",label:"Small bowel \u2014 overview",region:"small bowel",view:"anterior",laterality:"midline",asset:"gi-tract/small-bowel-overview.svg",width:1e3,height:1200,provenance:xt,description:"Abdomen with jejunal loops on the patient's left and ileal loops towards the right iliac fossa, from the duodenojejunal flexure to the ileocaecal valve, with the mesentery root as a dashed line."},{id:"biliary-pancreatic-ercp",version:1,group:"gi-tract",label:"Biliary tree and pancreatic duct \u2014 ERCP",region:"biliary tree",view:"anterior",laterality:"midline",asset:"gi-tract/biliary-pancreatic-ercp.svg",width:1200,height:1200,provenance:xt,description:"ERCP schematic with right and left hepatic ducts and intrahepatic branches, common hepatic duct, cystic duct and gallbladder, common bile duct, pancreatic duct along the pancreas, and the ampulla in the second part of the duodenum."}];var wt={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},rs=[{id:"globe-cross-section",version:1,group:"globe-orbit",label:"Globe \u2014 horizontal cross-section",region:"globe",view:"cross-section",laterality:"not-applicable",asset:"globe-orbit/globe-cross-section.svg",width:1400,height:1e3,provenance:wt,description:"Horizontal cross-section of the whole eye with anterior at the left: cornea, anterior chamber, iris, lens, zonules, ciliary body, vitreous cavity, and sclera, choroid and retina as concentric layers at the posterior wall, with the macula and fovea on the visual axis and the optic disc, optic nerve and nerve sheath offset to one side."},{id:"globe-surgical-od",version:1,group:"globe-orbit",label:"Globe for vitreoretinal surgery \u2014 right eye (OD)",region:"right eye",view:"surgical",laterality:"right",asset:"globe-orbit/globe-surgical-od.svg",width:1400,height:1400,provenance:wt,description:"Front view of the right globe for vitreoretinal surgery: limbus and pupil, the four rectus insertions (SR 7.7, IR 6.5, MR 5.5, LR 6.9 mm from the limbus), a dashed scleral buckle equator line and three pars plana ports about 4 mm from the limbus at 10, 2 and 8 o'clock; nasal side on the viewer's right, labelled OD, N, T and clock hours."},{id:"globe-surgical-os",version:1,group:"globe-orbit",label:"Globe for vitreoretinal surgery \u2014 left eye (OS)",region:"left eye",view:"surgical",laterality:"left",asset:"globe-orbit/globe-surgical-os.svg",width:1400,height:1400,provenance:wt,description:"Front view of the left globe for vitreoretinal surgery: limbus and pupil, the four rectus insertions (SR 7.7, IR 6.5, MR 5.5, LR 6.9 mm from the limbus), a dashed scleral buckle equator line and three pars plana ports about 4 mm from the limbus at 2, 10 and 4 o'clock; nasal side on the viewer's left, labelled OS, N, T and clock hours."},{id:"eyelids-od",version:1,group:"globe-orbit",label:"Eyelids \u2014 right eye (OD)",region:"right eyelids",view:"eyelid detail",laterality:"right",asset:"globe-orbit/eyelids-od.svg",width:1400,height:1e3,provenance:wt,description:"Oculoplastic detail of the right eyelids from the front: upper and lower lid margins with lash line, grey line and posterior lip, upper lid crease, lower lid fold, upper and lower puncta, caruncle and the medial and lateral canthi; nasal side on the viewer's right, labelled OD, N and T."},{id:"eyelids-os",version:1,group:"globe-orbit",label:"Eyelids \u2014 left eye (OS)",region:"left eyelids",view:"eyelid detail",laterality:"left",asset:"globe-orbit/eyelids-os.svg",width:1400,height:1e3,provenance:wt,description:"Oculoplastic detail of the left eyelids from the front: upper and lower lid margins with lash line, grey line and posterior lip, upper lid crease, lower lid fold, upper and lower puncta, caruncle and the medial and lateral canthi; nasal side on the viewer's left, labelled OS, N and T."},{id:"lacrimal-system-right",version:1,group:"globe-orbit",label:"Lacrimal drainage system \u2014 right",region:"right lacrimal system",view:"schematic",laterality:"right",asset:"globe-orbit/lacrimal-system-right.svg",width:1100,height:1150,provenance:wt,description:"Schematic of the right lacrimal drainage system seen from the front, patient's right on the viewer's left: lacrimal gland above the lateral lids, upper and lower puncta, upper, lower and common canaliculi, lacrimal sac, nasolacrimal duct and its outlet in the inferior meatus beneath the inferior turbinate, labelled R and L."},{id:"orbit-coronal",version:1,group:"globe-orbit",label:"Orbit \u2014 coronal (right orbit)",region:"right orbit",view:"coronal",laterality:"right",asset:"globe-orbit/orbit-coronal.svg",width:1200,height:1200,provenance:wt,description:"Coronal view of the right orbit in the radiological convention, patient's right on the viewer's left so the lateral wall is at the left and the medial wall at the right: orbital roof, floor and walls around the centred globe, the superior, inferior, medial and lateral recti, the superior and inferior obliques and the optic nerve at the centre, labelled R and L."},{id:"orbit-axial",version:1,group:"globe-orbit",label:"Orbits \u2014 axial",region:"both orbits",view:"axial",laterality:"bilateral",asset:"globe-orbit/orbit-axial.svg",width:1400,height:1e3,provenance:wt,description:"Axial view of both orbits with anterior at the top and the patient's right on the viewer's left (radiological convention): the globes, medial and lateral recti, medial and lateral orbital walls, ethmoid sinuses between the orbits, and the optic nerves converging to the optic chiasm, labelled R, L and Anterior."}];var Bn={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},as=[{id:"cervix-clock-face",version:1,group:"gynaecology",label:"Cervix \u2014 clock face",region:"cervix",view:"colposcopic",laterality:"midline",asset:"gynaecology/cervix-clock-face.svg",width:1200,height:1200,provenance:Bn,description:"Colposcopic view of the cervix with the external os at the centre, a dashed ring for the transformation zone, and clock hours marked: 12 anterior at the top, 6 posterior, 9 on the viewer's left (patient's right) and 3 on the viewer's right."},{id:"uterus-adnexa",version:1,group:"gynaecology",label:"Uterus and adnexa \u2014 frontal",region:"uterus",view:"anterior",laterality:"bilateral",asset:"gynaecology/uterus-adnexa.svg",width:1200,height:1200,provenance:Bn,description:"Frontal schematic of the uterus showing fundus, body with cavity, cervix and canal, both fallopian tubes with fimbriae, both ovaries and the vagina. The patient's right is on the viewer's left, marked R."}];var Gi={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ss=[{id:"hand-right-palmar",version:1,group:"hands",label:"Hand \u2014 right palmar",region:"right hand",view:"palmar",laterality:"right",asset:"hands/hand-right-palmar.svg",width:1e3,height:1400,provenance:Gi,description:"Right hand palmar view with the fingers pointing up and the thumb on the viewer's right; palmar and finger flexion creases and the wrist creases are marked."},{id:"hand-right-dorsal",version:1,group:"hands",label:"Hand \u2014 right dorsal",region:"right hand",view:"dorsal",laterality:"right",asset:"hands/hand-right-dorsal.svg",width:1e3,height:1400,provenance:Gi,description:"Right hand dorsal view with the fingers pointing up and the thumb on the viewer's left; knuckle creases, tendon lines and fingernails are marked."},{id:"hand-left-palmar",version:1,group:"hands",label:"Hand \u2014 left palmar",region:"left hand",view:"palmar",laterality:"left",asset:"hands/hand-left-palmar.svg",width:1e3,height:1400,provenance:Gi,description:"Left hand palmar view with the fingers pointing up and the thumb on the viewer's left; palmar and finger flexion creases and the wrist creases are marked."},{id:"hand-left-dorsal",version:1,group:"hands",label:"Hand \u2014 left dorsal",region:"left hand",view:"dorsal",laterality:"left",asset:"hands/hand-left-dorsal.svg",width:1e3,height:1400,provenance:Gi,description:"Left hand dorsal view with the fingers pointing up and the thumb on the viewer's right; knuckle creases, tendon lines and fingernails are marked."},{id:"fingernails",version:1,group:"hands",label:"Fingernails \u2014 both hands",region:"fingernails",view:"dorsal",laterality:"bilateral",asset:"hands/fingernails.svg",width:1400,height:1e3,provenance:Gi,description:"Dorsal view of the fingers and nails of both hands, fingers up, thumbs pointing toward the middle; the left hand is on the viewer's left. Each of the ten nails is shaded."}];var Yi={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},os=[{id:"head-front",version:1,group:"head-scalp",label:"Head \u2014 front",region:"head",view:"front",laterality:"bilateral",asset:"head-scalp/head-front.svg",width:1e3,height:1200,provenance:Yi,description:"Head and upper neck seen from the front, with the frontal hairline, ears, eyes, nose and mouth as light landmarks. The patient's right is on the viewer's left, marked R."},{id:"head-back",version:1,group:"head-scalp",label:"Head \u2014 back",region:"head",view:"back",laterality:"bilateral",asset:"head-scalp/head-back.svg",width:1e3,height:1200,provenance:Yi,description:"Head and upper neck seen from behind, with the ears, the occipital prominence, the nape hairline and a dashed midline over the scalp. The patient's right is on the viewer's right, marked R."},{id:"head-vertex",version:1,group:"head-scalp",label:"Head \u2014 vertex",region:"head",view:"vertex",laterality:"bilateral",asset:"head-scalp/head-vertex.svg",width:1e3,height:1e3,provenance:Yi,description:"Top of the head seen from above with the nose at the top of the image, the ears at the sides, the anterior hairline and a dashed sagittal midline. The patient's right is on the viewer's right, marked R."},{id:"head-right-side",version:1,group:"head-scalp",label:"Head \u2014 right side",region:"head",view:"right lateral",laterality:"right",asset:"head-scalp/head-right-side.svg",width:1e3,height:1200,provenance:Yi,description:"Head and upper neck seen from the patient's right side, facing the viewer's right, with the ear, hairline and jaw line as landmarks. Anterior (A) is on the right of the image and posterior (P) on the left."},{id:"head-left-side",version:1,group:"head-scalp",label:"Head \u2014 left side",region:"head",view:"left lateral",laterality:"left",asset:"head-scalp/head-left-side.svg",width:1e3,height:1200,provenance:Yi,description:"Head and upper neck seen from the patient's left side, facing the viewer's left, with the ear, hairline and jaw line as landmarks. Anterior (A) is on the left of the image and posterior (P) on the right."}];var Rr={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},_n={width:1400,height:1e3},Hn={width:1200,height:1200},ns=[{id:"lens-cross-section",version:1,group:"lens",label:"Lens \u2014 sagittal cross-section",region:"lens",view:"sagittal cross-section",laterality:"not-applicable",asset:"lens/lens-cross-section.svg",..._n,provenance:Rr,description:"Sagittal schematic of the crystalline lens with anterior up: anterior and posterior capsule, cortex and nucleus, zonules, ciliary body and processes on both sides, and the iris for context."},{id:"lens-slit-section",version:1,group:"lens",label:"Lens \u2014 slit-lamp optical section",region:"lens",view:"slit-lamp optical section",laterality:"not-applicable",asset:"lens/lens-slit-section.svg",..._n,provenance:Rr,description:"Slit-lamp optical section of the lens with anterior up and the slit beam marked: anterior capsule, anterior cortex, adult, infantile, fetal and embryonic nuclear zones, posterior cortex and posterior capsule, for grading nuclear opacity."},{id:"lens-retroillumination-od",version:1,group:"lens",label:"Lens retroillumination \u2014 right eye (OD)",region:"right lens",view:"retroillumination",laterality:"right",asset:"lens/lens-retroillumination-od.svg",...Hn,provenance:Rr,description:"Red-reflex retroillumination chart of the right lens: dilated pupil circle with dashed zone rings and clock-hour radials, 12, 3, 6 and 9 labelled; nasal on the viewer's right, labelled OD, N and T."},{id:"lens-retroillumination-os",version:1,group:"lens",label:"Lens retroillumination \u2014 left eye (OS)",region:"left lens",view:"retroillumination",laterality:"left",asset:"lens/lens-retroillumination-os.svg",...Hn,provenance:Rr,description:"Red-reflex retroillumination chart of the left lens: dilated pupil circle with dashed zone rings and clock-hour radials, 12, 3, 6 and 9 labelled; nasal on the viewer's left, labelled OS, N and T."}];var St={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ls=[{id:"lower-limb-right-anterior",version:1,group:"lower-limbs",label:"Lower limb \u2014 right anterior",region:"right lower limb",view:"anterior",laterality:"right",asset:"lower-limbs/lower-limb-right-anterior.svg",width:800,height:1600,provenance:St,description:"Right thigh, knee, leg and foot in anatomical position seen from the front, big toe on the medial side; patella, tibial tuberosity, tibial crest and malleoli are marked."},{id:"lower-limb-right-posterior",version:1,group:"lower-limbs",label:"Lower limb \u2014 right posterior",region:"right lower limb",view:"posterior",laterality:"right",asset:"lower-limbs/lower-limb-right-posterior.svg",width:800,height:1600,provenance:St,description:"Right thigh, knee, leg and foot in anatomical position seen from the back; gluteal fold, popliteal crease, calf, Achilles tendon and heel are marked."},{id:"lower-limb-left-anterior",version:1,group:"lower-limbs",label:"Lower limb \u2014 left anterior",region:"left lower limb",view:"anterior",laterality:"left",asset:"lower-limbs/lower-limb-left-anterior.svg",width:800,height:1600,provenance:St,description:"Left thigh, knee, leg and foot in anatomical position seen from the front, big toe on the medial side; patella, tibial tuberosity, tibial crest and malleoli are marked."},{id:"lower-limb-left-posterior",version:1,group:"lower-limbs",label:"Lower limb \u2014 left posterior",region:"left lower limb",view:"posterior",laterality:"left",asset:"lower-limbs/lower-limb-left-posterior.svg",width:800,height:1600,provenance:St,description:"Left thigh, knee, leg and foot in anatomical position seen from the back; gluteal fold, popliteal crease, calf, Achilles tendon and heel are marked."},{id:"knee-right",version:1,group:"lower-limbs",label:"Knee \u2014 right",region:"right knee",view:"anterior",laterality:"right",asset:"lower-limbs/knee-right.svg",width:1e3,height:1400,provenance:St,description:"Anterior view of the right knee with distal thigh and proximal leg: patella, quadriceps tendon, patellar ligament, tibial tuberosity and the joint line."},{id:"ankle-right",version:1,group:"lower-limbs",label:"Ankle \u2014 right",region:"right ankle",view:"anterior",laterality:"right",asset:"lower-limbs/ankle-right.svg",width:1e3,height:1400,provenance:St,description:"Anterior view of the right ankle with distal leg and the front of the foot, big toe on the medial side; both malleoli, the ankle crease and the toes are marked."},{id:"knee-left",version:1,group:"lower-limbs",label:"Knee \u2014 left",region:"left knee",view:"anterior",laterality:"left",asset:"lower-limbs/knee-left.svg",width:1e3,height:1400,provenance:St,description:"Anterior view of the left knee with distal thigh and proximal leg: patella, quadriceps tendon, patellar ligament, tibial tuberosity and the joint line."},{id:"ankle-left",version:1,group:"lower-limbs",label:"Ankle \u2014 left",region:"left ankle",view:"anterior",laterality:"left",asset:"lower-limbs/ankle-left.svg",width:1e3,height:1400,provenance:St,description:"Anterior view of the left ankle with distal leg and the front of the foot, big toe on the medial side; both malleoli, the ankle crease and the toes are marked."}];var ti={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ds=[{id:"neck-anterior",version:1,group:"neck",label:"Neck \u2014 anterior",region:"neck",view:"anterior",laterality:"bilateral",asset:"neck/neck-anterior.svg",width:1200,height:1e3,provenance:ti,description:"Front of the neck from the chin and jaw to the upper chest, with the sternocleidomastoid muscles, hyoid, thyroid cartilage, trachea, thyroid gland region, clavicles and suprasternal notch as landmarks. The patient's right is on the viewer's left, marked R."},{id:"neck-posterior",version:1,group:"neck",label:"Neck \u2014 posterior",region:"neck",view:"posterior",laterality:"bilateral",asset:"neck/neck-posterior.svg",width:1200,height:1e3,provenance:ti,description:"Back of the neck from the skull base to the upper back, with the nape hairline, C7 prominence, spinous process line, trapezius slope and upper scapular borders as landmarks. The patient's right is on the viewer's right, marked R."},{id:"neck-right-lateral",version:1,group:"neck",label:"Neck \u2014 right lateral",region:"neck",view:"right lateral",laterality:"right",asset:"neck/neck-right-lateral.svg",width:1200,height:1e3,provenance:ti,description:"Side of the neck seen from the patient's right side, facing the viewer's right, with the ear, jaw line, sternocleidomastoid, trapezius slope and clavicle region as landmarks. Anterior (A) is on the right of the image and posterior (P) on the left."},{id:"neck-left-lateral",version:1,group:"neck",label:"Neck \u2014 left lateral",region:"neck",view:"left lateral",laterality:"left",asset:"neck/neck-left-lateral.svg",width:1200,height:1e3,provenance:ti,description:"Side of the neck seen from the patient's left side, facing the viewer's left, with the ear, jaw line, sternocleidomastoid, trapezius slope and clavicle region as landmarks. Anterior (A) is on the left of the image and posterior (P) on the right."},{id:"supraclavicular-right",version:1,group:"neck",label:"Supraclavicular \u2014 right",region:"right supraclavicular fossa",view:"anterior",laterality:"right",asset:"neck/supraclavicular-right.svg",width:1200,height:1e3,provenance:ti,description:"Front of the patient's right neck and shoulder with the clavicle, sternocleidomastoid and trapezius borders, and the supraclavicular fossa outlined with a dashed line. The midline is at the right edge of the drawing."},{id:"supraclavicular-left",version:1,group:"neck",label:"Supraclavicular \u2014 left",region:"left supraclavicular fossa",view:"anterior",laterality:"left",asset:"neck/supraclavicular-left.svg",width:1200,height:1e3,provenance:ti,description:"Front of the patient's left neck and shoulder with the clavicle, sternocleidomastoid and trapezius borders, and the supraclavicular fossa outlined with a dashed line. The midline is at the left edge of the drawing."}];var zt={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},cs=[{id:"neonate-body-anterior",version:1,group:"neonatal",label:"Neonate body \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"neonatal/neonate-body-anterior.svg",width:900,height:1400,provenance:zt,description:"Newborn body in anterior view with the head about a quarter of the length, short limbs, nipples, and an umbilical stump with a cord clamp. Patient's right on the viewer's left."},{id:"neonate-body-posterior",version:1,group:"neonatal",label:"Neonate body \u2014 posterior",region:"whole body",view:"posterior",laterality:"bilateral",asset:"neonatal/neonate-body-posterior.svg",width:900,height:1400,provenance:zt,description:"Newborn body in posterior view with the same proportions, spine line, gluteal folds and popliteal creases. Patient's right on the viewer's right."},{id:"neonate-head-vertex",version:1,group:"neonatal",label:"Neonate head \u2014 vertex",region:"head",view:"vertex",laterality:"bilateral",asset:"neonatal/neonate-head-vertex.svg",width:1400,height:1200,provenance:zt,description:"Newborn skull seen from above with the diamond anterior and triangular posterior fontanelles and the sagittal, coronal, lambdoid and metopic sutures, for marking caput, cephalhaematoma, moulding and subgaleal swelling. Face at the top, baby's right on the viewer's right."},{id:"neonate-head-lateral-right",version:1,group:"neonatal",label:"Neonate head \u2014 right lateral",region:"head",view:"right lateral",laterality:"right",asset:"neonatal/neonate-head-lateral-right.svg",width:1300,height:1200,provenance:zt,description:"Right side of a newborn head with ear, face profile, sagittal, coronal and lambdoid sutures and the anterior and posterior fontanelles; face to the viewer's right."},{id:"neonate-head-lateral-left",version:1,group:"neonatal",label:"Neonate head \u2014 left lateral",region:"head",view:"left lateral",laterality:"left",asset:"neonatal/neonate-head-lateral-left.svg",width:1300,height:1200,provenance:zt,description:"Left side of a newborn head with ear, face profile, sagittal, coronal and lambdoid sutures and the anterior and posterior fontanelles; face to the viewer's left."},{id:"neonate-face-oral",version:1,group:"neonatal",label:"Neonate face and palate",region:"face and palate",view:"anterior with palate inset",laterality:"midline",asset:"neonatal/neonate-face-oral.svg",width:1700,height:1050,provenance:zt,description:"Newborn face in front view with nose, philtrum and upper and lower lips, beside an open-mouth inset of the hard and soft palate with alveolar ridge, incisive papilla and uvula, for cleft lip and palate marking. Patient's right on the viewer's left."},{id:"neonate-hips-feet",version:1,group:"neonatal",label:"Neonate hips and feet",region:"hips and feet",view:"supine anterior",laterality:"bilateral",asset:"neonatal/neonate-hips-feet.svg",width:1200,height:1300,provenance:zt,description:"Supine newborn lower body from the umbilicus to the toes with both hip joints, groin creases, thigh folds, patellae and feet, for recording the hip examination side and foot position such as talipes. Patient's right on the viewer's left."}];var ps={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},hs=[{id:"spine-sagittal-neuro",version:1,group:"neuro-spine",label:"Spine \u2014 sagittal (C2 to S1)",region:"spine",view:"sagittal",laterality:"midline",asset:"neuro-spine/spine-sagittal-neuro.svg",width:1e3,height:2e3,provenance:ps,description:"Sagittal spine from C2 to S1, anterior to the left of the drawing, with vertebral bodies, intervertebral discs, spinal canal, cord ending at L1-L2 and cauda equina below, each level labelled."},{id:"spinal-cord-cross-section",version:1,group:"neuro-spine",label:"Spinal cord \u2014 cross-section",region:"spinal cord",view:"axial cross-section",laterality:"midline",asset:"neuro-spine/spinal-cord-cross-section.svg",width:1200,height:1e3,provenance:ps,description:"Spinal cord cross-section with anterior at the top and patient right on the left of the drawing: grey matter dorsal and ventral horns, dorsal columns, lateral corticospinal and spinothalamic tracts, dorsal and ventral roots."},{id:"brachial-plexus-right",version:1,group:"neuro-spine",label:"Brachial plexus \u2014 right",region:"brachial plexus",view:"schematic anterior",laterality:"right",asset:"neuro-spine/brachial-plexus-right.svg",width:1400,height:1e3,provenance:ps,description:"Schematic right brachial plexus in anterior view with the spine at the right of the drawing: roots C5 to T1, trunks, divisions, cords and the musculocutaneous, axillary, radial, median and ulnar nerves."}];var Or={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Ar={width:1e3,height:1600},us=[{id:"dermatomes-anterior",version:1,group:"neurological",label:"Dermatomes \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"neurological/dermatomes-anterior.svg",...Ar,provenance:Or,description:"Whole-body anterior outline with dashed dermatome boundaries labelled V1\u2013V3 on the face and C3 to S1 on the neck, trunk, limbs, hands and feet. Patient right is on the viewer left."},{id:"dermatomes-posterior",version:1,group:"neurological",label:"Dermatomes \u2014 posterior",region:"whole body",view:"posterior",laterality:"bilateral",asset:"neurological/dermatomes-posterior.svg",...Ar,provenance:Or,description:"Whole-body posterior outline with dashed dermatome boundaries labelled C2 to S5, including a perianal S3\u2013S5 inset. Patient right is on the viewer right."},{id:"peripheral-nerves-anterior",version:1,group:"neurological",label:"Peripheral nerve territories \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"neurological/peripheral-nerves-anterior.svg",...Ar,provenance:Or,description:"Whole-body anterior outline with dashed cutaneous peripheral nerve territories labelled with short nerve names such as median, ulnar, femoral and saphenous. Patient right is on the viewer left."},{id:"peripheral-nerves-posterior",version:1,group:"neurological",label:"Peripheral nerve territories \u2014 posterior",region:"whole body",view:"posterior",laterality:"bilateral",asset:"neurological/peripheral-nerves-posterior.svg",...Ar,provenance:Or,description:"Whole-body posterior outline with dashed cutaneous peripheral nerve territories labelled with short nerve names such as occipital, cluneal, sural and radial. Patient right is on the viewer right."}];var kt={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ms=[{id:"episiotomy-perineum",version:1,group:"obstetric",label:"Episiotomy \u2014 perineum (lithotomy)",region:"perineum",view:"lithotomy",laterality:"midline",asset:"obstetric/episiotomy-perineum.svg",width:1400,height:1200,provenance:kt,description:"Lithotomy perineum with vulva, introitus, posterior fourchette, perineal body, anus and ischial tuberosities; dashed reference lines from the fourchette for midline, mediolateral 60 degrees (right and left, with angle arcs) and lateral incisions. 12 o'clock anterior, patient's right on the viewer's left."},{id:"perineal-tear-degrees",version:1,group:"obstetric",label:"Perineal tear \u2014 degrees",region:"perineum and anal sphincter",view:"lithotomy",laterality:"midline",asset:"obstetric/perineal-tear-degrees.svg",width:1400,height:1200,provenance:kt,description:"Lithotomy schematic of the perineum with concentric zones around the anus for classifying obstetric perineal tears: skin and vaginal epithelium (1st), perineal muscles (2nd), external anal sphincter split into 3a and 3b, internal anal sphincter (3c) and anorectal mucosa (4th degree). Anterior at the top."},{id:"perineal-repair",version:1,group:"obstetric",label:"Perineal repair",region:"perineum",view:"lithotomy",laterality:"midline",asset:"obstetric/perineal-repair.svg",width:1400,height:1200,provenance:kt,description:"Lithotomy perineum with vaginal apex, hymenal remnant and introitus, posterior fourchette, perineal body, perineal skin and anus, with a dashed midline repair line for drawing continuous and interrupted sutures. Anterior at the top, patient's right on the viewer's left."},{id:"cervix-dilatation",version:1,group:"obstetric",label:"Cervical dilatation 1\u201310 cm",region:"cervix",view:"row of circles",laterality:"not-applicable",asset:"obstetric/cervix-dilatation.svg",width:1400,height:700,provenance:kt,description:"A row of ten circles representing cervical dilatation from 1 to 10 cm, drawn in proportion to one another and labelled 1 to 10, for partogram-style marking."},{id:"fetal-head-position",version:1,group:"obstetric",label:"Fetal head position in the pelvis",region:"fetal head",view:"vertex in pelvis",laterality:"midline",asset:"obstetric/fetal-head-position.svg",width:1800,height:1200,provenance:kt,description:"Fetal skull seen from the vertex inside a circle representing the maternal pelvis, with anterior and posterior fontanelles and sagittal, coronal and lambdoid sutures; symphysis at the top, sacrum at the bottom, maternal right on the viewer's left, for drawing OA, OP and OT positions."},{id:"placenta-surfaces",version:1,group:"obstetric",label:"Placenta \u2014 maternal and fetal surfaces",region:"placenta",view:"both surfaces",laterality:"not-applicable",asset:"obstetric/placenta-surfaces.svg",width:1900,height:1e3,provenance:kt,description:"Two placental discs side by side: the maternal surface divided into cotyledons and the fetal surface with chorionic vessels radiating from the cord insertion, for recording completeness, cord insertion and infarcts."},{id:"abdomen-pregnant-leopold",version:1,group:"obstetric",label:"Pregnant abdomen \u2014 fetal lie and fundal height",region:"abdomen",view:"anterior",laterality:"bilateral",asset:"obstetric/abdomen-pregnant-leopold.svg",width:1200,height:1400,provenance:kt,description:"Term-pregnant abdomen in anterior view with the gravid outline, fundus, umbilicus and pubic symphysis, and dashed level guides at the symphysis, umbilicus and xiphisternum, for marking fetal lie, presentation and fundal height. Patient's right on the viewer's left."},{id:"caesarean-incisions",version:1,group:"obstetric",label:"Caesarean section \u2014 incisions",region:"lower abdomen",view:"anterior",laterality:"bilateral",asset:"obstetric/caesarean-incisions.svg",width:1400,height:1200,provenance:kt,description:"Pregnant lower abdomen in anterior view with umbilicus, symphysis, iliac spines and groin folds, and dashed reference incisions labelled Pfannenstiel (transverse lower) and midline (vertical). Patient's right on the viewer's left."}];var ii={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},qr={width:1600,height:1e3},Vn={width:1200,height:1200},gs=[{id:"oct-macula-bscan-od",version:1,group:"oct",label:"OCT macula B-scan \u2014 right eye (OD)",region:"right eye, macula",view:"horizontal B-scan",laterality:"right",asset:"oct/oct-macula-bscan-od.svg",...qr,provenance:ii,description:"Schematic horizontal OCT B-scan through the fovea of the right eye: central foveal pit with the retinal layers from ILM to sclera labelled, clear space between the RPE and neurosensory retina and beneath the RPE; nasal on the viewer's right, labelled OD, N and T."},{id:"oct-macula-bscan-os",version:1,group:"oct",label:"OCT macula B-scan \u2014 left eye (OS)",region:"left eye, macula",view:"horizontal B-scan",laterality:"left",asset:"oct/oct-macula-bscan-os.svg",...qr,provenance:ii,description:"Schematic horizontal OCT B-scan through the fovea of the left eye: central foveal pit with the retinal layers from ILM to sclera labelled, clear space between the RPE and neurosensory retina and beneath the RPE; nasal on the viewer's left, labelled OS, N and T."},{id:"oct-disc-bscan-od",version:1,group:"oct",label:"OCT optic disc B-scan \u2014 right eye (OD)",region:"right eye, optic nerve head",view:"horizontal B-scan",laterality:"right",asset:"oct/oct-disc-bscan-od.svg",...qr,provenance:ii,description:"Schematic horizontal OCT B-scan through the optic nerve head of the right eye: optic cup, RNFL thickening at the neuroretinal rim, Bruch's membrane opening and lamina cribrosa; nasal on the viewer's right, labelled OD, N and T."},{id:"oct-disc-bscan-os",version:1,group:"oct",label:"OCT optic disc B-scan \u2014 left eye (OS)",region:"left eye, optic nerve head",view:"horizontal B-scan",laterality:"left",asset:"oct/oct-disc-bscan-os.svg",...qr,provenance:ii,description:"Schematic horizontal OCT B-scan through the optic nerve head of the left eye: optic cup, RNFL thickening at the neuroretinal rim, Bruch's membrane opening and lamina cribrosa; nasal on the viewer's left, labelled OS, N and T."},{id:"oct-etdrs-grid-od",version:1,group:"oct",label:"OCT ETDRS grid \u2014 right eye (OD)",region:"right eye, macula",view:"ETDRS grid",laterality:"right",asset:"oct/oct-etdrs-grid-od.svg",...Vn,provenance:ii,description:"ETDRS macular grid of the right eye: 1, 3 and 6 mm rings, central subfield and inner and outer superior, nasal, inferior and temporal sectors split by diagonals; nasal on the viewer's right, labelled OD."},{id:"oct-etdrs-grid-os",version:1,group:"oct",label:"OCT ETDRS grid \u2014 left eye (OS)",region:"left eye, macula",view:"ETDRS grid",laterality:"left",asset:"oct/oct-etdrs-grid-os.svg",...Vn,provenance:ii,description:"ETDRS macular grid of the left eye: 1, 3 and 6 mm rings, central subfield and inner and outer superior, nasal, inferior and temporal sectors split by diagonals; nasal on the viewer's left, labelled OS."}];var od={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},nd={width:1400,height:1200},bs=[{id:"ocular-motility-chart",version:1,group:"ocular-motility",label:"Ocular motility \u2014 nine gaze positions",region:"both eyes",view:"nine gaze positions",laterality:"bilateral",asset:"ocular-motility/ocular-motility-chart.svg",...nd,provenance:od,description:"Three-by-three grid of the nine diagnostic gaze positions, each cell showing both eyes with the gaze direction; the patient's right eye is on the viewer's left, labelled R and L."}];var jn={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},zn={width:1200,height:1200},fs=[{id:"optic-disc-od",version:1,group:"optic-disc",label:"Optic disc \u2014 right eye (OD)",region:"right eye",view:"enlarged disc",laterality:"right",asset:"optic-disc/optic-disc-od.svg",...zn,provenance:jn,description:"Enlarged optic disc of the right eye with dashed cup outline, neuroretinal rim, vessels exiting nasally and ISNT sectors labelled I, S, N and T; nasal side on the viewer's right, labelled OD."},{id:"optic-disc-os",version:1,group:"optic-disc",label:"Optic disc \u2014 left eye (OS)",region:"left eye",view:"enlarged disc",laterality:"left",asset:"optic-disc/optic-disc-os.svg",...zn,provenance:jn,description:"Enlarged optic disc of the left eye with dashed cup outline, neuroretinal rim, vessels exiting nasally and ISNT sectors labelled I, S, N and T; nasal side on the viewer's left, labelled OS."}];var Lr={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},ys=[{id:"liver-couinaud",version:1,group:"organs",label:"Liver \u2014 Couinaud segments",region:"liver",view:"anterior",laterality:"midline",asset:"organs/liver-couinaud.svg",width:1400,height:1100,provenance:Lr,description:"Anterior view of the liver with Couinaud segments I to VIII numbered, the hepatic veins, umbilical fissure and portal division as dashed boundaries, and the gallbladder. The patient's right is on the viewer's left, marked R; segment I is hidden behind and shown dashed."},{id:"lung-lobes-anterior",version:1,group:"organs",label:"Lung lobes \u2014 anterior",region:"lungs",view:"anterior",laterality:"bilateral",asset:"organs/lung-lobes-anterior.svg",width:1400,height:1200,provenance:Lr,description:"Anterior view of both lungs with the right oblique and horizontal fissures and the left oblique fissure, lobes labelled RUL, RML, RLL, LUL, lingula and LLL, and the trachea with both main bronchi. The patient's right is on the viewer's left, marked R."},{id:"lung-lobes-posterior",version:1,group:"organs",label:"Lung lobes \u2014 posterior",region:"lungs",view:"posterior",laterality:"bilateral",asset:"organs/lung-lobes-posterior.svg",width:1400,height:1200,provenance:Lr,description:"Posterior view of both lungs with both oblique fissures rising toward the spine, upper and lower lobes labelled, and the trachea with both main bronchi. The patient's right is on the viewer's right, marked R."},{id:"heart-coronary-anterior",version:1,group:"organs",label:"Heart and coronary arteries \u2014 anterior",region:"heart",view:"anterior",laterality:"midline",asset:"organs/heart-coronary-anterior.svg",width:1200,height:1200,provenance:Lr,description:"Anterior heart outline with the aorta and pulmonary trunk and the main coronary arteries as labelled lines: left main stem, LAD with diagonals, circumflex with obtuse marginals, and right coronary artery with its posterior descending branch. The patient's right is on the viewer's left, marked R."}];var ri={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},vs=[{id:"spina-bifida-lumbosacral",version:1,group:"paediatric-surgery",label:"Spina bifida \u2014 lumbosacral region",region:"lumbosacral spine",view:"posterior",laterality:"midline",asset:"paediatric-surgery/spina-bifida-lumbosacral.svg",width:1e3,height:1200,provenance:ri,description:"Neonatal back from the thoracolumbar region to the buttocks, posterior view, with the spinous process line, iliac crests, natal cleft and a dashed zone over the lumbosacral spine for marking a sac, dimple, hair tuft or haemangioma."},{id:"cleft-lip-palate-classification",version:1,group:"paediatric-surgery",label:"Cleft lip and palate \u2014 classification",region:"lip and palate",view:"front and palate",laterality:"bilateral",asset:"paediatric-surgery/cleft-lip-palate-classification.svg",width:1400,height:1e3,provenance:ri,description:"Infant upper lip and nose from the front beside an open-mouth palate view, with dashed guides for unilateral right, unilateral left and bilateral lip clefts, the alveolus, the primary palate at the incisive foramen and the secondary hard and soft palate."},{id:"abdominal-wall-defects",version:1,group:"paediatric-surgery",label:"Abdominal wall defects",region:"abdominal wall",view:"anterior",laterality:"midline",asset:"paediatric-surgery/abdominal-wall-defects.svg",width:1800,height:1200,provenance:ri,description:"Neonatal abdomen from the front with the umbilical cord insertion centred, and an enlarged inset marking the right paraumbilical gastroschisis site and the central umbilical ring omphalocele site."},{id:"anorectal-malformation-perineum",version:1,group:"paediatric-surgery",label:"Anorectal malformation \u2014 perineum",region:"perineum",view:"lithotomy",laterality:"midline",asset:"paediatric-surgery/anorectal-malformation-perineum.svg",width:1800,height:1e3,provenance:ri,description:"Neonatal perineum in lithotomy shown as male and female variants side by side, each with the normal anal position as a dashed circle, perineal body, anal dimple and the scrotum or vulva outline; anterior at the top."},{id:"hypospadias-meatus-positions",version:1,group:"paediatric-surgery",label:"Hypospadias \u2014 meatal positions",region:"penis",view:"ventral",laterality:"midline",asset:"paediatric-surgery/hypospadias-meatus-positions.svg",width:1e3,height:1200,provenance:ri,description:"Penis in ventral view with the scrotum above, and dots along the ventral midline for the glanular, coronal, distal shaft, mid-shaft, proximal shaft, penoscrotal, scrotal and perineal meatal positions."},{id:"inguinoscrotal-paediatric",version:1,group:"paediatric-surgery",label:"Inguinoscrotal region \u2014 child",region:"groin and scrotum",view:"anterior",laterality:"bilateral",asset:"paediatric-surgery/inguinoscrotal-paediatric.svg",width:1200,height:1200,provenance:ri,description:"Child lower abdomen and groin from the front, with both inguinal canals as dashed courses between the deep and superficial rings, the inguinal ligaments, and the scrotum with testes for marking hernia, hydrocele and undescended testis."}];var Er={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},$s=[{id:"child-body-anterior",version:1,group:"paediatric",label:"Child body \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"paediatric/child-body-anterior.svg",width:800,height:1400,provenance:Er,description:"Child of about five years seen from the front in anatomical position, with a proportionally larger head and shorter legs than an adult. The patient's right is on the viewer's left, marked R."},{id:"child-body-posterior",version:1,group:"paediatric",label:"Child body \u2014 posterior",region:"whole body",view:"posterior",laterality:"bilateral",asset:"paediatric/child-body-posterior.svg",width:800,height:1400,provenance:Er,description:"Child of about five years seen from behind in anatomical position, with the spine, scapulae and gluteal folds marked. The patient's right is on the viewer's right, marked R."},{id:"infant-body-anterior",version:1,group:"paediatric",label:"Infant body \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"paediatric/infant-body-anterior.svg",width:800,height:1400,provenance:Er,description:"Infant seen from the front, head about a quarter of the height, short limbs and a rounded trunk, with the anterior fontanelle shown as a light diamond on the crown. The patient's right is on the viewer's left, marked R."},{id:"infant-body-posterior",version:1,group:"paediatric",label:"Infant body \u2014 posterior",region:"whole body",view:"posterior",laterality:"bilateral",asset:"paediatric/infant-body-posterior.svg",width:800,height:1400,provenance:Er,description:"Infant seen from behind, head about a quarter of the height, with the spine, scapulae and gluteal folds marked. The patient's right is on the viewer's right, marked R."}];var Pr={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},xs=[{id:"gluteal-right",version:1,group:"pelvis",label:"Gluteal region \u2014 right",region:"gluteal",view:"posterior",laterality:"right",asset:"pelvis/gluteal-right.svg",width:1e3,height:1200,provenance:Pr,description:"Posterior view of the patient's right buttock on the viewer's right, with iliac crest, PSIS, gluteal fold, greater trochanter, ischial tuberosity and injection-quadrant dividers."},{id:"gluteal-left",version:1,group:"pelvis",label:"Gluteal region \u2014 left",region:"gluteal",view:"posterior",laterality:"left",asset:"pelvis/gluteal-left.svg",width:1e3,height:1200,provenance:Pr,description:"Posterior view of the patient's left buttock on the viewer's left, with iliac crest, PSIS, gluteal fold, greater trochanter, ischial tuberosity and injection-quadrant dividers."},{id:"hip-right",version:1,group:"pelvis",label:"Hip \u2014 right",region:"hip",view:"anterior",laterality:"right",asset:"pelvis/hip-right.svg",width:1e3,height:1200,provenance:Pr,description:"Anterior view of the patient's right hip and upper thigh on the viewer's left, with ASIS, inguinal ligament, pubic tubercle, femoral triangle and greater trochanter."},{id:"hip-left",version:1,group:"pelvis",label:"Hip \u2014 left",region:"hip",view:"anterior",laterality:"left",asset:"pelvis/hip-left.svg",width:1e3,height:1200,provenance:Pr,description:"Anterior view of the patient's left hip and upper thigh on the viewer's right, with ASIS, inguinal ligament, pubic tubercle, femoral triangle and greater trochanter."}];var Dr={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Tr={width:1200,height:1200},ws=[{id:"retina-posterior-pole-od",version:1,group:"retina",label:"Retina posterior pole \u2014 right eye (OD)",region:"right retina, posterior pole",view:"fundus",laterality:"right",asset:"retina/retina-posterior-pole-od.svg",...Tr,provenance:Dr,description:"Fundus outline of the right posterior pole: optic disc with cup, macula and fovea, and the superior and inferior vascular arcades; optic disc on the viewer's right (nasal), labelled OD, N, T, S and I."},{id:"retina-posterior-pole-os",version:1,group:"retina",label:"Retina posterior pole \u2014 left eye (OS)",region:"left retina, posterior pole",view:"fundus",laterality:"left",asset:"retina/retina-posterior-pole-os.svg",...Tr,provenance:Dr,description:"Fundus outline of the left posterior pole: optic disc with cup, macula and fovea, and the superior and inferior vascular arcades; optic disc on the viewer's left (nasal), labelled OS, N, T, S and I."},{id:"retina-peripheral-od",version:1,group:"retina",label:"Retina peripheral chart \u2014 right eye (OD)",region:"right retina, periphery",view:"peripheral chart",laterality:"right",asset:"retina/retina-peripheral-od.svg",...Tr,provenance:Dr,description:"Peripheral retinal chart of the right eye: concentric rings for the posterior pole, equator and ora serrata, twelve clock-hour radial lines, optic disc and macula, with 12, 3, 6 and 9 labelled; nasal side on the viewer's right, labelled OD, N and T."},{id:"retina-peripheral-os",version:1,group:"retina",label:"Retina peripheral chart \u2014 left eye (OS)",region:"left retina, periphery",view:"peripheral chart",laterality:"left",asset:"retina/retina-peripheral-os.svg",...Tr,provenance:Dr,description:"Peripheral retinal chart of the left eye: concentric rings for the posterior pole, equator and ora serrata, twelve clock-hour radial lines, optic disc and macula, with 12, 3, 6 and 9 labelled; nasal side on the viewer's left, labelled OS, N and T."}];var Fn={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Un={width:800,height:1600},Ss=[{id:"skeleton-anterior",version:1,group:"skeleton",label:"Skeleton \u2014 anterior",region:"whole skeleton",view:"anterior",laterality:"bilateral",asset:"skeleton/skeleton-anterior.svg",...Un,provenance:Fn,description:"Whole adult skeleton from the front in anatomical position: skull and mandible, sternum and ribs, lumbar spine, pelvis, long bones of both limbs, and simplified hands and feet. Patient's right is on the viewer's left (R and L marked)."},{id:"skeleton-posterior",version:1,group:"skeleton",label:"Skeleton \u2014 posterior",region:"whole skeleton",view:"posterior",laterality:"bilateral",asset:"skeleton/skeleton-posterior.svg",...Un,provenance:Fn,description:"Whole adult skeleton from behind in anatomical position: occiput, vertebral column, ribs, scapulae, sacrum and pelvis, long bones of both limbs, and simplified hands and heels. Patient's right is on the viewer's right (L and R marked)."}];var Ft={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Wi={width:1400,height:1e3},ks=[{id:"skull-lateral-right",version:1,group:"skull-brain",label:"Skull \u2014 right lateral",region:"skull",view:"right lateral",laterality:"right",asset:"skull-brain/skull-lateral-right.svg",...Wi,provenance:Ft,description:"Right lateral skull with the face to the right of the drawing: coronal, lambdoid and squamous sutures, orbit, zygomatic arch, mandible, external auditory meatus and mastoid, with pterion, asterion, nasion and inion marked."},{id:"skull-lateral-left",version:1,group:"skull-brain",label:"Skull \u2014 left lateral",region:"skull",view:"left lateral",laterality:"left",asset:"skull-brain/skull-lateral-left.svg",...Wi,provenance:Ft,description:"Left lateral skull with the face to the left of the drawing: coronal, lambdoid and squamous sutures, orbit, zygomatic arch, mandible, external auditory meatus and mastoid, with pterion, asterion, nasion and inion marked."},{id:"skull-superior",version:1,group:"skull-brain",label:"Skull \u2014 superior (vertex)",region:"skull",view:"superior",laterality:"midline",asset:"skull-brain/skull-superior.svg",width:1e3,height:1200,provenance:Ft,description:"Vertex view of the skull, anterior at the top, patient right on the right of the drawing, with the coronal, sagittal and lambdoid sutures, bregma, lambda and Kocher's point on each side."},{id:"brain-lateral-left",version:1,group:"skull-brain",label:"Brain \u2014 left lateral",region:"brain",view:"left lateral",laterality:"left",asset:"skull-brain/brain-lateral-left.svg",...Wi,provenance:Ft,description:"Left cerebral hemisphere seen from the left, frontal pole to the left of the drawing: frontal, parietal, temporal and occipital lobes, central sulcus, Sylvian fissure, cerebellum and brainstem."},{id:"brain-lateral-right",version:1,group:"skull-brain",label:"Brain \u2014 right lateral",region:"brain",view:"right lateral",laterality:"right",asset:"skull-brain/brain-lateral-right.svg",...Wi,provenance:Ft,description:"Right cerebral hemisphere seen from the right, frontal pole to the right of the drawing: frontal, parietal, temporal and occipital lobes, central sulcus, Sylvian fissure, cerebellum and brainstem."},{id:"brain-medial",version:1,group:"skull-brain",label:"Brain \u2014 midsagittal",region:"brain",view:"midsagittal",laterality:"midline",asset:"skull-brain/brain-medial.svg",...Wi,provenance:Ft,description:"Midsagittal brain with anterior to the left of the drawing: corpus callosum, thalamus, lateral and fourth ventricles, cerebellum, brainstem and pituitary gland."},{id:"brain-axial",version:1,group:"skull-brain",label:"Brain \u2014 axial (ventricles and basal ganglia)",region:"brain",view:"axial",laterality:"bilateral",asset:"skull-brain/brain-axial.svg",width:1200,height:1200,provenance:Ft,description:"Axial slice at the lateral ventricles and basal ganglia in radiological orientation: anterior at the top, patient right on the left of the drawing, with cortex, ventricles, caudate, lentiform nucleus, thalamus, internal capsule and falx."}];var ai={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Is=[{id:"chest-anterior",version:1,group:"thorax",label:"Chest \u2014 anterior",region:"chest",view:"anterior",laterality:"bilateral",asset:"thorax/chest-anterior.svg",width:1200,height:1100,provenance:ai,description:"Anterior chest outline from neck base to lower ribs with clavicles, sternal midline and angle, costal margins and nipples; patient's right on the viewer's left (marked R)."},{id:"chest-posterior",version:1,group:"thorax",label:"Chest \u2014 posterior",region:"chest",view:"posterior",laterality:"bilateral",asset:"thorax/chest-posterior.svg",width:1200,height:1100,provenance:ai,description:"Posterior chest outline from C7 to T12 with both scapulae and a dotted spinous-process midline; patient's right on the viewer's right (marked R)."},{id:"axilla-right",version:1,group:"thorax",label:"Axilla \u2014 right",region:"axilla",view:"anterior",laterality:"right",asset:"thorax/axilla-right.svg",width:1200,height:1100,provenance:ai,description:"Anterior upper torso with the patient's right arm abducted to expose the axilla, showing the anterior axillary fold; right is on the viewer's left (marked R)."},{id:"axilla-left",version:1,group:"thorax",label:"Axilla \u2014 left",region:"axilla",view:"anterior",laterality:"left",asset:"thorax/axilla-left.svg",width:1200,height:1100,provenance:ai,description:"Anterior upper torso with the patient's left arm abducted to expose the axilla, showing the anterior axillary fold; left is on the viewer's right (marked L)."},{id:"breast-right",version:1,group:"thorax",label:"Breast \u2014 right",region:"breast",view:"anterior",laterality:"right",asset:"thorax/breast-right.svg",width:1200,height:1200,provenance:ai,description:"Right breast as a clock-face circle with 12, 3, 6 and 9 o'clock marks, areola and nipple at the centre and an axillary tail toward the viewer's left; clock as the examiner faces the patient."},{id:"breast-left",version:1,group:"thorax",label:"Breast \u2014 left",region:"breast",view:"anterior",laterality:"left",asset:"thorax/breast-left.svg",width:1200,height:1200,provenance:ai,description:"Left breast as a clock-face circle with 12, 3, 6 and 9 o'clock marks, areola and nipple at the centre and an axillary tail toward the viewer's right; clock as the examiner faces the patient."}];var Xe={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Cs=[{id:"upper-limb-right-anterior",version:1,group:"upper-limbs",label:"Upper limb \u2014 right anterior",region:"right upper limb",view:"anterior",laterality:"right",asset:"upper-limbs/upper-limb-right-anterior.svg",width:800,height:1600,provenance:Xe,description:"Right arm, forearm and hand in anatomical position seen from the front. The thumb is on the viewer's left; palm creases and the cubital crease are marked."},{id:"upper-limb-right-posterior",version:1,group:"upper-limbs",label:"Upper limb \u2014 right posterior",region:"right upper limb",view:"posterior",laterality:"right",asset:"upper-limbs/upper-limb-right-posterior.svg",width:800,height:1600,provenance:Xe,description:"Right arm, forearm and hand in anatomical position seen from the back. The thumb is on the viewer's right; knuckles and nails and the olecranon are marked."},{id:"upper-limb-left-anterior",version:1,group:"upper-limbs",label:"Upper limb \u2014 left anterior",region:"left upper limb",view:"anterior",laterality:"left",asset:"upper-limbs/upper-limb-left-anterior.svg",width:800,height:1600,provenance:Xe,description:"Left arm, forearm and hand in anatomical position seen from the front. The thumb is on the viewer's right; palm creases and the cubital crease are marked."},{id:"upper-limb-left-posterior",version:1,group:"upper-limbs",label:"Upper limb \u2014 left posterior",region:"left upper limb",view:"posterior",laterality:"left",asset:"upper-limbs/upper-limb-left-posterior.svg",width:800,height:1600,provenance:Xe,description:"Left arm, forearm and hand in anatomical position seen from the back. The thumb is on the viewer's left; knuckles and nails and the olecranon are marked."},{id:"shoulder-right",version:1,group:"upper-limbs",label:"Shoulder \u2014 right",region:"right shoulder",view:"anterior",laterality:"right",asset:"upper-limbs/shoulder-right.svg",width:1200,height:1200,provenance:Xe,description:"Anterior view of the right shoulder from the side of the neck to the upper arm: deltoid cap, clavicle, acromion, anterior axillary fold and chest wall, with the midline marked."},{id:"elbow-right",version:1,group:"upper-limbs",label:"Elbow \u2014 right",region:"right elbow",view:"anterior",laterality:"right",asset:"upper-limbs/elbow-right.svg",width:1e3,height:1200,provenance:Xe,description:"Anterior view of the right elbow with distal upper arm and proximal forearm: both epicondyles, the cubital crease and the borders of the cubital fossa."},{id:"wrist-right",version:1,group:"upper-limbs",label:"Wrist \u2014 right",region:"right wrist",view:"palmar",laterality:"right",asset:"upper-limbs/wrist-right.svg",width:1e3,height:1200,provenance:Xe,description:"Palmar view of the right wrist from the distal forearm to the proximal palm, thumb on the viewer's right; wrist creases, pisiform and palmar creases are marked."},{id:"shoulder-left",version:1,group:"upper-limbs",label:"Shoulder \u2014 left",region:"left shoulder",view:"anterior",laterality:"left",asset:"upper-limbs/shoulder-left.svg",width:1200,height:1200,provenance:Xe,description:"Anterior view of the left shoulder from the side of the neck to the upper arm: deltoid cap, clavicle, acromion, anterior axillary fold and chest wall, with the midline marked."},{id:"elbow-left",version:1,group:"upper-limbs",label:"Elbow \u2014 left",region:"left elbow",view:"anterior",laterality:"left",asset:"upper-limbs/elbow-left.svg",width:1e3,height:1200,provenance:Xe,description:"Anterior view of the left elbow with distal upper arm and proximal forearm: both epicondyles, the cubital crease and the borders of the cubital fossa."},{id:"wrist-left",version:1,group:"upper-limbs",label:"Wrist \u2014 left",region:"left wrist",view:"palmar",laterality:"left",asset:"upper-limbs/wrist-left.svg",width:1e3,height:1200,provenance:Xe,description:"Palmar view of the left wrist from the distal forearm to the proximal palm, thumb on the viewer's left; wrist creases, pisiform and palmar creases are marked."}];var Gn={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Rs=[{id:"pulse-sites",version:1,group:"vascular",label:"Pulse sites \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"vascular/pulse-sites.svg",width:1200,height:1600,provenance:Gn,description:"Whole-body anterior outline with labelled circles at the carotid, brachial, radial, femoral, popliteal, posterior tibial and dorsalis pedis pulse sites on both sides; posterior sites are dashed."},{id:"superficial-veins-lower-limbs",version:1,group:"vascular",label:"Superficial veins \u2014 lower limbs",region:"lower limbs",view:"anterior",laterality:"bilateral",asset:"vascular/superficial-veins-lower-limbs.svg",width:1200,height:1400,provenance:Gn,description:"Both legs from waist to toes, anterior view, with the great saphenous vein, the posterior course of the small saphenous vein, the dorsal venous arch and the saphenofemoral and saphenopopliteal junctions."}];var Mr={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Os=[{id:"whole-body-anterior",version:1,group:"whole-body",label:"Whole body \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"whole-body/whole-body-anterior.svg",width:800,height:1600,provenance:Mr,description:"Standing figure seen from the front in anatomical position, arms slightly away from the trunk with palms forward. The patient's right is on the viewer's left, marked R."},{id:"whole-body-posterior",version:1,group:"whole-body",label:"Whole body \u2014 posterior",region:"whole body",view:"posterior",laterality:"bilateral",asset:"whole-body/whole-body-posterior.svg",width:800,height:1600,provenance:Mr,description:"Standing figure seen from behind in anatomical position, arms slightly away from the trunk, with the spine and scapulae marked. The patient's right is on the viewer's right, marked R."},{id:"whole-body-right-lateral",version:1,group:"whole-body",label:"Whole body \u2014 right lateral",region:"whole body",view:"right lateral",laterality:"right",asset:"whole-body/whole-body-right-lateral.svg",width:800,height:1600,provenance:Mr,description:"Standing figure seen from the patient's right side, facing the viewer's right, arm hanging by the side. Anterior (A) is on the right of the image and posterior (P) on the left."},{id:"whole-body-left-lateral",version:1,group:"whole-body",label:"Whole body \u2014 left lateral",region:"whole body",view:"left lateral",laterality:"left",asset:"whole-body/whole-body-left-lateral.svg",width:800,height:1600,provenance:Mr,description:"Standing figure seen from the patient's left side, facing the viewer's left, arm hanging by the side. Anterior (A) is on the left of the image and posterior (P) on the right."}];var Nr={author:"EMR component library (original schematic)",licence:"Project-internal",reviewStatus:"unreviewed"},Yn={width:1200,height:1200},As=[{id:"wound-surface-depth",version:1,group:"wound-procedure",label:"Wound \u2014 surface and depth",region:"skin",view:"schematic",laterality:"not-applicable",asset:"wound-procedure/wound-surface-depth.svg",width:1400,height:1e3,provenance:Nr,description:"Skin cross-section with epidermis, dermis, subcutaneous tissue, fascia and muscle for depth staging, beside a wound-surface outline on a clock face where 12 o'clock is head-ward."},{id:"incision-sites-abdomen",version:1,group:"wound-procedure",label:"Abdomen \u2014 incision sites",region:"abdomen",view:"anterior",laterality:"bilateral",asset:"wound-procedure/incision-sites-abdomen.svg",...Yn,provenance:Nr,description:"Anterior abdomen with dashed common incision lines: midline, Pfannenstiel, right subcostal Kocher and McBurney, plus laparoscopic port sites. Patient right is on the viewer left."},{id:"drain-stoma-sites",version:1,group:"wound-procedure",label:"Abdomen \u2014 drain and stoma sites",region:"abdomen",view:"anterior",laterality:"bilateral",asset:"wound-procedure/drain-stoma-sites.svg",...Yn,provenance:Nr,description:"Anterior abdomen with small circles at typical stoma sites (ileostomy, colostomy, gastrostomy, jejunostomy) and drain or catheter sites. Patient right is on the viewer left."},{id:"injection-catheter-sites",version:1,group:"wound-procedure",label:"Injection and line sites \u2014 anterior",region:"whole body",view:"anterior",laterality:"bilateral",asset:"wound-procedure/injection-catheter-sites.svg",width:1200,height:1600,provenance:Nr,description:"Whole-body anterior outline with circles at common injection and line sites: deltoid, ventrogluteal, vastus lateralis, abdominal subcutaneous, internal jugular, subclavian, antecubital and femoral."}];var Lu=[...Ba,..._a,...Ha,...Va,...ja,...za,...Fa,...Ua,...Ga,...Wa,...Ka,...Xa,...Qa,...Ja,...es,...ts,...is,...rs,...as,...ss,...os,...ns,...ls,...ds,...cs,...hs,...us,...ms,...gs,...bs,...fs,...ys,...vs,...$s,...xs,...ws,...Ss,...ks,...Is,...Cs,...Rs,...Os,...As];var Ki=n=>String(n).padStart(2,"0"),pd=n=>String(n).padStart(4,"0");function Br(n,e="minute"){if(!n)return"";let t=n.trim();if(!t)return"";if(!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(t)){let c=/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(t);return c?e==="second"?`${c[1]}T${c[2]}:${c[3]}:${c[4]??"00"}`:`${c[1]}T${c[2]}:${c[3]}`:""}let r=new Date(t);if(Number.isNaN(r.getTime()))return"";let a=`${pd(r.getFullYear())}-${Ki(r.getMonth()+1)}-${Ki(r.getDate())}`,l=`${Ki(r.getHours())}:${Ki(r.getMinutes())}`;return e==="second"?`${a}T${l}:${Ki(r.getSeconds())}`:`${a}T${l}`}function Wn(n){if(!n)return null;let e=n.trim();if(!e)return null;if(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(e)){let f=new Date(e);return Number.isNaN(f.getTime())?null:f.toISOString().replace(/\.\d{3}Z$/,"Z")}let t=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(e);if(!t)return null;let i=Number(t[1]),r=Number(t[2]),a=Number(t[3]),l=Number(t[4]),c=Number(t[5]),p=Number(t[6]??"0"),h=new Date(i,r-1,a,l,c,p);return Number.isNaN(h.getTime())?null:h.toISOString().replace(/\.\d{3}Z$/,"Z")}function Xi(n){let e=[],t=new Map;for(let r of n){let a=r.group?.trim();if(!a)e.push(r);else{let l=t.get(a);l?l.push(r):t.set(a,[r])}}let i=[];e.length>0&&i.push({label:null,options:e});for(let[r,a]of t.entries())i.push({label:r,options:a});return i}function Hr(n,e){let t=(e??"").trim().toLowerCase();return t?n.filter(i=>i.label.toLowerCase().includes(t)||i.value.toLowerCase().includes(t)||(i.description?.toLowerCase().includes(t)??!1)||(i.group?.toLowerCase().includes(t)??!1)):n}function Qi(n,e,t=[]){let i=new Set(t),r=e.filter(c=>!c.disabled&&!i.has(c.value)).map(c=>c.value);if(r.length===0)return"none";let a=new Set(n),l=0;for(let c of r)a.has(c)&&(l+=1);return l===0?"none":l===r.length?"all":"mixed"}function Vr(n,e,t=[]){let i=Qi(n,e,t),r=new Set(t);if(i==="all")return e.filter(c=>c.disabled&&n.includes(c.value)).map(c=>c.value);let a=[];for(let l of e)r.has(l.value)||(!l.disabled||n.includes(l.value))&&a.push(l.value);return a}function jr(n,e,t,i=[]){let r=new Set(i),a=new Set(n);if(a.has(e))a.delete(e);else if(r.has(e))a.clear(),a.add(e);else{for(let h of r)a.delete(h);a.add(e)}let c=t.map(h=>h.value).filter(h=>a.has(h)),p=[...a].filter(h=>!c.includes(h));return[...c,...p]}function _r(n,e,t=[]){let i=!!(n.children&&n.children.length>0),r=n.selectable!==void 0?n.selectable:e==="leaf"?!i:!0;if(!n.disabled&&r&&t.push(n.id),n.children)for(let a of n.children)n.disabled||_r(a,e,t);return t}function Kn(n,e,t="cascade"){let i=!!(n.children&&n.children.length>0);if(t!=="cascade"||!i)return e.has(n.id)?"checked":"unchecked";let r=_r(n,"cascade");if(r.length===0)return e.has(n.id)?"checked":"unchecked";let a=0;for(let l of r)e.has(l)&&(a+=1);return a===0?"unchecked":a===r.length?"checked":"mixed"}function Xn(n,e,t={}){let i=(t.searchQuery??"").trim().toLowerCase(),r=new Set(e),a=new Set(t.selectedIds??[]),l=t.checkStrategy??"cascade",c=new Set,p=new Set;if(i){let g=v=>{let b=v.label.toLowerCase().includes(i)||(v.code?.toLowerCase().includes(i)??!1)||(v.description?.toLowerCase().includes(i)??!1),x=!1;for(let C of v.children??[])g(C)&&(x=!0);return x&&p.add(v.id),b||x?(c.add(v.id),!0):!1};for(let v of n)g(v)}let h=[],f=(g,v,b,x,C,A)=>{for(let q of g){if(i&&!A&&!c.has(q.id))continue;let E=i.length>0&&(q.label.toLowerCase().includes(i)||(q.code?.toLowerCase().includes(i)??!1)||(q.description?.toLowerCase().includes(i)??!1)),L=!!(q.children&&q.children.length>0),N=L&&(i&&p.has(q.id)||r.has(q.id)),F=q.selectable!==void 0?q.selectable:l==="leaf"?!L:!0,pe=[...x,q.id],V=[...C,q.label];h.push({node:q,depth:v,parentId:b,hasChildren:L,expanded:N,selectable:F,pathIds:pe,pathLabels:V,checkState:Kn(q,a,l)}),L&&N&&q.children&&f(q.children,v+1,q.id,pe,V,A||E)}};return f(n,0,null,[],[],!1),h}function Qn(n,e,t,i="cascade"){let r=new Set(e),a=b=>{for(let x of b){if(x.id===t)return x;if(x.children){let C=a(x.children);if(C)return C}}return null},l=a(n);if(!l||l.disabled)return e;if(i==="all"||i==="leaf"){let b=!!(l.children&&l.children.length>0);return i==="leaf"&&b&&l.selectable!==!0?e:(r.has(t)?r.delete(t):r.add(t),[...r])}let p=Kn(l,r,"cascade")!=="checked",h=_r(l,"cascade");for(let b of h)p?r.add(b):r.delete(b);let f=b=>{for(let x of b)if(x.children&&x.children.length>0){f(x.children);let C=x.children.flatMap(A=>_r(A,"cascade"));C.length>0&&x.selectable!==!1&&!x.disabled&&(C.every(q=>r.has(q))?r.add(x.id):r.delete(x.id))}};f(n);let g=[],v=b=>{for(let x of b)r.has(x.id)&&g.push(x.id),x.children&&v(x.children)};return v(n),g}function Ls(n){let e=[],t=i=>{for(let r of i)r.children&&r.children.length>0&&(e.push(r.id),t(r.children))};return t(n),e}function hd(n,e){if(!e)return[];let t=(i,r)=>{for(let a of i){let l=[...r,a];if(a.id===e)return l;if(a.children){let c=t(a.children,l);if(c)return c}}return null};return t(n,[])??[]}function Zn(n,e,t="path",i=" / "){let r=hd(n,e);return r.length===0?"":t==="leaf"?r[r.length-1].label:r.map(a=>a.label).join(i)}var Es={zoom:1,panX:0,panY:0,rotationDeg:0,flipH:!1,flipV:!1};function Ps(n,e,t=.25,i=5){let r=Math.round((n+e)*100)/100;return Math.max(t,Math.min(i,r))}function Zi(n,e){let i=((n+(e?90:-90))%360+360)%360;return i>180?i-360:i}function Ds(n){return Number.isFinite(n)?Math.max(-180,Math.min(180,Math.round(n*10)/10)):0}function Ts(n){let e=(n.flipH?-1:1)*n.zoom,t=(n.flipV?-1:1)*n.zoom;return`translate(${n.panX}px, ${n.panY}px) rotate(${n.rotationDeg}deg) scale(${e}, ${t})`}var Ms=[{id:"free",label:"Free",ratio:null},{id:"1:1",label:"1:1 Square",ratio:1},{id:"4:3",label:"4:3 Clinical",ratio:4/3},{id:"16:9",label:"16:9 Wide",ratio:16/9},{id:"3:4",label:"3:4 Portrait",ratio:3/4}],zr={rect:{x:.1,y:.1,width:.8,height:.8},rotationDeg:0,zoom:1,panX:0,panY:0,flipH:!1,flipV:!1,aspectRatio:null};function Ns(n,e=null,t=.1){let i=Math.max(t,Math.min(1,Number.isFinite(n.width)?n.width:.8)),r=Math.max(t,Math.min(1,Number.isFinite(n.height)?n.height:.8));e!==null&&e>0&&(r=i/e,r>1&&(r=1,i=Math.max(t,Math.min(1,r*e))),r<t&&(r=t,i=Math.max(t,Math.min(1,r*e))));let a=Math.max(0,Math.min(1-i,Number.isFinite(n.x)?n.x:0)),l=Math.max(0,Math.min(1-r,Number.isFinite(n.y)?n.y:0));return{x:Math.round(a*1e3)/1e3,y:Math.round(l*1e3)/1e3,width:Math.round(i*1e3)/1e3,height:Math.round(r*1e3)/1e3}}function Jn(n,e){let t=n?.start??null,i=n?.end??null;return!t||t&&i?{start:e,end:null}:e<t?{start:e,end:t}:{start:t,end:e}}function el(n,e){return!e?.start||!e?.end?!1:n>=e.start&&n<=e.end}function tl(n,e){if(!e)return null;let t=e.start===n,i=e.end===n;return t&&i?"both":t?"start":i?"end":null}function il(n,e=[",",";"]){if(!n)return[];let t=e.map(a=>a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),i=t.length>0?new RegExp(`[${t.join("")}]`,"g"):null;return(i?n.split(i):[n]).map(a=>a.trim()).filter(a=>a.length>0)}function rl(n,e,t={}){let i=[...n],r=new Set(n.map(a=>a.toLowerCase()));for(let a of e){let l=a.trim();if(l){if(t.maxTags!==void 0&&i.length>=t.maxTags)break;!t.allowDuplicates&&r.has(l.toLowerCase())||(i.push(l),r.add(l.toLowerCase()))}}return i}function Ut(n,e=0,t=100,i=1){let r=i>0?i:1,a=Math.max(e,Math.min(t,n)),l=e+Math.round((a-e)/r)*r,c=(String(r).split(".")[1]??"").length;return Number(Math.max(e,Math.min(t,l)).toFixed(c))}function Bs(n,e,t=0,i=100,r=1,a=0,l="low"){let c=Math.max(0,a),p=Ut(n,t,i,r),h=Ut(e,t,i,r);if(l==="low"?p=Math.min(p,Ut(h-c,t,i,r)):h=Math.max(h,Ut(p+c,t,i,r)),p>h){let f=Ut((p+h)/2,t,i,r);return[f,f]}return[p,h]}var qs=n=>n==="9"||n==="A"||n==="*",ud=(n,e)=>n==="9"?/^[0-9]$/.test(e):n==="A"?/^[A-Za-z]$/.test(e):n==="*"?/^[A-Za-z0-9]$/.test(e):!1;function Fr(n,e){let t=n??"";if(!e)return{masked:t,unmasked:t,complete:t.length>0};let i=[...e].filter(qs).length;if(!t)return{masked:"",unmasked:"",complete:i===0};let r=0,a="",l="",c=0;for(let p=0;p<e.length;p+=1){let h=e[p];if(qs(h)){let f=null;for(;r<t.length;){let g=t[r];if(r+=1,ud(h,g)){f=g;break}}if(f===null)break;a+=f,l+=f,c+=1}else r<t.length&&(t[r]===h&&(r+=1),a+=h)}for(;a.length>0&&!qs(e[a.length-1]??"9")&&l.length===0;)a=a.slice(0,-1);return{masked:a,unmasked:l,complete:c===i}}function _s(n,e=6){let t=Math.max(1,Math.floor(e)),i=[...n??""];return Array.from({length:t},(r,a)=>i[a]??"")}function al(n,e,t,i=6,r=!0){let a=Math.max(1,Math.floor(i)),l=[..._s(n,a)],c=[...t].filter(f=>r?/^[0-9]$/.test(f):/^[A-Za-z0-9]$/.test(f));if(c.length===0)return e>=0&&e<a&&(l[e]=""),{value:l.join(""),slots:l,nextFocusIndex:Math.max(0,e),completed:l.every(g=>g.length===1)};let p=Math.max(0,Math.min(a-1,e));for(let f of c){if(p>=a)break;l[p]=f,p+=1}return{value:l.join(""),slots:l,nextFocusIndex:Math.min(a-1,p),completed:l.every(f=>f.length===1)}}function sl(n,e,t=!1){let i=n.includes(e);return t?i?n.filter(r=>r!==e):[...n,e]:i?[]:[e]}function ol(n,e){if(!e||e<2||n.length<=e)return{leading:n,hidden:[],trailing:[]};let t=Math.max(1,e-1);return{leading:n.slice(0,1),hidden:n.slice(1,n.length-t),trailing:n.slice(n.length-t)}}var nl=[{value:"#dc2626",label:"Arterial Red"},{value:"#2563eb",label:"Venous Blue"},{value:"#16a34a",label:"Fluorescein Green"},{value:"#d97706",label:"Amber Highlight"},{value:"#7c3aed",label:"Violet Marker"},{value:"#0d9488",label:"Teal Accent"},{value:"#db2777",label:"Magenta"},{value:"#334155",label:"Slate Ink"}];var si=["January","February","March","April","May","June","July","August","September","October","November","December"],ll=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Ur=["Mo","Tu","We","Th","Fr","Sa","Su"],ue=(n,e=2)=>String(n).padStart(e,"0");function Ji(n,e){return e===2?n%4===0&&n%100!==0||n%400===0?29:28:[4,6,9,11].includes(e)?30:31}function Gr(n="yyyy-mm-dd",e="day"){return n==="yyyy"||e==="year"?"yyyy":n==="yyyy-mm"||n==="mm-yyyy"?n:e==="month"?n==="yyyy-mm-dd"?"yyyy-mm":"mm-yyyy":n}function dl(n,e="yyyy-mm-dd"){let t=e==="yyyy"?4:e==="yyyy-mm"||e==="mm-yyyy"?7:10;return n.replace(/[^\d\-/. ]/g,"").slice(0,t)}function cl(n,e="yyyy-mm-dd",t="day"){let i=Gr(e,t),r=n.trim();if(r==="")return{status:"empty"};if(i==="yyyy"){if(!/^\d{4}$/.test(r))return{status:"draft"};let q=Number(r);return q<1?{status:"draft"}:{status:"valid",value:ue(q,4)}}if(i==="yyyy-mm"||i==="mm-yyyy"){let q=/^(\d{4})-(\d{2})$/.exec(r);if(q){let oe=Number(q[1]),Pi=Number(q[2]);return oe>=1&&Pi>=1&&Pi<=12?{status:"valid",value:`${ue(oe,4)}-${ue(Pi)}`}:{status:"draft"}}let L=(/^\d{6}$/.test(r)?i==="yyyy-mm"?[r.slice(0,4),r.slice(4,6)]:[r.slice(0,2),r.slice(2,6)]:null)??r.split(/[-/. ]+/);if(L.length!==2||L.some(oe=>!/^\d+$/.test(oe)))return{status:"draft"};let[N,F]=L,[pe,V]=i==="mm-yyyy"?[N,F]:[F,N];if(V.length!==4||pe.length>2)return{status:"draft"};let Pe=Number(V),De=Number(pe);return Pe<1||De<1||De>12?{status:"draft"}:{status:"valid",value:`${ue(Pe,4)}-${ue(De)}`}}let a=/^(\d{4})-(\d{2})-(\d{2})$/.exec(r);if(a){let q=Number(a[1]),E=Number(a[2]),L=Number(a[3]);return q>=1&&E>=1&&E<=12&&L>=1&&L<=Ji(q,E)?{status:"valid",value:`${ue(q,4)}-${ue(E)}-${ue(L)}`}:{status:"draft"}}let c=(/^\d{8}$/.test(r)?i==="yyyy-mm-dd"?[r.slice(0,4),r.slice(4,6),r.slice(6)]:[r.slice(0,2),r.slice(2,4),r.slice(4)]:null)??r.split(/[-/. ]+/);if(c.length!==3||c.some(q=>!/^\d+$/.test(q)))return{status:"draft"};let[p,h,f]=c,[g,v,b]=i==="dd-mm-yyyy"?[p,h,f]:i==="mm-dd-yyyy"?[h,p,f]:[f,h,p];if(b.length!==4||g.length>2||v.length>2)return{status:"draft"};let x=Number(b),C=Number(v),A=Number(g);return x<1||C<1||C>12||A<1||A>Ji(x,C)?{status:"draft"}:{status:"valid",value:`${ue(x,4)}-${ue(C)}-${ue(A)}`}}function Hs(n,e="yyyy-mm-dd",t="day"){let i=Gr(e,t);if(!n)return"";if(i==="yyyy"){let p=/^(\d{4})/.exec(n);return p?p[1]:""}if(i==="yyyy-mm"||i==="mm-yyyy"){let p=/^(\d{4})-(\d{2})/.exec(n);if(!p)return"";let[,h,f]=p;return i==="mm-yyyy"?`${f}-${h}`:`${h}-${f}`}let r=/^(\d{4})-(\d{2})-(\d{2})/.exec(n);if(!r)return"";let[,a,l,c]=r;return i==="dd-mm-yyyy"?`${c}-${l}-${a}`:i==="mm-dd-yyyy"?`${l}-${c}-${a}`:`${a}-${l}-${c}`}function Vs(n){if(!n)return null;let e=/^(\d{4})-(\d{2})-(\d{2})/.exec(n);if(e){let r=Number(e[1]),a=Number(e[2]),l=Number(e[3]);return r>=1&&a>=1&&a<=12&&l>=1&&l<=Ji(r,a)?{year:r,month:a,day:l}:null}let t=/^(\d{4})-(\d{2})$/.exec(n);if(t){let r=Number(t[1]),a=Number(t[2]);return r>=1&&a>=1&&a<=12?{year:r,month:a,day:1}:null}let i=/^(\d{4})$/.exec(n);if(i){let r=Number(i[1]);if(r>=1)return{year:r,month:1,day:1}}return null}function er(n=new Date){let e=n.getFullYear(),t=n.getMonth()+1,i=n.getDate(),r=ue(e,4),a=`${r}-${ue(t)}`,l=`${a}-${ue(i)}`;return{year:e,month:t,day:i,isoDay:l,isoMonth:a,isoYear:r}}function Gt(n,e,t){let i=n*12+(e-1)+t,r=Math.max(1,Math.floor(i/12)),a=(i%12+12)%12+1;return{year:r,month:a}}function Yr(n,e,t,i){let a=(new Date(n,e-1,1).getDay()+6)%7,l=Gt(n,e,-1),c=Gt(n,e,1),p=Ji(l.year,l.month),h=Ji(n,e),f=[];for(let g=0;g<42;g++){let v=n,b=e,x,C=!0;g<a?(v=l.year,b=l.month,x=p-a+1+g,C=!1):g<a+h?x=g-a+1:(v=c.year,b=c.month,x=g-(a+h)+1,C=!1);let A=`${ue(v,4)}-${ue(b)}-${ue(x)}`,q=si[b-1]??"";f.push({iso:A,year:v,month:b,day:x,inMonth:C,isSelected:!!(t&&t===A),isToday:A===i,ariaLabel:`${x} ${q} ${v}`})}return f}function pl(n){let e=((n-2020)%12+12)%12,t=Math.max(1,n-e),i=[];for(let r=0;r<12;r++)i.push(t+r);return{startYear:t,endYear:t+11,years:i}}function js(n,e,t,i=!1){if(!n||typeof n.getBoundingClientRect!="function")return`position: absolute; top: calc(100% + 4px); left: 0; width: ${e}px;`;let r=n.getBoundingClientRect();if(r.width===0&&r.height===0)return`position: absolute; top: calc(100% + 4px); left: 0; width: ${e}px;`;let a=typeof window<"u"&&window.innerWidth||1280,l=typeof window<"u"&&window.innerHeight||800,c=Math.min(i?Math.max(r.width,e):e,Math.max(200,a-24)),p=Math.max(12,Math.min(r.left,a-c-12)),f=r.bottom+t+12>l&&r.top>t?Math.max(12,r.top-t-6):r.bottom+6;return`position: fixed; top: ${Math.round(f)}px; left: ${Math.round(p)}px; width: ${Math.round(c)}px;`}var $=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},md=0,Ze=n=>`${n}-${++md}`,ve=M`
  .icon-btn {
    width: var(--emr-control-height);
    min-width: 44px;
    min-height: 44px;
    padding: 0;
  }
  .icon-btn.emr-btn--sm {
    width: 44px;
    height: 44px;
  }
  .icon-btn.emr-btn--lg {
    width: 48px;
    height: 48px;
  }

  .segmented-track {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    max-width: 100%;
  }
  .segmented-item {
    min-height: 44px;
    min-width: 44px;
    padding: 0 14px;
    border: 1px solid transparent;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }
  .segmented-item:hover:not(:disabled) {
    background: var(--emr-surface);
  }
  .segmented-item[aria-checked="true"] {
    background: var(--emr-surface);
    border-color: var(--emr-primary-border);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .segmented-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .segmented-item:focus-visible,
  .input-affix-btn:focus-visible,
  .stepper-action-btn:focus-visible,
  .checkbox-row-btn:focus-visible,
  .page-btn:focus-visible,
  .drop-zone:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }

  .input-shell {
    display: flex;
    align-items: stretch;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .input-shell--invalid {
    border-color: var(--emr-danger);
  }
  .input-shell--readonly {
    background: var(--emr-surface-soft);
  }
  .input-shell:focus-within {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .input-leading {
    width: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-text-muted);
    flex-shrink: 0;
  }
  .input-bare {
    flex: 1;
    min-width: 0;
    min-height: 42px;
    padding: 0 10px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    outline: none;
  }
  .input-affix-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .input-affix-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .input-affix-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .stepper-box {
    display: inline-flex;
    align-items: stretch;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
    max-width: 100%;
  }
  .stepper-box--invalid {
    border-color: var(--emr-danger);
  }
  .stepper-action-btn {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .stepper-action-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .stepper-action-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .stepper-field {
    width: 96px;
    min-width: 64px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    text-align: center;
    font: inherit;
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  .stepper-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .checkbox-group-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .checkbox-group-list--horizontal {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .checkbox-group-list--grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), minmax(140px, 1fr));
    gap: 8px;
  }
  .checkbox-row-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .checkbox-row-btn--card {
    padding: 10px 14px;
    align-items: flex-start;
  }
  .checkbox-row-btn--chip {
    border-radius: 999px;
  }
  .checkbox-row-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .checkbox-row-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }
  .checkbox-row-btn[aria-checked="true"],
  .checkbox-row-btn[aria-checked="mixed"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .checkbox-row-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .checkbox-row-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .checkbox-box {
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--emr-border);
    border-radius: 4px;
    background: var(--emr-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .checkbox-row-btn[aria-checked="true"] .checkbox-box,
  .checkbox-row-btn[aria-checked="mixed"] .checkbox-box {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
  }
  .clear-inline-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .clear-inline-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }

  .pagination-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .pagination-controls {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .page-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .page-btn[aria-current="page"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
  }
  .page-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .page-size-select {
    width: auto;
    min-width: 96px;
  }

  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: var(--emr-backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .dialog-surface {
    width: 100%;
    max-height: calc(100vh - 32px);
    overflow: auto;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg);
    background: var(--emr-surface);
    color: var(--emr-text);
    box-shadow: var(--emr-shadow);
    padding: 20px;
    display: grid;
    gap: 14px;
  }
  .dialog-surface--sm { max-width: 400px; }
  .dialog-surface--md { max-width: 560px; }
  .dialog-surface--lg { max-width: 780px; }
  .dialog-surface--fullscreen {
    max-width: 100%;
    height: calc(100vh - 32px);
  }
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .popover-root {
    position: relative;
    display: inline-block;
  }
  .popover-trigger {
    display: inline-flex;
  }
  .popover-panel {
    position: absolute;
    top: calc(100% + 6px);
    z-index: 9999;
    min-width: 200px;
    padding: 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    box-shadow: var(--emr-shadow);
  }
  .popover-panel--start { left: 0; }
  .popover-panel--end { right: 0; }

  .tooltip-root {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .tooltip-bubble {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    padding: 6px 10px;
    border-radius: var(--emr-radius-sm);
    border: 1px solid var(--emr-border);
    background: var(--emr-text);
    color: var(--emr-surface);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    white-space: nowrap;
    pointer-events: none;
    box-shadow: var(--emr-shadow);
  }

  .progress-track {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--emr-primary);
    transition: width 160ms ease;
  }
  .progress-fill--neutral { background: var(--emr-primary); }
  .progress-fill--info { background: var(--emr-info); }
  .progress-fill--success { background: var(--emr-success); }
  .progress-fill--warning { background: var(--emr-warning); }
  .progress-fill--danger { background: var(--emr-danger); }
  .progress-fill--indeterminate {
    width: 40% !important;
    animation: emr-progress-slide 1.2s ease-in-out infinite;
  }
  @keyframes emr-progress-slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(260%); }
  }

  .spinner-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .spinner-ring {
    display: inline-block;
    border-radius: 999px;
    border: 2.5px solid var(--emr-border);
    border-top-color: var(--emr-primary);
    animation: emr-spin 0.8s linear infinite;
  }
  .spinner-ring--sm { width: 16px; height: 16px; border-width: 2px; }
  .spinner-ring--md { width: 24px; height: 24px; }
  .spinner-ring--lg { width: 36px; height: 36px; border-width: 3px; }
  .spinner-ring--neutral { border-top-color: var(--emr-primary); }
  .spinner-ring--info { border-top-color: var(--emr-info); }
  .spinner-ring--success { border-top-color: var(--emr-success); }
  .spinner-ring--warning { border-top-color: var(--emr-warning); }
  .spinner-ring--danger { border-top-color: var(--emr-danger); }
  @keyframes emr-spin {
    to { transform: rotate(360deg); }
  }

  .skeleton-stack {
    display: grid;
    gap: 8px;
  }
  .skeleton-block {
    display: block;
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-sm);
    animation: emr-pulse 1.4s ease-in-out infinite;
  }
  .skeleton-block--line {
    width: 100%;
    height: 14px;
  }
  .skeleton-block--rect {
    width: 100%;
    height: 64px;
    border-radius: var(--emr-radius);
  }
  .skeleton-block--circle {
    width: 40px;
    height: 40px;
    border-radius: 999px;
  }
  @keyframes emr-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    overflow: hidden;
    font-weight: var(--emr-weight-bold);
    flex-shrink: 0;
    padding: 0;
  }
  .avatar--sm { width: 32px; height: 32px; font-size: var(--emr-text-xs); }
  .avatar--md { width: 40px; height: 40px; font-size: var(--emr-text-sm); }
  .avatar--lg { width: 52px; height: 52px; font-size: var(--emr-text-md); }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .drop-zone {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 12px;
    border: 1.5px dashed var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
  }
  .drop-zone--over {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
  }
  .drop-zone--disabled {
    opacity: 0.55;
  }
`,fe=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-textarea"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.rows=4,this.autoResize=!1,this.placeholder="",this.hint="",this.error="",this.required=!1,this.readOnly=!1,this.disabled=!1}static{this.styles=[w,ve]}get locked(){return this.readOnly||this.disabled}updated(e){this.autoResize&&(e.has("value")||e.has("autoResize"))&&this.syncAutoHeight()}syncAutoHeight(){let e=this.shadowRoot?.querySelector("textarea");!e||!this.autoResize||(e.style.height="auto",e.scrollHeight>0&&(e.style.height=`${e.scrollHeight}px`))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.value??"",r=s`<textarea
      id=${e}
      part="control"
      class="emr-control"
      rows=${this.rows}
      maxlength=${this.maxLength??o}
      placeholder=${this.placeholder}
      .value=${this.locked?I(i):i}
      ?readonly=${this.readOnly}
      ?disabled=${this.disabled}
      ?required=${this.required}
      aria-label=${this.labelHidden&&this.label?this.label:o}
      aria-invalid=${this.error?"true":o}
      aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
      @blur=${a=>{a.target.value=this.value??"",this.dispatchEvent(new CustomEvent("blurred",{bubbles:!0,composed:!0}))}}
      @input=${a=>{if(this.locked){a.target.value=this.value??"";return}this.autoResize&&this.syncAutoHeight();let l=a.target.value;this.emitValueChange(l===""?null:l)}}
    ></textarea>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};$([d({type:String})],fe.prototype,"controlId",void 0);$([d({type:String})],fe.prototype,"label",void 0);$([d({type:Boolean})],fe.prototype,"labelHidden",void 0);$([d({type:String})],fe.prototype,"value",void 0);$([d({type:Number})],fe.prototype,"rows",void 0);$([d({type:Number})],fe.prototype,"maxLength",void 0);$([d({type:Boolean})],fe.prototype,"autoResize",void 0);$([d({type:String})],fe.prototype,"placeholder",void 0);$([d({type:String})],fe.prototype,"hint",void 0);$([d({type:String})],fe.prototype,"error",void 0);$([d({type:Boolean})],fe.prototype,"required",void 0);$([d({type:Boolean})],fe.prototype,"readOnly",void 0);$([d({type:Boolean})],fe.prototype,"disabled",void 0);var Ve=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-icon-button"),this.controlId="",this.ariaLabel="",this.icon="",this.variant="ghost",this.size="md",this.loading=!1,this.disabled=!1,this.type="button"}static{this.styles=[w,ve]}render(){let e=this.controlId||this.fallbackId,t=["emr-btn","icon-btn",this.variant!=="primary"?`emr-btn--${this.variant}`:"",this.size!=="md"?`emr-btn--${this.size}`:""].filter(Boolean).join(" "),i=this.size==="lg"?20:18;return s`<button
      id=${e}
      part="button"
      type=${this.type}
      class=${t}
      aria-label=${this.ariaLabel||o}
      aria-pressed=${this.pressed===void 0?o:String(this.pressed)}
      aria-busy=${this.loading?"true":o}
      ?disabled=${this.disabled||this.loading}
      @click=${()=>{!this.disabled&&!this.loading&&this.dispatchEvent(new CustomEvent("clicked",{bubbles:!0,composed:!0}))}}
    >
      ${this.icon?R(this.icon,i):o}
      <slot></slot>
    </button>`}};$([d({type:String})],Ve.prototype,"controlId",void 0);$([d({type:String})],Ve.prototype,"ariaLabel",void 0);$([d({type:String})],Ve.prototype,"icon",void 0);$([d({type:String})],Ve.prototype,"variant",void 0);$([d({type:String})],Ve.prototype,"size",void 0);$([d({type:Boolean})],Ve.prototype,"pressed",void 0);$([d({type:Boolean})],Ve.prototype,"loading",void 0);$([d({type:Boolean})],Ve.prototype,"disabled",void 0);$([d({type:String})],Ve.prototype,"type",void 0);var ye=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-segmented"),this.controlId="",this.label="",this.labelHidden=!1,this.ariaLabel="",this.options=[],this.value=null,this.clearable=!1,this.clearLabel="Clear",this.allowDeselect=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.onKeyDown=e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))return;let t=e.currentTarget,r=Array.from(t.querySelectorAll('button[role="radio"]')).map((p,h)=>({btn:p,idx:h})).filter(({btn:p})=>!p.disabled);if(!r.length)return;let a=r.findIndex(({btn:p})=>p===e.target);if(a<0)return;e.preventDefault();let l=e.key==="Home"?0:e.key==="End"?r.length-1:(a+(e.key==="ArrowRight"||e.key==="ArrowDown"?1:-1)+r.length)%r.length,c=r[l];if(c.btn.focus(),!this.readOnly&&!this.disabled){let p=this.options[c.idx];p&&!p.disabled&&this.emitValueChange(p.value)}}}static{this.styles=[w,ve]}clearSelection(){this.readOnly||this.disabled||(this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.ariaLabel||this.label||"Options",r=this.clearable&&this.value!==null&&this.value!==""&&!this.readOnly&&!this.disabled,a=r?s`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${i}`}
          @click=${()=>this.clearSelection()}
        >${this.clearLabel}</button>`:o,l=s`<div
      id=${e}
      role="radiogroup"
      part="track"
      class="segmented-track"
      aria-label=${i}
      aria-readonly=${this.readOnly?"true":o}
      aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
      @keydown=${this.onKeyDown}
    >
      ${this.options.map((c,p)=>{let h=this.value===c.value,f=h||this.value==null&&p===0;return s`<button
          type="button"
          role="radio"
          class="segmented-item"
          aria-checked=${String(h)}
          aria-readonly=${this.readOnly?"true":o}
          tabindex=${f?"0":"-1"}
          ?disabled=${this.disabled||!!c.disabled}
          @click=${()=>{if(!(this.readOnly||this.disabled||c.disabled)){if(h&&this.allowDeselect){this.clearSelection();return}this.emitValueChange(c.value)}}}
        >
          <span>${c.label}</span>
          ${c.badge?s`<span class="emr-badge">${c.badge}</span>`:o}
        </button>`})}
    </div>`;return this.labelHidden?r?s`<div class="emr-row">${l}${a}</div>`:l:s`<div class="emr-field" part="field">
      ${this.label||r?s`<div class="emr-header">
            ${this.label?s`<span class="emr-label">${this.label}</span>`:s`<span></span>`}
            ${a}
          </div>`:o}
      ${l}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};$([d({type:String})],ye.prototype,"controlId",void 0);$([d({type:String})],ye.prototype,"label",void 0);$([d({type:Boolean})],ye.prototype,"labelHidden",void 0);$([d({type:String})],ye.prototype,"ariaLabel",void 0);$([d({attribute:!1})],ye.prototype,"options",void 0);$([d({type:String})],ye.prototype,"value",void 0);$([d({type:Boolean})],ye.prototype,"clearable",void 0);$([d({type:String})],ye.prototype,"clearLabel",void 0);$([d({type:Boolean})],ye.prototype,"allowDeselect",void 0);$([d({type:Boolean})],ye.prototype,"readOnly",void 0);$([d({type:Boolean})],ye.prototype,"disabled",void 0);$([d({type:String})],ye.prototype,"hint",void 0);$([d({type:String})],ye.prototype,"error",void 0);var Me=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-search-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.placeholder="Search\u2026",this.loading=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ve]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.value??"",r=["input-shell",this.error?"input-shell--invalid":"",this.readOnly?"input-shell--readonly":""].filter(Boolean).join(" "),a=s`<div class=${r} part="control">
      <span class="input-leading" aria-hidden="true">${R("search",16)}</span>
      <input
        id=${e}
        class="input-bare"
        type="search"
        placeholder=${this.placeholder}
        .value=${this.locked?I(i):i}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        aria-label=${this.labelHidden?this.label||"Search":o}
        aria-invalid=${this.error?"true":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
        @blur=${l=>{l.target.value=this.value??""}}
        @keydown=${l=>{l.key==="Enter"&&!this.locked&&(l.preventDefault(),this.dispatchEvent(new CustomEvent("submitted",{detail:l.target.value,bubbles:!0,composed:!0})))}}
        @input=${l=>{if(this.locked){l.target.value=this.value??"";return}let c=l.target.value;this.emitValueChange(c===""?null:c)}}
      />
      ${this.loading?s`<span class="input-leading" role="status" aria-label="Searching">…</span>`:o}
      ${i.length>0&&!this.locked?s`<button
            type="button"
            class="input-affix-btn"
            aria-label="Clear search"
            @click=${()=>{this.locked||(this.emitValueChange(null),this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})))}}
          >${R("close",14)}</button>`:o}
    </div>`;return this.labelHidden?a:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}</label>`:o}
      ${a}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};$([d({type:String})],Me.prototype,"controlId",void 0);$([d({type:String})],Me.prototype,"label",void 0);$([d({type:Boolean})],Me.prototype,"labelHidden",void 0);$([d({type:String})],Me.prototype,"value",void 0);$([d({type:String})],Me.prototype,"placeholder",void 0);$([d({type:Boolean})],Me.prototype,"loading",void 0);$([d({type:Boolean})],Me.prototype,"readOnly",void 0);$([d({type:Boolean})],Me.prototype,"disabled",void 0);$([d({type:String})],Me.prototype,"hint",void 0);$([d({type:String})],Me.prototype,"error",void 0);var ke=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-password-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.placeholder="",this.autocomplete="current-password",this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.revealed=!1}static{this.styles=[w,ve]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.value??"",r=["input-shell",this.error?"input-shell--invalid":"",this.readOnly?"input-shell--readonly":""].filter(Boolean).join(" "),a=s`<div class=${r} part="control">
      <input
        id=${e}
        class="input-bare"
        type=${this.revealed?"text":"password"}
        autocomplete=${this.autocomplete}
        placeholder=${this.placeholder}
        .value=${this.locked?I(i):i}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-label=${this.labelHidden&&this.label?this.label:o}
        aria-invalid=${this.error?"true":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
        @blur=${l=>{l.target.value=this.value??"",this.dispatchEvent(new CustomEvent("blurred",{bubbles:!0,composed:!0}))}}
        @input=${l=>{if(this.locked){l.target.value=this.value??"";return}let c=l.target.value;this.emitValueChange(c===""?null:c)}}
      />
      <button
        type="button"
        class="input-affix-btn"
        aria-label=${this.revealed?"Hide password":"Show password"}
        aria-pressed=${String(this.revealed)}
        ?disabled=${this.disabled}
        @click=${()=>{this.disabled||(this.revealed=!this.revealed)}}
      >
        ${R(this.revealed?"eye-off":"eye",16)}
        <span>${this.revealed?"Hide":"Show"}</span>
      </button>
    </div>`;return this.labelHidden?a:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${a}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};$([d({type:String})],ke.prototype,"controlId",void 0);$([d({type:String})],ke.prototype,"label",void 0);$([d({type:Boolean})],ke.prototype,"labelHidden",void 0);$([d({type:String})],ke.prototype,"value",void 0);$([d({type:String})],ke.prototype,"placeholder",void 0);$([d({type:String})],ke.prototype,"autocomplete",void 0);$([d({type:Boolean})],ke.prototype,"required",void 0);$([d({type:Boolean})],ke.prototype,"readOnly",void 0);$([d({type:Boolean})],ke.prototype,"disabled",void 0);$([d({type:String})],ke.prototype,"hint",void 0);$([d({type:String})],ke.prototype,"error",void 0);$([T()],ke.prototype,"revealed",void 0);var me=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-numeric-stepper"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.step=1,this.unit="",this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ve]}get locked(){return this.readOnly||this.disabled}roundValue(e){return this.precision!==void 0&&this.precision>=0?Number(e.toFixed(this.precision)):Math.round(e*1e4)/1e4}stepBy(e){if(this.locked)return;this.draft=void 0;let t=this.value??(this.min!==void 0&&this.min>0?this.min:0),i=this.roundValue(t+e*(this.step||1));this.min!==void 0&&i<this.min&&(i=this.min),this.max!==void 0&&i>this.max&&(i=this.max),this.emitValueChange(i)}render(){this.locked&&(this.draft=void 0),this.draft&&this.value!==this.draft.base&&this.value!==this.draft.parsed&&(this.draft=void 0);let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.value==null?"":this.precision!==void 0&&this.precision>=0?this.value.toFixed(this.precision):String(this.value),r=this.locked?i:this.draft&&(this.value===this.draft.base||this.value===this.draft.parsed)?this.draft.text:i,a=this.min!==void 0&&this.value!==null&&this.value<=this.min,l=this.max!==void 0&&this.value!==null&&this.value>=this.max,c=s`<div class="stepper-row">
      <div class=${`stepper-box${this.error?" stepper-box--invalid":""}`} part="stepper">
        ${this.readOnly?o:s`<button
              type="button"
              class="stepper-action-btn"
              aria-label="Decrease value"
              ?disabled=${this.disabled||a}
              @click=${()=>this.stepBy(-1)}
            >${R("minus",16)}</button>`}
        <input
          id=${e}
          part="control"
          class="stepper-field"
          type="text"
          inputmode=${this.precision===0?"numeric":"decimal"}
          .value=${this.locked?I(i):r}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${this.labelHidden&&this.label?this.label:o}
          aria-invalid=${this.error?"true":o}
          aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
          @blur=${p=>{this.draft=void 0,p.target.value=i}}
          @input=${p=>{if(this.locked){p.target.value=i;return}let h=p.target.value.trim(),f=h===""?null:Number(h),g=f===null||Number.isFinite(f),v=f!==null&&Number.isFinite(f)?this.roundValue(Math.min(this.max??Number.POSITIVE_INFINITY,Math.max(this.min??Number.NEGATIVE_INFINITY,f))):f;this.draft={text:p.target.value,base:this.value,parsed:g?v:void 0},g&&this.emitValueChange(v)}}
        />
        ${this.readOnly?o:s`<button
              type="button"
              class="stepper-action-btn"
              aria-label="Increase value"
              ?disabled=${this.disabled||l}
              @click=${()=>this.stepBy(1)}
            >${R("plus",16)}</button>`}
      </div>
      ${this.unit?s`<span class="emr-muted" aria-hidden="true">${this.unit}</span>`:o}
    </div>`;return this.labelHidden?c:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${c}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};$([d({type:String})],me.prototype,"controlId",void 0);$([d({type:String})],me.prototype,"label",void 0);$([d({type:Boolean})],me.prototype,"labelHidden",void 0);$([d({type:Number})],me.prototype,"value",void 0);$([d({type:Number})],me.prototype,"min",void 0);$([d({type:Number})],me.prototype,"max",void 0);$([d({type:Number})],me.prototype,"step",void 0);$([d({type:Number})],me.prototype,"precision",void 0);$([d({type:String})],me.prototype,"unit",void 0);$([d({type:Boolean})],me.prototype,"required",void 0);$([d({type:Boolean})],me.prototype,"readOnly",void 0);$([d({type:Boolean})],me.prototype,"disabled",void 0);$([d({type:String})],me.prototype,"hint",void 0);$([d({type:String})],me.prototype,"error",void 0);var Z=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-checkbox-group"),this.controlId="",this.label="",this.labelHidden=!1,this.options=[],this.value=[],this.orientation="vertical",this.columns=2,this.variant="standard",this.showSelectAll=!1,this.selectAllLabel="Select all",this.exclusiveValues=[],this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ve]}toggleOption(e){if(this.readOnly||this.disabled)return;let t=Array.isArray(this.value)?this.value:[],i=jr(t,e,this.options,this.exclusiveValues);this.emitValueChange(i)}toggleSelectAll(){if(this.readOnly||this.disabled)return;let e=Array.isArray(this.value)?this.value:[],t=Vr(e,this.options,this.exclusiveValues);this.emitValueChange(t)}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=["checkbox-group-list",this.orientation==="horizontal"?"checkbox-group-list--horizontal":"",this.orientation==="grid"?"checkbox-group-list--grid":""].filter(Boolean).join(" "),r=this.orientation==="grid"?`--cols: ${Math.max(1,this.columns)};`:"",a=new Set(this.value??[]),l=this.showSelectAll?Qi(this.value??[],this.options,this.exclusiveValues):"none",c=this.variant==="card"?" checkbox-row-btn--card":this.variant==="chip"?" checkbox-row-btn--chip":"",p=s`<div
      id=${e}
      role="group"
      class=${i}
      data-orientation=${this.orientation}
      data-variant=${this.variant}
      style=${r}
      aria-label=${this.label||"Options"}
      aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
    >
      ${this.showSelectAll?s`<button
            type="button"
            role="checkbox"
            data-select-all="true"
            class=${`checkbox-row-btn${this.readOnly?" checkbox-row-btn--readonly":""}${c}`}
            aria-checked=${l==="mixed"?"mixed":String(l==="all")}
            aria-readonly=${this.readOnly?"true":o}
            ?disabled=${this.disabled}
            @click=${()=>this.toggleSelectAll()}
          >
            <span class="checkbox-box" aria-hidden="true">
              ${l==="mixed"?"\u2013":l==="all"?R("check",12):o}
            </span>
            <span>${this.selectAllLabel}</span>
          </button>`:o}
      ${this.options.map(h=>{let f=a.has(h.value),g=`checkbox-row-btn${this.readOnly?" checkbox-row-btn--readonly":""}${c}`;return s`<button
          type="button"
          role="checkbox"
          class=${g}
          aria-checked=${String(f)}
          aria-readonly=${this.readOnly?"true":o}
          ?disabled=${this.disabled||!!h.disabled}
          @click=${()=>{h.disabled||this.toggleOption(h.value)}}
        >
          <span class="checkbox-box" aria-hidden="true">${f?R("check",12):o}</span>
          <span class="checkbox-row-copy">
            <span>${h.label}</span>
            ${h.description?s`<span class="checkbox-row-desc">${h.description}</span>`:o}
          </span>
        </button>`})}
    </div>`;return this.labelHidden?p:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:o}
      ${p}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};$([d({type:String})],Z.prototype,"controlId",void 0);$([d({type:String})],Z.prototype,"label",void 0);$([d({type:Boolean})],Z.prototype,"labelHidden",void 0);$([d({attribute:!1})],Z.prototype,"options",void 0);$([d({attribute:!1})],Z.prototype,"value",void 0);$([d({type:String})],Z.prototype,"orientation",void 0);$([d({type:Number})],Z.prototype,"columns",void 0);$([d({type:String})],Z.prototype,"variant",void 0);$([d({type:Boolean})],Z.prototype,"showSelectAll",void 0);$([d({type:String})],Z.prototype,"selectAllLabel",void 0);$([d({attribute:!1})],Z.prototype,"exclusiveValues",void 0);$([d({type:Boolean})],Z.prototype,"required",void 0);$([d({type:Boolean})],Z.prototype,"readOnly",void 0);$([d({type:Boolean})],Z.prototype,"disabled",void 0);$([d({type:String})],Z.prototype,"hint",void 0);$([d({type:String})],Z.prototype,"error",void 0);var lt=class extends S{constructor(){super(...arguments),this.page=1,this.pageSize=20,this.totalItems=0,this.pageSizeOptions=[],this.ariaLabel="Pagination",this.disabled=!1}static{this.styles=[w,ve]}get totalPages(){let e=Math.max(1,this.pageSize||20);return Math.max(1,Math.ceil(Math.max(0,this.totalItems)/e))}emitPage(e){if(this.disabled)return;let t=Math.min(this.totalPages,Math.max(1,e));t!==this.page&&this.dispatchEvent(new CustomEvent("pageChange",{detail:t,bubbles:!0,composed:!0}))}render(){let e=this.totalPages,t=Math.min(e,Math.max(1,this.page||1)),i=Math.max(1,this.pageSize||20),r=this.totalItems===0?0:(t-1)*i+1,a=Math.min(this.totalItems,t*i),l=[],c=Math.max(1,t-2),p=Math.min(e,c+4);for(let h=Math.max(1,p-4);h<=p;h++)l.push(h);return s`<nav class="pagination-nav" aria-label=${this.ariaLabel||"Pagination"}>
      <span class="emr-muted">
        ${this.totalItems===0?"0 items":`${r}\u2013${a} of ${this.totalItems}`}
      </span>
      <div class="pagination-controls">
        ${this.pageSizeOptions.length>0?s`<select
              class="emr-control page-size-select"
              aria-label="Items per page"
              .value=${I(String(this.pageSize))}
              ?disabled=${this.disabled}
              @change=${h=>{let f=h.target,g=Number(f.value);f.value=String(this.pageSize),!this.disabled&&Number.isFinite(g)&&g>0&&this.dispatchEvent(new CustomEvent("pageSizeChange",{detail:g,bubbles:!0,composed:!0}))}}
            >
              ${this.pageSizeOptions.map(h=>s`<option value=${String(h)} ?selected=${h===this.pageSize}>${h} / page</option>`)}
            </select>`:o}
        <button
          type="button"
          class="page-btn"
          aria-label="Previous page"
          ?disabled=${this.disabled||t<=1}
          @click=${()=>this.emitPage(t-1)}
        >Previous</button>
        ${l.map(h=>s`<button
            type="button"
            class="page-btn"
            aria-label=${`Page ${h}`}
            aria-current=${h===t?"page":o}
            ?disabled=${this.disabled}
            @click=${()=>this.emitPage(h)}
          >${h}</button>`)}
        <button
          type="button"
          class="page-btn"
          aria-label="Next page"
          ?disabled=${this.disabled||t>=e}
          @click=${()=>this.emitPage(t+1)}
        >Next</button>
      </div>
    </nav>`}};$([d({type:Number})],lt.prototype,"page",void 0);$([d({type:Number})],lt.prototype,"pageSize",void 0);$([d({type:Number})],lt.prototype,"totalItems",void 0);$([d({attribute:!1})],lt.prototype,"pageSizeOptions",void 0);$([d({type:String})],lt.prototype,"ariaLabel",void 0);$([d({type:Boolean})],lt.prototype,"disabled",void 0);var Qe=class extends S{constructor(){super(...arguments),this.fallbackHeadingId=Ze("emr-dialog-title"),this.open=!1,this.title="",this.description="",this.size="md",this.role="dialog",this.dismissible=!0,this.headingId="",this.onDocumentKeyDown=e=>{this.open&&e.key==="Escape"&&this.dismissible&&(e.preventDefault(),this.requestClose())},this.onDialogKeyDown=e=>{if(this.open){if(e.key==="Escape"&&this.dismissible){e.preventDefault(),e.stopPropagation(),this.requestClose();return}if(e.key==="Tab"){let t=this.getFocusableElements();if(t.length===0){e.preventDefault();return}let i=t[0],r=t[t.length-1],a=this.shadowRoot?.activeElement??document.activeElement;e.shiftKey?(!a||a===i||!t.includes(a))&&(e.preventDefault(),r.focus()):a===r&&(e.preventDefault(),i.focus())}}}}static{this.styles=[w,ve]}connectedCallback(){super.connectedCallback(),typeof document<"u"&&document.addEventListener("keydown",this.onDocumentKeyDown)}disconnectedCallback(){typeof document<"u"&&document.removeEventListener("keydown",this.onDocumentKeyDown),super.disconnectedCallback()}requestClose(){!this.open||!this.dismissible||this.dispatchEvent(new CustomEvent("closeRequested",{bubbles:!0,composed:!0}))}getFocusableElements(){let e='button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',t=Array.from(this.shadowRoot?.querySelectorAll(e)??[]),i=Array.from(this.querySelectorAll(e));return[...t,...i]}updated(e){if(e.has("open")&&this.open){let t=this.getFocusableElements(),i=this.shadowRoot?.querySelector(".dialog-surface");(t[0]??i)?.focus()}}render(){if(!this.open)return o;let e=this.headingId||this.fallbackHeadingId,t=`${e}-desc`,i=this.role==="alertdialog"?"alertdialog":"dialog";return s`<div
      class="dialog-backdrop"
      part="backdrop"
      @click=${r=>{r.target===r.currentTarget&&this.dismissible&&this.requestClose()}}
      @keydown=${this.onDialogKeyDown}
    >
      <div
        class=${`dialog-surface dialog-surface--${this.size}`}
        part="dialog"
        role=${i}
        tabindex="-1"
        aria-modal="true"
        aria-labelledby=${this.title?e:o}
        aria-label=${this.title?o:"Dialog"}
        aria-describedby=${this.description?t:o}
      >
        <header class="emr-header">
          ${this.title?s`<h3 id=${e} class="emr-title">${this.title}</h3>`:s`<span></span>`}
          ${this.dismissible?s`<button
                type="button"
                class="emr-btn emr-btn--ghost icon-btn"
                aria-label="Close dialog"
                @click=${()=>this.requestClose()}
              >${R("close",18)}</button>`:o}
        </header>
        ${this.description?s`<p id=${t} class="emr-muted">${this.description}</p>`:o}
        <div class="dialog-body"><slot></slot></div>
        <footer class="dialog-footer"><slot name="footer"></slot></footer>
      </div>
    </div>`}};$([d({type:Boolean})],Qe.prototype,"open",void 0);$([d({type:String})],Qe.prototype,"title",void 0);$([d({type:String})],Qe.prototype,"description",void 0);$([d({type:String})],Qe.prototype,"size",void 0);$([d({type:String})],Qe.prototype,"role",void 0);$([d({type:Boolean})],Qe.prototype,"dismissible",void 0);$([d({type:String})],Qe.prototype,"headingId",void 0);var oi=class extends S{constructor(){super(...arguments),this.open=!1,this.label="Options",this.align="start",this.onOutsidePointerDown=e=>{this.open&&(e.composedPath().includes(this)||this.emitOpenChange(!1))},this.onGlobalKeyDown=e=>{this.open&&e.key==="Escape"&&(e.stopPropagation(),this.emitOpenChange(!1))}}static{this.styles=[w,ve]}connectedCallback(){super.connectedCallback(),typeof document<"u"&&(document.addEventListener("pointerdown",this.onOutsidePointerDown,!0),document.addEventListener("keydown",this.onGlobalKeyDown,!0))}disconnectedCallback(){typeof document<"u"&&(document.removeEventListener("pointerdown",this.onOutsidePointerDown,!0),document.removeEventListener("keydown",this.onGlobalKeyDown,!0)),super.disconnectedCallback()}emitOpenChange(e){this.dispatchEvent(new CustomEvent("openChange",{detail:e,bubbles:!0,composed:!0}))}render(){return s`<div class="popover-root">
      <div
        class="popover-trigger"
        @click=${()=>{this.emitOpenChange(!this.open)}}
      >
        <slot name="trigger"></slot>
      </div>
      ${this.open?s`<div
            class=${`popover-panel popover-panel--${this.align==="end"?"end":"start"}`}
            part="panel"
            role="dialog"
            aria-label=${this.label}
          >
            <slot></slot>
          </div>`:o}
    </div>`}};$([d({type:Boolean})],oi.prototype,"open",void 0);$([d({type:String})],oi.prototype,"label",void 0);$([d({type:String})],oi.prototype,"align",void 0);var Yt=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-tooltip"),this.content="",this.controlId="",this.disabled=!1,this.active=!1}static{this.styles=[w,ve]}render(){let e=this.controlId||this.fallbackId,t=this.active&&!this.disabled&&!!this.content;return s`<span
      class="tooltip-root"
      aria-describedby=${t?e:o}
      @mouseenter=${()=>{this.disabled||(this.active=!0)}}
      @mouseleave=${()=>{this.active=!1}}
      @focusin=${()=>{this.disabled||(this.active=!0)}}
      @focusout=${()=>{this.active=!1}}
      @keydown=${i=>{i.key==="Escape"&&(this.active=!1)}}
    >
      <slot></slot>
      ${t?s`<span id=${e} role="tooltip" class="tooltip-bubble">${this.content}</span>`:o}
    </span>`}};$([d({type:String})],Yt.prototype,"content",void 0);$([d({type:String})],Yt.prototype,"controlId",void 0);$([d({type:Boolean})],Yt.prototype,"disabled",void 0);$([T()],Yt.prototype,"active",void 0);var dt=class extends S{constructor(){super(...arguments),this.label="",this.value=null,this.max=100,this.indeterminate=!1,this.tone="info",this.valueLabel=""}static{this.styles=[w,ve]}render(){let e=this.max>0?this.max:100,t=this.value==null?0:Math.min(100,Math.max(0,this.value/e*100)),i=this.valueLabel||(!this.indeterminate&&this.value!=null?`${Math.round(t)}%`:"");return s`<div class="emr-field" part="progress">
      ${this.label||i?s`<div class="emr-header">
            ${this.label?s`<span class="emr-label">${this.label}</span>`:s`<span></span>`}
            ${i?s`<span class="emr-muted">${i}</span>`:o}
          </div>`:o}
      <div
        class="progress-track"
        role="progressbar"
        aria-label=${this.label||"Progress"}
        aria-valuemin="0"
        aria-valuemax=${String(e)}
        aria-valuenow=${this.indeterminate||this.value==null?o:String(this.value)}
        aria-valuetext=${this.valueLabel||o}
      >
        <div
          class=${`progress-fill progress-fill--${this.tone}${this.indeterminate?" progress-fill--indeterminate":""}`}
          style=${`width: ${t}%;`}
        ></div>
      </div>
    </div>`}};$([d({type:String})],dt.prototype,"label",void 0);$([d({type:Number})],dt.prototype,"value",void 0);$([d({type:Number})],dt.prototype,"max",void 0);$([d({type:Boolean})],dt.prototype,"indeterminate",void 0);$([d({type:String})],dt.prototype,"tone",void 0);$([d({type:String})],dt.prototype,"valueLabel",void 0);var ni=class extends S{constructor(){super(...arguments),this.label="Loading",this.size="md",this.tone="info"}static{this.styles=[w,ve]}render(){return s`<span class="spinner-wrap" role="status" aria-label=${this.label}>
      <span class=${`spinner-ring spinner-ring--${this.size} spinner-ring--${this.tone}`} aria-hidden="true"></span>
      <span class="sr-only">${this.label}</span>
    </span>`}};$([d({type:String})],ni.prototype,"label",void 0);$([d({type:String})],ni.prototype,"size",void 0);$([d({type:String})],ni.prototype,"tone",void 0);var It=class extends S{constructor(){super(...arguments),this.variant="line",this.lines=1,this.width="",this.height="",this.ariaLabel="Loading content"}static{this.styles=[w,ve]}render(){let e=[this.width?`width: ${this.width};`:"",this.height?`height: ${this.height};`:""].filter(Boolean).join(" ");if(this.variant!=="line")return s`<div role="status" aria-busy="true" aria-label=${this.ariaLabel||"Loading content"}>
        <span class=${`skeleton-block skeleton-block--${this.variant}`} style=${e} aria-hidden="true"></span>
      </div>`;let t=Math.max(1,Math.floor(this.lines||1));return s`<div class="skeleton-stack" role="status" aria-busy="true" aria-label=${this.ariaLabel||"Loading content"}>
      ${Array.from({length:t},(i,r)=>{let a=e||(t>1&&r===t-1?"width: 72%;":"");return s`<span class="skeleton-block skeleton-block--line" style=${a} aria-hidden="true"></span>`})}
    </div>`}};$([d({type:String})],It.prototype,"variant",void 0);$([d({type:Number})],It.prototype,"lines",void 0);$([d({type:String})],It.prototype,"width",void 0);$([d({type:String})],It.prototype,"height",void 0);$([d({type:String})],It.prototype,"ariaLabel",void 0);function gd(n){let e=n.trim().split(/\s+/).filter(Boolean);return e.length===0?"":e.length===1?e[0].slice(0,2).toUpperCase():`${e[0][0]??""}${e[e.length-1][0]??""}`.toUpperCase()}var ct=class extends S{constructor(){super(...arguments),this.name="",this.initials="",this.imageUrl=null,this.size="md",this.tone="neutral",this.imageFailed=!1}static{this.styles=[w,ve]}willUpdate(e){e.has("imageUrl")&&(this.imageFailed=!1)}render(){let e=(this.initials||gd(this.name)).slice(0,3),t=this.name||e||"Avatar",i=!!this.imageUrl&&!this.imageFailed;return s`<span
      part="avatar"
      role="img"
      aria-label=${t}
      class=${`avatar avatar--${this.size} emr-badge--${this.tone}`}
    >
      ${i?s`<img
            src=${this.imageUrl}
            alt=${this.name}
            @error=${()=>{this.imageFailed=!0}}
          />`:e?s`<span aria-hidden="true">${e}</span>`:R("user",this.size==="lg"?22:16)}
    </span>`}};$([d({type:String})],ct.prototype,"name",void 0);$([d({type:String})],ct.prototype,"initials",void 0);$([d({type:String})],ct.prototype,"imageUrl",void 0);$([d({type:String})],ct.prototype,"size",void 0);$([d({type:String})],ct.prototype,"tone",void 0);$([T()],ct.prototype,"imageFailed",void 0);var Ie=class extends S{constructor(){super(...arguments),this.fallbackId=Ze("emr-file-trigger"),this.controlId="",this.label="",this.labelHidden=!1,this.buttonLabel="Choose files",this.dropHint="or drag and drop files here",this.accept="",this.multiple=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.dragOver=!1}static{this.styles=[w,ve]}get locked(){return this.readOnly||this.disabled}emitFiles(e){if(this.locked||!e)return;let t=Array.from(e);if(t.length===0)return;let i=this.multiple?t:[t[0]],r=i.map(a=>({name:a.name,sizeBytes:a.size,mimeType:a.type||"application/octet-stream",lastModified:a.lastModified}));this.dispatchEvent(new CustomEvent("filesSelected",{detail:r,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("nativeFilesSelected",{detail:i,bubbles:!0,composed:!0}))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=["drop-zone",this.dragOver?"drop-zone--over":"",this.locked?"drop-zone--disabled":""].filter(Boolean).join(" "),r=s`<div
      class=${i}
      part="dropzone"
      @dragover=${a=>{this.locked||(a.preventDefault(),this.dragOver=!0)}}
      @dragleave=${()=>{this.dragOver=!1}}
      @drop=${a=>{a.preventDefault(),this.dragOver=!1,!this.locked&&this.emitFiles(a.dataTransfer?.files)}}
    >
      <input
        id=${e}
        class="sr-only"
        type="file"
        tabindex="-1"
        accept=${this.accept||o}
        ?multiple=${this.multiple}
        ?disabled=${this.locked}
        @change=${a=>{let l=a.target;this.emitFiles(l.files),l.value=""}}
      />
      <button
        type="button"
        class="emr-btn emr-btn--outline"
        aria-label=${this.label?`${this.buttonLabel}, ${this.label}`:this.buttonLabel}
        ?disabled=${this.locked}
        @click=${()=>{this.locked||this.shadowRoot?.querySelector('input[type="file"]')?.click()}}
      >
        ${R("upload",16)}
        <span>${this.buttonLabel}</span>
      </button>
      ${this.dropHint?s`<span class="emr-muted">${this.dropHint}</span>`:o}
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}</span>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};$([d({type:String})],Ie.prototype,"controlId",void 0);$([d({type:String})],Ie.prototype,"label",void 0);$([d({type:Boolean})],Ie.prototype,"labelHidden",void 0);$([d({type:String})],Ie.prototype,"buttonLabel",void 0);$([d({type:String})],Ie.prototype,"dropHint",void 0);$([d({type:String})],Ie.prototype,"accept",void 0);$([d({type:Boolean})],Ie.prototype,"multiple",void 0);$([d({type:Boolean})],Ie.prototype,"readOnly",void 0);$([d({type:Boolean})],Ie.prototype,"disabled",void 0);$([d({type:String})],Ie.prototype,"hint",void 0);$([d({type:String})],Ie.prototype,"error",void 0);$([T()],Ie.prototype,"dragOver",void 0);function hl(){y("emr-textarea",fe),y("emr-icon-button",Ve),y("emr-segmented-control",ye),y("emr-search-input",Me),y("emr-password-input",ke),y("emr-numeric-stepper",me),y("emr-checkbox-group",Z),y("emr-pagination",lt),y("emr-dialog",Qe),y("emr-popover",oi),y("emr-tooltip",Yt),y("emr-progress-bar",dt),y("emr-spinner",ni),y("emr-skeleton",It),y("emr-avatar",ct),y("emr-file-trigger",Ie)}var m=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},bd=0,te=n=>`${n}-${++bd}`,fd=new RegExp("^\\x23[0-9a-fA-F]{6}$"),ie=M`
  .toggle-group-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .toggle-group-list--horizontal {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .toggle-group-list--grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), minmax(160px, 1fr));
    gap: 8px;
  }
  .toggle-row-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .toggle-row-btn--card {
    padding: 10px 14px;
  }
  .toggle-row-btn--start {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .toggle-row-btn--between {
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .toggle-row-btn[aria-checked="true"],
  .toggle-row-btn[aria-checked="mixed"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .toggle-row-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .toggle-row-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .switch-track {
    width: 40px;
    height: 22px;
    border-radius: 999px;
    padding: 2px;
    background: var(--emr-border);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    box-sizing: border-box;
    transition: background-color 140ms ease;
  }
  .toggle-row-btn[aria-checked="true"] .switch-track {
    background: var(--emr-primary);
  }
  .switch-thumb {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    transform: translateX(0);
    transition: transform 140ms ease;
  }
  .toggle-row-btn[aria-checked="true"] .switch-thumb {
    transform: translateX(18px);
  }
  .row-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .row-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }

  .tree-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .tree-list {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 4px;
    max-height: 320px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tree-row {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    padding-left: calc(10px + var(--tree-depth, 0) * 18px);
    border: 1px solid transparent;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    text-align: left;
    cursor: pointer;
    box-sizing: border-box;
    width: 100%;
  }
  .tree-row:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .tree-row[aria-selected="true"],
  .tree-row[aria-checked="true"] {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary-border);
    color: var(--emr-primary-contrast);
  }
  .tree-row:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .tree-twisty {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-text-muted);
    flex-shrink: 0;
  }
  .tree-check {
    width: 18px;
    height: 18px;
    accent-color: var(--emr-primary);
    pointer-events: none;
    flex-shrink: 0;
  }

  .popover-anchor {
    position: relative;
    width: 100%;
  }
  .trigger-bar {
    display: flex;
    align-items: stretch;
    gap: 6px;
    width: 100%;
  }
  .trigger-btn {
    flex: 1;
    min-height: var(--emr-control-height);
    min-width: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .trigger-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .clear-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .clear-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .dropdown-panel {
    margin-top: 4px;
    padding: 8px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    z-index: 9999;
  }

  .viewer-shell {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg);
    background: var(--emr-surface);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .viewer-shell--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 10000;
    border-radius: 0;
    background: var(--emr-surface);
    padding: 16px;
  }
  .viewer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
  }
  .viewer-stage {
    position: relative;
    min-height: 240px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    user-select: none;
  }
  .viewer-img {
    max-width: 100%;
    max-height: 360px;
    object-fit: contain;
    transform-origin: center center;
    transition: transform 60ms linear;
    pointer-events: none;
  }
  .viewer-thumbs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 4px 0;
  }
  .viewer-thumb-btn {
    min-width: 48px;
    min-height: 48px;
    padding: 2px;
    border: 2px solid var(--emr-border);
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface);
    cursor: pointer;
  }
  .viewer-thumb-btn[aria-current="true"] {
    border-color: var(--emr-primary);
  }

  .cropper-stage {
    position: relative;
    min-height: 240px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .crop-box {
    position: absolute;
    border: 2px dashed var(--emr-primary);
    background: var(--emr-primary-soft);
    opacity: 0.65;
    cursor: move;
    box-sizing: border-box;
  }
  .crop-handle {
    position: absolute;
    right: -6px;
    bottom: -6px;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: var(--emr-primary);
    cursor: nwse-resize;
  }

  .upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }
  .upload-card {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .upload-thumb {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface-soft);
  }
  .upload-dropzone {
    border: 1.5px dashed var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .tag-shell {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 8px;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
  }
  .tag-bare-input {
    flex: 1;
    min-width: 110px;
    min-height: 36px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    outline: none;
  }

  .slider-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .slider-native {
    width: 100%;
    min-height: 44px;
    accent-color: var(--emr-primary);
    cursor: pointer;
  }
  .slider-marks {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
  }
  .range-pair-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-items: center;
  }

  .otp-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .otp-slot {
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    text-align: center;
    font: inherit;
    font-size: var(--emr-text-lg);
    font-weight: var(--emr-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .menu-root {
    position: relative;
    display: inline-block;
  }
  .menu-list {
    margin-top: 4px;
    min-width: 180px;
    padding: 4px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    display: flex;
    flex-direction: column;
    gap: 2px;
    z-index: 9999;
  }
  .menu-item {
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .menu-item:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .menu-item--danger {
    color: var(--emr-danger);
  }
  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .menu-divider {
    height: 1px;
    background: var(--emr-border);
    margin: 4px 0;
  }
  .split-group {
    display: inline-flex;
    align-items: stretch;
  }
  .split-primary {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .split-trigger {
    min-width: 44px;
    padding: 0 10px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid var(--emr-border);
  }

  .accordion-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .accordion-item {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .accordion-header-btn {
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    border: 0;
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-semibold);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .accordion-panel {
    padding: 12px 14px;
    border-top: 1px solid var(--emr-border);
    font-size: var(--emr-text-sm);
  }

  .breadcrumb-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .breadcrumb-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .breadcrumb-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-primary);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .breadcrumb-current {
    min-height: 44px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    color: var(--emr-text);
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-bold);
  }

  .swatch-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .swatch-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    border-radius: var(--emr-radius);
    border: 2px solid var(--emr-border);
    background: var(--swatch-color, var(--emr-primary));
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-on-primary);
  }
  .swatch-btn[aria-checked="true"] {
    border-color: var(--emr-text);
    outline: 2px solid var(--emr-focus);
    outline-offset: 2px;
  }

  .cal-day--in-range {
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .cal-day--edge {
    background: var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
  }
`,W=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-toggle-group"),this.controlId="",this.label="",this.labelHidden=!1,this.options=[],this.value=[],this.orientation="vertical",this.columns=2,this.variant="standard",this.labelPlacement="space-between",this.showSelectAll=!1,this.selectAllLabel="Enable all",this.exclusiveValues=[],this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}toggleOption(e){if(this.readOnly||this.disabled)return;let t=Array.isArray(this.value)?this.value:[],i=jr(t,e,this.options,this.exclusiveValues);this.emitValueChange(i)}toggleAll(){if(this.readOnly||this.disabled)return;let e=Array.isArray(this.value)?this.value:[],t=Vr(e,this.options,this.exclusiveValues);this.emitValueChange(t)}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=["toggle-group-list",this.orientation==="horizontal"?"toggle-group-list--horizontal":"",this.orientation==="grid"?"toggle-group-list--grid":""].filter(Boolean).join(" "),r=this.orientation==="grid"?`--cols: ${Math.max(1,this.columns)};`:"",a=this.labelPlacement==="start"?" toggle-row-btn--start":this.labelPlacement==="space-between"?" toggle-row-btn--between":"",l=this.variant==="card"?" toggle-row-btn--card":"",c=new Set(this.value??[]),p=this.showSelectAll?Qi(this.value??[],this.options,this.exclusiveValues):"none",h=s`<div
      id=${e}
      role="group"
      class=${i}
      data-orientation=${this.orientation}
      data-variant=${this.variant}
      style=${r}
      aria-label=${this.label||"Toggle options"}
      aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
    >
      ${this.showSelectAll?s`<button
            type="button"
            role="switch"
            data-select-all="true"
            class=${`toggle-row-btn${this.readOnly?" toggle-row-btn--readonly":""}${a}${l}`}
            aria-checked=${String(p==="all")}
            aria-readonly=${this.readOnly?"true":o}
            ?disabled=${this.disabled}
            @click=${()=>this.toggleAll()}
          >
            <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
            <span>${this.selectAllLabel}</span>
          </button>`:o}
      ${this.options.map(f=>{let g=c.has(f.value);return s`<button
          type="button"
          role="switch"
          class=${`toggle-row-btn${this.readOnly?" toggle-row-btn--readonly":""}${a}${l}`}
          aria-checked=${String(g)}
          aria-readonly=${this.readOnly?"true":o}
          ?disabled=${this.disabled||!!f.disabled}
          @click=${()=>{f.disabled||this.toggleOption(f.value)}}
        >
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
          <span class="row-copy">
            <span>${f.label}</span>
            ${f.description?s`<span class="row-desc">${f.description}</span>`:o}
          </span>
        </button>`})}
    </div>`;return this.labelHidden?h:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:o}
      ${h}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],W.prototype,"controlId",void 0);m([d({type:String})],W.prototype,"label",void 0);m([d({type:Boolean})],W.prototype,"labelHidden",void 0);m([d({attribute:!1})],W.prototype,"options",void 0);m([d({attribute:!1})],W.prototype,"value",void 0);m([d({type:String})],W.prototype,"orientation",void 0);m([d({type:Number})],W.prototype,"columns",void 0);m([d({type:String})],W.prototype,"variant",void 0);m([d({type:String})],W.prototype,"labelPlacement",void 0);m([d({type:Boolean})],W.prototype,"showSelectAll",void 0);m([d({type:String})],W.prototype,"selectAllLabel",void 0);m([d({attribute:!1})],W.prototype,"exclusiveValues",void 0);m([d({type:Boolean})],W.prototype,"required",void 0);m([d({type:Boolean})],W.prototype,"readOnly",void 0);m([d({type:Boolean})],W.prototype,"disabled",void 0);m([d({type:String})],W.prototype,"hint",void 0);m([d({type:String})],W.prototype,"error",void 0);var K=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-tree-view"),this.controlId="",this.label="",this.labelHidden=!1,this.nodes=[],this.selectedIds=[],this.expandedIds=[],this.multiple=!1,this.checkStrategy="cascade",this.searchable=!1,this.searchQuery="",this.searchPlaceholder="Filter tree\u2026",this.showExpandControls=!1,this.emptyMessage="No matching items",this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}get value(){return this.multiple?this.selectedIds:this.selectedIds[0]??null}set value(e){Array.isArray(e)?this.selectedIds=e:typeof e=="string"&&e?this.selectedIds=[e]:this.selectedIds=[]}get locked(){return this.readOnly||this.disabled}emitSelection(e){this.dispatchEvent(new CustomEvent("selectedIdsChange",{detail:e,bubbles:!0,composed:!0})),this.emitValueChange(this.multiple?e:e[0]??null)}emitExpanded(e){this.expandedIds=e,this.dispatchEvent(new CustomEvent("expandedIdsChange",{detail:e,bubbles:!0,composed:!0}))}toggleExpand(e){if(this.disabled)return;let t=new Set(this.expandedIds);t.has(e)?t.delete(e):t.add(e),this.emitExpanded(Array.from(t))}activateRow(e){if(!(this.locked||e.node.disabled))if(this.dispatchEvent(new CustomEvent("nodeActivated",{detail:e.node,bubbles:!0,composed:!0})),this.multiple){let t=Qn(this.nodes,this.selectedIds,e.node.id,this.checkStrategy);this.emitSelection(t)}else{if(e.node.selectable===!1&&e.hasChildren){this.toggleExpand(e.node.id);return}this.emitSelection([e.node.id])}}focusTreeItemAt(e){let t=Array.from(this.shadowRoot?.querySelectorAll('button[role="treeitem"]:not(:disabled)')??[]);if(!t.length)return;let i=Math.max(0,Math.min(e,t.length-1));t[i]?.focus()}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=Xn(this.nodes,this.expandedIds,{searchQuery:this.searchQuery,selectedIds:this.selectedIds,checkStrategy:this.checkStrategy}),r=s`<div class="emr-field">
      ${this.searchable||this.showExpandControls?s`<div class="tree-toolbar">
            ${this.searchable?s`<input
                  type="search"
                  class="emr-control"
                  placeholder=${this.searchPlaceholder}
                  aria-label=${this.searchPlaceholder}
                  .value=${this.searchQuery}
                  ?disabled=${this.disabled}
                  @input=${a=>{let l=a.target.value;this.searchQuery=l,this.dispatchEvent(new CustomEvent("searchQueryChange",{detail:l,bubbles:!0,composed:!0}))}}
                />`:o}
            ${this.showExpandControls?s`<button
                    type="button"
                    class="emr-btn emr-btn--ghost"
                    ?disabled=${this.disabled}
                    @click=${()=>this.emitExpanded(Ls(this.nodes))}
                  >Expand all</button>
                  <button
                    type="button"
                    class="emr-btn emr-btn--ghost"
                    ?disabled=${this.disabled}
                    @click=${()=>this.emitExpanded([])}
                  >Collapse all</button>`:o}
          </div>`:o}
      <div
        id=${e}
        role="tree"
        class="tree-list"
        aria-label=${this.label||"Tree view"}
        aria-multiselectable=${this.multiple?"true":o}
        aria-readonly=${this.readOnly?"true":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
      >
        ${i.length===0?s`<p class="emr-muted" role="status">${this.emptyMessage}</p>`:o}
        ${i.map((a,l)=>{let c=this.multiple?a.checkState==="checked":this.selectedIds.includes(a.node.id);return s`<button
            type="button"
            role="treeitem"
            class="tree-row"
            data-node-id=${a.node.id}
            style=${`--tree-depth: ${a.depth};`}
            aria-level=${String(a.depth+1)}
            aria-expanded=${a.hasChildren?String(a.expanded):o}
            aria-selected=${String(c)}
            aria-checked=${this.multiple?a.checkState==="mixed"?"mixed":String(a.checkState==="checked"):o}
            ?disabled=${this.disabled||!!a.node.disabled}
            @keydown=${p=>{if(p.key==="ArrowDown")p.preventDefault(),this.focusTreeItemAt(l+1);else if(p.key==="ArrowUp")p.preventDefault(),this.focusTreeItemAt(l-1);else if(p.key==="Home")p.preventDefault(),this.focusTreeItemAt(0);else if(p.key==="End")p.preventDefault(),this.focusTreeItemAt(i.length-1);else if(p.key==="ArrowRight"&&a.hasChildren)p.preventDefault(),a.expanded?this.focusTreeItemAt(l+1):this.toggleExpand(a.node.id);else if(p.key==="ArrowLeft"){if(p.preventDefault(),a.hasChildren&&a.expanded)this.toggleExpand(a.node.id);else if(a.parentId){let h=i.findIndex(f=>f.node.id===a.parentId);h>=0&&this.focusTreeItemAt(h)}}}}
            @click=${()=>this.activateRow(a)}
          >
            <span
              class="tree-twisty"
              aria-hidden="true"
              @click=${p=>{a.hasChildren&&(p.stopPropagation(),this.toggleExpand(a.node.id))}}
            >
              ${a.hasChildren?R(a.expanded?"chevron-down":"chevron-right",14):o}
            </span>
            ${this.multiple?s`<input
                  type="checkbox"
                  class="tree-check"
                  tabindex="-1"
                  aria-hidden="true"
                  .checked=${I(a.checkState==="checked")}
                  .indeterminate=${I(a.checkState==="mixed")}
                  ?disabled=${this.disabled||!!a.node.disabled}
                />`:o}
            <span class="row-copy">
              <span>${a.node.label}</span>
              ${a.node.description?s`<span class="row-desc">${a.node.description}</span>`:o}
            </span>
            ${a.node.code?s`<span class="emr-badge">${a.node.code}</span>`:o}
          </button>`})}
      </div>
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}</span>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],K.prototype,"controlId",void 0);m([d({type:String})],K.prototype,"label",void 0);m([d({type:Boolean})],K.prototype,"labelHidden",void 0);m([d({attribute:!1})],K.prototype,"nodes",void 0);m([d({attribute:!1})],K.prototype,"selectedIds",void 0);m([d({attribute:!1})],K.prototype,"expandedIds",void 0);m([d({type:Boolean})],K.prototype,"multiple",void 0);m([d({type:String})],K.prototype,"checkStrategy",void 0);m([d({type:Boolean})],K.prototype,"searchable",void 0);m([d({type:String})],K.prototype,"searchQuery",void 0);m([d({type:String})],K.prototype,"searchPlaceholder",void 0);m([d({type:Boolean})],K.prototype,"showExpandControls",void 0);m([d({type:String})],K.prototype,"emptyMessage",void 0);m([d({type:Boolean})],K.prototype,"readOnly",void 0);m([d({type:Boolean})],K.prototype,"disabled",void 0);m([d({type:String})],K.prototype,"hint",void 0);m([d({type:String})],K.prototype,"error",void 0);var U=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-tree-select"),this.controlId="",this.label="",this.labelHidden=!1,this.placeholder="Select\u2026",this.nodes=[],this.value=null,this.selectedIds=[],this.expandedIds=[],this.multiple=!1,this.checkStrategy="cascade",this.displayMode="path",this.searchable=!0,this.clearable=!1,this.open=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}get effectiveIds(){return this.multiple?this.selectedIds:this.value?[this.value]:this.selectedIds}setOpen(e){this.locked&&e||(this.open=e,this.dispatchEvent(new CustomEvent("openChange",{detail:e,bubbles:!0,composed:!0})))}clearAll(){this.locked||(this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("selectedIdsChange",{detail:[],bubbles:!0,composed:!0})),this.emitValueChange(this.multiple?[]:null))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.effectiveIds,r=i.length===0?this.placeholder:i.map(c=>Zn(this.nodes,c,this.displayMode)).filter(Boolean).join(", "),a=this.clearable&&i.length>0&&!this.locked,l=s`<div class="popover-anchor">
      <div class="trigger-bar">
        <button
          id=${e}
          type="button"
          role="combobox"
          class="trigger-btn"
          aria-expanded=${String(this.open&&!this.locked)}
          aria-haspopup="tree"
          aria-readonly=${this.readOnly?"true":o}
          aria-invalid=${this.error?"true":o}
          aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
          ?disabled=${this.disabled}
          @click=${()=>this.setOpen(!this.open)}
        >
          <span>${r}</span>
          <span aria-hidden="true">${R(this.open?"chevron-up":"chevron-down",16)}</span>
        </button>
        ${a?s`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label||"selection"}`}
              @click=${()=>this.clearAll()}
            >${R("close",14)}</button>`:o}
      </div>
      ${this.open&&!this.locked?s`<div class="dropdown-panel">
            <emr-tree-view
              labelHidden
              .label=${this.label||"Options"}
              .nodes=${this.nodes}
              .selectedIds=${i}
              .expandedIds=${this.expandedIds.length?this.expandedIds:Ls(this.nodes)}
              .multiple=${this.multiple}
              .checkStrategy=${this.checkStrategy}
              .searchable=${this.searchable}
              @selectedIdsChange=${c=>{c.stopPropagation();let p=c.detail;this.dispatchEvent(new CustomEvent("selectedIdsChange",{detail:p,bubbles:!0,composed:!0})),this.multiple?this.emitValueChange(p):(this.emitValueChange(p[0]??null),this.setOpen(!1))}}
            ></emr-tree-view>
          </div>`:o}
    </div>`;return this.labelHidden?l:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${l}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],U.prototype,"controlId",void 0);m([d({type:String})],U.prototype,"label",void 0);m([d({type:Boolean})],U.prototype,"labelHidden",void 0);m([d({type:String})],U.prototype,"placeholder",void 0);m([d({attribute:!1})],U.prototype,"nodes",void 0);m([d({type:String})],U.prototype,"value",void 0);m([d({attribute:!1})],U.prototype,"selectedIds",void 0);m([d({attribute:!1})],U.prototype,"expandedIds",void 0);m([d({type:Boolean})],U.prototype,"multiple",void 0);m([d({type:String})],U.prototype,"checkStrategy",void 0);m([d({type:String})],U.prototype,"displayMode",void 0);m([d({type:Boolean})],U.prototype,"searchable",void 0);m([d({type:Boolean})],U.prototype,"clearable",void 0);m([d({type:Boolean})],U.prototype,"open",void 0);m([d({type:Boolean})],U.prototype,"required",void 0);m([d({type:Boolean})],U.prototype,"readOnly",void 0);m([d({type:Boolean})],U.prototype,"disabled",void 0);m([d({type:String})],U.prototype,"hint",void 0);m([d({type:String})],U.prototype,"error",void 0);var $e=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-image-viewer"),this.controlId="",this.label="Image viewer",this.src="",this.alt="",this.caption="",this.images=[],this.activeIndex=0,this.viewport=Es,this.fullscreen=!1,this.allowFullscreen=!0,this.showThumbnails=!0,this.readOnly=!1,this.disabled=!1}static{this.styles=[w,ie]}get resolvedItems(){return this.images.length>0?this.images:this.src?[{id:"single",src:this.src,alt:this.alt||this.label,caption:this.caption}]:[]}updateViewport(e){if(this.disabled)return;let t={...this.viewport,...e};this.viewport=t,this.dispatchEvent(new CustomEvent("viewportChange",{detail:t,bubbles:!0,composed:!0}))}setActiveIndex(e){let t=this.resolvedItems;if(!t.length)return;let i=(e%t.length+t.length)%t.length;this.activeIndex=i,this.dispatchEvent(new CustomEvent("activeIndexChange",{detail:i,bubbles:!0,composed:!0}))}toggleFullscreen(e){!this.allowFullscreen&&e||(this.fullscreen=e,this.dispatchEvent(new CustomEvent("fullscreenChange",{detail:e,bubbles:!0,composed:!0})),e||this.dispatchEvent(new CustomEvent("closeRequested",{bubbles:!0,composed:!0})))}render(){let e=this.controlId||this.fallbackId,t=this.resolvedItems,i=t[Math.min(this.activeIndex,Math.max(0,t.length-1))],r=Ts(this.viewport);return s`<div
      id=${e}
      role=${this.fullscreen?"dialog":"region"}
      aria-modal=${this.fullscreen?"true":o}
      aria-label=${this.label}
      tabindex="0"
      class=${`viewer-shell${this.fullscreen?" viewer-shell--fullscreen":""}`}
      @keydown=${a=>{a.key==="Escape"&&this.fullscreen&&(a.preventDefault(),this.toggleFullscreen(!1))}}
    >
      <div class="viewer-toolbar">
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-out"
            aria-label="Zoom out"
            ?disabled=${this.disabled}
            @click=${()=>this.updateViewport({zoom:Ps(this.viewport.zoom,-.25)})}
          >−</button>
          <span class="emr-badge">${Math.round(this.viewport.zoom*100)}%</span>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="zoom-in"
            aria-label="Zoom in"
            ?disabled=${this.disabled}
            @click=${()=>this.updateViewport({zoom:Ps(this.viewport.zoom,.25)})}
          >+</button>
          <button
            type="button"
            class="emr-btn emr-btn--ghost"
            data-action="reset"
            aria-label="Fit image"
            ?disabled=${this.disabled}
            @click=${()=>this.updateViewport(Es)}
          >Fit</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-ccw"
            aria-label="Rotate counterclockwise"
            ?disabled=${this.disabled}
            @click=${()=>this.updateViewport({rotationDeg:Zi(this.viewport.rotationDeg,!1)})}
          >↺ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-cw"
            aria-label="Rotate clockwise"
            ?disabled=${this.disabled}
            @click=${()=>this.updateViewport({rotationDeg:Zi(this.viewport.rotationDeg,!0)})}
          >↻ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-h"
            aria-label="Flip horizontal"
            aria-pressed=${String(this.viewport.flipH)}
            ?disabled=${this.disabled}
            @click=${()=>this.updateViewport({flipH:!this.viewport.flipH})}
          >Flip H</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-v"
            aria-label="Flip vertical"
            aria-pressed=${String(this.viewport.flipV)}
            ?disabled=${this.disabled}
            @click=${()=>this.updateViewport({flipV:!this.viewport.flipV})}
          >Flip V</button>
        </div>
        <div class="emr-row">
          <label class="emr-muted">
            Straighten
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              aria-label="Straighten angle"
              .value=${String(this.viewport.rotationDeg)}
              ?disabled=${this.disabled}
              @input=${a=>{let l=Number(a.target.value);this.updateViewport({rotationDeg:Ds(l)})}}
            />
          </label>
          ${this.allowFullscreen?s`<button
                type="button"
                class="emr-btn emr-btn--outline"
                data-action="fullscreen"
                aria-label=${this.fullscreen?"Exit fullscreen":"Enter fullscreen"}
                @click=${()=>this.toggleFullscreen(!this.fullscreen)}
              >${this.fullscreen?"Close":"Fullscreen"}</button>`:o}
        </div>
      </div>

      <div
        class="viewer-stage"
        @pointerdown=${a=>{this.disabled||(this.panStart={x:a.clientX,y:a.clientY,basePanX:this.viewport.panX,basePanY:this.viewport.panY})}}
        @pointermove=${a=>{!this.panStart||this.disabled||this.updateViewport({panX:this.panStart.basePanX+(a.clientX-this.panStart.x),panY:this.panStart.basePanY+(a.clientY-this.panStart.y)})}}
        @pointerup=${()=>{this.panStart=void 0}}
      >
        ${i?s`<img class="viewer-img" src=${i.src} alt=${i.alt} style=${`transform: ${r};`} />`:s`<span class="emr-muted">No image</span>`}
      </div>

      ${i?.caption?s`<p class="emr-muted">${i.caption}</p>`:o}

      ${t.length>1?s`<div class="viewer-toolbar">
            <button type="button" class="emr-btn emr-btn--outline" aria-label="Previous image" @click=${()=>this.setActiveIndex(this.activeIndex-1)}>Prev</button>
            <span class="emr-muted">${this.activeIndex+1} / ${t.length}</span>
            <button type="button" class="emr-btn emr-btn--outline" aria-label="Next image" @click=${()=>this.setActiveIndex(this.activeIndex+1)}>Next</button>
          </div>`:o}

      ${this.showThumbnails&&t.length>1?s`<div class="viewer-thumbs" role="list" aria-label="Image thumbnails">
            ${t.map((a,l)=>s`<button
                type="button"
                class="viewer-thumb-btn"
                aria-label=${a.alt||`Image ${l+1}`}
                aria-current=${l===this.activeIndex?"true":o}
                @click=${()=>this.setActiveIndex(l)}
              >${l+1}</button>`)}
          </div>`:o}
    </div>`}};m([d({type:String})],$e.prototype,"controlId",void 0);m([d({type:String})],$e.prototype,"label",void 0);m([d({type:String})],$e.prototype,"src",void 0);m([d({type:String})],$e.prototype,"alt",void 0);m([d({type:String})],$e.prototype,"caption",void 0);m([d({attribute:!1})],$e.prototype,"images",void 0);m([d({type:Number})],$e.prototype,"activeIndex",void 0);m([d({attribute:!1})],$e.prototype,"viewport",void 0);m([d({type:Boolean})],$e.prototype,"fullscreen",void 0);m([d({type:Boolean})],$e.prototype,"allowFullscreen",void 0);m([d({type:Boolean})],$e.prototype,"showThumbnails",void 0);m([d({type:Boolean})],$e.prototype,"readOnly",void 0);m([d({type:Boolean})],$e.prototype,"disabled",void 0);var je=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-image-cropper"),this.controlId="",this.label="Crop & Adjust Image",this.src="",this.alt="Image to crop",this.aspectPresets=Ms,this.transform=zr,this.outputMimeType="image/png",this.readOnly=!1,this.disabled=!1}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}emitTransform(e){if(this.locked)return;let t=e.aspectRatio!==void 0?e.aspectRatio:this.transform.aspectRatio,i={...this.transform,...e,rect:Ns(e.rect??this.transform.rect,t),rotationDeg:Ds(e.rotationDeg??this.transform.rotationDeg)};this.transform=i,this.dispatchEvent(new CustomEvent("cropChange",{detail:i,bubbles:!0,composed:!0}))}selectAspectPreset(e){let t=e.ratio,i=t?Ns({x:.1,y:.1,width:.8,height:.8/t},t):{x:.05,y:.05,width:.9,height:.9};this.emitTransform({aspectRatio:t,rect:i})}commitCrop(){if(this.locked)return;let e={transform:this.transform,croppedDataUrl:this.src||`data:${this.outputMimeType};base64,`};this.dispatchEvent(new CustomEvent("cropCommitted",{detail:e,bubbles:!0,composed:!0})),this.emitValueChange(e)}render(){let e=this.controlId||this.fallbackId,t=this.transform.rect,i=Ts({zoom:this.transform.zoom,panX:this.transform.panX,panY:this.transform.panY,rotationDeg:this.transform.rotationDeg,flipH:this.transform.flipH,flipV:this.transform.flipV});return s`<div id=${e} class="viewer-shell" role="group" aria-label=${this.label}>
      <div class="viewer-toolbar">
        <div class="emr-row" role="radiogroup" aria-label="Aspect ratio presets">
          ${this.aspectPresets.map(r=>{let a=this.transform.aspectRatio===r.ratio;return s`<button
              type="button"
              role="radio"
              data-aspect-id=${r.id}
              class=${`emr-btn ${a?"emr-btn--primary":"emr-btn--outline"}`}
              aria-checked=${String(a)}
              ?disabled=${this.locked}
              @click=${()=>this.selectAspectPreset(r)}
            >${r.label}</button>`})}
        </div>
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-ccw"
            aria-label="Rotate counterclockwise"
            ?disabled=${this.locked}
            @click=${()=>this.emitTransform({rotationDeg:Zi(this.transform.rotationDeg,!1)})}
          >↺ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="rotate-cw"
            aria-label="Rotate clockwise"
            ?disabled=${this.locked}
            @click=${()=>this.emitTransform({rotationDeg:Zi(this.transform.rotationDeg,!0)})}
          >↻ 90°</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-h"
            aria-label="Flip horizontal"
            ?disabled=${this.locked}
            @click=${()=>this.emitTransform({flipH:!this.transform.flipH})}
          >Flip H</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="flip-v"
            aria-label="Flip vertical"
            ?disabled=${this.locked}
            @click=${()=>this.emitTransform({flipV:!this.transform.flipV})}
          >Flip V</button>
        </div>
      </div>

      <div class="cropper-stage">
        ${this.src?s`<img class="viewer-img" src=${this.src} alt=${this.alt} style=${`transform: ${i};`} />`:o}
        <div
          class="crop-box"
          role="region"
          aria-label="Crop region"
          style=${`left:${t.x*100}%;top:${t.y*100}%;width:${t.width*100}%;height:${t.height*100}%;`}
        >
          <span class="crop-handle" aria-hidden="true"></span>
        </div>
      </div>

      <div class="viewer-toolbar">
        <div class="emr-row">
          <label class="emr-muted">
            Zoom
            <input
              type="range"
              min="1"
              max="4"
              step="0.1"
              aria-label="Crop zoom"
              .value=${String(this.transform.zoom)}
              ?disabled=${this.locked}
              @input=${r=>{this.emitTransform({zoom:Number(r.target.value)})}}
            />
          </label>
          <label class="emr-muted">
            Straighten
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              aria-label="Crop straighten"
              .value=${String(this.transform.rotationDeg)}
              ?disabled=${this.locked}
              @input=${r=>{this.emitTransform({rotationDeg:Number(r.target.value)})}}
            />
          </label>
        </div>
        <div class="emr-row">
          <button
            type="button"
            class="emr-btn emr-btn--ghost"
            data-action="reset-crop"
            ?disabled=${this.locked}
            @click=${()=>this.emitTransform(zr)}
          >Reset</button>
          <button
            type="button"
            class="emr-btn emr-btn--outline"
            data-action="cancel-crop"
            @click=${()=>this.dispatchEvent(new CustomEvent("cancelRequested",{bubbles:!0,composed:!0}))}
          >Cancel</button>
          <button
            type="button"
            class="emr-btn emr-btn--primary"
            data-action="apply-crop"
            ?disabled=${this.locked}
            @click=${()=>this.commitCrop()}
          >Apply crop</button>
        </div>
      </div>
    </div>`}};m([d({type:String})],je.prototype,"controlId",void 0);m([d({type:String})],je.prototype,"label",void 0);m([d({type:String})],je.prototype,"src",void 0);m([d({type:String})],je.prototype,"alt",void 0);m([d({attribute:!1})],je.prototype,"aspectPresets",void 0);m([d({attribute:!1})],je.prototype,"transform",void 0);m([d({type:String})],je.prototype,"outputMimeType",void 0);m([d({type:Boolean})],je.prototype,"readOnly",void 0);m([d({type:Boolean})],je.prototype,"disabled",void 0);var G=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-image-upload"),this.controlId="",this.label="",this.labelHidden=!1,this.items=[],this.accept="image/*",this.multiple=!0,this.allowCamera=!1,this.aspectPresets=Ms,this.buttonLabel="Choose images",this.dropHint="or drag and drop clinical images here",this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.viewingIndex=null,this.croppingItemId=null}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}emitItems(e){this.dispatchEvent(new CustomEvent("itemsChange",{detail:e,bubbles:!0,composed:!0})),this.emitValueChange(e)}handleNativeFiles(e){if(this.locked||!e||e.length===0)return;let t=Array.from(e),i=t.map(c=>({name:c.name,sizeBytes:c.size,mimeType:c.type,lastModified:c.lastModified}));this.dispatchEvent(new CustomEvent("filesSelected",{detail:i,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("nativeFilesSelected",{detail:t,bubbles:!0,composed:!0}));let r=t.map((c,p)=>{let h=typeof URL<"u"&&typeof URL.createObjectURL=="function"?URL.createObjectURL(c):"data:image/png;base64,";return{id:`${Date.now()}-${p}-${c.name}`,name:c.name,src:h,previewSrc:h,sizeBytes:c.size,mimeType:c.type||"image/png"}}),a=this.multiple?[...this.items,...r]:r.slice(0,1),l=this.maxFiles!==void 0?a.slice(0,this.maxFiles):a;this.emitItems(l)}removeItem(e){this.locked||(this.dispatchEvent(new CustomEvent("removeRequested",{detail:e,bubbles:!0,composed:!0})),this.emitItems(this.items.filter(t=>t.id!==e)))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.croppingItemId?this.items.find(a=>a.id===this.croppingItemId):void 0,r=s`<div class="emr-field">
      <div class="upload-dropzone">
        <input
          id=${e}
          type="file"
          class="sr-only"
          accept=${this.accept}
          ?multiple=${this.multiple}
          ?disabled=${this.locked}
          @change=${a=>{let l=a.target;this.handleNativeFiles(l.files),l.value=""}}
        />
        <button
          type="button"
          class="emr-btn emr-btn--outline"
          ?disabled=${this.locked}
          @click=${()=>this.shadowRoot?.querySelector('input[type="file"]')?.click()}
        >
          ${R("upload",16)}
          <span>${this.buttonLabel}</span>
        </button>
        ${this.allowCamera?s`<button
              type="button"
              class="emr-btn emr-btn--secondary"
              data-action="camera"
              ?disabled=${this.locked}
              @click=${()=>this.dispatchEvent(new CustomEvent("captureRequested",{detail:"camera",bubbles:!0,composed:!0}))}
            >Capture photo</button>`:o}
        ${this.dropHint?s`<span class="emr-muted">${this.dropHint}</span>`:o}
      </div>

      ${this.items.length>0?s`<div class="upload-grid" role="list" aria-label="Uploaded images">
            ${this.items.map((a,l)=>s`<div class="upload-card" role="listitem" data-image-id=${a.id}>
                <img class="upload-thumb" src=${a.previewSrc??a.src} alt=${a.alt||a.caption||a.name} />
                <strong>${a.name}</strong>
                <input
                  type="text"
                  class="emr-control"
                  data-caption-id=${a.id}
                  aria-label=${`Caption for ${a.name}`}
                  placeholder="Caption…"
                  .value=${I(a.caption??"")}
                  ?readonly=${this.readOnly}
                  ?disabled=${this.disabled}
                  @change=${c=>{if(this.locked)return;let p=c.target.value;this.dispatchEvent(new CustomEvent("captionChange",{detail:{id:a.id,caption:p},bubbles:!0,composed:!0})),this.emitItems(this.items.map(h=>h.id===a.id?{...h,caption:p}:h))}}
                />
                <div class="emr-row">
                  <button
                    type="button"
                    class="emr-btn emr-btn--ghost"
                    data-action="view"
                    aria-label=${`View ${a.name}`}
                    @click=${()=>{this.viewingIndex=l}}
                  >View</button>
                  ${this.locked?o:s`<button
                          type="button"
                          class="emr-btn emr-btn--outline"
                          data-action="crop"
                          aria-label=${`Crop ${a.name}`}
                          @click=${()=>{this.croppingItemId=a.id}}
                        >Crop / Rotate</button>
                        <button
                          type="button"
                          class="emr-btn emr-btn--danger"
                          data-action="remove"
                          aria-label=${`Remove ${a.name}`}
                          @click=${()=>this.removeItem(a.id)}
                        >Remove</button>`}
                </div>
              </div>`)}
          </div>`:o}

      ${this.viewingIndex!==null?s`<emr-image-viewer
            fullscreen
            .images=${this.items.map(a=>({id:a.id,src:a.previewSrc??a.src,alt:a.alt||a.name,caption:a.caption}))}
            .activeIndex=${this.viewingIndex}
            @fullscreenChange=${a=>{a.detail||(this.viewingIndex=null)}}
            @closeRequested=${()=>{this.viewingIndex=null}}
          ></emr-image-viewer>`:o}

      ${i?s`<emr-image-cropper
            .src=${i.src}
            .alt=${i.alt||i.name}
            .aspectPresets=${this.aspectPresets}
            .transform=${i.cropTransform??zr}
            @cropCommitted=${a=>{a.stopPropagation();let l=a.detail;this.dispatchEvent(new CustomEvent("imageCropped",{detail:{id:i.id,result:l},bubbles:!0,composed:!0}));let c=this.items.map(p=>p.id===i.id?{...p,previewSrc:l.croppedDataUrl??p.previewSrc??p.src,cropTransform:l.transform}:p);this.croppingItemId=null,this.emitItems(c)}}
            @cancelRequested=${()=>{this.croppingItemId=null}}
          ></emr-image-cropper>`:o}
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],G.prototype,"controlId",void 0);m([d({type:String})],G.prototype,"label",void 0);m([d({type:Boolean})],G.prototype,"labelHidden",void 0);m([d({attribute:!1})],G.prototype,"items",void 0);m([d({type:String})],G.prototype,"accept",void 0);m([d({type:Boolean})],G.prototype,"multiple",void 0);m([d({type:Number})],G.prototype,"maxFiles",void 0);m([d({type:Number})],G.prototype,"maxSizeBytes",void 0);m([d({type:Boolean})],G.prototype,"allowCamera",void 0);m([d({attribute:!1})],G.prototype,"aspectPresets",void 0);m([d({type:String})],G.prototype,"buttonLabel",void 0);m([d({type:String})],G.prototype,"dropHint",void 0);m([d({type:Boolean})],G.prototype,"required",void 0);m([d({type:Boolean})],G.prototype,"readOnly",void 0);m([d({type:Boolean})],G.prototype,"disabled",void 0);m([d({type:String})],G.prototype,"hint",void 0);m([d({type:String})],G.prototype,"error",void 0);m([T()],G.prototype,"viewingIndex",void 0);m([T()],G.prototype,"croppingItemId",void 0);var X=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-date-range"),this.todayParts=er(),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.min="",this.max="",this.presets=[],this.placeholder="YYYY-MM-DD \u2013 YYYY-MM-DD",this.clearable=!0,this.open=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.viewYear=this.todayParts.year,this.viewMonth=this.todayParts.month}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}get rangeValue(){return this.value??{start:null,end:null}}selectDay(e){if(this.locked)return;let t=Jn(this.rangeValue,e);this.emitValueChange(t)}clearRange(){this.locked||(this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange({start:null,end:null}))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.rangeValue,r=!!(i.start||i.end),a=i.start||i.end?`${i.start??"\u2026"} \u2013 ${i.end??"\u2026"}`:this.placeholder,l=Yr(this.viewYear,this.viewMonth,i.start,this.todayParts.isoDay),c=s`<div class="popover-anchor">
      <div class="trigger-bar">
        <input
          id=${e}
          type="text"
          class="emr-control"
          aria-label=${this.label?`${this.label} start date`:"Start date"}
          placeholder="YYYY-MM-DD"
          .value=${I(i.start??"")}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          @change=${p=>{if(this.locked)return;let h=p.target.value.trim()||null;this.emitValueChange({start:h,end:i.end})}}
        />
        <span class="emr-muted" aria-hidden="true">–</span>
        <input
          type="text"
          class="emr-control"
          aria-label=${this.label?`${this.label} end date`:"End date"}
          placeholder="YYYY-MM-DD"
          .value=${I(i.end??"")}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          @change=${p=>{if(this.locked)return;let h=p.target.value.trim()||null;this.emitValueChange({start:i.start,end:h})}}
        />
        <button
          type="button"
          class="emr-btn emr-btn--outline"
          data-calendar-toggle="true"
          aria-label=${`Toggle calendar (${a})`}
          aria-expanded=${String(this.open&&!this.locked)}
          ?disabled=${this.disabled}
          @click=${()=>{this.locked||(this.open=!this.open)}}
        >${R("calendar",16)}</button>
        ${this.clearable&&r&&!this.locked?s`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label||"date range"}`}
              @click=${()=>this.clearRange()}
            >${R("close",14)}</button>`:o}
      </div>

      ${this.open&&!this.locked?s`<div class="dropdown-panel" role="dialog" aria-label=${`${this.label||"Date range"} calendar`}>
            ${this.presets.length>0?s`<div class="emr-row" style="margin-bottom:8px;">
                  ${this.presets.map(p=>s`<button
                      type="button"
                      class="emr-btn emr-btn--ghost"
                      data-preset-id=${p.id}
                      @click=${()=>{this.emitValueChange(p.range),this.open=!1}}
                    >${p.label}</button>`)}
                </div>`:o}
            <div class="emr-header" style="margin-bottom:6px;">
              <button
                type="button"
                class="emr-btn emr-btn--ghost"
                aria-label="Previous month"
                @click=${()=>{let p=Gt(this.viewYear,this.viewMonth,-1);this.viewYear=p.year,this.viewMonth=p.month}}
              >${R("chevron-left",16)}</button>
              <strong>${si[this.viewMonth-1]} ${this.viewYear}</strong>
              <button
                type="button"
                class="emr-btn emr-btn--ghost"
                aria-label="Next month"
                @click=${()=>{let p=Gt(this.viewYear,this.viewMonth,1);this.viewYear=p.year,this.viewMonth=p.month}}
              >${R("chevron-right",16)}</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
              ${Ur.map(p=>s`<span class="emr-muted" style="text-align:center;">${p}</span>`)}
              ${l.map(p=>{let h=el(p.iso,i),f=tl(p.iso,i),g=!!this.min&&p.iso<this.min||!!this.max&&p.iso>this.max,v=`emr-btn emr-btn--ghost${h?" cal-day--in-range":""}${f?" cal-day--edge":""}`;return s`<button
                  type="button"
                  data-iso=${p.iso}
                  class=${v}
                  aria-pressed=${String(!!f)}
                  ?disabled=${g}
                  @click=${()=>this.selectDay(p.iso)}
                >${p.day}</button>`})}
            </div>
          </div>`:o}
    </div>`;return this.labelHidden?c:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${c}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],X.prototype,"controlId",void 0);m([d({type:String})],X.prototype,"label",void 0);m([d({type:Boolean})],X.prototype,"labelHidden",void 0);m([d({attribute:!1})],X.prototype,"value",void 0);m([d({type:String})],X.prototype,"min",void 0);m([d({type:String})],X.prototype,"max",void 0);m([d({attribute:!1})],X.prototype,"presets",void 0);m([d({type:String})],X.prototype,"placeholder",void 0);m([d({type:Boolean})],X.prototype,"clearable",void 0);m([d({type:Boolean})],X.prototype,"open",void 0);m([d({type:Boolean})],X.prototype,"required",void 0);m([d({type:Boolean})],X.prototype,"readOnly",void 0);m([d({type:Boolean})],X.prototype,"disabled",void 0);m([d({type:String})],X.prototype,"hint",void 0);m([d({type:String})],X.prototype,"error",void 0);m([T()],X.prototype,"viewYear",void 0);m([T()],X.prototype,"viewMonth",void 0);var ne=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-combobox"),this.controlId="",this.label="",this.labelHidden=!1,this.options=[],this.value=null,this.placeholder="Select or type\u2026",this.allowCustomValue=!0,this.clearable=!0,this.open=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.query=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}pickOption(e,t=!1){this.locked||(this.open=!1,this.query="",t&&this.dispatchEvent(new CustomEvent("customValueCommitted",{detail:e,bubbles:!0,composed:!0})),this.emitValueChange(e))}clearValue(){this.locked||(this.query="",this.open=!1,this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}render(){let e=this.controlId||this.fallbackId,t=`${e}-listbox`,i=`${e}-message`,r=this.options.find(g=>g.value===this.value),a=this.open?this.query:r?.label??this.value??"",l=Hr(this.options,this.query),c=Xi(l),p=this.query.trim(),h=this.allowCustomValue&&p.length>0&&!l.some(g=>g.label.toLowerCase()===p.toLowerCase()||g.value===p),f=s`<div class="popover-anchor">
      <div class="trigger-bar">
        <input
          id=${e}
          type="text"
          role="combobox"
          class="emr-control"
          autocomplete="off"
          aria-autocomplete="list"
          aria-expanded=${String(this.open&&!this.locked)}
          aria-controls=${this.open&&!this.locked?t:o}
          aria-invalid=${this.error?"true":o}
          aria-describedby=${!this.labelHidden&&(this.error||this.hint)?i:o}
          placeholder=${this.placeholder}
          .value=${I(a)}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @focus=${()=>{this.locked||(this.query=r?.label??this.value??"",this.open=!0)}}
          @input=${g=>{if(this.locked){g.target.value=a;return}this.query=g.target.value,this.open=!0}}
          @keydown=${g=>{g.key==="Enter"&&!this.locked?(g.preventDefault(),l.length>0&&!l[0].disabled&&(!this.allowCustomValue||l[0].label.toLowerCase()===p.toLowerCase())?this.pickOption(l[0].value,!1):this.allowCustomValue&&p?this.pickOption(p,!0):l.length>0&&!l[0].disabled&&this.pickOption(l[0].value,!1)):g.key==="Escape"&&this.open&&(g.preventDefault(),this.open=!1)}}
        />
        ${this.clearable&&this.value!==null&&this.value!==""&&!this.locked?s`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label||"value"}`}
              @click=${()=>this.clearValue()}
            >${R("close",14)}</button>`:o}
      </div>
      ${this.open&&!this.locked?s`<div id=${t} role="listbox" class="dropdown-panel" aria-label=${this.label||"Options"}>
            ${c.map(g=>s`
              ${g.label?s`<div class="emr-muted" style="padding:4px 8px;font-weight:var(--emr-weight-bold);">${g.label}</div>`:o}
              ${g.options.map(v=>s`<button
                type="button"
                role="option"
                class="menu-item"
                aria-selected=${String(this.value===v.value)}
                ?disabled=${v.disabled}
                @click=${()=>{v.disabled||this.pickOption(v.value,!1)}}
              >
                <span>${v.label}</span>
                ${v.description?s`<span class="row-desc">${v.description}</span>`:o}
              </button>`)}
            `)}
            ${h?s`<button
                  type="button"
                  role="option"
                  data-custom-option="true"
                  class="menu-item"
                  aria-selected="false"
                  @click=${()=>this.pickOption(p,!0)}
                >Use "${p}"</button>`:o}
          </div>`:o}
    </div>`;return this.labelHidden?f:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${f}
      ${this.error?s`<span id=${i} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${i} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],ne.prototype,"controlId",void 0);m([d({type:String})],ne.prototype,"label",void 0);m([d({type:Boolean})],ne.prototype,"labelHidden",void 0);m([d({attribute:!1})],ne.prototype,"options",void 0);m([d({type:String})],ne.prototype,"value",void 0);m([d({type:String})],ne.prototype,"placeholder",void 0);m([d({type:Boolean})],ne.prototype,"allowCustomValue",void 0);m([d({type:Boolean})],ne.prototype,"clearable",void 0);m([d({type:Boolean})],ne.prototype,"open",void 0);m([d({type:Boolean})],ne.prototype,"required",void 0);m([d({type:Boolean})],ne.prototype,"readOnly",void 0);m([d({type:Boolean})],ne.prototype,"disabled",void 0);m([d({type:String})],ne.prototype,"hint",void 0);m([d({type:String})],ne.prototype,"error",void 0);m([T()],ne.prototype,"query",void 0);var J=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-tag-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=[],this.suggestions=[],this.placeholder="Add tag\u2026",this.delimiters=[",",";"],this.allowDuplicates=!1,this.clearable=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.draft=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}commitDraft(e){if(this.locked)return;let t=il(e,this.delimiters);if(!t.length)return;let i=Array.isArray(this.value)?this.value:[],r=rl(i,t,{allowDuplicates:this.allowDuplicates,maxTags:this.maxTags});this.draft="";for(let a of t)r.includes(a)&&this.dispatchEvent(new CustomEvent("tagAdded",{detail:a,bubbles:!0,composed:!0}));this.emitValueChange(r)}removeTagAt(e){if(this.locked)return;let t=Array.isArray(this.value)?this.value:[],i=t[e],r=t.filter((a,l)=>l!==e);i!==void 0&&this.dispatchEvent(new CustomEvent("tagRemoved",{detail:i,bubbles:!0,composed:!0})),this.emitValueChange(r)}clearAll(){this.locked||(this.draft="",this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange([]))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=Array.isArray(this.value)?this.value:[],r=s`<div class="tag-shell">
      ${i.map((a,l)=>s`<span class="emr-chip" role="listitem">
          <span>${a}</span>
          ${this.locked?o:s`<button
                type="button"
                class="emr-btn emr-btn--ghost"
                data-remove-tag=${a}
                aria-label=${`Remove ${a}`}
                @click=${()=>this.removeTagAt(l)}
              >${R("close",12)}</button>`}
        </span>`)}
      <input
        id=${e}
        type="text"
        class="tag-bare-input"
        placeholder=${this.placeholder}
        .value=${I(this.draft)}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        aria-label=${this.labelHidden?this.label||"Add tag":o}
        aria-invalid=${this.error?"true":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
        @input=${a=>{if(this.locked){a.target.value="";return}let l=a.target.value;this.delimiters.some(c=>l.includes(c))?(this.commitDraft(l),a.target.value=""):this.draft=l}}
        @keydown=${a=>{this.locked||(a.key==="Enter"||this.delimiters.includes(a.key)?this.draft.trim()&&(a.preventDefault(),this.commitDraft(this.draft)):a.key==="Backspace"&&!this.draft&&i.length>0&&(a.preventDefault(),this.removeTagAt(i.length-1)))}}
      />
      ${this.clearable&&i.length>0&&!this.locked?s`<button
            type="button"
            class="clear-btn"
            data-clear-btn="true"
            aria-label=${`Clear ${this.label||"tags"}`}
            @click=${()=>this.clearAll()}
          >${R("close",14)}</button>`:o}
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],J.prototype,"controlId",void 0);m([d({type:String})],J.prototype,"label",void 0);m([d({type:Boolean})],J.prototype,"labelHidden",void 0);m([d({attribute:!1})],J.prototype,"value",void 0);m([d({attribute:!1})],J.prototype,"suggestions",void 0);m([d({type:String})],J.prototype,"placeholder",void 0);m([d({attribute:!1})],J.prototype,"delimiters",void 0);m([d({type:Boolean})],J.prototype,"allowDuplicates",void 0);m([d({type:Number})],J.prototype,"maxTags",void 0);m([d({type:Boolean})],J.prototype,"clearable",void 0);m([d({type:Boolean})],J.prototype,"required",void 0);m([d({type:Boolean})],J.prototype,"readOnly",void 0);m([d({type:Boolean})],J.prototype,"disabled",void 0);m([d({type:String})],J.prototype,"hint",void 0);m([d({type:String})],J.prototype,"error",void 0);m([T()],J.prototype,"draft",void 0);var ee=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-slider"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.min=0,this.max=100,this.step=1,this.unit="",this.marks=[],this.showValue=!0,this.clearable=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}clearSlider(){this.locked||(this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.value??this.min,r=s`<div class="slider-wrap">
      <div class="trigger-bar">
        <input
          id=${e}
          type="range"
          role="slider"
          class="slider-native"
          min=${String(this.min)}
          max=${String(this.max)}
          step=${String(this.step)}
          .value=${I(String(i))}
          aria-label=${this.labelHidden?this.label||"Slider":o}
          aria-valuemin=${String(this.min)}
          aria-valuemax=${String(this.max)}
          aria-valuenow=${String(i)}
          aria-readonly=${this.readOnly?"true":o}
          ?disabled=${this.disabled}
          @input=${a=>{if(this.locked){a.target.value=String(i);return}let l=Number(a.target.value),c=Ut(l,this.min,this.max,this.step);this.emitValueChange(c)}}
        />
        ${this.showValue?s`<span class="emr-badge">${this.value===null?"\u2014":`${this.value}${this.unit?` ${this.unit}`:""}`}</span>`:o}
        ${this.clearable&&this.value!==null&&!this.locked?s`<button
              type="button"
              class="clear-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label||"slider"}`}
              @click=${()=>this.clearSlider()}
            >${R("close",14)}</button>`:o}
      </div>
      ${this.marks.length>0?s`<div class="slider-marks" aria-hidden="true">
            ${this.marks.map(a=>s`<span>${a.label??a.value}</span>`)}
          </div>`:o}
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],ee.prototype,"controlId",void 0);m([d({type:String})],ee.prototype,"label",void 0);m([d({type:Boolean})],ee.prototype,"labelHidden",void 0);m([d({type:Number})],ee.prototype,"value",void 0);m([d({type:Number})],ee.prototype,"min",void 0);m([d({type:Number})],ee.prototype,"max",void 0);m([d({type:Number})],ee.prototype,"step",void 0);m([d({type:String})],ee.prototype,"unit",void 0);m([d({attribute:!1})],ee.prototype,"marks",void 0);m([d({type:Boolean})],ee.prototype,"showValue",void 0);m([d({type:Boolean})],ee.prototype,"clearable",void 0);m([d({type:Boolean})],ee.prototype,"required",void 0);m([d({type:Boolean})],ee.prototype,"readOnly",void 0);m([d({type:Boolean})],ee.prototype,"disabled",void 0);m([d({type:String})],ee.prototype,"hint",void 0);m([d({type:String})],ee.prototype,"error",void 0);var le=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-range-slider"),this.controlId="",this.label="",this.labelHidden=!1,this.value=[0,100],this.min=0,this.max=100,this.step=1,this.minDistance=0,this.unit="",this.marks=[],this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}updateThumb(e,t){if(this.locked)return;let[i,r]=this.value??[this.min,this.max],a=e==="low"?Bs(t,r,this.min,this.max,this.step,this.minDistance,"low"):Bs(i,t,this.min,this.max,this.step,this.minDistance,"high");this.emitValueChange(a)}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,[i,r]=this.value??[this.min,this.max],a=s`<div class="slider-wrap" role="group" aria-label=${this.label||"Range slider"}>
      <div class="range-pair-row">
        <input
          id=${`${e}-low`}
          type="range"
          role="slider"
          data-thumb="low"
          class="slider-native"
          min=${String(this.min)}
          max=${String(this.max)}
          step=${String(this.step)}
          .value=${I(String(i))}
          aria-label=${`${this.label||"Range"} minimum`}
          aria-valuemin=${String(this.min)}
          aria-valuemax=${String(r)}
          aria-valuenow=${String(i)}
          ?disabled=${this.disabled}
          @input=${l=>{if(this.locked){l.target.value=String(i);return}this.updateThumb("low",Number(l.target.value))}}
        />
        <input
          id=${`${e}-high`}
          type="range"
          role="slider"
          data-thumb="high"
          class="slider-native"
          min=${String(this.min)}
          max=${String(this.max)}
          step=${String(this.step)}
          .value=${I(String(r))}
          aria-label=${`${this.label||"Range"} maximum`}
          aria-valuemin=${String(i)}
          aria-valuemax=${String(this.max)}
          aria-valuenow=${String(r)}
          ?disabled=${this.disabled}
          @input=${l=>{if(this.locked){l.target.value=String(r);return}this.updateThumb("high",Number(l.target.value))}}
        />
      </div>
      <span class="emr-badge">${i}${this.unit?` ${this.unit}`:""} – ${r}${this.unit?` ${this.unit}`:""}</span>
      ${this.marks.length>0?s`<div class="slider-marks" aria-hidden="true">
            ${this.marks.map(l=>s`<span>${l.label??l.value}</span>`)}
          </div>`:o}
    </div>`;return this.labelHidden?a:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:o}
      ${a}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],le.prototype,"controlId",void 0);m([d({type:String})],le.prototype,"label",void 0);m([d({type:Boolean})],le.prototype,"labelHidden",void 0);m([d({attribute:!1})],le.prototype,"value",void 0);m([d({type:Number})],le.prototype,"min",void 0);m([d({type:Number})],le.prototype,"max",void 0);m([d({type:Number})],le.prototype,"step",void 0);m([d({type:Number})],le.prototype,"minDistance",void 0);m([d({type:String})],le.prototype,"unit",void 0);m([d({attribute:!1})],le.prototype,"marks",void 0);m([d({type:Boolean})],le.prototype,"required",void 0);m([d({type:Boolean})],le.prototype,"readOnly",void 0);m([d({type:Boolean})],le.prototype,"disabled",void 0);m([d({type:String})],le.prototype,"hint",void 0);m([d({type:String})],le.prototype,"error",void 0);var xe=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-masked-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.mask="",this.placeholder="",this.emitUnmasked=!1,this.clearable=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,r=Fr(this.value??"",this.mask).masked,a=s`<div class="trigger-bar">
      <input
        id=${e}
        type="text"
        class="emr-control"
        placeholder=${this.placeholder||this.mask}
        .value=${I(r)}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-label=${this.labelHidden&&this.label?this.label:o}
        aria-invalid=${this.error?"true":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
        @blur=${l=>{l.target.value=Fr(this.value??"",this.mask).masked,this.dispatchEvent(new CustomEvent("blurred",{bubbles:!0,composed:!0}))}}
        @input=${l=>{let c=l.target;if(this.locked){c.value=r;return}let p=Fr(c.value,this.mask);c.value=p.masked;let h=this.emitUnmasked?p.unmasked:p.masked;this.emitValueChange(h===""?null:h),p.complete&&this.dispatchEvent(new CustomEvent("maskComplete",{detail:p,bubbles:!0,composed:!0}))}}
      />
      ${this.clearable&&r.length>0&&!this.locked?s`<button
            type="button"
            class="clear-btn"
            data-clear-btn="true"
            aria-label=${`Clear ${this.label||"input"}`}
            @click=${()=>{this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null)}}
          >${R("close",14)}</button>`:o}
    </div>`;return this.labelHidden?a:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${a}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],xe.prototype,"controlId",void 0);m([d({type:String})],xe.prototype,"label",void 0);m([d({type:Boolean})],xe.prototype,"labelHidden",void 0);m([d({type:String})],xe.prototype,"value",void 0);m([d({type:String})],xe.prototype,"mask",void 0);m([d({type:String})],xe.prototype,"placeholder",void 0);m([d({type:Boolean})],xe.prototype,"emitUnmasked",void 0);m([d({type:Boolean})],xe.prototype,"clearable",void 0);m([d({type:Boolean})],xe.prototype,"required",void 0);m([d({type:Boolean})],xe.prototype,"readOnly",void 0);m([d({type:Boolean})],xe.prototype,"disabled",void 0);m([d({type:String})],xe.prototype,"hint",void 0);m([d({type:String})],xe.prototype,"error",void 0);var Ce=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-otp-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value="",this.length=6,this.numericOnly=!0,this.masked=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}focusSlot(e){let t=Array.from(this.shadowRoot?.querySelectorAll("input.otp-slot")??[]);t[Math.max(0,Math.min(e,t.length-1))]?.focus()}handleEdit(e,t){if(this.locked)return;let i=al(this.value,e,t,this.length,this.numericOnly);this.emitValueChange(i.value),i.completed&&this.dispatchEvent(new CustomEvent("completed",{detail:i.value,bubbles:!0,composed:!0})),this.updateComplete.then(()=>this.focusSlot(i.nextFocusIndex))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=_s(this.value,this.length),r=s`<div id=${e} class="otp-row" role="group" aria-label=${this.label||"Verification code"}>
      ${i.map((a,l)=>s`<input
          type=${this.masked?"password":"text"}
          inputmode=${this.numericOnly?"numeric":"text"}
          maxlength="1"
          class="otp-slot"
          data-slot-index=${String(l)}
          aria-label=${`${this.label||"Digit"} ${l+1} of ${this.length}`}
          .value=${I(a)}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          @input=${c=>{let p=c.target;if(this.locked){p.value=a;return}this.handleEdit(l,p.value)}}
          @paste=${c=>{if(this.locked)return;let p=c.clipboardData?.getData("text")??"";p&&(c.preventDefault(),this.handleEdit(l,p))}}
          @keydown=${c=>{c.key==="ArrowLeft"?(c.preventDefault(),this.focusSlot(l-1)):c.key==="ArrowRight"?(c.preventDefault(),this.focusSlot(l+1)):c.key==="Backspace"&&!a&&l>0&&!this.locked&&(c.preventDefault(),this.handleEdit(l-1,""),this.focusSlot(l-1))}}
        />`)}
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],Ce.prototype,"controlId",void 0);m([d({type:String})],Ce.prototype,"label",void 0);m([d({type:Boolean})],Ce.prototype,"labelHidden",void 0);m([d({type:String})],Ce.prototype,"value",void 0);m([d({type:Number})],Ce.prototype,"length",void 0);m([d({type:Boolean})],Ce.prototype,"numericOnly",void 0);m([d({type:Boolean})],Ce.prototype,"masked",void 0);m([d({type:Boolean})],Ce.prototype,"required",void 0);m([d({type:Boolean})],Ce.prototype,"readOnly",void 0);m([d({type:Boolean})],Ce.prototype,"disabled",void 0);m([d({type:String})],Ce.prototype,"hint",void 0);m([d({type:String})],Ce.prototype,"error",void 0);var Ue=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-menu"),this.controlId="",this.triggerLabel="Actions",this.triggerIcon="",this.triggerVariant="outline",this.items=[],this.open=!1,this.align="start",this.disabled=!1}static{this.styles=[w,ie]}setOpen(e){this.disabled&&e||(this.open=e,this.dispatchEvent(new CustomEvent("openChange",{detail:e,bubbles:!0,composed:!0})))}focusItemAt(e){let t=Array.from(this.shadowRoot?.querySelectorAll('button[role="menuitem"]:not(:disabled)')??[]);if(!t.length)return;let i=Math.max(0,Math.min(e,t.length-1));t[i]?.focus()}render(){let e=this.controlId||this.fallbackId,t=`${e}-menu`;return s`<div class="menu-root">
      <button
        id=${e}
        type="button"
        class=${`emr-btn emr-btn--${this.triggerVariant}`}
        aria-haspopup="menu"
        aria-expanded=${String(this.open&&!this.disabled)}
        aria-controls=${this.open?t:o}
        ?disabled=${this.disabled}
        @click=${()=>this.setOpen(!this.open)}
        @keydown=${i=>{i.key==="ArrowDown"&&!this.open?(i.preventDefault(),this.setOpen(!0),this.updateComplete.then(()=>this.focusItemAt(0))):i.key==="Escape"&&this.open&&(i.preventDefault(),this.setOpen(!1))}}
      >
        ${this.triggerIcon?R(this.triggerIcon,16):o}
        <span>${this.triggerLabel}</span>
        ${R(this.open?"chevron-up":"chevron-down",14)}
      </button>

      ${this.open&&!this.disabled?s`<div
            id=${t}
            role="menu"
            class="menu-list"
            aria-label=${this.triggerLabel}
            @keydown=${i=>{i.key==="Escape"&&(i.preventDefault(),this.setOpen(!1))}}
          >
            ${this.items.map((i,r)=>s`
                ${i.dividerBefore?s`<div class="menu-divider" role="separator"></div>`:o}
                <button
                  type="button"
                  role="menuitem"
                  data-item-id=${i.id}
                  class=${`menu-item${i.tone==="danger"?" menu-item--danger":""}`}
                  ?disabled=${i.disabled}
                  @keydown=${a=>{a.key==="ArrowDown"?(a.preventDefault(),this.focusItemAt(r+1)):a.key==="ArrowUp"?(a.preventDefault(),this.focusItemAt(r-1)):a.key==="Home"?(a.preventDefault(),this.focusItemAt(0)):a.key==="End"&&(a.preventDefault(),this.focusItemAt(this.items.length-1))}}
                  @click=${()=>{i.disabled||(this.setOpen(!1),this.dispatchEvent(new CustomEvent("itemSelected",{detail:i.id,bubbles:!0,composed:!0})),this.emitValueChange(i.id))}}
                >
                  <span class="row-copy">
                    <span>${i.label}</span>
                    ${i.description?s`<span class="row-desc">${i.description}</span>`:o}
                  </span>
                  ${i.shortcut?s`<kbd class="emr-muted">${i.shortcut}</kbd>`:o}
                </button>
              `)}
          </div>`:o}
    </div>`}};m([d({type:String})],Ue.prototype,"controlId",void 0);m([d({type:String})],Ue.prototype,"triggerLabel",void 0);m([d({type:String})],Ue.prototype,"triggerIcon",void 0);m([d({type:String})],Ue.prototype,"triggerVariant",void 0);m([d({attribute:!1})],Ue.prototype,"items",void 0);m([d({type:Boolean})],Ue.prototype,"open",void 0);m([d({type:String})],Ue.prototype,"align",void 0);m([d({type:Boolean})],Ue.prototype,"disabled",void 0);var Ge=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-split-button"),this.controlId="",this.label="Action",this.variant="primary",this.size="md",this.items=[],this.open=!1,this.disabled=!1,this.loading=!1}static{this.styles=[w,ie]}setOpen(e){(this.disabled||this.loading)&&e||(this.open=e,this.dispatchEvent(new CustomEvent("openChange",{detail:e,bubbles:!0,composed:!0})))}render(){let e=this.controlId||this.fallbackId,t=`${e}-menu`,i=this.disabled||this.loading;return s`<div class="menu-root">
      <div class="split-group" role="group" aria-label=${this.label}>
        <button
          id=${e}
          type="button"
          data-split-primary="true"
          class=${`emr-btn emr-btn--${this.variant} split-primary`}
          ?disabled=${i}
          @click=${()=>{i||(this.dispatchEvent(new CustomEvent("primaryClicked",{bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("clicked",{bubbles:!0,composed:!0})))}}
        >${this.label}</button>
        <button
          type="button"
          data-split-trigger="true"
          class=${`emr-btn emr-btn--${this.variant} split-trigger`}
          aria-label=${`More actions for ${this.label}`}
          aria-haspopup="menu"
          aria-expanded=${String(this.open&&!i)}
          aria-controls=${this.open?t:o}
          ?disabled=${i}
          @click=${()=>this.setOpen(!this.open)}
        >${R(this.open?"chevron-up":"chevron-down",14)}</button>
      </div>

      ${this.open&&!i?s`<div id=${t} role="menu" class="menu-list" aria-label=${`${this.label} options`}>
            ${this.items.map(r=>s`
                ${r.dividerBefore?s`<div class="menu-divider" role="separator"></div>`:o}
                <button
                  type="button"
                  role="menuitem"
                  data-item-id=${r.id}
                  class=${`menu-item${r.tone==="danger"?" menu-item--danger":""}`}
                  ?disabled=${r.disabled}
                  @click=${()=>{r.disabled||(this.setOpen(!1),this.dispatchEvent(new CustomEvent("itemSelected",{detail:r.id,bubbles:!0,composed:!0})),this.emitValueChange(r.id))}}
                >
                  <span>${r.label}</span>
                  ${r.shortcut?s`<kbd class="emr-muted">${r.shortcut}</kbd>`:o}
                </button>
              `)}
          </div>`:o}
    </div>`}};m([d({type:String})],Ge.prototype,"controlId",void 0);m([d({type:String})],Ge.prototype,"label",void 0);m([d({type:String})],Ge.prototype,"variant",void 0);m([d({type:String})],Ge.prototype,"size",void 0);m([d({attribute:!1})],Ge.prototype,"items",void 0);m([d({type:Boolean})],Ge.prototype,"open",void 0);m([d({type:Boolean})],Ge.prototype,"disabled",void 0);m([d({type:Boolean})],Ge.prototype,"loading",void 0);var pt=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-accordion"),this.controlId="",this.items=[],this.expandedIds=[],this.multiple=!1,this.readOnly=!1,this.disabled=!1}static{this.styles=[w,ie]}toggleItem(e){if(this.readOnly||this.disabled)return;let t=sl(this.expandedIds,e,this.multiple);this.expandedIds=t,this.dispatchEvent(new CustomEvent("expandedIdsChange",{detail:t,bubbles:!0,composed:!0})),this.emitValueChange(t)}render(){let e=this.controlId||this.fallbackId;return s`<div id=${e} class="accordion-list">
      ${this.items.map(t=>{let i=this.expandedIds.includes(t.id),r=`${e}-hdr-${t.id}`,a=`${e}-pnl-${t.id}`;return s`<div class="accordion-item" data-accordion-id=${t.id}>
          <button
            id=${r}
            type="button"
            class="accordion-header-btn"
            aria-expanded=${String(i)}
            aria-controls=${a}
            ?disabled=${this.disabled||!!t.disabled}
            @click=${()=>{t.disabled||this.toggleItem(t.id)}}
          >
            <span class="row-copy">
              <span>${t.title}</span>
              ${t.subtitle?s`<span class="row-desc">${t.subtitle}</span>`:o}
            </span>
            <span class="emr-row">
              ${t.badge?s`<span class="emr-badge">${t.badge}</span>`:o}
              ${R(i?"chevron-up":"chevron-down",16)}
            </span>
          </button>
          ${i?s`<div id=${a} role="region" aria-labelledby=${r} class="accordion-panel">
                ${t.content?s`<div>${t.content}</div>`:o}
                <slot name=${t.id}></slot>
              </div>`:o}
        </div>`})}
    </div>`}};m([d({type:String})],pt.prototype,"controlId",void 0);m([d({attribute:!1})],pt.prototype,"items",void 0);m([d({attribute:!1})],pt.prototype,"expandedIds",void 0);m([d({type:Boolean})],pt.prototype,"multiple",void 0);m([d({type:Boolean})],pt.prototype,"readOnly",void 0);m([d({type:Boolean})],pt.prototype,"disabled",void 0);var ht=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-breadcrumbs"),this.controlId="",this.ariaLabel="Breadcrumb",this.items=[],this.separator="/",this.expandedAll=!1}static{this.styles=[w,ie]}renderCrumb(e,t){return t?s`<span class="breadcrumb-current" aria-current="page">${e.label}</span>`:s`<button
      type="button"
      class="breadcrumb-btn"
      data-breadcrumb-id=${e.id}
      ?disabled=${e.disabled}
      @click=${()=>{e.disabled||(this.dispatchEvent(new CustomEvent("itemClicked",{detail:e,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("navigated",{detail:e,bubbles:!0,composed:!0})))}}
    >${e.label}</button>`}render(){let e=this.controlId||this.fallbackId,t=ol(this.items,this.expandedAll?void 0:this.maxItems),i=t.hidden.length>0;return s`<nav id=${e} aria-label=${this.ariaLabel||"Breadcrumb"}>
      <ol class="breadcrumb-list">
        ${t.leading.map((r,a)=>s`<li class="breadcrumb-item">
            ${this.renderCrumb(r,!i&&t.trailing.length===0&&a===t.leading.length-1)}
            ${i||t.trailing.length>0||a<t.leading.length-1?s`<span class="emr-muted" aria-hidden="true">${this.separator}</span>`:o}
          </li>`)}
        ${i?s`<li class="breadcrumb-item">
              <button
                type="button"
                class="breadcrumb-btn"
                data-expand-breadcrumbs="true"
                aria-label="Show hidden breadcrumbs"
                @click=${()=>{this.expandedAll=!0}}
              >…</button>
              <span class="emr-muted" aria-hidden="true">${this.separator}</span>
            </li>`:o}
        ${t.trailing.map((r,a)=>s`<li class="breadcrumb-item">
            ${this.renderCrumb(r,a===t.trailing.length-1)}
            ${a<t.trailing.length-1?s`<span class="emr-muted" aria-hidden="true">${this.separator}</span>`:o}
          </li>`)}
      </ol>
    </nav>`}};m([d({type:String})],ht.prototype,"controlId",void 0);m([d({type:String})],ht.prototype,"ariaLabel",void 0);m([d({attribute:!1})],ht.prototype,"items",void 0);m([d({type:Number})],ht.prototype,"maxItems",void 0);m([d({type:String})],ht.prototype,"separator",void 0);m([T()],ht.prototype,"expandedAll",void 0);var Re=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-color-picker"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.swatches=nl,this.allowCustomHex=!0,this.clearable=!1,this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error=""}static{this.styles=[w,ie]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=s`<div class="emr-field">
      <div
        id=${e}
        role="radiogroup"
        class="swatch-grid"
        aria-label=${this.label||"Color swatches"}
        aria-readonly=${this.readOnly?"true":o}
      >
        ${this.swatches.map(r=>{let a=(this.value??"").toLowerCase()===r.value.toLowerCase();return s`<button
            type="button"
            role="radio"
            class="swatch-btn"
            data-swatch-value=${r.value}
            style=${`--swatch-color: ${r.value};`}
            aria-label=${r.label}
            aria-checked=${String(a)}
            ?disabled=${this.disabled}
            @click=${()=>{this.locked||this.emitValueChange(r.value)}}
          >${a?R("check",14):o}</button>`})}
      </div>
      ${this.allowCustomHex||this.clearable?s`<div class="trigger-bar">
            ${this.allowCustomHex?s`<input
                  type="text"
                  class="emr-control"
                  aria-label=${`${this.label||"Color"} hex code`}
                  .value=${I(this.value??"")}
                  ?readonly=${this.readOnly}
                  ?disabled=${this.disabled}
                  @change=${r=>{let a=r.target;if(this.locked){a.value=this.value??"";return}let l=a.value.trim();fd.test(l)?this.emitValueChange(l):a.value=this.value??""}}
                />`:o}
            ${this.clearable&&this.value&&!this.locked?s`<button
                  type="button"
                  class="clear-btn"
                  data-clear-btn="true"
                  aria-label=${`Clear ${this.label||"color"}`}
                  @click=${()=>{this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null)}}
                >${R("close",14)}</button>`:o}
          </div>`:o}
    </div>`;return this.labelHidden?i:s`<div class="emr-field" part="field">
      ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:o}
      ${i}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};m([d({type:String})],Re.prototype,"controlId",void 0);m([d({type:String})],Re.prototype,"label",void 0);m([d({type:Boolean})],Re.prototype,"labelHidden",void 0);m([d({type:String})],Re.prototype,"value",void 0);m([d({attribute:!1})],Re.prototype,"swatches",void 0);m([d({type:Boolean})],Re.prototype,"allowCustomHex",void 0);m([d({type:Boolean})],Re.prototype,"clearable",void 0);m([d({type:Boolean})],Re.prototype,"required",void 0);m([d({type:Boolean})],Re.prototype,"readOnly",void 0);m([d({type:Boolean})],Re.prototype,"disabled",void 0);m([d({type:String})],Re.prototype,"hint",void 0);m([d({type:String})],Re.prototype,"error",void 0);var ze=class extends S{constructor(){super(...arguments),this.fallbackId=te("emr-copy-button"),this.controlId="",this.value="",this.label="Copy",this.copiedLabel="Copied",this.variant="ghost",this.size="sm",this.feedbackDurationMs=2e3,this.disabled=!1,this.copied=!1}static{this.styles=[w,ie]}disconnectedCallback(){this.copyTimer&&clearTimeout(this.copyTimer),super.disconnectedCallback()}handleCopy(){if(!this.disabled){try{navigator?.clipboard?.writeText?.(this.value)}catch{}this.copied=!0,this.dispatchEvent(new CustomEvent("copied",{detail:this.value,bubbles:!0,composed:!0})),this.copyTimer&&clearTimeout(this.copyTimer),this.feedbackDurationMs>0&&(this.copyTimer=setTimeout(()=>{this.copied=!1},this.feedbackDurationMs))}}render(){let e=this.controlId||this.fallbackId,t=this.copied?this.copiedLabel:this.label;return s`<button
      id=${e}
      type="button"
      class=${`emr-btn emr-btn--${this.variant} emr-btn--${this.size}`}
      aria-label=${t}
      data-copied=${String(this.copied)}
      ?disabled=${this.disabled}
      @click=${()=>this.handleCopy()}
    >
      ${R(this.copied?"check":"copy",14)}
      <span>${t}</span>
    </button>`}};m([d({type:String})],ze.prototype,"controlId",void 0);m([d({type:String})],ze.prototype,"value",void 0);m([d({type:String})],ze.prototype,"label",void 0);m([d({type:String})],ze.prototype,"copiedLabel",void 0);m([d({type:String})],ze.prototype,"variant",void 0);m([d({type:String})],ze.prototype,"size",void 0);m([d({type:Number})],ze.prototype,"feedbackDurationMs",void 0);m([d({type:Boolean})],ze.prototype,"disabled",void 0);m([T()],ze.prototype,"copied",void 0);function ul(){y("emr-toggle-group",W),y("emr-tree-view",K),y("emr-tree-select",U),y("emr-image-viewer",$e),y("emr-image-cropper",je),y("emr-image-upload",G),y("emr-date-range-input",X),y("emr-combobox",ne),y("emr-tag-input",J),y("emr-slider",ee),y("emr-range-slider",le),y("emr-masked-input",xe),y("emr-otp-input",Ce),y("emr-menu",Ue),y("emr-split-button",Ge),y("emr-accordion",pt),y("emr-breadcrumbs",ht),y("emr-color-picker",Re),y("emr-copy-button",ze)}var u=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},yd=0,Oe=n=>`${n}-${++yd}`,H=M`
  .number-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
  }
  .stepper-wrap {
    display: inline-flex;
    align-items: center;
    width: 216px;
    max-width: 100%;
    height: var(--emr-control-height);
    min-height: 44px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .stepper-wrap--invalid {
    border-color: var(--emr-danger);
  }
  .stepper-wrap--readonly {
    background: var(--emr-surface-soft);
  }
  .stepper-btn {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    height: 100%;
    border: 0;
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }
  .stepper-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .stepper-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .stepper-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    text-align: center;
    font: inherit;
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
  }
  .date-anchor {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }
  .date-wrap {
    display: inline-flex;
    align-items: stretch;
    width: 224px;
    max-width: 100%;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
    box-sizing: border-box;
  }
  .date-wrap--open {
    border-color: var(--emr-primary);
  }
  .date-wrap--invalid {
    border-color: var(--emr-danger);
  }
  .date-wrap--readonly {
    background: var(--emr-surface-soft);
  }
  .date-text-input {
    flex: 1;
    min-width: 96px;
    border: 0;
    padding: 0 10px;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  .date-icon-box {
    width: 44px;
    min-width: 44px;
    border-left: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .date-icon-btn {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }
  .date-icon-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .date-icon-btn--open {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .date-icon-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .stepper-btn:focus-visible,
  .stepper-input:focus-visible,
  .date-icon-btn:focus-visible,
  .select-trigger:focus-visible,
  .select-option:focus-visible,
  .cal-nav-btn:focus-visible,
  .cal-title-btn:focus-visible,
  .cal-day:focus-visible,
  .cal-tile-btn:focus-visible,
  .cal-footer-btn:focus-visible,
  .option-tile:focus-visible,
  .vas-slider:focus-visible,
  .chip-remove-btn:focus-visible,
  .stage-btn:focus-visible,
  .status-cell-body--interactive:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .cal-popover {
    z-index: 9999;
    margin: 0;
    inset: auto;
    padding: 0;
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg);
    box-shadow: var(--emr-shadow);
    overflow: hidden;
    box-sizing: border-box;
    color: var(--emr-text);
  }
  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--emr-border);
  }
  .cal-nav-btn {
    width: 44px;
    min-width: 44px;
    height: 44px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }
  .cal-nav-btn:hover {
    background: var(--emr-primary-soft);
  }
  .cal-title-btn {
    flex: 1;
    min-height: 44px;
    border: 0;
    border-radius: var(--emr-radius);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-bold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    padding: 0 10px;
  }
  .cal-title-btn:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .cal-title-btn:disabled {
    cursor: default;
  }
  .cal-body {
    padding: 6px 8px;
  }
  .cal-weekdays,
  .cal-row {
    display: grid;
    grid-template-columns: repeat(7, 44px);
    justify-content: space-between;
  }
  .cal-weekdays {
    margin-bottom: 2px;
  }
  .cal-weekday {
    width: 44px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
  }
  .cal-grid {
    display: grid;
    row-gap: 2px;
  }
  .cal-day {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--emr-radius);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    box-sizing: border-box;
  }
  .cal-day:hover:not(:disabled) {
    background: var(--emr-primary-soft);
  }
  .cal-day:disabled {
    opacity: 0.32;
    cursor: not-allowed;
  }
  .cal-day--outside {
    opacity: 0.45;
  }
  .cal-day--today {
    border: 1.5px solid var(--emr-primary);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .cal-day--selected,
  .cal-day--selected:hover:not(:disabled) {
    background: var(--emr-primary);
    border: 1.5px solid var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
    opacity: 1;
  }
  .cal-tile-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 10px;
  }
  .cal-tile-btn {
    min-height: 44px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    padding: 0 6px;
  }
  .cal-tile-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
  }
  .cal-tile-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .cal-tile-btn--current {
    border-color: var(--emr-primary);
    font-weight: var(--emr-weight-bold);
  }
  .cal-tile-btn--selected,
  .cal-tile-btn--selected:hover:not(:disabled) {
    background: var(--emr-primary);
    border-color: var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
  }
  .cal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-top: 1px solid var(--emr-border);
  }
  .cal-footer-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 14px;
    border-radius: var(--emr-radius);
    border: 1px solid var(--emr-border);
    background: transparent;
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
  }
  .cal-footer-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .cal-footer-btn--today {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .cal-footer-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .select-root {
    position: relative;
    width: 100%;
  }
  .select-trigger {
    width: 100%;
    min-height: var(--emr-control-height);
    padding: 0 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }
  .select-trigger--open {
    border-color: var(--emr-primary);
  }
  .select-trigger--invalid {
    border-color: var(--emr-danger);
  }
  .select-trigger--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .select-trigger:disabled {
    background: var(--emr-surface-soft);
    opacity: 0.6;
    cursor: default;
  }
  .select-trigger-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .select-trigger-text--placeholder {
    color: var(--emr-text-muted);
  }
  .select-chevron {
    color: var(--emr-text-muted);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }
  .select-menu {
    z-index: 9999;
    margin: 0;
    inset: auto;
    max-height: 280px;
    overflow-y: auto;
    padding: 4px;
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    box-shadow: var(--emr-shadow);
    box-sizing: border-box;
  }
  .select-option {
    width: 100%;
    min-height: var(--emr-control-height);
    padding: 0 12px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-medium);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    box-sizing: border-box;
  }
  .select-option:hover:not(:disabled) {
    background: var(--emr-surface-soft);
  }
  .select-option[aria-selected="true"] {
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .select-option--placeholder {
    color: var(--emr-text-muted);
  }
  .select-option:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .select-tick {
    width: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-primary);
    flex-shrink: 0;
  }
  .option-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, auto-fit), minmax(140px, 1fr));
    gap: 8px;
  }
  .option-tile {
    width: 100%;
    min-height: var(--emr-control-height);
    min-width: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    text-align: left;
    box-sizing: border-box;
  }
  .option-tile--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .option-tile:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .option-tile[aria-checked="true"],
  .option-tile[aria-checked="mixed"],
  .option-tile[aria-pressed="true"],
  .option-tile[aria-selected="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .option-tile[data-tone="info"][aria-checked="true"],
  .option-tile[data-tone="info"][aria-pressed="true"] {
    border-color: var(--emr-info);
    background: var(--emr-info-soft);
    color: var(--emr-info);
  }
  .option-tile[data-tone="success"][aria-checked="true"],
  .option-tile[data-tone="success"][aria-pressed="true"] {
    border-color: var(--emr-success);
    background: var(--emr-success-soft);
    color: var(--emr-success);
  }
  .option-tile[data-tone="warning"][aria-checked="true"],
  .option-tile[data-tone="warning"][aria-pressed="true"] {
    border-color: var(--emr-warning);
    background: var(--emr-warning-soft);
    color: var(--emr-warning);
  }
  .option-tile[data-tone="danger"][aria-checked="true"],
  .option-tile[data-tone="danger"][aria-pressed="true"] {
    border-color: var(--emr-danger);
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }
  .indicator {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border: 1.5px solid var(--emr-border);
    border-radius: 4px;
    background: var(--emr-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-weight: var(--emr-weight-bold);
    line-height: 1;
  }
  .indicator--radio {
    width: 16px;
    height: 16px;
    border-radius: 999px;
  }
  .option-tile[aria-checked="true"] .indicator,
  .option-tile[aria-checked="mixed"] .indicator,
  .option-tile[aria-pressed="true"] .indicator {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
  }
  .switch-track {
    width: 40px;
    height: 22px;
    border-radius: 999px;
    padding: 2px;
    background: var(--emr-border);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    box-sizing: border-box;
    transition: background-color 140ms ease;
  }
  .option-tile[aria-checked="true"] .switch-track {
    background: var(--emr-primary);
  }
  .switch-thumb {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    transform: translateX(0);
    transition: transform 140ms ease;
  }
  .option-tile[aria-checked="true"] .switch-thumb {
    transform: translateX(18px);
  }
  .option-tile--placement-start {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .option-tile--placement-between {
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .option-tile--card {
    padding: 10px 14px;
    align-items: flex-start;
  }
  .option-tile--pill {
    border-radius: 999px;
    width: auto;
  }
  .option-tile-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .option-tile-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }
  .select-bar {
    display: flex;
    align-items: stretch;
    gap: 6px;
    width: 100%;
  }
  .select-group-header {
    padding: 6px 10px 4px;
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .select-optgroup {
    display: block;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .clear-inline-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .clear-inline-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }
  .clear-inline-btn:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .toggle-state-label {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
  }
  .tabs-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--emr-border);
    padding-bottom: 6px;
  }
  .tabs-bar .option-tile {
    width: auto;
  }
  .chip-removable {
    padding-right: 0;
    min-height: 44px;
    gap: 6px;
    overflow: hidden;
  }
  .chip-remove-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: transparent;
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .chip-remove-btn:hover:not(:disabled) {
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }
  .chip-remove-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .separator-plain {
    width: 100%;
    height: 1px;
    background: var(--emr-border);
    margin: 8px 0;
  }
  .separator-labelled {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }
  .separator-line {
    flex: 1;
    height: 1px;
    background: var(--emr-border);
  }
  .separator-vertical {
    display: inline-block;
    width: 1px;
    min-height: 24px;
    align-self: stretch;
    background: var(--emr-border);
    margin: 0 8px;
  }
  .likert-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .likert-pip {
    width: auto;
    min-width: 44px;
    justify-content: center;
  }
  .scale-anchors {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
  }

  /* VAS ruler */
  .vas-frame {
    display: grid;
    gap: 8px;
  }
  .vas-frame--vertical {
    grid-template-columns: auto auto;
    align-items: stretch;
    width: fit-content;
  }
  .vas-slider {
    position: relative;
    height: 52px;
    min-height: 44px;
    padding: 0;
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    border: 1px solid var(--emr-border);
    cursor: pointer;
    touch-action: none;
    user-select: none;
  }
  .vas-slider--vertical {
    width: 64px;
    height: 240px;
  }
  .vas-slider--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .vas-slider--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .vas-slider--invalid {
    border-color: var(--emr-danger);
  }
  .vas-rule {
    position: absolute;
    left: 14px;
    right: 14px;
    top: 18px;
    height: 2px;
    background: var(--emr-border);
  }
  .vas-slider--vertical .vas-rule {
    top: 14px;
    bottom: 14px;
    left: 22px;
    right: auto;
    width: 2px;
    height: auto;
  }
  .vas-tick {
    position: absolute;
    top: 13px;
    left: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    width: 1px;
    height: 8px;
    background: var(--emr-text-muted);
    transform: translateX(-50%);
  }
  .vas-tick--major {
    top: 10px;
    width: 1.5px;
    height: 14px;
    background: var(--emr-text);
  }
  .vas-slider--vertical .vas-tick {
    left: 17px;
    top: auto;
    bottom: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    width: 8px;
    height: 1px;
    transform: translateY(50%);
  }
  .vas-slider--vertical .vas-tick--major {
    left: 14px;
    width: 14px;
    height: 1.5px;
  }
  .vas-tick-label {
    position: absolute;
    top: 28px;
    left: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    transform: translateX(-50%);
    font-size: var(--emr-text-2xs);
    color: var(--emr-text-muted);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .vas-slider--vertical .vas-tick-label {
    top: auto;
    left: 34px;
    bottom: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    transform: translateY(50%);
  }
  .vas-thumb {
    position: absolute;
    top: 19px;
    left: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid var(--emr-surface);
    background: var(--emr-primary);
    box-shadow: var(--emr-shadow);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .vas-slider--vertical .vas-thumb {
    top: auto;
    left: 23px;
    bottom: calc(14px + (100% - 28px) * var(--vas-pct, 0) / 100);
    transform: translate(-50%, 50%);
  }
  .vas-thumb--info { background: var(--emr-info); }
  .vas-thumb--success { background: var(--emr-success); }
  .vas-thumb--warning { background: var(--emr-warning); }
  .vas-thumb--danger { background: var(--emr-danger); }

  .columns-grid {
    display: grid;
    grid-template-columns: var(--emr-col-template, repeat(2, minmax(0, 1fr)));
    gap: var(--emr-col-gap, 16px);
    align-items: start;
  }
  @media (max-width: 768px) {
    .columns-grid {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }

  .fvr-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--emr-border);
    align-items: start;
  }
  .fvr-row--heading {
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    text-transform: uppercase;
  }
  @media (max-width: 768px) {
    .fvr-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .status-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
  }
  .status-cell-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    border-radius: var(--emr-radius);
  }
  .status-cell-body--interactive {
    min-height: 44px;
    min-width: 44px;
    padding: 6px 8px;
    cursor: pointer;
    justify-content: center;
  }
  .status-cell-body--interactive:hover {
    background: var(--emr-surface-soft);
  }
  .status-cell-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .stage-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .stage-list--vertical {
    flex-direction: column;
  }
  .stage-btn {
    width: 100%;
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .stage-btn--active {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-semibold);
  }
  .stage-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .stage-num {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: var(--emr-neutral-soft);
    color: var(--emr-text);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .search-select-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .search-select-bar {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .search-select-panel {
    display: grid;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    max-height: 260px;
    overflow-y: auto;
  }
  .toast-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
`;function gl(n,e,t){if(!n)return{};if(Array.isArray(n)){let r=(e+t)/2;return{minLabel:n.find(a=>a.value===e)?.label,midLabel:n.find(a=>a.value===r)?.label,maxLabel:n.find(a=>a.value===t)?.label}}let i=n;return{minLabel:i.minLabel,midLabel:i.midLabel,maxLabel:i.maxLabel}}function zs(n,e){if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(n.key))return;let t=n.currentTarget,r=Array.from(t.querySelectorAll("button")).map((c,p)=>({button:c,index:p})).filter(({button:c})=>!c.disabled),a=r.findIndex(({button:c})=>c===n.target);if(a<0||r.length===0)return;n.preventDefault();let l=n.key==="Home"?0:n.key==="End"?r.length-1:(a+(n.key==="ArrowRight"||n.key==="ArrowDown"?1:-1)+r.length)%r.length;return r[l].button.focus(),String(e[r[l].index].value)}var Je=class extends S{constructor(){super(...arguments),this.label="",this.variant="primary",this.size="md",this.block=!1,this.disabled=!1,this.loading=!1,this.type="button"}static{this.styles=[w,H]}render(){let e=["emr-btn",this.variant!=="primary"?`emr-btn--${this.variant}`:"",this.size!=="md"?`emr-btn--${this.size}`:"",this.block?"emr-btn--block":""].filter(Boolean).join(" ");return s`<button
      type=${this.type}
      part="button"
      class=${e}
      ?disabled=${this.disabled||this.loading}
      aria-busy=${this.loading?"true":"false"}
      @click=${()=>{!this.disabled&&!this.loading&&this.dispatchEvent(new CustomEvent("clicked",{bubbles:!0,composed:!0}))}}
    >
      ${this.label}<slot></slot>
    </button>`}};u([d({type:String})],Je.prototype,"label",void 0);u([d({type:String})],Je.prototype,"variant",void 0);u([d({type:String})],Je.prototype,"size",void 0);u([d({type:Boolean})],Je.prototype,"block",void 0);u([d({type:Boolean})],Je.prototype,"disabled",void 0);u([d({type:Boolean})],Je.prototype,"loading",void 0);u([d({type:String})],Je.prototype,"type",void 0);var Ne=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-text-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value="",this.placeholder="",this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=s`<input
      id=${e}
      part="control"
      class="emr-control"
      type="text"
      .value=${this.locked?I(this.value??""):this.value??""}
      placeholder=${this.placeholder}
      ?readonly=${this.readOnly}
      ?disabled=${this.disabled}
      ?required=${this.required}
      aria-label=${this.labelHidden&&this.label?this.label:o}
      aria-invalid=${this.error?"true":o}
      aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
      @blur=${r=>{r.target.value=this.value??"",this.dispatchEvent(new CustomEvent("blurred",{bubbles:!0,composed:!0}))}}
      @input=${r=>{let a=r.target.value;if(this.locked){r.target.value=this.value??"";return}this.emitValueChange(a||null)}}
    />`;return this.labelHidden?i:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${i}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],Ne.prototype,"controlId",void 0);u([d({type:String})],Ne.prototype,"label",void 0);u([d({type:Boolean})],Ne.prototype,"labelHidden",void 0);u([d({type:String})],Ne.prototype,"value",void 0);u([d({type:String})],Ne.prototype,"placeholder",void 0);u([d({type:String})],Ne.prototype,"hint",void 0);u([d({type:String})],Ne.prototype,"error",void 0);u([d({type:Boolean})],Ne.prototype,"required",void 0);u([d({type:Boolean})],Ne.prototype,"disabled",void 0);u([d({type:Boolean})],Ne.prototype,"readOnly",void 0);var ge=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-number-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.mode="decimal",this.step=1,this.unit="",this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}get locked(){return this.readOnly||this.disabled}stepBy(e){if(this.locked)return;this.draft=void 0;let t=this.value??0,i=this.mode==="integer"?Math.max(1,Math.round(this.step||1)):this.step||1,r=Math.round((t+e*i)*1e4)/1e4;this.mode==="integer"&&(r=Math.round(r)),this.min!==void 0&&r<this.min&&(r=this.min),this.max!==void 0&&r>this.max&&(r=this.max),this.emitValueChange(r)}render(){this.locked&&(this.draft=void 0),this.draft&&this.value!==this.draft.base&&this.value!==this.draft.parsed&&(this.draft=void 0);let e=this.controlId||this.fallbackId,t=`${e}-message`,i=["stepper-wrap",this.error?"stepper-wrap--invalid":"",this.readOnly?"stepper-wrap--readonly":""].filter(Boolean).join(" "),r=s`<div class="number-row">
      <div class=${i} part="stepper">
        ${this.readOnly?o:s`<button
              type="button"
              class="stepper-btn"
              aria-label="Decrease value"
              ?disabled=${this.disabled}
              @click=${()=>this.stepBy(-1)}
            >${R("minus",15)}</button>`}
        <input
          id=${e}
          part="control"
          class="stepper-input"
          type="text"
          inputmode=${this.mode==="integer"?"numeric":"decimal"}
          .value=${this.locked?I(this.value==null?"":String(this.value)):this.draft&&(this.value===this.draft.base||this.value===this.draft.parsed)?this.draft.text:this.value==null?"":String(this.value)}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${this.labelHidden&&this.label?this.label:o}
          aria-invalid=${this.error?"true":o}
          aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
          @blur=${a=>{this.draft=void 0,a.target.value=this.value==null?"":String(this.value)}}
          @input=${a=>{if(this.locked){a.target.value=this.value==null?"":String(this.value);return}let l=a.target.value,c=l.trim(),p=c===""?null:Number(c),h=p===null||Number.isFinite(p)&&(this.mode!=="integer"||!c.includes(".")&&Number.isInteger(p)),f=p===null||(this.min===void 0||p>=this.min)&&(this.max===void 0||p<=this.max);this.draft={text:l,base:this.value,parsed:h&&f?p:void 0},h&&f&&this.emitValueChange(p)}}
        />
        ${this.readOnly?o:s`<button
              type="button"
              class="stepper-btn"
              aria-label="Increase value"
              ?disabled=${this.disabled}
              @click=${()=>this.stepBy(1)}
            >${R("plus",15)}</button>`}
      </div>
      ${this.unit?s`<span class="emr-muted" aria-hidden="true">${this.unit}</span>`:o}
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],ge.prototype,"controlId",void 0);u([d({type:String})],ge.prototype,"label",void 0);u([d({type:Boolean})],ge.prototype,"labelHidden",void 0);u([d({type:Number})],ge.prototype,"value",void 0);u([d({type:String})],ge.prototype,"mode",void 0);u([d({type:Number})],ge.prototype,"min",void 0);u([d({type:Number})],ge.prototype,"max",void 0);u([d({type:Number})],ge.prototype,"step",void 0);u([d({type:String})],ge.prototype,"unit",void 0);u([d({type:String})],ge.prototype,"hint",void 0);u([d({type:String})],ge.prototype,"error",void 0);u([d({type:Boolean})],ge.prototype,"required",void 0);u([d({type:Boolean})],ge.prototype,"disabled",void 0);u([d({type:Boolean})],ge.prototype,"readOnly",void 0);var Y=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-date-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.min="",this.max="",this.precision="day",this.displayFormat="yyyy-mm-dd",this.placeholder="",this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1,this.calOpen=!1,this.subView="days",this.viewYear=new Date().getFullYear(),this.viewMonth=new Date().getMonth()+1,this.popoverStyle="",this.onOutsidePointerDown=e=>{this.calOpen&&(e.composedPath().includes(this)||this.closeCalendar())},this.onGlobalKeyDown=e=>{this.calOpen&&e.key==="Escape"&&(e.stopPropagation(),this.closeCalendar(),this.shadowRoot?.querySelector(".date-icon-btn")?.focus())},this.onViewportMove=()=>{this.calOpen&&this.syncPopoverPosition()}}static{this.styles=[w,H]}get canEdit(){return!this.readOnly&&!this.disabled}isIsoOutOfBounds(e){return!!(this.min&&e<this.min.slice(0,e.length)||this.max&&e>this.max.slice(0,e.length))}disconnectedCallback(){this.detachPopoverListeners(),super.disconnectedCallback()}attachPopoverListeners(){typeof document<"u"&&(document.addEventListener("pointerdown",this.onOutsidePointerDown,!0),document.addEventListener("keydown",this.onGlobalKeyDown,!0)),typeof window<"u"&&(window.addEventListener("scroll",this.onViewportMove,!0),window.addEventListener("resize",this.onViewportMove))}detachPopoverListeners(){typeof document<"u"&&(document.removeEventListener("pointerdown",this.onOutsidePointerDown,!0),document.removeEventListener("keydown",this.onGlobalKeyDown,!0)),typeof window<"u"&&(window.removeEventListener("scroll",this.onViewportMove,!0),window.removeEventListener("resize",this.onViewportMove))}syncPopoverPosition(){let e=this.shadowRoot?.querySelector(".date-wrap"),t=this.subView==="days"?404:300;this.popoverStyle=js(e,328,t,!1)}openCalendar(){if(!this.canEdit)return;let e=Vs(this.value),t=er();this.viewYear=e?.year??t.year,this.viewMonth=e?.month??t.month,this.subView=this.precision==="year"?"years":this.precision==="month"?"months":"days",this.calOpen=!0,this.syncPopoverPosition(),this.attachPopoverListeners(),this.updateComplete.then(()=>{let i=this.shadowRoot?.querySelector(".cal-popover");try{i?.showPopover?.()}catch{}})}closeCalendar(){this.calOpen&&(this.calOpen=!1,this.detachPopoverListeners())}toggleCalendar(){this.calOpen?this.closeCalendar():this.openCalendar()}stepHeader(e){if(this.subView==="days"){let t=Gt(this.viewYear,this.viewMonth,e);this.viewYear=t.year,this.viewMonth=t.month}else this.subView==="months"?this.viewYear=Math.max(1,this.viewYear+e):this.viewYear=Math.max(1,this.viewYear+e*12)}selectIso(e){this.canEdit&&(e!==null&&this.isIsoOutOfBounds(e)||(this.draft=void 0,this.closeCalendar(),this.emitValueChange(e)))}renderCalendarPopover(){if(!this.calOpen||!this.canEdit)return o;let e=er(),t=Vs(this.value),i=pl(this.viewYear),r=this.subView==="days"?`${si[this.viewMonth-1]} ${this.viewYear}`:this.subView==="months"?`${this.viewYear}`:`${i.startYear} \u2013 ${i.endYear}`,a=this.subView==="days"?"Previous month":this.subView==="months"?"Previous year":"Previous 12 years",l=this.subView==="days"?"Next month":this.subView==="months"?"Next year":"Next 12 years",c=b=>String(b).padStart(2,"0"),p=b=>String(b).padStart(4,"0"),h=this.subView==="days"?Yr(this.viewYear,this.viewMonth,this.value,e.isoDay):[],f=[];for(let b=0;b<h.length;b+=7)f.push(h.slice(b,b+7));let g=this.precision==="year"?e.isoYear:this.precision==="month"?e.isoMonth:e.isoDay,v=this.isIsoOutOfBounds(g);return s`<div class="cal-popover" popover="manual" part="calendar" role="dialog" aria-label="Choose date" style=${this.popoverStyle}>
      <div class="cal-header">
        <button type="button" class="cal-nav-btn" aria-label=${a} @click=${()=>this.stepHeader(-1)}>
          ${R("chevron-left",16)}
        </button>
        <button
          type="button"
          class="cal-title-btn"
          aria-label=${this.subView==="days"?`Select month or year, currently ${r}`:this.subView==="months"?`Select year, currently ${r}`:r}
          ?disabled=${this.subView==="years"&&this.precision==="year"}
          @click=${()=>{this.subView==="days"?this.subView="months":this.subView==="months"?this.subView="years":this.precision==="month"?this.subView="months":this.precision==="day"&&(this.subView="days"),this.syncPopoverPosition()}}
        >
          <span>${r}</span>
          ${this.subView==="years"&&this.precision==="year"?o:R(this.subView==="years"?"chevron-up":"chevron-down",14)}
        </button>
        <button type="button" class="cal-nav-btn" aria-label=${l} @click=${()=>this.stepHeader(1)}>
          ${R("chevron-right",16)}
        </button>
      </div>

      ${this.subView==="days"?s`<div class="cal-body" role="grid" aria-label=${r}>
            <div class="cal-weekdays" role="row">
              ${Ur.map(b=>s`<span class="cal-weekday" role="columnheader">${b}</span>`)}
            </div>
            <div class="cal-grid">
              ${f.map(b=>s`<div class="cal-row" role="row">
                  ${b.map(x=>{let C=this.isIsoOutOfBounds(x.iso),A=["cal-day",x.inMonth?"":"cal-day--outside",x.isToday?"cal-day--today":"",x.isSelected?"cal-day--selected":""].filter(Boolean).join(" ");return s`<span role="gridcell">
                      <button
                        type="button"
                        class=${A}
                        aria-label=${x.ariaLabel}
                        aria-pressed=${x.isSelected}
                        aria-current=${x.isToday?"date":o}
                        ?disabled=${C}
                        @click=${()=>this.selectIso(x.iso)}
                      >${x.day}</button>
                    </span>`})}
                </div>`)}
            </div>
          </div>`:this.subView==="months"?s`<div class="cal-tile-grid">
              ${ll.map((b,x)=>{let C=x+1,A=`${p(this.viewYear)}-${c(C)}`,q=this.isIsoOutOfBounds(A),E=this.precision==="month"?this.value===A:t?.year===this.viewYear&&t?.month===C,N=["cal-tile-btn",e.year===this.viewYear&&e.month===C?"cal-tile-btn--current":"",E?"cal-tile-btn--selected":""].filter(Boolean).join(" ");return s`<button
                  type="button"
                  class=${N}
                  aria-label=${`${si[x]} ${this.viewYear}`}
                  aria-pressed=${E}
                  ?disabled=${q}
                  @click=${()=>{this.precision==="month"?this.selectIso(A):(this.viewMonth=C,this.subView="days",this.syncPopoverPosition())}}
                >${b}</button>`})}
            </div>`:s`<div class="cal-tile-grid">
              ${i.years.map(b=>{let x=p(b),C=this.isIsoOutOfBounds(x),A=this.precision==="year"?this.value===x:t?.year===b,E=["cal-tile-btn",e.year===b?"cal-tile-btn--current":"",A?"cal-tile-btn--selected":""].filter(Boolean).join(" ");return s`<button
                  type="button"
                  class=${E}
                  aria-label=${String(b)}
                  aria-pressed=${A}
                  ?disabled=${C}
                  @click=${()=>{this.precision==="year"?this.selectIso(x):(this.viewYear=b,this.subView="months",this.syncPopoverPosition())}}
                >${b}</button>`})}
            </div>`}

      <div class="cal-footer">
        <button
          type="button"
          class="cal-footer-btn cal-footer-btn--today"
          aria-label=${this.precision==="year"?"Select current year":this.precision==="month"?"Select current month":"Select today"}
          ?disabled=${v}
          @click=${()=>this.selectIso(g)}
        >${this.precision==="year"?"This year":this.precision==="month"?"This month":"Today"}</button>
        <button type="button" class="cal-footer-btn" aria-label="Clear date" @click=${()=>this.selectIso(null)}>Clear</button>
      </div>
    </div>`}render(){this.canEdit||(this.draft=void 0,this.calOpen&&this.closeCalendar()),this.draft&&this.value!==this.draft.base&&this.value!==this.draft.parsed&&(this.draft=void 0);let e=this.controlId||this.fallbackId,t=`${e}-message`,i=Gr(this.displayFormat,this.precision),r=Hs(this.value,this.displayFormat,this.precision),a=this.canEdit&&this.draft&&(this.value===this.draft.base||this.value===this.draft.parsed)?this.draft.text:r,l=this.precision==="year"?140:this.precision==="month"?180:224,c=["date-wrap",this.calOpen?"date-wrap--open":"",this.error?"date-wrap--invalid":"",this.readOnly?"date-wrap--readonly":""].filter(Boolean).join(" "),p=s`<div class="date-anchor">
      <div class=${c} style=${`width: ${l}px;`} part="control">
        <input
          id=${e}
          class="date-text-input"
          type="text"
          inputmode="numeric"
          placeholder=${this.placeholder||i}
          .value=${this.canEdit?a:I(r)}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${this.labelHidden&&this.label?this.label:o}
          aria-invalid=${this.error?"true":o}
          aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
          @blur=${h=>{this.draft=void 0,h.target.value=Hs(this.value,this.displayFormat,this.precision)}}
          @input=${h=>{if(!this.canEdit){h.target.value=r;return}let f=dl(h.target.value,i);h.target.value=f;let g=cl(f,this.displayFormat,this.precision),v=g.status!=="valid"||!this.isIsoOutOfBounds(g.value),b=g.status==="valid"&&v?g.value:g.status==="empty"?null:void 0;this.draft={text:f,base:this.value,parsed:b},g.status==="empty"?this.emitValueChange(null):g.status==="valid"&&v&&this.emitValueChange(g.value)}}
        />
        <button
          type="button"
          class=${`date-icon-btn${this.calOpen?" date-icon-btn--open":""}`}
          aria-label="Choose date"
          aria-expanded=${this.calOpen}
          aria-haspopup="dialog"
          ?disabled=${!this.canEdit}
          @click=${()=>this.toggleCalendar()}
        >${R("calendar",16)}</button>
      </div>
      ${this.renderCalendarPopover()}
    </div>`;return this.labelHidden?p:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${p}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],Y.prototype,"controlId",void 0);u([d({type:String})],Y.prototype,"label",void 0);u([d({type:Boolean})],Y.prototype,"labelHidden",void 0);u([d({type:String})],Y.prototype,"value",void 0);u([d({type:String})],Y.prototype,"min",void 0);u([d({type:String})],Y.prototype,"max",void 0);u([d({type:String})],Y.prototype,"precision",void 0);u([d({type:String})],Y.prototype,"displayFormat",void 0);u([d({type:String})],Y.prototype,"placeholder",void 0);u([d({type:String})],Y.prototype,"hint",void 0);u([d({type:String})],Y.prototype,"error",void 0);u([d({type:Boolean})],Y.prototype,"required",void 0);u([d({type:Boolean})],Y.prototype,"disabled",void 0);u([d({type:Boolean})],Y.prototype,"readOnly",void 0);u([T()],Y.prototype,"calOpen",void 0);u([T()],Y.prototype,"subView",void 0);u([T()],Y.prototype,"viewYear",void 0);u([T()],Y.prototype,"viewMonth",void 0);u([T()],Y.prototype,"popoverStyle",void 0);var Be=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-time-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.precision="minute",this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=["date-wrap",this.error?"date-wrap--invalid":"",this.readOnly?"date-wrap--readonly":""].filter(Boolean).join(" "),r=s`<div class=${i} style="width: 174px;" part="control">
      <input
        id=${e}
        class="stepper-input"
        type="time"
        step=${this.precision==="second"?"1":"60"}
        .value=${this.locked?I(this.value??""):this.value??""}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-label=${this.labelHidden&&this.label?this.label:o}
        aria-invalid=${this.error?"true":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
        @blur=${a=>{a.target.value=this.value??""}}
        @input=${a=>{let l=a.target.value||null;if(this.locked){a.target.value=this.value??"";return}this.emitValueChange(l)}}
      />
      <span class="date-icon-box" aria-hidden="true">${R("clock",16)}</span>
    </div>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],Be.prototype,"controlId",void 0);u([d({type:String})],Be.prototype,"label",void 0);u([d({type:Boolean})],Be.prototype,"labelHidden",void 0);u([d({type:String})],Be.prototype,"value",void 0);u([d({type:String})],Be.prototype,"precision",void 0);u([d({type:String})],Be.prototype,"hint",void 0);u([d({type:String})],Be.prototype,"error",void 0);u([d({type:Boolean})],Be.prototype,"required",void 0);u([d({type:Boolean})],Be.prototype,"disabled",void 0);u([d({type:Boolean})],Be.prototype,"readOnly",void 0);var qe=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-datetime-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.precision="minute",this.wireFormat="utc",this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=Br(this.value,this.precision),r=s`<input
      id=${e}
      class="emr-control"
      style="max-width: 280px;"
      type="datetime-local"
      step=${this.precision==="second"?"1":"60"}
      .value=${this.locked?I(i):i}
      ?readonly=${this.readOnly}
      ?disabled=${this.disabled}
      ?required=${this.required}
      aria-label=${this.labelHidden&&this.label?this.label:o}
      aria-invalid=${this.error?"true":o}
      aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
      @blur=${a=>{a.target.value=Br(this.value,this.precision)}}
      @input=${a=>{let l=a.target.value;if(this.locked){a.target.value=Br(this.value,this.precision);return}if(!l){this.emitValueChange(null);return}this.emitValueChange(this.wireFormat==="local"?l:Wn(l))}}
    />`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],qe.prototype,"controlId",void 0);u([d({type:String})],qe.prototype,"label",void 0);u([d({type:Boolean})],qe.prototype,"labelHidden",void 0);u([d({type:String})],qe.prototype,"value",void 0);u([d({type:String})],qe.prototype,"precision",void 0);u([d({type:String})],qe.prototype,"wireFormat",void 0);u([d({type:String})],qe.prototype,"hint",void 0);u([d({type:String})],qe.prototype,"error",void 0);u([d({type:Boolean})],qe.prototype,"required",void 0);u([d({type:Boolean})],qe.prototype,"disabled",void 0);u([d({type:Boolean})],qe.prototype,"readOnly",void 0);var re=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-select"),this.controlId="",this.label="",this.labelHidden=!1,this.placeholder="Select\u2026",this.value=null,this.options=[],this.allowClear=!1,this.clearable=!1,this.invalid=!1,this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1,this.open=!1,this.menuStyle="",this.onOutsidePointerDown=e=>{this.open&&(e.composedPath().includes(this)||this.closeMenu())},this.onGlobalKeyDown=e=>{this.open&&e.key==="Escape"&&(e.stopPropagation(),this.closeMenu(),this.shadowRoot?.querySelector(".select-trigger")?.focus())},this.onViewportMove=()=>{this.open&&this.syncMenuPosition()},this.onMenuKeyDown=e=>{if(!["ArrowDown","ArrowUp","Home","End"].includes(e.key))return;let t=e.currentTarget,i=Array.from(t.querySelectorAll("button.select-option:not(:disabled)"));if(!i.length)return;e.preventDefault();let r=i.findIndex(l=>l===this.shadowRoot?.activeElement||l===e.target),a=e.key==="Home"?0:e.key==="End"?i.length-1:r<0?0:(r+(e.key==="ArrowDown"?1:-1)+i.length)%i.length;i[a]?.focus()}}static{this.styles=[w,H]}get canEdit(){return!this.readOnly&&!this.disabled}get isClearable(){return this.clearable||this.allowClear}disconnectedCallback(){this.detachMenuListeners(),super.disconnectedCallback()}attachMenuListeners(){typeof document<"u"&&(document.addEventListener("pointerdown",this.onOutsidePointerDown,!0),document.addEventListener("keydown",this.onGlobalKeyDown,!0)),typeof window<"u"&&(window.addEventListener("scroll",this.onViewportMove,!0),window.addEventListener("resize",this.onViewportMove))}detachMenuListeners(){typeof document<"u"&&(document.removeEventListener("pointerdown",this.onOutsidePointerDown,!0),document.removeEventListener("keydown",this.onGlobalKeyDown,!0)),typeof window<"u"&&(window.removeEventListener("scroll",this.onViewportMove,!0),window.removeEventListener("resize",this.onViewportMove))}syncMenuPosition(){let e=this.shadowRoot?.querySelector(".select-trigger"),t=this.options.length+(this.isClearable?1:0),i=Math.min(280,Math.max(56,t*44+8));this.menuStyle=js(e,200,i,!0)}openMenu(){this.canEdit&&(this.open=!0,this.syncMenuPosition(),this.attachMenuListeners(),this.updateComplete.then(()=>{let e=this.shadowRoot?.querySelector(".select-menu");try{e?.showPopover?.()}catch{}(this.shadowRoot?.querySelector('.select-option[aria-selected="true"]:not(:disabled)')??this.shadowRoot?.querySelector(".select-option:not(:disabled)"))?.focus()}))}closeMenu(){this.open&&(this.open=!1,this.detachMenuListeners())}toggleMenu(){this.canEdit&&(this.open?this.closeMenu():this.openMenu())}pickOption(e){this.canEdit&&(this.closeMenu(),e===null&&this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(e),this.shadowRoot?.querySelector(".select-trigger")?.focus())}clearSelection(){this.canEdit&&(this.closeMenu(),this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}renderOptionButton(e){let t=this.value===e.value;return s`<button
      type="button"
      role="option"
      class="select-option"
      aria-selected=${t}
      ?disabled=${e.disabled}
      @click=${()=>{e.disabled||this.pickOption(String(e.value))}}
    >
      <span class="select-tick" aria-hidden="true">${t?R("check",14):o}</span>
      <span class="option-tile-copy">
        <span>${e.label}</span>
        ${e.description?s`<span class="option-tile-desc">${e.description}</span>`:o}
      </span>
    </button>`}render(){!this.canEdit&&this.open&&this.closeMenu();let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.options.find(f=>f.value===this.value),r=i?.label??this.placeholder,a=Xi(this.options),l=a.some(f=>f.label!==""),c=this.isClearable&&this.value!==null&&this.value!==""&&this.canEdit,p=["select-trigger",this.open?"select-trigger--open":"",this.invalid||this.error?"select-trigger--invalid":"",this.readOnly?"select-trigger--readonly":""].filter(Boolean).join(" "),h=s`<div class="select-root">
      <div class="select-bar">
        <button
          id=${e}
          type="button"
          part="control"
          class=${p}
          role="combobox"
          aria-expanded=${this.open}
          aria-haspopup="listbox"
          aria-label=${this.label?`${this.label}, ${r}`:r}
          aria-readonly=${this.readOnly?"true":o}
          aria-invalid=${this.invalid||this.error?"true":o}
          aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
          ?disabled=${this.disabled}
          @click=${()=>this.toggleMenu()}
          @keydown=${f=>{this.canEdit&&(f.key==="ArrowDown"||f.key==="ArrowUp")&&!this.open&&(f.preventDefault(),this.openMenu())}}
        >
          <span class=${`select-trigger-text${i?"":" select-trigger-text--placeholder"}`}>${r}</span>
          <span class="select-chevron" aria-hidden="true">${R(this.open?"chevron-up":"chevron-down",16)}</span>
        </button>
        ${c?s`<button
              type="button"
              class="clear-inline-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label||"selection"}`}
              @click=${()=>this.clearSelection()}
            >${R("close",14)}</button>`:o}
      </div>

      ${l?s`<div class="sr-only" aria-hidden="true">
            ${a.map(f=>f.label?s`<optgroup label=${f.label}>
                    ${f.options.map(g=>s`<option value=${g.value}>${g.label}</option>`)}
                  </optgroup>`:o)}
          </div>`:o}

      ${this.open&&this.canEdit?s`<div class="select-menu" popover="manual" part="listbox" role="listbox" aria-label=${this.label||"Options"} style=${this.menuStyle} @keydown=${this.onMenuKeyDown}>
            ${this.isClearable?s`<button
                  type="button"
                  role="option"
                  data-clear="true"
                  class="select-option select-option--placeholder"
                  aria-selected=${this.value==null}
                  @click=${()=>this.pickOption(null)}
                >
                  <span class="select-tick" aria-hidden="true">${this.value==null?R("check",14):o}</span>
                  <span>${this.placeholder}</span>
                </button>`:o}
            ${l?a.map(f=>f.label?s`<optgroup class="select-optgroup" role="group" label=${f.label} aria-label=${f.label}>
                        <div class="select-group-header" role="presentation">${f.label}</div>
                        ${f.options.map(g=>this.renderOptionButton(g))}
                      </optgroup>`:f.options.map(g=>this.renderOptionButton(g))):this.options.map(f=>this.renderOptionButton(f))}
          </div>`:o}
    </div>`;return this.labelHidden?h:s`<div class="emr-field" part="field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${h}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],re.prototype,"controlId",void 0);u([d({type:String})],re.prototype,"label",void 0);u([d({type:Boolean})],re.prototype,"labelHidden",void 0);u([d({type:String})],re.prototype,"placeholder",void 0);u([d({type:String})],re.prototype,"value",void 0);u([d({attribute:!1})],re.prototype,"options",void 0);u([d({type:Boolean})],re.prototype,"allowClear",void 0);u([d({type:Boolean})],re.prototype,"clearable",void 0);u([d({type:Boolean})],re.prototype,"invalid",void 0);u([d({type:String})],re.prototype,"hint",void 0);u([d({type:String})],re.prototype,"error",void 0);u([d({type:Boolean})],re.prototype,"required",void 0);u([d({type:Boolean})],re.prototype,"disabled",void 0);u([d({type:Boolean})],re.prototype,"readOnly",void 0);u([T()],re.prototype,"open",void 0);u([T()],re.prototype,"menuStyle",void 0);var be=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-quantity-input"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.unit=null,this.units=[],this.step=1,this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.readOnly||this.disabled,r=s`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:360px;">
      <emr-number-input
        .controlId=${e}
        .label=${this.label||"Amount"}
        .labelHidden=${!0}
        .value=${this.value}
        .min=${this.min}
        .max=${this.max}
        .step=${this.step}
        .disabled=${this.disabled}
        .readOnly=${this.readOnly}
        @valueChange=${a=>{a.stopPropagation(),i||this.emitValueChange(a.detail)}}
      ></emr-number-input>
      <div style="min-width:108px;">
        <emr-select
          .controlId=${`${e}-unit`}
          .label=${this.label?`${this.label} unit`:"Unit"}
          .labelHidden=${!0}
          .options=${this.units}
          .value=${this.unit}
          .disabled=${this.disabled}
          .readOnly=${this.readOnly}
          @valueChange=${a=>{a.stopPropagation(),i||this.dispatchEvent(new CustomEvent("unitChange",{detail:a.detail==null?null:String(a.detail),bubbles:!0,composed:!0}))}}
        ></emr-select>
      </div>
    </div>`;return this.labelHidden?r:s`<div class="emr-field">
      ${this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${r}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],be.prototype,"controlId",void 0);u([d({type:String})],be.prototype,"label",void 0);u([d({type:Boolean})],be.prototype,"labelHidden",void 0);u([d({type:Number})],be.prototype,"value",void 0);u([d({type:String})],be.prototype,"unit",void 0);u([d({attribute:!1})],be.prototype,"units",void 0);u([d({type:Number})],be.prototype,"min",void 0);u([d({type:Number})],be.prototype,"max",void 0);u([d({type:Number})],be.prototype,"step",void 0);u([d({type:String})],be.prototype,"hint",void 0);u([d({type:String})],be.prototype,"error",void 0);u([d({type:Boolean})],be.prototype,"required",void 0);u([d({type:Boolean})],be.prototype,"disabled",void 0);u([d({type:Boolean})],be.prototype,"readOnly",void 0);var de=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-paired-input"),this.controlId="",this.label="",this.labelHidden=!1,this.firstLabel="",this.secondLabel="",this.firstValue="",this.secondValue="",this.firstPlaceholder="",this.secondPlaceholder="",this.separator="/",this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}get locked(){return this.readOnly||this.disabled}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=s`<div style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;">
      ${this.firstLabel?s`<strong class="emr-muted">${this.firstLabel}</strong>`:o}
      <input
        id=${`${e}-first`}
        class="emr-control"
        style="width:132px;"
        placeholder=${this.firstPlaceholder}
        aria-label=${this.firstLabel?`${this.label?`${this.label}, `:""}${this.firstLabel}`:this.label||"First value"}
        .value=${this.locked?I(this.firstValue??""):this.firstValue??""}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        @blur=${r=>{r.target.value=this.firstValue??""}}
        @input=${r=>{if(this.locked){r.target.value=this.firstValue??"";return}this.dispatchEvent(new CustomEvent("firstValueChange",{detail:r.target.value||null,bubbles:!0,composed:!0}))}}
      />
      <span class="emr-muted" aria-hidden="true">${this.separator}</span>
      ${this.secondLabel?s`<strong class="emr-muted">${this.secondLabel}</strong>`:o}
      <input
        id=${`${e}-second`}
        class="emr-control"
        style="width:132px;"
        placeholder=${this.secondPlaceholder}
        aria-label=${this.secondLabel?`${this.label?`${this.label}, `:""}${this.secondLabel}`:this.label||"Second value"}
        .value=${this.locked?I(this.secondValue??""):this.secondValue??""}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        @blur=${r=>{r.target.value=this.secondValue??""}}
        @input=${r=>{if(this.locked){r.target.value=this.secondValue??"";return}this.dispatchEvent(new CustomEvent("secondValueChange",{detail:r.target.value||null,bubbles:!0,composed:!0}))}}
      />
    </div>`;return this.labelHidden?i:s`<div class="emr-field">
      ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:o}
      ${i}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],de.prototype,"controlId",void 0);u([d({type:String})],de.prototype,"label",void 0);u([d({type:Boolean})],de.prototype,"labelHidden",void 0);u([d({type:String})],de.prototype,"firstLabel",void 0);u([d({type:String})],de.prototype,"secondLabel",void 0);u([d({type:String})],de.prototype,"firstValue",void 0);u([d({type:String})],de.prototype,"secondValue",void 0);u([d({type:String})],de.prototype,"firstPlaceholder",void 0);u([d({type:String})],de.prototype,"secondPlaceholder",void 0);u([d({type:String})],de.prototype,"separator",void 0);u([d({type:String})],de.prototype,"hint",void 0);u([d({type:String})],de.prototype,"error",void 0);u([d({type:Boolean})],de.prototype,"required",void 0);u([d({type:Boolean})],de.prototype,"disabled",void 0);u([d({type:Boolean})],de.prototype,"readOnly",void 0);var we=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-checkbox"),this.controlId="",this.label="",this.labelHidden=!1,this.labelPlacement="end",this.checked=!1,this.mixed=!1,this.hint="",this.warning="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}get value(){return this.checked}set value(e){this.checked=e===!0}emitCheckedToggle(){let e=this.mixed?!0:!this.checked;this.dispatchEvent(new CustomEvent("checkedChange",{detail:e,bubbles:!0,composed:!0})),this.emitValueChange(e)}renderBooleanMessage(){return this.labelHidden?o:this.error?s`<span class="emr-error" role="alert">⚠ ${this.error}</span>`:this.warning?s`<span class="emr-warning" role="status">! ${this.warning}</span>`:this.hint?s`<span class="emr-hint">${this.hint}</span>`:o}resolvePlacementClass(){return this.labelPlacement==="start"?" option-tile--placement-start":this.labelPlacement==="space-between"?" option-tile--placement-between":""}render(){let e=this.controlId||this.fallbackId,t=`option-tile${this.readOnly?" option-tile--readonly":""}${this.resolvePlacementClass()}`,i=this.mixed?"mixed":String(this.checked),r=s`<button
      id=${e}
      type="button"
      part="control"
      role="checkbox"
      data-label-placement=${this.labelPlacement}
      class=${t}
      aria-label=${this.labelHidden&&this.label?this.label:o}
      aria-checked=${i}
      aria-readonly=${this.readOnly?"true":o}
      aria-invalid=${this.error?"true":o}
      ?disabled=${this.disabled}
      @click=${()=>{this.readOnly||this.disabled||this.emitCheckedToggle()}}
    >
      <span class="indicator" aria-hidden="true">
        ${this.mixed?"\u2013":this.checked?R("check",12):o}
      </span>
      ${this.labelHidden?s`<slot></slot>`:s`<span>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}<slot></slot></span>`}
    </button>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${r}
      ${this.renderBooleanMessage()}
    </div>`}};u([d({type:String})],we.prototype,"controlId",void 0);u([d({type:String})],we.prototype,"label",void 0);u([d({type:Boolean})],we.prototype,"labelHidden",void 0);u([d({type:String})],we.prototype,"labelPlacement",void 0);u([d({type:Boolean})],we.prototype,"checked",void 0);u([d({type:Boolean})],we.prototype,"mixed",void 0);u([d({type:String})],we.prototype,"hint",void 0);u([d({type:String})],we.prototype,"warning",void 0);u([d({type:String})],we.prototype,"error",void 0);u([d({type:Boolean})],we.prototype,"required",void 0);u([d({type:Boolean})],we.prototype,"disabled",void 0);u([d({type:Boolean})],we.prototype,"readOnly",void 0);var tr=class extends we{constructor(){super(...arguments),this.onLabel="",this.offLabel=""}render(){let e=this.controlId||this.fallbackId,t=`option-tile${this.readOnly?" option-tile--readonly":""}${this.resolvePlacementClass()}`,i=this.checked?this.onLabel:this.offLabel,r=s`<button
      id=${e}
      type="button"
      part="control"
      role="switch"
      data-label-placement=${this.labelPlacement}
      class=${t}
      aria-label=${this.labelHidden&&this.label?this.label:o}
      aria-checked=${String(this.checked)}
      aria-readonly=${this.readOnly?"true":o}
      aria-invalid=${this.error?"true":o}
      ?disabled=${this.disabled}
      @click=${()=>{this.readOnly||this.disabled||this.emitCheckedToggle()}}
    >
      <span class="switch-track" part="track" aria-hidden="true">
        <span class="switch-thumb" part="thumb"></span>
      </span>
      ${i?s`<span class="toggle-state-label">${i}</span>`:o}
      ${this.labelHidden?s`<slot></slot>`:s`<span>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}<slot></slot></span>`}
    </button>`;return this.labelHidden?r:s`<div class="emr-field" part="field">
      ${r}
      ${this.renderBooleanMessage()}
    </div>`}};u([d({type:String})],tr.prototype,"onLabel",void 0);u([d({type:String})],tr.prototype,"offLabel",void 0);var ae=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-radio-group"),this.controlId="",this.label="",this.labelHidden=!1,this.value=null,this.options=[],this.orientation="vertical",this.columns=2,this.variant="standard",this.clearable=!1,this.clearLabel="Clear",this.allowDeselect=!1,this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}clearSelection(){this.readOnly||this.disabled||(this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=this.orientation==="vertical"?"--cols: 1;":this.orientation==="grid"?`--cols: ${Math.max(1,this.columns)};`:"",r=this.clearable&&this.value!==null&&this.value!==""&&!this.readOnly&&!this.disabled,a=r?s`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label||"selection"}`}
          @click=${()=>this.clearSelection()}
        >${this.clearLabel}</button>`:o,l=s`<div
      id=${e}
      role="radiogroup"
      aria-label=${this.label||"Options"}
      aria-readonly=${this.readOnly?"true":o}
      aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
      class="option-grid"
      data-orientation=${this.orientation}
      data-variant=${this.variant}
      style=${i}
      @keydown=${c=>{let p=zs(c,this.options);p!==void 0&&!this.readOnly&&!this.disabled&&this.emitValueChange(p)}}
    >
      ${this.options.map(c=>{let p=this.value===c.value,h=this.variant==="card"?" option-tile--card":this.variant==="pill"?" option-tile--pill":"",f=`option-tile${this.readOnly?" option-tile--readonly":""}${h}`;return s`<button
          type="button"
          role="radio"
          class=${f}
          aria-checked=${String(p)}
          aria-readonly=${this.readOnly?"true":o}
          ?disabled=${this.disabled||!!c.disabled}
          @click=${()=>{if(!(this.readOnly||this.disabled||c.disabled)){if(p&&this.allowDeselect){this.clearSelection();return}this.emitValueChange(String(c.value))}}}
        >
          <span class="indicator indicator--radio" aria-hidden="true">${p?R("check",11):o}</span>
          <span class="option-tile-copy">
            <span>${c.label}</span>
            ${c.description?s`<span class="option-tile-desc">${c.description}</span>`:o}
          </span>
        </button>`})}
    </div>`;return this.labelHidden?r?s`<div class="emr-field">${l}${a}</div>`:l:s`<div class="emr-field">
      ${this.label||r?s`<div class="emr-header">
            ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:s`<span></span>`}
            ${a}
          </div>`:o}
      ${l}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],ae.prototype,"controlId",void 0);u([d({type:String})],ae.prototype,"label",void 0);u([d({type:Boolean})],ae.prototype,"labelHidden",void 0);u([d({type:String})],ae.prototype,"value",void 0);u([d({attribute:!1})],ae.prototype,"options",void 0);u([d({type:String})],ae.prototype,"orientation",void 0);u([d({type:Number})],ae.prototype,"columns",void 0);u([d({type:String})],ae.prototype,"variant",void 0);u([d({type:Boolean})],ae.prototype,"clearable",void 0);u([d({type:String})],ae.prototype,"clearLabel",void 0);u([d({type:Boolean})],ae.prototype,"allowDeselect",void 0);u([d({type:String})],ae.prototype,"hint",void 0);u([d({type:String})],ae.prototype,"error",void 0);u([d({type:Boolean})],ae.prototype,"required",void 0);u([d({type:Boolean})],ae.prototype,"disabled",void 0);u([d({type:Boolean})],ae.prototype,"readOnly",void 0);var Wt=class extends S{constructor(){super(...arguments),this.tone="neutral",this.label=""}static{this.styles=[w,H]}render(){let e=this.badge?.tone??this.tone,t=this.badge?.label??this.label;return s`<span part="badge" class="emr-badge emr-badge--${e}">
      ${t}${this.badge?.assistiveText?s`<span class="sr-only"> ${this.badge.assistiveText}</span>`:o}<slot></slot>
    </span>`}};u([d({type:String})],Wt.prototype,"tone",void 0);u([d({type:String})],Wt.prototype,"label",void 0);u([d({attribute:!1})],Wt.prototype,"badge",void 0);var li=class extends Wt{constructor(){super(...arguments),this.removable=!1,this.disabled=!1,this.removeLabel=""}render(){let e=this.badge?.tone??this.tone,t=this.badge?.label??this.label,i=`emr-chip emr-badge--${e}${this.removable?" chip-removable":""}`;return s`<span part="chip" class=${i}>
      <span>${t}<slot></slot></span>
      ${this.removable?s`<button
            type="button"
            class="chip-remove-btn"
            aria-label=${this.removeLabel||`Remove ${t||"chip"}`}
            ?disabled=${this.disabled}
            @click=${r=>{r.stopPropagation(),this.disabled||this.dispatchEvent(new CustomEvent("removeRequested",{bubbles:!0,composed:!0}))}}
          >${R("close",14)}</button>`:o}
    </span>`}};u([d({type:Boolean})],li.prototype,"removable",void 0);u([d({type:Boolean})],li.prototype,"disabled",void 0);u([d({type:String})],li.prototype,"removeLabel",void 0);var di=class extends S{constructor(){super(...arguments),this.tone="info",this.title="",this.message=""}static{this.styles=[w,H]}render(){return s`<div
      role=${this.tone==="danger"?"alert":"status"}
      class="emr-card emr-badge--${this.tone}"
      style="border-radius:var(--emr-radius);padding:12px;"
    >
      ${this.title?s`<strong style="display:block;">${this.title}</strong>`:o}
      ${this.message?s`<div>${this.message}</div>`:o}
      <div><slot></slot></div>
    </div>`}};u([d({type:String})],di.prototype,"tone",void 0);u([d({type:String})],di.prototype,"title",void 0);u([d({type:String})],di.prototype,"message",void 0);var Ct=class extends S{constructor(){super(...arguments),this.title="",this.kind="empty",this.message=""}static{this.styles=[w,H]}get state(){return this.kind}set state(e){this.kind=e}get description(){return this.message}set description(e){this.message=e}render(){return s`<div class="emr-card" style="text-align:center;" role=${this.kind==="error"?"alert":"status"}>
      <p class="emr-title">${this.title||this.kind}</p>
      ${this.message?s`<p class="emr-muted">${this.message}</p>`:o}
      <slot></slot>
    </div>`}};u([d({type:String})],Ct.prototype,"title",void 0);u([d({type:String})],Ct.prototype,"kind",void 0);u([d({type:String})],Ct.prototype,"message",void 0);u([d({type:String})],Ct.prototype,"state",null);u([d({type:String})],Ct.prototype,"description",null);var j=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-search-select"),this.controlId="",this.label="",this.labelHidden=!1,this.placeholder="Search\u2026",this.query="",this.value=null,this.filterMode="remote",this.clearable=!1,this.allowCustomValue=!1,this.options=[],this.selected=[],this.multiple=!1,this.open=!1,this.loading=!1,this.disabled=!1,this.required=!1,this.hint="",this.error="",this.emptyMessage="No matches",this.readOnly=!1,this.onOutsidePointerDown=e=>{!this.open||this.locked||e.composedPath().includes(this)||(this.filterMode==="local"&&(this.open=!1),this.request("closeRequested"))}}static{this.styles=[w,H]}get locked(){return this.readOnly||this.disabled}get visibleOptions(){return this.filterMode==="local"?Hr(this.options,this.query):this.options}connectedCallback(){super.connectedCallback(),typeof document<"u"&&document.addEventListener("pointerdown",this.onOutsidePointerDown,!0)}disconnectedCallback(){typeof document<"u"&&document.removeEventListener("pointerdown",this.onOutsidePointerDown,!0),super.disconnectedCallback()}request(e,t){this.locked||e==="searchRequested"&&this.loading||(this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0})),e==="removeRequested"&&t!==void 0&&this.dispatchEvent(new CustomEvent("selectionRemoved",{detail:t,bubbles:!0,composed:!0})))}commitCustomQuery(e){if(this.locked||!this.allowCustomValue)return;let t=e.trim();t&&(this.dispatchEvent(new CustomEvent("customValueCommitted",{detail:t,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("optionSelected",{detail:t,bubbles:!0,composed:!0})),this.emitValueChange(t))}clearAll(){this.locked||(this.filterMode==="local"&&(this.query=""),this.dispatchEvent(new CustomEvent("queryChange",{detail:"",bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("queryChanged",{detail:"",bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}focusOptionAt(e){let t=Array.from(this.shadowRoot?.querySelectorAll('button[role="option"]:not(:disabled)')??[]);if(!t.length)return;let i=Math.max(0,Math.min(e,t.length-1));t[i]?.focus()}renderSearchOption(e,t,i){let r=this.value===e.value||this.selected.some(a=>a.value===e.value);return s`<button
      type="button"
      role="option"
      class="option-tile"
      aria-selected=${String(r)}
      ?disabled=${this.locked||!!e.disabled}
      @keydown=${a=>{a.key==="ArrowDown"?(a.preventDefault(),this.focusOptionAt(t+1)):a.key==="ArrowUp"?(a.preventDefault(),this.focusOptionAt(t-1)):a.key==="Home"?(a.preventDefault(),this.focusOptionAt(0)):a.key==="End"?(a.preventDefault(),this.focusOptionAt(i-1)):a.key==="Escape"&&(a.preventDefault(),this.filterMode==="local"&&(this.open=!1),this.request("closeRequested"),this.shadowRoot?.querySelector('input[role="combobox"]')?.focus())}}
      @click=${()=>{!this.locked&&this.options.some(a=>a.value===e.value&&!a.disabled)&&(this.dispatchEvent(new CustomEvent("optionSelected",{detail:e.value,bubbles:!0,composed:!0})),this.emitValueChange(e.value),this.filterMode==="local"&&!this.multiple&&(this.open=!1))}}
    >
      <span>${e.label}</span>
      ${e.description?s`<span class="emr-muted">${e.description}</span>`:o}
    </button>`}render(){let e=this.controlId||this.fallbackId,t=`${e}-listbox`,i=`${e}-message`,r=this.visibleOptions,a=Xi(r),l=a.some(v=>v.label!==""),c=!!this.value||this.selected.length>0||!!this.query,p=this.clearable&&c&&!this.locked,h=this.query.trim(),f=this.allowCustomValue&&h.length>0&&!r.some(v=>v.label.toLowerCase()===h.toLowerCase()||v.value===h),g=0;return s`<div class="emr-field">
      ${!this.labelHidden&&this.label?s`<label class="emr-label" for=${e}>${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</label>`:o}
      ${this.selected.length?s`<div class="search-select-chips" role="list" aria-label="Selected options">
            ${this.selected.map(v=>s`<span role="listitem" class="emr-chip chip-removable">
                <span>${v.label}</span>
                ${this.locked?o:s`<button
                      type="button"
                      class="chip-remove-btn"
                      aria-label=${`Remove ${v.label}`}
                      @click=${()=>this.request("removeRequested",v.value)}
                    >${R("close",14)}</button>`}
              </span>`)}
          </div>`:o}
      <div class="search-select-bar select-bar">
        <input
          id=${e}
          class="emr-control"
          type="search"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          aria-expanded=${String(this.open&&!this.readOnly)}
          aria-controls=${this.open&&!this.readOnly?t:o}
          aria-label=${this.labelHidden?this.label||"Search":o}
          aria-invalid=${this.error?"true":o}
          aria-describedby=${!this.labelHidden&&(this.error||this.hint)?i:o}
          .value=${this.locked?I(this.query):this.query}
          placeholder=${this.placeholder}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @focus=${()=>{this.open||(this.filterMode==="local"&&!this.locked&&(this.open=!0),this.request("openRequested"))}}
          @keydown=${v=>{v.key==="Enter"?(v.preventDefault(),this.allowCustomValue&&this.query.trim()&&this.commitCustomQuery(this.query),this.request("searchRequested")):v.key==="Escape"&&this.open?(v.preventDefault(),this.filterMode==="local"&&(this.open=!1),this.request("closeRequested")):v.key==="ArrowDown"&&this.open&&(v.preventDefault(),this.focusOptionAt(0))}}
          @blur=${v=>{v.target.value=this.query}}
          @input=${v=>{if(this.locked){v.target.value=this.query;return}let b=v.target.value;this.filterMode==="local"&&(this.query=b,this.open=!0),this.dispatchEvent(new CustomEvent("queryChange",{detail:b,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("queryChanged",{detail:b,bubbles:!0,composed:!0}))}}
        />
        ${p?s`<button
              type="button"
              class="clear-inline-btn"
              data-clear-btn="true"
              aria-label=${`Clear ${this.label||"search"}`}
              @click=${()=>this.clearAll()}
            >${R("close",14)}</button>`:o}
      </div>
      ${!this.labelHidden&&this.error?s`<p id=${i} class="emr-error" role="alert">${this.error}</p>`:!this.labelHidden&&this.hint?s`<p id=${i} class="emr-hint">${this.hint}</p>`:o}
      ${this.open&&!this.readOnly?s`<div
            id=${t}
            class="search-select-panel"
            role="listbox"
            aria-label=${this.label||"Search results"}
            aria-multiselectable=${this.multiple?"true":o}
          >
            ${this.loading?s`<p class="emr-muted" role="status">Searching…</p>`:o}
            ${!this.loading&&!this.error&&!r.length&&!f?s`<p class="emr-muted" role="status">${this.emptyMessage}</p>`:o}
            ${l?a.map(v=>v.label?s`<optgroup class="select-optgroup" role="group" label=${v.label} aria-label=${v.label}>
                        <div class="select-group-header" role="presentation">${v.label}</div>
                        ${v.options.map(b=>this.renderSearchOption(b,g++,r.length))}
                      </optgroup>`:v.options.map(b=>this.renderSearchOption(b,g++,r.length))):r.map((v,b)=>this.renderSearchOption(v,b,r.length))}
            ${f?s`<button
                  type="button"
                  role="option"
                  data-custom-option="true"
                  class="option-tile"
                  aria-selected="false"
                  ?disabled=${this.locked}
                  @click=${()=>this.commitCustomQuery(this.query)}
                >
                  <span>Use "${h}"</span>
                </button>`:o}
          </div>`:o}
    </div>`}};u([d({type:String})],j.prototype,"controlId",void 0);u([d({type:String})],j.prototype,"label",void 0);u([d({type:Boolean})],j.prototype,"labelHidden",void 0);u([d({type:String})],j.prototype,"placeholder",void 0);u([d({type:String})],j.prototype,"query",void 0);u([d({type:String})],j.prototype,"value",void 0);u([d({type:String})],j.prototype,"filterMode",void 0);u([d({type:Boolean})],j.prototype,"clearable",void 0);u([d({type:Boolean})],j.prototype,"allowCustomValue",void 0);u([d({attribute:!1})],j.prototype,"options",void 0);u([d({attribute:!1})],j.prototype,"selected",void 0);u([d({type:Boolean})],j.prototype,"multiple",void 0);u([d({type:Boolean})],j.prototype,"open",void 0);u([d({type:Boolean})],j.prototype,"loading",void 0);u([d({type:Boolean})],j.prototype,"disabled",void 0);u([d({type:Boolean})],j.prototype,"required",void 0);u([d({type:String})],j.prototype,"hint",void 0);u([d({type:String})],j.prototype,"error",void 0);u([d({type:String})],j.prototype,"emptyMessage",void 0);u([d({type:Boolean})],j.prototype,"readOnly",void 0);var Rt=class extends S{constructor(){super(...arguments),this.tabs=[],this.active=null,this.ariaLabel="Tabs",this.readOnly=!1}static{this.styles=[w,H]}get activeTab(){return this.active}set activeTab(e){this.active=e}emitTab(e){this.dispatchEvent(new CustomEvent("tabChange",{detail:e,bubbles:!0,composed:!0})),this.emitValueChange(e)}render(){return s`<div
      role="tablist"
      aria-label=${this.ariaLabel}
      aria-readonly=${this.readOnly?"true":o}
      class="tabs-bar"
      @keydown=${e=>{let t=zs(e,this.tabs);t!==void 0&&!this.readOnly&&this.emitTab(t)}}
    >
      ${this.tabs.map((e,t)=>{let i=this.active===e.value,r=i||this.active==null&&t===0,a=`option-tile${this.readOnly?" option-tile--readonly":""}`;return s`<button
          type="button"
          role="tab"
          class=${a}
          tabindex=${r?"0":"-1"}
          aria-selected=${String(i)}
          aria-disabled=${this.readOnly?"true":o}
          ?disabled=${!!e.disabled}
          @click=${()=>{this.readOnly||e.disabled||this.emitTab(String(e.value))}}
        >${e.label}</button>`})}
    </div>`}};u([d({attribute:!1})],Rt.prototype,"tabs",void 0);u([d({type:String})],Rt.prototype,"active",void 0);u([d({type:String})],Rt.prototype,"ariaLabel",void 0);u([d({type:Boolean})],Rt.prototype,"readOnly",void 0);u([d({type:String})],Rt.prototype,"activeTab",null);var ir=class extends S{constructor(){super(...arguments),this.label="",this.orientation="horizontal"}static{this.styles=[w,H]}render(){return this.orientation==="vertical"?s`<div role="separator" aria-orientation="vertical" class="separator-vertical"></div>`:this.label.trim()?s`<div role="separator" aria-orientation="horizontal" class="separator-labelled">
      <div class="separator-line"></div>
      <span class="emr-muted">${this.label}</span>
      <div class="separator-line"></div>
    </div>`:s`<div role="separator" aria-orientation="horizontal" class="separator-plain"></div>`}};u([d({type:String})],ir.prototype,"label",void 0);u([d({type:String})],ir.prototype,"orientation",void 0);var se=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-likert"),this.controlId="",this.label="",this.labelHidden=!1,this.min=0,this.max=10,this.value=null,this.clearable=!1,this.clearLabel="Clear",this.hint="",this.error="",this.required=!1,this.disabled=!1,this.readOnly=!1}static{this.styles=[w,H]}clearSelection(){this.readOnly||this.disabled||(this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}render(){let e=this.controlId||this.fallbackId,t=`${e}-message`,i=[];for(let f=this.min;f<=this.max;f++)i.push(f);let r=gl(this.anchors,this.min,this.max),a=!!(r.minLabel||r.midLabel||r.maxLabel),l=this.clearable&&this.value!==null&&!this.readOnly&&!this.disabled,c=l?s`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label||"rating"}`}
          @click=${()=>this.clearSelection()}
        >${this.clearLabel}</button>`:o,p=i.map(f=>({value:String(f),label:String(f)})),h=s`<div class="emr-field">
      <div
        id=${e}
        role="radiogroup"
        aria-label=${this.label||"Rating scale"}
        aria-readonly=${this.readOnly?"true":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?t:o}
        class="likert-row"
        @keydown=${f=>{let g=zs(f,p);g!==void 0&&!this.readOnly&&!this.disabled&&this.emitValueChange(Number(g))}}
      >
        ${i.map(f=>{let g=this.value===f,v=this.optionTones?.[f]??(g?this.tone:void 0),b=`option-tile likert-pip${this.readOnly?" option-tile--readonly":""}`;return s`<button
            type="button"
            role="radio"
            class=${b}
            data-tone=${v??o}
            aria-checked=${String(g)}
            aria-pressed=${String(g)}
            aria-readonly=${this.readOnly?"true":o}
            ?disabled=${this.disabled}
            @click=${()=>{!this.readOnly&&!this.disabled&&this.emitValueChange(f)}}
          >${f}</button>`})}
      </div>
      ${a&&!this.disabled?s`<div class="scale-anchors" aria-hidden="true">
            <span>${r.minLabel??""}</span>
            ${r.midLabel?s`<span>${r.midLabel}</span>`:o}
            <span>${r.maxLabel??""}</span>
          </div>`:o}
      ${this.labelHidden?c:o}
    </div>`;return this.labelHidden?h:s`<div class="emr-field">
      ${this.label||l?s`<div class="emr-header">
            ${this.label?s`<span class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:s`<span></span>`}
            ${c}
          </div>`:o}
      ${h}
      ${this.error?s`<span id=${t} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${t} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],se.prototype,"controlId",void 0);u([d({type:String})],se.prototype,"label",void 0);u([d({type:Boolean})],se.prototype,"labelHidden",void 0);u([d({type:Number})],se.prototype,"min",void 0);u([d({type:Number})],se.prototype,"max",void 0);u([d({type:Number})],se.prototype,"value",void 0);u([d({attribute:!1})],se.prototype,"anchors",void 0);u([d({attribute:!1})],se.prototype,"optionTones",void 0);u([d({type:String})],se.prototype,"tone",void 0);u([d({type:Boolean})],se.prototype,"clearable",void 0);u([d({type:String})],se.prototype,"clearLabel",void 0);u([d({type:String})],se.prototype,"hint",void 0);u([d({type:String})],se.prototype,"error",void 0);u([d({type:Boolean})],se.prototype,"required",void 0);u([d({type:Boolean})],se.prototype,"disabled",void 0);u([d({type:Boolean})],se.prototype,"readOnly",void 0);var ml=400,z=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-vas"),this.dragging=!1,this.controlId="",this.label="",this.labelHidden=!1,this.min=0,this.max=100,this.step=1,this.majorInterval=10,this.minorInterval=5,this.orientation="horizontal",this.tone="neutral",this.valueText="",this.value=null,this.clearable=!1,this.clearLabel="Clear",this.required=!1,this.readOnly=!1,this.disabled=!1,this.hint="",this.error="",this.onKeyDown=e=>{if(!this.canInteract)return;let t=this.step>0?this.step:1,i=this.majorInterval>0?this.majorInterval:t*10,r=this.value??this.min,a;switch(e.key){case"ArrowRight":case"ArrowUp":a=r+t;break;case"ArrowLeft":case"ArrowDown":a=r-t;break;case"PageUp":a=r+i;break;case"PageDown":a=r-i;break;case"Home":a=this.min;break;case"End":a=this.max;break;default:return}e.preventDefault(),this.emitSnapped(a)}}static{this.styles=[w,H]}get canInteract(){return!this.readOnly&&!this.disabled}clearSelection(){this.canInteract&&(this.dispatchEvent(new CustomEvent("cleared",{bubbles:!0,composed:!0})),this.emitValueChange(null))}toPercent(e){let t=this.max-this.min;return t>0?Math.min(100,Math.max(0,(e-this.min)/t*100)):0}snapValue(e){let t=Math.min(this.min,this.max),i=Math.max(this.min,this.max),r=Math.min(i,Math.max(t,e));return this.step>0?Number((this.min+Math.round((r-this.min)/this.step)*this.step).toFixed(4)):Number(r.toFixed(4))}emitSnapped(e){if(!this.canInteract)return;let t=this.snapValue(e);t!==this.value&&this.emitValueChange(t)}emitFromPointer(e,t){let i=t.getBoundingClientRect(),r=this.orientation==="vertical"?i.height>0?(i.bottom-e.clientY)/i.height:0:i.width>0?(e.clientX-i.left)/i.width:0;this.emitSnapped(this.min+r*(this.max-this.min))}buildTicks(){let e=this.max-this.min;if(!(e>0))return[];let t=this.majorInterval>0?this.majorInterval:e,i=this.minorInterval>0?this.minorInterval:t,r=Math.min(t,i),a=e/r>ml?e/ml:r,l=[];for(let c=this.min;c<=this.max+a/1e3;c+=a){let p=Number(c.toFixed(6)),f=Math.abs(p-this.min)%t,g=f<t/1e3||Math.abs(f-t)<t/1e3;l.push({value:p,pct:this.toPercent(p),major:g,label:g?Number.isInteger(p)?String(p):String(Number(p.toFixed(2))):null})}return l}render(){let e=this.controlId||this.fallbackId,t=`${e}-label`,i=`${e}-message`,r=this.value===null||this.value===void 0?null:this.toPercent(this.value),a=this.buildTicks(),l=gl(this.anchors,this.min,this.max),c=!!(l.minLabel||l.midLabel||l.maxLabel),h=this.clearable&&this.value!==null&&this.canInteract?s`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${this.label||"scale"}`}
          @click=${()=>this.clearSelection()}
        >${this.clearLabel}</button>`:o,f=["vas-slider",this.orientation==="vertical"?"vas-slider--vertical":"",this.readOnly?"vas-slider--readonly":"",this.disabled?"vas-slider--disabled":"",this.error?"vas-slider--invalid":""].filter(Boolean).join(" "),g=s`<div class=${`vas-frame${this.orientation==="vertical"?" vas-frame--vertical":""}`}>
      <div
        id=${e}
        part="slider"
        role="slider"
        class=${f}
        tabindex=${this.disabled?-1:0}
        aria-orientation=${this.orientation}
        aria-labelledby=${!this.labelHidden&&this.label?t:o}
        aria-label=${this.labelHidden||!this.label?this.label||"Visual analogue scale":o}
        aria-describedby=${!this.labelHidden&&(this.error||this.hint)?i:o}
        aria-valuemin=${String(this.min)}
        aria-valuemax=${String(this.max)}
        aria-valuenow=${this.value??o}
        aria-valuetext=${this.valueText||o}
        aria-readonly=${this.readOnly?"true":o}
        aria-disabled=${this.disabled?"true":o}
        aria-invalid=${this.error?"true":o}
        @keydown=${this.onKeyDown}
        @pointerdown=${v=>{if(!this.canInteract)return;let b=v.currentTarget;this.dragging=!0,b.setPointerCapture?.(v.pointerId),b.focus(),v.preventDefault(),this.emitFromPointer(v,b)}}
        @pointermove=${v=>{if(!this.canInteract||!this.dragging)return;let b=v.currentTarget;v.preventDefault(),this.emitFromPointer(v,b)}}
        @pointerup=${v=>{this.dragging=!1;let b=v.currentTarget;b.hasPointerCapture?.(v.pointerId)&&b.releasePointerCapture(v.pointerId)}}
        @pointercancel=${v=>{this.dragging=!1;let b=v.currentTarget;b.hasPointerCapture?.(v.pointerId)&&b.releasePointerCapture(v.pointerId)}}
      >
        <span class="vas-rule" aria-hidden="true"></span>
        ${a.map(v=>s`
            <span
              class=${`vas-tick${v.major?" vas-tick--major":""}`}
              style=${`--vas-pct: ${v.pct};`}
              aria-hidden="true"
            ></span>
            ${v.label!==null?s`<span class="vas-tick-label" style=${`--vas-pct: ${v.pct};`} aria-hidden="true">${v.label}</span>`:o}
          `)}
        ${r!==null?s`<span
              part="thumb"
              class=${`vas-thumb vas-thumb--${this.tone}`}
              style=${`--vas-pct: ${r};`}
              aria-hidden="true"
            ></span>`:o}
      </div>
      ${c?s`<div class="scale-anchors" aria-hidden="true">
            <span>${this.orientation==="vertical"?l.maxLabel??"":l.minLabel??""}</span>
            ${l.midLabel?s`<span>${l.midLabel}</span>`:o}
            <span>${this.orientation==="vertical"?l.minLabel??"":l.maxLabel??""}</span>
          </div>`:o}
      ${this.labelHidden?h:o}
    </div>`;return this.labelHidden?g:s`<div class="emr-field">
      <div class="emr-header">
        ${this.label?s`<span id=${t} class="emr-label">${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}</span>`:s`<span></span>`}
        <div class="emr-row">
          <span class=${`emr-badge emr-badge--${this.value===null?"neutral":this.tone}`}>
            ${this.value===null?"Unmarked":`${this.value} / ${this.max}`}
          </span>
          ${h}
        </div>
      </div>
      ${g}
      ${this.error?s`<span id=${i} class="emr-error" role="alert">${this.error}</span>`:this.hint?s`<span id=${i} class="emr-hint">${this.hint}</span>`:o}
    </div>`}};u([d({type:String})],z.prototype,"controlId",void 0);u([d({type:String})],z.prototype,"label",void 0);u([d({type:Boolean})],z.prototype,"labelHidden",void 0);u([d({type:Number})],z.prototype,"min",void 0);u([d({type:Number})],z.prototype,"max",void 0);u([d({type:Number})],z.prototype,"step",void 0);u([d({type:Number})],z.prototype,"majorInterval",void 0);u([d({type:Number})],z.prototype,"minorInterval",void 0);u([d({type:String})],z.prototype,"orientation",void 0);u([d({attribute:!1})],z.prototype,"anchors",void 0);u([d({type:String})],z.prototype,"tone",void 0);u([d({type:String})],z.prototype,"valueText",void 0);u([d({type:Number})],z.prototype,"value",void 0);u([d({type:Boolean})],z.prototype,"clearable",void 0);u([d({type:String})],z.prototype,"clearLabel",void 0);u([d({type:Boolean})],z.prototype,"required",void 0);u([d({type:Boolean})],z.prototype,"readOnly",void 0);u([d({type:Boolean})],z.prototype,"disabled",void 0);u([d({type:String})],z.prototype,"hint",void 0);u([d({type:String})],z.prototype,"error",void 0);var Ot=class extends S{constructor(){super(...arguments),this.fallbackHeadingId=Oe("emr-card-heading"),this.label="",this.padded=!0,this.headingId="",this.cardTitle="",this.title=""}static{this.styles=[w,H]}render(){let e=this.label||this.cardTitle||this.title,t=this.headingId||this.fallbackHeadingId,i=`emr-card${this.padded?"":" emr-card--flush"}`;return s`<section class=${i} part="card" aria-labelledby=${e?t:o}>
      ${e?s`<h3 id=${t} class="emr-title">${e}</h3>`:o}
      <slot></slot>
    </section>`}};u([d({type:String})],Ot.prototype,"label",void 0);u([d({type:Boolean})],Ot.prototype,"padded",void 0);u([d({type:String})],Ot.prototype,"headingId",void 0);u([d({type:String})],Ot.prototype,"cardTitle",void 0);u([d({type:String})],Ot.prototype,"title",void 0);var Kt=class extends S{constructor(){super(...arguments),this.count=2,this.gap="16px"}static{this.styles=[w,H]}get columns(){return this.count}set columns(e){this.count=e}render(){let e=Math.max(1,Math.min(6,this.count||2)),t=this.widths&&this.widths.length>0?this.widths.join(" "):`repeat(${e}, minmax(0, 1fr))`,i=this.gap||"16px";return s`<div
      class="columns-grid"
      style=${`--emr-col-template: ${t}; --emr-col-gap: ${i};`}
    ><slot></slot></div>`}};u([d({type:Number})],Kt.prototype,"count",void 0);u([d({attribute:!1})],Kt.prototype,"widths",void 0);u([d({type:String})],Kt.prototype,"gap",void 0);u([d({type:Number})],Kt.prototype,"columns",null);var ut=class extends S{constructor(){super(...arguments),this.field="",this.value="",this.remarks="",this.notes="",this.heading=!1,this.placeholder="\u2014"}static{this.styles=[w,H]}render(){let e=`fvr-row${this.heading?" fvr-row--heading":""}`;return s`<div class=${e} role="row">
      <strong role="cell">${this.field}</strong>
      <span role="cell">${this.heading?this.value:this.value||this.placeholder}</span>
      <span role="cell" class="emr-muted">${this.remarks}</span>
      <span role="cell" class="emr-muted">${this.notes}</span>
    </div>`}};u([d({type:String})],ut.prototype,"field",void 0);u([d({type:String})],ut.prototype,"value",void 0);u([d({type:String})],ut.prototype,"remarks",void 0);u([d({type:String})],ut.prototype,"notes",void 0);u([d({type:Boolean})],ut.prototype,"heading",void 0);u([d({type:String})],ut.prototype,"placeholder",void 0);var Se=class extends S{constructor(){super(...arguments),this.fallbackId=Oe("emr-status-cell"),this.controlId="",this.status=null,this.valueLabel="",this.attribution="",this.actionLabel="",this.secondaryNote="",this.compact=!1,this.interactive=!1,this.selectable=!1,this.readOnly=!1}static{this.styles=[w,H]}get badge(){return this.status??void 0}set badge(e){this.status=e??null}get value(){return this.valueLabel}set value(e){this.valueLabel=e}get resolvedAttribution(){let e=this.attribution;return e?typeof e=="string"?e:[e.nameLabel??e.author,e.roleLabel,e.timeLabel??e.timestamp].filter(Boolean).join(" \xB7 "):""}render(){let e=this.controlId||this.fallbackId,t=(this.interactive||this.selectable)&&!this.readOnly,i=this.actionLabel||this.action?.label||"",r=this.resolvedAttribution,a=[this.valueLabel,r,this.secondaryNote].filter(Boolean).join(". ");return s`<div class="status-cell">
      <div
        id=${e}
        class=${`status-cell-body${t?" status-cell-body--interactive":""}`}
        role=${t?"button":o}
        tabindex=${t?"0":o}
        @click=${()=>{t&&this.dispatchEvent(new CustomEvent("selected",{bubbles:!0,composed:!0}))}}
        @keydown=${l=>{t&&(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),this.dispatchEvent(new CustomEvent("selected",{bubbles:!0,composed:!0})))}}
      >
        <div class="status-cell-main">
          ${this.status?s`<emr-badge .badge=${this.status}></emr-badge>`:o}
          ${!this.compact&&this.valueLabel?s`<strong>${this.valueLabel}</strong>`:o}
        </div>
        ${this.compact?a?s`<span class="sr-only">${a}</span>`:o:s`
              ${r?s`<span class="emr-muted">${r}</span>`:o}
              ${this.secondaryNote?s`<span class="emr-muted">${this.secondaryNote}</span>`:o}
            `}
      </div>
      ${i&&!this.readOnly&&!this.compact?s`<button
            type="button"
            class="emr-btn emr-btn--outline emr-btn--sm status-cell-action"
            @click=${()=>{this.readOnly||this.dispatchEvent(new CustomEvent("actionClicked",{bubbles:!0,composed:!0}))}}
          >${i}</button>`:o}
    </div>`}};u([d({type:String})],Se.prototype,"controlId",void 0);u([d({attribute:!1})],Se.prototype,"status",void 0);u([d({type:String})],Se.prototype,"valueLabel",void 0);u([d({attribute:!1})],Se.prototype,"attribution",void 0);u([d({type:String})],Se.prototype,"actionLabel",void 0);u([d({attribute:!1})],Se.prototype,"action",void 0);u([d({type:String})],Se.prototype,"secondaryNote",void 0);u([d({type:Boolean})],Se.prototype,"compact",void 0);u([d({type:Boolean})],Se.prototype,"interactive",void 0);u([d({type:Boolean})],Se.prototype,"selectable",void 0);u([d({type:Boolean})],Se.prototype,"readOnly",void 0);u([d({attribute:!1})],Se.prototype,"badge",null);u([d({type:String})],Se.prototype,"value",null);var et=class extends S{constructor(){super(...arguments),this.stages=[],this.activeId="",this.ariaLabel="Stages",this.orientation="horizontal",this.readOnly=!1,this.onKeyDown=e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))return;let t=Array.from(this.shadowRoot?.querySelectorAll("button.stage-btn")??[]);if(!t.length)return;let i=t.findIndex(l=>l===e.target);if(i<0)return;e.preventDefault();let r=t.length-1,a=e.key==="Home"?0:e.key==="End"?r:Math.min(r,Math.max(0,i+(e.key==="ArrowRight"||e.key==="ArrowDown"?1:-1)));t[a]?.focus()}}static{this.styles=[w,H]}get steps(){return this.stages}set steps(e){this.stages=e}get activeStepId(){return this.activeId}set activeStepId(e){this.activeId=e}emitStage(e){this.dispatchEvent(new CustomEvent("stageSelected",{detail:e,bubbles:!0,composed:!0})),this.dispatchEvent(new CustomEvent("stepSelected",{detail:e,bubbles:!0,composed:!0}))}render(){let e=`stage-list${this.orientation==="vertical"?" stage-list--vertical":""}`,t=this.stages.some(i=>i.id===this.activeId);return s`<nav aria-label=${this.ariaLabel||"Stages"}>
      <ol class=${e} @keydown=${this.onKeyDown}>
        ${this.stages.map((i,r)=>{let a=i.id===this.activeId,l=a||!t&&r===0,c=["stage-btn",a?"stage-btn--active":"",this.readOnly?"stage-btn--readonly":""].filter(Boolean).join(" ");return s`<li>
            <button
              type="button"
              class=${c}
              tabindex=${l?"0":"-1"}
              aria-current=${a?"step":o}
              aria-pressed=${String(a)}
              aria-readonly=${this.readOnly?"true":o}
              @click=${()=>{this.readOnly||this.emitStage(i.id)}}
            >
              <span class="stage-num" aria-hidden="true">${r+1}</span>
              <span>
                <strong>${i.label}</strong>
                ${i.description?s`<span class="emr-muted" style="display:block;">${i.description}</span>`:o}
              </span>
              ${i.status?s`<emr-badge .badge=${i.status}></emr-badge>`:o}
            </button>
          </li>`})}
      </ol>
    </nav>`}};u([d({attribute:!1})],et.prototype,"stages",void 0);u([d({type:String})],et.prototype,"activeId",void 0);u([d({type:String})],et.prototype,"ariaLabel",void 0);u([d({type:String})],et.prototype,"orientation",void 0);u([d({type:Boolean})],et.prototype,"readOnly",void 0);u([d({attribute:!1})],et.prototype,"steps",null);u([d({type:String})],et.prototype,"activeStepId",null);var ci=class extends S{constructor(){super(...arguments),this.interactive=!0,this.readOnly=!1}static{this.styles=[w,H]}render(){let e=this.model;if(!e)return o;let t=s`<span class="emr-muted">${e.label}</span>
      <strong style="font-size:var(--emr-text-2xl);">${e.value}</strong>
      ${e.sub?s`<span>${e.sub}</span>`:o}
      ${e.status?s`<emr-badge .badge=${e.status}></emr-badge>`:o}`;return this.interactive&&!this.readOnly?s`<button type="button" class="emr-card" aria-label=${e.accessibilityLabel??`${e.label} ${e.value}`} @click=${()=>this.emitIntent({type:"statSelected",key:e.key})}>${t}</button>`:s`<div class="emr-card">${t}</div>`}};u([d({attribute:!1})],ci.prototype,"model",void 0);u([d({type:Boolean})],ci.prototype,"interactive",void 0);u([d({type:Boolean})],ci.prototype,"readOnly",void 0);var Ye=class extends S{constructor(){super(...arguments),this.toastId="",this.message="",this.tone="info",this.actionLabel="",this.dismissLabel="Dismiss"}static{this.styles=[w,H]}render(){let e=this.model,t=e?.id??this.toastId,i=e?.message??this.message,r=e?.tone??this.tone,a=e?.actionLabel??this.actionLabel;return!e&&!i?o:s`<div class="emr-card toast-row" part="toast">
      <span
        class=${`emr-badge emr-badge--${r}`}
        role=${r==="warning"||r==="danger"?"alert":"status"}
      >
        ${i}
      </span>
      ${a?s`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            @click=${()=>{this.model&&(this.model.id!==t||!this.model.actionLabel)||(this.emitIntent({type:"actionPressed",id:t}),this.dispatchEvent(new CustomEvent("actionClicked",{bubbles:!0,composed:!0})))}}
          >${a}</button>`:o}
      <button
        type="button"
        class="emr-btn emr-btn--ghost"
        @click=${()=>{this.model&&this.model.id!==t||(this.emitIntent({type:"dismissed",id:t}),this.dispatchEvent(new CustomEvent("dismissRequested",{bubbles:!0,composed:!0})))}}
      >${this.dismissLabel}</button>
    </div>`}};u([d({attribute:!1})],Ye.prototype,"model",void 0);u([d({type:String})],Ye.prototype,"toastId",void 0);u([d({type:String})],Ye.prototype,"message",void 0);u([d({type:String})],Ye.prototype,"tone",void 0);u([d({type:String})],Ye.prototype,"actionLabel",void 0);u([d({type:String})],Ye.prototype,"dismissLabel",void 0);function bl(){y("emr-button",Je),y("emr-text-input",Ne),y("emr-number-input",ge),y("emr-date-input",Y),y("emr-time-input",Be),y("emr-datetime-input",qe),y("emr-select",re),y("emr-quantity-input",be),y("emr-paired-input",de),y("emr-checkbox",we),y("emr-toggle",tr),y("emr-radio-group",ae),y("emr-badge",Wt),y("emr-chip",li),y("emr-alert",di),y("emr-state-message",Ct),y("emr-search-select",j),y("emr-tabs",Rt),y("emr-separator",ir),y("emr-likert",se),y("emr-vas",z),y("emr-card",Ot),y("emr-columns",Kt),y("emr-field-value-row",ut),y("emr-status-cell",Se),y("emr-stage-stepper",et),y("emr-stat-tile",ci),y("emr-toast",Ye),hl(),ul()}var P=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},vd=0,Le=n=>`${n}-${++vd}`,Ee=M`
  .l2-stack {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .l2-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .l2-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .l2-grid-4 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(156px, 1fr));
    gap: 10px;
  }
  @media (max-width: 768px) {
    .l2-grid-2,
    .l2-grid-4 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sub-field {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .sub-label {
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    color: var(--emr-text-muted);
  }
  .status-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .attachment-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .attachment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
  }
  .attachment-select-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .attachment-select-btn:hover {
    background: var(--emr-primary-soft);
  }
  .attachment-select-btn:focus-visible,
  .laterality-btn:focus-visible,
  .macro-option:focus-visible,
  .sig-pad:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }

  .sig-pad-wrap {
    border: 1.5px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .sig-pad {
    display: block;
    width: 100%;
    height: auto;
    touch-action: none;
    cursor: crosshair;
  }
  .sig-pad--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }

  .macro-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .macro-popover {
    display: grid;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
    max-height: 220px;
    overflow-y: auto;
  }
  .macro-option {
    width: 100%;
    min-height: 44px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    display: grid;
    gap: 2px;
    text-align: left;
    cursor: pointer;
  }
  .macro-option:hover {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary-border);
  }

  .laterality-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .laterality-btn {
    min-height: 44px;
    min-width: 64px;
    padding: 0 16px;
    border: 1.5px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }
  .laterality-btn[aria-checked="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .laterality-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
`;function At(n,e,t,i){let r=e??[];if(!n&&r.length===0)return o;let a=r.find(p=>p.value===n),l=a?.tone??"neutral",c=a?.label??n??"";return s`<div class="status-strip" role="group" aria-label="Assessment status">
    ${n?s`<span class=${`emr-badge emr-badge--${l}`}>${c}</span>`:o}
    ${!t&&r.length>0?r.map(p=>s`<button
            type="button"
            class="emr-btn emr-btn--secondary emr-btn--sm"
            aria-pressed=${String(n===p.value)}
            @click=${()=>i(n===p.value?void 0:p.value)}
          >${p.label}</button>`):o}
  </div>`}function $d(n){return n===void 0||!Number.isFinite(n)?"":n<1024?`${n} B`:n<1024*1024?`${(n/1024).toFixed(1)} KB`:`${(n/(1024*1024)).toFixed(1)} MB`}var pi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-scale-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||e.definition?.contract?.linkId||this.fallbackId,i=!!e.readOnly||!!e.definition?.contract?.readOnly;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        ${e.variant==="vas"?s`<emr-vas
              .controlId=${t}
              .label=${e.label}
              .labelHidden=${!0}
              .value=${e.value}
              .min=${e.min}
              .max=${e.max}
              .step=${e.step??1}
              .majorInterval=${e.majorInterval??10}
              .minorInterval=${e.minorInterval??5}
              .orientation=${e.orientation??"horizontal"}
              .anchors=${e.anchors}
              .tone=${e.tone??"neutral"}
              .readOnly=${i}
              @valueChange=${r=>{r.stopPropagation(),i||this.emitIntent({type:"valueChangeRequested",value:r.detail})}}
            ></emr-vas>`:s`<emr-likert
              .controlId=${t}
              .label=${e.label}
              .labelHidden=${!0}
              .value=${e.value}
              .min=${e.min}
              .max=${e.max}
              .anchors=${e.anchors}
              .optionTones=${e.optionTones}
              .tone=${e.tone}
              .readOnly=${i}
              @valueChange=${r=>{r.stopPropagation(),i||this.emitIntent({type:"valueChangeRequested",value:r.detail})}}
            ></emr-likert>`}
        <div class="l2-row">
          ${e.value!==null&&!i?s`<button
                type="button"
                class="emr-btn emr-btn--ghost emr-btn--sm"
                @click=${()=>{this.model?.readOnly||this.emitIntent({type:"valueChangeRequested",value:null})}}
              >Clear</button>`:o}
          ${At(e.status,e.statusOptions,i,r=>{this.model?.readOnly||this.emitIntent({type:"statusChangeRequested",status:r})})}
        </div>
      </div>
    </emr-field-frame>`}};P([d({type:String})],pi.prototype,"controlId",void 0);P([d({type:Boolean})],pi.prototype,"labelHidden",void 0);P([d({attribute:!1})],pi.prototype,"model",void 0);var xd=[{value:"year",label:"Year"},{value:"month",label:"Year + Month"},{value:"day",label:"Full Date"}],hi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-partial-date"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly,r=e.value?.precision??"day";return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        <div class="l2-row">
          <emr-segmented-control
            .controlId=${`${t}-precision`}
            .label=${`${e.label} precision`}
            .labelHidden=${!0}
            .options=${xd}
            .value=${r}
            .readOnly=${i}
            @valueChange=${a=>{a.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"precisionChangeRequested",precision:a.detail})}}
          ></emr-segmented-control>
          <emr-date-input
            .controlId=${t}
            .label=${e.label}
            .labelHidden=${!0}
            .precision=${r}
            .value=${e.value?.value??null}
            .min=${e.min??""}
            .max=${e.max??""}
            .readOnly=${i}
            @valueChange=${a=>{a.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"valueChangeRequested",value:a.detail?{value:a.detail,precision:r}:null})}}
          ></emr-date-input>
        </div>
        ${At(e.status,e.statusOptions,i,a=>{this.model?.readOnly||this.emitIntent({type:"statusChangeRequested",status:a})})}
      </div>
    </emr-field-frame>`}};P([d({type:String})],hi.prototype,"controlId",void 0);P([d({type:Boolean})],hi.prototype,"labelHidden",void 0);P([d({attribute:!1})],hi.prototype,"model",void 0);var ui=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-attachment-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly,r=e.maxItems!==void 0&&e.items.length>=e.maxItems;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        ${e.items.length>0?s`<ul class="attachment-list" aria-label=${`${e.label} attachments`}>
              ${e.items.map(a=>{let l=[a.contentType,$d(a.sizeBytes),a.uploadedAt].filter(Boolean).join(" \xB7 ");return s`<li class="attachment-item">
                  <button
                    type="button"
                    class="attachment-select-btn"
                    @click=${()=>this.emitIntent({type:"itemSelected",id:a.id})}
                  >
                    ${R("file",16)}
                    <span>${a.title}</span>
                  </button>
                  <div class="l2-row">
                    ${l?s`<span class="emr-muted">${l}</span>`:o}
                    ${a.statusBadge?s`<emr-badge .badge=${a.statusBadge}></emr-badge>`:o}
                    ${i?o:s`<button
                          type="button"
                          class="emr-btn emr-btn--ghost emr-btn--sm"
                          aria-label=${`Remove ${a.title}`}
                          @click=${()=>{this.model?.readOnly||this.emitIntent({type:"itemRemoveRequested",id:a.id})}}
                        >${R("trash",15)} Remove</button>`}
                  </div>
                </li>`})}
            </ul>`:i&&!e.status?s`<span class="emr-muted">No attachments</span>`:o}

        ${i?o:s`<div class="l2-row">
              <emr-file-trigger
                .controlId=${t}
                .label=${e.label}
                .labelHidden=${!0}
                .accept=${e.accept??""}
                .multiple=${!!e.multiple}
                .disabled=${r}
                @filesSelected=${a=>{a.stopPropagation(),!this.model?.readOnly&&!r&&this.emitIntent({type:"filesSelected",files:a.detail})}}
              ></emr-file-trigger>
              ${e.allowCamera?s`
                    <button
                      type="button"
                      class="emr-btn emr-btn--secondary"
                      ?disabled=${r}
                      @click=${()=>{!this.model?.readOnly&&!r&&this.emitIntent({type:"captureRequested",mode:"camera"})}}
                    >${R("camera",16)} Camera</button>
                    <button
                      type="button"
                      class="emr-btn emr-btn--secondary"
                      ?disabled=${r}
                      @click=${()=>{!this.model?.readOnly&&!r&&this.emitIntent({type:"captureRequested",mode:"scanner"})}}
                    >${R("scanner",16)} Scanner</button>
                  `:o}
            </div>`}

        ${At(e.status,e.statusOptions,i,a=>{this.model?.readOnly||this.emitIntent({type:"statusChangeRequested",status:a})})}
      </div>
    </emr-field-frame>`}};P([d({type:String})],ui.prototype,"controlId",void 0);P([d({type:Boolean})],ui.prototype,"labelHidden",void 0);P([d({attribute:!1})],ui.prototype,"model",void 0);var mi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-paired-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly,r=e.mode??"text",a=e.separator??"/";return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        ${r==="decimal"||r==="integer"?s`<div class="l2-row">
              <div class="sub-field">
                <span class="sub-label">${e.firstLabel}</span>
                <emr-number-input
                  .controlId=${`${t}-first`}
                  .label=${`${e.label}, ${e.firstLabel}`}
                  .labelHidden=${!0}
                  .mode=${r}
                  .value=${typeof e.value?.first=="number"?e.value.first:null}
                  .min=${e.min}
                  .max=${e.max}
                  .step=${e.step??(r==="integer"?1:.1)}
                  .readOnly=${i}
                  @valueChange=${l=>{l.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"firstChangeRequested",value:l.detail})}}
                ></emr-number-input>
              </div>
              <strong class="emr-muted" aria-hidden="true">${a}</strong>
              <div class="sub-field">
                <span class="sub-label">${e.secondLabel}</span>
                <emr-number-input
                  .controlId=${`${t}-second`}
                  .label=${`${e.label}, ${e.secondLabel}`}
                  .labelHidden=${!0}
                  .mode=${r}
                  .value=${typeof e.value?.second=="number"?e.value.second:null}
                  .min=${e.min}
                  .max=${e.max}
                  .step=${e.step??(r==="integer"?1:.1)}
                  .readOnly=${i}
                  @valueChange=${l=>{l.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"secondChangeRequested",value:l.detail})}}
                ></emr-number-input>
              </div>
              ${e.unit?s`<span class="emr-muted">${e.unit}</span>`:o}
            </div>`:s`<div class="l2-row">
              <emr-paired-input
                .controlId=${t}
                .label=${e.label}
                .labelHidden=${!0}
                .firstLabel=${e.firstLabel}
                .secondLabel=${e.secondLabel}
                .firstPlaceholder=${e.firstPlaceholder??""}
                .secondPlaceholder=${e.secondPlaceholder??""}
                .separator=${a}
                .firstValue=${e.value?.first==null?"":String(e.value.first)}
                .secondValue=${e.value?.second==null?"":String(e.value.second)}
                .readOnly=${i}
                @firstValueChange=${l=>{l.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"firstChangeRequested",value:l.detail})}}
                @secondValueChange=${l=>{l.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"secondChangeRequested",value:l.detail})}}
              ></emr-paired-input>
              ${e.unit?s`<span class="emr-muted">${e.unit}</span>`:o}
            </div>`}
        ${At(e.status,e.statusOptions,i,l=>{this.model?.readOnly||this.emitIntent({type:"statusChangeRequested",status:l})})}
      </div>
    </emr-field-frame>`}};P([d({type:String})],mi.prototype,"controlId",void 0);P([d({type:Boolean})],mi.prototype,"labelHidden",void 0);P([d({attribute:!1})],mi.prototype,"model",void 0);var gi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-duration-input"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly,r=e.unitOptions.map(a=>({value:a.value,label:a.label}));return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        <div class="l2-row">
          <emr-number-input
            .controlId=${t}
            .label=${`${e.label} amount`}
            .labelHidden=${!0}
            .value=${e.value?.amount??null}
            .min=${e.min??0}
            .max=${e.max}
            .step=${e.step??1}
            .readOnly=${i}
            @valueChange=${a=>{a.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"amountChangeRequested",amount:a.detail})}}
          ></emr-number-input>
          <emr-segmented-control
            .controlId=${`${t}-unit`}
            .label=${`${e.label} unit`}
            .labelHidden=${!0}
            .options=${r}
            .value=${e.value?.unit??null}
            .readOnly=${i}
            @valueChange=${a=>{a.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"unitChangeRequested",unit:a.detail})}}
          ></emr-segmented-control>
        </div>
        ${At(e.status,e.statusOptions,i,a=>{this.model?.readOnly||this.emitIntent({type:"statusChangeRequested",status:a})})}
      </div>
    </emr-field-frame>`}};P([d({type:String})],gi.prototype,"controlId",void 0);P([d({type:Boolean})],gi.prototype,"labelHidden",void 0);P([d({attribute:!1})],gi.prototype,"model",void 0);var bi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-range-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      ${e.kind==="date"?s`<div class="l2-row">
            <div class="sub-field">
              <span class="sub-label">From</span>
              <emr-date-input
                .controlId=${`${t}-low`}
                .label=${`${e.label} start`}
                .labelHidden=${!0}
                .value=${typeof e.value?.low=="string"?e.value.low:null}
                .min=${typeof e.min=="string"?e.min:""}
                .max=${typeof e.max=="string"?e.max:""}
                .placeholder=${e.lowPlaceholder??""}
                .readOnly=${i}
                @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"lowChangeRequested",low:r.detail})}}
              ></emr-date-input>
            </div>
            <span class="emr-muted" aria-hidden="true">–</span>
            <div class="sub-field">
              <span class="sub-label">To</span>
              <emr-date-input
                .controlId=${`${t}-high`}
                .label=${`${e.label} end`}
                .labelHidden=${!0}
                .value=${typeof e.value?.high=="string"?e.value.high:null}
                .min=${typeof e.min=="string"?e.min:""}
                .max=${typeof e.max=="string"?e.max:""}
                .placeholder=${e.highPlaceholder??""}
                .readOnly=${i}
                @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"highChangeRequested",high:r.detail})}}
              ></emr-date-input>
            </div>
          </div>`:s`<div class="l2-row">
            <div class="sub-field">
              <span class="sub-label">${e.lowPlaceholder||"Low"}</span>
              <emr-number-input
                .controlId=${`${t}-low`}
                .label=${`${e.label} low`}
                .labelHidden=${!0}
                .value=${typeof e.value?.low=="number"?e.value.low:null}
                .min=${typeof e.min=="number"?e.min:void 0}
                .max=${typeof e.max=="number"?e.max:void 0}
                .step=${e.step??1}
                .readOnly=${i}
                @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"lowChangeRequested",low:r.detail})}}
              ></emr-number-input>
            </div>
            <span class="emr-muted" aria-hidden="true">–</span>
            <div class="sub-field">
              <span class="sub-label">${e.highPlaceholder||"High"}</span>
              <emr-number-input
                .controlId=${`${t}-high`}
                .label=${`${e.label} high`}
                .labelHidden=${!0}
                .value=${typeof e.value?.high=="number"?e.value.high:null}
                .min=${typeof e.min=="number"?e.min:void 0}
                .max=${typeof e.max=="number"?e.max:void 0}
                .step=${e.step??1}
                .readOnly=${i}
                @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"highChangeRequested",high:r.detail})}}
              ></emr-number-input>
            </div>
            ${e.unit?s`<span class="emr-muted">${e.unit}</span>`:o}
          </div>`}
    </emr-field-frame>`}};P([d({type:String})],bi.prototype,"controlId",void 0);P([d({type:Boolean})],bi.prototype,"labelHidden",void 0);P([d({attribute:!1})],bi.prototype,"model",void 0);var Xt=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-signature-capture"),this.controlId="",this.labelHidden=!1,this.activePoints=[],this.drawing=!1}static{this.styles=[w,Ee]}toPadPoint(e,t,i,r){let a=t.getBoundingClientRect(),l=a.width>0?i/a.width:1,c=a.height>0?r/a.height:1,p=Number(Math.min(i,Math.max(0,(e.clientX-a.left)*l)).toFixed(2)),h=Number(Math.min(r,Math.max(0,(e.clientY-a.top)*c)).toFixed(2));return{x:p,y:h}}finishStroke(e,t){if(!this.drawing)return;this.drawing=!1,t.hasPointerCapture?.(e.pointerId)&&t.releasePointerCapture(e.pointerId);let i=this.activePoints;this.activePoints=[],!this.model?.readOnly&&i.length>0&&this.emitIntent({type:"strokeAdded",stroke:{points:i}})}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly,r=e.width??420,a=e.height??140,l=[e.signatoryName,e.signatoryRole,e.signedAt].filter(Boolean).join(" \xB7 "),c=p=>p.map(h=>`${h.x},${h.y}`).join(" ");return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        ${l?s`<span class="emr-muted">${l}</span>`:o}
        <div class="sig-pad-wrap">
          <svg
            id=${t}
            part="pad"
            role="img"
            aria-label=${`${e.label} signature pad`}
            class=${`sig-pad${i?" sig-pad--readonly":""}`}
            viewBox=${`0 0 ${r} ${a}`}
            width=${String(r)}
            height=${String(a)}
            @pointerdown=${p=>{if(i)return;let h=p.currentTarget;this.drawing=!0,h.setPointerCapture?.(p.pointerId),p.preventDefault(),this.activePoints=[this.toPadPoint(p,h,r,a)]}}
            @pointermove=${p=>{if(i||!this.drawing)return;let h=p.currentTarget;p.preventDefault(),this.activePoints=[...this.activePoints,this.toPadPoint(p,h,r,a)]}}
            @pointerup=${p=>this.finishStroke(p,p.currentTarget)}
            @pointercancel=${p=>{this.drawing=!1,this.activePoints=[];let h=p.currentTarget;h.hasPointerCapture?.(p.pointerId)&&h.releasePointerCapture(p.pointerId)}}
          >
            <line
              x1="16"
              y1=${String(Math.round(a*.78))}
              x2=${String(r-16)}
              y2=${String(Math.round(a*.78))}
              stroke="var(--emr-border)"
              stroke-dasharray="4 4"
            />
            ${e.strokes.map(p=>O`<polyline fill="none" stroke="var(--emr-text)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" points=${c(p.points)} />`)}
            ${this.activePoints.length>0?O`<polyline fill="none" stroke="var(--emr-primary)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" points=${c(this.activePoints)} />`:o}
          </svg>
        </div>
        ${i?o:s`<div class="l2-row">
              <button
                type="button"
                class="emr-btn emr-btn--outline emr-btn--sm"
                ?disabled=${e.strokes.length===0}
                @click=${()=>{this.model?.readOnly||this.emitIntent({type:"clearRequested"})}}
              >Clear signature</button>
            </div>`}
      </div>
    </emr-field-frame>`}};P([d({type:String})],Xt.prototype,"controlId",void 0);P([d({type:Boolean})],Xt.prototype,"labelHidden",void 0);P([d({attribute:!1})],Xt.prototype,"model",void 0);P([T()],Xt.prototype,"activePoints",void 0);var fi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-phone-input"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly,r=e.countryOptions.map(l=>({value:l.code,label:l.label})),a=new Set(e.channels??[]);return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        <div class="l2-row">
          <div style="min-width: 120px;">
            <emr-select
              .controlId=${`${t}-country`}
              .label=${`${e.label} country code`}
              .labelHidden=${!0}
              .options=${r}
              .value=${e.countryCode}
              .readOnly=${i}
              @valueChange=${l=>{l.stopPropagation(),!this.model?.readOnly&&l.detail&&this.emitIntent({type:"countryCodeChangeRequested",countryCode:l.detail})}}
            ></emr-select>
          </div>
          <input
            id=${t}
            class="emr-control"
            style="flex: 1; min-width: 160px;"
            type="tel"
            inputmode="tel"
            aria-label=${`${e.label} number`}
            .value=${i?I(e.nationalNumber):e.nationalNumber}
            ?readonly=${i}
            @blur=${l=>{l.target.value=this.model?.nationalNumber??""}}
            @input=${l=>{if(this.model?.readOnly){l.target.value=this.model.nationalNumber;return}this.emitIntent({type:"numberChangeRequested",nationalNumber:l.target.value})}}
          />
          ${e.extension!==void 0?s`<input
                id=${`${t}-ext`}
                class="emr-control"
                style="width: 108px;"
                type="text"
                placeholder="Ext."
                aria-label=${`${e.label} extension`}
                .value=${i?I(e.extension):e.extension}
                ?readonly=${i}
                @blur=${l=>{l.target.value=this.model?.extension??""}}
                @input=${l=>{if(this.model?.readOnly){l.target.value=this.model.extension??"";return}this.emitIntent({type:"extensionChangeRequested",extension:l.target.value})}}
              />`:o}
          ${e.verifiedBadge?s`<emr-badge .badge=${e.verifiedBadge}></emr-badge>`:o}
        </div>

        ${e.availableChannels&&e.availableChannels.length>0?s`<div class="l2-row" role="group" aria-label=${`${e.label} messaging channels`}>
              ${e.availableChannels.map(l=>{let c=a.has(l.id);return s`<button
                  type="button"
                  role="checkbox"
                  class="emr-btn emr-btn--secondary emr-btn--sm"
                  aria-checked=${String(c)}
                  aria-readonly=${i?"true":o}
                  @click=${()=>{this.model?.readOnly||this.emitIntent({type:"channelToggleRequested",channel:l.id})}}
                >${l.label}</button>`})}
            </div>`:o}
      </div>
    </emr-field-frame>`}};P([d({type:String})],fi.prototype,"controlId",void 0);P([d({type:Boolean})],fi.prototype,"labelHidden",void 0);P([d({attribute:!1})],fi.prototype,"model",void 0);var yi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-address-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}emitPart(e,t){this.model?.readOnly||this.emitIntent({type:"fieldChangeRequested",part:e,value:t})}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly,r=e.value;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        ${e.useOptions&&e.useOptions.length>0?s`<emr-segmented-control
              .controlId=${`${t}-use`}
              .label=${`${e.label} use`}
              .labelHidden=${!0}
              .options=${e.useOptions}
              .value=${e.use??null}
              .readOnly=${i}
              @valueChange=${a=>{a.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"useChangeRequested",use:a.detail})}}
            ></emr-segmented-control>`:o}

        <div class="sub-field">
          <label class="sub-label" for=${`${t}-line1`}>Address line 1</label>
          <emr-text-input
            .controlId=${`${t}-line1`}
            .label=${`${e.label} line 1`}
            .labelHidden=${!0}
            .value=${r.line1}
            .readOnly=${i}
            @valueChange=${a=>{a.stopPropagation(),this.emitPart("line1",a.detail??"")}}
          ></emr-text-input>
        </div>

        <div class="sub-field">
          <label class="sub-label" for=${`${t}-line2`}>Address line 2</label>
          <emr-text-input
            .controlId=${`${t}-line2`}
            .label=${`${e.label} line 2`}
            .labelHidden=${!0}
            .value=${r.line2??""}
            .readOnly=${i}
            @valueChange=${a=>{a.stopPropagation(),this.emitPart("line2",a.detail??"")}}
          ></emr-text-input>
        </div>

        <div class="l2-grid-2">
          <div class="sub-field">
            <label class="sub-label" for=${`${t}-city`}>City / Town</label>
            <emr-text-input
              .controlId=${`${t}-city`}
              .label=${`${e.label} city`}
              .labelHidden=${!0}
              .value=${r.city}
              .readOnly=${i}
              @valueChange=${a=>{a.stopPropagation(),this.emitPart("city",a.detail??"")}}
            ></emr-text-input>
          </div>

          ${e.showDistrict||r.district?s`<div class="sub-field">
                <label class="sub-label" for=${`${t}-district`}>District</label>
                <emr-text-input
                  .controlId=${`${t}-district`}
                  .label=${`${e.label} district`}
                  .labelHidden=${!0}
                  .value=${r.district??""}
                  .readOnly=${i}
                  @valueChange=${a=>{a.stopPropagation(),this.emitPart("district",a.detail??"")}}
                ></emr-text-input>
              </div>`:o}

          <div class="sub-field">
            <label class="sub-label" for=${`${t}-state`}>State / Province</label>
            ${e.stateOptions&&e.stateOptions.length>0?s`<emr-select
                  .controlId=${`${t}-state`}
                  .label=${`${e.label} state`}
                  .labelHidden=${!0}
                  .options=${e.stateOptions}
                  .value=${r.state||null}
                  .readOnly=${i}
                  @valueChange=${a=>{a.stopPropagation(),this.emitPart("state",a.detail??"")}}
                ></emr-select>`:s`<emr-text-input
                  .controlId=${`${t}-state`}
                  .label=${`${e.label} state`}
                  .labelHidden=${!0}
                  .value=${r.state}
                  .readOnly=${i}
                  @valueChange=${a=>{a.stopPropagation(),this.emitPart("state",a.detail??"")}}
                ></emr-text-input>`}
          </div>

          <div class="sub-field">
            <label class="sub-label" for=${`${t}-postalCode`}>Postal / PIN code</label>
            <emr-text-input
              .controlId=${`${t}-postalCode`}
              .label=${`${e.label} postal code`}
              .labelHidden=${!0}
              .value=${r.postalCode}
              .readOnly=${i}
              @valueChange=${a=>{a.stopPropagation(),this.emitPart("postalCode",a.detail??"")}}
            ></emr-text-input>
          </div>

          <div class="sub-field">
            <label class="sub-label" for=${`${t}-country`}>Country</label>
            ${e.countryOptions&&e.countryOptions.length>0?s`<emr-select
                  .controlId=${`${t}-country`}
                  .label=${`${e.label} country`}
                  .labelHidden=${!0}
                  .options=${e.countryOptions}
                  .value=${r.country||null}
                  .readOnly=${i}
                  @valueChange=${a=>{a.stopPropagation(),this.emitPart("country",a.detail??"")}}
                ></emr-select>`:s`<emr-text-input
                  .controlId=${`${t}-country`}
                  .label=${`${e.label} country`}
                  .labelHidden=${!0}
                  .value=${r.country}
                  .readOnly=${i}
                  @valueChange=${a=>{a.stopPropagation(),this.emitPart("country",a.detail??"")}}
                ></emr-text-input>`}
          </div>
        </div>
      </div>
    </emr-field-frame>`}};P([d({type:String})],yi.prototype,"controlId",void 0);P([d({type:Boolean})],yi.prototype,"labelHidden",void 0);P([d({attribute:!1})],yi.prototype,"model",void 0);var vi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-macro-text-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        <textarea
          id=${t}
          class="emr-control"
          rows=${e.rows??4}
          placeholder=${e.placeholder??""}
          aria-label=${e.label}
          .value=${i?I(e.value):e.value}
          ?readonly=${i}
          @blur=${r=>{r.target.value=this.model?.value??""}}
          @keydown=${r=>{r.key==="Escape"&&this.model?.suggestionsOpen&&!this.model.readOnly&&(r.preventDefault(),this.emitIntent({type:"macroDismissRequested"}))}}
          @input=${r=>{let a=r.target;if(this.model?.readOnly){a.value=this.model.value;return}let l=a.value;this.emitIntent({type:"valueChangeRequested",value:l});let c=a.selectionStart??l.length,p=l.slice(0,c),h=/(?:^|\s)([./][A-Za-z0-9_-]*)$/.exec(p);h?.[1]&&this.emitIntent({type:"macroQueryRequested",trigger:h[1]})}}
        ></textarea>

        ${i?o:s`<div class="macro-toolbar">
              <span class="emr-muted">Type . or / to expand macros</span>
              <button
                type="button"
                class="emr-btn emr-btn--secondary emr-btn--sm"
                aria-pressed=${String(!!e.dictating)}
                @click=${()=>{this.model?.readOnly||this.emitIntent({type:"dictationToggleRequested"})}}
              >${R("mic",15)} ${e.dictating?"Stop dictation":"Dictate"}</button>
            </div>`}

        ${e.suggestionsOpen&&e.suggestions.length>0&&!i?s`<div class="macro-popover" role="listbox" aria-label="Macro suggestions">
              ${e.suggestions.map(r=>s`<button
                  type="button"
                  role="option"
                  class="macro-option"
                  aria-selected="false"
                  @click=${()=>{this.model?.readOnly||this.emitIntent({type:"macroSelected",trigger:r.trigger})}}
                >
                  <strong>${r.trigger} · ${r.label}</strong>
                  <span class="emr-muted">${r.expansionPreview}</span>
                </button>`)}
            </div>`:o}
      </div>
    </emr-field-frame>`}};P([d({type:String})],vi.prototype,"controlId",void 0);P([d({type:Boolean})],vi.prototype,"labelHidden",void 0);P([d({attribute:!1})],vi.prototype,"model",void 0);var $i=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-laterality-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        <div
          id=${t}
          role="radiogroup"
          aria-label=${e.label}
          aria-readonly=${i?"true":o}
          class="laterality-group"
        >
          ${e.options.map(r=>{let a=e.value===r.code;return s`<button
              type="button"
              role="radio"
              class=${`laterality-btn${i?" laterality-btn--readonly":""}`}
              aria-checked=${String(a)}
              aria-readonly=${i?"true":o}
              @click=${()=>{if(this.model?.readOnly)return;let c=a&&!e.required?null:r.code;this.emitIntent({type:"lateralitySelected",code:c})}}
            >
              ${r.shortLabel?s`<span class="emr-badge">${r.shortLabel}</span>`:o}
              <span>${r.label}</span>
            </button>`})}
        </div>

        ${e.requiresConfirmation?s`<emr-checkbox
              .controlId=${`${t}-confirm`}
              .label=${e.confirmationLabel||"Surgical site & laterality confirmed"}
              .checked=${!!e.confirmed}
              .readOnly=${i}
              @checkedChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"confirmationChangeRequested",confirmed:r.detail})}}
            ></emr-checkbox>`:o}
      </div>
    </emr-field-frame>`}};P([d({type:String})],$i.prototype,"controlId",void 0);P([d({type:Boolean})],$i.prototype,"labelHidden",void 0);P([d({attribute:!1})],$i.prototype,"model",void 0);var xi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-visual-acuity"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        ${e.eye||e.derivedDisplay?s`<div class="l2-row">
              ${e.eye?s`<span class="emr-badge emr-badge--info">${e.eye}</span>`:o}
              ${e.derivedDisplay?s`<span class="emr-badge">${e.derivedDisplay}</span>`:o}
            </div>`:o}

        <div class="l2-row">
          <emr-segmented-control
            .controlId=${`${t}-notation`}
            .label=${`${e.label} notation`}
            .labelHidden=${!0}
            .options=${e.notationOptions}
            .value=${e.notation}
            .readOnly=${i}
            @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"notationChangeRequested",notation:r.detail})}}
          ></emr-segmented-control>

          <emr-segmented-control
            .controlId=${`${t}-correction`}
            .label=${`${e.label} correction`}
            .labelHidden=${!0}
            .options=${e.correctionOptions}
            .value=${e.correction}
            .readOnly=${i}
            @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"correctionChangeRequested",correction:r.detail})}}
          ></emr-segmented-control>
        </div>

        <div class="l2-grid-2">
          <div class="sub-field">
            <span class="sub-label">Acuity</span>
            <emr-select
              .controlId=${t}
              .label=${`${e.label} acuity`}
              .labelHidden=${!0}
              .options=${e.valueOptions}
              .value=${e.value}
              .allowClear=${!0}
              .readOnly=${i}
              @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"valueChangeRequested",value:r.detail})}}
            ></emr-select>
          </div>

          ${e.showPinhole?s`<div class="sub-field">
                <span class="sub-label">Pinhole (PH)</span>
                <emr-select
                  .controlId=${`${t}-pinhole`}
                  .label=${`${e.label} pinhole`}
                  .labelHidden=${!0}
                  .options=${e.valueOptions}
                  .value=${e.pinholeValue??null}
                  .allowClear=${!0}
                  .readOnly=${i}
                  @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"pinholeChangeRequested",value:r.detail})}}
                ></emr-select>
              </div>`:o}
        </div>

        ${At(e.status,e.statusOptions,i,r=>{this.model?.readOnly||this.emitIntent({type:"statusChangeRequested",status:r})})}
      </div>
    </emr-field-frame>`}};P([d({type:String})],xi.prototype,"controlId",void 0);P([d({type:Boolean})],xi.prototype,"labelHidden",void 0);P([d({attribute:!1})],xi.prototype,"model",void 0);var wi=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-refraction-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        ${e.eye||e.formattedSummary?s`<div class="l2-row">
              ${e.eye?s`<span class="emr-badge emr-badge--info">${e.eye}</span>`:o}
              ${e.formattedSummary?s`<span class="emr-badge">${e.formattedSummary}</span>`:o}
            </div>`:o}

        <div class="l2-grid-4">
          <div class="sub-field">
            <span class="sub-label">Sphere (SPH)</span>
            <emr-number-input
              .controlId=${`${t}-sphere`}
              .label=${`${e.label} sphere`}
              .labelHidden=${!0}
              .value=${e.value.sphere}
              .step=${e.sphereStep??.25}
              .unit=${"D"}
              .readOnly=${i}
              @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"sphereChangeRequested",sphere:r.detail})}}
            ></emr-number-input>
          </div>

          <div class="sub-field">
            <span class="sub-label">Cylinder (CYL)</span>
            <emr-number-input
              .controlId=${`${t}-cylinder`}
              .label=${`${e.label} cylinder`}
              .labelHidden=${!0}
              .value=${e.value.cylinder}
              .step=${e.cylinderStep??.25}
              .unit=${"D"}
              .readOnly=${i}
              @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"cylinderChangeRequested",cylinder:r.detail})}}
            ></emr-number-input>
          </div>

          <div class="sub-field">
            <span class="sub-label">Axis</span>
            <emr-number-input
              .controlId=${`${t}-axis`}
              .label=${`${e.label} axis`}
              .labelHidden=${!0}
              .mode=${"integer"}
              .value=${e.value.axis}
              .min=${0}
              .max=${180}
              .step=${1}
              .unit=${"\xB0"}
              .readOnly=${i}
              @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"axisChangeRequested",axis:r.detail})}}
            ></emr-number-input>
          </div>

          ${e.showNearAdd?s`<div class="sub-field">
                <span class="sub-label">Near Add</span>
                <emr-number-input
                  .controlId=${`${t}-nearAdd`}
                  .label=${`${e.label} near add`}
                  .labelHidden=${!0}
                  .value=${e.value.nearAdd??null}
                  .min=${0}
                  .step=${.25}
                  .unit=${"D"}
                  .readOnly=${i}
                  @valueChange=${r=>{r.stopPropagation(),this.model?.readOnly||this.emitIntent({type:"nearAddChangeRequested",nearAdd:r.detail})}}
                ></emr-number-input>
              </div>`:o}
        </div>

        ${At(e.status,e.statusOptions,i,r=>{this.model?.readOnly||this.emitIntent({type:"statusChangeRequested",status:r})})}
      </div>
    </emr-field-frame>`}};P([d({type:String})],wi.prototype,"controlId",void 0);P([d({type:Boolean})],wi.prototype,"labelHidden",void 0);P([d({attribute:!1})],wi.prototype,"model",void 0);var Si=class extends S{constructor(){super(...arguments),this.fallbackId=Le("emr-image-field"),this.controlId="",this.labelHidden=!1}static{this.styles=[w,Ee]}render(){let e=this.model;if(!e)return o;let t=this.controlId||this.fallbackId,i=!!e.readOnly;return s`<emr-field-frame
      .controlId=${t}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint??""}
      .messages=${e.messages??[]}
      ?required=${!!e.required}
    >
      <div class="l2-stack">
        <emr-image-upload
          .controlId=${t}
          .label=${e.label}
          .labelHidden=${!0}
          .items=${e.items??[]}
          .multiple=${e.multiple??!0}
          .maxFiles=${e.maxFiles}
          .maxSizeBytes=${e.maxSizeBytes}
          .allowCamera=${!!e.allowCamera}
          .aspectPresets=${e.aspectPresets??[]}
          .readOnly=${i}
          @filesSelected=${r=>{r.stopPropagation(),i||this.emitIntent({type:"filesSelected",files:r.detail})}}
          @itemsChange=${r=>{r.stopPropagation(),i||this.emitIntent({type:"itemsChangeRequested",items:r.detail})}}
          @imageCropped=${r=>{r.stopPropagation(),i||this.emitIntent({type:"imageCropped",id:r.detail.id,result:r.detail.result})}}
          @captionChange=${r=>{r.stopPropagation(),i||this.emitIntent({type:"captionChangeRequested",id:r.detail.id,caption:r.detail.caption})}}
          @removeRequested=${r=>{r.stopPropagation(),i||this.emitIntent({type:"itemRemoveRequested",id:r.detail})}}
          @captureRequested=${r=>{r.stopPropagation(),i||this.emitIntent({type:"captureRequested",mode:r.detail})}}
        ></emr-image-upload>
        ${At(e.status,e.statusOptions,i,r=>{i||this.emitIntent({type:"statusChangeRequested",status:r})})}
      </div>
    </emr-field-frame>`}};P([d({type:String})],Si.prototype,"controlId",void 0);P([d({type:Boolean})],Si.prototype,"labelHidden",void 0);P([d({attribute:!1})],Si.prototype,"model",void 0);function fl(){y("emr-scale-field",pi),y("emr-partial-date-field",hi),y("emr-attachment-field",ui),y("emr-paired-field",mi),y("emr-duration-input",gi),y("emr-range-field",bi),y("emr-signature-capture-field",Xt),y("emr-phone-input",fi),y("emr-address-field",yi),y("emr-macro-text-field",vi),y("emr-laterality-field",$i),y("emr-visual-acuity-field",xi),y("emr-refraction-field",wi),y("emr-image-field",Si)}var D=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},wd=0,sr=n=>`${n}-${++wd}`,Ii=M`
  .frame-messages {
    display: grid;
    gap: 3px;
  }
  .slot-line {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: stretch;
  }
  .slot-tile {
    flex: 1 1 210px;
    min-width: 180px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
  }
  .slot-tile--on {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
  }
  .slot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .slot-toggle-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    text-align: left;
  }
  .slot-toggle-btn[aria-checked="true"],
  .slot-toggle-btn[aria-pressed="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-surface);
    color: var(--emr-primary-contrast);
  }
  .slot-toggle-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .slot-amount-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .slot-unticked-pill {
    min-height: 38px;
    padding: 0 12px;
    border: 1px dashed var(--emr-border);
    border-radius: var(--emr-radius-sm);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font-size: var(--emr-text-sm);
    display: inline-flex;
    align-items: center;
  }
  .field-options {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .field-stack {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  .coded-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .coded-chip {
    display: inline-flex;
    align-items: stretch;
    min-height: 44px;
    max-width: 100%;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
  }
  .coded-chip-body {
    display: grid;
    align-content: center;
    gap: 1px;
    padding: 5px 10px;
    min-width: 0;
  }
  .coded-chip-display {
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text);
  }
  .coded-chip-meta {
    font-size: var(--emr-text-xs);
    color: var(--emr-text-muted);
  }
  .coded-chip-remove {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-lg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .coded-chip-remove:hover {
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }
  .status-select {
    width: auto;
    min-width: 160px;
    max-width: 100%;
  }
  .signatory-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .signatory-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
  }
  .signatory-name {
    font-size: var(--emr-text-md);
    font-weight: var(--emr-weight-bold);
    color: var(--emr-text);
  }
  .type-radio-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0 14px;
    border: 1px solid var(--emr-border);
    border-radius: 999px;
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .type-radio-btn[aria-checked="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-semibold);
  }
  .type-radio-btn[aria-readonly="true"] {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .ident-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ident-input {
    flex: 1 1 200px;
    min-width: 0;
  }
`;function Sd(n){return"contract"in n&&"presentation"in n}function kd(n){return!!(n&&"messages"in n&&"enabled"in n)}function Id(n){if(Sd(n)){let{contract:e,presentation:t}=n;return{id:n.id??e.linkId,label:t.label,valueType:e.valueType,widget:t.widget,placeholder:t.placeholder??"",hint:t.hint??t.instructions??"",required:e.cardinality.min>=1,repeats:e.cardinality.max===null||e.cardinality.max>1,readOnly:!!e.readOnly,defaultValue:e.defaultValue??null,unit:t.unitDisplay??e.unit?.code??"",precision:t.precision,min:t.min,max:t.max,step:t.step,rows:t.rows??3,anchors:t.anchors,optionTones:t.optionTones,options:t.options??[],treeNodes:t.treeNodes??[],mask:t.mask??"",assessmentStatusOptions:t.assessmentStatusOptions??[],contractDef:n}}return{id:n.id,label:n.label,valueType:n.type,widget:n.widget,placeholder:n.placeholder??"",hint:n.hint??"",required:!!n.required,repeats:n.type==="multiselect",readOnly:!1,defaultValue:null,unit:n.unit??"",precision:n.precision,min:n.min,max:n.max,step:n.step,rows:n.rows??3,options:n.options??[],treeNodes:[],mask:"",assessmentStatusOptions:n.assessmentStatusOptions??[],contractDef:Ln(n)}}function Cd(n,e){return n?kd(n)?{value:n.value,status:n.status??n.assessmentStatus,readOnly:!!n.readOnly,disabled:!!n.disabled||!n.enabled,requiredOverride:n.required,error:n.error??"",warning:n.warning??"",info:"",messages:n.messages}:{value:n.value,status:n.assessmentStatus,readOnly:!!n.readOnly,disabled:!!n.disabled,requiredOverride:n.required,error:n.error??"",warning:n.warning??"",info:"",messages:[]}:{value:e,readOnly:!1,disabled:!1,error:"",warning:"",info:"",messages:[]}}function Rd(n){return!!(n&&typeof n=="object"&&!Array.isArray(n)&&"value"in n&&"precision"in n&&typeof n.value=="string")}function Fs(n){return!!(n&&typeof n=="object"&&!Array.isArray(n)&&"code"in n&&"system"in n&&"display"in n)}function Us(n,e,t){let i=new Map((t??[]).map(r=>[r.id,r]));return n.flatMap(r=>{let a=e(r,i.get(r.id));return a?[{...a,id:r.id,label:r.label,...r.timeHint?{timeHint:r.timeHint}:{}}]:[]})}function Od(n,e){let t=new Set((n??[]).map(r=>r.id)),i=new Set(e.slotIds);return t.size===i.size&&e.slotIds.every(r=>t.has(r))}function Ad(n,e){return n.amountLabel?n.amountLabel:n.amount===null?"Selected, no amount":e?`${n.amount} ${e}`:String(n.amount)}var _e=class extends S{constructor(){super(...arguments),this.fallbackId=sr("emr-field-frame"),this.controlId="",this.label="",this.labelHidden=!1,this.labelNamesControl=!1,this.hint="",this.info="",this.warning="",this.error="",this.messages=[],this.required=!1}static{this.styles=[w,Ii]}render(){let e=this.controlId||this.fallbackId,t=`${e}-label`,i=[];this.hint&&i.push(`${e}-hint`),this.error&&i.push(`${e}-error`),this.warning&&i.push(`${e}-warning`),this.info&&i.push(`${e}-info`),this.messages.forEach((a,l)=>i.push(`${e}-msg-${l}`));let r=i.join(" ");return s`<div
      class="emr-field"
      part="frame"
      role="group"
      aria-labelledby=${!this.labelHidden&&this.label?t:o}
      aria-label=${this.labelHidden&&this.label?this.label:o}
      aria-describedby=${r||o}
      aria-required=${String(this.required)}
    >
      ${!this.labelHidden&&this.label?s`<label class="emr-label" id=${t} for=${this.labelNamesControl?e:o}>
            ${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}
          </label>`:o}
      <slot></slot>
      ${i.length>0?s`<div class="frame-messages">
            ${this.hint?s`<span id=${`${e}-hint`} class="emr-hint">${this.hint}</span>`:o}
            ${this.error?s`<span id=${`${e}-error`} class="emr-error" role="alert">${this.error}</span>`:o}
            ${this.warning?s`<span id=${`${e}-warning`} class="emr-warning" role="status">${this.warning}</span>`:o}
            ${this.info?s`<span id=${`${e}-info`} class="emr-info" role="status">${this.info}</span>`:o}
            ${this.messages.map((a,l)=>{let c=a.severity==="error"?"emr-error":a.severity==="warning"?"emr-warning":"emr-info",p=a.severity==="error"?"alert":"status";return s`<span id=${`${e}-msg-${l}`} class=${c} role=${p}>${a.message}</span>`})}
          </div>`:o}
    </div>`}};D([d({type:String})],_e.prototype,"controlId",void 0);D([d({type:String})],_e.prototype,"label",void 0);D([d({type:Boolean})],_e.prototype,"labelHidden",void 0);D([d({type:Boolean})],_e.prototype,"labelNamesControl",void 0);D([d({type:String})],_e.prototype,"hint",void 0);D([d({type:String})],_e.prototype,"info",void 0);D([d({type:String})],_e.prototype,"warning",void 0);D([d({type:String})],_e.prototype,"error",void 0);D([d({attribute:!1})],_e.prototype,"messages",void 0);D([d({type:Boolean})],_e.prototype,"required",void 0);var yl=[{value:"true",label:"Yes"},{value:"false",label:"No"}],We=class extends S{constructor(){super(...arguments),this.fallbackId=sr("emr-typed-field"),this.controlId="",this.labelHidden=!1,this.readOnly=!1,this.disabled=!1,this.searchQuery="",this.searchOpen=!1,this.onFocus=()=>{this.dispatchEvent(new CustomEvent("focused",{bubbles:!0,composed:!0}))}}static{this.styles=[w,Ii]}computeLocked(e,t){return this.readOnly||this.disabled||e.readOnly||t.readOnly||t.disabled}computeDisabled(e){return this.disabled||e.disabled}change(e,t,i){this.computeLocked(e,t)||this.emitValueChange(i)}selectChoiceOption(e,t,i,r){if(this.computeLocked(e,t))return;if(r){if(e.valueType==="coded"){let l=e.options.find(p=>p.value===i),c=e.contractDef.contract.terminology[0]?.concept?.system??"urn:emr:local";this.change(e,t,l?{system:c,code:l.value,display:l.label}:null)}else this.change(e,t,i);return}if(e.valueType==="coded"){let l=Array.isArray(t.value)?t.value.filter(Fs):[];if(l.some(p=>p.code===i))this.change(e,t,l.filter(p=>p.code!==i));else{let p=e.options.find(h=>h.value===i);if(p){let h=e.contractDef.contract.terminology[0]?.concept?.system??"urn:emr:local";this.change(e,t,[...l,{system:h,code:p.value,display:p.label}])}}return}let a=Array.isArray(t.value)?t.value.filter(l=>typeof l=="string"):[];this.change(e,t,a.includes(i)?a.filter(l=>l!==i):[...a,i])}changeStatus(e,t,i){this.computeLocked(e,t)||this.dispatchEvent(new CustomEvent("statusChange",{detail:i,bubbles:!0,composed:!0}))}renderControl(e,t,i){let r=this.computeLocked(e,t),a=this.computeDisabled(t),l=t.value,c=e.label,p=!!(t.error||t.messages.some(b=>b.severity==="error")),h=p?t.error||"Invalid":"",f=e.step??(e.valueType==="integer"?1:Number((10**-(e.precision??2)).toPrecision(12))),g=b=>{b.stopPropagation(),this.change(e,t,b.detail)};if(e.valueType==="custom")return s`<slot name="custom"></slot>`;if(e.widget==="tree-select"){let b=typeof l=="string"?l:null,x=Array.isArray(l)?l.filter(C=>typeof C=="string"):b?[b]:[];return s`<emr-tree-select
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .placeholder=${e.placeholder||"Select\u2026"}
        .nodes=${e.treeNodes}
        .multiple=${e.repeats}
        .value=${b}
        .selectedIds=${x}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-tree-select>`}if(e.widget==="combobox"){let b=typeof l=="string"?l:null;return s`<emr-combobox
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .options=${e.options}
        .value=${b}
        .placeholder=${e.placeholder||"Select or type\u2026"}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-combobox>`}if(e.widget==="tag-input"){let b=Array.isArray(l)?l.filter(x=>typeof x=="string"):typeof l=="string"&&l?[l]:[];return s`<emr-tag-input
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .value=${b}
        .suggestions=${e.options.map(x=>x.label)}
        .placeholder=${e.placeholder||"Add tag\u2026"}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-tag-input>`}if(e.widget==="image-upload"){let b=Array.isArray(l)?l:[];return s`<emr-image-upload
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .items=${b}
        .multiple=${e.repeats}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${x=>{x.stopPropagation(),this.change(e,t,x.detail)}}
        @focusin=${this.onFocus}
      ></emr-image-upload>`}if(e.widget==="slider")return s`<emr-slider
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .value=${typeof l=="number"?l:null}
        .min=${e.min??0}
        .max=${e.max??100}
        .step=${f}
        .unit=${e.unit}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-slider>`;if(e.widget==="masked")return s`<emr-masked-input
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .value=${typeof l=="string"?l:null}
        .mask=${e.mask}
        .placeholder=${e.placeholder}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-masked-input>`;if(e.widget==="otp")return s`<emr-otp-input
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .value=${typeof l=="string"?l:""}
        .length=${e.max??6}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-otp-input>`;if(e.valueType==="annotation"&&e.widget!=="signature")return s`<slot name="custom"></slot>`;if(e.widget==="signature"){let b=Array.isArray(l)?l:[];return s`<emr-signature-capture-field
        .controlId=${i}
        .labelHidden=${!0}
        .model=${{label:c,strokes:b,readOnly:r}}
        @intent=${x=>{x.stopPropagation(),!r&&(x.detail.type==="strokeAdded"?this.change(e,t,[...b,x.detail.stroke]):x.detail.type==="clearRequested"&&this.change(e,t,[]))}}
        @focusin=${this.onFocus}
      ></emr-signature-capture-field>`}if(e.valueType==="multiline"||e.valueType==="text"&&e.widget==="textarea"){let b=typeof l=="string"?l:null;return s`<emr-textarea
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .rows=${e.rows}
        .value=${r?I(b):b}
        .placeholder=${e.placeholder}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-textarea>`}if(e.valueType==="partial-date"){let b=Rd(l)?l:null;return s`<emr-partial-date-field
        .controlId=${i}
        .labelHidden=${!0}
        .model=${{label:c,value:b,readOnly:r}}
        @intent=${x=>{x.stopPropagation(),!r&&(x.detail.type==="valueChangeRequested"?this.change(e,t,x.detail.value):x.detail.type==="precisionChangeRequested"&&this.change(e,t,{value:b?.value??"",precision:x.detail.precision}))}}
        @focusin=${this.onFocus}
      ></emr-partial-date-field>`}if(e.valueType==="scale"){let b=typeof l=="number"?l:null;return s`<emr-scale-field
        .controlId=${i}
        .labelHidden=${!0}
        .model=${{label:c,variant:e.widget==="vas"?"vas":"likert",min:e.min??0,max:e.max??(e.widget==="vas"?100:10),step:e.step??1,anchors:e.anchors,optionTones:e.optionTones,value:b,readOnly:r}}
        @intent=${x=>{x.stopPropagation(),!r&&x.detail.type==="valueChangeRequested"&&this.change(e,t,x.detail.value)}}
        @focusin=${this.onFocus}
      ></emr-scale-field>`}if(e.valueType==="attachment"){let b=Array.isArray(l)?l:[];return s`<emr-attachment-field
        .controlId=${i}
        .labelHidden=${!0}
        .model=${{label:c,items:b,readOnly:r}}
        @intent=${x=>{if(x.stopPropagation(),r)return;let C=x.detail;if(C.type==="filesSelected"){let A=C.files.map((q,E)=>({id:`${i}-att-${b.length+E+1}`,title:q.name,contentType:q.mimeType||"application/octet-stream",sizeBytes:q.sizeBytes}));this.change(e,t,[...b,...A])}else C.type==="itemRemoveRequested"&&this.change(e,t,b.filter(A=>A.id!==C.id))}}
        @focusin=${this.onFocus}
      ></emr-attachment-field>`}if(e.valueType==="integer"||e.valueType==="decimal"){let b=typeof l=="number"?l:null;return e.widget==="stepper"?s`<emr-numeric-stepper
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .value=${b}
          .min=${e.min}
          .max=${e.max}
          .step=${f}
          .precision=${e.valueType==="integer"?0:e.precision}
          .unit=${e.unit}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-numeric-stepper>`:e.widget==="vas"?s`<emr-vas
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .value=${b}
          .min=${e.min??0}
          .max=${e.max??100}
          .step=${f}
          .anchors=${e.anchors}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-vas>`:e.widget==="likert"?s`<emr-likert
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .value=${b}
          .min=${e.min??0}
          .max=${e.max??10}
          .anchors=${e.anchors}
          .optionTones=${e.optionTones}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-likert>`:s`<emr-number-input
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .mode=${e.valueType==="integer"?"integer":"decimal"}
        .value=${r?I(b):b}
        .min=${e.min}
        .max=${e.max}
        .step=${f}
        .unit=${e.unit}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-number-input>`}if(e.valueType==="date"||e.valueType==="time"||e.valueType==="datetime"){let b=typeof l=="string"?l:null;return e.valueType==="date"?s`<emr-date-input
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .value=${r?I(b):b}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-date-input>`:e.valueType==="datetime"?s`<emr-datetime-input
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .value=${r?I(b):b}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-datetime-input>`:s`<emr-time-input
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .value=${r?I(b):b}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-time-input>`}if(e.valueType==="boolean"){if(e.widget==="toggle")return s`<emr-toggle
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .checked=${l===!0}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-toggle>`;if(e.widget==="segmented"){let b=yl.map(x=>({value:x.value,label:x.label}));return s`<emr-segmented-control
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .options=${b}
          .value=${typeof l=="boolean"?String(l):null}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${x=>{x.stopPropagation(),this.change(e,t,x.detail==="true")}}
          @focusin=${this.onFocus}
        ></emr-segmented-control>`}return e.widget==="radio"?s`<emr-radio-group
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .options=${yl}
          .value=${typeof l=="boolean"?String(l):null}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${b=>{b.stopPropagation(),this.change(e,t,b.detail==="true")}}
          @focusin=${this.onFocus}
        ></emr-radio-group>`:s`<emr-checkbox
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .checked=${l===!0}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-checkbox>`}if(e.valueType==="coded"){let b=Fs(l)?l:null,x=Array.isArray(l)?l.filter(Fs):b?[b]:[],C=b?.code??(typeof l=="string"?l:null),A=x.length>0?x.map(L=>L.code):Array.isArray(l)?l.filter(L=>typeof L=="string"):[];if(e.options.length>0&&e.widget!=="search"&&e.widget!=="search-select"){if(e.widget==="radio"&&!e.repeats)return s`<emr-radio-group
            .controlId=${i}
            .label=${c}
            .labelHidden=${!0}
            .options=${e.options}
            .value=${C}
            .error=${h}
            .readOnly=${r}
            .disabled=${a}
            @valueChange=${L=>{L.stopPropagation(),this.selectChoiceOption(e,t,L.detail,!0)}}
            @focusin=${this.onFocus}
          ></emr-radio-group>`;if(e.widget==="segmented"&&!e.repeats){let L=e.options.map(N=>({value:N.value,label:N.label,disabled:N.disabled}));return s`<emr-segmented-control
            .controlId=${i}
            .label=${c}
            .labelHidden=${!0}
            .options=${L}
            .value=${C}
            .error=${h}
            .readOnly=${r}
            .disabled=${a}
            @valueChange=${N=>{N.stopPropagation(),this.selectChoiceOption(e,t,N.detail,!0)}}
            @focusin=${this.onFocus}
          ></emr-segmented-control>`}return e.widget==="select"&&!e.repeats?s`<emr-select
            .controlId=${i}
            .label=${c}
            .labelHidden=${!0}
            .options=${e.options}
            .value=${C}
            .allowClear=${!0}
            .invalid=${p}
            .readOnly=${r}
            .disabled=${a}
            @valueChange=${L=>{L.stopPropagation(),L.detail?this.selectChoiceOption(e,t,L.detail,!0):this.change(e,t,null)}}
            @focusin=${this.onFocus}
          ></emr-select>`:e.widget==="checkbox"&&e.repeats?s`<emr-checkbox-group
            .controlId=${i}
            .label=${c}
            .labelHidden=${!0}
            .options=${e.options}
            .value=${A}
            .error=${h}
            .readOnly=${r}
            .disabled=${a}
            @valueChange=${L=>{L.stopPropagation();let N=e.contractDef.contract.terminology[0]?.concept?.system??"urn:emr:local",F=L.detail.flatMap(pe=>{let V=e.options.find(Pe=>Pe.value===pe);return V?[{system:N,code:V.value,display:V.label}]:[]});this.change(e,t,F)}}
            @focusin=${this.onFocus}
          ></emr-checkbox-group>`:s`<div
          class="field-options"
          role=${e.repeats?"group":"radiogroup"}
          aria-label=${c}
          @focusin=${this.onFocus}
        >
          ${e.options.map(L=>{let N=e.repeats?A.includes(L.value):C===L.value;return s`<button
              type="button"
              class="emr-btn emr-btn--secondary"
              aria-pressed=${String(N)}
              ?disabled=${r||!!L.disabled}
              @click=${()=>this.selectChoiceOption(e,t,L.value,!e.repeats)}
            >${L.label}</button>`})}
        </div>`}let q=e.contractDef.contract.terminology[0]?.concept?.system??"urn:emr:local",E=e.options.filter(L=>!this.searchQuery||L.label.toLowerCase().includes(this.searchQuery.toLowerCase())||L.value.toLowerCase().includes(this.searchQuery.toLowerCase())).map(L=>({system:q,code:L.value,display:L.label}));return s`<emr-coded-input
        .controlId=${i}
        .labelHidden=${!0}
        .model=${{definition:e.contractDef,value:e.repeats?x:b,query:this.searchQuery,options:E,open:this.searchOpen,loading:!1,messages:[],readOnly:r,emptyMessage:"No matches"}}
        @intent=${L=>{if(L.stopPropagation(),r)return;let N=L.detail;switch(N.type){case"openRequested":this.searchOpen=!0;break;case"closeRequested":this.searchOpen=!1;break;case"queryChangeRequested":this.searchQuery=N.query,this.searchOpen=!0;break;case"conceptSelected":{let F=N.concept;this.searchOpen=!1,this.searchQuery="",e.repeats?x.some(V=>V.code===F.code&&V.system===F.system)||this.change(e,t,[...x,F]):this.change(e,t,F);break}case"conceptRemoveRequested":{let{code:F,system:pe}=N;e.repeats?this.change(e,t,x.filter(V=>!(V.code===F&&V.system===pe))):this.change(e,t,null);break}default:break}}}
        @focusin=${this.onFocus}
      ></emr-coded-input>`}if(e.valueType==="select"||e.valueType==="multiselect"){let b=e.valueType==="select",x=typeof l=="string"?l:null,C=Array.isArray(l)?l.filter(A=>typeof A=="string"):[];if(b&&e.widget==="radio")return s`<emr-radio-group
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .options=${e.options}
          .value=${x}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-radio-group>`;if(b&&e.widget==="segmented"){let A=e.options.map(q=>({value:q.value,label:q.label,disabled:q.disabled}));return s`<emr-segmented-control
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .options=${A}
          .value=${x}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-segmented-control>`}if(e.widget==="search"||e.widget==="search-select"){let A=e.options.filter(E=>!this.searchQuery||E.label.toLowerCase().includes(this.searchQuery.toLowerCase())),q=b?e.options.filter(E=>E.value===x):e.options.filter(E=>C.includes(E.value));return s`<emr-search-select
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .placeholder=${e.placeholder||"Search\u2026"}
          .query=${this.searchQuery}
          .options=${A}
          .selected=${q}
          .multiple=${!b}
          .open=${this.searchOpen}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @openRequested=${()=>{r||(this.searchOpen=!0)}}
          @closeRequested=${()=>{this.searchOpen=!1}}
          @queryChange=${E=>{E.stopPropagation(),r||(this.searchQuery=E.detail,this.searchOpen=!0)}}
          @optionSelected=${E=>{E.stopPropagation(),this.searchOpen=!1,this.searchQuery="",this.selectChoiceOption(e,t,E.detail,b)}}
          @selectionRemoved=${E=>{E.stopPropagation(),b?this.change(e,t,null):this.change(e,t,C.filter(L=>L!==E.detail))}}
          @valueChange=${E=>E.stopPropagation()}
          @focusin=${this.onFocus}
        ></emr-search-select>`}return!b&&e.widget==="checkbox"?s`<emr-checkbox-group
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .options=${e.options}
          .value=${C}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${A=>{A.stopPropagation(),this.change(e,t,A.detail)}}
          @focusin=${this.onFocus}
        ></emr-checkbox-group>`:b&&(e.widget==="select"||e.options.length>6)?s`<emr-select
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .options=${e.options}
          .value=${x}
          .allowClear=${!0}
          .invalid=${p}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${g}
          @focusin=${this.onFocus}
        ></emr-select>`:s`<div
        class="field-options"
        role=${b?"radiogroup":"group"}
        aria-label=${c}
        @focusin=${this.onFocus}
      >
        ${e.options.map(A=>{let q=b?l===A.value:C.includes(A.value);return s`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${String(q)}
            ?disabled=${r||!!A.disabled}
            @click=${()=>this.selectChoiceOption(e,t,A.value,b)}
          >${A.label}</button>`})}
      </div>`}if(e.valueType==="quantity"){let b=l&&typeof l=="object"&&!Array.isArray(l)&&"value"in l&&"unit"in l?l:null,x=b?.unit??e.unit;return s`<div class="field-stack">
        <emr-number-input
          .controlId=${i}
          .label=${c}
          .labelHidden=${!0}
          .value=${r?I(b?.value??null):b?.value??null}
          .min=${e.min}
          .max=${e.max}
          .step=${f}
          .unit=${x}
          .error=${h}
          .readOnly=${r}
          .disabled=${a}
          @valueChange=${C=>{C.stopPropagation(),this.change(e,t,{value:C.detail,unit:x})}}
          @focusin=${this.onFocus}
        ></emr-number-input>
      </div>`}if(e.widget==="search"){let b=typeof l=="string"?l:null;return s`<emr-search-input
        .controlId=${i}
        .label=${c}
        .labelHidden=${!0}
        .value=${r?I(b):b}
        .placeholder=${e.placeholder||"Search\u2026"}
        .error=${h}
        .readOnly=${r}
        .disabled=${a}
        @valueChange=${g}
        @focusin=${this.onFocus}
      ></emr-search-input>`}let v=typeof l=="string"?l:"";return s`<emr-text-input
      .controlId=${i}
      .label=${c}
      .labelHidden=${!0}
      .value=${r?I(v):v}
      .placeholder=${e.placeholder}
      .error=${h}
      .readOnly=${r}
      .disabled=${a}
      @valueChange=${g}
      @focusin=${this.onFocus}
    ></emr-text-input>`}render(){if(!this.definition)return o;let e=Id(this.definition),t=Cd(this.model,e.defaultValue),i=this.controlId||e.id||this.fallbackId,r=this.computeLocked(e,t),a=t.requiredOverride??e.required,l=e.assessmentStatusOptions,c=l.find(p=>p.value===t.status);return s`<emr-field-frame
      .controlId=${i}
      .label=${e.label}
      .labelHidden=${this.labelHidden}
      .hint=${e.hint}
      .info=${t.info}
      .warning=${t.warning}
      .error=${t.error}
      .messages=${t.messages}
      ?required=${a}
    >
      <div class="field-stack">
        ${this.renderControl(e,t,i)}
        ${t.status?s`<span class=${`emr-badge emr-badge--${c?.tone??"neutral"}`}>
              ${c?.label??t.status}
            </span>`:o}
        ${l.length>0?s`<div class="field-options" role="group" aria-label="Assessment status">
              ${l.map(p=>s`<button
                  type="button"
                  class="emr-btn emr-btn--secondary emr-btn--sm"
                  aria-pressed=${String(t.status===p.value)}
                  ?disabled=${r}
                  @click=${()=>this.changeStatus(e,t,t.status===p.value?void 0:p.value)}
                >${p.label}</button>`)}
            </div>`:o}
      </div>
    </emr-field-frame>`}};D([d({type:String})],We.prototype,"controlId",void 0);D([d({type:Boolean})],We.prototype,"labelHidden",void 0);D([d({attribute:!1})],We.prototype,"definition",void 0);D([d({attribute:!1})],We.prototype,"model",void 0);D([d({type:Boolean})],We.prototype,"readOnly",void 0);D([d({type:Boolean})],We.prototype,"disabled",void 0);D([T()],We.prototype,"searchQuery",void 0);D([T()],We.prototype,"searchOpen",void 0);var ki=class extends S{constructor(){super(...arguments),this.fallbackId=sr("emr-coded-input"),this.controlId="",this.labelHidden=!1,this.searchRequested=e=>{if(e.key==="Escape"){this.intent({type:"closeRequested"});return}if(e.key!=="Enter")return;e.preventDefault();let i=this.model?.definition?.contract?.terminology?.find(r=>r.role==="answer-value-set")?.valueSetCanonical;this.intent({type:"searchRequested",query:this.model?.query??"",...i!==void 0?{valueSetCanonical:i}:{}})}}static{this.styles=[w,Ii]}get locked(){return!!this.model?.readOnly||!!this.model?.definition?.contract?.readOnly}intent(e){this.locked||this.emitIntent(e)}render(){let e=this.model;if(!e)return o;let t=this.controlId||e.definition?.contract?.linkId||this.fallbackId,i=e.definition?.presentation?.label??e.definition?.contract?.linkId??"Coded value",r=e.definition?.presentation?.hint??"",a=e.definition?.presentation?.placeholder??(r||"Search by name or code"),l=(e.definition?.contract?.cardinality?.min??0)>=1,c=Array.isArray(e.value)?e.value:e.value?[e.value]:[],p=e.messages??[],h=e.definition?.presentation?.assessmentStatusOptions??[],f=h.find(g=>g.value===e.status);return s`<div class="emr-field">
      ${this.labelHidden?o:s`<label class="emr-label" for=${`${t}-search`}>
            ${i}${l?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}
          </label>`}
      ${c.length>0?s`<ul class="coded-chips" aria-label=${`${i} selected`}>
            ${c.map(g=>{let v=e.systemLabels?.[g.system]??g.system;return s`<li class="coded-chip">
                <span class="coded-chip-body">
                  <span class="coded-chip-display">${g.display}</span>
                  <span class="coded-chip-meta">${v} (${g.code})</span>
                </span>
                ${this.locked?o:s`<button
                      type="button"
                      class="coded-chip-remove"
                      aria-label=${`Remove ${g.display}`}
                      @click=${()=>this.intent({type:"conceptRemoveRequested",code:g.code,system:g.system})}
                    >×</button>`}
              </li>`})}
          </ul>`:o}
      <input
        id=${`${t}-search`}
        class="emr-control"
        type="search"
        .value=${this.locked?I(e.query):e.query}
        placeholder=${a}
        ?readonly=${this.locked}
        ?disabled=${this.locked}
        aria-label=${i}
        @focus=${()=>this.intent({type:"openRequested"})}
        @blur=${g=>{g.target.value=this.model?.query??""}}
        @input=${g=>{if(this.locked){g.target.value=e.query;return}this.intent({type:"queryChangeRequested",query:g.target.value})}}
        @keydown=${this.searchRequested}
      />
      ${!this.labelHidden&&r?s`<span class="emr-hint">${r}</span>`:o}
      ${e.loading?s`<span class="emr-hint" role="status">Searching…</span>`:o}
      ${e.open&&e.options.length>0?s`<div class="field-options" role="listbox" aria-label=${`${i} options`}>
            ${e.options.map(g=>s`<button
                type="button"
                role="option"
                class="emr-btn emr-btn--secondary"
                ?disabled=${this.locked}
                @click=${()=>this.intent({type:"conceptSelected",concept:g})}
              >${g.display} (${g.code})</button>`)}
          </div>`:o}
      ${e.open&&!e.loading&&!e.options.length?s`<span class="emr-hint" role="status">${e.emptyMessage}</span>`:o}
      ${e.status||h.length>0&&!this.locked?s`<div class="field-options">
            ${e.status?s`<span class=${`emr-badge emr-badge--${f?.tone??"neutral"}`} role="status">
                  ${f?.label??e.status}
                </span>`:o}
            ${h.length>0&&!this.locked?s`<select
                  class="emr-control status-select"
                  aria-label=${`${i} assessment status`}
                  .value=${I(e.status??"")}
                  @change=${g=>{let v=g.target,b=v.value;v.value=e.status??"",this.intent({type:"statusChangeRequested",status:b||void 0})}}
                  @blur=${g=>{g.target.value=this.model?.status??""}}
                >
                  <option value="" ?selected=${!e.status}>Status not set</option>
                  ${h.map(g=>s`<option value=${g.value} ?selected=${e.status===g.value}>
                      ${g.label}
                    </option>`)}
                </select>`:o}
            ${e.status&&!this.locked?s`<button
                  type="button"
                  class="emr-btn emr-btn--ghost emr-btn--sm"
                  aria-label=${`Clear status: ${i}`}
                  @click=${()=>this.intent({type:"statusChangeRequested",status:void 0})}
                >Clear status</button>`:o}
          </div>`:o}
      ${p.map(g=>{let v=g.severity==="error"?"emr-error":g.severity==="warning"?"emr-warning":"emr-info";return s`<span class=${v} role=${g.severity==="error"?"alert":"status"}>
          ${g.message}
        </span>`})}
    </div>`}};D([d({type:String})],ki.prototype,"controlId",void 0);D([d({type:Boolean})],ki.prototype,"labelHidden",void 0);D([d({attribute:!1})],ki.prototype,"model",void 0);var rr=class extends S{constructor(){super(...arguments),this.controlId="",this.selectSignatory=e=>{let t=e.target,i=t.value;t.value="",!(!this.model||this.model.readOnly||!this.model.canSign||!i)&&this.emitIntent({type:"signatorySelected",signatoryId:i})},this.requestSign=()=>{this.model&&!this.model.readOnly&&this.model.canSign&&this.emitIntent({type:"signRequested"})},this.requestAmend=()=>{this.model&&!this.model.readOnly&&this.model.canAmend&&this.emitIntent({type:"amendRequested"})}}static{this.styles=[w,Ii]}render(){let e=this.model;return e?s`<section class="emr-card" role="region" aria-label=${e.title||"Signatures"}>
      <div class="emr-header">
        <h4 class="emr-title">${e.title??"Attestation"}</h4>
      </div>
      ${e.statement?s`<p class="emr-muted">${e.statement}</p>`:o}
      ${e.signatories.length>0?s`<ul class="signatory-list" aria-label="Signatories">
            ${e.signatories.map(t=>s`<li class="signatory-row">
                <span class="signatory-name">${t.displayName}</span>
                <span class="emr-muted">${t.roleLabel}</span>
                <span class=${`emr-badge emr-badge--${t.status.tone}`}>${t.status.label}</span>
                <span class="emr-muted">Signed: ${t.signedAtLabel||"Not supplied"}</span>
              </li>`)}
          </ul>`:o}
      ${e.error?s`<span class="emr-error" role="alert">${e.error}</span>`:o}
      ${!e.readOnly&&e.canSign&&e.signatories.length>0?s`<select class="emr-control status-select" aria-label="Signatory" @change=${this.selectSignatory}>
            <option value="" selected disabled>Select signatory</option>
            ${e.signatories.map(t=>s`<option value=${t.id}>${t.displayName} (${t.roleLabel})</option>`)}
          </select>`:o}
      <div class="field-options">
        ${!e.readOnly&&e.canSign?s`<button type="button" class="emr-btn" @click=${this.requestSign}>${e.signLabel??"Sign"}</button>`:o}
        ${!e.readOnly&&e.canAmend?s`<button type="button" class="emr-btn emr-btn--outline" @click=${this.requestAmend}>
              ${e.amendLabel??"Amend"}
            </button>`:o}
      </div>
    </section>`:o}};D([d({type:String})],rr.prototype,"controlId",void 0);D([d({attribute:!1})],rr.prototype,"model",void 0);var ce=class extends S{constructor(){super(...arguments),this.fallbackId=sr("emr-schedule-slot-picker"),this.label="When to take",this.hint="",this.error="",this.required=!1,this.controlId="",this.readOnly=!1,this.disabled=!1,this.slots=[],this.presets=[],this.value=null,this.unitLabel="",this.amountMode="numeric",this.defaultAmount=1,this.defaultAmountLabel=""}static{this.styles=[w,Ii]}get amountKind(){return this.amountMode==="label"?"label":"number"}set amountKind(e){this.amountMode=e==="label"?"label":"numeric"}get locked(){return this.readOnly||this.disabled}get seed(){return this.amountMode==="numeric"?{amount:this.defaultAmount}:{amount:null,amountLabel:this.defaultAmountLabel}}emit(e){this.locked||this.emitValueChange(e)}toggle(e,t){let i=Us(this.slots,(r,a)=>r.id!==e.id?a:t?a??this.seed:void 0,this.value);this.emit(i)}updateSlotAmount(e,t){let i=Us(this.slots,(r,a)=>a&&r.id===e?{...a,...t}:a,this.value);this.emit(i)}applyPreset(e){let t=Us(this.slots,(i,r)=>e.slotIds.includes(i.id)?r??this.seed:void 0,this.value);this.emit(t)}render(){let e=this.controlId||this.fallbackId,t=new Map((this.value??[]).map(r=>[r.id,r])),i=`${e}-message`;return s`<div
      class="emr-field"
      role="group"
      aria-label=${this.label}
      aria-describedby=${this.error||this.hint?i:o}
      aria-required=${String(this.required)}
    >
      <div class="emr-header">
        <span class="emr-label">
          ${this.label}${this.required?s`<span class="emr-error" aria-hidden="true"> *</span>`:o}
        </span>
        ${this.presets.length>0&&!this.readOnly?s`<div class="field-options" role="group" aria-label=${`${this.label} presets`}>
              ${this.presets.map(r=>{let a=Od(this.value,r);return s`<button
                  type="button"
                  class="emr-btn emr-btn--secondary emr-btn--sm"
                  aria-pressed=${String(a)}
                  ?disabled=${this.locked}
                  @click=${()=>this.applyPreset(r)}
                >${r.label}</button>`})}
            </div>`:o}
      </div>
      <div class="slot-line" role="list">
        ${this.slots.map(r=>{let a=t.get(r.id),l=!!a,c=this.unitLabel?`${r.label} amount in ${this.unitLabel}`:`${r.label} amount`;return this.readOnly?s`<div role="listitem" class=${`slot-tile${l?" slot-tile--on":""}`}>
              <div class="slot-header">
                <strong>${r.label}</strong>
                ${r.timeHint?s`<span class="emr-muted">${r.timeHint}</span>`:o}
              </div>
              <span class=${l?"emr-label":"emr-muted"}>
                ${a?Ad(a,this.unitLabel):`0${this.unitLabel?` ${this.unitLabel}`:""}`}
              </span>
            </div>`:s`<div role="listitem" class=${`slot-tile${l?" slot-tile--on":""}`}>
            <div class="slot-header">
              <button
                id=${`${e}-${r.id}`}
                type="button"
                role="checkbox"
                class="slot-toggle-btn"
                aria-checked=${String(l)}
                aria-label=${r.timeHint?`${r.label} (${r.timeHint})`:r.label}
                ?disabled=${this.disabled}
                @click=${()=>this.toggle(r,!l)}
              >
                ${l?R("check",14):o}
                <span>${r.label}</span>
              </button>
              ${r.timeHint?s`<span class="emr-muted">${r.timeHint}</span>`:o}
            </div>
            <div class="slot-amount-wrap">
              ${a?this.amountMode==="numeric"?s`<emr-number-input
                      .controlId=${`${e}-${r.id}-amount`}
                      .label=${c}
                      .labelHidden=${!0}
                      .min=${0}
                      .step=${.5}
                      .value=${a.amount}
                      .unit=${this.unitLabel}
                      .disabled=${this.disabled}
                      .readOnly=${this.locked}
                      @valueChange=${p=>{p.stopPropagation(),this.updateSlotAmount(r.id,{amount:p.detail})}}
                    ></emr-number-input>`:s`<emr-text-input
                      .controlId=${`${e}-${r.id}-amount`}
                      .label=${c}
                      .labelHidden=${!0}
                      .value=${a.amountLabel??""}
                      .disabled=${this.disabled}
                      .readOnly=${this.locked}
                      @valueChange=${p=>{p.stopPropagation(),this.updateSlotAmount(r.id,{amount:null,amountLabel:p.detail??""})}}
                    ></emr-text-input>`:s`<span class="slot-unticked-pill">
                    0${this.unitLabel?` ${this.unitLabel}`:""}
                  </span>`}
            </div>
          </div>`})}
      </div>
      ${this.hint?s`<span id=${`${e}-hint`} class="emr-hint">${this.hint}</span>`:o}
      ${this.error?s`<span id=${i} class="emr-error" role="alert">${this.error}</span>`:o}
    </div>`}};D([d({type:String})],ce.prototype,"label",void 0);D([d({type:String})],ce.prototype,"hint",void 0);D([d({type:String})],ce.prototype,"error",void 0);D([d({type:Boolean})],ce.prototype,"required",void 0);D([d({type:String})],ce.prototype,"controlId",void 0);D([d({type:Boolean})],ce.prototype,"readOnly",void 0);D([d({type:Boolean})],ce.prototype,"disabled",void 0);D([d({attribute:!1})],ce.prototype,"slots",void 0);D([d({attribute:!1})],ce.prototype,"presets",void 0);D([d({attribute:!1})],ce.prototype,"value",void 0);D([d({type:String})],ce.prototype,"unitLabel",void 0);D([d({type:String})],ce.prototype,"amountMode",void 0);D([d({type:Number})],ce.prototype,"defaultAmount",void 0);D([d({type:String})],ce.prototype,"defaultAmountLabel",void 0);D([d({type:String})],ce.prototype,"amountKind",null);var ar=class extends S{constructor(){super(...arguments),this.fallbackId=sr("emr-identifier-entry"),this.controlId="",this.onRadioKeyDown=e=>{let t=this.model?.typeOptions??[];if(!t.length||this.model?.readOnly||!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))return;let i=e.currentTarget,r=Array.from(i.querySelectorAll('button[role="radio"]')),a=r.indexOf(e.target);if(a<0)return;e.preventDefault();let l=e.key==="Home"?0:e.key==="End"?t.length-1:(a+(e.key==="ArrowRight"||e.key==="ArrowDown"?1:-1)+t.length)%t.length;r[l]?.focus();let c=t[l];c&&this.emitIntent({type:"typeSelected",id:c.id})}}static{this.styles=[w,Ii]}render(){let e=this.model;if(!e)return o;let t=!!e.readOnly,i=this.controlId||this.id||this.fallbackId,r=`${i}-message`,a=!!(e.error||e.warning||e.hint);return s`<div class="emr-field">
      <label class="emr-label" for=${`${i}-value`}>${e.label}</label>
      ${e.typeOptions&&e.typeOptions.length>0?s`<div
            class="field-options"
            role="radiogroup"
            aria-label=${`${e.label}: Identifier type`}
            aria-readonly=${t?"true":o}
            @keydown=${this.onRadioKeyDown}
          >
            ${e.typeOptions.map(l=>{let c=e.selectedType===l.id;return s`<button
                type="button"
                role="radio"
                class="type-radio-btn"
                aria-checked=${String(c)}
                aria-readonly=${t?"true":o}
                @click=${()=>{this.model?.readOnly||this.emitIntent({type:"typeSelected",id:l.id})}}
              >${l.label}</button>`})}
          </div>`:o}
      <div class="ident-row">
        <input
          id=${`${i}-value`}
          class="emr-control ident-input"
          autocomplete="off"
          spellcheck="false"
          .value=${t?I(e.value):e.value}
          ?readonly=${t}
          ?disabled=${t}
          aria-label=${e.label}
          aria-invalid=${e.error?"true":"false"}
          aria-describedby=${a?r:o}
          @input=${l=>{if(this.model?.readOnly){l.target.value=this.model.value;return}this.emitIntent({type:"valueChanged",raw:l.target.value})}}
          @blur=${l=>{l.target.value=this.model?.value??""}}
        />
        ${t?o:s`<button
              type="button"
              class="emr-btn emr-btn--outline"
              aria-label=${`Scan: ${e.label}`}
              @click=${()=>{this.model?.readOnly||this.emitIntent({type:"scanRequested"})}}
            >Scan</button>`}
      </div>
      ${e.normalisedValue?s`<span class="emr-info" aria-live="polite">✓ Normalised: ${e.normalisedValue}</span>`:o}
      ${e.hint?s`<span id=${e.error||e.warning?`${i}-hint`:r} class="emr-hint">${e.hint}</span>`:o}
      ${e.error?s`<span id=${r} class="emr-error" role="alert">${e.error}</span>`:e.warning?s`<span id=${r} class="emr-warning" role="status">${e.warning}</span>`:o}
    </div>`}};D([d({type:String})],ar.prototype,"controlId",void 0);D([d({attribute:!1})],ar.prototype,"model",void 0);function Wr(){bl(),y("emr-field-frame",_e),y("emr-typed-field",We),y("emr-coded-input",ki),y("emr-attestation",rr),y("emr-schedule-slot-picker",ce),y("emr-identifier-entry",ar),fl()}var vl=(n,e,t)=>{let i=new Map;for(let r=e;r<=t;r++)i.set(n[r],r);return i},Ke=kr(class extends Jt{constructor(n){if(super(n),n.type!==at.CHILD)throw Error("repeat() can only be used in text expressions")}dt(n,e,t){let i;t===void 0?t=e:e!==void 0&&(i=e);let r=[],a=[],l=0;for(let c of n)r[l]=i?i(c,l):l,a[l]=t(c,l),l++;return{values:a,keys:r}}render(n,e,t){return this.dt(n,e,t).values}update(n,[e,t,i]){let r=qn(n),{values:a,keys:l}=this.dt(e,t,i);if(!Array.isArray(r))return this.ut=l,a;let c=this.ut??=[],p=[],h,f,g=0,v=r.length-1,b=0,x=a.length-1;for(;g<=v&&b<=x;)if(r[g]===null)g++;else if(r[v]===null)v--;else if(c[g]===l[b])p[b]=vt(r[g],a[b]),g++,b++;else if(c[v]===l[x])p[x]=vt(r[v],a[x]),v--,x--;else if(c[g]===l[x])p[x]=vt(r[g],a[x]),ei(n,p[x+1],r[g]),g++,x--;else if(c[v]===l[b])p[b]=vt(r[v],a[b]),ei(n,r[g],r[v]),v--,b++;else if(h===void 0&&(h=vl(l,b,x),f=vl(c,g,v)),h.has(c[g]))if(h.has(c[v])){let C=f.get(l[b]),A=C!==void 0?r[C]:null;if(A===null){let q=ei(n,r[g]);vt(q,a[b]),p[b]=q}else p[b]=vt(A,a[b]),ei(n,r[g],A),r[C]=null;b++}else Cr(r[v]),v--;else Cr(r[g]),g++;for(;b<=x;){let C=ei(n,p[x+1]);vt(C,a[b]),p[b++]=C}for(;g<=v;){let C=r[g++];C!==null&&Cr(C)}return this.ut=l,Ir(n,p),Ae}});var B=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},tt=M`
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
  [data-density="compact"] th, [data-density="compact"] td {
    padding-block: 4px;
  }
  .toolbar-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .field-stack {
    display: grid;
    gap: 12px;
  }
  .section-content[data-collapsed] {
    display: none;
  }
  @media print {
    .section-content[data-collapsed] { display: block; }
    .section-toggle { display: none; }
  }
`;function Ci(n){if(!n?.hidden)return!0;let e=n.value;return e!==null&&e!==""&&(!Array.isArray(e)||e.length>0)}function Gs(n,e){return!n&&!e?.readOnly&&!e?.disabled}function Ys(n,e,t,i,r){return s`<emr-typed-field
    .definition=${n}
    .model=${e}
    .controlId=${t}
    .readOnly=${i}
    @valueChange=${a=>{a.stopPropagation(),r.canEdit()&&r.edit(a.detail)}}
    @statusChange=${a=>{a.stopPropagation(),r.canEdit()&&r.status(a.detail)}}
    @focused=${a=>{a.stopPropagation(),r.focus()}}
  ></emr-typed-field>`}var mt=class extends S{constructor(){super(...arguments),this.title="",this.description="",this.sectionId="",this.collapsible=!1,this.collapsed=!1}static{this.styles=[w,tt]}render(){return s`<section class="emr-card" part="section">
      <header class="emr-header">
        <div>
          <h3 class="emr-title">${this.collapsible?s`<span>${this.title}</span>
                <button type="button" class="emr-btn emr-btn--small section-toggle"
                  aria-expanded=${!this.collapsed}
                  aria-label=${`${this.collapsed?"Expand":"Collapse"} ${this.title}`}
                  @click=${()=>this.emitIntent({type:"toggleRequested",sectionId:this.sectionId})}>
                  ${this.collapsed?"Expand":"Collapse"}
                </button>`:this.title}</h3>
          ${this.description?s`<p class="emr-muted">${this.description}</p>`:o}
        </div>
        ${this.status?s`<emr-badge .badge=${this.status}></emr-badge>`:o}
      </header>
      <div class="section-content" ?data-collapsed=${this.collapsed}><slot></slot></div>
    </section>`}};B([d({type:String})],mt.prototype,"title",void 0);B([d({type:String})],mt.prototype,"description",void 0);B([d({attribute:!1})],mt.prototype,"status",void 0);B([d({type:String})],mt.prototype,"sectionId",void 0);B([d({type:Boolean})],mt.prototype,"collapsible",void 0);B([d({type:Boolean})],mt.prototype,"collapsed",void 0);var qt=class extends S{constructor(){super(...arguments),this.title="",this.items=[],this.idPrefix="",this.readOnly=!1}static{this.styles=[w,tt]}render(){let e=this.definition;return s`<section class="emr-card">
      <header class="emr-header">
        <h4 class="emr-title">${e?.label??this.title}</h4>
        ${e&&!this.readOnly?s`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>{this.readOnly||this.emitIntent({type:"repeatItemAddRequested",groupId:e.id})}}>${e.addLabel??"Add entry"}</button>`:o}
      </header>
      ${e?.description?s`<p class="emr-muted">${e.description}</p>`:o}
      ${e?Ke(this.items,t=>t.id,(t,i)=>{let r=this.readOnly||!!t.readOnly;return s`<article class="emr-card field-stack">
              <header class="emr-header">
                <strong>${t.label??`Entry ${i+1}`}</strong>
                ${r?o:s`<button type="button" class="emr-btn emr-btn--ghost"
                  @click=${()=>{let a=this.items.find(l=>l.id===t.id);!this.readOnly&&a&&!a.readOnly&&this.emitIntent({type:"repeatItemRemoveRequested",groupId:e.id,itemId:t.id})}}>Remove</button>`}
              </header>
              ${Ke(e.fields.filter(a=>Ci(t.fields[a.id])),a=>a.id,a=>{let l={groupId:e.id,itemId:t.id,fieldId:a.id};return Ys(a,t.fields[a.id],`${this.idPrefix}${e.id}-${t.id}-${a.id}`,r,{canEdit:()=>{let c=this.items.find(p=>p.id===t.id);return!!c&&Gs(this.readOnly||!!c.readOnly,c.fields[a.id])},edit:c=>this.emitIntent({type:"repeatItemEditRequested",...l,value:c}),status:c=>this.emitIntent({type:"repeatItemStatusEditRequested",...l,status:c}),focus:()=>this.emitIntent({type:"fieldFocused",fieldId:`${e.id}.${t.id}.${a.id}`})})})}
            </article>`}):o}
      ${e&&!this.items.length?s`<p class="emr-muted">No entries recorded.</p>`:o}
      <slot></slot>
    </section>`}};B([d({type:String})],qt.prototype,"title",void 0);B([d({attribute:!1})],qt.prototype,"definition",void 0);B([d({attribute:!1})],qt.prototype,"items",void 0);B([d({type:String})],qt.prototype,"idPrefix",void 0);B([d({type:Boolean})],qt.prototype,"readOnly",void 0);var or=class extends S{constructor(){super(...arguments),this.idPrefix=""}static{this.styles=[w,tt]}field(e,t){let i=t.id;return Ys(t,e.fields[i],`${this.idPrefix}${e.schema.id}-${i}`,!!e.readOnly,{canEdit:()=>!!this.model&&Gs(!!this.model.readOnly,this.model.fields[i]),edit:r=>this.emitIntent({type:"fieldEditRequested",fieldId:i,value:r}),status:r=>this.emitIntent({type:"fieldStatusEditRequested",fieldId:i,status:r}),focus:()=>this.emitIntent({type:"fieldFocused",fieldId:i})})}matrix(e,t){let i=t.rows.filter(r=>Object.values(r.cells).some(a=>Ci(e.fields[a.id])));return i.length?s`<div class="table-wrap">
      <table>
        <caption>${t.label}</caption>
        <thead><tr><th scope="col">Finding</th>${t.columns.map(r=>s`<th scope="col">${r.label}</th>`)}</tr></thead>
        <tbody>${Ke(i,r=>r.id,r=>s`<tr>
          <th scope="row">${r.label}</th>
          ${t.columns.map(a=>{let l=r.cells[a.id];return s`<td>${l&&Ci(e.fields[l.id])?this.field(e,l):o}</td>`})}
        </tr>`)}</tbody>
      </table>
    </div>`:o}render(){let e=this.model;if(!e)return o;let t=e.schema.sections.filter(i=>i.blocks.some(r=>r.kind==="repeatable"?!0:r.kind==="matrix"?r.rows.some(a=>Object.values(a.cells).some(l=>Ci(e.fields[l.id]))):Ci(e.fields[r.id])));return s`<form class="emr-card field-stack" novalidate aria-label=${e.schema.label} @submit=${i=>i.preventDefault()}>
      ${e.schema.description?s`<p>${e.schema.description}</p>`:o}
      ${e.correction?s`<div>
        ${e.correction.description?s`<p>${e.correction.description}</p>`:o}
        <button type="button" class="emr-btn emr-btn--outline"
          @click=${()=>this.emitIntent({type:"correctionRequested"})}>${e.correction.label}</button>
      </div>`:o}
      ${Ke(t,i=>i.id,i=>s`<emr-section-card
        .sectionId=${i.id}
        .title=${i.label}
        .description=${i.description??""}
        .status=${e.sectionStatuses?.[i.id]}
        .collapsible=${!!i.collapsible}
        .collapsed=${!!e.collapsedSectionIds?.includes(i.id)}
        @intent=${r=>{r.target===r.currentTarget&&(r.stopPropagation(),this.emitIntent({type:"sectionToggleRequested",sectionId:r.detail.sectionId}))}}
      >
        <div class="field-stack">
          ${Ke(i.blocks,r=>r.id,r=>r.kind==="matrix"?this.matrix(e,r):r.kind==="repeatable"?s`<emr-repeatable-group
              .definition=${r}
              .items=${e.repeatableGroups[r.id]??[]}
              .readOnly=${!!e.readOnly}
              .idPrefix=${`${this.idPrefix}${e.schema.id}-`}
              @intent=${a=>{a.stopPropagation(),this.model&&(!this.model.readOnly||a.detail.type==="fieldFocused")&&this.emitIntent(a.detail)}}
            ></emr-repeatable-group>`:Ci(e.fields[r.id])?this.field(e,r):o)}
        </div>
      </emr-section-card>`)}
    </form>`}};B([d({attribute:!1})],or.prototype,"model",void 0);B([d({type:String})],or.prototype,"idPrefix",void 0);var He=class extends S{constructor(){super(...arguments),this.title="Clinical list",this.items=[],this.readOnly=!1,this.allowAdd=!0,this.emptyMessage="No entries recorded."}static{this.styles=[w,tt]}itemIntent(e,t){let i=this.items.find(r=>r.id===t);i&&(e==="selected"||!this.readOnly&&!i.readOnly)&&this.emitIntent({type:e,id:t})}render(){return s`<section class="emr-card">
      <header class="emr-header">
        <h3 class="emr-title">${this.title}</h3>
        ${this.allowAdd&&!this.readOnly?s`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>{this.allowAdd&&!this.readOnly&&this.emitIntent({type:"addRequested"})}}>+ Add</button>`:o}
      </header>
      ${this.items.length?o:s`<p class="emr-muted">${this.emptyMessage}</p>`}
      <ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px;">
        ${this.items.map(e=>s`<li style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid var(--emr-border,#c7d3da);border-radius:var(--emr-radius,8px);">
            <div>
              <button type="button" class="emr-btn emr-btn--ghost" @click=${()=>this.itemIntent("selected",e.id)}>${e.title}</button>
              ${e.subtitle?s`<div class="emr-muted">${e.subtitle}</div>`:o}
              ${e.detail?s`<div>${e.detail}</div>`:o}
              <div class="toolbar-row">${e.badges?.map(t=>s`<emr-badge .badge=${t}></emr-badge>`)}</div>
            </div>
            ${!this.readOnly&&!e.readOnly?s`<div class="toolbar-row">
              <button type="button" class="emr-btn emr-btn--ghost" aria-label=${`Edit ${e.title}`}
                @click=${()=>this.itemIntent("editRequested",e.id)}>Edit</button>
              <button type="button" class="emr-btn emr-btn--ghost" aria-label=${`Remove ${e.title}`}
                @click=${()=>this.itemIntent("removeRequested",e.id)}>Remove</button>
            </div>`:o}
          </li>`)}
      </ul>
    </section>`}};B([d({type:String})],He.prototype,"title",void 0);B([d({attribute:!1})],He.prototype,"items",void 0);B([d({type:Boolean})],He.prototype,"readOnly",void 0);B([d({type:Boolean})],He.prototype,"allowAdd",void 0);B([d({type:String})],He.prototype,"emptyMessage",void 0);var Qt=class extends S{constructor(){super(...arguments),this.model={},this.customRenderers={},this.readOnly=!1}static{this.styles=[w,tt]}cell(e,t){if(e.applicableColumnIds&&!e.applicableColumnIds.includes(t.id))return o;let i=this.model[e.id]?.cells[t.id],r=this.readOnly||!!i?.readOnly,a={rowId:e.id,columnId:t.id},l=e.customRendererKey?this.customRenderers[e.customRendererKey]:void 0;if(e.type==="custom"&&l){let h={row:e,column:t,cell:i,readOnly:r,emit:(f,g)=>{let v=this.model[e.id]?.cells[t.id];!this.readOnly&&!v?.readOnly&&!v?.disabled&&this.emitIntent({type:"customCellIntent",...a,action:f,payload:g})}};return s`<emr-clinical-cell-renderer .columnId=${t.id} .cellModel=${h}
        .renderer=${l}></emr-clinical-cell-renderer>`}let c={id:`${e.id}-${t.id}`,label:`${e.label}, ${t.label}`,type:e.type,unit:e.unit,precision:e.precision,options:e.options,hint:e.helpText,assessmentStatusOptions:e.assessmentStatusOptions,customRendererKey:e.customRendererKey},p=i&&{...i,assessmentStatus:e.assessmentStatusOptions?.length?i.assessmentStatus?.value:void 0};return s`${Ys(c,p,c.id,r,{canEdit:()=>Gs(this.readOnly,this.model[e.id]?.cells[t.id]),edit:h=>{!Array.isArray(h)&&(h===null||typeof h!="object"||"value"in h&&"unit"in h)&&this.emitIntent({type:"cellEditRequested",...a,value:h})},status:h=>this.emitIntent({type:"cellAssessmentStatusEditRequested",...a,status:h??null}),focus:()=>this.emitIntent({type:"cellFocused",...a})})}
    ${i?.assessmentStatus&&!e.assessmentStatusOptions?.length?s`<emr-badge .badge=${i.assessmentStatus}></emr-badge>`:o}
    ${i?.flagBadge?s`<emr-badge .badge=${i.flagBadge}></emr-badge>`:o}
    ${i?.previousValueLabel?s`<small>${i.previousValueLabel}</small>`:o}
    ${i?.deltaLabel?s`<small>${i.deltaLabel}</small>`:o}`}render(){let e=this.definition;return e?s`<section class="emr-card">
      <h3 class="emr-title">${e.label}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Finding</th>
              ${e.columns.map(t=>s`<th scope="col">${t.label}</th>`)}
              <th scope="col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${Ke(e.rows,t=>t.id,t=>{let i=this.model[t.id];return s`<tr>
                <th scope="row">${t.label}</th>
                ${e.columns.map(r=>s`<td>${this.cell(t,r)}</td>`)}
                <td>
                  <input class="emr-control" aria-label=${`Remarks for ${t.label}`}
                    .value=${I(i?.remark??"")}
                    ?readonly=${this.readOnly||!!i?.remarkReadOnly}
                    ?disabled=${!!i?.remarkDisabled}
                    aria-invalid=${!!i?.remarkError}
                    @blur=${r=>{r.target.value=this.model[t.id]?.remark??""}}
                    @input=${r=>{let a=this.model[t.id];!this.readOnly&&!a?.remarkReadOnly&&!a?.remarkDisabled&&this.emitIntent({type:"remarkEditRequested",rowId:t.id,remark:r.target.value})}}>
                  ${i?.remarkError?s`<p class="emr-error">${i.remarkError}</p>`:o}
                </td>
              </tr>`})}
          </tbody>
        </table>
      </div>
    </section>`:o}};B([d({attribute:!1})],Qt.prototype,"definition",void 0);B([d({attribute:!1})],Qt.prototype,"model",void 0);B([d({attribute:!1})],Qt.prototype,"customRenderers",void 0);B([d({type:Boolean})],Qt.prototype,"readOnly",void 0);var Kr=class extends S{static{this.styles=[w,tt]}button(e,t,i){return s`<button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!i()}
      @click=${()=>{i()&&this.emitIntent(t)}}>${e}</button>`}render(){let e=this.model;return e?s`<div class="emr-card">
      <div class="toolbar-row" role="toolbar">
        ${e.tools.map(t=>s`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${e.selectedToolId===t.id}
            ?disabled=${!!e.readOnly||!!t.disabled}
            @click=${()=>{let i=this.model;i&&!i.readOnly&&i.tools.some(r=>r.id===t.id&&!r.disabled)&&this.emitIntent({type:"toolSelected",toolId:t.id})}}
          >${t.label}</button>`)}
        ${e.colours.map(t=>this.button(t.label,{type:"colourSelected",colourId:t.id},()=>!!this.model&&!this.model.readOnly&&this.model.colours.some(i=>i.id===t.id)))}
        ${e.widths.map(t=>this.button(t.label,{type:"widthSelected",widthId:t.id},()=>!!this.model&&!this.model.readOnly&&this.model.widths.some(i=>i.id===t.id)))}
        ${this.button("Undo",{type:"undoRequested"},()=>!!this.model?.canUndo&&!this.model.readOnly)}
        ${this.button("Redo",{type:"redoRequested"},()=>!!this.model?.canRedo&&!this.model.readOnly)}
        ${this.button(e.saveLabel??"Save",{type:"saveRequested"},()=>!!this.model?.canSave&&!this.model.readOnly)}
        ${this.button("Zoom out",{type:"zoomOutRequested"},()=>!!this.model&&!this.model.zoomLocked)}
        ${this.button(e.zoomLabel,{type:"zoomResetRequested"},()=>!!this.model&&!this.model.zoomLocked)}
        ${this.button("Zoom in",{type:"zoomInRequested"},()=>!!this.model&&!this.model.zoomLocked)}
        ${this.button("Fit",{type:"zoomFitRequested"},()=>!!this.model&&!this.model.zoomLocked)}
      </div>
    </div>`:o}};B([d({attribute:!1})],Kr.prototype,"model",void 0);var Xr=class extends S{static{this.styles=[w,tt]}edit(e){let t=this.model,i=t?.items.findIndex(r=>r.layer.id===e.layerId)??-1;!t||t.readOnly||i<0||e.type==="layerLockToggleRequested"&&!t.canLock||e.type==="layerMoveRequested"&&!t.items[i+(e.direction==="up"?-1:1)]||this.emitIntent(e)}render(){let e=this.model;return e?s`<section class="emr-card">
      <h4 class="emr-title">Annotations</h4>
      ${e.items.length?o:s`<p class="emr-muted">${e.emptyMessage}</p>`}
      <ol style="margin:0;padding-left:20px;display:grid;gap:6px;">
        ${e.items.map((t,i)=>s`<li style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div>
              <button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${t.layer.id===e.selectedLayerId}
                @click=${()=>this.emitIntent({type:"layerSelected",layerId:t.layer.id})}>
                ${t.number}. ${t.layer.label}
              </button>
              ${t.classLabel?s`<span>${t.classLabel}</span>`:o}
              ${t.description?s`<p class="emr-muted">${t.description}</p>`:o}
              ${t.layer.visible===!1?s`<span class="emr-muted">Hidden</span>`:o}
            </div>
            ${e.readOnly?o:s`<div class="toolbar-row">
              <button type="button" class="emr-btn emr-btn--secondary" aria-label=${`Toggle visibility of ${t.layer.label}`}
                @click=${()=>this.edit({type:"layerVisibilityToggleRequested",layerId:t.layer.id})}>
                ${R(t.layer.visible===!1?"eye-off":"eye",14)}
              </button>
              ${e.canLock?s`<button type="button" class="emr-btn emr-btn--secondary" aria-label=${`Toggle lock for ${t.layer.label}`}
                @click=${()=>this.edit({type:"layerLockToggleRequested",layerId:t.layer.id})}>
                ${R(t.locked?"lock":"unlock",14)}
              </button>`:o}
              <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${i===0}
                @click=${()=>this.edit({type:"layerMoveRequested",layerId:t.layer.id,direction:"up"})}>Move up</button>
              <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${i===e.items.length-1}
                @click=${()=>this.edit({type:"layerMoveRequested",layerId:t.layer.id,direction:"down"})}>Move down</button>
              <button type="button" class="emr-btn emr-btn--ghost" aria-label=${`Remove ${t.layer.label}`}
                @click=${()=>this.edit({type:"layerRemoveRequested",layerId:t.layer.id})}>Remove</button>
            </div>`}
          </li>`)}
      </ol>
    </section>`:o}};B([d({attribute:!1})],Xr.prototype,"model",void 0);var Qr=class extends S{static{this.styles=[w,tt]}render(){let e=this.model;if(!e)return o;let t=e.favouriteIds??[],i=new Map(e.options.map(l=>[l.id,l])),a=[...t.flatMap(l=>{let c=i.get(l);return c?[c]:[]}),...e.options.filter(l=>!t.includes(l.id))];return s`<section class="emr-card">
      <header class="emr-header">
        <h4 class="emr-title">${e.title}</h4>
        <button type="button" class="emr-btn emr-btn--ghost"
          @click=${()=>this.emitIntent({type:"closeRequested"})}>Close</button>
      </header>
      <input class="emr-control" type="search" aria-label="Search templates" .value=${I(e.query)}
        ?readonly=${!!e.readOnly}
        @input=${l=>{this.model&&!this.model.readOnly&&this.emitIntent({type:"queryChangeRequested",query:l.target.value})}}>
      <div class="toolbar-row">
        ${[{id:null,label:"All"},{id:"favourites",label:"Favourites"},...e.groups.filter(l=>l.id!=="favourites")].map(l=>s`<button type="button" class="emr-btn emr-btn--secondary"
            aria-pressed=${(e.selectedGroupId??null)===l.id}
            ?disabled=${!!e.readOnly}
            @click=${()=>{this.model&&!this.model.readOnly&&this.emitIntent({type:"groupSelected",groupId:l.id})}}>${l.label}</button>`)}
      </div>
      ${e.totalLabel?s`<p class="emr-muted">${e.totalLabel}</p>`:o}
      ${a.length?o:s`<p class="emr-muted">${e.emptyMessage}</p>`}
      <div class="toolbar-row">
        ${Ke(a,l=>l.id,l=>s`<div class="emr-card">
          <button type="button" class="emr-btn emr-btn--secondary" aria-pressed=${e.selectedId===l.id}
            ?disabled=${!!e.readOnly}
            @click=${()=>{this.model&&!this.model.readOnly&&this.emitIntent({type:"templateSelected",templateId:l.id})}}>
            <img src=${l.imageUrl} alt=${l.altText??""} loading="lazy" style="width:48px;height:48px;object-fit:contain;">
            ${l.label}
          </button>
          ${l.badges?.map(c=>s`<span class="emr-badge">${c}</span>`)}
          ${!e.readOnly&&e.canEditFavourites?s`<button type="button" class="emr-btn emr-btn--ghost"
            aria-pressed=${t.includes(l.id)} aria-label=${`Favourite ${l.label}`}
            @click=${()=>{let c=this.model;c?.canEditFavourites&&!c.readOnly&&this.emitIntent({type:"favouriteToggleRequested",templateId:l.id,favourite:!c.favouriteIds?.includes(l.id)})}}>Favourite</button>`:o}
        </div>`)}
      </div>
    </section>`}};B([d({attribute:!1})],Qr.prototype,"model",void 0);var Zr=class extends S{static{this.styles=[w,tt]}render(){let e=this.model;return e?s`<div class="emr-card">
      ${e.title?s`<h4 class="emr-title">${e.title}</h4>`:o}
      <div class="toolbar-row">
        ${e.readOnly?o:s`
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!e.canShiftEarlier}
            @click=${()=>{this.model?.canShiftEarlier&&!this.model.readOnly&&this.emitIntent({type:"shiftEarlierRequested"})}}>Earlier</button>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!e.canShiftLater}
            @click=${()=>{this.model?.canShiftLater&&!this.model.readOnly&&this.emitIntent({type:"shiftLaterRequested"})}}>Later</button>
        `}
        ${!e.readOnly&&e.steps?.length?s`
          <select class="emr-control" aria-label="Time interval" .value=${I(e.selectedStepId??"")}
            @change=${t=>{let i=t.target,r=i.value;i.value=this.model?.selectedStepId??"",!this.model?.readOnly&&this.model?.steps?.some(a=>a.id===r)&&this.emitIntent({type:"stepChangeRequested",stepId:r})}}>
            ${e.steps.map(t=>s`<option value=${t.id} ?selected=${e.selectedStepId===t.id}>${t.label}</option>`)}
          </select>`:e.stepLabel??o}
      </div>
      <div class="toolbar-row">
        ${e.ticks.map(t=>e.readOnly?s`<span aria-current=${t.current?"time":"false"}>${t.label} ${t.sublabel}</span>`:s`<button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-pressed=${e.selectedTickId===t.id}
            aria-current=${t.current?"time":"false"}
            @click=${()=>{this.model&&!this.model.readOnly&&this.emitIntent({type:"tickSelected",tickId:t.id})}}
          >${t.label} ${t.sublabel}</button>`)}
      </div>
    </div>`:o}};B([d({attribute:!1})],Zr.prototype,"model",void 0);var Jr=class extends S{static{this.styles=[w,tt]}changeSort(e){let t=this.model;if(!t?.columns.some(r=>r.id===e&&r.sortable))return;let i=t.sort?.columnId===e&&t.sort.direction==="asc"?"desc":"asc";this.emitIntent({type:"sortChanged",columnId:e,direction:i})}selectRow(e,t){let i=this.model;if(!i?.rows.some(a=>a.id===e))return;let r=new Set(i.selectedIds);t?r.add(e):r.delete(e),this.emitIntent({type:"selectionChanged",selectedIds:[...r]})}changePage(e){let t=this.model;if(!t)return;let i=t.page+e;i>=1&&i<=t.pageCount&&this.emitIntent({type:"pageChanged",page:i})}render(){let e=this.model;return e?s`<section class="emr-card" data-density=${e.density}>
      ${e.caption?s`<h3 class="emr-title">${e.caption}</h3>`:o}
      ${e.status==="loading"?s`<p role="status">Loading…</p>`:e.status==="error"?s`<p role="alert">${e.error??"Unable to load rows."}</p>
            <button type="button" class="emr-btn emr-btn--secondary"
              @click=${()=>this.emitIntent({type:"retryRequested"})}>Retry</button>`:s`
        <div class="toolbar-row">
          ${e.filters.map(t=>s`<button type="button" class="emr-btn emr-btn--secondary"
            aria-label=${`Remove filter ${t.label}`}
            @click=${()=>this.emitIntent({type:"filterRemoved",id:t.id})}>
            ${t.label}: ${t.valueLabel} ×
          </button>`)}
          <button type="button" class="emr-btn emr-btn--secondary"
            @click=${()=>this.emitIntent({type:"filterAddRequested"})}>Add filter</button>
          ${e.savedFilters.map(t=>s`<button type="button" class="emr-btn emr-btn--secondary"
            @click=${()=>this.emitIntent({type:"savedFilterSelected",id:t.id})}>${t.label}</button>`)}
          <button type="button" class="emr-btn emr-btn--secondary"
            @click=${()=>this.emitIntent({type:"saveFilterRequested"})}>Save filter</button>
          <button type="button" class="emr-btn emr-btn--secondary"
            @click=${()=>this.emitIntent({type:"exportRequested",format:"csv"})}>Export CSV</button>
          <button type="button" class="emr-btn emr-btn--secondary" aria-pressed=${e.density==="compact"}
            @click=${()=>this.emitIntent({type:"densityChanged",density:this.model?.density==="compact"?"comfortable":"compact"})}>Compact</button>
          ${e.bulkActions.map(t=>s`<button type="button" class="emr-btn emr-btn--secondary"
            ?disabled=${!e.selectedIds.length}
            @click=${()=>{this.model?.selectedIds.length&&this.emitIntent({type:"bulkActionRequested",id:t.id})}}>${t.label}</button>`)}
        </div>
        <div class="table-wrap">
        <table aria-label=${e.caption}>
          <thead>
            <tr>
              <th scope="col">Select</th>
              ${e.columns.map(t=>s`<th scope="col" aria-sort=${e.sort?.columnId===t.id?e.sort.direction==="asc"?"ascending":"descending":o}>
                  ${t.sortable?s`<button type="button" class="emr-btn emr-btn--ghost"
                    @click=${()=>this.changeSort(t.id)}>${t.label}</button>`:t.label}
                </th>`)}
            </tr>
          </thead>
          <tbody>${Ke(e.rows,t=>t.id,(t,i)=>s`<tr>
                <td><input type="checkbox" aria-label=${`Select row ${i+1}`}
                  .checked=${I(e.selectedIds.includes(t.id))}
                  @change=${r=>{let a=r.target,l=a.checked;a.checked=this.model?.selectedIds.includes(t.id)??!1,this.selectRow(t.id,l)}}></td>
                ${e.columns.map((r,a)=>{let l=t.cells[r.id],c=typeof l=="string"?l:l?.text??"",p=typeof l=="object"?l.badge:void 0;return s`<td>${a===0?s`<button type="button" class="emr-btn emr-btn--ghost"
                        @click=${()=>this.emitIntent({type:"rowActivated",id:t.id})}>${c||`Open row ${i+1}`}</button>`:c}
                    ${p?s`<emr-badge .badge=${p}></emr-badge>`:o}
                  </td>`})}
              </tr>`)}</tbody>
        </table>
        </div>
        <div class="toolbar-row">
          <span role="status">${e.summaryLabel}</span>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${e.page<=1} @click=${()=>this.changePage(-1)}>Previous</button>
          <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${e.page>=e.pageCount} @click=${()=>this.changePage(1)}>Next</button>
          ${e.pageSizeOptions.length?s`<select class="emr-control" aria-label="Rows per page"
            @change=${t=>{let i=t.target,r=Number(i.value);i.value=String(this.model?.pageSize??""),this.model?.pageSizeOptions.includes(r)&&this.emitIntent({type:"pageSizeChanged",pageSize:r})}}>
            ${e.pageSizeOptions.map(t=>s`<option value=${t} ?selected=${t===e.pageSize}>${t}</option>`)}
          </select>`:o}
        </div>`}
    </section>`:o}};B([d({attribute:!1})],Jr.prototype,"model",void 0);var Ri=class extends S{constructor(){super(...arguments),this.columnId=""}render(){return this.renderer&&this.cellModel?this.renderer(this.cellModel):s`<slot></slot>`}};B([d({type:String})],Ri.prototype,"columnId",void 0);B([d({attribute:!1})],Ri.prototype,"cellModel",void 0);B([d({attribute:!1})],Ri.prototype,"renderer",void 0);function $l(){Wr(),y("emr-section-card",mt),y("emr-repeatable-group",qt),y("emr-clinical-form",or),y("emr-clinical-list",He),y("emr-clinical-matrix",Qt),y("emr-annotation-toolbar",Kr),y("emr-annotation-list",Xr),y("emr-image-template-picker",Qr),y("emr-time-axis",Zr),y("emr-data-table",Jr),y("emr-clinical-cell-renderer",Ri)}var xl=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},k=class extends S{constructor(){super(...arguments),this.headingId=""}static{this.styles=[w,M`
    .emr-stack { display: grid; gap: 10px; }
    .emr-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .emr-scroll { overflow: auto; }
    .emr-table { width: 100%; border-collapse: collapse; }
    .emr-table th, .emr-table td {
      padding: 8px;
      text-align: start;
      vertical-align: top;
      border-bottom: 1px solid var(--emr-border);
    }
  `]}panel(e,t){return s`<section class="emr-card emr-stack" aria-labelledby=${this.headingId||o}>
      <h3 class="emr-title" id=${this.headingId||o}>${e}</h3>
      ${t}
    </section>`}send(e){this.emitIntent(e)}action(e,t,i=()=>!0){return s`<button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!i()}
      @click=${()=>{i()&&this.send(t)}}>${e}</button>`}};xl([d({attribute:!1})],k.prototype,"model",void 0);xl([d({type:String})],k.prototype,"headingId",void 0);var Ws=class extends k{render(){let e=this.model;if(!e)return o;let t=e.schema.phases.find(i=>i.id===e.activePhaseId);return this.panel(e.schema.label,s` <p>${e.schema.description??""}</p>
        <nav aria-label="Checklist phases">
          ${e.schema.phases.map(i=>this.action(`${i.label}${e.phaseStatuses?.[i.id]?` \u2014 ${e.phaseStatuses[i.id].label}`:""}`,{type:"phaseSelected",phaseId:i.id}))}
        </nav>
        ${t?s`<h4>${t.label}</h4>
              <p>${t.description??""}</p>
              ${e.signoffs?.[t.id]?s`<p>
                    Signed by ${e.signoffs[t.id].displayName}, ${e.signoffs[t.id].roleLabel} ·
                    ${e.signoffs[t.id].signedAtLabel}
                  </p>`:o}
              ${t.items.map(i=>{let r=e.items[i.id]??{value:null},a=!!(e.readOnly||r.readOnly||r.disabled),l=c=>{a||this.send({type:"itemResponseRequested",itemId:i.id,value:c})};return s`<div>
                  ${i.type==="checkbox"?s`<label
                        ><input
                          type="checkbox"
                          .checked=${r.value===!0}
                          ?disabled=${a}
                          @change=${c=>l(c.target.checked)}
                        />
                        ${i.label}</label
                      >`:i.type==="yes-no"||i.type==="yes-no-na"?s`<fieldset>
                          <legend>${i.label}</legend>
                          ${(i.type==="yes-no"?["yes","no"]:["yes","no","na"]).map(c=>s`<label
                                ><input
                                  type="radio"
                                  name=${`${e.instanceId}-${i.id}`}
                                  .checked=${r.value===c}
                                  ?disabled=${a}
                                  @change=${()=>l(c)}
                                />
                                ${c==="na"?"Not applicable":c==="yes"?"Yes":"No"}</label
                              >`)}
                        </fieldset>`:i.type==="select"?s`<label
                            >${i.label}<select
                              .value=${String(r.value??"")}
                              ?disabled=${a}
                              @change=${c=>l(c.target.value||null)}
                            >
                              <option value="">Select an option</option>
                              ${i.options?.map(c=>s`<option
                                    value=${c.value}
                                    ?selected=${c.value===r.value}
                                    ?disabled=${!!c.disabled}
                                  >
                                    ${c.label}
                                  </option>`)}
                            </select></label
                          >`:s`<label
                            >${i.label}<input
                              .value=${String(r.value??"")}
                              ?disabled=${a}
                              @input=${c=>l(c.target.value)}
                          /></label>`}
                  ${i.description?s`<p>${i.description}</p>`:o}${r.error?s`<p role="alert">${r.error}</p>`:o}
                  ${i.requiresNoteWhen?.includes(String(r.value))?s`<label
                        >Note<textarea
                          .value=${r.note??""}
                          ?disabled=${a}
                          @input=${c=>{a||this.send({type:"itemNoteRequested",itemId:i.id,note:c.target.value})}}
                        ></textarea>
                      </label>`:o}
                </div>`})}
              ${this.action("Mark phase complete",{type:"phaseCompletionRequested",phaseId:t.id},()=>!this.model?.readOnly)}
              ${this.action("Sign off phase",{type:"phaseSignoffRequested",phaseId:t.id},()=>!this.model?.readOnly)} `:o}${e.error?s`<p role="alert">${e.error}</p>`:o}`)}},Ks=class extends k{render(){let e=this.model;if(!e)return o;let t={...e.form,readOnly:!!e.readOnly||!!e.form.readOnly,schema:{...e.form.schema,id:`emr-pac-${e.instanceId}-${e.form.schema.id}`}};return this.panel(e.title,s`<p>${e.description??""}</p>
        ${e.overallStatus?s`<emr-badge .badge=${e.overallStatus}></emr-badge>`:o}
        <dl>
          ${e.context.map(i=>s`<dt>${i.label}</dt>
                <dd>${i.value}</dd>`)}
        </dl>
        ${e.errors?.map(i=>s`<p role="alert">${i.severity??"error"}: ${i.message}</p>`)}
        <emr-clinical-form
          .model=${t}
          @intent=${i=>{i.stopPropagation(),this.model?.readOnly||this.send({type:"formIntent",intent:i.detail})}}
        ></emr-clinical-form>
        <div class="emr-actions">
          ${e.actions.map(i=>this.action(i.label,{type:"actionRequested",actionId:i.id},()=>!this.model?.readOnly&&!i.disabled&&!i.loading))}
        </div>`)}},Xs=class extends k{render(){let e=this.model;return e?this.panel(e.label,s`${e.readOnly?o:this.action("Add person",{type:"personAddRequested"})}
      ${e.people.length?[...e.people].sort((t,i)=>t.generation-i.generation||t.order-i.order).map(t=>s`<article>
                  ${this.action(t.displayName,{type:"personSelected",personId:t.id})}
                  <p>
                    ${t.relationshipLabel} · ${t.age??"Age not recorded"} ·
                    ${t.sexLabel??t.sex??"Sex not recorded"} ·
                    ${t.lifeStatusLabel??t.lifeStatus??(t.deceased===void 0?"Not recorded":t.deceased?"Deceased":"Alive")}
                    · ${t.phenotype??"Status unknown"}
                  </p>
                  <p>${t.summary??""}</p>
                  ${t.conditions?.map(i=>s`<emr-badge .badge=${i}></emr-badge>`)}
                  ${!e.readOnly&&!t.readOnly?s`${this.action("Edit person",{type:"personEditRequested",personId:t.id})}${this.action("Remove person",{type:"personRemoveRequested",personId:t.id})}${this.action("Add relative",{type:"personAddRequested",relatedPersonId:t.id})}${this.action("Add relationship",{type:"relationshipAddRequested",personId:t.id})}`:o}
                </article>`):s`<p>${e.emptyMessage??"No family history recorded."}</p>`}
      ${e.relationships.map(t=>s`<p>
            ${e.people.find(i=>i.id===t.fromPersonId)?.displayName??"Unknown person"} —
            ${t.relationshipLabel} —
            ${e.people.find(i=>i.id===t.toPersonId)?.displayName??"Unknown person"}
            ${e.readOnly?o:this.action("Edit relationship",{type:"relationshipEditRequested",relationshipId:t.id})}
          </p>`)}`):o}},Qs=class extends k{render(){let e=this.model;return e?this.panel(e.title,s`<p>${e.subtitle??""}</p>
        ${e.status?s`<emr-badge .badge=${e.status}></emr-badge>`:o}
        ${e.loading?s`<p role="status">Loading result</p>`:e.error?s`<p role="alert">${e.error}</p>
                ${this.action("Try again",{type:"retryRequested",resultId:e.id})}`:s` <dl>
                  ${e.metadata.map(t=>s`<dt>${t.label}</dt>
                        <dd>${t.value}</dd>`)}
                </dl>
                ${e.metrics.map(t=>s`<p>
                      <strong>${t.label}: ${t.valueLabel}</strong> ${t.referenceLabel??""}
                      ${t.status?s`<emr-badge .badge=${t.status}></emr-badge>`:o}
                      ${t.helpText??""}
                    </p>`)}
                <p>${e.interpretation??""}</p>
                <p>${e.trendSummary??""}</p>
                ${this.action("Select result",{type:"resultSelected",resultId:e.id})}
                ${e.attachments?.map(t=>this.action(t.label,{type:"attachmentRequested",resultId:e.id,attachmentId:t.id},()=>!t.disabled))}`}`):o}},Zs=class extends k{render(){let e=this.model;if(!e)return o;let t=["up-right","up","up-left","right","primary","left","down-right","down","down-left"];return this.panel(e.title,s`<p>${e.summaryText}</p>
        ${(e.layout==="binocular"?e.eyes.slice(0,1):e.eyes).map(i=>s`<h4>${i.label} (${i.shortLabel})</h4>
              <table class="emr-table">
                <tbody>
                  ${[0,1,2].map(r=>s`<tr>
                        ${t.slice(r*3,r*3+3).map(a=>{let l=i.cells[a];return s`<td>
                            <strong>${e.positionLabels[a]}</strong>
                            <p>
                              ${l?l.status==="recorded"?l.valueLabel??"Not supplied":l.status:"Not supplied"}
                            </p>
                            ${l?.badge?s`<emr-badge .badge=${l.badge}></emr-badge>`:o}
                            <p>${l?.note??""}</p>
                            ${e.readOnly?o:s`${this.action("Select",{type:"cellSelected",eyeId:i.eyeId,position:a})}${this.action("Edit",{type:"cellEditRequested",eyeId:i.eyeId,position:a})}`}
                          </td>`})}
                      </tr>`)}
                </tbody>
              </table>`)}`)}},Js=class extends k{render(){let e=this.model;return e?this.panel(e.title,s`<p>${e.summaryText}</p>
        ${e.eyes.map(t=>s`<article>
              <h4>${t.label} (${t.shortLabel})</h4>
              <p>${t.status}</p>
              ${t.flag?s`<emr-badge .badge=${t.flag}></emr-badge>`:o}
              ${t.status==="recorded"&&t.meridians?s`<svg
                      viewBox="0 0 200 200"
                      width="200"
                      height="200"
                      role="img"
                      aria-label=${t.meridians.map(i=>i.assistiveLabel).join("; ")}
                    >
                      ${t.meridians.map(i=>{let r=i.axisDeg*Math.PI/180,a=Math.cos(r)*70,l=-Math.sin(r)*70;return O`<line x1=${100-a} y1=${100-l} x2=${100+a} y2=${100+l} stroke="currentColor"></line><text x=${100+a} y=${100+l} fill="currentColor">${i.powerLabel}</text>`})}</svg
                    >${t.meridians.map(i=>s`<p>${i.assistiveLabel}: ${i.powerLabel}</p>`)}`:t.status==="recorded"?s`<p>Not supplied</p>`:o}${t.captionLines?.map(i=>s`<p>${i}</p>`)}
              ${e.readOnly?o:s`${this.action("Select eye",{type:"eyeSelected",eyeId:t.eyeId})}${this.action("Edit eye",{type:"editRequested",eyeId:t.eyeId})}`}
            </article>`)}`):o}},eo=class extends k{render(){let e=this.model;return e?this.panel(e.title,s`${e.loading?s`<p role="status">Loading OCT record</p>`:e.error?s`<p role="alert">${e.error}</p>
              ${this.action("Try again",{type:"retryRequested"})}`:s` ${e.messages.map(t=>s`<p>${t.severity}: ${t.message}</p>`)}${e.eyes.map(t=>s`<article>
                  <h4>${t.label} (${t.shortLabel})</h4>
                  <p>${t.status}</p>
                  ${t.status==="recorded"?s` <dl>
                          ${t.metadata.map(i=>s`<dt>${i.label}</dt>
                                <dd>${i.value}</dd>`)}
                        </dl>
                        ${t.frames.map(i=>s`<div>
                              ${i.thumbnailUrl&&/^(https?:|blob:|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(i.thumbnailUrl)?s`<img src=${i.thumbnailUrl} alt=${i.altText} />`:o}${this.action(i.label,{type:"frameSelected",eyeId:t.eyeId,frameId:i.frameId})}${this.action("Open frame",{type:"frameOpenRequested",eyeId:t.eyeId,frameId:i.frameId})}
                            </div>`)}
                        ${t.metrics.map(i=>s`<p>${i.label}: ${i.valueLabel} ${i.referenceLabel??""}</p>`)}
                        ${t.findings.map(i=>s`<p>
                              ${this.action(i.label,{type:"findingSelected",eyeId:t.eyeId,path:i.path})}
                              ${i.status} ${i.locationLabel??""} ${i.note??""}
                              ${i.badge?s`<emr-badge .badge=${i.badge}></emr-badge>`:o}
                              ${!e.readOnly&&!i.readOnly?s`${this.action("Edit finding",{type:"findingEditRequested",eyeId:t.eyeId,path:i.path})}${this.action("Remove finding",{type:"findingRemoveRequested",eyeId:t.eyeId,path:i.path})}`:o}
                            </p>`)}
                        <p>${t.interpretation??""}</p>
                        ${e.readOnly?o:this.action("Add finding",{type:"findingAddRequested",eyeId:t.eyeId})}`:o}
                </article>`)}`}`):o}},to=class extends k{medicine(e,t){return e?s`${this.action(e.nameLabel,{type:"medicationDetailRequested",medicationId:e.id})}
      <p>${e.doseSummary||"Not supplied"}</p>
      <p>${e.lastTakenLabel?`Last taken: ${e.lastTakenLabel}`:""}</p>
      ${e.badges?.map(i=>s`<emr-badge .badge=${i}></emr-badge>`)}`:s`<span>Not on ${t}</span>`}render(){let e=this.model;return e?this.panel(e.title,s`${e.summary?.map(t=>s`<emr-badge .badge=${t}></emr-badge>`)}
      ${e.loading?s`<p role="status">Loading medicines</p>`:e.error?s`<p role="alert">${e.error}</p>
              ${this.action("Try again",{type:"retryRequested"})}`:s` ${e.readOnly?o:s`${this.action(`Add medicine to ${e.leftLabel}`,{type:"addMedicationRequested",side:"left"})}${this.action(`Add medicine to ${e.rightLabel}`,{type:"addMedicationRequested",side:"right"})}`}
            ${e.rows.length?s`<div class="emr-scroll">
                  <table class="emr-table">
                    <thead>
                      <tr>
                        <th>${e.leftLabel}</th>
                        <th>${e.rightLabel}</th>
                        <th>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${e.rows.map(t=>s`<tr>
                            <td>${this.medicine(t.left,e.leftLabel)}</td>
                            <td>${this.medicine(t.right,e.rightLabel)}</td>
                            <td>
                              ${this.action("Select row",{type:"rowSelected",rowId:t.id})}<label
                                >Decision for
                                ${t.left?.nameLabel??t.right?.nameLabel??"medicine"}<select
                                  ?disabled=${!!e.readOnly||!!t.readOnly}
                                  @change=${i=>{let r=i.target.value;!this.model?.readOnly&&!t.readOnly&&r&&this.send({type:"decisionChangeRequested",path:t.path,decision:r})}}
                                >
                                  <option value="">Not decided</option>
                                  ${t.decisionOptions.map(i=>s`<option
                                        value=${i.value}
                                        ?selected=${i.value===t.decision}
                                        ?disabled=${!!i.disabled}
                                      >
                                        ${i.label}
                                      </option>`)}
                                </select></label
                              >
                              ${t.reasonRequired?s`<label
                                    >Reason<textarea
                                      .value=${t.reason??""}
                                      ?readonly=${!!e.readOnly||!!t.readOnly}
                                      @input=${i=>{!this.model?.readOnly&&!t.readOnly&&this.send({type:"reasonChangeRequested",path:t.path,reason:i.target.value})}}
                                    ></textarea>
                                  </label>`:o}${t.messages?.map(i=>s`<p>${i.severity}: ${i.message}</p>`)}
                            </td>
                          </tr>`)}
                    </tbody>
                  </table>
                </div>`:s`<p>${e.emptyMessage}</p>`}
            ${e.readOnly?o:this.action("Complete reconciliation",{type:"completeRequested"},()=>!!this.model?.canComplete&&!this.model?.readOnly)}`}`):o}};function wl(){y("emr-staged-checklist",Ws),y("emr-pac-checklist",Ks),y("emr-family-pedigree",Xs),y("emr-diagnostic-result-summary",Qs),y("emr-ocular-motility-chart",Zs),y("emr-meridian-cross",Js),y("emr-oct-finding-record",eo),y("emr-medication-reconciliation",to),y("emr-spectacle-prescription",io),y("emr-clinical-annotation-canvas",ro)}var io=class extends k{render(){let e=this.model;if(!e)return o;let t=["snellen-6m","snellen-20ft","logmar","etdrs","decimal"];return this.panel(e.label,s`<p>${e.description??""}</p>
        ${Object.values(e.errors??{}).filter(Boolean).map(i=>s`<p role="alert">${i}</p>`)}
        <label
          >Visual acuity chart
          <select
            ?disabled=${!!e.readOnly}
            @change=${i=>{let r=i.target.value;!this.model?.readOnly&&t.includes(r)&&this.send({type:"vaChartTypeChanged",chartType:r})}}
          >
            ${t.map(i=>s`<option value=${i} ?selected=${e.vaChartType===i}>${i}</option>`)}
          </select></label
        >
        <div class="emr-scroll">
          <table class="emr-table">
            <thead>
              <tr>
                <th>Eye</th>
                ${e.fields.map(i=>s`<th>${i.label}${i.unit?` (${i.unit})`:""}</th>`)}
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${e.eyes.map(i=>s`<tr>
                    <th>
                      ${i.label}
                      ${i.shortLabel??""}${e.logMarEquivalents?.[i.id]!==void 0?s`<p>LogMAR: ${e.logMarEquivalents[i.id]}</p>`:o}
                    </th>
                    ${e.fields.map(r=>{let a=!!(e.readOnly||r.readOnly||r.disabled),l=e.values[i.id]?.[r.id]??"",c=h=>{!this.model?.readOnly&&!r.readOnly&&!r.disabled&&this.send({type:"cellEditRequested",eyeId:i.id,fieldId:r.id,value:h.target.value})},p=()=>this.send({type:"cellFocused",eyeId:i.id,fieldId:r.id});return s`<td>
                        <label
                          ><span>${r.label} — ${i.label}</span>${r.type==="select"?s`<select ?disabled=${a} @focus=${p} @change=${c}>
                                <option value="">Select</option>
                                ${r.options?.map(h=>s`<option
                                      value=${h.value}
                                      ?selected=${h.value===l}
                                      ?disabled=${!!h.disabled}
                                    >
                                      ${h.label}
                                    </option>`)}
                              </select>`:s`<input
                                .value=${l}
                                placeholder=${r.placeholder??""}
                                inputmode=${r.type==="integer"?"numeric":r.type==="decimal"?"decimal":"text"}
                                ?readonly=${a}
                                @focus=${p}
                                @input=${c}
                              />`}</label
                        >${e.errors?.[`${i.id}.${r.id}`]?s`<p role="alert">${e.errors[`${i.id}.${r.id}`]}</p>`:o}${e.warnings?.[`${i.id}.${r.id}`]?s`<p>${e.warnings[`${i.id}.${r.id}`]}</p>`:o}${!a&&(r.type==="decimal"||r.id==="axis")?s`${this.action("Decrease",{type:"cellStepped",eyeId:i.id,fieldId:r.id,delta:r.id==="axis"?-5:-.25})}${this.action("Increase",{type:"cellStepped",eyeId:i.id,fieldId:r.id,delta:r.id==="axis"?5:.25})}`:o}
                      </td>`})}
                    <td>
                      <label
                        >Notes for ${i.label}<textarea
                          .value=${e.notes?.[i.id]??""}
                          ?readonly=${!!e.readOnly}
                          @input=${r=>{this.model?.readOnly||this.send({type:"notesEditRequested",eyeId:i.id,value:r.target.value})}}
                        ></textarea>
                      </label>
                    </td>
                  </tr>`)}
            </tbody>
          </table>
        </div>
        ${e.readOnly?o:e.eyes.flatMap(i=>e.eyes.filter(r=>r.id!==i.id).map(r=>this.action(`Copy ${i.label} to ${r.label}`,{type:"copyEyeRequested",fromEyeId:i.id,toEyeId:r.id})))}
        ${e.iopReadings?Object.entries(e.iopReadings).map(([i,r])=>s`<p>
                  ${i}: ${r.valueLabel} · ${r.methodLabel} ${r.timeLabel??""}
                  ${r.deltaLabel??""} ${r.pachymetryLabel??""}
                  ${r.flag?s`<emr-badge .badge=${r.flag}></emr-badge>`:o}
                </p>`):o}
        ${e.slitLampRows?.length?s`<h4>Slit lamp and fundus examination</h4>
              ${e.readOnly?o:s`${this.action("Normal both eyes",{type:"slitLampMacroNormalRequested",scope:"ou"})}${this.action("Normal right eye",{type:"slitLampMacroNormalRequested",scope:"od"})}${this.action("Normal left eye",{type:"slitLampMacroNormalRequested",scope:"os"})}`}
              <table class="emr-table">
                <thead>
                  <tr>
                    <th>Finding</th>
                    <th>Right eye</th>
                    <th>Left eye</th>
                  </tr>
                </thead>
                <tbody>
                  ${e.slitLampRows.map(i=>s`<tr>
                        <th>${i.label}</th>
                        ${["od","os"].map(r=>s`<td>
                              <label
                                >${i.label} ${r}<input
                                  .value=${r==="od"?i.odValue:i.osValue}
                                  ?readonly=${!!e.readOnly}
                                  @input=${a=>{this.model?.readOnly||this.send({type:"slitLampChanged",rowId:i.id,eyeId:r,value:a.target.value})}} /></label
                              >${e.readOnly?o:s`${this.action("Normal",{type:"slitLampMacroNormalRequested",scope:r,rowId:i.id})}${this.action("Copy to other eye",{type:"slitLampCopyEyeRequested",fromEyeId:r,toEyeId:r==="od"?"os":"od",rowId:i.id})}${i.quickFindings.map(a=>s`<button
                                        type="button"
                                        @click=${()=>{this.model?.readOnly||this.send({type:"slitLampChanged",rowId:i.id,eyeId:r,value:a})}}
                                      >
                                        ${a}
                                      </button>`)}`}
                            </td>`)}
                      </tr>`)}
                </tbody>
              </table>`:o}`)}},ro=class extends k{constructor(){super(...arguments),this.nextId=0,this.cursor={x:.5,y:.5}}static{this.styles=[...k.styles,M`
      svg {
        display: block;
        width: 100%;
        max-height: 70vh;
        touch-action: none;
      }
    `]}requestUpdate(...e){this.draft&&!this.validDraft()&&(this.draft=void 0),super.requestUpdate(...e)}validDraft(e){let t=this.model,i=this.draft,r=t?.imageTemplates.find(a=>a.id===t.selectedImageId);return!!(t&&i&&!t.readOnly&&t.instanceId===i.instanceId&&r&&r.id===i.imageId&&r.imageUrl===i.imageUrl&&r.width===i.width&&r.height===i.height&&(t.selectedTool??"line")===i.tool&&(e===void 0||e===i.pointerId))}startDraft(e,t,i){let r=this.model,a=r?.imageTemplates.find(l=>l.id===r.selectedImageId);!r||r.readOnly||!a||(this.draft={tool:e,points:[t],instanceId:r.instanceId,imageId:a.id,imageUrl:a.imageUrl,width:a.width,height:a.height,pointerId:i},this.requestUpdate())}change(e,t){this.model&&!this.model.readOnly&&this.send({type:"stateChanged",state:{...this.model,...e},reason:t})}point(e){let t=e.currentTarget.getBoundingClientRect();if(!(!t.width||!t.height))return{x:Math.max(0,Math.min(1,(e.clientX-t.left)/t.width)),y:Math.max(0,Math.min(1,(e.clientY-t.top)/t.height))}}add(e,t){let i=this.model;if(!i||i.readOnly||!t.length)return;let r;do r=`annot-${++this.nextId}`;while(i.layers.some(c=>c.id===r));let a={id:r,label:i.availableLabels.find(c=>c.id===i.selectedLabelId)?.label??"Annotation",color:i.brushColor,strokeWidth:i.brushWidth??2,visible:!0,classIds:i.selectedLabelId?[i.selectedLabelId]:[],strokeStyle:i.brushStrokeStyle,fillPattern:i.brushFillPattern},l;if(e==="text"){let c=i.textContent?.trim()||"Text";l={...a,tool:e,text:c,label:c,point:t[0],fontSize:24}}else if(e==="circle"){if(t.length<2)return;l={...a,tool:e,center:t[0],radiusX:Math.abs(t[1].x-t[0].x),radiusY:Math.abs(t[1].y-t[0].y)}}else if(e==="line"||e==="arrow"||e==="callout"){if(t.length<2)return;let c=[t[0],t[1]];l=e==="callout"?{...a,tool:e,points:c,text:i.textContent?.trim()||"Text",fontSize:24}:{...a,tool:e,points:c}}else{if(t.length<(e==="polygon"?3:2))return;l={...a,tool:e,points:t}}this.change({layers:[...i.layers,l],selectedLayerId:r},`${e}-added`)}down(e,t){let i=this.model,r=i?.imageTemplates.find(c=>c.id===i.selectedImageId);if(!i||i.readOnly||e.button!==0||i.selectedTool==="pan"||i.instanceId!==t.instanceId||!r||r.id!==t.imageId||r.imageUrl!==t.imageUrl||r.width!==t.width||r.height!==t.height)return;let a=this.point(e);if(!a)return;let l=i.selectedTool??"line";if(!(this.validDraft()&&this.draft?.pointerId!==e.pointerId)){if(l==="text"){this.add(l,[a]);return}if(l==="polygon"&&this.validDraft(e.pointerId)&&this.draft){this.draft.points.push(a),this.requestUpdate();return}this.startDraft(l,a,e.pointerId),e.currentTarget.setPointerCapture?.(e.pointerId)}}move(e){if(!this.validDraft(e.pointerId)||!this.draft||this.draft.tool==="polygon")return;let t=this.point(e);t&&(this.draft.tool==="freeform"||this.draft.tool==="curve"?this.draft.points.push(t):this.draft.points=[this.draft.points[0],t],this.requestUpdate())}up(e){if(!this.validDraft(e.pointerId)||!this.draft||this.draft.tool==="polygon")return;this.point(e)&&this.move(e);let i=this.draft;this.draft=void 0,this.add(i.tool,i.points)}key(e,t){let i=this.model,r=i?.imageTemplates.find(h=>h.id===i.selectedImageId);if(!i||i.readOnly||i.instanceId!==t.instanceId||!r||r.id!==t.imageId||r.imageUrl!==t.imageUrl||r.width!==t.width||r.height!==t.height)return;let a=e.shiftKey?.1:.01,l={ArrowLeft:[-a,0],ArrowRight:[a,0],ArrowUp:[0,-a],ArrowDown:[0,a]};if(l[e.key]){e.preventDefault();let[h,f]=l[e.key];this.cursor={x:Math.max(0,Math.min(1,this.cursor.x+h)),y:Math.max(0,Math.min(1,this.cursor.y+f))},this.validDraft(null)&&this.draft&&(this.draft.tool==="curve"||this.draft.tool==="freeform")&&this.draft.points.push(this.cursor),this.requestUpdate();return}if(e.key==="Escape"){this.draft=void 0,this.requestUpdate();return}if(e.key!=="Enter"&&e.key!==" ")return;e.preventDefault();let c=i.selectedTool??"line";if(c==="pan")return;if(c==="text"){this.add(c,[this.cursor]);return}if(!this.validDraft(null)||!this.draft){this.startDraft(c,this.cursor,null);return}if(c==="polygon"){this.draft.points.push(this.cursor),this.requestUpdate();return}let p=c==="curve"||c==="freeform"?[...this.draft.points,this.cursor]:[this.draft.points[0],this.cursor];this.draft=void 0,this.requestUpdate(),this.add(c,p)}render(){let e=this.model;if(!e)return o;let t=e.imageTemplates.find(a=>a.id===e.selectedImageId),i=t&&/^(https?:|blob:|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(t.imageUrl)?t.imageUrl:"",r=["pan","text","line","arrow","callout","curve","circle","polygon","freeform"];return this.panel(e.title,s`<p>${e.description??""}</p>
        <label
          >Background<select
            ?disabled=${!!e.readOnly}
            @change=${a=>{let l=a.target.value;this.change({selectedImageId:l},`background-changed:${l}`)}}
          >
            <option value="">Select background</option>
            ${e.imageTemplates.map(a=>s`<option value=${a.id} ?selected=${a.id===e.selectedImageId}>${a.label}</option>`)}
          </select></label
        >
        ${e.readOnly?o:s`<label
                >${e.photoUploadHint||"Add photo"}<input
                  type="file"
                  aria-label="Add photo"
                  accept=${e.photoAccept||"image/*"}
                  @change=${a=>{let l=a.target,c=Array.from(l.files??[]);l.value="",this.model&&!this.model.readOnly&&this.dispatchEvent(new CustomEvent("nativeFilesSelected",{detail:c,bubbles:!0,composed:!0}))}} /></label
              ><label
                >Tool<select
                  @change=${a=>{let l=a.target.value;r.includes(l)&&(this.draft=void 0,this.change({selectedTool:l,selectedSymbolId:void 0,brushStrokeStyle:void 0,brushFillPattern:void 0},`tool-changed:${l}`))}}
                >
                  ${r.map(a=>s`<option value=${a} ?selected=${a===(e.selectedTool??"line")}>
                        ${a}
                      </option>`)}
                </select></label
              >
              <label
                >Class<select
                  @change=${a=>{let l=a.target.value;this.change({selectedLabelId:l||void 0},`selected-label:${l}`)}}
                >
                  <option value="">None</option>
                  ${e.availableLabels.map(a=>s`<option value=${a.id} ?selected=${a.id===e.selectedLabelId}>${a.label}</option>`)}
                </select></label
              >
              ${e.symbolPresets?.length?s`<label
                    >Symbol<select
                      @change=${a=>{let l=e.symbolPresets?.find(c=>c.id===a.target.value);this.change({selectedSymbolId:l?.id,brushStrokeStyle:l?.strokeStyle,brushFillPattern:l?.fillPattern,...l?{selectedTool:l.tool,brushColor:l.colour??e.brushColor,brushWidth:l.width??e.brushWidth,selectedLabelId:l.classId&&e.availableLabels.some(c=>c.id===l.classId)?l.classId:e.selectedLabelId}:{}},"symbol-selected")}}
                    >
                      <option value="">None</option>
                      ${e.symbolPresets.map(a=>s`<option value=${a.id} ?selected=${a.id===e.selectedSymbolId}>
                            ${a.label}
                          </option>`)}
                    </select></label
                  >`:o}
              <label
                >Text<input
                  .value=${e.textContent??""}
                  @input=${a=>this.change({textContent:a.target.value},"text-content-changed")}
              /></label>
              ${e.colourOptions?.length?s`<label
                    >Colour<select
                      @change=${a=>{let l=a.target.value;e.colourOptions?.some(c=>c.hex===l)&&this.change({brushColor:l},`brush-color:${l}`)}}
                    >
                      ${e.colourOptions.map(a=>s`<option value=${a.hex} ?selected=${a.hex===e.brushColor}>
                            ${a.label}
                          </option>`)}
                    </select></label
                  >`:o}
              ${e.widthOptions?.length?s`<label
                    >Width<select
                      @change=${a=>{let l=Number(a.target.value);e.widthOptions?.some(c=>c.px===l)&&this.change({brushWidth:l},`brush-width:${l}`)}}
                    >
                      ${e.widthOptions.map(a=>s`<option value=${a.px} ?selected=${a.px===e.brushWidth}>${a.label}</option>`)}
                    </select></label
                  >`:o}
              <button
                type="button"
                ?disabled=${this.draft?.tool!=="polygon"||this.draft.points.length<3}
                @click=${()=>{if(this.validDraft()&&this.draft?.tool==="polygon"){let a=this.draft.points;this.draft=void 0,this.requestUpdate(),this.add("polygon",a)}}}
              >
                Finish polygon
              </button>
              ${["undoRequested","redoRequested","saveRequested"].map(a=>this.action(a==="undoRequested"?"Undo":a==="redoRequested"?"Redo":"Save",{type:a,state:e,reason:a==="undoRequested"?"undo":a==="redoRequested"?"redo":"save"},()=>!this.model?.readOnly))}`}
        ${t&&i?s`<svg
              viewBox=${`0 0 ${t.width} ${t.height}`}
              role="img"
              tabindex=${e.readOnly?-1:0}
              aria-label=${`${t.altText??t.label}. Use arrow keys to move, Enter to place points, Escape to cancel.`}
              @keydown=${a=>this.key(a,{instanceId:e.instanceId,imageId:t.id,imageUrl:t.imageUrl,width:t.width,height:t.height})}
              @pointerdown=${a=>this.down(a,{instanceId:e.instanceId,imageId:t.id,imageUrl:t.imageUrl,width:t.width,height:t.height})}
              @pointermove=${this.move}
              @pointerup=${this.up}
              @pointercancel=${a=>{this.validDraft(a.pointerId)&&(this.draft=void 0,this.requestUpdate())}}
            >
              <image href=${i} width=${t.width} height=${t.height}></image>
              <defs>
                ${e.layers.map((a,l)=>O`<pattern id=${`mark-pattern-${l}`} patternUnits="userSpaceOnUse" width="8" height="8"><path d=${a.fillPattern==="lattice"?"M0 0H8 M0 0V8":a.fillPattern==="crosshatch"?"M0 8L8 0 M0 0L8 8":"M0 8L8 0"} stroke=${/^#[\da-f]{3,8}$/i.test(a.color)?a.color:"currentColor"} fill="none"></path></pattern>`)}
              </defs>
              ${e.layers.filter(a=>a.visible).map(a=>{let l=/^#[\da-f]{3,8}$/i.test(a.color)?a.color:"currentColor",c=a.fillPattern&&a.fillPattern!=="none"?`url(#mark-pattern-${e.layers.indexOf(a)})`:"none",p=b=>b.x*t.width,h=b=>b.y*t.height;if(a.tool==="text")return O`<text x=${p(a.point)} y=${h(a.point)} fill=${l} font-size=${a.fontSize}>${a.text}</text>`;if(a.tool==="circle")return O`<ellipse cx=${p(a.center)} cy=${h(a.center)} rx=${a.radiusX*t.width} ry=${a.radiusY*t.height} fill=${c} stroke=${l} stroke-width=${a.strokeWidth}></ellipse>`;let f=a.points.map(b=>`${p(b)},${h(b)}`).join(" "),g=a.strokeStyle==="sutured"||a.strokeStyle==="stapled"?a.points.slice(1).flatMap((b,x)=>{let C=a.points[x],A=p(b)-p(C),q=h(b)-h(C),E=Math.hypot(A,q);if(!E)return[];let L=Math.min(100,Math.floor(E/18));return Array.from({length:L},(N,F)=>{let pe=(F+1)/(L+1),V=p(C)+A*pe,Pe=h(C)+q*pe,De=-q/E*4,oe=A/E*4;return a.strokeStyle==="sutured"?`M${V-De} ${Pe-oe}L${V+De} ${Pe+oe}`:`M${V-De-A/E*3} ${Pe-oe-q/E*3}L${V-De} ${Pe-oe}L${V+De} ${Pe+oe}L${V+De-A/E*3} ${Pe+oe-q/E*3}`})}).join(" "):"",v=a.tool==="arrow"||a.tool==="callout"?(()=>{let b=a.points[0],x=a.points[1],C=Math.atan2(h(x)-h(b),p(x)-p(b)),A=Math.max(8,a.strokeWidth*4);return`${p(x)},${h(x)} ${p(x)-A*Math.cos(C-.45)},${h(x)-A*Math.sin(C-.45)} ${p(x)-A*Math.cos(C+.45)},${h(x)-A*Math.sin(C+.45)}`})():"";return O`<polyline points=${a.tool==="polygon"&&a.points.length?`${f} ${p(a.points[0])},${h(a.points[0])}`:f} fill=${a.tool==="polygon"||a.tool==="freeform"?c:"none"} stroke=${l} stroke-width=${a.strokeWidth} stroke-dasharray=${a.strokeStyle==="dashed"?"10 7":"none"}></polyline>${g?O`<path d=${g} fill="none" stroke=${l} stroke-width=${a.strokeWidth}></path>`:o}${v?O`<polygon points=${v} fill=${l}></polygon>`:o}${a.tool==="callout"?O`<text x=${p(a.points[0])} y=${h(a.points[0])} fill=${l} font-size=${a.fontSize}>${a.text}</text>`:o}`})}${e.readOnly?o:O`<circle cx=${this.cursor.x*t.width} cy=${this.cursor.y*t.height} r="3" fill="none" stroke="currentColor"></circle>`}${this.draft?.points.length?O`<polyline points=${this.draft.points.map(a=>`${a.x*t.width},${a.y*t.height}`).join(" ")} fill="none" stroke="currentColor" stroke-width="2"></polyline>`:o}
            </svg>`:s`<p>${t?"Image unavailable":"Select an image"}</p>`}
        <h4>Marks</h4>
        ${e.layers.map(a=>s`<p>
              ${a.label} (${a.tool}) ${a.visible?"Visible":"Hidden"}
              ${e.readOnly?o:s`<button
                      type="button"
                      @click=${()=>this.change({selectedLayerId:a.id},`layer-selected:${a.id}`)}
                    >
                      Select</button
                    ><button
                      type="button"
                      @click=${()=>this.change({layers:e.layers.map(l=>l.id===a.id?{...l,visible:!l.visible}:l)},`layer-visibility:${a.id}:${!a.visible}`)}
                    >
                      Toggle visibility</button
                    >${[-1,1].map(l=>s`<button
                          type="button"
                          ?disabled=${e.layers.indexOf(a)+l<0||e.layers.indexOf(a)+l>=e.layers.length}
                          @click=${()=>{let c=e.layers.findIndex(f=>f.id===a.id),p=c+l;if(c<0||p<0||p>=e.layers.length)return;let h=[...e.layers];[h[c],h[p]]=[h[p],h[c]],this.change({layers:h},`layer-reordered:${a.id}`)}}
                        >
                          ${l<0?"Move up":"Move down"}
                        </button>`)}<button
                      type="button"
                      @click=${()=>this.change({layers:e.layers.filter(l=>l.id!==a.id),selectedLayerId:e.selectedLayerId===a.id?void 0:e.selectedLayerId},`layer-removed:${a.id}`)}
                    >
                      Remove
                    </button>`}
            </p>`)}`)}};var qd=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},So=n=>s`<p>
    <strong>${n.name}</strong> · ${n.ageLabel} · ${n.sexLabel}
    ${n.identifiers.map(e=>s`<span>${e.label}: ${e.display} </span>`)}
  </p>`;function Ld(n){if(/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/]*={0,2}$/i.test(n))return n;try{let e=new URL(n,"https://localhost");return["http:","https:","blob:"].includes(e.protocol)?n:void 0}catch{return}}var gt=(n,e)=>s`${n?s`<p role="status">Loading…</p>`:o}${e?s`<p role="alert">${e}</p>`:o}`,ao=class extends k{render(){let e=this.model;return e?this.panel("Patients",s` <form
          @submit=${t=>{t.preventDefault(),this.send({type:"searchRequested"})}}
        >
          <label
            >Search
            <input
              .value=${e.query}
              @input=${t=>this.send({type:"queryChanged",query:t.target.value})} /></label
          ><button>Search</button>
        </form>
        ${gt(e.loading,e.error)}${e.error?this.action("Retry",{type:"retryRequested"}):o}
        <ul>
          ${e.rows.map(t=>s`<li>
                <button
                  type="button"
                  aria-current=${t.patientId===e.selectedPatientId?"true":"false"}
                  @click=${()=>this.send({type:"patientSelected",patientId:t.patientId})}
                >
                  ${t.displayName} · ${t.primaryIdentifier} · ${t.ageLabel} ·
                  ${t.sexLabel} · ${t.careSettingLabel} · ${t.locationLabel}
                  ${t.queueLabel??""} ${t.status?.label??""}</button
                >${t.alerts?.map(i=>s`<span>${i.label}</span>`)}
              </li>`)}
        </ul>
        <p>Page ${e.page} · ${e.total} patients</p>
        ${this.action("Previous",{type:"pageChanged",page:e.page-1},()=>e.page>1)}
        ${this.action("Next",{type:"pageChanged",page:e.page+1},()=>e.page*e.pageSize<e.total)}`):o}},so=class extends k{render(){let e=this.model;return e?this.panel("Timeline",s`<ol>
        ${e.events.map(t=>s`<li>
              <button
                type="button"
                aria-current=${t.id===e.selectedId?"true":"false"}
                @click=${()=>this.send({type:"eventSelected",eventId:t.id})}
              >
                ${t.dateLabel} ·
                ${e.kinds.find(i=>i.id===t.kindId)?.label??t.kindId} ·
                ${t.title} ${t.summary??""}
              </button>
            </li>`)}
      </ol>`):o}},oo=class extends k{items(e){let t=this.model;return s`<ul>
      ${e.map(i=>s`<li>
            <button
              type="button"
              ?disabled=${!!i.disabled}
              aria-current=${i.id===t.activeId?"page":o}
              aria-expanded=${i.children?.length?String(t.expandedIds.includes(i.id)):o}
              @click=${()=>this.send(i.children?.length?{type:"itemExpansionRequested",itemId:i.id,expanded:!t.expandedIds.includes(i.id)}:{type:"itemSelected",itemId:i.id})}
            >
              ${i.label} ${i.badge?.label??""}</button
            >${i.children?.length&&t.expandedIds.includes(i.id)?this.items(i.children):o}
          </li>`)}
    </ul>`}render(){let e=this.model;return e?s`<nav aria-label=${e.title??"Navigation"}>
      ${this.items(e.items)}
    </nav>`:o}},no=class extends k{static{this.styles=[...k.styles,M`
      :host {
        display: block;
      }
      .shell {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
      }
      header {
        grid-column: 1/-1;
      }
      main {
        min-width: 0;
      }
      nav[hidden] {
        display: block;
      }
      @media (max-width: 700px) {
        .shell {
          display: block;
        }
        nav[hidden] {
          display: none;
        }
      }
    `]}render(){let e=this.model;if(!e)return o;let t=e.topBar.search;return s`<div class="shell">
      <header>
        <button
          type="button"
          @click=${()=>this.send({type:"navToggleRequested"})}
        >
          Menu
        </button>
        <strong>${e.topBar.title??""}</strong> <slot name="top-bar"></slot
        ><label
          >Search
          <input
            .value=${t.query}
            @focus=${()=>this.send({type:"searchOpenRequested"})}
            @input=${i=>this.send({type:"queryChanged",query:i.target.value})} /></label
        >${t.open?s`${gt(t.loading)}${t.groups.map(i=>s`<div>
                  <strong>${i.label}</strong>${i.results.map(r=>s`<button
                        type="button"
                        @click=${()=>this.send({type:"resultSelected",groupId:i.id,id:r.id})}
                      >
                        ${r.label} ${r.sub??""} ${r.badge?.label??""}
                      </button>`)}
                </div>`)}${this.action("Close search",{type:"searchCloseRequested"})}`:o}${e.topBar.userLabel?this.action(e.topBar.userLabel,{type:"menuRequested"}):o}
      </header>
      <nav ?hidden=${!e.navOpen}>
        <emr-left-nav
          .model=${e.nav}
          @intent=${i=>{i.stopPropagation(),this.send(i.detail)}}
        ></emr-left-nav
        ><slot name="navigation"></slot>
      </nav>
      <main><slot></slot></main>
      <aside><slot name="aside"></slot></aside>
    </div>`}},lo=class extends k{render(){let e=this.model;return e?.open?s`<section
      role="dialog"
      aria-label=${e.title??"Panel"}
      @keydown=${t=>{t.key==="Escape"&&this.send({type:"closeRequested"})}}
    >
      <header>
        ${e.showBack?this.action("Back",{type:"backRequested"}):o}
        <h2>${e.title??"Panel"}</h2>
        ${this.action("Close",{type:"closeRequested"})}
      </header>
      <slot></slot>${e.showFooter?s`<footer><slot name="footer"></slot></footer>`:o}
    </section>`:o}},ea=class extends k{render(){let e=this.model;return e?this.panel(e.label,s`<p>${e.acceptDescription??""}</p>
        <label
          >Add files
          <input
            type="file"
            ?multiple=${!!e.multiple}
            ?disabled=${!!e.disabled||!this.sourceTokenFactory}
            @change=${t=>{let i=this.sourceTokenFactory;if(!i||this.model?.disabled)return;let r=t.target,a=Array.from(r.files??[]).map(l=>({fileName:l.name,size:l.size,mediaType:l.type,sourceToken:i(l)}));a.length&&this.send({type:"filesSelected",files:a}),r.value=""}} /></label
        >${gt(!1,e.error)}
        <ul>
          ${e.candidates.map(t=>s`<li>
                ${t.fileName} · ${t.sizeLabel} · ${t.mediaTypeLabel} ·
                ${t.statusLabel}
                ${t.progress!==void 0?s`<progress max="100" value=${t.progress}></progress>`:o}
                ${t.error??""}
                ${t.status==="error"?this.action("Retry",{type:"candidateRetryRequested",candidateId:t.id},()=>!this.model?.disabled):o}
                ${t.status==="processing"||t.status==="ready"?this.action("Cancel",{type:"candidateCancelRequested",candidateId:t.id},()=>!this.model?.disabled):o}
                ${this.action("Remove",{type:"candidateRemoveRequested",candidateId:t.id},()=>!this.model?.disabled)}
              </li>`)}
        </ul>`):o}};qd([d({attribute:!1})],ea.prototype,"sourceTokenFactory",void 0);var co=class extends k{render(){let e=this.model;return e?this.panel(e.label,s`<label
          >Search
          <input
            .value=${e.query}
            @input=${t=>this.send({type:"queryChanged",query:t.target.value})} /></label
        >${["category","folder"].map(t=>s`<label
              >${t}<select
                .value=${e[t]??"all"}
                @change=${i=>this.send(t==="category"?{type:"categoryChanged",category:i.target.value}:{type:"folderChanged",folder:i.target.value})}
              >
                <option
                  value="all"
                  ?selected=${!e[`${t}Options`]?.some(i=>i.value===e[t]&&!i.disabled)}
                  .selected=${!e[`${t}Options`]?.some(i=>i.value===e[t]&&!i.disabled)}
                >
                  All
                </option>
                ${e[`${t}Options`]?.map(i=>s`<option
                      value=${i.value}
                      ?selected=${i.value===e[t]&&!i.disabled}
                      .selected=${i.value===e[t]&&!i.disabled}
                      ?disabled=${!!i.disabled}
                    >
                      ${i.label}
                    </option>`)}
              </select></label
            >`)}<label
          >Sort
          <select
            .value=${`${e.sort?.field??"createdAt"}:${e.sort?.direction??"desc"}`}
            @change=${t=>{let i=t.target.value,a={"createdAt:desc":["createdAt","desc"],"createdAt:asc":["createdAt","asc"],"title:asc":["title","asc"],"title:desc":["title","desc"],"folder:asc":["folder","asc"],"folder:desc":["folder","desc"]}[i];a&&this.send({type:"sortChanged",field:a[0],direction:a[1]})}}
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="title:asc">Title A to Z</option>
            <option value="title:desc">Title Z to A</option>
            <option value="folder:asc">Folder A to Z</option>
            <option value="folder:desc">Folder Z to A</option>
          </select></label
        >${gt(e.loading,e.error)}${e.error?this.action("Retry",{type:"retryRequested"}):o}
        <ul>
          ${e.documents.map(t=>s`<li>
                <button
                  type="button"
                  @click=${()=>this.send({type:"documentSelected",documentId:t.id})}
                >
                  ${t.title} · ${t.categoryLabel} · ${t.folderLabel} ·
                  ${t.createdAtLabel} · ${t.fileName} · ${t.sizeLabel}
                  ${t.status?.label??""}
                </button>
                ${t.canPreview?this.action("Preview",{type:"previewRequested",documentId:t.id}):o}
                ${t.canDownload?this.action("Download",{type:"downloadRequested",documentId:t.id}):o}
                ${t.canDelete?this.action("Delete",{type:"deleteRequested",documentId:t.id}):o}
              </li>`)}
        </ul>
        <p>Page ${e.page} · ${e.total} documents</p>
        ${this.action("Previous",{type:"pageChanged",page:e.page-1},()=>e.page>1)}
        ${this.action("Next",{type:"pageChanged",page:e.page+1},()=>e.page*e.pageSize<e.total)}`):o}},po=class extends k{render(){let e=this.model;if(!e?.open)return o;let t=e.page,i=t?Ld(t.rasterUrl):void 0;return this.panel(e.currentDocument?.title??"Document viewer",s`${this.action("Close",{type:"closeRequested"})}${gt(e.loading,e.error)}${e.error?this.action("Retry",{type:"retryRequested"}):o}
        <p>
          ${e.currentDocument?.fileName??""} · ${e.documentIndex+1} /
          ${e.documentCount}
        </p>
        ${t&&i?s`<img
              alt=${t.altText}
              src=${i}
              @error=${()=>this.send({type:"rasterLoadFailed",assetId:t.assetId})}
            />`:t?s`<p role="alert">Preview unavailable.</p>
                ${this.action("Retry",{type:"retryRequested"})}`:o}
        <p>Page ${e.pageIndex+1} / ${e.currentDocument?.pageCount??0}</p>
        ${this.action("Previous document",{type:"previousDocumentRequested"},()=>!!this.model?.canPreviousDocument)}
        ${this.action("Next document",{type:"nextDocumentRequested"},()=>!!this.model?.canNextDocument)}
        ${this.action("Previous page",{type:"previousPageRequested"},()=>!!this.model?.canPreviousPage)}
        ${this.action("Next page",{type:"nextPageRequested"},()=>!!this.model?.canNextPage)}`)}},ho=class extends k{nodes(e){return s`<ul>
      ${e.map(t=>s`<li>
            ${t.kind==="group"?this.action(`${t.expanded?"\u2212":"+"} ${t.label}`,{type:"nodeExpansionRequested",nodeId:t.id,expanded:!t.expanded},()=>!t.disabled):s`<span>${t.label} ${t.code??""}</span>`}
            ${t.loading?"Loading\u2026":""}
            ${t.kind==="group"&&t.selectable?this.action("Preview group",{type:"groupPreviewRequested",nodeId:t.id},()=>!t.disabled):o}
            ${t.kind==="item"&&t.selectable?this.action("Add",{type:"itemAddRequested",nodeId:t.id},()=>!t.disabled):o}${t.expanded&&t.children?this.nodes(t.children):o}
          </li>`)}
    </ul>`}render(){let e=this.model;return e?this.panel(e.title,s`<form
          @submit=${t=>{t.preventDefault(),this.send({type:"searchRequested"})}}
        >
          <label
            >Search
            <input
              .value=${e.query}
              @input=${t=>this.send({type:"queryChanged",query:t.target.value})} /></label
          ><button>Search</button>
        </form>
        ${gt(e.loading,e.error)}${e.error?this.action("Retry",{type:"retryRequested"}):o}${this.nodes(e.roots)}${e.preview?s`<section>
              <h4>${e.preview.groupLabel}</h4>
              <ul>
                ${e.preview.items.map(t=>s`<li>
                      ${t.label}
                      ${e.preview?.duplicateIds.includes(t.catalogueId)?"(duplicate)":""}
                    </li>`)}
              </ul>
              ${this.action("Add group",{type:"groupAddConfirmed",groupId:e.preview.groupId})}
              ${this.action("Dismiss",{type:"groupPreviewDismissed"})}
            </section>`:o}
        <h4>Selected orders</h4>
        ${e.selected.map(t=>s`<div>
              ${t.label}
              ${this.action("Remove",{type:"orderRemoveRequested",orderId:t.id})}${Object.entries(t.details??{}).map(([i,r])=>s`<label
                    >${i}${typeof r=="boolean"?s`<input
                          type="checkbox"
                          .checked=${r}
                          @change=${a=>this.send({type:"orderDetailChanged",orderId:t.id,field:i,value:a.target.checked})}
                        />`:s`<input
                          .value=${String(r??"")}
                          @change=${a=>this.send({type:"orderDetailChanged",orderId:t.id,field:i,value:a.target.value})}
                        />`}</label
                  >`)}
            </div>`)}`):o}},uo=class extends k{render(){let e=this.model;return e?this.panel(e.label,s`<p>${e.kind} ${e.code??""}</p>
        ${Object.entries(e.details??{}).map(([t,i])=>s`<label
                >${t}${typeof i=="boolean"?s`<input
                      type="checkbox"
                      .checked=${i}
                      @change=${r=>this.send({type:"detailChangeRequested",orderId:e.id,field:t,value:r.target.checked})}
                    />`:s`<input
                      .value=${String(i??"")}
                      @change=${r=>this.send({type:"detailChangeRequested",orderId:e.id,field:t,value:r.target.value})}
                    />`}</label
              >${e.errors?.[t]?s`<span role="alert">${e.errors[t]}</span>`:o}`)}${this.action("Remove",{type:"removeRequested",orderId:e.id})}`):o}},mo=class extends k{render(){let e=this.model;return e?.open?this.panel("Favourites",s`${this.action("Close",{type:"closed"})}${gt(e.loading,e.error)}${e.error?this.action("Retry",{type:"retryRequested"}):o}${["medication","laboratory","radiology","combination"].map(t=>this.action(t,{type:"tabChanged",kind:t}))}${e.mode==="list"?s`<label
              >Search
              <input
                .value=${e.query}
                @input=${t=>this.send({type:"queryChanged",query:t.target.value})} /></label
            >${this.action("Create",{type:"createRequested",kind:e.activeKind})}
            <ul>
              ${e.items.map((t,i)=>s`<li>
                    ${t.name} · ${t.summary??""}
                    ${this.action("Apply",{type:"applyRequested",id:t.id})}
                    ${this.action("Edit",{type:"editRequested",id:t.id})}
                    ${this.action("Delete",{type:"deleteRequested",id:t.id})}
                    ${this.action("Move up",{type:"moveRequested",id:t.id,direction:"up"},()=>i>0)}
                    ${this.action("Move down",{type:"moveRequested",id:t.id,direction:"down"},()=>i<e.items.length-1)}
                  </li>`)}
            </ul>`:s`${this.action("Back",{type:"backRequested"})}${e.mode==="editor"&&e.editor?s`<label
                  >Name
                  <input
                    .value=${e.editor.name}
                    @input=${t=>this.send({type:"editorNameChanged",name:t.target.value})}
                /></label>
                <ul>
                  ${e.editor.orderTemplates.map(t=>s`<li>
                        ${t.label}
                        ${this.action("Remove",{type:"editorOrdersChanged",orders:e.editor.orderTemplates.filter(i=>i.id!==t.id)})}
                      </li>`)}
                </ul>
                ${this.action("Save",{type:"saveRequested"})}`:s`<ul>
                ${e.applyIssues?.map(t=>s`<li>${t.label} · ${t.reason} ${t.detail??""}</li>`)}
              </ul>`}`}`):o}},go=class extends k{render(){let e=this.model;return e?this.panel(e.title,s`${gt(e.loading,e.error)}${e.error?this.action("Retry",{type:"retryRequested"}):o}${this.action("Refresh",{type:"refreshRequested"})}
        <p>${e.updatedLabel??""}</p>
        ${e.stations.length?o:s`<p>${e.emptyMessage}</p>`}${e.stations.map(t=>s`<section>
              <h4>${t.label} · ${t.countLabel}</h4>
              ${this.action("Call next",{type:"callNextRequested",stationId:t.id},()=>!!this.model&&!this.model.readOnly&&t.canCallNext)}${t.cards.length?o:s`<p>${e.emptyMessage}</p>`}
              <ul>
                ${t.cards.map(i=>s`<li>
                      <button
                        type="button"
                        aria-current=${i.id===e.selectedCardId?"true":"false"}
                        @click=${()=>this.send({type:"cardSelected",cardId:i.id})}
                      >
                        ${i.tokenLabel} · ${i.displayName} ·
                        ${i.primaryIdentifier} · ${i.ageSexLabel??""} ·
                        ${i.waitLabel} ${i.priority?.label??""}
                        ${i.flags?.map(r=>r.label).join(", ")??""}
                        ${i.nextStepLabel??""}
                      </button>
                      ${this.action("Open patient",{type:"patientOpenRequested",patientId:i.patientId})}<label
                        >Move to
                        <select
                          ?disabled=${!!e.readOnly||!!i.readOnly}
                          @change=${r=>{let a=r.target.value;a&&!this.model?.readOnly&&!i.readOnly&&this.send({type:"moveRequested",cardId:i.id,stationId:a})}}
                        >
                          <option value="">Select</option>
                          ${e.moveTargets.map(r=>s`<option
                                value=${r.value}
                                ?disabled=${!!r.disabled}
                              >
                                ${r.label}
                              </option>`)}
                        </select></label
                      >
                    </li>`)}
              </ul>
            </section>`)}`):o}},bo=class extends k{render(){let e=this.model;return e?this.panel("Arrival",s`${So(e.patient)}<label
          >Purpose
          <select
            .value=${e.selectedPurpose??""}
            @change=${t=>this.send({type:"purposeSelected",id:t.target.value})}
          >
            <option value="">Select</option>
            ${e.purposeOptions.map(t=>s`<option value=${t.id}>${t.label}</option>`)}
          </select></label
        >
        <ul>
          ${e.openReferrals.map(t=>s`<li>
                <label
                  ><input
                    type="checkbox"
                    .checked=${e.selectedReferralIds.includes(t.id)}
                    @change=${()=>this.send({type:"referralToggled",id:t.id})}
                  />${t.date} · ${t.centreName} · ${t.purpose} ·
                  ${t.daysSinceAdviceLabel} ${t.flags.join(", ")}
                  ${t.overdueBadge?.label??""} ${t.visitCountLabel??""}
                  ${t.nextDueLabel??""}</label
                >
              </li>`)}
        </ul>
        <label
          ><input
            type="checkbox"
            .checked=${e.noReferral}
            @change=${()=>this.send({type:"noReferralToggled"})}
          />No referral</label
        >${e.uhid?s`<label
                >UHID
                <input
                  .value=${e.uhid.value??""}
                  @input=${t=>this.send({type:"uhidChanged",raw:t.target.value})}
              /></label>
              <p>
                ${e.uhid.existing?.display??""}
                ${e.uhid.normalisedValue??""} ${e.uhid.warning??""}
                ${e.uhid.error??""}
              </p>
              ${this.action("Scan",{type:"scanRequested"})}
              ${this.action("Use UHID",{type:"uhidProvided",raw:e.uhid.value??""})}
              ${this.action("Skip UHID",{type:"uhidSkipped"})}`:o}${this.action("Submit",{type:"submitRequested"},()=>!!this.model?.canSubmit)}
        ${this.action("Cancel",{type:"cancelled"})}`):o}},fo=class extends k{render(){let e=this.model;return e?this.panel("Spectacle delivery",s`${So(e.patient)}
        <ul>
          ${e.bookings.map(t=>s`<li>
                <label
                  ><input
                    type="checkbox"
                    .checked=${e.selectedBookingIds.includes(t.id)}
                    @change=${()=>this.send({type:"bookingToggled",id:t.id})}
                  />${t.bookedDate} · ${t.type} · ${t.rxSummary} ·
                  ${t.daysOpenLabel} · ${t.paidBadge.label} ·
                  ${t.statusBadge.label}</label
                >
              </li>`)}
        </ul>
        <label
          >Delivery date
          <input
            type="date"
            .value=${e.deliveryDate}
            @change=${t=>this.send({type:"deliveryDateChanged",iso:t.target.value||null})} /></label
        >${this.action("Submit",{type:"submitRequested"},()=>!!this.model?.canSubmit)}
        ${this.action("Cancel",{type:"cancelled"})}`):o}},yo=class extends k{render(){let e=this.model;if(!e)return o;let t=(i,r)=>this.send({type:"filterChanged",centreId:e.filters.selectedCentreId,bookedFrom:e.filters.bookedFrom,bookedTo:e.filters.bookedTo,[i]:r||void 0});return this.panel("Booked not delivered",s`<label
          >Centre
          <select
            .value=${e.filters.selectedCentreId??""}
            @change=${i=>t("centreId",i.target.value)}
          >
            <option value="">All</option>
            ${e.filters.centreOptions.map(i=>s`<option value=${i.id}>${i.label}</option>`)}
          </select></label
        >${["bookedFrom","bookedTo"].map(i=>s`<label
              >${i==="bookedFrom"?"From":"To"}
              <input
                type="date"
                .value=${e.filters[i]??""}
                @change=${r=>t(i,r.target.value)}
            /></label>`)}
        <p role=${e.state==="error"?"alert":"status"}>
          ${e.message??(e.state==="loading"?"Loading\u2026":"")}
        </p>
        ${e.state==="error"?this.action("Retry",{type:"retryRequested"}):o}
        <ul>
          ${e.rows.map(i=>s`<li>
                <button
                  type="button"
                  @click=${()=>this.send({type:"rowSelected",bookingId:i.bookingId})}
                >
                  ${i.patientName} · ${i.primaryIdentifier} · ${i.centreName} ·
                  ${i.bookedDate} · ${i.daysOpenLabel} · ${i.type} ·
                  ${i.paidBadge.label} ${i.overdueBadge?.label??""}</button
                >${i.phone?this.action(`Call ${i.phone}`,{type:"callRequested",phone:i.phone}):o}
              </li>`)}
        </ul>
        <p>${e.pagingSummaryLabel}</p>
        ${this.action("Previous",{type:"pageChanged",page:e.page-1},()=>e.page>1)}
        ${this.action("Next",{type:"pageChanged",page:e.page+1},()=>e.page<e.pageCount)}`)}},vo=class extends k{render(){let e=this.model;return e?this.panel("Cataract episode",s`<p>
          ${e.eye??""} · ${e.statusBadge.label} · Admission
          ${e.admissionDate??"\u2014"} · Surgery ${e.sxDate??"\u2014"}
        </p>
        <ol>
          ${e.stages.stages.map(t=>s`<li>
                ${t.label} ${t.status?.label??""} ${t.description??""}
                ${t.id===e.stages.activeId?"(current)":""}
              </li>`)}
        </ol>
        <ul>
          ${e.followups.map(t=>s`<li>${t.label} · ${t.due} · ${t.statusBadge.label}</li>`)}
        </ul>
        ${this.action("Open",{type:"openRequested",id:e.id})}
        ${e.canCompleteSurgery?this.action("Complete surgery",{type:"completeSurgeryRequested",id:e.id},()=>!!this.model?.canCompleteSurgery):o}
        ${e.canAddFollowup?this.action("Add follow-up",{type:"addFollowupRequested",id:e.id},()=>!!this.model?.canAddFollowup):o}`):o}},$o=class extends k{render(){let e=this.model;if(!e)return o;let t=e.summary;return this.panel("Patient history",s`${So(e.patient)}${gt(e.loading)}${t.lastSpectacleRx?s`<p>
              Last spectacle prescription: ${t.lastSpectacleRx.date} ·
              ${t.lastSpectacleRx.type??""} ·
              ${t.lastSpectacleRx.statusBadge.label} · RE
              ${Object.values(t.lastSpectacleRx.re).join(" / ")} · LE
              ${Object.values(t.lastSpectacleRx.le).join(" / ")}
            </p>`:o}${t.lastGlaucomaScreen?s`<p>
              Glaucoma: ${t.lastGlaucomaScreen.date} · IOP
              ${t.lastGlaucomaScreen.iopRe??"\u2014"} /
              ${t.lastGlaucomaScreen.iopLe??"\u2014"} · CDR
              ${t.lastGlaucomaScreen.cdrRe??"\u2014"} /
              ${t.lastGlaucomaScreen.cdrLe??"\u2014"} ·
              ${t.lastGlaucomaScreen.decision??""}
            </p>`:o}${t.lastDrScreen?s`<p>
              DR: ${t.lastDrScreen.date} · ${t.lastDrScreen.gradeRe??"\u2014"} /
              ${t.lastDrScreen.gradeLe??"\u2014"} ·
              ${t.lastDrScreen.maculopathyRe??"\u2014"} /
              ${t.lastDrScreen.maculopathyLe??"\u2014"} ·
              ${t.lastDrScreen.decision??""}
            </p>`:o}
        <h4>Referrals</h4>
        ${t.openReferrals.map(i=>this.action(`${i.date} \xB7 ${i.centreName} \xB7 ${i.purpose} \xB7 ${i.statusBadge.label} ${i.flags.join(", ")} ${i.visitCountLabel??""} ${i.nextDueLabel??""}`,{type:"referralSelected",id:i.id}))}
        <h4>Bookings</h4>
        ${t.openBookings.map(i=>this.action(`${i.date} \xB7 ${i.type} \xB7 ${i.paidBadge.label} \xB7 ${i.daysOpenLabel} ${i.overdueBadge?.label??""}`,{type:"bookingSelected",id:i.id}))}
        <h4>Episodes</h4>
        ${t.openEpisodes.map(i=>this.action(`${i.eye??""} ${i.statusBadge.label}`,{type:"episodeSelected",id:i.id}))}
        <h4>Visits</h4>
        <ol>
          ${e.visits.map(i=>s`<li>
                ${this.action(`${i.date} \xB7 ${i.centreName} \xB7 ${i.teamName} \xB7 ${i.pvaRe??""} / ${i.pvaLe??""} \xB7 ${i.diagnosis??""} \xB7 ${i.advice??""}`,{type:"visitSelected",id:i.id})}
              </li>`)}
        </ol>`)}},xo=class extends k{render(){let e=this.model;return e?this.panel(e.title??"Record changes",s`<p>${e.summaryLabel??""}</p>
        ${e.sections.map(t=>s`<section>
              <h4>${t.label}</h4>
              <ul>
                ${t.changes.map(i=>s`<li>
                      <button
                        type="button"
                        @click=${()=>this.send({type:"changeSelected",id:i.id})}
                      >
                        ${i.label} · ${e.kindBadges?.[i.kind]?.label??i.kind}
                        · Before: ${i.before??"\u2014"} · After: ${i.after??"\u2014"}
                      </button>
                    </li>`)}
              </ul>
            </section>`)}`):o}},wo=class extends k{render(){let e=this.model;return e?this.panel(e.label,s`<p>${e.acceptDescription??""}</p>
        <label
          >Add files
          <input
            type="file"
            accept=${e.accept??""}
            ?multiple=${!!e.multiple}
            @change=${t=>{let i=t.target,r=Array.from(i.files??[]).map(a=>({name:a.name,size:a.size,type:a.type,file:a}));r.length&&this.send({type:"filesPicked",files:r}),i.value=""}}
        /></label>
        <ul>
          ${e.items.map(t=>s`<li>
                ${t.name} · ${t.sizeLabel} · ${t.status.label}
                ${t.progress!==void 0?s`<progress max="100" value=${t.progress}></progress>`:o}
                ${t.error??""}
                ${t.error?this.action("Retry",{type:"retryRequested",id:t.id}):o}
                ${this.action("Remove",{type:"removeRequested",id:t.id})}
              </li>`)}
        </ul>
        ${this.action("Publish",{type:"publishRequested"},()=>!!this.model?.canPublish)}`):o}};function Sl(){y("emr-patient-list",ao),y("emr-timeline",so),y("emr-left-nav",oo),y("emr-app-shell",no),y("emr-right-flyout",lo),y("emr-document-upload-queue",ea),y("emr-patient-documents",co),y("emr-document-viewer",po),y("emr-hierarchy-order-picker",ho),y("emr-order-details",uo),y("emr-favourites-panel",mo),y("emr-work-queue",go),y("emr-arrival-linker",bo),y("emr-spectacle-delivery",fo),y("emr-booked-not-delivered-list",yo),y("emr-cataract-episode-card",vo),y("emr-patient-history-timeline",$o),y("emr-record-diff",xo),y("emr-upload-queue",wo)}var Ed=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},Fe=n=>n?s`<span class=${`emr-badge emr-badge--${n.tone}`} aria-label=${n.assistiveText||n.label}
        >${n.label}</span
      >`:o,Oi=n=>s`<div>
    <strong>${n.name}</strong> ${n.ageLabel} ${n.sexLabel}
    ${n.identifiers.map(e=>s`<div>${e.label}: ${e.display} ${Fe(e.statusBadge)}</div>`)}
    ${n.phone?s`<div>${n.phone}</div>`:o}${n.centreName?s`<div>${n.centreName}</div>`:o}
    ${n.lastVisitDate?s`<div>${n.lastVisitDate}</div>`:o}${n.aliases?.map(e=>s`<div>${e}</div>`)}
  </div>`,Lt=n=>n.target.value,bt=(n,e,t,i)=>s` <label
    >${n}<select
      class="emr-control"
      .value=${I(t??"")}
      @change=${r=>i(Lt(r))}
    >
      <option value="" disabled ?selected=${!t}>Select</option>
      ${e.map(r=>s`<option value=${r.id} ?selected=${r.id===t}>${r.label}</option>`)}
    </select>
  </label>`,ia=(n,e,t)=>s`<div role="group" aria-label=${n.title} class="emr-card">
    <strong>${n.title}</strong>
    <p>${n.body}</p>
    <button type="button" class="emr-btn" @click=${e}>${n.confirmLabel}</button>
    <button type="button" class="emr-btn" @click=${t}>${n.cancelLabel}</button>
  </div>`,ra=(n,e)=>n==="ready"?o:s`<p role="status">
        ${e||(n==="loading"?"Loading\u2026":n==="empty"?"No records":"Unable to load")}
      </p>`,ko=class extends k{render(){let e=this.model;if(!e)return o;let t=(i,r,a,l)=>s`<fieldset ?disabled=${a}>
        <legend>Decision</legend>
        ${["granted","refused"].map(c=>s`<label>
              <input
                type="radio"
                name=${`${l?"category":"purpose"}-${i}`}
                .checked=${I(r===c)}
                @change=${()=>this.send(l?{type:"categoryDecided",id:i,decision:c}:{type:"purposeDecided",id:i,decision:c})}
              />${c==="granted"?"Grant":"Refuse"}</label
            >`)}
      </fieldset>`;return this.panel("Consent",s` ${bt("Language",e.languageOptions,e.selectedLanguage,i=>this.send({type:"languageSelected",id:i}))}
        <h4>${e.notice.title}</h4>
        <p>${e.notice.version} · ${e.notice.languageLabel}</p>
        ${e.notice.sections.map(i=>s`<section>
              <strong>${i.heading}</strong>
              <p>${i.body}</p>
            </section>`)}
        ${e.categories.map(i=>s`<section>
              <h4>${i.label}</h4>
              <p>${i.description}</p>
              ${i.mode==="whole"&&i.purposes.some(r=>!r.essential)?t(i.id,i.decision,!!i.locked,!0):o}
              ${i.purposes.map(r=>s`<div>
                    <strong>${r.label}</strong>
                    <p>${r.description}</p>
                    ${r.essential?s`<span>Essential</span>`:i.mode==="per_purpose"?t(r.id,r.decision,!!r.locked,!1):o}
                  </div>`)}
            </section>`)}
        ${bt("Given by",e.givenByOptions,e.selectedGivenBy,i=>this.send({type:"givenBySelected",id:i}))}
        ${e.guardian?s`<label
                >Guardian name<input
                  class="emr-control"
                  .value=${I(e.guardian.name??"")}
                  ?required=${e.guardian.required}
                  @input=${i=>this.send({type:"guardianChanged",name:Lt(i),relationship:e.guardian?.relationship})}
                />
              </label>
              <span role="status">${e.guardian.nameError}</span>
              <label
                >Relationship<input
                  class="emr-control"
                  .value=${I(e.guardian.relationship??"")}
                  ?required=${e.guardian.required}
                  @input=${i=>this.send({type:"guardianChanged",name:e.guardian?.name,relationship:Lt(i)})}
                />
              </label>
              <span role="status">${e.guardian.relationshipError}</span>`:o}
        ${bt("Method",e.methodOptions,e.selectedMethod,i=>{let r=e.methodOptions.find(a=>a.id===i);r&&this.send({type:"methodSelected",id:r.id})})}
        ${e.selectedMethod==="signature"?s`${e.capture?.signatureLabel}
            ${this.action("Capture signature",{type:"signatureRequested"})}`:o}
        ${e.selectedMethod==="thumbprint"?s`${e.capture?.thumbprintLabel}
            ${this.action("Capture thumbprint",{type:"thumbprintRequested"})}`:o}
        ${e.selectedMethod==="verbal_attested"&&e.attestation?s`<div>
              <strong>${e.attestation.title}</strong>
              <p>${e.attestation.statement}</p>
              ${e.attestation.signatories.map(i=>s`<p>${i.displayName} · ${i.roleLabel} ${Fe(i.status)} ${i.signedAtLabel}</p>`)}
              <p>${e.attestation.error}</p>
              ${e.attestation.canSign&&!e.attestation.readOnly?this.action(e.attestation.signLabel||"Confirm attestation",{type:"attestationConfirmed"}):o}
            </div>`:o}
        ${e.submitError?s`<p role="alert">${e.submitError}</p>`:o}
        <div class="emr-actions">
          ${e.canSubmit?this.action("Submit",{type:"submitRequested"}):o}${this.action("Cancel",{type:"cancelled"})}
        </div>`)}},Io=class extends k{render(){let e=this.model;return e?this.panel("Consent review",s`${Oi(e.patient)}
        <p>${e.noticeVersionLabel}</p>
        ${e.message?s`<p role="status">${e.message.text}</p>`:o}
        ${e.categories.map(t=>s`<section>
              <h4>${t.label}</h4>
              <p>${t.description}</p>
              ${t.purposes.map(i=>s`<div>
                    <strong>${i.label}</strong> ${Fe(i.statusBadge)}
                    <p>${i.description}</p>
                    <p>${i.decidedAtLabel} ${i.methodLabel} ${i.givenByLabel}</p>
                    ${i.essential?s`<span>Essential</span>`:o}
                    ${i.canWithdraw?this.action("Withdraw",{type:"withdrawRequested",purposeId:i.id}):o}${i.canGrant?this.action("Grant",{type:"grantRequested",purposeId:i.id}):o}
                    ${i.contact?s`<fieldset>
                            <legend>Contact channels</legend>
                            ${i.contact.channels.map(r=>s`<label>
                                  <input
                                    type="checkbox"
                                    .checked=${I(r.selected)}
                                    @change=${()=>this.send({type:"channelToggled",purposeId:i.id,channelId:r.id})}
                                  />${r.label}</label
                                >`)}
                          </fieldset>
                          <label
                            >${i.contact.preferredNumberLabel}<input
                              class="emr-control"
                              .value=${I(i.contact.preferredNumber??"")}
                              @input=${r=>this.send({type:"preferredNumberChanged",purposeId:i.id,value:Lt(r)})}
                            />
                          </label>
                          <span role="status">${i.contact.preferredNumberError}</span>`:o}
                  </div>`)}
            </section>`)}
        ${this.action("Receipt",{type:"receiptRequested"})}${this.action("Cancel",{type:"cancelled"})}${e.pendingWithdrawal?ia(e.pendingWithdrawal,()=>{let t=e.pendingWithdrawal.purposeId;this.model?.pendingWithdrawal?.purposeId===t&&this.model.categories.some(i=>i.purposes.some(r=>r.id===t&&r.canWithdraw))&&this.send({type:"withdrawConfirmed",purposeId:t})},()=>{this.model?.pendingWithdrawal?.purposeId===e.pendingWithdrawal.purposeId&&this.send({type:"withdrawDismissed"})}):o}`):o}},Co=class extends k{render(){let e=this.model;return e?this.panel(e.title,s`<strong>${e.patientName}</strong>${e.identifiers.map(t=>s`<div>${t.label}: ${t.display}</div>`)}
        <p>${e.dateLabel} · ${e.noticeVersionLabel}</p>
        ${e.categories.map(t=>s`<section>
              <h4>${t.label}</h4>
              ${t.purposes.map(i=>s`<div>${i.label}: ${i.decisionLabel} ${Fe(i.statusBadge)}</div>`)}
            </section>`)}
        <p>${e.howToChange}</p>
        <p>${e.footer}</p>`):o}},ta=class extends k{constructor(){super(...arguments),this.interactive=!1}render(){let e=this.model;if(!e)return o;let t=s`${Fe(e.badge)} ${e.detail}`;return this.interactive?s`<button
          type="button"
          class="emr-btn emr-btn--ghost"
          @click=${()=>{this.interactive&&this.model&&this.send({type:"consentDetailsRequested"})}}
        >
          ${t}
        </button>`:s`<span role="status">${t}</span>`}};Ed([d({type:Boolean})],ta.prototype,"interactive",void 0);var Ro=class extends k{render(){let e=this.model;return e?this.panel("Sharing grants",s`${e.notice?s`<p role="status">${e.notice.text}</p>`:o}${e.filters?bt("Filter",e.filters,e.selectedFilter,t=>this.send({type:"filterSelected",id:t})):o}${ra(e.state,e.message)}${e.state==="error"?this.action("Retry",{type:"retryRequested"}):o}
      ${e.state==="ready"?e.grants.map(t=>s`<article>
                <h4>${t.recipientLabel} ${Fe(t.statusBadge)}</h4>
                <p>${t.recipientTypeLabel} ${t.purposeLabel}</p>
                <p>${t.dataScope.join(", ")}</p>
                <p>${t.recordsPeriodLabel} ${t.validFromLabel} ${t.validToLabel}</p>
                <p>${t.grantedAtLabel} ${t.grantedByLabel}</p>
                ${this.action("Details",{type:"grantSelected",id:t.id})}${t.canRevoke?this.action("Revoke",{type:"revokeRequested",grantId:t.id}):o}
              </article>`):o}
      ${e.pendingRevoke?ia(e.pendingRevoke,()=>{let t=e.pendingRevoke.grantId;this.model?.pendingRevoke?.grantId===t&&this.model.grants.some(i=>i.id===t&&i.canRevoke)&&this.send({type:"revokeConfirmed",grantId:t})},()=>{this.model?.pendingRevoke?.grantId===e.pendingRevoke.grantId&&this.send({type:"revokeDismissed"})}):o}`):o}},Oo=class extends k{render(){let e=this.model;return e?this.panel("Access log",s`${e.periodOptions?bt("Period",e.periodOptions,e.selectedPeriod,t=>this.send({type:"periodSelected",id:t})):o}${ra(e.state,e.message)}${e.state==="error"?this.action("Retry",{type:"retryRequested"}):o}
      ${e.state==="ready"?e.entries.map(t=>s`<article>
                <strong>${t.actionLabel}</strong> ${Fe(t.badge)}
                <p>${t.atLabel} · ${t.actorLabel} ${t.actorRoleLabel} ${t.organisationLabel}</p>
                <p>${t.dataLabel} ${t.purposeLabel}</p>
                ${this.action("Details",{type:"entrySelected",id:t.id})}${t.canReportConcern?this.action("Report concern",{type:"concernRequested",entryId:t.id}):o}
              </article>`):o}
      ${e.canLoadMore?this.action("Load more",{type:"loadMoreRequested"}):o}`):o}},Ao=class extends k{render(){let e=this.model;if(!e)return o;let t=e.draft;return this.panel("Rights requests",s`${e.notice?s`<p role="status">${e.notice.text}</p>`:o}${ra(e.state,e.message)}${e.state==="error"?this.action("Retry",{type:"retryRequested"}):o}${e.state==="ready"?e.requests.map(i=>s`<article>
                <strong>${i.kindLabel}</strong> ${Fe(i.statusBadge)}
                <p>${i.submittedAtLabel} ${i.dueLabel}</p>
                <p>${i.summary}</p>
                <p>${i.responseText}</p>
                ${this.action("Details",{type:"requestSelected",id:i.id})}${i.canWithdraw?this.action("Withdraw",{type:"withdrawRequested",requestId:i.id}):o}
              </article>`):o}
      ${t?s`${bt("Request type",t.kindOptions,t.kind,i=>{let r=t.kindOptions.find(a=>a.id===i);r&&this.send({type:"kindSelected",kind:r.id})})}${t.kindOptions.find(i=>i.id===t.kind)?.description}
            <p>${t.guidance}</p>
            <label
              >${t.descriptionLabel}<textarea
                class="emr-control"
                .value=${I(t.description??"")}
                @input=${i=>this.send({type:"descriptionChanged",value:Lt(i)})}
              >
              </textarea>
            </label>
            <span role="status">${t.descriptionError}</span>
            ${t.nominee?["name","relationship","contact"].map(i=>s`<label
                        >${i}<input
                          class="emr-control"
                          .value=${I(t.nominee?.[i]??"")}
                          @input=${r=>this.send({type:"nomineeChanged",name:t.nominee?.name,relationship:t.nominee?.relationship,contact:t.nominee?.contact,[i]:Lt(r)})}
                        />
                      </label>
                      <span role="status">${t.nominee?.[`${i}Error`]}</span>`):o}
            <p>${t.attachmentsLabel}</p>
            ${t.canAttach?this.action("Attach",{type:"attachRequested"}):o}
            <p role="status">${t.submitError}</p>
            ${t.canSubmit?this.action("Submit",{type:"draftSubmitted"}):o}${this.action("Cancel",{type:"draftCancelled"})}`:this.action("New request",{type:"newRequestStarted"})}
      ${e.pendingWithdrawal?ia(e.pendingWithdrawal,()=>{let i=e.pendingWithdrawal.requestId;this.model?.pendingWithdrawal?.requestId===i&&this.model.requests.some(r=>r.id===i&&r.canWithdraw)&&this.send({type:"withdrawConfirmed",requestId:i})},()=>{this.model?.pendingWithdrawal?.requestId===e.pendingWithdrawal.requestId&&this.send({type:"withdrawDismissed"})}):o}`)}},qo=class extends k{render(){let e=this.model;return e?this.panel(e.title,s`<nav aria-label="Privacy sections">
          ${e.sections.map(t=>s`<button
                type="button"
                class="emr-btn"
                aria-current=${t.id===e.activeSection?"page":o}
                @click=${()=>this.send({type:"sectionSelected",id:t.id})}
              >
                ${t.label}
              </button>`)}
        </nav>
        ${e.tiles.map(t=>s`<button
              type="button"
              class="emr-btn"
              @click=${()=>this.send({type:"tileSelected",key:t.key})}
            >
              ${t.label}: ${t.value} ${t.sub} ${Fe(t.status)}
            </button>`)}
        <p>${e.contactText}</p>`):o}},Lo=class extends k{render(){let e=this.model;return e?this.panel("Patient identity",s`${Oi(e)}${e.alerts?.map(t=>s`<div role="status">
            ${t.text}
            ${t.actionLabel?this.action(t.actionLabel,{type:"alertActionRequested",id:t.id}):o}
          </div>`)}${e.addableSystems?.map(t=>this.action(`Add ${t.label}`,{type:"addIdentifierRequested",system:t.system}))}${this.action("Confirm",{type:"confirmRequested"})}${this.action("Not this patient",{type:"notThisPatientRequested"})}`):o}},Eo=class extends k{render(){let e=this.model;return e?this.panel("Identifier check",s`<p>${e.identifier.label}: ${e.identifier.display}</p>
        <p>${e.outcome}</p>
        ${e.findings.map(t=>s`<article>
              <strong>${t.message}</strong>${t.evidence.map(i=>s`<div>${i.label}: ${i.value}</div>`)}${t.candidate?s`${Oi(t.candidate)}${e.outcome==="blocked"?this.action("Merge",{type:"mergeRequested",candidateId:t.candidate.id}):o}`:o}${e.outcome==="warnings"?s`<label>
                    <input
                      type="checkbox"
                      .checked=${I(!!t.acknowledged)}
                      @change=${()=>this.send({type:"findingAcknowledged",findingId:t.id})}
                    />I have reviewed this</label
                  >`:o}
            </article>`)}${e.outcome!=="blocked"&&e.canConfirm?this.action("Confirm",{type:"confirmRequested"}):o}${e.outcome!=="blocked"&&e.canAddAsAdditional?this.action("Add as additional",{type:"addAsAdditional"}):o}${e.outcome!=="blocked"&&e.canReplaceExisting?this.action("Replace existing",{type:"replaceExisting"}):o}${e.outcome==="blocked"?this.action("Re-enter",{type:"reenterRequested"}):o}${this.action("Cancel",{type:"cancelled"})}`):o}},Po=class extends k{render(){let e=this.model;return e?this.panel("Link cards",s`${Oi(e.patient)}<emr-identifier-entry
          .model=${e.entry}
          @intent=${t=>{t.stopPropagation(),!this.model?.entry.readOnly&&(t.detail.type==="valueChanged"?this.send({type:"entryChanged",raw:t.detail.raw}):this.send(t.detail))}}
        >
        </emr-identifier-entry
        >${e.entry.readOnly?o:this.action("Add card",{type:"cardEntered"})}
        ${e.cards.map(t=>s`<article>
              <strong>${t.display}</strong> ${Fe(t.statusBadge)}
              <p>${t.message}</p>
              ${t.warnings?.map(i=>s`<p>${i}</p>`)}${t.state==="on_other_patient"&&t.candidate?s`${Oi(t.candidate)}${this.action("Same patient",{type:"sameConfirmed",id:t.id})}${this.action("Different patient",{type:"notSameConfirmed",id:t.id})}`:o}<label>
                <input
                  type="radio"
                  name="primary-card"
                  .checked=${I(e.primaryCardId===t.id)}
                  @change=${()=>this.send({type:"primarySelected",id:t.id})}
                />Primary card</label
              >${this.action("Remove",{type:"cardRemoved",id:t.id})}
            </article>`)}
        <p role="status">${e.submitError}</p>
        ${e.canSubmit?this.action("Submit",{type:"submitRequested"}):o}${this.action("Cancel",{type:"cancelled"})}`):o}},Do=class extends k{render(){let e=this.model;return e?this.panel(e.reasonLabel,s`${bt("Number",e.numberOptions,e.selectedNumber,t=>this.send({type:"numberSelected",id:t}))}${e.selectedNumber?this.action("Call",{type:"callRequested",numberId:e.selectedNumber}):o}${bt("Channel",e.channelOptions,e.selectedChannel,t=>this.send({type:"channelSelected",id:t}))}<label>
          <input
            type="checkbox"
            .checked=${I(e.reached??!1)}
            @change=${t=>this.send({type:"reachedChanged",reached:t.target.checked})}
          />Reached the patient</label
        >${bt("Outcome",e.outcomeOptions,e.selectedOutcome,t=>this.send({type:"outcomeSelected",id:t}))}
        <p>${e.consequence}</p>
        <label
          >Next action date<input
            type="date"
            class="emr-control"
            .value=${I(e.nextActionDate??"")}
            @input=${t=>this.send({type:"nextActionDateChanged",date:Lt(t)||null})}
          />
        </label>
        <span role="status">${e.nextActionDateError}</span>
        <label
          >Note<textarea
            class="emr-control"
            .value=${I(e.note??"")}
            @input=${t=>this.send({type:"noteChanged",note:Lt(t)})}
          >
          </textarea>
        </label>
        <p role="status">${e.submitError}</p>
        ${e.canSubmit?this.action("Save attempt",{type:"submitRequested"}):o}${this.action("Cancel",{type:"cancelled"})}`):o}},To=class extends k{render(){let e=this.model;return e?s`${Fe(e.statusBadge)} ${e.text}
    ${this.action("Log attempt",{type:"logAttemptRequested"})}`:o}},Mo=class extends k{render(){let e=this.model;return e?this.panel("Compare records",s`<fieldset>
          <legend>Surviving record</legend>
          ${e.sources.map(t=>s`<div>
                ${Oi(t)}<label>
                  <input
                    type="radio"
                    name="survivor"
                    .checked=${I(e.survivorSourceId===t.id)}
                    @change=${()=>this.send({type:"survivorChosen",sourceId:t.id})}
                  />Keep ${t.label||t.name}</label
                >
              </div>`)}
        </fieldset>
        ${e.rows.map(t=>s`<fieldset>
              <legend>${t.label} · ${t.differs?"Differs":"Same"}</legend>
              ${e.sources.map(i=>s`<div>
                    ${i.label||i.name}:
                    ${t.values[i.id]??""}${t.differs?s`<label>
                          <input
                            type="radio"
                            name=${`row-${t.id}`}
                            .checked=${I(t.chosenSourceId===i.id)}
                            @change=${()=>this.send({type:"fieldChosen",rowId:t.id,sourceId:i.id})}
                          />Use ${i.label||i.name} value for ${t.label}</label
                        >`:o}
                  </div>`)}
            </fieldset>`)}${e.canConfirm?this.action("Confirm merge",{type:"mergeConfirmed"}):o}${this.action("Reject",{type:"rejected"})}${this.action("Cancel",{type:"cancelled"})}`):o}},No=class extends k{render(){let e=this.model;return e?this.panel("Draft records",s`${ra(e.state,e.message)}${e.state==="error"?this.action("Retry",{type:"retryRequested"}):o}${e.state==="ready"?e.rows.map(t=>s`<article>
                <strong>${t.title}</strong> ${Fe(t.stateBadge)}
                <p>${t.subtitle} ${t.patientLabel}</p>
                <p>Updated: ${t.updatedAtLabel}</p>
                ${t.canOpen?this.action("Open",{type:"rowOpened",id:t.id}):o}${t.canMove?this.action("Move to another patient",{type:"moveToPatientRequested",id:t.id}):o}${t.canDiscard?this.action("Discard",{type:"discardRequested",id:t.id}):o}
              </article>`):o}
      ${e.pendingDiscard?ia(e.pendingDiscard,()=>{let t=e.pendingDiscard.id;this.model?.pendingDiscard?.id===t&&this.model.rows.some(i=>i.id===t&&i.canDiscard)&&this.send({type:"discardConfirmed",id:t})},()=>{this.model?.pendingDiscard?.id===e.pendingDiscard.id&&this.send({type:"discardDismissed"})}):o}`):o}};function kl(){Wr(),y("emr-consent-capture",ko),y("emr-consent-review",Io),y("emr-consent-receipt",Co),y("emr-consent-status-badge",ta),y("emr-sharing-grants",Ro),y("emr-access-log",Oo),y("emr-rights-requests",Ao),y("emr-privacy-centre",qo),y("emr-patient-identity-card",Lo),y("emr-identifier-check-prompt",Eo),y("emr-link-cards",Po),y("emr-contact-attempt-form",Do),y("emr-contact-attempt-summary",To),y("emr-merge-compare",Mo),y("emr-draft-record-list",No)}var Et=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a};var Il=M`
  .plot { display: grid; gap: 6px; }
  .track { display: block; inline-size: 100%; background: var(--emr-surface-soft); }
  .bar { display: block; min-block-size: 8px; background: var(--emr-primary); }
  .columns { display: flex; gap: 8px; overflow: auto; }
  .columns .track { display: flex; align-items: end; block-size: 120px; }
  .columns .bar { inline-size: 100%; min-block-size: 0; }
  .chart-action { display: grid; gap: 6px; min-inline-size: 80px; text-align: start; }
`,Bo=class extends k{static{this.styles=[...k.styles,Il]}render(){let e=this.model;if(!e)return o;let t=e.series.flatMap(a=>e.categories.map(l=>a.values[l.id])),i=Math.max(1,e.maxValue??0,...t.filter(a=>Number.isFinite(a))),r=e.orientation==="vertical";return this.panel(e.title,s`
      ${e.description?s`<p class="emr-muted">${e.description}</p>`:o}
      ${e.yAxisLabel?s`<p>${e.yAxisLabel}</p>`:o}
      ${!e.categories.length||!e.series.length?s`<p>No chart data.</p>`:s`
        <div class=${r?"columns":"plot"}>
          ${e.categories.flatMap(a=>e.series.map(l=>{let c=l.values[a.id],p=typeof c=="number"&&Number.isFinite(c)&&c>=0,h=p?l.valueLabels?.[a.id]??String(c):"No data",f=p?c/i*100:0;return s`<button type="button" class="emr-btn emr-btn--ghost chart-action"
              @click=${()=>this.send({type:"categorySelected",categoryId:a.id,seriesId:l.id})}>
              <span>${a.label} · ${l.label}: ${h}</span>
              ${p?s`<span class="track" aria-hidden="true">
                <span class="bar" style=${r?`height:${f}%`:`width:${f}%`}></span>
              </span>`:o}
            </button>`}))}
        </div>
      `}
    `)}},_o=class extends k{static{this.styles=[...k.styles,Il]}render(){let e=this.model;if(!e)return o;let t=Math.max(1,...e.steps.map(i=>i.value).filter(Number.isFinite));return this.panel(e.title,s`
      ${e.description?s`<p class="emr-muted">${e.description}</p>`:o}
      ${e.steps.length?o:s`<p>No funnel data.</p>`}
      <div class="plot">
        ${e.steps.map(i=>{let r=Number.isFinite(i.value)?Math.max(0,i.value/t*100):0;return s`<button type="button" class="emr-btn emr-btn--ghost chart-action"
            @click=${()=>this.send({type:"stepSelected",stepId:i.id})}>
            <span>${i.label}: ${i.valueLabel}${i.conversionLabel?` \xB7 ${i.conversionLabel}`:""}</span>
            <span class="track" aria-hidden="true"><span class="bar" style=${`width:${r}%`}></span></span>
          </button>`})}
      </div>
    `)}},aa=class extends k{constructor(){super(...arguments),this.showForgot=!1}static{this.styles=[...k.styles,M`
    .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-inline-size: 260px; }
    .dots { letter-spacing: 0.3em; }
  `]}render(){let e=this.model;if(!e)return o;let t=["1","2","3","4","5","6","7","8","9","Delete","0","Submit"],i=()=>!!this.model&&!this.model.locked;return this.panel(e.title,s`
      ${e.prompt?s`<p>${e.prompt}</p>`:o}
      <div class="dots" role="img" aria-label=${`${e.digitsEntered} of ${e.length} digits entered`}>
        ${Array.from({length:e.length},(r,a)=>a<e.digitsEntered?"\u25CF":"\u25CB").join("")}
      </div>
      ${e.error?s`<p class="emr-error" role="alert">${e.error}</p>`:o}
      ${e.locked&&e.lockoutMessage?s`<p role="alert">${e.lockoutMessage}</p>`:o}
      <div class="keypad">
        ${t.map(r=>this.action(r,r==="Delete"?{type:"deleted"}:r==="Submit"?{type:"submitted"}:{type:"digitPressed",digit:r},i))}
      </div>
      <div class="emr-actions">
        ${e.biometric?.available?this.action(e.biometric.label,{type:"biometricRequested"},()=>!!this.model?.biometric?.available):o}
        ${this.showForgot?this.action("Forgot PIN?",{type:"forgotRequested"},()=>this.showForgot):o}
      </div>
    `)}};Et([d({type:Boolean})],aa.prototype,"showForgot",void 0);var Ho=class extends k{submit(e){e.preventDefault();let t=this.model;if(!t||t.busy)return;let i=e.currentTarget.elements.namedItem("password"),r=i.value;i.value="",this.send({type:"submitRequested",username:t.username,password:r})}render(){let e=this.model;return e?this.panel(e.title??"Sign in",s`
      <form class="emr-stack" @submit=${this.submit}>
        <label class="emr-field">${e.usernameLabel}
          <input class="emr-control" autocomplete="username" .value=${I(e.username)}
            ?readonly=${!!e.busy} @input=${t=>{this.model&&!this.model.busy&&this.send({type:"usernameChanged",value:t.target.value})}}>
        </label>
        <label class="emr-field">${e.passwordLabel}
          <input class="emr-control" type="password" name="password" autocomplete="current-password" ?readonly=${!!e.busy}>
        </label>
        ${e.error?s`<p class="emr-error" role="alert">${e.error}</p>`:o}
        <button type="submit" class="emr-btn" aria-disabled=${!!e.busy}>${e.busy?"Signing in\u2026":"Sign in"}</button>
      </form>
    `):o}},nr=class extends S{constructor(){super(...arguments),this.items=[],this.activeId=""}render(){let e=Math.ceil(this.items.length/2),t=i=>s`<button type="button" class="emr-btn emr-btn--ghost"
      aria-current=${i.id===this.activeId?"page":o}
      @click=${()=>this.emitIntent({type:"tabSelected",id:i.id})}>
      ${i.label}${i.badge?s`<emr-badge .badge=${i.badge}></emr-badge>`:o}
    </button>`;return s`<nav class="emr-card" aria-label="Main navigation" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
      ${this.items.slice(0,e).map(t)}
      <button type="button" class="emr-btn" @click=${()=>this.emitIntent({type:"scanRequested"})}>Scan</button>
      ${this.items.slice(e).map(t)}
    </nav>`}};Et([d({attribute:!1})],nr.prototype,"items",void 0);Et([d({type:String})],nr.prototype,"activeId",void 0);var sa=class extends k{constructor(){super(...arguments),this.interactive=!1}render(){let e=this.model;if(!e)return o;let t=s`<emr-badge .badge=${e}></emr-badge>`;return this.interactive?s`<button type="button" class="emr-btn emr-btn--ghost" aria-label=${[e.label,e.detail,"Sync details"].filter(Boolean).join(", ")}
          @click=${()=>{this.interactive&&this.send({type:"syncDetailsRequested"})}}>${t}</button>`:s`<span role="status" aria-label=${[e.label,e.detail].filter(Boolean).join(", ")}>${t}</span>`}};Et([d({type:Boolean})],sa.prototype,"interactive",void 0);var Ai=class extends S{constructor(){super(...arguments),this.open=!1,this.title="",this.showBack=!1}static{this.styles=[w,M`
    dialog { inset: 0 0 0 auto; margin: 0; box-sizing: border-box; max-inline-size: 100%; inline-size: 480px; block-size: 100%; max-block-size: 100%; color: var(--emr-text); background: var(--emr-surface); border: 1px solid var(--emr-border); }
    dialog::backdrop { background: var(--emr-backdrop); }
    @media (max-width: 720px) {
      dialog { inset: auto 0 0; inline-size: 100%; block-size: auto; max-block-size: 90%; }
    }
  `]}updated(){let e=this.renderRoot.querySelector("dialog");this.open&&!e.open?typeof e.showModal=="function"?e.showModal():e.setAttribute("open",""):!this.open&&e.open&&(typeof e.close=="function"?e.close():e.removeAttribute("open"))}closeRequested(){this.open&&this.emitIntent({type:"closeRequested"})}render(){return s`<dialog aria-label=${this.title||"Panel"} @cancel=${e=>{e.preventDefault(),this.closeRequested()}}>
      <header class="emr-header">
        ${this.showBack?s`<button type="button" class="emr-btn emr-btn--ghost"
          @click=${()=>{this.open&&this.showBack&&this.emitIntent({type:"backRequested"})}}>Back</button>`:o}
        <h3 class="emr-title">${this.title}</h3>
        <button type="button" class="emr-btn emr-btn--ghost" @click=${this.closeRequested}>Close</button>
      </header>
      <slot></slot>
      <slot name="footer"></slot>
    </dialog>`}};Et([d({type:Boolean})],Ai.prototype,"open",void 0);Et([d({type:String})],Ai.prototype,"title",void 0);Et([d({type:Boolean})],Ai.prototype,"showBack",void 0);var Pd=0,oa=class extends k{constructor(){super(...arguments),this.listId=`emr-search-${++Pd}`,this.activeIndex=-1}static{this.styles=[...k.styles,M`
    .results { max-block-size: 320px; overflow: auto; }
    .result { text-align: start; inline-size: 100%; }
  `]}willUpdate(e){let t=e.get("model");e.has("model")&&(t?.query!==this.model?.query||t?.groups!==this.model?.groups||!this.model?.open)&&(this.activeIndex=-1)}get results(){return this.model?.groups.flatMap(e=>e.results.map(t=>({groupId:e.id,result:t})))??[]}select(e,t){this.model?.open&&this.results.some(i=>i.groupId===e&&i.result.id===t)&&this.send({type:"resultSelected",groupId:e,id:t})}keydown(e){let t=this.model;if(t){if(e.key==="Escape"&&t.open)e.preventDefault(),this.send({type:"searchCloseRequested"});else if(e.key==="Enter"){e.preventDefault();let i=this.results[this.activeIndex];i&&t.open?this.select(i.groupId,i.result.id):this.send({type:"queryChanged",query:e.target.value})}else if(e.key==="ArrowDown"||e.key==="ArrowUp"){if(e.preventDefault(),!t.open){this.send({type:"searchOpenRequested"});return}let i=this.results.length;if(!i)return;this.activeIndex<0?this.activeIndex=e.key==="ArrowDown"?0:i-1:this.activeIndex=(this.activeIndex+(e.key==="ArrowDown"?1:-1)+i)%i}}}render(){let e=this.model;if(!e)return o;let t=0;return s`<div class="emr-stack" @focusout=${i=>{let r=i.currentTarget;this.model?.open&&!r.contains(i.relatedTarget)&&this.send({type:"searchCloseRequested"})}}>
      <div class="emr-actions">
        <input class="emr-control" type="search" role="combobox" aria-label="Search" aria-autocomplete="list"
          aria-expanded=${e.open} aria-controls=${this.listId}
          aria-activedescendant=${e.open&&this.activeIndex>=0?`${this.listId}-${this.activeIndex}`:o}
          .value=${I(e.query)} @focus=${()=>{this.model&&!this.model.open&&this.send({type:"searchOpenRequested"})}}
          @input=${i=>this.send({type:"queryChanged",query:i.target.value})}
          @keydown=${this.keydown}>
        ${this.action("Search",{type:"queryChanged",query:e.query},()=>!!this.model&&!this.model.loading)}
      </div>
      ${e.open?s`<div class="results emr-card" id=${this.listId} role="listbox" aria-label="Search results" aria-busy=${!!e.loading}>
        ${e.loading?s`<p role="status">Searching…</p>`:o}
        ${!e.loading&&!this.results.length?s`<p>No results.</p>`:o}
        ${e.groups.filter(i=>i.results.length).map(i=>s`<div role="group" aria-label=${i.label}>
          <strong>${i.label}</strong>
          ${i.results.map(r=>{let a=t++;return s`<button type="button" class="emr-btn emr-btn--ghost result" role="option"
              id=${`${this.listId}-${a}`} aria-selected=${this.activeIndex===a}
              @click=${()=>this.select(i.id,r.id)}>
              ${r.label}${r.sub?s` <small>${r.sub}</small>`:o}
              ${r.badge?s`<emr-badge .badge=${r.badge}></emr-badge>`:o}
            </button>`})}
        </div>`)}
      </div>`:o}
    </div>`}};Et([T()],oa.prototype,"activeIndex",void 0);var Vo=class extends k{render(){let e=this.model;return e?s`<header class="emr-card emr-actions">
      ${e.showNavToggle?this.action("Open navigation",{type:"navToggleRequested"},()=>!!this.model?.showNavToggle):o}
      <slot name="title"><strong>${e.title}</strong></slot>
      <emr-top-bar-search .model=${e.search} @intent=${t=>{t.stopPropagation(),this.send(t.detail)}}></emr-top-bar-search>
      ${this.action(e.userLabel??"User menu",{type:"menuRequested"})}
    </header>`:o}};function Cl(){y("emr-bar-chart",Bo),y("emr-funnel-chart",_o),y("emr-pin-pad",aa),y("emr-login-form",Ho),y("emr-bottom-tab-bar",nr),y("emr-sync-pill",sa),y("emr-toast",Ye),y("emr-sheet",Ai),y("emr-top-bar-search",oa),y("emr-top-bar",Vo)}var jo=class extends k{static{this.styles=[...k.styles,M`
      .workspace { display: grid; gap: 20px; color: var(--emr-text); }
      .header { display: grid; gap: 6px; padding-bottom: 14px; border-bottom: 1px solid var(--emr-border); }
      .header h2, h4, p { margin: 0; }
      .context, .metadata, .muted { color: var(--emr-text-muted); }
      .metadata { display: flex; flex-wrap: wrap; gap: 4px 14px; }
      .columns { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(15rem, 1fr); gap: 20px; align-items: start; }
      .stack { display: grid; gap: 12px; min-width: 0; }
      .section-list, .history-list, .queue-list { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
      .note-section { white-space: pre-wrap; overflow-wrap: anywhere; }
      .note-section h4 { margin-bottom: 4px; }
      .note-card { border: 1px solid var(--emr-border); border-radius: var(--emr-radius-md); padding: 12px; }
      .history-item { border-inline-start: 2px solid var(--emr-border); padding-inline-start: 12px; }
      .reason { color: var(--emr-text-muted); }
      .edit-form { display: grid; gap: 12px; }
      .field { display: grid; gap: 5px; }
      .field textarea { min-height: 5rem; resize: vertical; }
      .compare { display: grid; gap: 8px; }
      .compare-row { display: grid; grid-template-columns: minmax(8rem, .7fr) minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
      .compare-row > * { min-width: 0; overflow-wrap: anywhere; }
      .comparison-value { white-space: pre-wrap; }
      .comparison-value small { display: block; color: var(--emr-text-muted); }
      button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--emr-focus); outline-offset: 2px; }
      @media (max-width: 640px) {
        .columns { grid-template-columns: minmax(0, 1fr); }
        .compare-row { grid-template-columns: minmax(0, 1fr); gap: 4px; }
      }
      @media print {
        :host { color: var(--emr-text); }
        .workspace, .columns { display: block; }
        .header, .current-note, .addenda { margin-bottom: 14px; }
        .note-card { border: 0; padding: 0; }
        .nonprint { display: none !important; }
        .current-note, .addenda { break-inside: avoid; }
      }
      :host-context(.emr-print) { color: var(--emr-text); }
      :host-context(.emr-print) .workspace, :host-context(.emr-print) .columns { display: block; }
      :host-context(.emr-print) .header, :host-context(.emr-print) .current-note, :host-context(.emr-print) .addenda { margin-bottom: 14px; }
      :host-context(.emr-print) .note-card { border: 0; padding: 0; }
      :host-context(.emr-print) .nonprint { display: none !important; }
      :host-context(.emr-print) .current-note, :host-context(.emr-print) .addenda { break-inside: avoid; }
    `]}hasAction(e){let t=this.model;return t?[...t.actions,...t.form?.actions??[],...t.queue.entries.flatMap(r=>r.actions),...t.history?.entries.flatMap(r=>r.actions)??[]].find(r=>r.id===e):void 0}renderAction(e){return s`<button type="button" class="emr-btn ${e.primary?"":"emr-btn--secondary"}"
      @click=${()=>{this.hasAction(e.id)&&this.send({type:"actionRequested",actionId:e.id})}}>
      ${e.label}
    </button>`}renderSignatures(e){return e?.map(t=>s`<div class="metadata">
      <span>${t.purpose==="co-sign"?"Co-signed by":"Signed by"} ${t.name} · ${t.role} · ${t.signedAtLabel}</span>
      ${t.verification?s`<span>${t.verification.label}${t.verification.status==="verified"?` \xB7 ${t.verification.verifiedAtLabel}`:""}</span>`:o}
    </div>`)??o}fieldChanged(e,t){this.model?.form?.fields.some(i=>i.id===e)&&(this.send({type:"fieldChanged",fieldId:e,value:t.value}),this.requestUpdate())}renderSections(e){return s`<div class="section-list">
      ${e.map(t=>s`<section class="note-section">
        <h4>${t.label}</h4><div>${t.value||"Not supplied"}</div>
      </section>`)}
    </div>`}render(){let e=this.model;if(!e)return o;let t=e.history?.snapshot,i=e.history?.comparison;return s`
      <section class="workspace" aria-label=${this.headingId?o:e.title} aria-labelledby=${this.headingId||o}>
        <header class="header">
          <div class="context">${e.context}</div>
          <h2 id=${this.headingId||o}>${e.title}</h2>
          <div role="status"><strong>${e.status}</strong></div>
          <div class="metadata">${e.metadata.map(r=>s`<span>${r}</span>`)}</div>
          ${this.renderSignatures(e.signatures)}
          ${e.message?s`<p class="nonprint" role="status">${e.message}</p>`:o}
          ${e.error?s`<p class="emr-error nonprint" role="alert">${e.error}</p>`:o}
          <div class="emr-actions nonprint">${e.actions.map(r=>this.renderAction(r))}</div>
        </header>

        <div class="columns">
          <div class="stack">
            ${e.current?s`<article class="current-note note-card">
              <h3>${e.current.title}</h3>
              <div class="metadata">${e.current.metadata.map(r=>s`<span>${r}</span>`)}</div>
              ${this.renderSignatures(e.current.signatures)}
              ${this.renderSections(e.current.sections)}
            </article>`:o}

            ${e.addenda.length?s`<section class="addenda stack" aria-label="Signed addenda">
              <h3>Signed addenda</h3>
              ${e.addenda.map(r=>s`<article class="note-card">
                <h4>${r.title}</h4>
                <div class="metadata">${r.metadata.map(a=>s`<span>${a}</span>`)}</div>
                ${this.renderSignatures(r.signatures)}
                ${this.renderSections(r.sections)}
              </article>`)}
            </section>`:o}

            ${e.form?s`<section class="edit-form nonprint" aria-label=${e.form.title}>
              <h3>${e.form.title}</h3>
              ${e.form.fields.map(r=>s`<label class="field">
                <span>${r.label}</span>
                ${r.multiline?s`<textarea .value=${I(r.value)}
                      @input=${a=>this.fieldChanged(r.id,a.currentTarget)}></textarea>`:s`<input .value=${I(r.value)}
                      @input=${a=>this.fieldChanged(r.id,a.currentTarget)}>`}
              </label>`)}
              <div class="emr-actions">${e.form.actions.map(r=>this.renderAction(r))}</div>
            </section>`:o}

            ${e.review?s`<section class="note-card nonprint" aria-label="Review note">
              <h3>${e.review.title}</h3>
              <div class="metadata">${e.review.metadata.map(r=>s`<span>${r}</span>`)}</div>
              ${this.renderSignatures(e.review.signatures)}
              ${this.renderSections(e.review.sections)}
            </section>`:o}

            ${t?s`<section class="note-card nonprint" aria-label="Selected signed version">
              <h3>${t.title}</h3>
              <div class="metadata">${t.metadata.map(r=>s`<span>${r}</span>`)}</div>
              ${this.renderSignatures(t.signatures)}
              ${this.renderSections(t.sections)}
            </section>`:o}

            ${i?s`<section class="note-card nonprint compare" aria-label="Note version comparison">
              <h3>${i.title}</h3>
              ${i.rows.map(r=>s`<div class="compare-row">
                <strong>${r.label}</strong>
                <span class="comparison-value"><small>${i.previousLabel}</small>${r.previous??"Section absent"}</span>
                <span class="comparison-value"><small>${i.currentLabel}</small>${r.current??"Section absent"}</span>
              </div>`)}
              ${i.rows.length===0?s`<p class="muted">No sections changed.</p>`:o}
            </section>`:o}
          </div>

          <aside class="stack nonprint">
            <section aria-labelledby="review-queue-title">
              <h3 id="review-queue-title">${e.queue.title}</h3>
              ${e.queue.entries.length?s`<ul class="queue-list">
                ${e.queue.entries.map(r=>s`<li class="note-card">
                  <strong>${r.title}</strong>
                  <div class="metadata">${r.metadata.map(a=>s`<span>${a}</span>`)}</div>
                  ${r.reason?s`<p class="reason">${r.reason}</p>`:o}
                  <div class="emr-actions">${r.actions.map(a=>this.renderAction(a))}</div>
                </li>`)}
              </ul>`:s`<p class="muted">${e.queue.emptyLabel}</p>`}
            </section>
            ${e.history?s`<section aria-labelledby="note-history-title">
              <h3 id="note-history-title">${e.history.title}</h3>
              <ol class="history-list">
                ${e.history.entries.map(r=>s`<li class="history-item">
                  <strong>${r.title}</strong>
                  <div class="metadata">${r.metadata.map(a=>s`<span>${a}</span>`)}</div>
                  ${r.reason?s`<p class="reason">${r.reason}</p>`:o}
                  <div class="emr-actions">${r.actions.map(a=>this.renderAction(a))}</div>
                </li>`)}
              </ol>
            </section>`:o}
          </aside>
        </div>
      </section>
    `}};function Rl(){y("emr-clinical-note-workspace",jo)}var zo=class extends k{canEdit(e,t){let i=this.model;return!!i&&!i.readOnly&&!i.loading&&!i.error&&!!i.cells[e]?.[t]?.editable}row(e,t,i,r=!1){return s`<tr>
      <th scope="row">
        ${r||e.readOnly?t.label:this.action(t.label,{type:"rowSelected",rowId:t.id},()=>!!this.model&&!this.model.readOnly)}
        ${t.unitLabel?s` <small>${t.unitLabel}</small>`:o}
      </th>
      <td>${t.referenceLabel}</td>
      ${e.columns.map(a=>{let l=i[t.id]?.[a.id],c=e.selectedCell?.rowId===t.id&&e.selectedCell.columnId===a.id,p=!r&&this.canEdit(t.id,a.id),h=l?.valueLabel??l?.status?.replaceAll("-"," ")??"Not supplied";return s`<td>
          ${p?s`<button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${c}
            aria-label=${`${t.label}, ${a.label}: ${h}`}
            @click=${()=>{this.canEdit(t.id,a.id)&&this.send({type:"cellSelected",rowId:t.id,columnId:a.id})}}>${h}</button>`:s`<span>${h}</span>`}
          ${c&&p?s`<form @submit=${f=>{if(f.preventDefault(),!this.canEdit(t.id,a.id))return;let g=f.currentTarget.elements.namedItem("value");this.send({type:"cellEditRequested",rowId:t.id,columnId:a.id,valueLabel:g.value})}}>
            <input class="emr-control" name="value" aria-label=${`Edit ${t.label} at ${a.label}`}
              .value=${I(l?.valueLabel??"")}>
            <button type="submit" class="emr-btn">Apply</button>
          </form>`:o}
          ${l?.flag?s`<emr-badge .badge=${l.flag}></emr-badge>`:o}
          ${l?.modified?s`<small>Modified</small>`:o}
          ${l?.previousValueLabel?s`<small>Previous: ${l.previousValueLabel}</small>`:o}
          ${l?.deltaLabel?s`<small>${l.deltaLabel}</small>`:o}
          ${l?.note?s`<div>${l.note}</div>`:o}
          ${l?.provenanceLabel?s`<small>${l.provenanceLabel}</small>`:o}
        </td>`})}
    </tr>`}render(){let e=this.model;if(!e)return o;if(e.loading)return this.panel(e.title,s`<p role="status">Loading observations…</p>`);if(e.error)return this.panel(e.title,s`<p class="emr-error" role="alert">${e.error}</p>
      ${this.action("Retry",{type:"retryRequested"})}`);let t=()=>!!this.model&&!this.model.readOnly&&!this.model.loading&&!this.model.error,i=[],r=new Map(e.groups?.map(l=>[l.id,l.label])),a;for(let l of e.rows)l.groupId!==a&&l.groupId&&r.has(l.groupId)&&i.push(s`<tr><th colspan=${e.columns.length+2}>${r.get(l.groupId)}</th></tr>`),i.push(this.row(e,l,e.cells)),a=l.groupId;return this.panel(e.title,s`
      ${e.readOnly?o:this.action("Add column",{type:"columnAddRequested"},t)}
      ${!e.rows.length||!e.columns.length?s`<p>${e.emptyMessage}</p>`:s`
        <div class="emr-scroll"><table class="emr-table">
          <thead><tr>
            <th scope="col">Observation</th><th scope="col">Reference range</th>
            ${e.columns.map((l,c)=>s`<th scope="col" aria-current=${l.current?"time":o}>
              ${e.readOnly?l.label:this.action(l.label,{type:"columnSelected",columnId:l.id},t)}
              ${l.sublabel?s`<small>${l.sublabel}</small>`:o}
              ${e.readOnly?o:s`<div class="emr-actions">
                ${c?this.action("Copy previous",{type:"copyPreviousColumnRequested",targetColumnId:l.id},t):o}
                ${this.action("Normal values",{type:"macroNormalColumnRequested",targetColumnId:l.id},t)}
              </div>`}
            </th>`)}
          </tr></thead>
          <tbody>${i}</tbody>
          ${e.footerRows?.length?s`<tfoot>${e.footerRows.map(l=>this.row(e,l,e.footerCells??{},!0))}</tfoot>`:o}
        </table></div>
      `}
    `)}},Dd=600,Td=220,Pt=60,lr=14,qi=480,dr=160,na={neutral:"var(--emr-text-muted)",info:"var(--emr-info)",success:"var(--emr-success)",warning:"var(--emr-warning)",danger:"var(--emr-danger)"};function Ol(n,e,t,i){return t>e?(n-e)/(t-e)*i:i/2}var Md=0,Fo=class extends k{constructor(){super(...arguments),this.clipId=`emr-trend-${++Md}`}static{this.styles=[...k.styles,M`
    figure { margin: 0; }
    svg { inline-size: 100%; block-size: auto; min-inline-size: 320px; }
    svg text { fill: var(--emr-text); font: 11px var(--emr-font-family, sans-serif); }
  `]}shift(e){let t=this.model;if(!t||t.readOnly||t.xMax<=t.xMin)return;let i=(t.xMax-t.xMin)*e/2;this.send({type:"rangeChangeRequested",xMin:t.xMin+i,xMax:t.xMax+i})}render(){let e=this.model;if(!e)return o;let t=a=>Pt+Ol(a,e.xMin,e.xMax,qi),i=(a,l)=>{let c=l==="secondary"&&e.secondaryAxis?e.secondaryAxis:e;return lr+dr-Ol(a,c.yMin,c.yMax,dr)},r=(a,l)=>a.filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)).map(c=>`${t(c.x)},${i(c.y,l)}`).join(" ");return this.panel(e.title,s`
      <p>${e.summaryText}</p>
      ${e.xGranularityLabel?s`<p class="emr-muted">${e.xGranularityLabel}</p>`:o}
      ${e.readOnly?o:s`<div class="emr-actions">
        ${e.granularityOptions?.map(a=>s`<button type="button" class="emr-btn emr-btn--secondary"
          aria-pressed=${!!a.selected} @click=${()=>{this.model&&!this.model.readOnly&&this.send({type:"granularityChangeRequested",granularityId:a.id})}}>${a.label}</button>`)}
        <button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.shift(-1)}>Earlier</button>
        <button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.shift(1)}>Later</button>
      </div>`}
      ${e.series.some(a=>a.points.length)?s`
        <figure class="emr-scroll" aria-label=${e.summaryText}>
          <svg viewBox=${`0 0 ${Dd} ${Td}`} aria-hidden="true">
            <defs>
              <clipPath id=${this.clipId}><rect x=${Pt} y=${lr} width=${qi} height=${dr}></rect></clipPath>
              <pattern id=${`${this.clipId}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M0 6 L6 0" stroke="var(--emr-text-muted)" stroke-width="1"></path>
              </pattern>
            </defs>
            <g clip-path=${`url(#${this.clipId})`}>
              ${e.bands?.map(a=>{let l=a.axis==="secondary"&&e.secondaryAxis?e.secondaryAxis:e,c=i(a.yTo??l.yMax,a.axis),p=i(a.yFrom??l.yMin,a.axis),h=Math.max(0,p-c);return O`<rect x=${Pt} y=${c} width=${qi} height=${h}
                    fill=${na[a.tone]} opacity="0.16"></rect>
                  ${a.pattern==="hatched"?O`<rect x=${Pt} y=${c} width=${qi} height=${h}
                    fill=${`url(#${this.clipId}-hatch)`} opacity="0.4"></rect>`:o}`})}
              ${e.xMinorTicks?.map(a=>O`<line x1=${t(a.x)} x2=${t(a.x)} y1=${lr} y2=${lr+dr} stroke="var(--emr-border)"></line>`)}
              ${e.yTicks.map(a=>O`<line x1=${Pt} x2=${Pt+qi} y1=${i(a.y)} y2=${i(a.y)} stroke="var(--emr-border)"></line>`)}
              ${e.referenceCurves?.map(a=>O`<polyline points=${r(a.points)} fill="none" stroke="var(--emr-text-muted)" stroke-dasharray="3 3"></polyline>`)}
              ${e.series.map(a=>O`
                <polyline points=${r(a.points,a.axis)} fill="none" stroke=${na[a.tone]} stroke-width="2"
                  stroke-dasharray=${a.dashed?"5 4":o}></polyline>
                ${a.points.filter(l=>Number.isFinite(l.x)&&Number.isFinite(l.y)).map(l=>O`<circle cx=${t(l.x)} cy=${i(l.y,a.axis)} r=${e.selectedPointId===l.id?6:4}
                    fill=${na[a.tone]} stroke=${l.flag?na[l.flag.tone]:o}></circle>`)}
              `)}
            </g>
            ${e.xTicks.map(a=>O`<text x=${t(a.x)} y=${lr+dr+17} text-anchor="middle">${a.label}</text>`)}
            ${e.yTicks.map(a=>O`<text x=${Pt-5} y=${i(a.y)} text-anchor="end">${a.label}</text>`)}
            ${e.secondaryAxis?.yTicks.map(a=>O`<text x=${Pt+qi+5} y=${i(a.y,"secondary")}>${a.label}</text>`)}
          </svg>
          <figcaption>
            ${e.yLabel}${e.secondaryAxis?` \xB7 ${e.secondaryAxis.yLabel}`:""}
            ${[...e.bands??[],...e.referenceCurves??[]].map(a=>s`<span> · ${a.label}</span>`)}
          </figcaption>
        </figure>
        <details open><summary>Trend data</summary>
          <table class="emr-table">
            <thead><tr><th scope="col">Series</th><th scope="col">Time</th><th scope="col">Value</th></tr></thead>
            <tbody>${e.series.flatMap(a=>a.points.map(l=>s`<tr>
              <th scope="row">${a.label}</th><td>${l.xLabel}</td>
              <td>${e.readOnly?l.valueLabel:s`<button type="button" class="emr-btn emr-btn--ghost"
                aria-pressed=${e.selectedPointId===l.id} @click=${()=>{this.model&&!this.model.readOnly&&this.send({type:"pointSelected",seriesId:a.id,pointId:l.id})}}>${l.valueLabel}</button>`}
                ${l.flag?s`<emr-badge .badge=${l.flag}></emr-badge>`:o}
              </td>
            </tr>`))}</tbody>
          </table>
        </details>
      `:s`<p>${e.emptyMessage}</p>`}
    `)}},Uo=class extends k{segment(e,t,i){let r=!i.readOnly&&!!e.editable;return s`<li>
      ${[e.speakerLabel,e.timeLabel].filter(Boolean).join(" \xB7 ")}
      <p>${e.text}</p>
      <div class="emr-actions">${t.map(a=>s`<button type="button" class="emr-btn emr-btn--ghost"
        aria-pressed=${i.highlightedSpanIds.includes(a.id)}
        @click=${()=>this.send({type:"spanSelected",spanId:a.id})}>${e.text.slice(a.start,a.end)}</button>`)}</div>
      ${r?s`<details>
        <summary>Edit segment</summary>
        <form class="emr-stack" @submit=${a=>{a.preventDefault();let l=this.model;if(!l||l.readOnly||!l.segments.find(h=>h.id===e.id)?.editable)return;let p=a.currentTarget.elements.namedItem("segment").value.trim();p&&p!==e.text&&this.send({type:"segmentEditRequested",segmentId:e.id,text:p})}}>
          <textarea name="segment" class="emr-control" aria-label="Segment text" .value=${e.text}></textarea>
          <button type="submit" class="emr-btn">Apply</button>
        </form>
      </details>`:o}
    </li>`}render(){let e=this.model;if(!e)return o;let t=()=>!!this.model&&!this.model.readOnly,i=new Map;for(let r of e.spans){let a=i.get(r.segmentId)??[];a.push(r),i.set(r.segmentId,a)}return this.panel(e.title,s`
      <p role="status">${e.dictation.label}</p>
      ${e.dictation.error?s`<p class="emr-error" role="alert">${e.dictation.error}</p>`:o}
      ${e.summariseError?s`<p class="emr-error" role="alert">${e.summariseError}</p>`:o}
      ${e.readOnly?o:s`<div class="emr-actions">
        ${this.action("Start dictation",{type:"dictationStartRequested"},()=>t()&&!!this.model?.dictation.canStart)}
        ${this.action("Stop dictation",{type:"dictationStopRequested"},()=>t()&&!!this.model?.dictation.canStop)}
        ${this.action(e.summarising?"Summarising\u2026":"Summarise",{type:"summariseRequested"},()=>t()&&!!this.model?.canSummarise&&!this.model.summarising)}
      </div>`}
      ${e.segments.length?s`<ol>${e.segments.map(r=>this.segment(r,i.get(r.id)??[],e))}</ol>`:s`<p>No transcript recorded.</p>`}
      ${e.readOnly?o:s`
        <form class="emr-stack" @submit=${r=>{r.preventDefault();let a=r.currentTarget.elements.namedItem("note"),l=a.value.trim();t()&&l&&(this.send({type:"textAppendRequested",text:l}),a.value="")}}>
          <textarea class="emr-control" aria-label="Append note" name="note"></textarea>
          <button type="submit" class="emr-btn">Append note</button>
        </form>
        <div class="emr-actions">
          ${e.smartPhrases?.map(r=>this.action(r.label,{type:"smartPhraseTriggered",trigger:r.trigger,expansion:r.expansion},t))}
          ${e.smartLinks?.map(r=>this.action(r.label,{type:"smartLinkInserted",token:r.token,resolvedValue:r.resolvedValue},t))}
        </div>
        ${e.smartLists?.map(r=>s`<fieldset><legend>${r.label}</legend>
          ${r.choices.map(a=>s`<button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${r.selected===a}
            @click=${()=>{t()&&this.send({type:"smartListChoiceSelected",listId:r.id,choice:a})}}>${a}</button>`)}
        </fieldset>`)}
      `}
      ${e.chartReviewPanes?.map(r=>s`<details>
        <summary>${r.label}</summary><dl>${r.items.map(a=>s`<dt>${a.title}</dt><dd>${a.value}${a.meta?s` <small>${a.meta}</small>`:o}</dd>`)}</dl>
      </details>`)}
    `)}};function Nd(n){let e={id:n.id,label:n.fieldLabel};switch(n.valueType){case"text":case"multiline":case"integer":case"decimal":case"boolean":case"date":case"time":case"datetime":case"select":case"multiselect":return{...e,type:n.valueType,options:n.options};default:return}}var Go=class extends k{isPending(e){let t=this.model;return!!t&&!t.readOnly&&t.suggestions.some(i=>i.id===e&&i.status==="pending")}suggestion(e,t){let i=Nd(e),r=e.status==="edited"?e.editedValueLabel??e.valueLabel:e.valueLabel;return s`<li class="emr-card emr-stack">
      <button type="button" class="emr-btn emr-btn--ghost" aria-pressed=${t.highlightedSuggestionIds.includes(e.id)}
        @click=${()=>this.send({type:"suggestionSelected",suggestionId:e.id})}>${e.fieldLabel}</button>
      ${e.sectionLabel?s`<small>${e.sectionLabel}</small>`:o}
      <span>${r} · ${e.status}</span>
      ${e.confidence?s`<emr-badge .badge=${e.confidence}></emr-badge>`:o}
      ${e.messages?.map(a=>s`<p role=${a.severity==="error"?"alert":"status"}>${a.message}</p>`)}
      ${t.readOnly?o:e.status==="pending"?s`<div class="emr-actions">
        ${this.action("Accept",{type:"suggestionAccepted",suggestionId:e.id},()=>this.isPending(e.id))}
        ${this.action("Reject",{type:"suggestionRejected",suggestionId:e.id},()=>this.isPending(e.id))}
        ${i?this.editForm(e,i,t.id):o}
      </div>`:this.action("Reopen",{type:"suggestionReopened",suggestionId:e.id},()=>!!this.model&&!this.model.readOnly&&this.model.suggestions.some(a=>a.id===e.id&&a.status!=="pending"))}
    </li>`}editForm(e,t,i){let r=e.value;return s`<details>
      <summary>Edit suggested value</summary>
      <form class="emr-stack" @submit=${a=>{a.preventDefault(),this.model?.id===i&&this.isPending(e.id)&&!Object.is(r,e.value)&&this.send({type:"suggestionEdited",suggestionId:e.id,value:r})}}>
        <emr-typed-field .definition=${t} .model=${{value:r}}
          @valueChange=${a=>{a.stopPropagation(),!(this.model?.id!==i||!this.isPending(e.id))&&(r=a.detail,a.currentTarget.model={value:r})}}></emr-typed-field>
        <button type="submit" class="emr-btn">Apply edited value</button>
      </form>
    </details>`}render(){let e=this.model;return e?this.panel("Evidence suggestions",s`
      ${e.readOnly?o:s`<div class="emr-actions">
        ${this.action("Accept all pending",{type:"acceptAllPendingRequested"},()=>!!this.model&&!this.model.readOnly&&this.model.suggestions.some(t=>t.status==="pending"))}
        ${this.action("Clear highlight",{type:"highlightClearRequested"},()=>!!this.model&&!this.model.readOnly&&(this.model.highlightedSpanIds.length>0||this.model.highlightedSuggestionIds.length>0))}
      </div>`}
      ${e.suggestions.length?s`<ul class="emr-stack">${e.suggestions.map(t=>this.suggestion(t,e))}</ul>`:s`<p>No evidence suggestions.</p>`}
    `):o}},Yo=class extends k{render(){let e=this.model;if(!e)return o;let t=e.session,i=()=>!!this.model&&!this.model.readOnly,r=()=>{let l=this.model?.session;return i()&&!!l&&!l.saving&&!l.conflict&&(l.dirty||!!l.error)},a=t.saving?"Saving\u2026":t.error?"Save failed":t.conflict?"Conflict":t.dirty?"Unsaved changes":t.savedAt?"Saved":"No changes";return this.panel("Record status",s`
      <div class="emr-actions">
        <span role="status">${a}</span>
        ${e.readOnly?s`<span>Read only</span>`:o}
        ${e.savedAtLabel?s`<span>${e.savedAtLabel}</span>`:o}
        ${e.connection?s`<emr-badge .badge=${e.connection}></emr-badge>`:o}
        ${e.outbox?s`<emr-badge .badge=${e.outbox}></emr-badge>`:o}
        ${e.lastSync?s`<span>Last sync: ${e.lastSync}</span>`:o}
      </div>
      ${e.attributionLabel||e.attribution?s`<p>${e.attributionLabel??e.attribution?.recordedBy}</p>`:o}
      ${t.error?s`<p class="emr-error" role="alert">${t.error}</p>`:o}
      ${e.signature?s`<div class="emr-stack">
        <emr-badge .badge=${e.signature.status}></emr-badge>
        ${e.signature.signatories.map(l=>s`<span>${l.displayName} · ${l.roleLabel} · ${l.signedAtLabel}
          <emr-badge .badge=${l.status}></emr-badge></span>`)}
        ${e.readOnly?o:s`<div class="emr-actions">
          ${e.signature.canSign?this.action("Sign",{type:"signRequested"},()=>i()&&!!this.model?.signature?.canSign):o}
          ${e.signature.canAmend?this.action("Amend",{type:"amendRequested"},()=>i()&&!!this.model?.signature?.canAmend):o}
        </div>`}
      </div>`:o}
      ${t.conflict?s`<div class="emr-stack" role="alert">
        <p>The record changed from revision ${t.conflict.localRevision} to ${t.conflict.remoteRevision}.</p>
        ${e.conflictLabels?.map(l=>s`<span>${l}</span>`)}
        <div class="emr-actions">
          ${this.action("Show differences",{type:"conflictDetailRequested"})}
          ${e.readOnly?o:s`
            ${this.action("Keep mine",{type:"conflictResolutionRequested",resolution:"keepLocal"},()=>i()&&!!this.model?.session.conflict)}
            ${this.action("Keep theirs",{type:"conflictResolutionRequested",resolution:"keepRemote"},()=>i()&&!!this.model?.session.conflict)}
            ${this.action("Merge",{type:"conflictResolutionRequested",resolution:"merge"},()=>i()&&!!this.model?.session.conflict)}
          `}
        </div>
      </div>`:e.readOnly?o:s`<div class="emr-actions">
        ${this.action(t.error?"Retry save":"Save",{type:"saveRequested"},r)}
        ${this.action("Discard",{type:"discardRequested"},r)}
      </div>`}
    `)}};function Al(){y("emr-observation-flowsheet",zo),y("emr-observation-trend",Fo),y("emr-clinical-transcript",Uo),y("emr-evidence-suggestion-list",Go),y("emr-capture-status-bar",Yo)}var Dt=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},Tt=M`
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
`,Wo=class extends He{constructor(){super(...arguments),this.title="Medications"}},Ko=class extends He{constructor(){super(...arguments),this.title="Allergies"}},Xo=class extends He{constructor(){super(...arguments),this.title="Chronic diseases"}},Qo=class extends He{constructor(){super(...arguments),this.title="Significant personal history"}},la=class extends S{static{this.styles=[w,Tt]}render(){let e=this.model;if(!e)return o;let t=e.identifiers[0]?.value??e.patientId;return s`<section class="emr-card" part="banner">
      <div class="emr-header">
        <div>
          <h2 class="emr-title">${e.displayName}</h2>
          <p class="emr-muted">${t} · ${e.ageLabel} · ${e.sexLabel} · ${e.careSettingLabel} (${e.locationLabel})</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          ${e.criticality?s`<emr-badge .badge=${e.criticality}></emr-badge>`:o}
          ${e.allergyStatus?s`<emr-badge .badge=${e.allergyStatus}></emr-badge>`:o}
          <button
            type="button"
            class="emr-btn emr-btn--secondary"
            aria-expanded=${e.expanded}
            @click=${()=>this.emitIntent({type:"expandedChangeRequested",expanded:!e.expanded})}
          >
            ${e.expanded?"Hide details":"Show details"}
          </button>
        </div>
      </div>
      ${e.expanded?s`<div class="emr-card" part="details">
        <dl>
          ${e.identifiers.map(i=>s`<dt>${i.label}</dt><dd>${i.value}</dd>`)}
          ${e.vitals?.map(i=>s`<dt>${i.label}</dt><dd>${i.valueLabel} ${i.unit}</dd>`)}
        </dl>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${[...e.allergies,...e.chronicDiseases,...e.alerts].map(i=>s`<emr-badge .badge=${i}></emr-badge>`)}
        </div>
      </div>`:o}
    </section>`}};Dt([d({attribute:!1})],la.prototype,"model",void 0);var da=class extends S{static{this.styles=[w,Tt]}render(){let e=this.model;if(!e)return o;let t=e.slots.map(i=>i.amount??0).join(" - ");return s`<section class="emr-card" part="dose-schedule">
      <div class="emr-header">
        <div>
          <span class="emr-muted">${e.medication.formLabel}</span>
          <h3 class="emr-title">${e.medication.label} ${e.medication.strength??""}</h3>
        </div>
        ${e.status?s`<emr-badge .badge=${e.status}></emr-badge>`:o}
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <strong>${e.frequency.label}</strong>
        ${e.slots.length?s`<span class="emr-badge">${t}</span>`:o}
        ${e.duration?s`<span class="emr-muted">Duration: ${e.duration}</span>`:o}
      </div>
      ${!e.readOnly&&e.canEdit?s`<div><button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"editRequested"})}>Edit schedule</button></div>`:o}
    </section>`}};Dt([d({attribute:!1})],da.prototype,"model",void 0);var ca=class extends S{static{this.styles=[w,Tt]}render(){let e=this.model;return e?s`<section class="emr-card">
      <div class="emr-header">
        <h3 class="emr-title">${e.instrumentLabel}</h3>
        ${e.result?s`<span class="emr-badge emr-badge--${e.result.bandTone??"neutral"}">${e.result.total} · ${e.result.bandLabel??""}</span>`:o}
      </div>
      ${e.result?.interpretation?s`<p class="emr-muted">${e.result.interpretation}</p>`:o}
      ${e.canRecompute?s`<div><button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"recomputeRequested",instrumentId:e.id})}>Recompute</button></div>`:o}
    </section>`:o}};Dt([d({attribute:!1})],ca.prototype,"model",void 0);var pa=class extends S{static{this.styles=[w,Tt]}formatAmt(e,t){let i=e.slots.find(r=>r.id===t)?.amount??0;return i<=0?"0":i===.5?"\xBD":String(i)}stepDose(e,t){let i=this.model,r=i?.rows.find(l=>l.id===e);if(!r||i?.readOnly)return;let a=r.doseStep??(r.form==="tablet"?.5:1);!Number.isFinite(a)||a<=0||t<0&&(r.doseAmount??0)<=a||this.emitIntent({type:"doseStepped",rowId:e,delta:t*a})}selectFormulary(e,t){let i=this.model,r=i?.formularySearch;!i||i.readOnly||!r||r.rowId!==e||r.loading||r.error||!i.rows.some(a=>a.id===e&&a.drugName===r.query)||!r.items.includes(t)||this.emitIntent({type:"formularySelected",rowId:e,item:t})}render(){let e=this.model;if(!e)return o;let t=!!e.readOnly;return s`<section class="emr-card" part="prescribing-table" style="padding:0;overflow:hidden;">
      <header class="emr-header" style="padding:12px 16px;border-bottom:1px solid var(--emr-border,#c7d3da);background:var(--emr-surface-soft,#f1f4f5);">
        <div>
          <h3 class="emr-title">${e.title??"Medication Prescribing Table"}</h3>
          <p class="emr-muted">Use − / + to step doses & duration, and ↑ / ↓ / + / − to reorder or remove rows.</p>
        </div>
        ${e.status?s`<emr-badge .badge=${e.status}></emr-badge>`:o}
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
            ${e.rows.map((i,r)=>{let a=r===0,l=r===e.rows.length-1,c=i.doseStep??(i.form==="tablet"?.5:1),p=i.doseAmount,h=!t&&e.formularySearch?.rowId===i.id&&e.formularySearch.query===i.drugName?e.formularySearch:void 0;return s`<tr>
                <td>
                  <div style="display:grid;gap:4px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <strong>#${r+1}</strong>
                      <input class="emr-control" style="height:34px;min-height:34px;" .value=${i.drugName} ?readonly=${t} aria-label=${`Row ${r+1} medicine name`} placeholder="Medicine name or formulary search"
                        @input=${f=>{if(!this.model||this.model.readOnly||!this.model.rows.some(v=>v.id===i.id))return;let g=f.target.value;this.emitIntent({type:"drugNameChanged",rowId:i.id,drugName:g}),this.emitIntent({type:"formularySearchRequested",rowId:i.id,query:g})}} />
                      <input class="emr-control" style="width:84px;height:34px;min-height:34px;" .value=${i.strength} ?readonly=${t} placeholder="500 mg"
                        @input=${f=>this.emitIntent({type:"strengthChanged",rowId:i.id,strength:f.target.value})} />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;font-family:var(--emr-font-mono);">
                      <span class="emr-badge emr-badge--neutral">Form: ${i.formLabel||i.form}</span>
                      ${i.formularyCode?s`<span class="emr-muted">${i.formularyCode}</span>`:o}
                      ${i.stockStatus?s`<span class="emr-muted">· ${i.stockStatus}</span>`:o}
                    </div>
                    ${h?s`<div aria-label="Formulary results">
                      <div class="emr-muted">${e.formularyLabel??"Formulary results"}</div>
                      ${h.loading?s`<div role="status">Searching formulary…</div>`:h.error?s`<div role="alert">Formulary search failed.</div>
                          <button type="button" class="emr-btn" @click=${()=>{let f=this.model;!f||f.readOnly||f.formularySearch!==h||this.emitIntent({type:"formularySearchRequested",rowId:i.id,query:h.query})}}>Retry formulary search</button>`:h.items.length?s`<div style="display:grid;gap:4px;">
                            ${h.items.map(f=>s`<button type="button" class="emr-btn" @click=${()=>this.selectFormulary(i.id,f)}>
                              ${f.drugName} · ${f.strength} · ${f.formLabel} · ${f.code}
                            </button>`)}
                          </div>`:s`<div role="status">No formulary results.</div>`}
                    </div>`:o}
                  </div>
                </td>
                <td>
                  <div class="rx-mini-stepper">
                    ${t?o:s`<button type="button" class="rx-mini-btn" aria-label=${`Decrease dose for row ${r+1}`} ?disabled=${(p??0)<=c} @click=${()=>this.stepDose(i.id,-1)}>${R("minus",12)}</button>`}
                    <span class="rx-mini-val">${p==null?"\u2014":`${p}${i.unitLabel?` ${i.unitLabel}`:""}`}</span>
                    ${t?o:s`<button type="button" class="rx-mini-btn" aria-label=${`Increase dose for row ${r+1}`} @click=${()=>this.stepDose(i.id,1)}>${R("plus",12)}</button>`}
                  </div>
                </td>
                <td>
                  <div style="display:grid;gap:4px;">
                    <span style="font-family:var(--emr-font-mono);font-size:12px;font-weight:700;">${i.frequencyCode??""} ${i.patternLabel?`(${i.patternLabel})`:""}</span>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      ${e.slotDefinitions.map(f=>s`<div style="display:grid;gap:2px;">
                          <span class="emr-muted" style="font-size:11px;">${f.shortLabel??f.label}</span>
                          <div class="rx-mini-stepper">
                            ${t?o:s`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"slotStepped",rowId:i.id,slotId:f.id,delta:-c})}>${R("minus",12)}</button>`}
                            <span class="rx-mini-val">${this.formatAmt(i,f.id)}</span>
                            ${t?o:s`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"slotStepped",rowId:i.id,slotId:f.id,delta:c})}>${R("plus",12)}</button>`}
                          </div>
                        </div>`)}
                    </div>
                  </div>
                </td>
                <td>
                  <span style="font-size:12px;">${i.route}${i.site?` \xB7 ${i.site.toUpperCase()}`:""}</span>
                </td>
                <td>
                  <div class="rx-mini-stepper">
                    ${t?o:s`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"durationStepped",rowId:i.id,delta:-1})}>${R("minus",12)}</button>`}
                    <span class="rx-mini-val">${i.durationCount??"\u2014"} ${i.durationUnit}</span>
                    ${t?o:s`<button type="button" class="rx-mini-btn" @click=${()=>this.emitIntent({type:"durationStepped",rowId:i.id,delta:1})}>${R("plus",12)}</button>`}
                  </div>
                </td>
                <td>
                  <input class="emr-control" style="height:34px;min-height:34px;" .value=${i.instructions} ?readonly=${t} placeholder="Spcl instructions…"
                    @input=${f=>this.emitIntent({type:"instructionsChanged",rowId:i.id,instructions:f.target.value})} />
                </td>
                <td>
                  ${t?o:s`<div style="display:grid;gap:4px;">
                        <div style="display:flex;gap:4px;">
                          <button type="button" class="rx-icon-btn" aria-label="Insert row below"
                            @click=${()=>this.emitIntent({type:"rowAddRequested",afterRowId:i.id})}>
                            ${R("plus",13)}
                          </button>
                          <button type="button" class="rx-icon-btn rx-icon-btn--danger" ?disabled=${e.rows.length<=1} aria-label="Remove row"
                            @click=${()=>this.emitIntent({type:"rowRemoveRequested",rowId:i.id})}>
                            ${R("minus",13)}
                          </button>
                          <button type="button" class="rx-icon-btn" ?disabled=${a} aria-label="Move row up"
                            @click=${()=>this.emitIntent({type:"rowMoveRequested",rowId:i.id,direction:"up"})}>
                            ${R("chevron-up",13)}
                          </button>
                          <button type="button" class="rx-icon-btn" ?disabled=${l} aria-label="Move row down"
                            @click=${()=>this.emitIntent({type:"rowMoveRequested",rowId:i.id,direction:"down"})}>
                            ${R("chevron-down",13)}
                          </button>
                        </div>
                        <div style="display:flex;gap:4px;">
                          <button type="button" class="rx-icon-btn" style="width:auto;padding:0 6px;font-size:10px;font-weight:700;" aria-label="Add Step-Down row"
                            @click=${()=>this.emitIntent({type:"rowStepTitrationRequested",rowId:i.id,direction:"down"})}>
                            ↘ Step-Dn
                          </button>
                          <button type="button" class="rx-icon-btn" style="width:auto;padding:0 6px;font-size:10px;font-weight:700;" aria-label="Add Step-Up row"
                            @click=${()=>this.emitIntent({type:"rowStepTitrationRequested",rowId:i.id,direction:"up"})}>
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
        ${t?o:s`<button type="button" class="emr-btn emr-btn--secondary" @click=${()=>this.emitIntent({type:"rowAddRequested"})}>+ Add medicine row</button>`}
        ${!e.readOnly&&e.canSign?s`<button type="button" class="emr-btn" @click=${()=>this.emitIntent({type:"signRequested"})}>Sign prescription</button>`:o}
      </footer>
    </section>`}};Dt([d({attribute:!1})],pa.prototype,"model",void 0);var ha=class extends S{static{this.styles=[w,Tt]}request(e){let t=this.model;if(!(!t||t.readOnly)){if(e.type==="impressionPulledToNote"){let i=t.studies.find(r=>r.id===t.activeStudyId);if(i?.id!==e.studyId||i.radiologistImpression!==e.text)return}this.emitIntent(e)}}render(){let e=this.model;if(!e)return o;let t=e.studies.find(r=>r.id===e.activeStudyId),i=e.layoutMode!=="1-up"?e.studies.find(r=>r.id===e.compareStudyId&&r.id!==t?.id):void 0;return s`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="emr-badge emr-badge--info">DICOMweb PACS</span>
            <strong>${e.title??"Multi-Viewport PACS & DICOMweb Compare Viewer"}</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${["1-up","2-up-od-os","2-up-compare"].map(r=>s`<button type="button" class="emr-btn emr-btn--small ${e.layoutMode===r?"emr-btn--primary":""}"
                ?disabled=${e.readOnly} @click=${()=>this.request({type:"layoutModeChanged",layoutMode:r})}>
                ${r==="1-up"?"\u25A3 1-Up Single":r==="2-up-od-os"?"\u25EB 2-Up OD vs OS":"\u21C4 2-Up Active vs Prior"}
              </button>`)}
          </div>
        </header>

        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${e.studies.map(r=>s`<button type="button" class="emr-btn emr-btn--small ${r.id===t?.id?"emr-btn--primary":""}"
              ?disabled=${e.readOnly} @click=${()=>this.request({type:"studySelected",studyId:r.id})}>
              [${r.modality}] ${r.bodyPart} (${r.accessionNumber})
            </button>`)}
        </div>

        ${t?s`
              <div style="padding:12px;border-radius:8px;background:#09111a;color:#e2e8f0;font-family:var(--emr-font-mono);display:grid;gap:8px;">
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;font-size:12px;color:#38bdf8;">
                  <strong>[${t.modality}] ${t.title} (${e.layoutMode.toUpperCase()})</strong>
                  <span>Slice ${t.currentSlice}/${t.sliceCount} · W/L: ${t.windowPreset} · Zoom: ${t.zoomPercent}%</span>
                </div>
                ${t.renderedFrameUrl?s`<img src=${t.renderedFrameUrl} alt=${t.title+", slice "+t.currentSlice} style="display:block;width:100%;object-fit:contain;">`:s`<p>Study image unavailable</p>`}
                ${t.caliperMeasurementLabel?s`<div style="color:#f59e0b;font-size:12px;font-weight:700;">Caliper: ${t.caliperMeasurementLabel}</div>`:o}
                <div style="font-size:12px;font-family:var(--emr-font-family);color:#cbd5e1;">${t.radiologistImpression}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} @click=${()=>this.request({type:"sliceStepped",studyId:t.id,delta:-1})}>− Slice</button>
                  <button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} @click=${()=>this.request({type:"sliceStepped",studyId:t.id,delta:1})}>+ Slice</button>
                  <button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} @click=${()=>this.request({type:"invertToggled",studyId:t.id})}>Invert LUT</button>
                  <button type="button" class="emr-btn emr-btn--small emr-btn--primary" ?disabled=${e.readOnly} @click=${()=>this.request({type:"impressionPulledToNote",studyId:t.id,text:t.radiologistImpression})}>↳ Pull Impression to Note</button>
                </div>
              </div>
            `:o}
        ${e.layoutMode!=="1-up"&&t?s`<div aria-label="Comparison study" style="padding:12px;border-radius:8px;background:var(--emr-surface-soft);">
              ${i?s`<strong>[${i.modality}] ${i.title} (${i.dateLabel})</strong>
                <p>Slice ${i.currentSlice}/${i.sliceCount} · ${i.windowPreset} · ${i.zoomPercent}%</p>
                ${i.renderedFrameUrl?s`<img src=${i.renderedFrameUrl} alt=${i.title+", slice "+i.currentSlice} style="display:block;width:100%;object-fit:contain;">`:s`<p>Comparison image unavailable</p>`}
                ${i.caliperMeasurementLabel?s`<p>Caliper: ${i.caliperMeasurementLabel}</p>`:o}`:s`<p>Comparison study unavailable</p>`}
            </div>`:o}
      </section>
    `}};Dt([d({type:Object})],ha.prototype,"model",void 0);var ua=class extends S{static{this.styles=[w,Tt]}editFinding(e,t,i){let r=this.model;r?.activeSpecialty!=="ophthalmology"||r.readOnly||r.ophthalmicRows.some(a=>a.id===e)&&this.emitIntent({type:"ophthalmicCellChanged",rowId:e,eye:t,value:i})}stepWeight(e){let t=this.model;if(!t||t.readOnly||t.activeSpecialty!=="pediatrics")return;let i=t.pediatrics.weightKg+e;Number.isFinite(i)&&i>0&&this.emitIntent({type:"pediatricWeightChanged",weightKg:i})}toggleRegion(e){let t=this.model;!t||t.readOnly||t.activeSpecialty!=="dermatology"||!t.dermatology.regions.some(i=>i.id===e)||this.emitIntent({type:"dermRegionToggled",regionId:e})}setDoseLevel(e){let t=this.model;!t||t.readOnly||t.activeSpecialty!=="oncology"||![100,80,75,50].includes(e)||this.emitIntent({type:"oncologyDoseReductionChanged",percent:e})}render(){let e=this.model;return e?s`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="emr-badge emr-badge--info">SPECIALTY EXAM</span>
            <strong>${e.title??"Multi-Specialty Examination & Dosing Matrix"}</strong>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${["ophthalmology","pediatrics","dermatology","oncology"].map(t=>s`<button type="button" class="emr-btn emr-btn--small ${e.activeSpecialty===t?"emr-btn--primary":""}"
                @click=${()=>this.emitIntent({type:"specialtyChanged",specialty:t})}>
                ${t.toUpperCase()}
              </button>`)}
          </div>
        </header>

        ${e.activeSpecialty==="ophthalmology"?s`
              <div style="display:flex;gap:6px;">
                <button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} @click=${()=>{this.model?.activeSpecialty==="ophthalmology"&&!this.model.readOnly&&this.emitIntent({type:"ophthalmicApplyWnlAll"})}}>✓ All WNL (OU)</button>
                <button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} @click=${()=>{this.model?.activeSpecialty==="ophthalmology"&&!this.model.readOnly&&this.emitIntent({type:"ophthalmicCopyOdToOs"})}}>⇄ Copy OD → OS</button>
              </div>
              <div style="overflow-x:auto;">
                <table class="rx-grid" style="min-width:520px;">
                  <caption>Slit lamp, tonometry and fundus findings</caption>
                  <thead><tr><th scope="col">Ocular structure</th><th scope="col">Right eye (OD)</th><th scope="col">Left eye (OS)</th></tr></thead>
                  <tbody>
                    ${Ke(e.ophthalmicRows,t=>t.id,t=>s`<tr>
                      <th scope="row">
                        <strong>${t.structureLabel}</strong>
                        <div class="emr-muted">${t.segment}</div>
                      </th>
                      ${["od","os"].map(i=>{let r=i==="od"?t.odValue:t.osValue,a=i==="od"?"Right eye (OD)":"Left eye (OS)";return s`<td><input
                          type="text"
                          class="emr-control"
                          aria-label=${t.structureLabel+", "+a}
                          .value=${e.readOnly?I(r):r}
                          ?readonly=${e.readOnly}
                          @input=${l=>this.editFinding(t.id,i,l.currentTarget.value)}
                          @blur=${l=>{let c=this.model?.ophthalmicRows.find(p=>p.id===t.id);c&&(l.currentTarget.value=i==="od"?c.odValue:c.osValue)}}
                        />${t.quickChips.map(l=>s`<button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} @click=${()=>{this.model?.ophthalmicRows.find(p=>p.id===t.id)?.quickChips.includes(l)&&this.editFinding(t.id,i,l)}}>${l}</button>`)}</td>`})}
                    </tr>`)}
                  </tbody>
                </table>
              </div>
            `:e.activeSpecialty==="pediatrics"?s`<div style="display:grid;gap:8px;">
                <div>Weight: ${e.pediatrics.weightKg} kg (${e.pediatrics.weightCentileLabel}) · Height: ${e.pediatrics.heightCm} cm (${e.pediatrics.heightCentileLabel})${e.pediatrics.bsaM2?s` · BSA: ${e.pediatrics.bsaM2} m²`:o}</div>
                <div>${[-1,1].map(t=>s`<button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly||!Number.isFinite(e.pediatrics.weightKg+t)||e.pediatrics.weightKg+t<=0} @click=${()=>this.stepWeight(t)}>${t<0?"\u2212":"+"} 1 kg</button>`)}</div>
                <div>${e.pediatrics.targetDrugLabel} (${e.pediatrics.concentrationMgPer5Ml} mg / 5 mL) · ${e.pediatrics.mgPerKgPerDose} mg/kg/dose · ${e.pediatrics.calculatedMgPerDose} mg (${e.pediatrics.calculatedMlPerDose} mL) · ${e.pediatrics.maxDailyMgLabel}</div>
              </div>`:e.activeSpecialty==="dermatology"?s`<div style="display:grid;gap:8px;">
                  <div>Morphology: ${e.dermatology.morphologyLabel}</div>
                  <div>${e.dermatology.regions.map(t=>s`<button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} aria-pressed=${t.active} @click=${()=>this.toggleRegion(t.id)}>${t.regionLabel} (${t.bsaPercent}% BSA · ${t.ftuPerDose} FTU)</button>`)}</div>
                  <div>Affected BSA: ${e.dermatology.totalBsaPercent}% · Single application: ${e.dermatology.totalFtuPerApp} FTU ${e.dermatology.totalGramsPerApp!=null?s`(${e.dermatology.totalGramsPerApp} g)`:o} · 14d BD: ${e.dermatology.totalGramsFor14DaysBd} g</div>
                </div>`:s`<div style="display:grid;gap:8px;">
                  <div><strong>${e.oncology.regimenName}</strong> · Cycle ${e.oncology.cycleNumber} (${e.oncology.cycleDayLabel}) · BSA: ${e.oncology.bsaM2} m² · ECOG: ${e.oncology.ecogScore} · ANC: ${e.oncology.ancCountLabel} · Platelets: ${e.oncology.plateletCountLabel}</div>
                  ${e.oncology.safetyGateBadge?s`<span class="emr-badge emr-badge--${e.oncology.safetyGateBadge.tone}">${e.oncology.safetyGateBadge.label}</span>`:o}
                  <div>Dose level: ${[100,80,75,50].map(t=>s`<button type="button" class="emr-btn emr-btn--small" ?disabled=${e.readOnly} aria-pressed=${e.oncology.doseReductionPercent===t} @click=${()=>this.setDoseLevel(t)}>${t}%</button>`)}</div>
                  ${e.oncology.agents.map(t=>s`<div>${t.drugName} · ${t.standardMgPerM2} mg/m² · ${t.routeLabel} · ${t.calculatedDoseMg} mg</div>`)}
                </div>`}
      </section>
    `:o}};Dt([d({type:Object})],ua.prototype,"model",void 0);var ma=class extends S{static{this.styles=[w,Tt]}render(){let e=this.model;return e?s`
      <section class="emr-card" style="padding:14px;display:grid;gap:10px;">
        <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <strong>${e.title??"Inpatient eMAR & Nursing Kardex"}</strong>
            <div class="emr-muted" style="font-size:var(--emr-text-xs);font-family:var(--emr-font-mono);">${e.wardBedLabel} · ${e.shiftLabel} · Nurse: ${e.nurseLabel}</div>
          </div>
        </header>
        <div style="overflow-x:auto;">
          <table class="rx-grid" style="min-width:740px;">
            <thead>
              <tr>
                <th>Ordered Medication (Form &amp; Route)</th>
                ${e.timeColumns.map(t=>s`<th>${t.timeLabel} (${t.slotLabel})</th>`)}
              </tr>
            </thead>
            <tbody>
              ${e.orders.map(t=>s`<tr>
                  <td>
                    <strong>${t.drugName} ${t.strength}</strong>
                    <div class="emr-muted" style="font-size:var(--emr-text-2xs);font-family:var(--emr-font-mono);">
                      Form: ${t.formLabel} · ${t.doseLabel} · ${t.frequencyCode} · ${t.routeLabel}
                    </div>
                  </td>
                  ${e.timeColumns.map(i=>{let r=t.administrations.find(l=>l.slotId===i.id),a=r?.status??"not-due";return s`<td>
                      <button type="button" class="emr-btn emr-btn--small ${a==="given"?"emr-btn--primary":""}"
                        ?disabled=${e.readOnly||a==="not-due"}
                        @click=${()=>{this.model?.readOnly||a==="not-due"||this.emitIntent({type:"slotStatusCycled",orderId:t.id,slotId:i.id})}}>
                        ${a.toUpperCase()}
                      </button>
                      ${a==="given"&&r?.bcmaScanned?s`<span class="emr-badge emr-badge--success">BCMA Barcode Verified</span>`:o}
                    </td>`})}
                </tr>`)}
            </tbody>
          </table>
        </div>
      </section>
    `:o}};Dt([d({type:Object})],ma.prototype,"model",void 0);var ga=class extends S{static{this.styles=[w,Tt,M`
    @media print { .print-toolbar { display: none; } .rx-grid { min-width: 0; } }
    :host-context(.emr-print) .print-toolbar { display: none; }
    :host-context(.emr-print) .rx-grid { min-width: 0; }
  `]}render(){let e=this.model;return e?s`
      <article class="emr-card" style="padding:16px;display:grid;gap:12px;">
        <nav class="print-toolbar" aria-label="Document actions">
          <button type="button" class="emr-btn" aria-pressed=${e.documentMode==="opd-rx"} @click=${()=>this.emitIntent({type:"documentModeChanged",mode:"opd-rx"})}>OPD prescription</button>
          <button type="button" class="emr-btn" aria-pressed=${e.documentMode==="ipd-discharge"} @click=${()=>this.emitIntent({type:"documentModeChanged",mode:"ipd-discharge"})}>IPD discharge summary</button>
          <button type="button" class="emr-btn" @click=${()=>this.emitIntent({type:"printTriggered"})}>Print</button>
        </nav>
        <header><h3>${e.facilityName} — ${e.facilityDepartment}</h3><p>${e.documentMode==="opd-rx"?"OPD prescription":"IPD discharge summary"}</p></header>
        <p>Patient: ${e.patientName} (${e.patientAgeSex}) · Encounter: ${e.encounterId} · ${e.encounterDateLabel} · ${e.careSettingLabel}</p>
        <p>${e.patientIdentifiers.map(t=>s`<span>${t.label}: ${t.value} </span>`)}</p>
        <section><h4>Allergies</h4><p>${e.allergiesSummary.join(", ")}</p></section>
        <section><h4>Chronic conditions</h4><p>${e.chronicConditionsSummary.join(", ")}</p></section>
        <section><h4>Vitals</h4>${e.vitalsSummary.map(t=>s`<p>${t.label}: ${t.value}</p>`)}</section>
        <section><h4>Diagnoses</h4>${e.diagnoses.map(t=>s`<p>${t.label} · ${t.code} · ${t.status} ${t.laterality??""} ${t.onsetLabel??""}</p>`)}</section>
        <section><h4>History</h4>${e.historySummary.map(t=>s`<p>${t.code}: ${t.value}</p>`)}</section>
        <section><h4>Examination</h4>${e.examinationSummary.map(t=>s`<p>${t.code}: ${t.value}</p>`)}</section>
        <section><h4>Imaging findings</h4>${e.pacsKeyFindingsSummary.map(t=>s`<p>${t}</p>`)}</section>
        <section><h4>Prescriptions</h4><table class="rx-grid"><thead><tr><th scope="col">Drug &amp; form</th><th scope="col">Dose</th><th scope="col">Frequency</th><th scope="col">Route/site</th><th scope="col">Duration &amp; dispense</th><th scope="col">Instructions</th></tr></thead><tbody>
          ${e.prescriptions.map(t=>s`<tr><td>${t.drugName} ${t.strength} ${t.formLabel} ${t.formularyCode??""} ${t.stepLabel??""}</td><td>${t.doseQtyUnit}</td><td>${t.frequencyPattern}</td><td>${t.routeSite}</td><td>${t.durationLabel} ${t.dispenseTotalLabel??""}</td><td>${t.instructions}</td></tr>`)}
        </tbody></table></section>
        <section><h4>Investigations</h4>${e.investigations.map(t=>s`<p>${t.name} · ${t.code} · ${t.category} · ${t.priority} · ${t.status} · ${t.indication}</p>`)}</section>
        <section><h4>Treatment advice</h4>${e.treatmentAdvises.map(t=>s`<p>${t}</p>`)}</section>
        <section><h4>Cross-consultations</h4>${e.crossConsultations.map(t=>s`<p>${t.targetSpecialty} · ${t.targetConsultant} · ${t.careSetting} · ${t.urgency} · ${t.status} · ${t.locationOrClinic}<br>Reason: ${t.reasonForConsult}<br>Question: ${t.clinicalQuestion}<br>${t.consultantReply??""}</p>`)}</section>
        <section><h4>Follow-up</h4><p>${e.followUpDateLabel}</p></section>
        <footer>${e.prescriberName} · ${e.prescriberRegNo} ${e.signedAtLabel??""}</footer>
      </article>`:o}};Dt([d({type:Object})],ga.prototype,"model",void 0);function ql(){$l(),wl(),Sl(),kl(),Cl(),Al(),Rl(),y("emr-medication-list",Wo),y("emr-allergy-list",Ko),y("emr-chronic-disease-list",Xo),y("emr-personal-history-list",Qo),y("emr-patient-banner",la),y("emr-dose-schedule",da),y("emr-prescribing-table",pa),y("emr-score-result-card",ca),y("emr-pacs-viewer",ha),y("emr-specialty-exam-matrix",ua),y("emr-inpatient-mar",ma),y("emr-encounter-summary-print",ga)}var Mt=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},Ei=M`
  .authoring-card { display:grid; gap:12px; border:1px solid var(--emr-border); border-radius:var(--emr-radius-lg,12px); background:var(--emr-surface); padding:16px; }
  .authoring-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:10px; }
  .authoring-row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
  .authoring-list { display:grid; gap:8px; }
  .authoring-item { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding:10px; border:1px solid var(--emr-border); border-radius:var(--emr-radius,8px); background:var(--emr-surface-raised,var(--emr-surface)); }
  .authoring-item__copy { display:grid; gap:3px; min-width:0; }
  .authoring-muted { color:var(--emr-text-muted); font-size:var(--emr-text-sm); }
  .authoring-error { color:var(--emr-danger); }
  .authoring-issues { display:grid; gap:6px; padding:12px; border-radius:var(--emr-radius,8px); background:var(--emr-warning-soft); }
  textarea.emr-control { height:auto; min-height:70px; padding:10px 12px; resize:vertical; }
  pre { max-height:260px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; }
`,El={"question-meaning":"Clinical meaning","answer-value-set":"Answer value set",unit:"Unit / UCUM","classification-mapping":"Classification mapping"},Zo={"min-length":"Minimum length","max-length":"Maximum length",minimum:"Minimum value",maximum:"Maximum value",precision:"Decimal precision",pattern:"Pattern","earliest-date":"Earliest date","latest-date":"Latest date","allowed-values":"Allowed values",custom:"Custom validator"},Bd=Object.keys(Zo),_d=Object.keys(El),Hd=["internal-json","fhir-r4-questionnaire","fhir-r4-bundle","fhir-r4b-questionnaire","fhir-r5-questionnaire"],Ll={"internal-json":"Internal JSON","fhir-r4-questionnaire":"FHIR R4 Questionnaire","fhir-r4-bundle":"FHIR R4 Bundle","fhir-r4b-questionnaire":"FHIR R4B Questionnaire","fhir-r5-questionnaire":"FHIR R5 Questionnaire"},cr=class extends k{constructor(){super(...arguments),this.optionValue="",this.optionLabel=""}static{this.styles=[w,Ei]}get locked(){return!!this.model?.readOnly}sendIfEditable(e){this.locked||this.send(e)}patchDraft(e){this.sendIfEditable({type:"draftPatched",changes:e})}text(e){return e.target.value}patchText(e,t){this.patchDraft({[e]:this.text(t)})}patchNumber(e,t){let i=this.text(t);this.patchDraft({[e]:i===""?void 0:Number(i)})}setOptionDraft(e,t){this.locked||(this[e]=this.text(t))}addOption(){let e=this.model;if(!e||this.locked||!this.optionValue.trim()||!this.optionLabel.trim())return;let t=[...(e.draft.options??[]).filter(i=>i.value!==this.optionValue.trim()),{value:this.optionValue.trim(),label:this.optionLabel.trim()}];this.patchDraft({options:t}),this.optionValue="",this.optionLabel=""}removeOption(e){this.locked||!this.model||this.patchDraft({options:(this.model.draft.options??[]).filter(t=>t.value!==e)})}bindings(e){return(this.model?.draft.terminologyBindings??[]).filter(t=>t.role===e)}forwardChildIntent(e){e.stopPropagation(),this.sendIfEditable(e.detail)}renderDraftControl(e){let t=e.defaultValue;if(e.type==="select")return s`<select class="emr-control" .value=${typeof t=="string"?t:""} disabled>
        <option value="">Choose an option</option>${(e.options??[]).map(a=>s`<option value=${a.value}>${a.label}</option>`)}
      </select>`;if(e.type==="multiselect"){let a=Array.isArray(t)?t:[];return s`<div class="authoring-row" role="group" aria-label=${e.label}>
        ${(e.options??[]).map(l=>s`<button class="emr-btn emr-btn--secondary" type="button" aria-pressed=${String(a.includes(l.value))} disabled>${l.label}</button>`)}
      </div>`}if(e.type==="boolean")return s`<label><input type="checkbox" disabled .checked=${t===!0}> ${e.label}</label>`;if(e.type==="multiline")return s`<textarea class="emr-control" rows=${e.rows??3} .value=${typeof t=="string"?t:""} disabled></textarea>`;if(e.type==="quantity"){let a=t&&typeof t=="object"&&"value"in t?t.value:"";return s`<div class="authoring-row"><input class="emr-control" type="number" .value=${a===null?"":String(a)} disabled>${e.unit?s`<span>${e.unit}</span>`:o}</div>`}let i=e.type==="integer"||e.type==="decimal"?"number":e.type==="date"?"date":e.type==="time"?"time":e.type==="datetime"?"datetime-local":"text",r=typeof t=="string"||typeof t=="number"?String(t):"";return s`<input class="emr-control" type=${i} .value=${r} placeholder=${e.placeholder??""} disabled>`}render(){let e=this.model;if(!e)return o;let t=e.draft;return this.panel("Field Generator",s`
      <header class="authoring-row">
        <span class="emr-badge">${e.dirty?"Unsaved changes":"Ready"}</span>
        ${this.action(e.saving?"Saving\u2026":"Save field",{type:"saveRequested"},()=>!this.locked&&!e.saving)}
      </header>
      ${e.error?s`<p class="authoring-error" role="alert">${e.error}</p>`:o}
      <section class="authoring-card" aria-label="Field definition">
        <h4 class="emr-title">Identity and display</h4>
        <div class="authoring-grid">
          <label class="emr-field">Stable field ID<input class="emr-control" .value=${t.id} ?disabled=${this.locked} @input=${i=>this.patchText("id",i)}></label>
          <label class="emr-field">Label<input class="emr-control" .value=${t.label} ?disabled=${this.locked} @input=${i=>this.patchText("label",i)}></label>
          <label class="emr-field">Description<textarea class="emr-control" .value=${t.description??""} ?disabled=${this.locked} @input=${i=>this.patchText("description",i)}></textarea></label>
          <label class="emr-field">Entry instructions<textarea class="emr-control" .value=${t.instructions??""} ?disabled=${this.locked} @input=${i=>this.patchText("instructions",i)}></textarea></label>
          <label class="emr-field">Placeholder<input class="emr-control" .value=${t.placeholder??""} ?disabled=${this.locked} @input=${i=>this.patchText("placeholder",i)}></label>
        </div>
      </section>
      <section class="authoring-card" aria-label="Field behavior">
        <h4 class="emr-title">Type, cardinality and layout</h4>
        <div class="authoring-grid">
          <label class="emr-field">Value type<select class="emr-control" .value=${t.type} ?disabled=${this.locked} @change=${i=>this.patchDraft({type:this.text(i)})}>
            ${["text","multiline","integer","decimal","date","time","datetime","select","multiselect","boolean","quantity","custom"].map(i=>s`<option value=${i}>${i}</option>`)}
          </select></label>
          <label class="emr-field">Grid span<select class="emr-control" .value=${String(t.span??12)} ?disabled=${this.locked} @change=${i=>this.patchNumber("span",i)}>
            ${[3,4,6,8,9,12].map(i=>s`<option value=${i}>${i} / 12</option>`)}
          </select></label>
          <label class="emr-field">Text rows<input class="emr-control" type="number" min="1" max="12" .value=${t.rows===void 0?"":String(t.rows)} ?disabled=${this.locked} @input=${i=>this.patchNumber("rows",i)}></label>
          <label class="emr-field">Precision<input class="emr-control" type="number" min="0" max="8" .value=${t.precision===void 0?"":String(t.precision)} ?disabled=${this.locked} @input=${i=>this.patchNumber("precision",i)}></label>
        </div>
        <div class="authoring-row">
          <label><input type="checkbox" .checked=${t.required} ?disabled=${this.locked} @change=${i=>this.patchDraft({required:i.target.checked})}> Required</label>
          <label><input type="checkbox" .checked=${t.repeats} ?disabled=${this.locked} @change=${i=>this.patchDraft({repeats:i.target.checked})}> Repeatable</label>
          <label><input type="checkbox" .checked=${!!t.readOnly} ?disabled=${this.locked} @change=${i=>this.patchDraft({readOnly:i.target.checked})}> Display only</label>
        </div>
      </section>
      ${t.type==="quantity"?s`<section class="authoring-card" aria-label="Quantity units">
        <h4 class="emr-title">Unit definition</h4><div class="authoring-grid">
          <label class="emr-field">Display unit<input class="emr-control" .value=${t.unit??""} ?disabled=${this.locked} @input=${i=>this.patchText("unit",i)}></label>
          <label class="emr-field">Unit system<input class="emr-control" .value=${t.unitSystem??""} ?disabled=${this.locked} @input=${i=>this.patchText("unitSystem",i)}></label>
          <label class="emr-field">Unit code<input class="emr-control" .value=${t.unitCode??""} ?disabled=${this.locked} @input=${i=>this.patchText("unitCode",i)}></label>
        </div>
      </section>`:o}
      ${t.type==="select"||t.type==="multiselect"?s`<section class="authoring-card" aria-label="Choice options">
        <h4 class="emr-title">Choice values <span class="emr-badge">${t.options?.length??0}</span></h4>
        <div class="authoring-grid">
          <label class="emr-field">Option value<input class="emr-control" .value=${this.optionValue} ?disabled=${this.locked} @input=${i=>this.setOptionDraft("optionValue",i)}></label>
          <label class="emr-field">Option label<input class="emr-control" .value=${this.optionLabel} ?disabled=${this.locked} @input=${i=>this.setOptionDraft("optionLabel",i)}></label>
        </div>
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked||!this.optionValue.trim()||!this.optionLabel.trim()} @click=${this.addOption}>Add option</button>
        <div class="authoring-list">${(t.options??[]).map(i=>s`<div class="authoring-item"><span>${i.label} <small class="authoring-muted">${i.value}</small></span>${this.action("Remove",{type:"draftPatched",changes:{options:t.options?.filter(r=>r.value!==i.value)}},()=>!this.locked)}</div>`)}</div>
      </section>`:o}
      <emr-validation-rule-editor .model=${{rules:t.validationRules,readOnly:this.locked}} @intent=${this.forwardChildIntent}></emr-validation-rule-editor>
      <section class="authoring-card" aria-label="Terminology bindings">
        <h4 class="emr-title">Terminology bindings</h4>
        ${_d.map(i=>{let r=e.terminologySearches[i];return s`<emr-terminology-search .model=${{role:i,sources:e.sources,search:r,bindings:this.bindings(i),readOnly:this.locked}} @intent=${this.forwardChildIntent}></emr-terminology-search>`})}
      </section>
      <section class="authoring-card" aria-label="Field preview">
        <h4 class="emr-title">Live field preview</h4><strong>${t.label||"Untitled field"}</strong>
        <span class="authoring-muted">${t.type}${t.required?" \xB7 Required":""}${t.repeats?" \xB7 Repeatable":""}</span>
        ${this.renderDraftControl(t)}
      </section>
      ${Object.entries(e.validationErrors).length?s`<section class="authoring-card" aria-label="Controller validation" role="alert"><h4 class="emr-title">Controller validation</h4><ul>${Object.entries(e.validationErrors).map(([i,r])=>s`<li><strong>${i}</strong>: ${r}</li>`)}</ul></section>`:o}
      ${e.savedFieldId?s`<p role="status">Saved field ${e.savedFieldId}</p>`:o}
    `)}};Mt([T()],cr.prototype,"optionValue",void 0);Mt([T()],cr.prototype,"optionLabel",void 0);var Jo=class extends k{static{this.styles=[w,Ei]}get locked(){return!!this.model?.readOnly}sendIfEditable(e){this.locked||this.send(e)}searchChanged(e){this.model&&this.sendIfEditable({type:"terminologyQueryChanged",role:this.model.role,query:e.target.value})}sourceChanged(e){if(!this.model)return;let t=e.target.value;t&&this.sendIfEditable({type:"terminologySearchOpened",role:this.model.role,sourceId:t})}searchRequested(){this.model&&this.sendIfEditable({type:"terminologySearchRequested",role:this.model.role})}retry(){this.model&&this.sendIfEditable({type:"terminologyRetryRequested",role:this.model.role})}pageChanged(e){this.model&&this.sendIfEditable({type:"terminologyPageChanged",role:this.model.role,page:e})}selectConcept(e){this.model&&this.sendIfEditable({type:"terminologyConceptSelected",role:this.model.role,concept:e,strength:"preferred",mappingRelationship:this.model.role==="classification-mapping"?"related-to":void 0})}updateBinding(e,t,i){if(!this.model||!e.concept||this.locked)return;let r=t.target.value,a=i==="strength"?{strength:r}:{mappingRelationship:r};this.send({type:"terminologyConceptSelected",role:this.model.role,concept:e.concept,strength:a.strength??e.strength,mappingRelationship:a.mappingRelationship??e.mappingRelationship})}removeBinding(e){this.sendIfEditable({type:"terminologyBindingRemoved",bindingId:e.id})}render(){let e=this.model;if(!e)return o;let t=e.search,i=El[e.role];return this.panel("Terminology Search",s`
      <header class="authoring-row"><h4 class="emr-title">${i}</h4>${t?.loading?s`<span role="status">Searching…</span>`:o}</header>
      <div class="authoring-grid">
        <label class="emr-field">Source<select class="emr-control" .value=${t?.sourceId??""} ?disabled=${this.locked} @change=${this.sourceChanged}>
          <option value="">Choose terminology</option>${e.sources.map(r=>s`<option value=${r.id} ?selected=${r.id===t?.sourceId} ?disabled=${!r.available}>${r.label}${r.versionLabel?` \xB7 ${r.versionLabel}`:""}</option>`)}
        </select></label>
        <label class="emr-field">Search<input class="emr-control" type="search" .value=${t?.query??""} ?disabled=${this.locked||!t?.sourceId} @input=${this.searchChanged} @keydown=${r=>{r.key==="Enter"&&this.searchRequested()}}></label>
      </div>
      ${t?.sourceId?this.action("Search",{type:"terminologySearchRequested",role:e.role},()=>!this.locked&&!t.loading):o}
      ${t?.error?s`<p class="authoring-error" role="alert">${t.error} ${this.action("Retry",{type:"terminologyRetryRequested",role:e.role},()=>!this.locked)}</p>`:o}
      ${t&&!t.loading&&t.query&&!t.options.length&&!t.error?s`<p class="authoring-muted" role="status">No concepts found for this search.</p>`:o}
      <div class="authoring-list" role="listbox" aria-label=${`${i} search results`}>
        ${(t?.options??[]).map(r=>s`<button type="button" class="authoring-item" role="option" aria-selected="false" ?disabled=${this.locked||r.active===!1} @click=${()=>this.selectConcept(r)}>
          <span class="authoring-item__copy"><strong>${r.display}</strong><span>${r.code} · ${r.system}${r.version?` \xB7 ${r.version}`:""}${r.active===!1?" \xB7 Inactive":""}</span></span>
        </button>`)}
      </div>
      ${t&&t.total>t.pageSize?s`<div class="authoring-row"><span class="authoring-muted">Page ${t.page} · ${t.total} results</span>${this.action("Previous",{type:"terminologyPageChanged",role:e.role,page:t.page-1},()=>!this.locked&&t.page>1)}${this.action("Next",{type:"terminologyPageChanged",role:e.role,page:t.page+1},()=>!this.locked&&t.page*t.pageSize<t.total)}</div>`:o}
      <h4 class="emr-title">Selected bindings</h4>
      ${(e.bindings??[]).map(r=>s`<div class="authoring-card">
        <div class="authoring-item__copy"><strong>${r.concept?.display??r.valueSetCanonical??r.id}</strong><span>${r.concept?.code??""}${r.concept?` \xB7 ${r.concept.system}`:""}</span></div>
        ${r.concept?s`<div class="authoring-grid">
          <label class="emr-field">Binding strength<select class="emr-control" .value=${r.strength??"preferred"} ?disabled=${this.locked} @change=${a=>this.updateBinding(r,a,"strength")}>
            ${["required","extensible","preferred","example"].map(a=>s`<option value=${a}>${a}</option>`)}
          </select></label>
          ${e.role==="classification-mapping"?s`<label class="emr-field">Relationship<select class="emr-control" .value=${r.mappingRelationship??"related-to"} ?disabled=${this.locked} @change=${a=>this.updateBinding(r,a,"mappingRelationship")}>
            ${["equivalent","wider","narrower","related-to"].map(a=>s`<option value=${a}>${a}</option>`)}
          </select></label>`:o}
        </div>`:o}
        ${this.action("Remove binding",{type:"terminologyBindingRemoved",bindingId:r.id},()=>!this.locked)}
      </div>`)}
    `)}},Li=class extends k{constructor(){super(...arguments),this.kind="minimum",this.value="",this.message=""}static{this.styles=[w,Ei]}get locked(){return!!this.model?.readOnly}valueKind(e,t,i){let r={id:"",message:i.trim()||void 0};if(e==="pattern")return{...r,kind:e,value:t,message:i.trim()||"Value does not match the required pattern."};if(e==="custom")return i.trim()?{...r,kind:e,customValidatorId:t,message:i.trim()}:void 0;if(e==="allowed-values")return{...r,kind:e,values:t.split(",").map(l=>l.trim()).filter(Boolean)};if(e==="earliest-date"||e==="latest-date")return{...r,kind:e,value:t};let a=Number(t);return t.trim()&&Number.isFinite(a)?{...r,kind:e,value:a}:void 0}addRule(){if(this.locked)return;let e=this.valueKind(this.kind,this.value,this.message);e&&(this.send({type:"validationRuleAdded",rule:e}),this.value="",this.message="")}get canAddRule(){return!this.locked&&!!this.value.trim()&&(this.kind!=="custom"||!!this.message.trim())}removeRule(e){this.locked||this.send({type:"validationRuleRemoved",ruleId:e})}setDraftValue(e){this.locked||(this.value=e.target.value)}setDraftMessage(e){this.locked||(this.message=e.target.value)}summary(e){return"values"in e?e.values.join(", "):"customValidatorId"in e?e.customValidatorId:String(e.value)}render(){let e=this.model;if(!e)return o;let t=this.kind==="pattern"?"Regular expression":this.kind==="custom"?"Validator ID":this.kind==="allowed-values"?"Comma-separated values":this.kind.endsWith("-date")?"Date":"Value";return this.panel("Validation Rule Editor",s`
      <div class="authoring-grid">
        <label class="emr-field">Rule type<select class="emr-control" .value=${this.kind} ?disabled=${this.locked} @change=${i=>{this.locked||(this.kind=i.target.value,this.value="")}}>
          ${Bd.map(i=>s`<option value=${i}>${Zo[i]}</option>`)}
        </select></label>
        <label class="emr-field">${t}<input class="emr-control" .value=${this.value} ?disabled=${this.locked} @input=${this.setDraftValue}></label>
        <label class="emr-field">Message<input class="emr-control" .value=${this.message} ?disabled=${this.locked} @input=${this.setDraftMessage}></label>
      </div>
      ${this.kind==="custom"?s`<p class="authoring-muted">The controller resolves this validator ID. The UI does not execute clinical validation.</p>`:o}
      <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${!this.canAddRule} @click=${this.addRule}>Add validation rule</button>
      <div class="authoring-list" aria-label="Current validation rules">
        ${e.rules.map(i=>s`<div class="authoring-item"><div class="authoring-item__copy"><strong>${Zo[i.kind]}</strong><span>${this.summary(i)}</span>${i.message?s`<small>${i.message}</small>`:o}</div>${this.action("Remove",{type:"validationRuleRemoved",ruleId:i.id},()=>!this.locked)}</div>`)}
      </div>
    `)}};Mt([T()],Li.prototype,"kind",void 0);Mt([T()],Li.prototype,"value",void 0);Mt([T()],Li.prototype,"message",void 0);var en=class extends k{static{this.styles=[w,Ei]}get locked(){return!!this.model?.readOnly}queryChanged(e){this.locked||this.send({type:"fieldLibraryQueryChanged",query:e.target.value})}add(e){let t=this.model;!t||this.locked||!t.selectedSectionId||this.send({type:"fieldAdded",sectionId:t.selectedSectionId,field:e,placementId:""})}terminologySummary(e){return e.terminologyBindings.map(t=>t.concept?.code??t.role).join(" \xB7 ")}render(){let e=this.model;return e?this.panel("Field Library",s`
      <p class="authoring-muted">Search the controller-supplied field catalogue and add an available field to the selected section.</p>
      <label class="emr-field">Search fields<input class="emr-control" type="search" .value=${e.query} ?disabled=${this.locked} @input=${this.queryChanged}></label>
      ${e.selectedSectionId?o:s`<p class="authoring-muted" role="status">Select a template section before adding a field.</p>`}
      <p class="authoring-muted" role="status">${e.fields.length} available</p>
      <div class="authoring-list" role="list" aria-label="Available reusable fields">
        ${e.fields.map(t=>s`<article class="authoring-item" role="listitem">
          <div class="authoring-item__copy"><strong>${t.label}</strong><span>${t.type}${t.required?" \xB7 Required":""}${t.repeats?" \xB7 Repeatable":""}</span>
            ${t.description?s`<small>${t.description}</small>`:o}
            ${t.terminologyBindings.length?s`<small>${this.terminologySummary(t)}</small>`:o}
          </div>
          ${this.action("Add",{type:"fieldAdded",sectionId:e.selectedSectionId??"",field:t,placementId:""},()=>!this.locked&&!!e.selectedSectionId)}
        </article>`)}
        ${e.fields.length?o:s`<p class="authoring-muted" role="status">No reusable fields match this search.</p>`}
      </div>
    `):o}},ba=class extends k{constructor(){super(...arguments),this.newSectionLabel=""}static{this.styles=[w,Ei]}get locked(){return!!this.model?.readOnly}sendTemplate(e){(!this.locked||e.type==="sectionSelected")&&this.send(e)}selectedSection(){return this.model?.template.sections.find(e=>e.id===this.model?.selectedSectionId)}patchTemplate(e){this.locked||this.send({type:"templatePatched",changes:e})}patchSection(e,t){this.locked||this.send({type:"sectionPatched",sectionId:e,changes:t})}setNewSectionLabel(e){this.locked||(this.newSectionLabel=e.target.value)}addSection(){let e=this.newSectionLabel.trim();this.locked||!e||(this.send({type:"sectionAdded",section:{id:"",label:e,fields:[]}}),this.newSectionLabel="")}render(){let e=this.model;if(!e)return o;let t=this.selectedSection();return this.panel("Template Composer",s`
      <header class="authoring-row">
        <span class="emr-badge">${e.dirty?"Unsaved changes":e.template.status}</span>
        ${this.action(e.saving?"Saving\u2026":"Save template",{type:"saveRequested"},()=>!this.locked&&!e.saving)}
      </header>
      ${e.error?s`<p class="authoring-error" role="alert">${e.error}</p>`:o}
      ${e.loading?s`<p role="status">Loading template data…</p>`:o}
      <section class="authoring-card" aria-label="Template metadata"><h4 class="emr-title">Template details</h4><div class="authoring-grid">
        <label class="emr-field">Title<input class="emr-control" .value=${e.template.title} ?disabled=${this.locked} @input=${i=>this.patchTemplate({title:i.target.value})}></label>
        <label class="emr-field">Locale<input class="emr-control" .value=${e.template.locale} ?disabled=${this.locked} @input=${i=>this.patchTemplate({locale:i.target.value})}></label>
        <label class="emr-field">Status<select class="emr-control" .value=${e.template.status} ?disabled=${this.locked} @change=${i=>this.patchTemplate({status:i.target.value})}>
          ${["draft","active","retired"].map(i=>s`<option value=${i}>${i}</option>`)}
        </select></label>
        <label class="emr-field">Description<textarea class="emr-control" .value=${e.template.description??""} ?disabled=${this.locked} @input=${i=>this.patchTemplate({description:i.target.value})}></textarea></label>
      </div></section>
      <section class="authoring-card" aria-label="Template sections"><h4 class="emr-title">Sections (${e.template.sections.length})</h4>
        <div class="authoring-row"><input class="emr-control" aria-label="New section label" .value=${this.newSectionLabel} ?disabled=${this.locked} @input=${this.setNewSectionLabel}><button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked||!this.newSectionLabel.trim()} @click=${this.addSection}>Add section</button></div>
        <div class="authoring-list">${e.template.sections.map((i,r)=>s`<div class="authoring-item"><div class="authoring-item__copy"><strong>${i.label}</strong><span>${i.fields.length} field(s)</span></div>
          ${this.action(i.id===e.selectedSectionId?"Selected":"Select",{type:"sectionSelected",sectionId:i.id})}
          ${this.action("Move up",{type:"sectionMoved",sectionId:i.id,direction:"up"},()=>!this.locked&&r>0)}
          ${this.action("Move down",{type:"sectionMoved",sectionId:i.id,direction:"down"},()=>!this.locked&&r<e.template.sections.length-1)}
        </div>`)}</div>
      </section>
      ${t?s`<section class="authoring-card" aria-label="Selected section editor"><h4 class="emr-title">${t.label}</h4>
        <div class="authoring-grid"><label class="emr-field">Section label<input class="emr-control" .value=${t.label} ?disabled=${this.locked} @input=${i=>this.patchSection(t.id,{label:i.target.value})}></label>
          <label class="emr-field">Description<textarea class="emr-control" .value=${t.description??""} ?disabled=${this.locked} @input=${i=>this.patchSection(t.id,{description:i.target.value})}></textarea></label>
        </div>
        ${this.action("Remove section",{type:"sectionRemoved",sectionId:t.id},()=>!this.locked)}
        <div class="authoring-list">${t.fields.map((i,r)=>s`<div class="authoring-item"><div class="authoring-item__copy"><strong>${i.field.label}</strong><span>${i.field.type} · ${i.field.id}</span></div>
          ${this.action("Move up",{type:"fieldMoved",sectionId:t.id,placementId:i.id,direction:"up"},()=>!this.locked&&r>0)}
          ${this.action("Move down",{type:"fieldMoved",sectionId:t.id,placementId:i.id,direction:"down"},()=>!this.locked&&r<t.fields.length-1)}
          ${this.action("Remove",{type:"fieldRemoved",sectionId:t.id,placementId:i.id},()=>!this.locked)}
        </div>`)}</div>
      </section>`:s`<p class="authoring-muted" role="status">Select a section to edit it and add reusable fields.</p>`}
      <section class="authoring-card" aria-label="Available fields"><h4 class="emr-title">Field library (${e.fieldLibrary.length})</h4>
        <label class="emr-field">Search<input class="emr-control" type="search" .value=${e.fieldLibraryQuery} ?disabled=${this.locked} @input=${i=>this.sendTemplate({type:"fieldLibraryQueryChanged",query:i.target.value})}></label>
        ${e.fieldLibrary.map(i=>s`<div class="authoring-item"><div class="authoring-item__copy"><strong>${i.label}</strong><span>${i.type}${i.required?" \xB7 Required":""}</span></div>
          ${this.action("Add to section",{type:"fieldAdded",sectionId:e.selectedSectionId??"",field:i,placementId:""},()=>!this.locked&&!!e.selectedSectionId)}
        </div>`)}
      </section>
      ${e.concurrencyToken?s`<p class="authoring-muted">Concurrency token available.</p>`:o}
    `)}};Mt([T()],ba.prototype,"newSectionLabel",void 0);var pr=class extends k{constructor(){super(...arguments),this.format="fhir-r4-questionnaire",this.serializedDraft=""}static{this.styles=[w,Ei]}get locked(){return!!this.model?.readOnly}sendIfEditable(e){this.locked||this.send(e)}exportArtifact(){!this.locked&&this.model&&!this.model.loading&&this.send({type:"artifactExportRequested",format:this.format})}importArtifact(){!this.locked&&this.model&&!this.model.loading&&this.serializedDraft.trim()&&this.send({type:"artifactImportRequested",format:this.format,serialized:this.serializedDraft})}formatChanged(e){!this.locked&&!this.model?.loading&&(this.format=e.target.value)}displayValue(e){return e==null?"No value":Array.isArray(e)?e.join(", "):typeof e=="object"?JSON.stringify(e):String(e)}setSerializedDraft(e){!this.locked&&!this.model?.loading&&(this.serializedDraft=e.target.value)}acceptImport(){let e=this.model;!e||this.locked||e.loading||!e.canAcceptImport||this.send({type:"importAccepted"})}render(){let e=this.model;if(!e)return o;let t=e.template;return this.panel("Template Preview",s`
      <header class="authoring-row"><div><h4 class="emr-title">${t.title||"Untitled template"}</h4><p class="authoring-muted">${t.description||"A live preview of the current template structure."}</p></div><span class="emr-badge">${t.status}</span></header>
      <section class="authoring-card" aria-label="Rendered template preview">
        ${t.sections.map(i=>s`<section class="authoring-card"><h4 class="emr-title">${i.label}</h4>${i.description?s`<p class="authoring-muted">${i.description}</p>`:o}
          ${i.fields.map(r=>{let a=e.preview?.fields?.[r.field.id],l=a?a.value:r.field.defaultValue;return s`<div class="authoring-item"><div class="authoring-item__copy"><strong>${r.field.label}${r.field.required?" *":""}</strong><span>${r.field.type}${r.field.repeats?" \xB7 Repeatable":""}</span>
            ${r.field.description?s`<small>${r.field.description}</small>`:o}
            ${r.field.options?.length?s`<span>${r.field.options.map(c=>c.label).join(" \xB7 ")}</span>`:o}
            ${r.field.unit?s`<span>${r.field.unit}</span>`:o}
            <span>Preview value: ${this.displayValue(l)}</span>
            ${a?.assessmentStatus?s`<span class="emr-badge">${a.assessmentStatus}</span>`:o}
            ${a?.error?s`<span class="authoring-error">${a.error}</span>`:o}
            ${a?.warning?s`<span class="authoring-muted">${a.warning}</span>`:o}
          </div></div>`})}
        </section>`)}
        ${t.sections.length?o:s`<p class="authoring-muted">No sections have been added.</p>`}
      </section>
      <section class="authoring-card" aria-label="Artifact import and export"><h4 class="emr-title">Import or export artifacts</h4>
        <p class="authoring-muted">Serialization and FHIR mapping are handled by the configured artifact controller.</p>
        ${e.loading?s`<p role="status">Artifact operation in progress…</p>`:o}
        <label class="emr-field">Format<select class="emr-control" .value=${this.format} ?disabled=${this.locked||e.loading} @change=${this.formatChanged}>${Hd.map(i=>s`<option value=${i}>${Ll[i]}</option>`)}</select></label>
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked||e.loading} @click=${this.exportArtifact}>Export</button>
        <label class="emr-field">Serialized import payload<textarea class="emr-control" .value=${this.serializedDraft} ?readonly=${this.locked||e.loading} @input=${this.setSerializedDraft}></textarea></label>
        <button type="button" class="emr-btn emr-btn--secondary" ?disabled=${this.locked||e.loading||!this.serializedDraft.trim()} @click=${this.importArtifact}>Import</button>
        ${e.artifact?s`<div class="authoring-card" role="status"><strong>${Ll[e.artifact.format]}${e.artifact.fhirVersion?` \xB7 FHIR ${e.artifact.fhirVersion}`:""}</strong><span>${e.artifact.serialized.length} characters · ${e.artifact.issues.length} issue(s)</span><pre>${e.artifact.serialized}</pre></div>`:o}
        ${e.importIssues?.length?s`<div class="authoring-issues" role="status"><strong>Controller-reported import issues</strong><ul>${e.importIssues.map(i=>s`<li><b>${i.severity}</b> · ${i.message}${i.path?` \xB7 ${i.path}`:""}</li>`)}</ul></div>`:o}
        ${e.canAcceptImport?s`<button type="button" class="emr-btn emr-btn--outline" ?disabled=${this.locked||e.loading} @click=${this.acceptImport}>Accept import</button>`:o}
        ${e.error?s`<p class="authoring-error" role="alert">${e.error}</p>`:o}
      </section>
    `)}};Mt([T()],pr.prototype,"format",void 0);Mt([T()],pr.prototype,"serializedDraft",void 0);function Pl(){y("emr-field-generator",cr),y("emr-terminology-search",Jo),y("emr-validation-rule-editor",Li),y("emr-field-library-picker",en),y("emr-template-composer",ba),y("emr-template-preview",pr)}var Vd=function(n,e,t,i){var r=arguments.length,a=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,l;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,i);else for(var c=n.length-1;c>=0;c--)(l=n[c])&&(a=(r<3?l(a):r>3?l(e,t,a):l(e,t))||a);return r>3&&a&&Object.defineProperty(e,t,a),a},jd=M`
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
`,fa=class extends S{constructor(){super(...arguments),this.config={...Cn}}static{this.styles=[w,jd]}updateConfig(e){this.emitIntent({type:"themeConfigChanged",config:{...this.config,...e}})}render(){let e=this.config;return s`<section class="emr-card" part="customizer">
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
            ${Object.keys(Ea).map(t=>{let i=Ea[t].light;return s`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="padding:0 10px;"
                aria-pressed=${e.preset===t}
                @click=${()=>this.updateConfig({preset:t})}
              >
                <span class="swatch" style="background:${i.primary};"></span>
                ${i.label}
              </button>`})}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Corner Shape (Radius)</span>
          <div class="pill-row">
            ${Object.keys(Pa).map(t=>s`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="padding:0 10px;"
                aria-pressed=${e.radius===t}
                @click=${()=>this.updateConfig({radius:t})}
              >${Pa[t].label}</button>`)}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Control Density</span>
          <div class="pill-row">
            ${Object.keys(Da).map(t=>s`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="padding:0 10px;"
                aria-pressed=${e.density===t}
                @click=${()=>this.updateConfig({density:t})}
              >${Da[t].label}</button>`)}
          </div>
        </div>

        <div class="emr-field">
          <span class="emr-label">Typography & Font Scale</span>
          <div class="pill-row">
            ${Object.keys(La).map(t=>s`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="padding:0 10px;"
                aria-pressed=${e.fontStack===t}
                @click=${()=>this.updateConfig({fontStack:t})}
              >${La[t].label}</button>`)}
          </div>
          <div class="pill-row" style="margin-top:4px;">
            ${["0.9","1","1.1","1.2"].map(t=>s`<button
                type="button"
                class="emr-btn emr-btn--secondary"
                style="padding:0 10px;"
                aria-pressed=${e.fontScale===t}
                @click=${()=>this.updateConfig({fontScale:t})}
              >${Math.round(Number(t)*100)}%</button>`)}
          </div>
        </div>
      </div>
    </section>`}};Vd([d({attribute:!1})],fa.prototype,"config",void 0);function Dl(){ql(),Pl(),y("emr-theme-customizer",fa)}function Tl(){Dl()}typeof customElements<"u"&&Tl();function Dy(n,e,t){let i=new hr(sn,on),r=i.subscribe(({schema:l,values:c})=>{n.definition=l,n.model=c,e.textContent="Accepted OD: "+(c.disc.cells.od.value??""),t.textContent="Accepted OS: "+(c.disc.cells.os.value??"")}),a=l=>{l.composedPath()[0]===n&&i.dispatch(l.detail)};return n.addEventListener("intent",a),()=>{n.removeEventListener("intent",a),r(),i.destroy()}}var ya=class{constructor(e){this.state=e}state;listeners=new Set;destroyed=!1;getSnapshot(){return this.state}subscribe(e){return this.destroyed?()=>{}:(this.listeners.add(e),e(this.state),()=>this.listeners.delete(e))}setState(e){if(this.destroyed)return;let t=typeof e=="function"?e(this.state):e;if(!this.destroyed){this.state=t;for(let i of this.listeners){if(this.destroyed)break;i(this.state)}}}isDestroyed(){return this.destroyed}destroy(){this.destroyed||(this.destroyed=!0,this.listeners.clear(),this.onDestroy())}onDestroy(){}};var rn={author:{id:"resident",name:"Dr Ananya Rao",role:"Resident physician",at:""},reviewer:{id:"consultant",name:"Dr Meera Iyer",role:"Consultant physician",at:""},clinician:{id:"reader",name:"Dr Kiran Shah",role:"Consultant surgeon",at:""}};function an(n,e){return n==="author"&&e==="ot"?{id:"surgeon",name:"Dr Kiran Shah",role:"Consultant surgeon",at:""}:rn[n]}var Ml={"edit-note":{id:"edit-note",label:"Edit draft"},"save-draft":{id:"save-draft",label:"Save draft"},"review-cosign":{id:"review-cosign",label:"Review for co-signature"},cancel:{id:"cancel",label:"Cancel"},"discard-addendum":{id:"discard-addendum",label:"Discard addendum draft"},"review-note":{id:"review-note",label:"Review note"},"sign-note":{id:"sign-note",label:"Sign note",primary:!0},"cosign-note":{id:"cosign-note",label:"Co-sign note",primary:!0},"return-note":{id:"return-note",label:"Return for correction"},addendum:{id:"addendum",label:"Add telephone addendum"},"start-amendment":{id:"start-amendment",label:"Amend signed note"},"sign-amendment":{id:"sign-amendment",label:"Sign amendment",primary:!0},"review-amendment":{id:"review-amendment",label:"Review amendment"},"review-addendum":{id:"review-addendum",label:"Review addendum"},"confirm-return":{id:"confirm-return",label:"Return note for correction",primary:!0},"enter-error":{id:"enter-error",label:"Mark entered in error"},history:{id:"history",label:"History"},"close-history":{id:"close-history",label:"Close history"},"sign-addendum":{id:"sign-addendum",label:"Sign addendum",primary:!0},"confirm-enter-error":{id:"confirm-enter-error",label:"Confirm entered in error",primary:!0}},Q=n=>{if(Ml[n])return Ml[n];if(n.startsWith("view:"))return{id:n,label:n.startsWith("view:addendum")?"View addendum":`View version ${n.slice(12)}`};if(n.startsWith("compare:"))return{id:n,label:`Compare ${n.slice(8).replace(":"," with ")}`};throw new Error(`Unknown clinical note action: ${n}`)};function $a(n){return n.map(({id:e,label:t,value:i})=>({id:e,label:t,value:i}))}function Bl(n){return n.signers.map((e,t)=>({signerId:e.id,name:e.name,role:e.role,signedAtLabel:e.at,purpose:t===0?"sign":"co-sign",method:"attestation"}))}function tn(n,e){return n==="author"||n==="reviewer"&&e==="ipd"}function va(n,e){return{id:e.id,title:e.id.startsWith("addendum-")?e.title:`${n.title} \xB7 v${e.revision}`,metadata:[`Clinical event: ${e.clinicalTime}`,`Authored by ${e.author.name} \xB7 ${e.author.role}`,...e.reason?[`Amendment reason \xB7 ${e.reason}`]:[]],signatures:Bl(e),sections:e.sections.map(t=>({...t}))}}function zd(n,e){let t=new Map(n.sections.map(a=>[a.id,a])),i=new Map(e.sections.map(a=>[a.id,a]));return[...new Set([...t.keys(),...i.keys()])].flatMap(a=>{let l=t.get(a)?.value,c=i.get(a)?.value;return l===c?[]:[{id:a,label:i.get(a)?.label??t.get(a).label,previous:l??null,current:c??null}]})}var Fd=0,xa=class extends ya{constructor(t,i){let r=Ud(t),a="author";super(Nl(r,a,"editor"));this.suppliedClock=i;this.actor=a,this.note=r,this.publish()}suppliedClock;clockTick=0;actor;note;panel="editor";selectedSnapshot;compareRevisions;returnedReason;errorReason="";addendumText="";addendumTime="11 Nov 2026 \xB7 08:30";addendumOpen=!1;savedAt;generation=0;controllerId=++Fd;returnReason="";now(){if(this.suppliedClock)return this.suppliedClock();let t=new Date("2026-11-11T16:20:00+05:30");return t.setMinutes(t.getMinutes()+this.clockTick++),`11 Nov 2026 \xB7 ${t.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:"Asia/Kolkata"})} IST`}selectActor(t){this.isDestroyed()||t===this.actor||!Object.hasOwn(rn,t)||(this.actor=t,this.panel="editor",this.selectedSnapshot=void 0,this.compareRevisions=void 0,this.publish())}dispatch(t){if(this.isDestroyed())return;let i=this.getSnapshot();if(t.type==="fieldChanged"){if(!i.form?.fields.some(c=>c.id===t.fieldId))return;let a=t.value.slice(0,4e3),l=t.fieldId.slice(t.fieldId.indexOf("|")+1);if(this.panel==="return")this.returnReason=a;else if(this.panel==="error")this.errorReason=a;else if(this.addendumOpen)l==="opd-addendum:clinical-time"?this.addendumTime=a:this.addendumText=a;else if(this.note.draft){let c=l.slice(l.indexOf(":")+1),p=this.note.draft;this.note={...this.note,draft:c==="change-reason"?{...p,reason:a}:{...p,fields:p.fields.map(h=>h.id===c?{...h,value:a}:h)}}}else this.note={...this.note,fields:this.note.fields.map(c=>c.id===l?{...c,value:a}:c)};this.savedAt=void 0,this.publish();return}[...i.actions,...i.form?.actions??[],...i.queue.entries.flatMap(a=>a.actions),...i.history?.entries.flatMap(a=>a.actions)??[]].some(a=>a.id===t.actionId)&&this.perform(t.actionId.slice(t.actionId.indexOf("|")+1))}perform(t){let i={...an(this.actor,this.note.scenario),at:this.now()};switch(t){case"edit-note":this.panel="editor";break;case"save-draft":this.savedAt=i.at,this.panel="editor";break;case"review-cosign":case"review-note":(!this.note.versions.length||this.note.draft||this.note.scenario==="ipd"&&this.actor==="reviewer")&&(this.panel="review");break;case"sign-note":if(this.actor!=="author"||this.panel!=="review"||this.note.scenario==="ipd"&&this.note.versions.length&&(!this.note.draft||this.note.draft.baseRevision!==this.note.versions.at(-1)?.revision)||this.note.scenario!=="ipd"&&this.note.versions.length)break;this.sign($a(this.note.draft?.fields??this.note.fields),i,this.note.draft?.reason?.trim());break;case"cosign-note":if(this.note.scenario!=="ipd"||this.actor!=="reviewer"||this.note.draft||this.panel!=="review")break;{let r=this.note.versions.at(-1);if(!r||r.signers.length!==1)break;let a={...r,signers:[...r.signers,i]};this.note={...this.note,versions:[...this.note.versions.slice(0,-1),a],events:[...this.note.events,{id:`event-${this.note.events.length+1}`,title:"Note co-signed",actor:i,time:i.at,revision:r.revision}]},this.panel="history"}break;case"return-note":if(this.note.scenario!=="ipd"||this.actor!=="reviewer"||this.panel!=="review"||this.note.draft)break;this.returnReason="",this.panel="return";break;case"addendum":if(this.note.scenario!=="opd"||!this.note.versions.length||this.actor!=="author"||this.note.enteredInError)break;this.addendumText="",this.addendumTime="11 Nov 2026 \xB7 08:30",this.addendumOpen=!0,this.panel="editor";break;case"review-addendum":if(!this.addendumOpen||!this.addendumText.trim()||this.actor!=="author")break;this.panel="review";break;case"sign-addendum":if(this.note.scenario!=="opd"||!this.note.versions.length||this.actor!=="author"||!this.addendumOpen||this.panel!=="review"||!this.addendumText.trim())break;this.note={...this.note,addenda:[...this.note.addenda,{id:`addendum-${this.note.addenda.length+1}`,revision:this.note.versions.at(-1).revision,title:"Telephone addendum",clinicalTime:this.addendumTime.trim(),sections:[{id:"telephone-update",label:"Telephone update",value:this.addendumText.trim()}],author:i,signers:[i]}],events:[...this.note.events,{id:`event-${this.note.events.length+1}`,title:"Telephone addendum signed",actor:i,time:i.at,revision:this.note.versions.at(-1).revision,snapshotId:`addendum-${this.note.addenda.length+1}`}]},this.addendumText="",this.addendumOpen=!1,this.panel="history";break;case"start-amendment":if(this.note.scenario!=="ot"||this.actor!=="author"||!this.note.versions.length||this.note.draft||this.note.enteredInError)break;{let r=this.note.versions.at(-1);this.note={...this.note,draft:{baseRevision:r.revision,reason:"",fields:$a(r.sections)},events:[...this.note.events,{id:`event-${this.note.events.length+1}`,title:"Amendment started",actor:i,time:i.at}]}}this.panel="editor";break;case"review-amendment":if(this.note.scenario!=="ot"||this.actor!=="author"||!this.note.draft?.reason?.trim())break;this.panel="review";break;case"sign-amendment":if(this.note.scenario!=="ot"||this.actor!=="author"||this.panel!=="review"||!this.note.draft?.reason?.trim())break;this.sign($a(this.note.draft.fields),i,this.note.draft.reason.trim());break;case"confirm-return":if(this.note.scenario!=="ipd"||this.actor!=="reviewer"||this.panel!=="return"||!this.returnReason.trim())break;this.returnedReason=this.returnReason.trim(),this.note={...this.note,draft:{baseRevision:this.note.versions.at(-1).revision,reason:this.returnedReason,fields:this.note.versions.at(-1).sections.map(r=>({...r}))},events:[...this.note.events,{id:`event-${this.note.events.length+1}`,title:"Returned for correction",actor:i,time:i.at,reason:this.returnedReason}]},this.panel="editor";break;case"enter-error":if(!this.note.versions.length||this.note.enteredInError||!tn(this.actor,this.note.scenario))break;this.errorReason="",this.panel="error";break;case"confirm-enter-error":if(this.panel!=="error"||!this.note.versions.length||this.note.enteredInError||!this.errorReason.trim()||!tn(this.actor,this.note.scenario))break;this.note={...this.note,enteredInError:this.errorReason.trim(),events:[...this.note.events,{id:`event-${this.note.events.length+1}`,title:"Entered in error",actor:i,time:i.at,reason:this.errorReason.trim()}]},this.panel="history";break;case"discard-addendum":this.addendumText="",this.addendumOpen=!1,this.panel="editor";break;case"cancel":this.panel="editor";break;case"history":this.selectedSnapshot=void 0,this.compareRevisions=void 0,this.panel="history";break;case"close-history":this.panel="editor";break;default:if(t.startsWith("view:"))this.selectedSnapshot=t.slice(5),this.compareRevisions=void 0,this.panel="history";else if(t.startsWith("compare:")){this.selectedSnapshot=void 0;let[r,a]=t.slice(8).split(":").map(Number);this.note.versions.some(l=>l.revision===r)&&this.note.versions.some(l=>l.revision===a)&&r!==a&&(this.compareRevisions=[r,a]),this.panel="history"}}this.publish()}sign(t,i,r){let a=this.note.versions.at(-1),l=(a?.revision??0)+1,c=a?"amendment":"original",p={id:`signed-${l}`,revision:l,title:this.note.title,clinicalTime:this.note.clinicalTime,sections:t.map(h=>({...h})),author:a?.author??i,signers:[i],...r?{reason:r}:{}};this.note={...this.note,versions:[...this.note.versions,p],...this.note.draft?{draft:void 0}:{},events:[...this.note.events,{id:`event-${this.note.events.length+1}`,title:c==="amendment"?"Amendment signed":"Note signed",actor:i,time:i.at,...r?{reason:r}:{},revision:l}]},this.returnedReason=void 0,this.savedAt=void 0,this.panel=c==="amendment"?"history":"editor"}publish(){let t=Nl(this.note,this.actor,this.panel,this.selectedSnapshot,this.compareRevisions,this.returnedReason,this.errorReason,this.addendumText,this.addendumOpen,this.returnReason,this.savedAt,this.addendumTime),i=`${this.note.id}:${this.controllerId}`,r=`${i}:${++this.generation}`,a=c=>c.map(p=>({...p,id:`${r}|${p.id}`})),l=c=>c.map(p=>({...p,actions:a(p.actions)}));this.setState({...t,actions:a(t.actions),form:t.form&&{...t.form,fields:t.form.fields.map(c=>({...c,id:`${i}|${c.id}`})),actions:a(t.form.actions)},queue:{...t.queue,entries:l(t.queue.entries)},history:t.history&&{...t.history,entries:l(t.history.entries)}})}};function Ud(n){let e={id:`synthetic-${n}`,scenario:n};if(n==="opd")return{...e,title:"Consultation note",context:"OPD \xB7 General medicine \xB7 Encounter 10 Nov 2026",clinicalTime:"10 Nov 2026 \xB7 09:15",eventTime:"10 Nov 2026 \xB7 09:15",fields:[{id:"reason",label:"Reason for visit",value:"Intermittent headache for three days."},{id:"assessment",label:"Assessment",value:"No acute neurological features reported."},{id:"plan",label:"Plan",value:"Hydration, symptom diary, review if symptoms persist."}],versions:[],addenda:[],events:[]};if(n==="ipd"){let a=[{id:"overnight",label:"Overnight events",value:"Rested comfortably. No acute events reported."},{id:"examination",label:"Review and examination",value:"Alert, stable observations, tolerating oral intake."},{id:"plan",label:"Plan",value:"Continue current treatment. Review fluid balance this morning."}],l={...rn.author,at:"11 Nov 2026 \xB7 06:45"};return{...e,title:"Ward progress note",context:"IPD \xB7 General medicine \xB7 Ward 4 \xB7 11 Nov 2026",clinicalTime:"11 Nov 2026 \xB7 06:30",eventTime:"11 Nov 2026 \xB7 06:45",fields:a,versions:[{id:"signed-1",revision:1,title:"Ward progress note",clinicalTime:"11 Nov 2026 \xB7 06:30",sections:a,author:l,signers:[l]}],addenda:[],events:[{id:"event-1",title:"Note signed",actor:l,time:l.at,revision:1}]}}let t=[{id:"procedure",label:"Procedure performed",value:"Laparoscopic cholecystectomy."},{id:"findings",label:"Operative findings",value:"Gallbladder removed intact. Haemostasis achieved."},{id:"specimen",label:"Specimen",value:"Gallbladder sent to pathology."},{id:"postoperative",label:"Postoperative plan",value:"Recovery monitoring, analgesia, advance diet as tolerated."}],i={...an("author","ot"),at:"11 Nov 2026 \xB7 12:10"};return{...e,title:"Operative note",context:"OT \xB7 General surgery \xB7 11 Nov 2026",clinicalTime:"11 Nov 2026 \xB7 11:45",eventTime:"11 Nov 2026 \xB7 12:10",fields:t,versions:[{id:"signed-1",revision:1,title:"Operative note",clinicalTime:"11 Nov 2026 \xB7 11:45",sections:t,author:i,signers:[i]}],addenda:[],events:[{id:"event-1",title:"Original note signed",actor:i,time:i.at,revision:1}]}}function Nl(n,e,t,i,r,a,l="",c="",p=!1,h="",f,g=""){let v=n.versions.at(-1),b=v?.author??an("author",n.scenario),x=e==="author"&&!n.enteredInError,C=e==="reviewer"&&n.scenario==="ipd"&&!n.enteredInError,A=n.scenario==="ipd"&&v?.signers.length===1&&!n.draft&&!n.enteredInError,q=n.draft?.fields??n.fields,E=n.draft?`draft-${n.draft.baseRevision}:`:"",L=n.enteredInError?"Entered in error":v?[`${v.revision>1?"Amended":"Signed"} \xB7 v${v.revision}`,A?"Awaiting co-signature":void 0,n.draft?n.scenario==="ipd"?"Correction draft":"Amendment draft":void 0].filter(Boolean).join(" \xB7 "):"Draft",N=[],F,pe,V=!n.enteredInError||tn(e,n.scenario);if(v&&V&&N.push(Q(t==="history"?"close-history":"history")),t==="error"&&(x||C))F={title:"Mark note entered in error",fields:[{id:"error-reason",label:"Reason",value:l,multiline:!0}],actions:[...l.trim()?[Q("confirm-enter-error")]:[],Q("cancel")]};else if(t==="return"&&C&&A)F={title:"Return note for correction",fields:[{id:"return-reason",label:"Reason for return",value:h,multiline:!0}],actions:[...h.trim()?[Q("confirm-return")]:[],Q("cancel")]};else if(t==="review"&&C&&A&&v)pe={...va(n,v),title:"Review note for co-signature"},N.push(Q("cosign-note"),Q("return-note"),Q("cancel"));else if(t==="review"&&x&&(!v||n.draft||p)){let _=p?"Review telephone addendum":n.draft?"Review corrected note":"Review consultation note";pe={id:`${n.id}-review`,title:_,metadata:["Review the full entry before signing.",...p?[`Clinical event: ${g.trim()}`]:[],...n.draft?.reason?[`Reason \xB7 ${n.draft.reason.trim()}`]:[]],sections:p?[{id:"telephone-update",label:"Telephone update",value:c.trim()}]:$a(q)},N.push(Q(p?"sign-addendum":n.scenario==="ot"?"sign-amendment":"sign-note"),Q("edit-note"))}else if(t==="editor"&&x&&p)F={title:"Telephone addendum",fields:[{id:"opd-addendum:clinical-time",label:"Telephone call time",value:g},{id:"opd-addendum:telephone-update",label:"Telephone update",value:c,multiline:!0}],actions:[...c.trim()&&g.trim()?[Q("review-addendum")]:[],Q("discard-addendum")]};else if(t==="editor"&&x&&(!v||n.draft)){let _=n.draft?.reason??"";F={title:n.draft?`Correction of signed version ${n.draft.baseRevision}`:"Draft note",fields:[...q.map(ft=>({...ft,id:E+ft.id,multiline:!0})),...n.draft?[{id:`${E}change-reason`,label:n.scenario==="ipd"?"Reason for correction":"Reason for amendment",value:_,multiline:!0}]:[]],actions:[Q("save-draft"),...!n.draft||_.trim()?[Q(n.scenario==="ot"?"review-amendment":"review-note")]:[]]}}else v&&!n.draft&&!p&&(x||C)&&(x&&n.scenario==="opd"&&N.push(Q("addendum")),x&&n.scenario==="ot"&&N.push(Q("start-amendment")),N.push(Q("enter-error")));let Pe=[...n.events].reverse().map(_=>{let ft=_.snapshotId??(_.revision?`signed-${_.revision}`:void 0);return{id:_.id,title:_.title,metadata:[`${_.actor.name} \xB7 ${_.actor.role}`,_.time,..._.revision?[`Version ${_.revision}`]:[],...ft===v?.id&&!n.enteredInError?["Current version"]:[]],..._.reason?{reason:_.reason}:{},actions:[...ft?[Q(`view:${ft}`)]:[],...!_.snapshotId&&_.revision&&_.revision>1&&_.title==="Amendment signed"?[Q(`compare:${_.revision-1}:${_.revision}`)]:[]]}}),De=[...n.versions,...n.addenda].find(_=>_.id===i),oe=r?.map(_=>n.versions.find(ft=>ft.revision===_)),Pi=oe?.[0]&&oe[1]?{title:"Changed sections",previousLabel:`Version ${oe[0].revision}`,currentLabel:`Version ${oe[1].revision}`,rows:zd(oe[0],oe[1])}:void 0,Hl=C&&A&&v?[{id:n.id,title:n.title,metadata:[`Signed by ${b.name}`,v.signers[0].at,"Ward 4"],actions:t==="editor"||t==="history"?[Q("review-cosign")]:[]}]:[];return{title:n.title,context:n.context,status:L,metadata:[`Clinical event: ${n.clinicalTime}`,`Entered: ${n.eventTime}`,`Authored by ${b.name} \xB7 ${b.role}`],signatures:v&&!n.enteredInError?Bl(v):void 0,message:a?`Returned for correction \xB7 ${a}`:f&&F?`Draft saved in this session \xB7 ${f}`:void 0,current:v&&!n.enteredInError?va(n,v):void 0,addenda:n.enteredInError?[]:n.addenda.map(_=>va(n,_)),form:F,review:pe,actions:N,queue:{title:"Co-signature queue",emptyLabel:"No notes awaiting your co-signature.",entries:Hl},history:t==="history"&&V?{title:"Note history",entries:Pe,snapshot:De?va(n,De):void 0,comparison:Pi}:void 0}}function Gd(n,e){let t=50,i=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});return new xa(n,e??(()=>{let r=new Date(Date.UTC(2026,10,11,10,t++));return`${i.format(r)} IST`}))}var Yd=[{id:"vitreous",segment:"Posterior Segment",structureLabel:"Vitreous",odValue:"",osValue:"",normalDefault:"Within normal limits",quickChips:[]},{id:"optic-disc",segment:"Posterior Segment",structureLabel:"Optic disc",odValue:"",osValue:"",normalDefault:"Within normal limits",quickChips:[]},{id:"macula",segment:"Posterior Segment",structureLabel:"Macula & fovea",odValue:"Dull foveal reflex, cystoid macular oedema (CST 418 \xB5m)",osValue:"Healthy foveal reflex, CST 258 \xB5m",normalDefault:"Healthy foveal reflex, flat macula",quickChips:["Healthy foveal reflex","Cystoid oedema (CMO)","Hard exudates","Microaneurysms"]},{id:"retinal-vessels",segment:"Posterior Segment",structureLabel:"Retinal vessels",odValue:"",osValue:"",normalDefault:"Within normal limits",quickChips:[]},{id:"peripheral-retina",segment:"Posterior Segment",structureLabel:"Peripheral retina",odValue:"",osValue:"",normalDefault:"Within normal limits",quickChips:[]}];function Wd(){return{title:"Specialty exam \xB7 Synthetic example",activeSpecialty:"ophthalmology",ophthalmicRows:[{id:"cornea",segment:"Anterior Segment",structureLabel:"Cornea & Wound",odValue:"Clear, temporal phaco port well-apposed, Seidel neg",osValue:"Clear, compact stroma, no KP",normalDefault:"Clear, lustrous, Fluorescein negative",quickChips:["Clear","Descemet folds +","SPK +","Seidel neg"]},{id:"ac",segment:"Anterior Segment",structureLabel:"Anterior Chamber",odValue:"Deep, 0 cells, 0 flare (SUN Grade 0)",osValue:"Deep & quiet (VH Grade 4)",normalDefault:"Deep and quiet (0 cells, 0 flare)",quickChips:["Deep & quiet","Cells 1+","Flare 1+","Shallow VH2"]},{id:"lens",segment:"Anterior Segment",structureLabel:"Lens / PCIOL",odValue:"Toric PCIOL well-centered in capsular bag",osValue:"Nuclear Sclerosis Grade II (NS2)",normalDefault:"Clear crystalline lens",quickChips:["PCIOL in bag","Clear lens","NS2 Cataract","PCO +"]},{id:"iop-gonio",segment:"Tonometry & Gonioscopy",structureLabel:"IOP (GAT) & Angle",odValue:"22 mmHg (Steroid responder) \xB7 Shaffer Grade IV open",osValue:"15 mmHg \xB7 Shaffer Grade IV open",normalDefault:"15 mmHg \xB7 Shaffer Grade IV open 360\xB0",quickChips:["14 mmHg","22 mmHg (High)","Shaffer IV open","PAS +"]},...Yd],pediatrics:{weightKg:12,heightCm:88,bsaM2:"0.54",weightCentileLabel:"50th WHO Centile",heightCentileLabel:"55th WHO Centile",targetDrugLabel:"Amoxicillin Oral Suspension",mgPerKgPerDose:15,concentrationMgPer5Ml:250,calculatedMgPerDose:180,calculatedMlPerDose:3.6,maxDailyMgLabel:"Fixture ceiling: 90 mg/kg/day"},dermatology:{morphologyLabel:"Erythematous scaly plaques over extensor surfaces & trunk",regions:[{id:"face",regionLabel:"Face & Neck",bsaPercent:2.5,ftuPerDose:2.5,active:!1},{id:"trunk",regionLabel:"Anterior Trunk",bsaPercent:6,ftuPerDose:3.5,active:!0},{id:"arms",regionLabel:"Bilateral Upper Limbs",bsaPercent:4,ftuPerDose:3,active:!0},{id:"legs",regionLabel:"Bilateral Lower Limbs",bsaPercent:8,ftuPerDose:4,active:!1}],totalBsaPercent:10,totalFtuPerApp:6.5,totalGramsPerApp:3.25,totalGramsFor14DaysBd:91},oncology:{regimenName:"CAPOX (Capecitabine + Oxaliplatin)",cycleNumber:3,cycleDayLabel:"Days 1\u201314 (21-Day Cycle)",ecogScore:1,bsaM2:1.76,ancCountLabel:"2,450 /\xB5L (\u2265 1,500)",plateletCountLabel:"168,000 /\xB5L (\u2265 100,000)",safetyGatePassed:!0,safetyGateBadge:{label:"Fixture haematology reviewed",tone:"info"},doseReductionPercent:100,agents:[{id:"ag-1",drugName:"Capecitabine (Oral Tablet 500 mg)",standardMgPerM2:1e3,calculatedDoseMg:1750,routeLabel:"Oral BD Days 1\u201314"},{id:"ag-2",drugName:"Oxaliplatin (IV Infusion)",standardMgPerM2:130,calculatedDoseMg:228,routeLabel:"IV over 2h Day 1"}]}}}function Kd(n,e){if(e.type==="specialtyChanged")return{...n,activeSpecialty:e.specialty};if(n.readOnly)return n;switch(e.type){case"ophthalmicCellChanged":{if(n.activeSpecialty!=="ophthalmology")return n;let t=e.eye==="od"?"odValue":"osValue";return{...n,ophthalmicRows:n.ophthalmicRows.map(i=>i.id===e.rowId?{...i,[t]:e.value}:i)}}case"ophthalmicApplyWnlAll":return n.activeSpecialty!=="ophthalmology"?n:{...n,ophthalmicRows:n.ophthalmicRows.map(t=>({...t,odValue:t.normalDefault,osValue:t.normalDefault}))};case"ophthalmicCopyOdToOs":return n.activeSpecialty!=="ophthalmology"?n:{...n,ophthalmicRows:n.ophthalmicRows.map(t=>!e.rowId||t.id===e.rowId?{...t,osValue:t.odValue}:t)};case"pediatricWeightChanged":{if(n.activeSpecialty!=="pediatrics"||!Number.isFinite(e.weightKg)||e.weightKg<=0)return n;let t=n.pediatrics,i=Math.round(e.weightKg*t.mgPerKgPerDose),r=Math.round(i/t.concentrationMgPer5Ml*50)/10;return{...n,pediatrics:{...t,weightKg:e.weightKg,calculatedMgPerDose:i,calculatedMlPerDose:r,weightCentileLabel:"centile unavailable for edited fixture",bsaM2:""}}}case"dermRegionToggled":{if(n.activeSpecialty!=="dermatology")return n;let t=n.dermatology.regions.map(c=>c.id===e.regionId?{...c,active:!c.active}:c),i=t.filter(c=>c.active),r=i.reduce((c,p)=>c+p.bsaPercent,0),a=i.reduce((c,p)=>c+p.ftuPerDose,0),l=a*.5;return{...n,dermatology:{...n.dermatology,regions:t,totalBsaPercent:r,totalFtuPerApp:a,totalGramsPerApp:l,totalGramsFor14DaysBd:Math.round(l*28)}}}case"oncologyDoseReductionChanged":{if(n.activeSpecialty!=="oncology")return n;let t=n.oncology;return{...n,oncology:{...t,doseReductionPercent:e.percent,agents:t.agents.map(i=>({...i,calculatedDoseMg:Math.round(i.standardMgPerM2*t.bsaM2*(e.percent/100))}))}}}default:return n}}var Xd=[{code:"RXN-309114",drugName:"Moxifloxacin",strength:"0.5% w/v",form:"drop",formLabel:"Ophthalmic Drops",route:"eye",site:"OD",doseAmount:1,doseStep:1,unitLabel:"drop",allowedUnits:["drop","mL",""],specialtyTag:"Ophthalmology",stockStatus:"In Stock",defaultPresetId:"qid",defaultDurationCount:7,defaultDurationUnit:"days",defaultFoodRelation:"5 min gap",defaultInstructions:"Instil 1 drop cleanly; wait 5 min before other drops."},{code:"RXN-860975",drugName:"Prednisolone acetate",strength:"1% w/v",form:"drop",formLabel:"Ophthalmic Drops",route:"eye",site:"OD",doseAmount:1,doseStep:1,unitLabel:"drop",allowedUnits:["drop","mL",""],specialtyTag:"Ophthalmology",stockStatus:"In Stock",defaultPresetId:"qid",defaultDurationCount:7,defaultDurationUnit:"days",defaultFoodRelation:"Shake well",defaultInstructions:"Shake well before use. Use \u2198 Step-Dn for weekly taper."},{code:"RXN-313782",drugName:"Amoxicillin Suspension",strength:"250 mg/5 mL",form:"liquid",formLabel:"Paediatric Suspension",route:"oral",doseAmount:7.5,doseStep:2.5,unitLabel:"mL",allowedUnits:["mL","tsp","mg/kg","mg"],specialtyTag:"Pediatrics",dosingBasisLabel:"15 mg/kg \xB7 12 kg = 180 mg",stockStatus:"In Stock",defaultPresetId:"tds",defaultDurationCount:5,defaultDurationUnit:"days",defaultFoodRelation:"Use oral syringe",defaultInstructions:"Measure 7.5 mL accurately with oral syringe."},{code:"RXN-197985",drugName:"Mometasone Furoate",strength:"0.1% w/w",form:"ointment",formLabel:"Topical Cream/Oint",route:"topical",site:"Lesions",doseAmount:1.5,doseStep:.5,unitLabel:"FTU",allowedUnits:["FTU","app","ribbon","g"],specialtyTag:"Dermatology",dosingBasisLabel:"1.5 FTU \u2248 0.75 g",stockStatus:"In Stock",defaultPresetId:"od",defaultDurationCount:14,defaultDurationUnit:"days",defaultFoodRelation:"Thin layer only",defaultInstructions:"Apply thin layer to affected plaques once daily."},{code:"RXN-402243",drugName:"Ciprofloxacin + Dexamethasone",strength:"0.3%/0.1%",form:"drop",formLabel:"Otic Ear Drops",route:"ear",site:"AD",doseAmount:4,doseStep:1,unitLabel:"drop",allowedUnits:["drop","mL"],specialtyTag:"ENT",stockStatus:"In Stock",defaultPresetId:"bd",defaultDurationCount:7,defaultDurationUnit:"days",defaultFoodRelation:"Tilt head 2 min",defaultInstructions:"Warm bottle in hand; keep ear dry during bath."},{code:"RXN-194000",drugName:"Capecitabine",strength:"500 mg",form:"tablet",formLabel:"Oral Tablet",route:"oral",doseAmount:3,doseStep:.5,unitLabel:"tab",allowedUnits:["","tab","mg"],specialtyTag:"Oncology",dosingBasisLabel:"1000 mg/m\xB2 \xB7 BSA 1.5m\xB2",stockStatus:"In Stock",defaultPresetId:"bd",defaultDurationCount:14,defaultDurationUnit:"days",defaultFoodRelation:"After food",defaultInstructions:"Cycle Days 1\u201314, then 7 days rest. Swallow whole."},{code:"RXN-311474",drugName:"Mannitol 20%",strength:"20 g/100 mL",form:"injection",formLabel:"IV Infusion",route:"iv-inf",doseAmount:100,doseStep:25,unitLabel:"mL",allowedUnits:["mL","g","mg/kg"],specialtyTag:"Neurosurgery",dosingBasisLabel:"0.5 g/kg IV osmotherapy",stockStatus:"In Stock (Ward)",defaultPresetId:"tds",defaultDurationCount:3,defaultDurationUnit:"days",defaultFoodRelation:"Infuse over 20m (Mannitol)",defaultInstructions:"Hold if serum Na > 155 mmol/L or osmolality > 320."},{code:"RXN-310431",drugName:"Gabapentin",strength:"100 mg",form:"capsule",formLabel:"Oral Capsule",route:"oral",doseAmount:1,doseStep:1,unitLabel:"cap",allowedUnits:["","cap","mg"],specialtyTag:"Neurology",stockStatus:"In Stock",defaultPresetId:"hs",defaultDurationCount:3,defaultDurationUnit:"days",defaultFoodRelation:"At bedtime",defaultInstructions:"Click \u2197 Step-Up to titrate HS \u2192 BD \u2192 TDS."},{code:"RXN-745679",drugName:"Salbutamol MDI",strength:"100 mcg/puff",form:"inhaler",formLabel:"MDI Inhaler",route:"inhalation",doseAmount:2,doseStep:1,unitLabel:"puff",allowedUnits:["puff","spray","respule"],specialtyTag:"Gen Med",stockStatus:"In Stock",defaultPresetId:"sos",defaultDurationCount:30,defaultDurationUnit:"days",defaultFoodRelation:"Use spacer",defaultInstructions:"2 puffs SOS for wheeze/breathlessness."},{code:"RXN-198440",drugName:"Paracetamol",strength:"500 mg",form:"tablet",formLabel:"Oral Tablet (Scored)",route:"oral",doseAmount:1,doseStep:.5,unitLabel:"tab",allowedUnits:["","tab","mg"],specialtyTag:"Gen Med",stockStatus:"In Stock",defaultPresetId:"bd",defaultDurationCount:5,defaultDurationUnit:"days",defaultFoodRelation:"After food",defaultInstructions:"Take after meals for pain or fever."}],Qd={async search({query:n,page:e,pageSize:t,signal:i}){i.throwIfAborted();let r=n.trim().toLowerCase(),a=Xd.filter(p=>[p.drugName,p.code,p.formLabel,p.specialtyTag??""].some(h=>h.toLowerCase().includes(r))),l=Math.max(1,Math.min(20,t)),c=(Math.max(1,e)-1)*l;return{items:a.slice(c,c+l),total:a.length}}};function _l(n,e){return{...n,drugName:e,formularyCode:void 0,strength:"",form:"other",formLabel:"",route:"",allowedRoutes:void 0,site:void 0,specialtyTag:void 0,dosingBasisLabel:void 0,stockStatus:void 0,doseAmount:null,doseStep:void 0,unitLabel:"",allowedUnits:void 0,slots:n.slots.map(t=>({...t,amount:null,amountLabel:void 0,householdLabel:void 0})),frequencyCode:void 0,patternLabel:void 0,durationCount:null,dispenseQuantity:void 0,foodRelation:"",instructions:"",taperExpanded:!1,taperSteps:void 0,error:void 0}}function Zd(n,e,t){let i=t.presets?.find(r=>r.id===e.defaultPresetId);return{..._l(n,e.drugName),formularyCode:e.code,strength:e.strength,form:e.form,formLabel:e.formLabel,route:e.route,allowedRoutes:e.allowedRoutes,site:e.site,doseAmount:e.doseAmount??null,doseStep:e.doseStep,unitLabel:e.unitLabel,allowedUnits:e.allowedUnits,specialtyTag:e.specialtyTag,dosingBasisLabel:e.dosingBasisLabel,stockStatus:e.stockStatus,frequencyCode:i?.label,slots:t.slotDefinitions.map(r=>({id:r.id,label:r.label,timeHint:r.timeHint,amount:i?i.slotIds.includes(r.id)?e.doseAmount??null:0:null})),durationCount:e.defaultDurationCount??null,durationUnit:e.defaultDurationUnit??"days",foodRelation:e.defaultFoodRelation??"",instructions:e.defaultInstructions??""}}var Jd=[{id:"od",label:"OD",slotIds:["m"]},{id:"bd",label:"BD",slotIds:["m","n"]},{id:"tds",label:"TDS",slotIds:["m","a","n"]},{id:"qid",label:"QID",slotIds:["m","a","e","n"]},{id:"hs",label:"HS",slotIds:["n"]},{id:"sos",label:"SOS",slotIds:[]}];export{Ta as AsyncSearchController,Jd as PRESCRIBING_PRESETS,_l as clearFixturePrescriptionProduct,Gd as createClinicalNoteDemo,Wd as makeSpecialtyExamFixture,Dy as mountClinicalMatrixExample,Kd as reduceSpecialtyExamFixture,Tl as registerAllEmrElements,Zd as resolveFixturePrescriptionProduct,Qd as syntheticFormularyRepository};
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
lit-html/directive.js:
lit-html/directives/repeat.js:
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

lit-html/directive-helpers.js:
lit-html/directives/live.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
