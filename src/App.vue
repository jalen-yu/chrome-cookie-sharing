<script setup lang="ts">
import { NSwitch, NInput, NButton, NDivider } from 'naive-ui'
import { ref, watch } from 'vue'

const sharedSwitch = ref(false)
const changeSharedSwitch = (val) => {
    if (chrome && chrome.runtime) {
        console.log(val)
        chrome.runtime.sendMessage(
            {
                action: 'sharedCookiesSwitch',
                shared: val,
            },
            () => {
                getConfigInfo()
            }
        )
    }
}

const sharedDomainList = ref([])
const sharedDomain = ref('')
const addSharedDomain = () => {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage(
            {
                action: 'addRule',
                domain: sharedDomain.value,
            },
            () => {
                sharedDomain.value = ''
                getConfigInfo()
            }
        )
    }
}
const removeSharedDomain = (item) => {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage(
            {
                action: 'removeRule',
                domain: item,
            },
            () => {
                getConfigInfo()
            }
        )
    }
}
const autoRefreshDomainList = ref([])
const autoRefreshDomain = ref('')
const addAutoRefreshDomain = () => {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage(
            {
                action: 'addAutoRefresh',
                domain: autoRefreshDomain.value,
            },
            () => {
                autoRefreshDomain.value = ''
                getConfigInfo()
            }
        )
    }
}
const removeAutoRefreshDomain = (item) => {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage(
            {
                action: 'removeAutoRefresh',
                domain: item,
            },
            () => {
                getConfigInfo()
            }
        )
    }
}

const refreshCookies = () => {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage({
            action: 'refreshSharedCookies',
        })
    }
}

const clearCookies = () => {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage({
            action: 'clearSharedCookies',
        })
    }
}

const getConfigInfo = () => {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage(
            {
                action: 'getConfigInfo',
            },
            ({ configInfo }) => {
                console.log(configInfo)
                const {
                    sharedSwitch: isSwitch,
                    sharedDomainList: sharedList,
                    autoRefreshDomainList: refershList,
                } = configInfo || {}
                sharedSwitch.value = isSwitch || false
                sharedDomainList.value = sharedList || []
                autoRefreshDomainList.value = refershList || []
            }
        )
    }
}
getConfigInfo()
</script>
<template>
    <div class="main_container">
        <div class="title_contaienr flex-between">
            <span class="title">是否开启</span>
            <n-switch
                v-model:value="sharedSwitch"
                @update:value="changeSharedSwitch"
            />
        </div>
        <n-divider />
        <div>
            <span class="title">共享域名</span>
            <div class="item_container">
                <div
                    class="flex-between mt4"
                    v-for="(item, index) in sharedDomainList"
                    :key="index"
                >
                    <span>{{ item }}</span>
                    <n-button text @click="removeSharedDomain(item)">
                        删除
                    </n-button>
                </div>
            </div>
            <div class="flex-between mt10">
                <n-input v-model:value="sharedDomain" />
                <n-button class="ml10" type="primary" @click="addSharedDomain">
                    增加
                </n-button>
            </div>
        </div>
        <n-divider />
        <div>
            <span class="title">自动刷新域名</span>
            <div class="item_container">
                <div
                    class="flex-between mt4"
                    v-for="(item, index) in autoRefreshDomainList"
                    :key="index"
                >
                    <span>{{ item }}</span>
                    <n-button text @click="removeAutoRefreshDomain(item)">
                        删除
                    </n-button>
                </div>
            </div>
            <div class="flex-between mt10">
                <n-input v-model:value="autoRefreshDomain" />
                <n-button
                    class="ml10"
                    type="primary"
                    @click="addAutoRefreshDomain"
                >
                    增加
                </n-button>
            </div>
        </div>
        <n-divider />
        <div class="flex-between">
            <n-button type="primary" @click="refreshCookies">
                刷新Cookies
            </n-button>
            <n-button type="primary" @click="clearCookies">
                清除Cookies
            </n-button>
        </div>
    </div>
</template>

<style scoped>
.n-divider {
    margin-top: 10px;
    margin-bottom: 10px;
}
.item_container {
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hide;
}
.main_container {
    width: 300px;
    padding: 10px;
}
.mt4 {
    margin-top: 4px;
}
.title {
    color: #19d132;
    font-weight: bold;
}
.mt10 {
    margin-top: 10px;
}
.ml10 {
    margin-left: 10px;
}
.flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
