class Thread extends PostLike {
	private static readonly pool = new WeakMap<Thread['element'], Thread>()
	static readonly selector = '#topicrows > tbody'

	readonly element: HTMLTableSectionElement
	_uid: number | null
	_sub: string | null

	/** @deprecated Use Thread.from() instead */
	constructor(element: Thread['element']) {
		super()
		this.element = element
		this._uid = null
		this._sub = null
	}

	static from(element: Thread['element']) {
		return Thread._from(element, Thread, Thread.pool)
	}

	static forEach(callback: (thread: Thread, config: Config) => void, processedElements: WeakSet<HTMLElement>, config: Config) {
		Thread._forEach(callback, processedElements, config, Thread, Thread.pool)
	}

	get uid() {
		if (this._uid == null) {
			const url = this.element.querySelector<HTMLAnchorElement>('.author')!
			this._uid = Number.parseInt(new URL(url.href).searchParams.get('uid')!)
		}
		return this._uid
	}

	get sub() {
		if (this._sub == null) {
			const sub = this.element.querySelector<HTMLSpanElement>('.titleadd2')
			if (sub) {
				this._sub = sub.innerText
			}
		}
		return this._sub
	}

	async process(config: Config) {
		const uidUrl = await waitForSelector<HTMLAnchorElement>('a.author', this.element)
		if (config.userBlockList.has(this.uid) || (this.sub && config.subBlockList.has(this.sub)) || config.builtinList.has(this.uid)) {
			this.hide()
		}
		const title = this.element.querySelector<HTMLElement>('.topic')
		if (title && config.translate) {
			title.innerText = translate(title.innerText)
		}
		this.addBlockButton(config, uidUrl)
	}

	async addBlockButton(config: Config, url: HTMLAnchorElement) {
		const button = document.createElement('a')
		button.href = 'javascript:void(0)'
		button.innerText = '屏蔽'
		button.style.marginLeft = '8px'
		button.addEventListener('click', async () => {
			if (this.uid <= 0 || Number.isNaN(this.uid)) {
				log('Thread.addBlockButton', this.uid)
				return
			}
			this.hide()
			config.userBlockList.add(this.uid)
			config.save()
		})
		url.insertAdjacentElement('afterend', button)
	}

	removeReferrer() {
		// #b_nav a, #m_pbtnbtm a, #m_pbtntop a, #m_nav a
		Thread.removeReferrer(this.element.querySelectorAll<HTMLAnchorElement>('a.topic, a.silver'))
	}
}