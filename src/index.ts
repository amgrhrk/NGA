function inject(processedElements: WeakSet<HTMLElement>, config: Config) {
	if (location.pathname === '/thread.php') {
		Thread.forEach(thread => thread.process(config), processedElements, config)
	} else if (location.pathname === '/read.php') {
		Post.forEach(post => post.process(config), processedElements, config)
	}
	const observer = new MutationObserver(() => {
		if (location.pathname === '/thread.php') {
			Thread.forEach(thread => thread.process(config), processedElements, config)
		} else if (location.pathname === '/read.php') {
			Post.forEach(post => post.process(config), processedElements, config)
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
}

(async function main() {
	const config = new Config()
	const popup = new Popup(config)
	config.onSave = () => popup.reset()
	const menuItems = [
		new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
			popup.show()
		})
	] as const
	(async function insertMenuItems() {
		await waitForElement('pagebtop')
		menuItems.forEach(item => item.init())
	})()
	const processedElements = new WeakSet<HTMLElement>()
	inject(processedElements, config)
})()