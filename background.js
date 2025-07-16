// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('Cookie携带工具已安装')
    clearSharedCookies()
    chrome.storage.local.set({
        sharedSwitch: true, // 共享Cookie开关默认开启
        sharedDomainList: ['10.10.104.81', '10.10.104.60:90'], // 共享域名列表重置为空
        autoRefreshDomainList: ['localhost:8080'], // 自动刷新域名列表重置为空
    })
})

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        // 共享Cookie开关
        case 'sharedCookiesSwitch':
            sharedSwitch(request.shared).then((success) =>
                sendResponse({ success })
            )
        // 刷新共享Cookie
        case 'refreshSharedCookies':
            refreshShared().then((success) => sendResponse({ success }))
            return true
        // 添加规则
        case 'addRule':
            addRule(request.domain).then((success) => sendResponse({ success }))
            return true
        // 移除规则
        case 'removeRule':
            removeRule(request.domain).then((success) =>
                sendResponse({ success })
            )
            return true
        // 添加自动刷新信息
        case 'addAutoRefresh':
            addAutoRefresh(request.domain).then((success) =>
                sendResponse({ success })
            )
            return true
        // 移除自动刷新信息
        case 'removeAutoRefresh':
            removeAutoRefersh(request.domain).then((success) =>
                sendResponse({ success })
            )
            return true
        // 清除共享Cookie
        case 'clearSharedCookies':
            clearSharedCookies().then((success) => sendResponse({ success }))
            return true
        // 获取规则配置
        case 'getConfigInfo':
            getConfigInfo().then((configInfo) => sendResponse({ configInfo }))
            return true
        default:
            sendResponse({ error: '未知操作' })
    }
})

// 共享Cookie开关
async function sharedSwitch(switchFlag) {
    try {
        await chrome.storage.local.set({ sharedSwitch: switchFlag })
        if (switchFlag) {
            await refreshShared()
        } else {
            await clearSharedCookies()
        }
        return true
    } catch (error) {
        console.error('切换共享Cookie开关失败:', error)
        return false
    }
}

// 刷新共享Cookie
async function refreshShared() {
    try {
        const { sharedSwitch, sharedDomainList } =
            await chrome.storage.local.get(['sharedSwitch', 'sharedDomainList'])
        if (!sharedSwitch) return false
        if (!sharedDomainList || !sharedDomainList.length) return true
        const addRules = []
        const allRules =
            (await chrome.declarativeNetRequest.getDynamicRules()) || []
        for (const domain of sharedDomainList) {
            const cookies = await getCurrentTabCookies(domain.split(':')[0])
            if (!cookies) continue
            const rule = allRules.find((i) =>
                i.condition.regexFilter.includes(domain)
            )
            if (rule) {
                addRules.push(await getRule(domain, cookies, rule.id))
            } else {
                addRules.push(await getRule(domain, cookies))
            }
        }
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules,
            removeRuleIds: allRules.map((i) => i.id),
        })
        console.log('刷新共享Cookie:', addRules)
        return true
    } catch (error) {
        console.error('刷新共享Cookie失败:', error)
        return false
    }
}

// 增加规则
async function addRule(domain) {
    try {
        const { sharedSwitch, sharedDomainList } =
            await chrome.storage.local.get(['sharedSwitch', 'sharedDomainList'])
        if (sharedDomainList.includes(domain)) return true
        sharedDomainList.push(domain)
        await chrome.storage.local.set({ sharedDomainList })
        if (sharedSwitch) {
            await refreshShared()
        } else {
            await clearSharedCookies()
        }
        return true
    } catch (error) {
        console.error('添加规则失败:', error)
        return false
    }
}

// 移除规则
async function removeRule(domain) {
    try {
        const { sharedSwitch, sharedDomainList } =
            await chrome.storage.local.get(['sharedSwitch', 'sharedDomainList'])
        const index = sharedDomainList.indexOf(domain)
        if (index === -1) return true
        sharedDomainList.splice(index, 1)
        await chrome.storage.local.set({ sharedDomainList })
        if (sharedSwitch) {
            await removeSharedCookies(domain)
        } else {
            await clearSharedCookies()
        }
        return true
    } catch (error) {
        console.error('移除规则失败:', error)
        return false
    }
}

// 增加自动刷新
async function addAutoRefresh(domain) {
    try {
        const { autoRefreshDomainList } = await chrome.storage.local.get([
            'autoRefreshDomainList',
        ])
        if (autoRefreshDomainList.includes(domain)) return true
        autoRefreshDomainList.push(domain)
        await chrome.storage.local.set({ autoRefreshDomainList })
        return true
    } catch (error) {
        console.error('添加自动刷新失败:', error)
        return false
    }
}

