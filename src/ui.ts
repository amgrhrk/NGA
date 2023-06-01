interface GMConfig {
	userBlockList?: number[]
	subBlockList?: string[]
	showOriginalImage?: boolean
}

class Config {
	userBlockList: Set<number>
	subBlockList: Set<string>
	showOriginalImage: boolean

	constructor() {
		const config = (GM_getValue(scriptName) || {}) as GMConfig
		this.userBlockList = config.userBlockList ? new Set(config.userBlockList) : new Set()
		this.subBlockList = config.subBlockList ? new Set(config.subBlockList) : new Set()
		this.showOriginalImage = config.showOriginalImage === true ? true : false
	}

	save() {
		const config = {} as GMConfig
		config.userBlockList = [...this.userBlockList]
		config.subBlockList = [...this.subBlockList]
		config.showOriginalImage = this.showOriginalImage
		GM_setValue(scriptName, config)
	}
}

class Popup {
	private config: Config
	container: HTMLDivElement
	textAreas: readonly [HTMLTextAreaElement, HTMLTextAreaElement]
	checkbox: HTMLInputElement

	private static template = (() => {
		const template = document.createElement('template')
		template.innerHTML = `<div id="NGA-config-menu" style="display: none;">\n`
			+ `	<div>用户黑名单</div>\n`
			+ `	<textarea></textarea>\n`
			+ `	<div>版块黑名单</div>\n`
			+ `	<textarea></textarea>\n`
			+ `	<div>\n`
			+ `		<input type="checkbox" id="showOriginalImage"><label for="showOriginalImage">显示原图</label>\n`
			+ `	</div>\n`
			+ `	<div>\n`
			+ `		<button>确定</button>\n`
			+ `		<button>取消</button>\n`
			+ `	</div>\n`
			+ `</div>`
		return template
	})()

	constructor(config: Config) {
		this.config = config
		this.container = Popup.template.content.firstElementChild!.cloneNode(true) as HTMLDivElement
		this.textAreas = [...this.container.querySelectorAll('textarea')] as [HTMLTextAreaElement, HTMLTextAreaElement]
		this.checkbox = this.container.querySelector('input[type=checkbox]')!
		this.reset()
		const [confirmButton, cancelButton] = this.container.querySelectorAll('button')
		confirmButton.addEventListener('click', () => {
			this.config.userBlockList = new Set(this.textAreas[0].value
				.split('\n')
				.map(user => parseInt(user.trim(), 10))
				.filter(user => !Number.isNaN(user))
			)
			this.config.subBlockList = new Set(this.textAreas[1].value
				.split('\n')
				.map(sub => sub.trim())
				.filter(sub => sub !== '')
			)
			this.config.showOriginalImage = this.checkbox.checked
			this.config.save()
			this.hide()
		})
		cancelButton.addEventListener('click', () => {
			this.hide()
		})
		document.body.appendChild(this.container)
	}

	show() {
		this.reset()
		this.container.style.display = 'flex'
	}

	hide() {
		this.reset()
		this.container.style.display = 'none'
	}

	private reset() {
		this.textAreas[0].value = [...this.config.userBlockList].join('\n')
		this.textAreas[1].value = [...this.config.subBlockList].join('\n')
		this.checkbox.checked = this.config.showOriginalImage
	}
}

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
`)

class MenuItem {
	private template: HTMLTemplateElement
	private clickHandler: (event: Event) => void

	constructor(id: string, title: string, text: string, onClick: (event: Event) => void) {
		this.template = document.createElement('template')
		this.template.innerHTML = `<div id="${id}" class="item">\n`
			+ `	<a href="javascript:void(0)" title="${title}" style="white-space: nowrap;">${text}</a>\n`
			+ `</div>`
		this.clickHandler = onClick
	}

	private navButtonOnClickHandler() {
		const settingsButton = document.querySelector('a[title=设置]')
		settingsButton?.addEventListener('click', () => {
			this.append()
		})
	}

	private append() {
		const vanillaSettingsItem = document.querySelector('#startmenu .item > a[title="设置 - 提交debug信息"]')
		if (!vanillaSettingsItem) {
			return
		}
		const menuItem = this.template.content.firstElementChild!.cloneNode(true) as HTMLDivElement
		menuItem.firstElementChild!.addEventListener('click', this.clickHandler)
		vanillaSettingsItem.parentElement!.insertAdjacentElement('afterend', menuItem)
	}

	init() {
		const navButtons = document.querySelectorAll('#mainmenu .right > .td > a')
		const startButton = navButtons[0]
		const messageButton = navButtons[3]
		for (const button of [startButton, messageButton]) {
			button.addEventListener('click', () => this.navButtonOnClickHandler())
		}
	}
}