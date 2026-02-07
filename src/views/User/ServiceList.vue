<template>
  <div class="service-list-container">
    <div class="page-header">
      <h2>门店服务项目</h2>
      <p class="sub-title">
        透明价格，专业服务。多选项目立享阶梯折扣：最高可享
        <span class="highlight">75折</span> 优惠！
      </p>
    </div>

    <el-row :gutter="25" v-loading="loading">
      <el-col
        v-for="item in serviceList"
        :key="item.id"
        :xs="24" :sm="12" :md="8" :lg="6"
        class="card-col"
      >
        <el-card class="service-card" :body-style="{ padding: '0px' }" shadow="hover">
          <div class="image-container">
            <el-image
              :src="getImageUrl(item.imageUrl)"
              fit="cover"
              class="service-img"
              lazy
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                  <span>图片加载失败</span>
                </div>
              </template>
            </el-image>
            <div class="duration-tag">
              <el-icon><Timer /></el-icon> {{ item.duration }}分钟
            </div>
          </div>

          <div class="card-body">
            <h3 class="service-name">{{ item.name }}</h3>
            <p class="service-desc">
              {{ item.description || '暂无详细描述，请咨询到店技师。' }}
            </p>

            <div class="card-footer">
              <div class="price-info">
                <span class="symbol">¥</span>
                <span class="value">{{ item.price }}</span>
              </div>
              <el-button
                type="primary"
                round
                @click="goToAppointment(item.name)"
              >
                立即预约
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Timer, Picture } from '@element-plus/icons-vue'

// --- 状态与路由定义 ---
const router = useRouter()
const loading = ref(false)
const serviceList = ref([])

// --- 辅助工具函数 ---
const getImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/400x250?text=No+Image'
  if (url.startsWith('http')) return url
  // 根据项目实际路径解析本地资源
  return new URL(`../../assets/ServiceItem_pic/${url}`, import.meta.url).href
}

// --- 业务逻辑函数 ---
const fetchServices = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/service-item/list')
    if (res.data.success || res.data.code === 200) {
      serviceList.value = res.data.data
    }
  } catch (e) {
    ElMessage.error('获取服务列表失败，请检查网络')
  } finally {
    loading.value = false
  }
}

const goToAppointment = (serviceName) => {
  router.push({
    path: '/user/appointments',
    query: { selectedService: serviceName }
  })
}

// --- 生命周期钩子 ---
onMounted(() => {
  fetchServices()
})
</script>

<style scoped>
/* 容器布局 */
.service-list-container {
  min-height: 100vh;
  padding: 30px;
  background-color: #f0f2f5;
}

/* 页头样式 */
.page-header {
  margin-bottom: 35px;
  padding-left: 20px;
  border-left: 5px solid #409eff;
}
.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}
.sub-title {
  font-size: 14px;
  color: #606266;
}
.highlight {
  font-weight: bold;
  color: #f56c6c;
}

/* 卡片整体与间距 */
.card-col {
  margin-bottom: 30px;
}
.service-card {
  border: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}
.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* 图片区域 */
.image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #e5eaf3;
}
.service-img {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease;
}
.service-card:hover .service-img {
  transform: scale(1.1);
}
.image-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #909399;
}

/* 悬浮时长标签 */
.duration-tag {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  font-size: 12px;
  color: white;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

/* 内容区域 */
.card-body {
  padding: 20px;
}
.service-name {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}
.service-desc {
  height: 42px;
  margin-bottom: 20px;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

/* 卡片页脚与价格 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}
.price-info {
  color: #f56c6c;
}
.price-info .symbol {
  font-size: 14px;
}
.price-info .value {
  font-size: 26px;
  font-weight: bold;
}
</style>
