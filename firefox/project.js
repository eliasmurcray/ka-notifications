(()=>{"use strict";function e(e){return{body:e.body,cache:e.cache,credentials:e.credentials,headers:e.headers,integrity:e.integrity,keepalive:e.keepalive,method:e.method,mode:e.mode,redirect:e.redirect,referrer:e.referrer,referrerPolicy:e.referrerPolicy,signal:e.signal}}const a=fetch;window.fetch=async function(t,n){return t?.url?.startsWith("https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage")?new Promise((async n=>{const r=await t.blob(),i=new FileReader;i.onload=async()=>{const r=i.result,s=JSON.parse(atob(r.split(",")[1]));s.variables.limit=100;const c=new Request(t.url,{...e(t),body:JSON.stringify(s)});n(a(c))},i.readAsDataURL(r)})):a(t,n).catch(Math.abs)};const t=new URLSearchParams(window.location.search).get("qa_expand_type");let n,r=0;null!==t&&requestAnimationFrame((function e(){if(!(r++>1e4)){switch(t){case"question":case"answer":n=document.getElementById("ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-0");break;case"comment":case"reply":n=document.getElementById("ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-1");break;case"project_help_question":n=document.getElementById("ka-uid-discussiontabbedpanel-0--tabbedpanel-tab-2")}if(null===n)return requestAnimationFrame(e);n.click()}}))})();