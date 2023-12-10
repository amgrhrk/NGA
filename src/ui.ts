interface GMConfig {
	userBlockList?: number[]
	subBlockList?: string[]
	showOriginalImage?: boolean
	translate?: boolean
	minPrestige?: number | null
	minFame?: number | null
}

function dedent(strings: TemplateStringsArray , ...values: unknown[]) {
	const raw = String.raw(strings, ...values)
	const lines = raw.split('\n')
	if (lines.length === 1 || lines[0] !== '') {
		return raw.trim()
	}
	const match = lines[1].match(/^\t+/)
	const tabCount = match ? match[0].length : 0
	return lines.slice(1, -1)
		.map(line => line.substring(tabCount))
		.join('\n')
}

const html = dedent
const css = dedent

class Config {
	userBlockList: Set<number>
	subBlockList: Set<string>
	showOriginalImage: boolean
	translate: boolean
	minPrestige: number | null
	minFame: number | null
	builtinList: Set<number>
	onSave: (() => void) | null

	constructor() {
		const config = (GM_getValue(scriptName) || {}) as GMConfig
		this.userBlockList = config.userBlockList ? new Set(config.userBlockList) : new Set()
		this.subBlockList = config.subBlockList ? new Set(config.subBlockList) : new Set()
		this.showOriginalImage = config.showOriginalImage === true ? true : false
		this.translate = config.translate === true ? true : false
		this.minPrestige = typeof config.minPrestige === 'number' ? config.minPrestige : null
		this.minFame = typeof config.minFame === 'number' ? config.minFame : null
		this.builtinList = new Set([956564,34201725,38146875,24725535,41191050,42373557,42972877,38517106,60960472,37696042,64998061,64905710,18493530,64511209,62964037,64168806,39444715,62995527,64962762,24471876,24278093,38182060,63038402,64875893,63980970,64027799,42736490,61113710,2108224,60840502,27196711,27290490,61593368,62354830,40260492,60857928,16166607,64950721,64801026,42532270,33340659,63837943,63932553,60031665,42542974,40546626,60734340,61885061,64908735,60476258,63737894,42682561,61294795,65105246,65160081,62071980,65000688,63378897,62973199,65211479,65127396,10264780,62220798,60802519,62992077,62119265,60757655,60208011,65140170,65264648,65293279,5933531,64521276,62587420,62947939,64086961,23425781,64399329,61392967,41131477,63821543,61697658,60287385,14247864,41369492,64954429,41693949,42944842,65025394,61472080,65021321,2513214,65310860,42492456,63755129,63619215,65214543,3260753,63500726,43318394,60158610,42901823,65306517,63474298,8480553,65148969,42818275,25462093,61454164,60194256,42832970,60299697,42523265,39863329,42137113,41667940,2475450,64464738])
		this.onSave = null
	}

	save() {
		const config = {} as GMConfig
		config.userBlockList = [...this.userBlockList]
		config.subBlockList = [...this.subBlockList]
		config.minPrestige = this.minPrestige
		config.minFame = this.minFame
		config.showOriginalImage = this.showOriginalImage
		config.translate = this.translate
		GM_setValue(scriptName, config)
		if (this.onSave) {
			this.onSave()
		}
	}
}

class Popup {
	private config: Config
	container: HTMLDivElement
	textAreas: readonly [HTMLTextAreaElement, HTMLTextAreaElement]
	thresholds: readonly [HTMLInputElement, HTMLInputElement]
	checkboxes: readonly [HTMLInputElement, HTMLInputElement]

	private static template = (() => {
		const template = document.createElement('template')
		template.innerHTML = html`
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
				</div>
				<div>
					<button>确定</button>
					<button>取消</button>
				</div>
			</div>
		`
		return template
	})()

	constructor(config: Config) {
		this.config = config
		this.container = Popup.template.content.firstElementChild!.cloneNode(true) as HTMLDivElement
		this.textAreas = [...this.container.querySelectorAll('textarea')] as [HTMLTextAreaElement, HTMLTextAreaElement]
		this.thresholds = [...this.container.querySelectorAll('#threshold > input')] as [HTMLInputElement, HTMLInputElement]
		this.checkboxes = [this.container.querySelector('#showOriginalImage')!, this.container.querySelector('#translate')!]
		this.reset()
		const [confirmButton, cancelButton] = this.container.querySelectorAll('button')
		confirmButton.addEventListener('click', () => {
			this.save()
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

	reset() {
		this.textAreas[0].value = [...this.config.userBlockList].join('\n')
		this.textAreas[1].value = [...this.config.subBlockList].join('\n')
		this.thresholds[0].value = this.config.minPrestige != null ? `${this.config.minPrestige}` : ''
		this.thresholds[1].value = this.config.minFame != null ? `${this.config.minFame}` : ''
		this.checkboxes[0].checked = this.config.showOriginalImage
		this.checkboxes[1].checked = this.config.translate
	}

	save() {
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
		const prestige = this.thresholds[0].value.trim()
		this.config.minPrestige = prestige === '' ? null : (Number.parseInt(prestige) || this.config.minPrestige)
		const fame = this.thresholds[1].value.trim()
		this.config.minFame = fame === '' ? null : (Number.parseInt(fame) || this.config.minFame)
		this.config.showOriginalImage = this.checkboxes[0].checked
		this.config.translate = this.checkboxes[1].checked
		this.config.save()
	}
}

// border: 1px solid #dddddd;
// box-shadow: 0 2px 8px #dddddd;
GM_addStyle(css`
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
	private initialized: boolean

	constructor(id: string, title: string, text: string, onClick: (event: Event) => void) {
		this.template = document.createElement('template')
		this.template.innerHTML = html`
			<div id="${id}" class="item">
				<a href="javascript:void(0)" title="${title}" style="white-space: nowrap;">${text}</a>
			</div>
		`
		this.clickHandler = onClick
		this.initialized = false
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
		const menu = vanillaSettingsItem.parentElement!.parentElement!
		const menuItem = this.template.content.firstElementChild!.cloneNode(true) as HTMLDivElement
		menuItem.firstElementChild!.addEventListener('click', this.clickHandler)
		menu.appendChild(menuItem)
	}

	init() {
		if (this.initialized) {
			return
		}
		const navButtons = document.querySelectorAll('#mainmenu .right > .td > a')
		const startButton = navButtons[0]
		const messageButton = navButtons[3]
		for (const button of [startButton, messageButton]) {
			button.addEventListener('click', () => this.navButtonOnClickHandler())
		}
		this.initialized = true
	}
}