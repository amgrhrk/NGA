function translateChildTextNodes(node: Node, exclude?: Node | null) {
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, node => node === exclude ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
	while (walker.nextNode()) {
		walker.currentNode.textContent = translate(walker.currentNode.textContent!)
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

async function waitForElement(id: string) {
	const element = document.getElementById(id)
	if (element) {
		return element
	}
	return new Promise<HTMLElement>((resolve, reject) => {
		const observer = new MutationObserver(mutations => {
			const element = document.getElementById(id)
			if (element) {
				resolve(element)
				observer.disconnect()
			}
		})
		observer.observe(document.body, { childList: true, subtree: true })
	})
}

async function waitForSelector<K extends keyof HTMLElementTagNameMap>(selectors: K, parent?: HTMLElement): Promise<HTMLElementTagNameMap[K]>
async function waitForSelector<E extends HTMLElement = HTMLElement>(selectors: string, parent?: HTMLElement): Promise<HTMLElement>
async function waitForSelector(selectors: string, parent?: HTMLElement) {
	const element = parent ? parent.querySelector(selectors) : document.querySelector(selectors)
	if (element) {
		return element as HTMLElement
	}
	return new Promise<HTMLElement>((resolve, reject) => {
		const observer = new MutationObserver(mutations => {
			const element = parent ? parent.querySelector(selectors) : document.querySelector(selectors)
			if (element) {
				resolve(element as HTMLElement)
				observer.disconnect()
			}
		})
		observer.observe(parent ? parent : document.body, { childList: true, subtree: true })
	})
}