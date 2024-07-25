function inject(processedElements: WeakSet<HTMLElement>, config: Config) {
	const popup = document.querySelector<HTMLDivElement>('.commonwindow')
	if (popup && popup.innerText === '\u200b\n访客不能直接访问\n\n你可能需要 [登录] 后访问...\n\n[后退]') {
		location.reload()
	} else if (document.body?.childNodes[0].textContent === '(ERROR:') {
		const redirectLink = document.querySelector('a')
		if (redirectLink && redirectLink.innerText === '如不能自动跳转 可点此链接') {
			// redirectLink.click()
		}
	} else if (location.pathname === '/thread.php') {
		Thread.forEach(thread => thread.process(config), processedElements, config)
	} else if (location.pathname === '/read.php') {
		Post.processTitleAndNav(processedElements, config)
		Post.forEach(post => post.process(config), processedElements, config)
	}
}

(async function main() {
	const config = new Config()
	const popup = new Popup(config)
	config.onSave = () => popup.reset()
	const menuItems = [
		new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
			popup.show()
		}),
		new MenuItem('NGA-settings-item-toggle', '设置 - 切换隐藏帖子', '切换隐藏帖子（隐藏中）', (() => {
			let hiding = true
			return (e) => {
				const self = e.target as HTMLAnchorElement
				if (hiding) {
					self.innerText = '切换隐藏帖子（显示中）'
					PostLike.hiddenPosts.forEach(post => post.show())
				} else {
					self.innerText = '切换隐藏帖子（隐藏中）'
					PostLike.hiddenPosts.forEach(post => post.hide())
				}
				hiding = !hiding
			}
		})()),
	] as const
	(async function insertMenuItems() {
		await waitForSelector('#mainmenu .right > .td > a')
		menuItems.forEach(item => item.init())
	})()
	const processedElements = new WeakSet<HTMLElement>()
	inject(processedElements, config)
	const observer = new MutationObserver(() => {
		inject(processedElements, config)
	})
	observer.observe(document, { childList: true, subtree: true })
})()