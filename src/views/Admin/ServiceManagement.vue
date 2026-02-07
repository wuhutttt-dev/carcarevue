<template>
  <el-card class="service-card" shadow="never">
    <template #header>
      <div class="header-box">
        <div class="title-area">
          <el-icon><Tools /></el-icon>
          <span class="title">服务项目与价格维护</span>
        </div>
        <el-button type="primary" icon="Refresh" @click="fetchServices" :loading="loading">刷新数据</el-button>
      </div>
    </template>

    <el-table :data="serviceList" border stripe v-loading="loading">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="服务名称" width="150" />
      <el-table-column prop="description" label="项目内容描述" min-width="200" />

      <el-table-column prop="duration" label="预计耗时" width="120" align="center">
        <template #default="scope">
          <el-tag type="info" effect="plain">{{ scope.row.duration || 0 }} 分钟</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="标准价格" width="120">
        <template #default="scope">
          <span class="price-tag">¥ {{ scope.row.price }}</span>
        </template>
      </el-table-column>

      <el-table-column label="管理操作" width="120" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">修改信息</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="编辑服务项目" width="450px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editForm.name" placeholder="请输入服务名称" />
        </el-form-item>

        <el-form-item label="服务时长">
          <el-input-number
            v-model="editForm.duration"
            :min="1"
            :step="15"
            controls-position="right"
            style="width: 100%"
          />
          <div class="form-tip">单位：分钟</div>
        </el-form-item>

        <el-form-item label="服务单价">
          <el-input-number
            v-model="editForm.price"
            :precision="2"
            :step="10"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="描述详情">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入服务内容描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate" :loading="submitting">确认保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Tools, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const serviceList = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)

// 编辑表单数据：确保包含 duration 字段
const editForm = ref({
  id: null,
  name: '',
  price: 0,
  description: '',
  duration: 0
})

// 1. 加载所有服务
const fetchServices = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/service-item/list')
    if (res.data.success) {
      serviceList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取服务列表失败，请检查网络')
  } finally {
    loading.value = false
  }
}

// 2. 弹出编辑窗口
const handleEdit = (row) => {
  // 浅拷贝数据到表单
  editForm.value = { ...row }
  dialogVisible.value = true
}

// 3. 提交更新到后端接口
const submitUpdate = async () => {
  submitting.value = true
  try {
    const res = await axios.post('http://localhost:8080/api/service-item/update', editForm.value)
    if (res.data.success) {
      ElMessage.success('服务项更新成功')
      dialogVisible.value = false
      fetchServices() // 成功后刷新列表
    } else {
      ElMessage.error(res.data.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error('服务器连接失败，请检查后端')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchServices)
</script>

<style scoped>
.header-box { display: flex; justify-content: space-between; align-items: center; }
.title-area { display: flex; align-items: center; gap: 8px; }
.title { font-weight: bold; font-size: 16px; }
.price-tag { color: #f56c6c; font-weight: bold; font-size: 16px; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
