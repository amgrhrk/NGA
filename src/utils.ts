function translateChildTextNodes(node: Node, exclude?: Node) {
	const stack = [node]
	while (stack.length > 0) {
		const top = stack.pop()!
		if (top === exclude) {
			continue
		}
		if (top.hasChildNodes()) {
			stack.push(...top.childNodes)
			continue
		}
		if (top.nodeType === Node.TEXT_NODE && top.textContent) {
			top.textContent = translate(top.textContent)
		}
	}
}

function addClickEventListener(element: Element, handler: () => void) {
	element.addEventListener('mousedown', () => {
		window.addEventListener('mouseup', (e) => {
			if (e.target === element) {
				handler.call(element)
			}
		}, { once: true })
	})
}
namespace addClickEventListener {
	export function toBreadcrumb(handler: () => void) {
		for (const link of document.querySelectorAll('.nav_root, .nav_link')) {
			addClickEventListener(link, handler)
		}
	}

	export function toPageNavigation(handler: () => void) {
		const pageButtons = [document.getElementById('pagebtop'), document.getElementById('pagebbtm')]
			.filter((nav): nav is HTMLElement => nav as unknown as boolean)
			.flatMap(nav => [...nav.querySelectorAll<HTMLAnchorElement>('a:not([name=topage])')])
		for (const button of pageButtons) {
			if (button.title.startsWith('加载')) {
				continue
			}
			button.style.boxShadow = 'inset 5em 1em gold'
			addClickEventListener(button, handler)
		}
	}

	export function toThreads(handler: () => void) {
		const threads = document.querySelectorAll('.topic')
		for (const thread of threads) {
			addClickEventListener(thread, handler)
		}
	}
}

function loadImages(config: Config, imageSet: Set<HTMLImageElement>) {
	const images = document.querySelectorAll<HTMLImageElement>('.postcontent img')
	for (const image of images) {
		imageSet.add(image)
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
	}
}

function processThreads(config: Config) {
	const threads = document.querySelectorAll<HTMLElement>('#topicrows > tbody')
	if (threads.length === 0) {
		return false
	}
	for (const thread of threads) {
		const url = thread.querySelector<HTMLAnchorElement>('a[class=author]')
		if (!url) {
			continue
		}
		const uid = parseInt(url.title.replace('用户ID ', ''))
		const sub = thread.querySelector<HTMLSpanElement>('span.titleadd2')
		if (config.userBlockList.has(uid) || (sub && config.subBlockList.has(sub.innerText))) {
			thread.style.display = 'none'
			continue
		}
		const title = thread.querySelector<HTMLElement>('.topic')
		if (title) {
			title.innerText = translate(title.innerText)
		}
		addBlockButton(thread, url, uid, config)
	}
	return true
}

function addBlockButton(thread: HTMLElement, url: HTMLAnchorElement, uid: number, config: Config) {
	const button = document.createElement('a')
	button.href = 'javascript:void(0)'
	button.innerText = '屏蔽'
	button.style.marginLeft = '8px'
	button.addEventListener('click', () => {
		thread.style.display = 'none'
		config.userBlockList.add(uid)
		config.save()
	})
	url.insertAdjacentElement('afterend', button)
}

function processPosts(config: Config) {
	const posts = document.querySelectorAll<HTMLTableElement>('table.forumbox.postbox')
	for (const post of posts) {
		const uidElement = post.querySelector<HTMLAnchorElement>('a[name=uid]')!
		const uid = parseInt(uidElement.innerText)
		if (config.userBlockList.has(uid)) {
			post.style.display = 'none'
			continue
		}
		const postContent = post.querySelector<HTMLElement>('.postcontent')!
		const quote = postContent.querySelector<HTMLElement>('.quote')
		translateChildTextNodes(postContent, quote!)
		const collapseButton = postContent.querySelector('button[name=collapseSwitchButton]')
		if (collapseButton) {
			collapseButton.addEventListener('click', () => {
				const collapseContent = postContent.querySelector<HTMLElement>('.collapse_content')
				if (collapseContent) {
					translateChildTextNodes(collapseContent)
				}
			}, { once: true })
		}
		processQuote(config, quote)
		addBlockButtonForPost(config, post, uidElement, uid)
	}
	return true
}

function processQuote(config: Config, quote: HTMLElement | null) {
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
}

function addBlockButtonForPost(config: Config, post: HTMLTableElement, uidElement: HTMLAnchorElement, uid: number) {
	const button = document.createElement('a')
	button.href = 'javascript:void(0)'
	button.innerText = '屏蔽'
	button.addEventListener('click', () => {
		post.style.display = 'none'
		config.userBlockList.add(uid)
		config.save()
	})
	uidElement.insertAdjacentElement('afterend', button)
}