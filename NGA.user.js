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
// ==/UserScript==
const scriptName = 'NGA屏蔽用户';
function log(...data) {
    console.log(`${scriptName}:`, ...data);
}
class Config {
    constructor() {
        const config = (GM_getValue(scriptName) || {});
        this.userBlockList = config.userBlockList ? new Set(config.userBlockList) : new Set();
        this.subBlockList = config.subBlockList ? new Set(config.subBlockList) : new Set();
    }
    save() {
        const config = {};
        config.userBlockList = [...this.userBlockList];
        config.subBlockList = [...this.subBlockList];
        GM_setValue(scriptName, config);
    }
}
class Popup {
    constructor(config) {
        this.config = config;
        this.container = Popup.template.content.firstElementChild.cloneNode(true);
        this.textAreas = [...this.container.querySelectorAll('textarea')];
        this.reset();
        const [confirmButton, cancelButton] = this.container.querySelectorAll('button');
        confirmButton.addEventListener('click', () => {
            this.config.userBlockList = new Set(this.textAreas[0].value
                .split('\n')
                .map(user => parseInt(user.trim(), 10))
                .filter(user => !Number.isNaN(user)));
            this.config.subBlockList = new Set(this.textAreas[1].value
                .split('\n')
                .map(sub => sub.trim())
                .filter(sub => sub !== ''));
            this.config.save();
            this.hide();
        });
        cancelButton.addEventListener('click', () => {
            this.hide();
        });
        document.body.appendChild(this.container);
    }
    show() {
        this.reset();
        this.container.style.display = 'flex';
    }
    hide() {
        this.reset();
        this.container.style.display = 'none';
    }
    reset() {
        this.textAreas[0].value = [...this.config.userBlockList].join('\n');
        this.textAreas[1].value = [...this.config.subBlockList].join('\n');
    }
}
Popup.template = (() => {
    const template = document.createElement('template');
    template.innerHTML = `<div id="NGA-config-menu" style="display: none;">\n`
        + `	<div>用户黑名单</div>\n`
        + `	<textarea></textarea>\n`
        + `	<div>版块黑名单</div>\n`
        + `	<textarea></textarea>\n`
        + `	<div>\n`
        + `		<button>确定</button>\n`
        + `		<button>取消</button>\n`
        + `	</div>\n`
        + `</div>`;
    return template;
})();
// border: 1px solid #dddddd;
// box-shadow: 0 2px 8px #dddddd;
GM_addStyle(`
	#NGA-config-menu {
		background-color: #e1efeb;
		padding: 1rem;
		display: flex;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		flex-direction: column;
		border: 1px solid #d3dedb;
		box-shadow: 0 0 5px -3px black;
		box-sizing: border-box;
	}

	#NGA-config-menu > textarea {
		width: 20rem;
		height: 10rem;
	}

	#NGA-config-menu > div:nth-last-of-type(1) {
		display: flex;
		justify-content: end;
	}
`);
class MenuItem {
    constructor(id, title, text, onClick) {
        this.template = document.createElement('template');
        this.template.innerHTML = `<div id="${id}" class="item">\n`
            + `	<a href="javascript:void(0)" title="${title}" style="white-space: nowrap;">${text}</a>\n`
            + `</div>`;
        this.clickHandler = onClick;
    }
    navButtonOnClickHandler() {
        const startMenu = document.querySelector('#startmenu');
        const settingsButton = startMenu.querySelector('a[title=设置]');
        settingsButton === null || settingsButton === void 0 ? void 0 : settingsButton.addEventListener('click', () => this.append());
    }
    append() {
        if (document.getElementById('NGA-settings-item')) {
            return;
        }
        const startMenu = document.querySelector('#startmenu');
        if (!startMenu) {
            const navButtons = document.querySelectorAll('#mainmenu .right > .td > a');
            const startButton = navButtons[0];
            const messageButton = navButtons[3];
            for (const button of [startButton, messageButton]) {
                button.addEventListener('click', () => this.navButtonOnClickHandler());
            }
            return;
        }
        const subMenu = startMenu.querySelector('.last > div');
        const menuItem = this.template.content.firstElementChild.cloneNode(true);
        menuItem.firstElementChild.addEventListener('click', this.clickHandler);
        subMenu.insertAdjacentElement('beforeend', menuItem);
    }
}
function translateChildTextNodes(node, exclude) {
    const stack = [node];
    while (stack.length > 0) {
        const top = stack.pop();
        if (top === exclude) {
            continue;
        }
        if (top.hasChildNodes()) {
            stack.push(...top.childNodes);
            continue;
        }
        if (top.nodeType === Node.TEXT_NODE && top.textContent) {
            top.textContent = translate(top.textContent);
        }
    }
}
function addClickEventListener(element, handler) {
    element.addEventListener('mousedown', () => {
        window.addEventListener('mouseup', (e) => {
            if (e.target === element) {
                handler.call(element);
            }
        }, { once: true });
    });
}
(function (addClickEventListener) {
    function toBreadcrumb(handler) {
        for (const link of document.querySelectorAll('.nav_root, .nav_link')) {
            addClickEventListener(link, handler);
        }
    }
    addClickEventListener.toBreadcrumb = toBreadcrumb;
    function toPageNavigation(handler) {
        const pageButtons = [document.getElementById('pagebtop'), document.getElementById('pagebbtm')]
            .filter((nav) => nav)
            .flatMap(nav => [...nav.querySelectorAll('a:not([name=topage])')]);
        for (const button of pageButtons) {
            if (button.title.startsWith('加载')) {
                continue;
            }
            button.style.boxShadow = 'inset 5em 1em gold';
            addClickEventListener(button, handler);
        }
    }
    addClickEventListener.toPageNavigation = toPageNavigation;
    function toThreads(handler) {
        const threads = document.querySelectorAll('.topic');
        for (const thread of threads) {
            addClickEventListener(thread, handler);
        }
    }
    addClickEventListener.toThreads = toThreads;
})(addClickEventListener || (addClickEventListener = {}));
function loadImages() {
    const images = document.querySelectorAll('.postcontent img');
    for (const image of images) {
        if (image.dataset.srcorg) {
            image.src = image.dataset.srcorg;
        }
        else if (image.dataset.srclazy) {
            image.src = image.dataset.srclazy;
        }
        delete image.dataset.srclazy;
        delete image.dataset.srcorg;
    }
}
function processThreads(config) {
    const threads = document.querySelectorAll('#topicrows > tbody');
    if (threads.length === 0) {
        return false;
    }
    for (const thread of threads) {
        const url = thread.querySelector('a[class=author]');
        if (!url) {
            continue;
        }
        const uid = parseInt(url.title.replace('用户ID ', ''));
        const sub = thread.querySelector('span.titleadd2');
        if (config.userBlockList.has(uid) || (sub && config.subBlockList.has(sub.innerText))) {
            thread.style.display = 'none';
            continue;
        }
        const title = thread.querySelector('.topic');
        if (title) {
            title.innerText = translate(title.innerText);
        }
        addBlockButton(thread, url, uid, config);
    }
    return true;
}
function addBlockButton(thread, url, uid, config) {
    const button = document.createElement('a');
    button.href = 'javascript:void(0)';
    button.innerText = '屏蔽';
    button.style.marginLeft = '8px';
    button.addEventListener('click', () => {
        thread.style.display = 'none';
        config.userBlockList.add(uid);
        config.save();
    });
    url.insertAdjacentElement('afterend', button);
}
function processPosts(config) {
    const posts = document.querySelectorAll('table.forumbox.postbox');
    for (const post of posts) {
        const uid = parseInt(post.querySelector('a[name=uid]').innerText);
        if (config.userBlockList.has(uid)) {
            post.style.display = 'none';
            continue;
        }
        const postContent = post.querySelector('.postcontent');
        const quote = postContent.querySelector('.quote');
        translateChildTextNodes(postContent, quote);
        const collapseButton = postContent.querySelector('button[name=collapseSwitchButton]');
        if (collapseButton) {
            collapseButton.addEventListener('click', () => {
                const collapseContent = postContent.querySelector('.collapse_content');
                if (collapseContent) {
                    translateChildTextNodes(collapseContent);
                }
            }, { once: true });
        }
        if (quote) {
            const qUser = quote.querySelector('a.b');
            if (qUser) {
                const match = qUser.href.match(/uid=(.+$)/);
                if (match) {
                    const qUid = parseInt(match[1]);
                    if (config.userBlockList.has(qUid)) {
                        quote.style.display = 'none';
                        continue;
                    }
                    translateChildTextNodes(quote);
                    const collapseButton = quote.querySelector('button[name=collapseSwitchButton]');
                    if (collapseButton) {
                        collapseButton.addEventListener('click', () => {
                            const collapseContent = quote.querySelector('.collapse_content');
                            if (collapseContent) {
                                translateChildTextNodes(collapseContent);
                            }
                        }, { once: true });
                    }
                }
            }
        }
    }
    return true;
}
const config = new Config();
const injectScript = (() => {
    let prevNav = null;
    const popup = new Popup(config);
    const menuItems = [
        new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
            popup.show();
        })
    ];
    return () => {
        if (prevNav === document.getElementById('pagebtop')) {
            setTimeout(injectScript, 0);
            return;
        }
        prevNav = document.getElementById('pagebtop');
        menuItems.forEach(item => item.append());
        addClickEventListener.toBreadcrumb(injectScript);
        addClickEventListener.toPageNavigation(injectScript);
        addClickEventListener.toThreads(injectScript);
        if (!processThreads(config)) {
            loadImages();
            processPosts(config);
        }
    };
})();
injectScript();
