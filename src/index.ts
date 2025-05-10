function inject(processedElements: WeakSet<HTMLElement>, config: Config) {
	const popup = document.querySelector<HTMLDivElement>('.commonwindow')
	if (popup && popup.innerText === '\u200b\n访客不能直接访问\n\n你可能需要 [登录] 后访问...\n\n[后退]') {
		location.reload()
	// } else if (document.body.childNodes[0].textContent === '(ERROR:') {
	// 	const redirectLink = document.querySelector('a')
	// 	if (redirectLink && redirectLink.innerText === '如不能自动跳转 可点此链接') {
	// 		// redirectLink.click()
	// 	}
	} else if (location.pathname === '/thread.php') {
		Thread.forEach(thread => thread.process(config), processedElements, config)
	} else if (location.pathname === '/read.php') {
		Post.processTitleAndNav(processedElements, config)
		Post.forEach(post => post.process(config), processedElements, config)
	}
}

(async function main() {
	await waitForBody()
	const config = new Config()
	const popup = new Popup(config)
	config.onSave = () => popup.reset()
	const menuItems = [
		new MenuItem('NGA-settings-item', '设置 - 扩展设置', '扩展设置', () => {
			popup.show()
		}),
		new MenuItem('NGA-settings-item-toggle', '设置 - 切换隐藏帖子', PostLike.hiding ? '切换隐藏帖子（隐藏中）' : '切换隐藏帖子（显示中）', e => {
			const self = e.target as HTMLAnchorElement
			if (PostLike.hiding) {
				self.innerText = '切换隐藏帖子（显示中）'
				PostLike.showAll()
			} else {
				self.innerText = '切换隐藏帖子（隐藏中）'
				PostLike.hideAll()
			}
		}),
	] as const
	(async function insertMenuItems() {
		try {
			await waitForSelector('#mainmenu .right > .td > a')
			menuItems.forEach(item => item.init())
		} catch (err) {
			log(err)
		}
	})()
	const processedElements = new WeakSet<HTMLElement>()
	inject(processedElements, config)
	const observer = new MutationObserver(() => {
		inject(processedElements, config)
	})
	observer.observe(document.body, { childList: true, subtree: true })
})()