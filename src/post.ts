class UidElementNotFoundError extends TypeError {}
const Post = {
	mutationHandler(processedElements: WeakSet<HTMLElement>, config: Config) {
		if (location.pathname !== '/read.php') {
			return
		}
		Post.forEach(Post.process, processedElements, config)
	},

	forEach(callback: (post: HTMLTableElement, config: Config) => void, processedPosts: WeakSet<HTMLTableElement>, config: Config) {
		const posts = document.querySelectorAll<HTMLTableElement>('#m_posts_c > .postbox')
		for (const post of posts) {
			if (!processedPosts.has(post)) {
				try {
					callback(post, config)
					processedPosts.add(post)
				} catch (err) {
					if (!(err instanceof UidElementNotFoundError)) {
						throw err
					}
				}
			}
		}
	},

	process(post: HTMLTableElement, config: Config) {
		const uidElement = post.querySelector<HTMLAnchorElement>('a[name=uid]')!
		if (!uidElement) {
			throw new UidElementNotFoundError()
		}
		const uid = parseInt(uidElement.innerText)
		if (config.userBlockList.has(uid)) {
			post.style.display = 'none'
			return
		}
		const postContent = post.querySelector<HTMLElement>('.postcontent')!
		const quote = postContent.querySelector<HTMLElement>('.quote')
		translateChildTextNodes(postContent, quote)
		const collapseButton = postContent.querySelector('button[name=collapseSwitchButton]')
		if (collapseButton) {
			collapseButton.addEventListener('click', () => {
				const collapseContent = postContent.querySelector<HTMLElement>('.collapse_content')
				if (collapseContent) {
					translateChildTextNodes(collapseContent)
				}
			}, { once: true })
		}
		Post.processQuote(quote, config)
		Post.addBlockButton(post, uidElement, uid, config)
		Post.resizeImages(post, config)
	},

	processQuote(quote: HTMLElement | null, config: Config) {
		if (!quote) {
			return
		}
		const qUser = quote.querySelector<HTMLAnchorElement>('a.b')
		if (qUser) {
			const match = qUser.href.match(/uid=(.+$)/)
			if (match) {
				const qUid = parseInt(match[1])
				if (config.userBlockList.has(qUid)) {
					quote.style.display = 'none'
					return
				}
				translateChildTextNodes(quote)
				const collapseButton = quote.querySelector('button[name=collapseSwitchButton]')
				if (collapseButton) {
					collapseButton.addEventListener('click', () => {
						const collapseContent = quote.querySelector('.collapse_content')
						if (collapseContent) {
							translateChildTextNodes(collapseContent)
						}
					}, { once: true })
				}
			}
		}
	},

	addBlockButton(post: HTMLTableElement, uidElement: HTMLAnchorElement, uid: number, config: Config) {
		const button = document.createElement('a')
		button.href = 'javascript:void(0)'
		button.innerText = '屏蔽'
		button.addEventListener('click', () => {
			post.style.display = 'none'
			config.userBlockList.add(uid)
			config.save()
		})
		uidElement.insertAdjacentElement('afterend', button)
	},

	resizeImages(post: HTMLTableElement, config: Config) {
		const images = post.querySelectorAll<HTMLImageElement>('img')
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
			if (!config.showOriginalImage && modified) {
				image.src = image.src + '.thumb.jpg'
				image.removeAttribute('style')
				image.style.maxWidth = '200px'
			}
			if (document.title.includes('安科')) {
				image.removeAttribute('style')
				image.addEventListener('load', () => {
					image.style.maxWidth = '300px'
				})
			}
		}
	}
} as const