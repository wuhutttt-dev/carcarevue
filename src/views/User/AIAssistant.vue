<template>
  <div class="ai-assistant-container">
    <el-card header="🤖 AI 养车顾问" shadow="never">
      <div class="chat-box">
        <!-- 快速提问标签 -->
        <div class="prompt-section" v-if="messages.length === 1">
          <p class="prompt-title">💡 你可以这样问我：</p>
          <div class="prompt-tags">
            <el-tag
              v-for="prompt in quickPrompts"
              :key="prompt"
              class="prompt-tag"
              effect="plain"
              type="info"
              @click="handleQuickPrompt(prompt)"
            >
              {{ prompt }}
            </el-tag>
          </div>
        </div>

        <!-- 消息列表 -->
        <BubbleList
          :list="messages"
          :autoScroll="true"
          style="flex: 1;"
        />

        <!-- 手写输入区，替代 Sender -->
        <div class="input-area">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="询问保养建议，例如：5万公里该做什么保养？"
            @keydown.enter.exact.prevent="handleSendText"
          />
          <el-button
            type="primary"
            :disabled="!inputText.trim()"
            @click="handleSendText"
            style="margin-top: 10px; width: 100%;"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { BubbleList } from 'vue-element-plus-x'  // 仅导入 BubbleList
import request from '@/utils/request'

// 快速提问推荐
const quickPrompts = ref([
  '3万公里需要做什么保养？',
  '全合成机油和半合成机油怎么选？',
  '刹车片多久换一次？',
  '发动机故障灯亮了还能开吗？'
])

// 从 localStorage 获取车辆信息
const carInfo = ref(null)
onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.carModel) {
    carInfo.value = user
  }
})

// 消息列表
const messages = ref([])
if (carInfo.value) {
  messages.value.push({
    content: `你好！我看到你的座驾是 **${carInfo.value.carModel}**，有什么可以帮你的吗？`,
    role: 'ai'
  })
} else {
  messages.value.push({
    content: '你好！我是你的专属养车顾问，请问你的车型是什么？',
    role: 'ai'
  })
}

// 输入框内容
const inputText = ref('')

// 发送消息
const sendMessage = async (content) => {
  if (!content.trim()) return
  messages.value.push({ content, role: 'user' })
  inputText.value = ''

  const params = {
    message: content,
    carModel: carInfo.value?.carModel || '',
    mileage: carInfo.value?.mileage || ''
  }

  try {
    const res = await request.post('/api/ai/chat', params, { timeout: 60000 })
    if (res.success) {
      messages.value.push({ content: res.data, role: 'ai' })
    } else {
      messages.value.push({ content: '抱歉，AI 服务暂时不可用，请稍后再试。', role: 'ai' })
    }
  } catch (error) {
    messages.value.push({ content: '网络异常，请稍后再试。', role: 'ai' })
  }
}

// 点击发送按钮或按回车触发
const handleSendText = () => {
  sendMessage(inputText.value)
}

// 点击快速提问
const handleQuickPrompt = (prompt) => {
  sendMessage(prompt)
}
</script>

<style scoped>
.ai-assistant-container {
  padding: 0;
  max-width: 1000px;
  margin: 0 auto;
}

.chat-box {
  display: flex;
  flex-direction: column;
  height: 65vh;
  min-height: 500px;
}

.prompt-section {
  padding: 16px 0;
}

.prompt-title {
  color: #909399;
  font-size: 13px;
  margin-bottom: 12px;
}

.prompt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-tag {
  cursor: pointer;
}

.prompt-tag:hover {
  color: #409eff;
  border-color: #409eff;
}

.input-area {
  margin-top: 12px;
  padding: 10px 0 0;
  border-top: 1px solid #eee;
}
</style>
