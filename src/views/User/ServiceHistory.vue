<template>
  <div class="history-container">
    <el-card shadow="never" header="服务历史记录">
      <el-table :data="historyList" stripe style="width: 100%">
        <el-table-column prop="appointmentTime" label="预约时间" width="180" />
        <el-table-column prop="serviceType" label="服务项目" />
        <el-table-column prop="workerName" label="服务技师" />
        <el-table-column label="支付金额">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ scope.row.finalPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === '已完成' && !scope.row.rating"
              type="primary"
              size="small"
              @click="handleRate(scope.row)"
            >
              评价
            </el-button>
            <el-tag v-else-if="scope.row.rating" type="info" size="small">已评价</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="rateDialogVisible" title="提交服务评价" width="400px" destroy-on-close>
      <el-form :model="rateForm" label-position="top">
        <el-form-item label="服务评分">
          <el-rate v-model="rateForm.rating" show-score allow-half />
        </el-form-item>
        <el-form-item label="您的评价内容">
          <el-input
            v-model="rateForm.feedback"
            type="textarea"
            :rows="4"
            placeholder="请分享您的服务体验（洗得干净吗？速度快吗？）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRate">提交评价</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const historyList = ref([])
const user = JSON.parse(localStorage.getItem('user'))

// 评价相关响应式数据
const rateDialogVisible = ref(false)
const rateForm = ref({
  id: null,
  rating: 5,
  feedback: ''
})

// 获取历史数据
const fetchHistory = async () => {
  if (!user || !user.id) return
  const res = await axios.get(`http://localhost:8080/api/appointment/user/${user.id}`)
  if (res.data.success) {
    historyList.value = res.data.data
  }
}

// 打开评价弹窗
const handleRate = (row) => {
  rateForm.value.id = row.id
  rateForm.value.rating = 5 // 默认5星
  rateForm.value.feedback = ''
  rateDialogVisible.value = true
}

// 提交评价到后端
const submitRate = async () => {
  if (!rateForm.value.rating) {
    ElMessage.warning('请先给出评分')
    return
  }

  try {
    // 调用我们在上一步定义的后端 /api/appointment/rate 接口
    const res = await axios.post('http://localhost:8080/api/appointment/rate', rateForm.value)
    if (res.data.success) {
      ElMessage.success('评价成功，感谢您的反馈！')
      rateDialogVisible.value = false
      fetchHistory() // 刷新列表，评价按钮会变成“已评价”
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    ElMessage.error('网络错误，提交失败')
  }
}

onMounted(fetchHistory)
</script>

<style scoped>
.history-container {
  padding: 20px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
