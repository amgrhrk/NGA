const config = new Config()

const injectScript = (() => {
	let prevNav: HTMLElement | null = null
	const popup = new Popup(config)
	const menuItems = [
		new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
			popup.show()
		})
	] as const
	return () => {
		if (prevNav === document.getElementById('pagebtop')) {
			setTimeout(injectScript, 0)
			return
		}
		prevNav = document.getElementById('pagebtop')
		menuItems.forEach(item => item.append())
		addClickEventListener.toBreadcrumb(injectScript)
		addClickEventListener.toPageNavigation(injectScript)
		addClickEventListener.toThreads(injectScript)
		if (!processThreads(config)) {
			loadImages()
			processPosts(config)
		}
	}
})()

injectScript()