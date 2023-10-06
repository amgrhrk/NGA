const Thread = {
	mutationHandler(processedElements: WeakSet<HTMLElement>, config: Config) {
		if (location.pathname !== '/thread.php') {
			return
		}
		Thread.forEach(Thread.process, processedElements, config)
	},

	forEach(callback: (thread: HTMLTableSectionElement, config: Config) => void, processedThreads: WeakSet<HTMLTableSectionElement>, config: Config) {
		const threads = document.querySelectorAll<HTMLTableSectionElement>('#topicrows > tbody')
		for (const thread of threads) {
			if (!processedThreads.has(thread)) {
				callback(thread, config)
				processedThreads.add(thread)
			}
		}
	},

	process(thread: HTMLTableSectionElement, config: Config) {
		const url = thread.querySelector<HTMLAnchorElement>('a[class=author]')
		if (!url) {
			return
		}
		const uid = parseInt(url.title.replace('用户ID ', ''))
		const sub = thread.querySelector<HTMLSpanElement>('span.titleadd2')
		if (config.userBlockList.has(uid) || (sub && config.subBlockList.has(sub.innerText))) {
			thread.style.display = 'none'
			return
		}
		const title = thread.querySelector<HTMLElement>('.topic')
		if (title) {
			title.innerText = translate(title.innerText)
		}
		Thread.addBlockButton(thread, url, uid, config)
	},

	addBlockButton(thread: HTMLTableSectionElement, url: HTMLAnchorElement, uid: number, config: Config) {
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
} as const