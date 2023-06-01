const config = new Config()

const injectScript = (() => {
	let prevNav: HTMLElement | null = null
	const popup = new Popup(config)
	const menuItems = [
		new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
			popup.show()
		})
	] as const
	const images = new Set<HTMLImageElement>()
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			const image = mutation.target as HTMLImageElement
			if (!images.has(image) || mutation.attributeName !== 'style') {
				return
			}
			image.style.maxWidth = '200px'
		}
	})
	return () => {
		if (prevNav === document.getElementById('pagebtop')) {
			setTimeout(injectScript, 0)
			return
		}
		prevNav = document.getElementById('pagebtop')
		menuItems.forEach(item => item.init())
		addClickEventListener.toBreadcrumb(injectScript)
		addClickEventListener.toPageNavigation(injectScript)
		addClickEventListener.toThreads(injectScript)
		if (!processThreads(config)) {
			loadImages(config, images)
			processPosts(config)
		}
		if (!config.showOriginalImage) {
			observer.observe(document.body, { attributes: true, subtree: true, attributeOldValue: true })
		}
	}
})()

injectScript()