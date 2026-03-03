<template>
  <div class="consumption-container">
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="配件名称">
          <el-input v-model="queryForm.partName" placeholder="输入配件名称" clearable />
        </el-form-item>
        <el-form-item label="关联订单号">
          <el-input v-model="queryForm.orderId" placeholder="输入订单ID" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="消耗单ID" width="100" />

        <el-table-column prop="partId" label="配件ID" width="100" />

        <el-table-column prop="partName" label="配件名称" />
        <el-table-column prop="quantity" label="消耗数量" width="100" />

        <el-table-column prop="appointmentId" label="关联订单" width="120" />

        <el-table-column prop="consumptionTime" label="消耗时间" width="180" />

        <el-table-column prop="workerName" label="经办人" width="120" />
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.pageNum"
          :page-size="queryForm.pageSize"
          layout="total, prev, pager, next"
          :total="total"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const queryForm = ref({
  partName: '',
  orderId: '',
  pageNum: 1,
  pageSize: 10
})

const fetchData = async () => {
  loading.value = true
  try {
    // 将 /list 改为 /page
    const res = await request.get('/api/part-consumption/page', { params: queryForm.value })
    if (res.success) {
      // 对应后端返回的 Map 结构: records 和 total
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取消耗记录失败', error)
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryForm.value = { partName: '', orderId: '', pageNum: 1, pageSize: 10 }
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.filter-card { margin-bottom: 20px; }
.table-card { min-height: 400px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
