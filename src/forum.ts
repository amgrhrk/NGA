type Class<T extends PostLike> = {
	new (element: T['element']): T
	readonly selector: string
}

abstract class PostLike {
	abstract readonly element: HTMLElement

	abstract get uid(): number

	static hiddenPosts: Set<PostLike> = new Set()

	static hiding = true

	protected static _from<T extends PostLike>(element: T['element'], _class: Class<T>, pool: WeakMap<T['element'], T>) {
		const postLike = pool.get(element)
		if (postLike) {
			return postLike
		}
		const newPostLike = new _class(element)
		pool.set(element, newPostLike)
		return newPostLike
	}

	protected static _forEach<T extends PostLike>(callback: (postLike: T, config: Config) => void, processedElements: WeakSet<HTMLElement>, config: Config, _class: Class<T>, pool: WeakMap<T['element'], T>) {
		const elements = document.querySelectorAll<T['element']>(_class.selector)
		for (const element of elements) {
			if (!processedElements.has(element)) {
				try {
					callback(PostLike._from(element, _class, pool), config)
					processedElements.add(element)
				} catch (err) {
					log(err)
				}
			}
		}
	}

	protected static removeReferrer(urls: Iterable<HTMLAnchorElement>) {
		for (const url of urls) {
			url.target = '_blank'
			const values = new Set(url.rel.split(/\s+/))
			values.delete('')
			values.add('noopener')
			values.add('noreferrer')
			url.rel = [...values].join(' ')
		}
	}

	hide() {
		PostLike.hiddenPosts.add(this)
		if (PostLike.hiding) {
			this.element.style.display = 'none'
		}
	}

	show() {
		this.element.style.display = ''
	}

	static hideAll() {
		PostLike.hiding = true
		for (const postLike of PostLike.hiddenPosts) {
			postLike.hide()
		}
	}

	static showAll() {
		PostLike.hiding = false
		for (const postLike of PostLike.hiddenPosts) {
			postLike.show()
		}
	}
}