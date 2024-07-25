class UidElementNotFoundError extends TypeError {}

class Quote extends PostLike {
	private static readonly pool = new WeakMap<Quote['element'], Quote>()
	static readonly selector = '.quote'

	readonly element: HTMLElement
	_uid: number | null

	/** @deprecated Use Quote.from() instead */
	constructor(element: Quote['element']) {
		super()
		this.element = element
		this._uid = null
	}

	static from(element: Quote['element']) {
		return Quote._from(element, Quote, Quote.pool)
	}

	get uid() {
		if (this._uid == null) {
			const user = this.element.querySelector<HTMLAnchorElement>('a.b')
			if (!user) {
				// Anonymous
				this._uid = -1
			} else {
				const match = user.href.match(/uid=(.+$)/)!
				this._uid = Number.parseInt(match[1])
			}
		}
		return this._uid
	}

	hide() {
		this.element.style.display = 'none'
	}

	process(config: Config) {
		if (config.userBlockList.has(this.uid) || config.builtinList.has(this.uid)) {
			this.hide()
			return
		}
		if (config.translate) {
			translateChildTextNodes(this.element)
		}
		const collapseButton = this.element.querySelector('button[name=collapseSwitchButton]')
		if (collapseButton) {
			collapseButton.addEventListener('click', () => {
				const collapseContent = this.element.querySelector('.collapse_content')
				if (collapseContent && config.translate) {
					translateChildTextNodes(collapseContent)
				}
			}, { once: true })
		}
	}
}

class Post extends PostLike {
	private static readonly pool = new WeakMap<Post['element'], Post>()
	static readonly selector = '#m_posts_c > .postbox'

	readonly element: HTMLTableElement
	private _uid: number | null
	private _prestige: number | null
	private _fame: number | null
	private _content: HTMLElement | null
	private _quote: Quote[] | null

	/** @deprecated Use Post.from() instead */
	constructor(element: Post['element']) {
		super()
		this.element = element
		this._uid = null
		this._prestige = null
		this._fame = null
		this._content = null
		this._quote = null
	}

	static from(element: Post['element']) {
		return Post._from(element, Post, Post.pool)
	}

	static forEach(callback: (post: Post, config: Config) => void, processedElements: WeakSet<HTMLElement>, config: Config) {
		Post._forEach(callback, processedElements, config, Post, Post.pool)
	}

	get uid() {
		if (this._uid == null) {
			const url = this.element.querySelector<HTMLAnchorElement>('.author')!
			const uid = Number.parseInt(new URL(url.href).searchParams.get('uid')!)
			if (Number.isNaN(uid)) {
				throw new UidElementNotFoundError()
			}
			this._uid = uid
		}
		return this._uid
	}

	get content() {
		if (!this._content) {
			this._content = this.element.querySelector<HTMLElement>('.postcontent')
		}
		return this._content
	}

	get quote() {
		if (!this._quote) {
			const content = this.content!
			const quotes = content.querySelectorAll<HTMLElement>(Quote.selector)
			for (const quote of quotes) {
				if (quote.children[0]?.tagName === 'A') {
					if (!this._quote) {
						this._quote = []
					}
					this._quote.push(Quote.from(quote))
				}
			}
		}
		return this._quote
	}

	get prestige() {
		if (this._prestige == null) {
			try {
				const info = this.element.querySelector<HTMLElement>('.stat')!
				this._prestige = Number.parseInt(info.innerText.match(/威望: (-?\d+)/)![1], 10) || 0
			} catch (err) {
				try {
					const inlineInfo = this.element.querySelector<HTMLElement>('.posterInfoLine')!
					const columns = inlineInfo.querySelectorAll<HTMLElement>('.usercol')
					for (const column of columns) {
						if (column.innerText.includes('威望')) {
							const title = column.querySelector<HTMLElement>('.userval')!.title
							this._prestige = Number.parseInt(title, 10) || 0
							return this._prestige
						}
					}
					throw new RangeError()
				} catch (err) {
					throw err
				}
			}
		}
		return this._prestige
	}

