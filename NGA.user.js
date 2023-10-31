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
// @grant        GM_getResourceText
// @require      https://cdn.jsdelivr.net/gh/amgrhrk/NGA/src/translate.js
// @resource     list https://raw.githubusercontent.com/amgrhrk/NGA/main/list.json
// @run-at       document-body
// ==/UserScript==
const scriptName = 'NGA屏蔽用户';
function log(...data) {
    console.log(`[${scriptName}]:`, ...data);
}
function dedent(strings, ...values) {
    const raw = String.raw(strings, ...values);
    const lines = raw.split('\n');
    if (lines.length === 1 || lines[0] !== '') {
        return raw.trim();
    }
    const match = lines[1].match(/^\t+/);
    const tabCount = match ? match[0].length : 0;
    return lines.slice(1, -1)
        .map(line => line.substring(tabCount))
        .join('\n');
}
const html = dedent;
const css = dedent;
class CloudList {
    constructor(enabled) {
        this.enabled = enabled === true ? true : false;
        try {
            this.set = new Set(JSON.parse(GM_getResourceText('list')));
        }
        catch (err) {
            log(err);
            this.set = new Set();
        }
    }
    has(uid) {
        return this.set.has(uid);
    }
}
class Config {
    constructor() {
        const config = (GM_getValue(scriptName) || {});
        this.userBlockList = config.userBlockList ? new Set(config.userBlockList) : new Set();
        this.subBlockList = config.subBlockList ? new Set(config.subBlockList) : new Set();
        this.showOriginalImage = config.showOriginalImage === true ? true : false;
        this.translate = config.translate === true ? true : false;
        this.minPrestige = typeof config.minPrestige === 'number' ? config.minPrestige : null;
        this.minFame = typeof config.minFame === 'number' ? config.minFame : null;
        this.cloudList = new CloudList(config.cloudList);
        this.onSave = null;
    }
    save() {
        const config = {};
        config.userBlockList = [...this.userBlockList];
        config.subBlockList = [...this.subBlockList];
        config.minPrestige = this.minPrestige;
        config.minFame = this.minFame;
        config.showOriginalImage = this.showOriginalImage;
        config.translate = this.translate;
        config.cloudList = this.cloudList.enabled;
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
        this.thresholds = [...this.container.querySelectorAll('#threshold > input')];
        this.checkboxes = [this.container.querySelector('#showOriginalImage'), this.container.querySelector('#translate'), this.container.querySelector('#cloudList')];
        this.reset();
        const [confirmButton, cancelButton] = this.container.querySelectorAll('button');
        confirmButton.addEventListener('click', () => {
            this.save();
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
        this.thresholds[0].value = this.config.minPrestige != null ? `${this.config.minPrestige}` : '';
        this.thresholds[1].value = this.config.minFame != null ? `${this.config.minFame}` : '';
        this.checkboxes[0].checked = this.config.showOriginalImage;
        this.checkboxes[1].checked = this.config.translate;
        this.checkboxes[2].checked = this.config.cloudList.enabled;
    }
    save() {
        this.config.userBlockList = new Set(this.textAreas[0].value
            .split('\n')
            .map(user => parseInt(user.trim(), 10))
            .filter(user => !Number.isNaN(user)));
        this.config.subBlockList = new Set(this.textAreas[1].value
            .split('\n')
            .map(sub => sub.trim())
            .filter(sub => sub !== ''));
        const prestige = this.thresholds[0].value.trim();
        this.config.minPrestige = prestige === '' ? null : (Number.parseInt(prestige) || this.config.minPrestige);
        const fame = this.thresholds[1].value.trim();
        this.config.minFame = fame === '' ? null : (Number.parseInt(fame) || this.config.minFame);
        this.config.showOriginalImage = this.checkboxes[0].checked;
        this.config.translate = this.checkboxes[1].checked;
        this.config.cloudList.enabled = this.checkboxes[2].checked;
        this.config.save();
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
				<div id="threshold">
					<div>屏蔽低数值用户</div>
					威望<input size="1">声望<input size="1">
				</div>
				<div>
					<input type="checkbox" id="showOriginalImage"><label for="showOriginalImage">显示原图</label>
					<input type="checkbox" id="translate"><label for="translate">繁转简</label>
					<input type="checkbox" id="cloudList"><label for="cloudList">云屏蔽</label>
				</div>
				<div>
					<button>确定</button>
					<button>取消</button>
				</div>
			</div>
		`;
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
			</div>
		`;
        this.clickHandler = onClick;
        this.initialized = false;
    }
    navButtonOnClickHandler() {
        const settingsButton = document.querySelector('a[title=设置]');
        settingsButton?.addEventListener('click', () => {
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
async function waitForElement(id) {
    const element = document.getElementById(id);
    if (element) {
        return element;
    }
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver(mutations => {
            const element = document.getElementById(id);
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });
}
async function waitForSelector(selectors, parent) {
    const element = parent ? parent.querySelector(selectors) : document.querySelector(selectors);
    if (element) {
        return element;
    }
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver(mutations => {
            const element = parent ? parent.querySelector(selectors) : document.querySelector(selectors);
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });
        observer.observe(parent ? parent : document.body, { childList: true, subtree: true });
    });
}
class PostLike {
    static _from(element, _class, pool) {
        const postLike = pool.get(element);
        if (postLike) {
            return postLike;
        }
        const newPostLike = new _class(element);
        pool.set(element, newPostLike);
        return newPostLike;
    }
    static _forEach(callback, processedElements, config, _class, pool) {
        const elements = document.querySelectorAll(_class.selector);
        for (const element of elements) {
            if (!processedElements.has(element)) {
                try {
                    callback(PostLike._from(element, _class, pool), config);
                    processedElements.add(element);
                }
                catch (err) {
                    if (!(err instanceof UidElementNotFoundError)) {
                        log(err);
                    }
                }
            }
        }
    }
}
class Thread extends PostLike {
    /** @deprecated Use Thread.from() instead */
    constructor(element) {
        super();
        this.element = element;
        this._uid = null;
        this._sub = null;
    }
    static from(element) {
        return Thread._from(element, Thread, Thread.pool);
    }
    static forEach(callback, processedElements, config) {
        Thread._forEach(callback, processedElements, config, Thread, Thread.pool);
    }
    get uid() {
        if (this._uid == null) {
            const url = this.element.querySelector('a[class=author]');
            this._uid = Number.parseInt(new URL(url.href).searchParams.get('uid'));
        }
        return this._uid;
    }
    get sub() {
        if (this._sub == null) {
            const sub = this.element.querySelector('.titleadd2');
            if (sub) {
                this._sub = sub.innerText;
            }
        }
        return this._sub;
    }
    hide() {
        this.element.style.display = 'none';
    }
    process(config) {
        if (config.userBlockList.has(this.uid) || (this.sub && config.subBlockList.has(this.sub)) || (config.cloudList.enabled && config.cloudList.has(this.uid))) {
            this.hide();
            return;
        }
        const title = this.element.querySelector('.topic');
        if (title && config.translate) {
            title.innerText = translate(title.innerText);
        }
        this.addBlockButton(config);
    }
    addBlockButton(config) {
        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
        button.innerText = '屏蔽';
        button.style.marginLeft = '8px';
        button.addEventListener('click', () => {
            if (this.uid <= 0 || Number.isNaN(this.uid)) {
                log(this.uid);
                return;
            }
            this.hide();
            config.userBlockList.add(this.uid);
            config.save();
        });
        const url = this.element.querySelector('a[class=author]');
        url.insertAdjacentElement('afterend', button);
    }
}
Thread.pool = new WeakMap();
Thread.selector = '#topicrows > tbody';
class UidElementNotFoundError extends TypeError {
}
class Quote extends PostLike {
    /** @deprecated Use Quote.from() instead */
    constructor(element) {
        super();
        this.element = element;
        this._uid = null;
    }
    static from(element) {
        return Quote._from(element, Quote, Quote.pool);
    }
    get uid() {
        if (this._uid == null) {
            const user = this.element.querySelector('a.b');
            const match = user.href.match(/uid=(.+$)/);
            this._uid = Number.parseInt(match[1]);
        }
        return this._uid;
    }
    hide() {
        this.element.style.display = 'none';
    }
    process(config) {
        if (config.userBlockList.has(this.uid) || (config.cloudList.enabled && config.cloudList.has(this.uid))) {
            this.hide();
            return;
        }
        if (config.translate) {
            translateChildTextNodes(this.element);
        }
        const collapseButton = this.element.querySelector('button[name=collapseSwitchButton]');
        if (collapseButton) {
            collapseButton.addEventListener('click', () => {
                const collapseContent = this.element.querySelector('.collapse_content');
                if (collapseContent && config.translate) {
                    translateChildTextNodes(collapseContent);
                }
            }, { once: true });
        }
    }
}
Quote.pool = new WeakMap();
Quote.selector = '.quote';
class Post extends PostLike {
    /** @deprecated Use Post.from() instead */
    constructor(element) {
        super();
        this.element = element;
        this._uid = null;
        this._prestige = null;
        this._fame = null;
        this._content = null;
        this._quote = null;
    }
    static from(element) {
        return Post._from(element, Post, Post.pool);
    }
    static forEach(callback, processedElements, config) {
        Post._forEach(callback, processedElements, config, Post, Post.pool);
    }
    get uid() {
        if (this._uid == null) {
            const uidElement = this.element.querySelector('a[name=uid]');
            if (!uidElement) {
                throw new UidElementNotFoundError();
            }
            this._uid = Number.parseInt(uidElement.innerText);
        }
        return this._uid;
    }
    get content() {
        if (!this._content) {
            this._content = this.element.querySelector('.postcontent');
        }
        return this._content;
    }
    get quote() {
        if (!this._quote) {
            const content = this.content;
            const quote = content.querySelector(Quote.selector);
            if (quote) {
                this._quote = Quote.from(quote);
            }
        }
        return this._quote;
    }
    get prestige() {
        if (this._prestige == null) {
            try {
                const info = this.element.querySelector('.stat');
                this._prestige = Number.parseInt(info.innerText.match(/威望: (-?\d+)/)[1], 10) || 0;
            }
            catch (err) {
                try {
                    const inlineInfo = this.element.querySelector('.posterInfoLine');
                    const columns = inlineInfo.querySelectorAll('.usercol');
                    for (const column of columns) {
                        if (column.innerText.includes('威望')) {
                            const title = column.querySelector('.userval').title;
                            this._prestige = Number.parseInt(title, 10) || 0;
                            return this._prestige;
                        }
                    }
                    throw new RangeError();
                }
                catch (err) {
                    throw err;
                }
            }
        }
        return this._prestige;
    }
    get fame() {
        if (this._fame == null) {
            try {
                const info = this.element.querySelector('.stat');
                this._fame = Number.parseInt(info.innerText.match(/声望: (-?\d+)/)[1], 10) || 0;
            }
            catch (err) {
                try {
                    const inlineInfo = this.element.querySelector('.posterInfoLine');
                    const columns = inlineInfo.querySelectorAll('.usercol');
                    for (const column of columns) {
                        if (column.innerText.includes('声望')) {
                            const title = column.querySelector('.userval').title;
                            this._fame = Number.parseInt(title, 10) || 0;
                            return this._fame;
                        }
                    }
                    throw new RangeError();
                }
                catch (err) {
                    throw err;
                }
            }
        }
        return this._fame;
    }
    hide() {
        this.element.style.display = 'none';
    }
    process(config) {
        if (config.userBlockList.has(this.uid) || (config.cloudList.enabled && config.cloudList.has(this.uid))) {
            this.hide();
            return;
        }
        if (config.minPrestige != null || config.minPrestige != null) {
            if (this.prestige < config.minPrestige || this.fame < config.minPrestige) {
                this.hide();
                return;
            }
        }
        if (config.translate) {
            translateChildTextNodes(this.content, this.quote?.element);
        }
        const collapseButton = this._content.querySelector('button[name=collapseSwitchButton]');
        if (collapseButton) {
            collapseButton.addEventListener('click', () => {
                const collapseContent = this.content.querySelector('.collapse_content');
                if (collapseContent && config.translate) {
                    translateChildTextNodes(collapseContent);
                }
            }, { once: true });
        }
        this.quote?.process(config);
        this.addBlockButton(config);
        this.resizeImages(config);
    }
    addBlockButton(config) {
        const button = document.createElement('a');
        button.href = 'javascript:void(0)';
        button.innerText = '屏蔽';
        button.addEventListener('click', () => {
            if (this.uid <= 0 || Number.isNaN(this.uid)) {
                log(this.uid);
                return;
            }
            this.hide();
            config.userBlockList.add(this.uid);
            config.save();
        });
        const uidElement = this.element.querySelector('a[name=uid]');
        uidElement.insertAdjacentElement('afterend', button);
    }
    resizeImages(config) {
        const images = this.element.querySelectorAll('img');
        for (const image of images) {
            if (image.style.display === 'none') {
                image.remove();
                continue;
            }
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
}
Post.pool = new WeakMap();
Post.selector = '#m_posts_c > .postbox';
function inject(processedElements, config) {
    if (location.pathname === '/thread.php') {
        Thread.forEach(thread => thread.process(config), processedElements, config);
    }
    else if (location.pathname === '/read.php') {
        Post.forEach(post => post.process(config), processedElements, config);
    }
    const observer = new MutationObserver(() => {
        if (location.pathname === '/thread.php') {
            Thread.forEach(thread => thread.process(config), processedElements, config);
        }
        else if (location.pathname === '/read.php') {
            Post.forEach(post => post.process(config), processedElements, config);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
(async function main() {
    const config = new Config();
    const popup = new Popup(config);
    config.onSave = () => popup.reset();
    const menuItems = [
        new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
            popup.show();
        })
    ];
    (async function insertMenuItems() {
        await waitForElement('pagebtop');
        menuItems.forEach(item => item.init());
    })();
    const processedElements = new WeakSet();
    inject(processedElements, config);
})();