// 移除自动刷新
async function removeAutoRefersh(domain) {
    try {
        const { autoRefreshDomainList } = await chrome.storage.local.get([
            'autoRefreshDomainList',
        ])
        const index = autoRefreshDomainList.indexOf(domain)
        if (index === -1) return true
        autoRefreshDomainList.splice(index, 1)
        await chrome.storage.local.set({ autoRefreshDomainList })
        return true
    } catch (error) {
        console.error('移除自动刷新失败:', error)
        return false
    }
}

// 获取规则配置信息
async function getConfigInfo() {
    const { sharedSwitch, sharedDomainList, autoRefreshDomainList } =
        await chrome.storage.local.get([
            'sharedSwitch',
            'sharedDomainList',
            'autoRefreshDomainList',
        ])
    return { sharedSwitch, sharedDomainList, autoRefreshDomainList }
}

// 清除共享Cookie
async function clearSharedCookies() {
    const rules = await chrome.declarativeNetRequest.getDynamicRules()
    if (rules && rules.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map((i) => i.id),
        })
    }
    await chrome.storage.local.set({
        sharedId: 0, // 共享ID重置为0
    })
    console.log('清除共享Cookie', rules)
}

// 移除共享Cookie
async function removeSharedCookies(domain) {
    try {
        const rules = await chrome.declarativeNetRequest.getDynamicRules()
        const removeRules = rules.filter((i) =>
            i.condition.regexFilter.includes(domain)
        )
        if (removeRules.length) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: removeRules.map((i) => i.id),
            })
        }
        console.log('清除共享Cookie:', removeRules)
    } catch (error) {
        console.error('清除共享Cookie失败:', error)
    }
}

// 获取当前页面的Domain
async function getCurrentTabDomain() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        })
        if (!tab.url) return null
        const match = tab.url.match(/^https?:\/\/([^/]+)/)
        return match && match[1]
    } catch (error) {
        console.error('获取当前标签页URL失败:', error)
        return null
    }
}

// 获取当前标签页的Cookie
async function getCurrentTabCookies(domain) {
    try {
        if (!domain) {
            domain = await getCurrentTabDomain()
            if (!domain) return []
        }
        const cookies = await chrome.cookies.getAll({})
        return cookies.filter((i) => i.domain === domain)
    } catch (error) {
        console.error('获取Cookie失败:', error)
        return null
    }
}

// 获取规则
async function getRule(domain, cookies, id) {
    if (!id) {
        const { sharedId } = await chrome.storage.local.get(['sharedId'])
        id = (sharedId || 1) + 1
        await chrome.storage.local.set({ sharedId: id })
    }
    return {
        id,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [
                {
                    header: 'Cookie',
                    operation: 'set',
                    value: cookies
                        .map((cookie) => `${cookie.name}=${cookie.value}`)
                        .join(';'),
                },
            ],
        },
        condition: {
            regexFilter: `http://${domain}/*`,
        },
    }
}

// Cookie变化时触发
chrome.cookies.onChanged.addListener(async (changeInfo) => {
    console.log('Cookie变化:', changeInfo)
    const { cookie } = changeInfo
    const { sharedDomainList } = await chrome.storage.local.get([
        'sharedDomainList',
    ])
    if (cookie && sharedDomainList.some((i) => i.includes(cookie.domain))) {
        const domain = await getCurrentTabDomain()
        if (domain.includes(cookie.domain)) {
            await removeSharedCookies(cookie.domain)
        } else {
            await refreshShared()
        }
    }
})

// chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
//     console.log('规则匹配:', info)
// })

// 页面加载时触发
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const { status } = changeInfo
    const url = changeInfo.url || tab.url
    if (status === 'loading' && url) {
        const match = url.match(/^https?:\/\/([^/]+)/)
        if (match && match[1]) {
            const { autoRefreshDomainList } = await chrome.storage.local.get([
                'autoRefreshDomainList',
            ])
            if (
                autoRefreshDomainList &&
                autoRefreshDomainList.includes(match[1])
            ) {
                await refreshShared()
                console.log('页面加载刷新Cookie:', tabId, changeInfo, tab)
            }
        }
    }
})

// 页面激活时触发
chrome.tabs.onActivated.addListener((activeInfo) => {
    const { tabId } = activeInfo
    chrome.tabs.get(tabId, async (tab) => {
        if (tab.url) {
            const match = tab.url.match(/^https?:\/\/([^/]+)/)
            if (match && match[1]) {
                const { autoRefreshDomainList, sharedDomainList } =
                    await chrome.storage.local.get([
                        'autoRefreshDomainList',
                        'sharedDomainList',
                    ])
                if (
                    autoRefreshDomainList &&
                    autoRefreshDomainList.includes(match[1])
                ) {
                    await refreshShared()
                    console.log('当前标签页刷新Cookie:', tab)
                }
            }
        }
    })
})