	get fame() {
		if (this._fame == null) {
			try {
				const info = this.element.querySelector<HTMLElement>('.stat')!
				this._fame = Number.parseInt(info.innerText.match(/声望: (-?\d+)/)![1], 10) || 0
			} catch (err) {
				try {
					const inlineInfo = this.element.querySelector<HTMLElement>('.posterInfoLine')!
					const columns = inlineInfo.querySelectorAll<HTMLElement>('.usercol')
					for (const column of columns) {
						if (column.innerText.includes('声望')) {
							const title = column.querySelector<HTMLElement>('.userval')!.title
							this._fame = Number.parseInt(title, 10) || 0
							return this._fame
						}
					}
					throw new RangeError()
				} catch (err) {
					throw err
				}
			}
		}
		return this._fame
	}

	async process(config: Config) {
		if (config.userBlockList.has(this.uid) || config.builtinList.has(this.uid)) {
			this.hide()
			return
		}
		if (config.minPrestige != null || config.minPrestige != null) {
			if (this.prestige < config.minPrestige || this.fame < config.minPrestige) {
				this.hide()
				return
			}
		}
		if (config.translate) {
			translateChildTextNodes(this.content!)
			const collapseButtons = this.content!.querySelectorAll<HTMLButtonElement>('button[name=collapseSwitchButton]')
			for (const button of collapseButtons) {
				button.addEventListener('click', () => {
					const collapseContent = button.parentElement!.nextElementSibling
					if (collapseContent && collapseContent.classList.contains('collapse_content')) {
						translateChildTextNodes(collapseContent)
					}
				}, { once: true })
			}
		}
		this.quote?.forEach(quote => quote.process(config))
		await this.addBlockButton(config)
		this.resizeImages(config)
		this.removeItalic()
		this.removeReferrer()
	}

	private removeItalic() {
		if (!this.content) {
			return
		}
		const spans = this.content.querySelectorAll('span')
		for (const span of spans) {
			if (span.style.fontStyle === 'italic') {
				span.style.removeProperty('font-style')
			}
			span.style.removeProperty('letter-spacing')
		}
	}

	private async addBlockButton(config: Config) {
		const button = document.createElement('a')
		button.href = 'javascript:void(0)'
		button.innerText = '屏蔽'
		button.addEventListener('click', () => {
			if (this.uid <= 0 || Number.isNaN(this.uid)) {
				log(this.uid)
				return
			}
			this.hide()
			config.userBlockList.add(this.uid)
			config.save()
		})
		const uidElement = await waitForSelector<HTMLAnchorElement>('a[name=uid]', this.element)
		uidElement.insertAdjacentElement('afterend', button)
	}

	private resizeImages(config: Config) {
		const images = this.element.querySelectorAll<HTMLImageElement>('img')
		for (const image of images) {
			if (image.style.display === 'none') {
				image.remove()
				continue
			}
			let modified = false
			if (image.dataset.srcorg) {
				image.src = image.dataset.srcorg
				modified = true
			} else if (image.dataset.srclazy) {
				image.src = image.dataset.srclazy
				modified = true
			}
			delete image.dataset.srclazy
			delete image.dataset.srcorg
			delete image.dataset.usethumb
			if (!config.showOriginalImage && modified) {
				image.src = image.src + '.thumb.jpg'
				image.removeAttribute('style')
				image.style.maxWidth = '200px'
			}
			if (document.title.includes('安科')) {
				image.removeAttribute('style')
				image.addEventListener('load', () => {
					image.style.maxWidth = '150px'
				})
			}
		}
	}

	static processTitleAndNav(processedElements: WeakSet<HTMLElement>, config: Config) {
		if (!config.translate) {
			return
		}
		{
			const title = document.getElementById('postsubject0')
			if (title && !processedElements.has(title)) {
				translateChildTextNodes(title)
				processedElements.add(title)
			}
		}
		{
			const topNavButtons = document.querySelectorAll<HTMLAnchorElement>('#m_nav .nav_link')
			const title = topNavButtons[topNavButtons.length - 1]
			if (title && !processedElements.has(title)) {
				translateChildTextNodes(title)
				processedElements.add(title)
			}
		}
		{
			const bottomNavButtons = document.querySelectorAll<HTMLAnchorElement>('#b_nav .nav_link')
			const title = bottomNavButtons[bottomNavButtons.length - 1]
			if (title && !processedElements.has(title)) {
				translateChildTextNodes(title)
				processedElements.add(title)
			}
		}
	}

	removeReferrer() {
		if (this.content) {
			Post.removeReferrer(this.content.querySelectorAll('a'))
		}
	}
}