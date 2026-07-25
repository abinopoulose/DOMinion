import{r as e}from"./react-B8IZ02wI.js";var t=e({StandardStream:()=>n}),n=class{listeners=new Set;isTTY;buffer=``;constructor(e=!1){this.isTTY=e}write(e){this.appendToBuffer(e);for(let t of this.listeners)t(e)}writeLine(e){this.write(e+(this.isTTY?`\r
`:`
`))}appendToBuffer(e){this.buffer+=e}readAll(){return this.buffer}readLines(){return this.buffer.split(`
`).filter(e=>e.length>0)}onData(e){return this.listeners.add(e),()=>this.listeners.delete(e)}clearListeners(){this.listeners.clear()}};export{t as n,n as t};