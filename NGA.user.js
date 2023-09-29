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
// @run-at       document-body
// ==/UserScript==
const scriptName = 'NGA屏蔽用户';
function log(...data) {
    console.log(`${scriptName}:`, ...data);
}
const html = String.raw;
const css = String.raw;
class Config {
    constructor() {
        const config = (GM_getValue(scriptName) || {});
        this.userBlockList = config.userBlockList ? new Set(config.userBlockList) : new Set();
        this.subBlockList = config.subBlockList ? new Set(config.subBlockList) : new Set();
        this.showOriginalImage = config.showOriginalImage === true ? true : false;
        this.onSave = null;
    }
    save() {
        const config = {};
        config.userBlockList = [...this.userBlockList];
        config.subBlockList = [...this.subBlockList];
        config.showOriginalImage = this.showOriginalImage;
        GM_setValue(scriptName, config);
        if (this.onSave) {
            this.onSave();
        }
    }
}
class Popup {
    constructor(config) {
        this.config = config;
        this.container = Popup.template.content.firstElementChild.cloneNode(true);
        this.textAreas = [...this.container.querySelectorAll('textarea')];
        this.checkbox = this.container.querySelector('input[type=checkbox]');
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
            this.config.showOriginalImage = this.checkbox.checked;
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
        this.checkbox.checked = this.config.showOriginalImage;
    }
}
Popup.template = (() => {
    const template = document.createElement('template');
    template.innerHTML = html `
<div id="NGA-config-menu" style="display: none;">
	<div>用户黑名单</div>
	<textarea></textarea>
	<div>版块黑名单</div>
	<textarea></textarea>
	<div>
		<input type="checkbox" id="showOriginalImage"><label for="showOriginalImage">显示原图</label>
	</div>
	<div>
		<button>确定</button>
		<button>取消</button>
	</div>
</div>`.trim();
    return template;
})();
// border: 1px solid #dddddd;
// box-shadow: 0 2px 8px #dddddd;
GM_addStyle(css `
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
        this.template.innerHTML = html `
<div id="${id}" class="item">
	<a href="javascript:void(0)" title="${title}" style="white-space: nowrap;">${text}</a>
</div>`.trim();
        this.clickHandler = onClick;
        this.initialized = false;
    }
    navButtonOnClickHandler() {
        const settingsButton = document.querySelector('a[title=设置]');
        settingsButton === null || settingsButton === void 0 ? void 0 : settingsButton.addEventListener('click', () => {
            this.append();
        });
    }
    append() {
        const vanillaSettingsItem = document.querySelector('#startmenu .item > a[title="设置 - 提交debug信息"]');
        if (!vanillaSettingsItem) {
            return;
        }
        const menuItem = this.template.content.firstElementChild.cloneNode(true);
        menuItem.firstElementChild.addEventListener('click', this.clickHandler);
        vanillaSettingsItem.parentElement.insertAdjacentElement('afterend', menuItem);
    }
    init() {
        if (this.initialized) {
            return;
        }
        const navButtons = document.querySelectorAll('#mainmenu .right > .td > a');
        const startButton = navButtons[0];
        const messageButton = navButtons[3];
        for (const button of [startButton, messageButton]) {
            button.addEventListener('click', () => this.navButtonOnClickHandler());
        }
        this.initialized = true;
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
function loadImages(config, imageSet) {
    const images = document.querySelectorAll('.postcontent img');
    for (const image of images) {
        if (image.style.display === 'none') {
            image.remove();
            continue;
        }
        imageSet.add(image);
        let modified = false;
        if (image.dataset.srcorg) {
            image.src = image.dataset.srcorg;
            modified = true;
        }
        else if (image.dataset.srclazy) {
            image.src = image.dataset.srclazy;
            modified = true;
        }
        delete image.dataset.srclazy;
        delete image.dataset.srcorg;
        if (!config.showOriginalImage && modified) {
            image.src = image.src + '.thumb.jpg';
            image.removeAttribute('style');
            image.style.maxWidth = '200px';
        }
        if (document.title.includes('安科')) {
            image.removeAttribute('style');
            image.addEventListener('load', () => {
                image.style.maxWidth = '300px';
            });
        }
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
        const uidElement = post.querySelector('a[name=uid]');
        const uid = parseInt(uidElement.innerText);
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
        processQuote(config, quote);
        addBlockButtonForPost(config, post, uidElement, uid);
    }
    return true;
}
function processQuote(config, quote) {
    if (!quote) {
        return;
    }
    const qUser = quote.querySelector('a.b');
    if (qUser) {
        const match = qUser.href.match(/uid=(.+$)/);
        if (match) {
            const qUid = parseInt(match[1]);
            if (config.userBlockList.has(qUid)) {
                quote.style.display = 'none';
                return;
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
function addBlockButtonForPost(config, post, uidElement, uid) {
    const button = document.createElement('a');
    button.href = 'javascript:void(0)';
    button.innerText = '屏蔽';
    button.addEventListener('click', () => {
        post.style.display = 'none';
        config.userBlockList.add(uid);
        config.save();
    });
    uidElement.insertAdjacentElement('afterend', button);
}
async function waitForElement(predicate) {
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        continue;
                    }
                    const element = node;
                    if (predicate(element)) {
                        resolve(element);
                        observer.disconnect();
                        return;
                    }
                }
            }
        });
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    });
}
const config = new Config();
const injectScript = (() => {
    let prevNav = null;
    const popup = new Popup(config);
    config.onSave = () => popup.reset();
    const menuItems = [
        new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
            popup.show();
        })
    ];
    const images = new Set();
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            const image = mutation.target;
            if (!images.has(image) || mutation.attributeName !== 'style') {
                return;
            }
            image.style.maxWidth = '200px';
        }
    });
    return () => {
        if (prevNav === document.getElementById('pagebtop')) {
            setTimeout(injectScript, 0);
            return;
        }
        prevNav = document.getElementById('pagebtop');
        menuItems.forEach(item => item.init());
        addClickEventListener.toBreadcrumb(injectScript);
        addClickEventListener.toPageNavigation(injectScript);
        addClickEventListener.toThreads(async () => {
            await waitForElement(element => element instanceof HTMLAnchorElement && element.name === 'uid');
            injectScript();
        });
        if (!processThreads(config)) {
            loadImages(config, images);
            processPosts(config);
        }
        if (!config.showOriginalImage) {
            observer.observe(document.body, { attributes: true, subtree: true, attributeOldValue: true });
        }
    };
})();
(async function start() {
    await waitForElement(element => element.id === 'footer');
    injectScript();
})();
