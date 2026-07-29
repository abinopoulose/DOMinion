import{m as e}from"./ProcessManager-KjzveyEk.js";import{t}from"./accounts-Ovurixid.js";function n(){let e=new Uint8Array(12);return crypto.getRandomValues(e),btoa(String.fromCharCode(...e)).replace(/[+/=]/g,``).slice(0,16)}async function r(e){let t=new TextEncoder().encode(e),n=await crypto.subtle.digest(`SHA-256`,t);return Array.from(new Uint8Array(n)).map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function i(e){let t=n();return`$SIM$${t}$${await r(t+e)}`}async function a(e,t){if(t.startsWith(`$PLAIN$`))return e===t.slice(7);if(t===`!`||t===`*`||t===`!!`)return!1;let n=t.split(`$`);if(n.length!==4||n[1]!==`SIM`)return!1;let i=n[2],a=n[3];return await r(i+e)===a}function o(){let e=[`root:x:0:0:root:/root:/bin/bash`],n=1e3;for(let r of t){let t=r.username.charAt(0).toUpperCase()+r.username.slice(1);e.push(`${r.username}:x:${n}:${n}:${t}:/home/${r.username}:/bin/bash`),n++}return e.push(`nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin`),e.join(`
`)+`
`}function s(){let e=[`root:!:19900:0:99999:7:::`],n=Math.floor(Date.now()/864e5);for(let r of t)e.push(`${r.username}:$PLAIN$${r.password}:${n}:0:99999:7:::`);return e.push(`nobody:*:19900:0:99999:7:::`),e.join(`
`)+`
`}function c(){let e=[`#`,`# This file MUST be edited with the 'visudo' command as root.`,`#`,`# See the man page for details on how to write a sudoers file.`,`#`,``,`# Defaults`,`Defaults	env_reset`,`Defaults	mail_badpass`,`Defaults	secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"`,`Defaults	timestamp_timeout=15`,``,`# Root can do anything`,`root	ALL=(ALL:ALL) ALL`,``,`# Members of the admin group may gain root privileges`,`%admin	ALL=(ALL) ALL`,``,`# Members of the sudo group may execute any command`,`%sudo	ALL=(ALL:ALL) ALL`,``,`# Per-user rules (generated from accounts config)`];for(let n of t)n.role===`admin`&&e.push(`${n.username}\tALL=(ALL:ALL) ALL`);return e.push(``),e.join(`
`)+`
`}function l(){let e=t.filter(e=>e.role===`admin`).map(e=>e.username),n=[`root:x:0:`,`admin:x:4:${e.join(`,`)}`,`sudo:x:27:${e.join(`,`)}`],r=1e3;for(let e of t)n.push(`${e.username}:x:${r}:${e.username}`),r++;return n.push(`nogroup:x:65534:`),n.push(``),n.join(`
`)+`
`}var u=e({ROOT_HOME_ID:()=>f,ROOT_ID:()=>d,getDesktopId:()=>m,getHomeId:()=>p,getTrashId:()=>h,seedNodeMap:()=>_,seedUserHome:()=>v}),d=`root`,f=`root-home`,p=e=>`home-${e}`,m=e=>`home-${e}-desktop`,h=e=>`home-${e}-trash`;function g(e,t,n,r,i=``,a=`peasant`,o=`peasant`,s){let c=Date.now(),l=``;return n===`file`&&t.includes(`.`)&&(l=t.split(`.`).pop()||``),{id:e,name:t,type:n,parentId:r,children:[],content:i,createdAt:c,modifiedAt:c,owner:a,group:o,permissions:s||(n===`directory`?`755`:`644`),meta:{extension:l}}}function _(){let e={};e[d]=g(d,``,`directory`,null,``,`root`,`root`),e[f]=g(f,`home`,`directory`,d,``,`root`,`root`),e[d].children.push(f),t.forEach(t=>{v(e,t.username)});let n=`sys-etc`;e[n]=g(n,`etc`,`directory`,d,``,`root`,`root`),e[d].children.push(n);let r=`sys-etc-hostname`;e[r]=g(r,`hostname`,`file`,n,`ubuntu-web
`,`root`,`root`),e[n].children.push(r);let i=`sys-etc-passwd`;e[i]=g(i,`passwd`,`file`,n,o(),`root`,`root`,`644`),e[n].children.push(i);let a=`sys-etc-shadow`;e[a]=g(a,`shadow`,`file`,n,s(),`root`,`shadow`,`640`),e[n].children.push(a);let u=`sys-etc-sudoers`;e[u]=g(u,`sudoers`,`file`,n,c(),`root`,`root`,`440`),e[n].children.push(u);let p=`sys-etc-group`;e[p]=g(p,`group`,`file`,n,l(),`root`,`root`,`644`),e[n].children.push(p);let m=`sys-bin`;e[m]=g(m,`bin`,`directory`,d,``,`root`,`root`),e[d].children.push(m);let h=`sys-usr`;e[h]=g(h,`usr`,`directory`,d,``,`root`,`root`),e[d].children.push(h);let _=`sys-usr-bin`;e[_]=g(_,`bin`,`directory`,h,``,`root`,`root`),e[h].children.push(_);let y=`sys-usr-bin-sudo`;e[y]=g(y,`sudo`,`file`,_,`sudo binary`,`root`,`root`,`4755`),e[_].children.push(y);let b=`sys-usr-bin-su`;e[b]=g(b,`su`,`file`,_,`su binary`,`root`,`root`,`4755`),e[_].children.push(b);let x=`sys-usr-bin-passwd`;e[x]=g(x,`passwd`,`file`,_,`passwd binary`,`root`,`root`,`4755`),e[_].children.push(x);let S=`sys-proc`;e[S]=g(S,`proc`,`directory`,d,``,`root`,`root`),e[d].children.push(S);let C=`sys-proc-meminfo`;e[C]=g(C,`meminfo`,`proc_file`,S,`meminfo`,`root`,`root`,`444`),e[S].children.push(C);let w=`sys-proc-cpuinfo`;e[w]=g(w,`cpuinfo`,`proc_file`,S,`cpuinfo`,`root`,`root`,`444`),e[S].children.push(w);let T=`sys-proc-uptime`;e[T]=g(T,`uptime`,`proc_file`,S,`uptime`,`root`,`root`,`444`),e[S].children.push(T);let E=`sys-dev`;e[E]=g(E,`dev`,`directory`,d,``,`root`,`root`),e[d].children.push(E);let D=`sys-dev-null`;e[D]=g(D,`null`,`character_device`,E,`null`,`root`,`root`,`666`),e[E].children.push(D);let O=`sys-dev-zero`;e[O]=g(O,`zero`,`character_device`,E,`zero`,`root`,`root`,`666`),e[E].children.push(O);let k=`sys-dev-random`;return e[k]=g(k,`random`,`character_device`,E,`random`,`root`,`root`,`444`),e[E].children.push(k),e}function v(e,t,n=f){let r=p(t),i=m(t),a=h(t);if(e[r]){e[n]&&!e[n].children.includes(r)&&e[n].children.push(r),e[r].parentId!==n&&(e[r].parentId=n);return}e[r]=g(r,t,`directory`,n,``,t,t,`750`),e[n]&&!e[n].children.includes(r)&&e[n].children.push(r),e[i]=g(i,`Desktop`,`directory`,r,``,t,t),e[r].children.push(i),e[a]=g(a,`.Trash`,`directory`,r,``,t,t),e[r].children.push(a);let o=`home-${t}-local`;e[o]=g(o,`.local`,`directory`,r,``,t,t),e[r].children.push(o);let s=`home-${t}-local-share`;e[s]=g(s,`share`,`directory`,o,``,t,t),e[o].children.push(s);let c=`home-${t}-local-share-trash`;e[c]=g(c,`Trash`,`directory`,s,``,t,t),e[s].children.push(c);let l=`home-${t}-documents`;e[l]=g(l,`Documents`,`directory`,r,``,t,t),e[r].children.push(l);let u=`home-${t}-welcome-txt`;e[u]=g(u,`welcome.txt`,`file`,l,`Welcome to Ubuntu 24 Web Desktop, ${t}!`,t,t),e[l].children.push(u);let d=`home-${t}-downloads`;e[d]=g(d,`Downloads`,`directory`,r,``,t,t),e[r].children.push(d);let _=`home-${t}-pictures`;e[_]=g(_,`Pictures`,`directory`,r,``,t,t),e[r].children.push(_);let v=`home-${t}-bashrc`;e[v]=g(v,`.bashrc`,`file`,r,`# ~/.bashrc: executed by bash for non-login shells.

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# History settings
HISTSIZE=1000
HISTFILESIZE=2000

# Aliases
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias cls='clear'
alias grep='grep --color=auto'

# Custom prompt
PS1='\\[\\e[32m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[34m\\]\\w\\[\\e[0m\\]\\$ '

# Source bash_aliases if exists
if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi
`,t,t),e[r].children.push(v)}export{i as a,u as i,p as n,a as o,h as r,m as t};