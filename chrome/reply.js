(()=>{"use strict";function e(e){return{body:e.body,cache:e.cache,credentials:e.credentials,headers:e.headers,integrity:e.integrity,keepalive:e.keepalive,method:e.method,mode:e.mode,redirect:e.redirect,referrer:e.referrer,referrerPolicy:e.referrerPolicy,signal:e.signal}}const r=fetch;window.fetch=function(t,i){return new Promise((a=>{t.url?.startsWith("https://www.khanacademy.org/api/internal/graphql/getFeedbackRepliesPage")?t.blob().then((i=>{const n=new FileReader;n.onloadend=()=>{const i=n.result,s=atob(i.split(",")[1]),o=JSON.parse(s);o.variables.limit=100;const c=new Request(t.url,{...e(t),body:JSON.stringify(o)}),d=r(c);a(d)},n.readAsDataURL(i)})):a(r(t,i))}))}})();