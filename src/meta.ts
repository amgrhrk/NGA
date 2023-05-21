// ==UserScript==
// @name         NGA屏蔽用户
// @namespace    0hCM5sa3Sj9BjYg
// @version      0.1
// @description  NGA屏蔽用户
// @match        https://nga.178.com/*
// @match        https://bbs.nga.cn/*
// @match        https://ngabbs.com/*
// @match        https://g.nga.cn/*
// @icon         https://www.google.com/s2/favicons?domain=nga.178.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/gh/amgrhrk/NGA/src/translate.js
// @run-at       document-end
// ==/UserScript==

declare function GM_setValue(name: string, value: any): void
declare function GM_getValue(name: string, defaultValue?: any): any
declare function GM_addStyle(css: string): void
declare const translate: (text: string) => string

const scriptName = 'NGA屏蔽用户'
function log(...data: any[]) {
	console.log(`${scriptName}:`, ...data)
}