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

function loadImages() {
	const images = document.querySelectorAll<HTMLImageElement>('.postcontent img')
	for (const image of images) {
		if (image.dataset.srcorg) {
			image.src = image.dataset.srcorg
		} else if (image.dataset.srclazy) {
			image.src = image.dataset.srclazy
		}
		delete image.dataset.srclazy
		delete image.dataset.srcorg
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
		const uid = parseInt(post.querySelector<HTMLAnchorElement>('a[name=uid]')!.innerText)
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
		if (quote) {
			const qUser = quote.querySelector<HTMLAnchorElement>('a.b')
			if (qUser) {
				const match = qUser.href.match(/uid=(.+$)/)
				if (match) {
					const qUid = parseInt(match[1])
					if (config.userBlockList.has(qUid)) {
						quote.style.display = 'none'
						continue
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
	}
	return true
}