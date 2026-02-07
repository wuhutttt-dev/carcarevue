<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="8">
        <el-card shadow="hover" class="card-gradient blue">
          <div class="label">累计营业额</div>
          <div class="value">¥ {{ stats.totalRevenue || 0 }}</div>
          <el-icon class="card-icon"><Money /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="card-gradient green">
          <div class="label">总订单量</div>
          <div class="value">{{ stats.totalOrders || 0 }} 单</div>
          <el-icon class="card-icon"><Document /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="card-gradient orange">
          <div class="label">活跃客户数</div>
          <div class="value">{{ userCount }} 位</div>
          <el-icon class="card-icon"><User /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card header="订单状态分布图" shadow="never">
          <div ref="pieChartRef" style="height: 400px; width: 100%;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card header="系统公告" shadow="never">
          <el-timeline>
            <el-timeline-item timestamp="2026-02-04" type="primary">仪表盘模块上线</el-timeline-item>
            <el-timeline-item timestamp="2026-02-01">系统数据初始化完成</el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Money, Document, User } from '@element-plus/icons-vue'
import axios from 'axios'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const stats = ref({ totalRevenue: 0, totalOrders: 0, statusCounts: {} })
const userCount = ref(0)
const pieChartRef = ref(null)

// 获取数据
const fetchData = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/appointment/statistics')
    if (res.data.success) {
      stats.value = res.data.data
      renderChart(res.data.data.statusCounts)
    }
    const userRes = await axios.get('http://localhost:8080/api/customer/listAll')
    if (userRes.data.success) userCount.value = userRes.data.data.length
  } catch (error) {
    ElMessage.error('获取统计数据失败，请确保后端已重启')
  }
}

// 渲染图表
const renderChart = (statusData) => {
  if (!pieChartRef.value) return
  const myChart = echarts.init(pieChartRef.value)
  const data = Object.keys(statusData).map(key => ({ name: key, value: statusData[key] }))

  myChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      data: data
    }]
  })
}

onMounted(fetchData)
</script>

<style scoped>
.dashboard-container { padding: 20px; }
.stat-row { margin-bottom: 25px; }
.card-gradient { height: 120px; border: none; color: white; position: relative; }
.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.orange { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.label { font-size: 14px; opacity: 0.9; }
.value { font-size: 28px; font-weight: bold; margin-top: 10px; }
.card-icon { position: absolute; right: 20px; bottom: 20px; font-size: 50px; opacity: 0.3; }
</style>
