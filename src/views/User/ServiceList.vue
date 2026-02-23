<template>
  <div class="service-list-container">
    <div class="page-header">
      <h2>门店服务项目</h2>
      <p class="sub-title" v-if="userVehicleType">
        系统识别车型：<span class="highlight">{{ userVehicleType }}</span>，已为您筛选适用项目
      </p>
      <p class="sub-title" v-else>
        透明价格，专业服务。多选项目立享阶梯折扣！
      </p>
    </div>

    <el-row :gutter="25" v-loading="loading">
      <el-col
        v-for="item in filteredServiceList"
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
                  <span>无预览图</span>
                </div>
              </template>
            </el-image>
            <div class="duration-tag">
              <el-icon><Timer /></el-icon> {{ item.duration }}分钟
            </div>
          </div>

          <div class="card-body">
            <div class="title-row">
              <h3 class="service-name">{{ item.name }}</h3>
              <el-tag size="small" :type="item.vehicleType === '通用' ? 'info' : 'success'">
                {{ item.vehicleType }}
              </el-tag>
            </div>

            <p class="service-desc">
              {{ item.description || '专业汽车技师为您服务。' }}
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

    <el-empty v-if="filteredServiceList.length === 0 && !loading" description="暂无匹配服务" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue' // 必须引入 computed
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Timer, Picture } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const serviceList = ref([])
const userVehicleType = ref('')

// --- 修正后的图片处理函数 ---
const getImageUrl = (url) => {
  if (!url) return ''
  // 如果数据库里存的是 http 开头的完整路径，直接返回
  if (url.startsWith('http')) return url
  // 否则拼接后端地址
  return `http://localhost:8080/service-images/${url}`
}

// --- 【核心修改】基于数据库字段 vehicle_type 进行过滤 ---
const filteredServiceList = computed(() => {
  const userType = (userVehicleType.value || '').trim()

  if (!userType) return serviceList.value

  return serviceList.value.filter(item => {
    // 关键点：数据库返回的字段映射到前端通常是驼峰命名的 vehicleType
    const itemType = (item.vehicleType || '').trim()
    return itemType === userType || itemType === '通用' || itemType === ''
  })
})

const fetchServices = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/service-item/list')
    if (res.success || res.code === 200) {
      serviceList.value = res.data
    }
  } catch (e) {
    ElMessage.error('获取服务列表失败')
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

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    userVehicleType.value = user.vehicleType || '' // 获取当前用户的“电车”身份
  }
  fetchServices()
})
</script>

<style scoped>
/* 保持原有布局并优化标题行 */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.service-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.service-list-container { padding: 30px; background-color: #f0f2f5; }
.page-header { margin-bottom: 35px; border-left: 5px solid #409eff; padding-left: 20px; }
.highlight { font-weight: bold; color: #409eff; }
.service-card { border-radius: 12px; transition: all 0.3s ease; border: none; }
.service-card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
.image-container { position: relative; height: 200px; overflow: hidden; }
.service-img { width: 100%; height: 100%; }
.card-body { padding: 20px; }
.card-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f0f0f0; padding-top: 15px; }
.price-info .value { font-size: 26px; font-weight: bold; color: #f56c6c; }
</style>
