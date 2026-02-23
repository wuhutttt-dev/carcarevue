<template>
  <div class="worker-container">
    <div class="header-banner">
      <div class="worker-profile">
        <el-avatar :size="50" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
        <div class="worker-info">
          <div class="name-row">
            <span class="real-name">{{ user.realName || '未设置姓名' }}</span>
            <el-select
              v-model="user.workStatus"
              placeholder="工作状态"
              size="small"
              style="width: 100px; margin-left: 10px;"
              @change="handleStatusChange"
            >
              <el-option label="空闲" value="空闲" />
              <el-option label="工作中" value="工作中" />
              <el-option label="请假" value="请假" />
            </el-select>
            <el-tag size="small" type="info" effect="plain">{{ user.jobTitle || '普通技师' }}</el-tag>
            <el-tooltip content="修改个人资料" placement="right">
              <el-icon class="edit-btn" @click="openEditDialog"><Edit /></el-icon>
            </el-tooltip>
          </div>
          <span class="username">账号: {{ user.username }}</span>
        </div>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card pending">
          <template #header>任务大厅 (待接单)</template>
          <div class="num">{{ pendingOrders.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card processing">
          <template #header>进行中 (我的任务)</template>
          <div class="num">{{ processingOrders.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card finished">
          <template #header>今日已完成</template>
          <div class="num">{{ finishedOrders.length }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs type="border-card" class="task-tabs">
      <el-tab-pane label="任务大厅 (可抢单)">
        <el-table :data="pendingOrders" stripe style="width: 100%">
          <el-table-column prop="id" label="单号" width="80" />
          <el-table-column prop="customerName" label="客户名称" width="120" />
          <el-table-column prop="customerPhone" label="联系电话" width="130" />
          <el-table-column prop="serviceType" label="预约项目" />
          <el-table-column prop="appointmentTime" label="预约时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleUpdate(scope.row.id, '服务中')">接单抢单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="我的任务">
        <el-table :data="processingOrders" style="width: 100%">
          <el-table-column prop="id" label="单号" width="80" />
          <el-table-column prop="customerName" label="客户名称" width="120" />
          <el-table-column prop="customerPhone" label="客户电话" width="130" />
          <el-table-column prop="serviceType" label="服务内容" />
          <el-table-column prop="appointmentTime" label="开始时间" width="180" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button
                type="warning"
                size="small"
                @click="openFaultDialog(scope.row)"
              >故障上报</el-button>

              <el-button
                type="success"
                size="small"
                @click="handleUpdate(scope.row.id, '已完成')"
              >完成任务</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="完工记录">
        <el-table :data="finishedOrders" style="width: 100%">
          <el-table-column prop="id" label="单号" width="80" />
          <el-table-column prop="customerName" label="客户名称" width="120" />
          <el-table-column prop="serviceType" label="服务项目" />
          <el-table-column prop="completionTime" label="完工时间" width="180" />
          <el-table-column label="状态" width="100">
            <template #default>
              <el-tag type="success">已完成</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="账号设置">
        <div class="settings-container">
          <el-result icon="info" title="个人账号管理">
            <template #sub-title>
              您当前以 <strong>{{ user.realName }}</strong> 的身份登录
            </template>
            <template #extra>
              <el-button type="danger" size="large" @click="handleLogout">
                <el-icon style="margin-right: 8px"><SwitchButton /></el-icon>退出登录
              </el-button>
            </template>
          </el-result>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="editVisible" title="修改个人资料" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="工龄(年)">
          <el-input-number v-model="editForm.yearsExperience" :min="0" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="editForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="faultVisible" title="反馈车辆故障隐患" width="600px">
      <el-form :model="faultForm" label-width="100px">
        <el-form-item label="建议维修">
          <el-select v-model="faultForm.itemId" placeholder="请选择建议修复的项目" style="width: 100%" @change="handleItemChange">
            <el-option
              v-for="item in repairItems"
              :key="item.id"
              :label="item.name + ' (￥' + item.price + ')'"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-radio-group v-model="faultForm.urgencyLevel">
            <el-radio :value="1">建议下次处理</el-radio>
            <el-radio :value="2">极度危险(需立即维修)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发现问题">
          <el-input v-model="faultForm.workerRemark" type="textarea" :rows="3" placeholder="请详细描述发现的故障，例如：刹车片磨损严重、机油渗漏等" />
        </el-form-item>

        <el-form-item label="现场照片">
          <el-upload
            v-model:file-list="fileList"
            action="http://localhost:8080/api/attachment/upload"
            :data="{ type: 'fault' }"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :on-error="handleUploadError"
            name="file"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">请上传故障部位照片（可选）</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="faultVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFault" :loading="submitting">确认上报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, SwitchButton, Plus } from '@element-plus/icons-vue'

const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))
const allOrders = ref([])
const editVisible = ref(false)
const editForm = ref({})

const faultVisible = ref(false)
const submitting = ref(false)
const repairItems = ref([])
const currentOrder = ref(null)

const fileList = ref([])
const uploadedAttachmentIds = ref([])

const faultForm = ref({
  itemId: null,
  itemName: '',
  workerRemark: '',
  urgencyLevel: 1
})

const loadData = async () => {
  try {
    const res = await request.get('/api/appointment/listAll')

    // 拦截器已经处理了 response.data，所以这里直接判断 res.success
    if (res.success) {
      allOrders.value = res.data
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) { // catch 块保留
    console.error(error)
    ElMessage.error('网络异常，无法获取预约数据')
  }
}

const currentWorkerIdentifier = computed(() => user.value.realName || user.value.username)
const pendingOrders = computed(() =>
  allOrders.value.filter(o => o.status === '已确认' && (!o.workerId || o.workerId === 0))
)
const processingOrders = computed(() => allOrders.value.filter(o => o.status === '服务中' && o.workerName === currentWorkerIdentifier.value))
const finishedOrders = computed(() => allOrders.value.filter(o => o.status === '已完成' && o.workerName === currentWorkerIdentifier.value))

const handleUpdate = async (id, status) => {
  const res = await request.post('/api/appointment/updateStatus', {
    id: id, status: status, workerName: currentWorkerIdentifier.value, workerId: user.value.id
  })
  if (res.success) { ElMessage.success('操作成功'); loadData(); }
}

const openFaultDialog = async (row) => {
  currentOrder.value = row
  faultForm.value = { itemId: null, itemName: '', workerRemark: '', urgencyLevel: 1 }
  fileList.value = []
  uploadedAttachmentIds.value = []

  try {
    const res = await request.get('/api/service-item/list')
    if (res.success) {
      repairItems.value = res.filter(item => item.category === 'repair')
    }
    faultVisible.value = true
  } catch (err) {
    ElMessage.error('加载项目列表失败')
  }
}

const handleUploadSuccess = (response, uploadFile) => {
  if (response.success) {
    const attachmentId = response.data.id
    uploadedAttachmentIds.value.push(attachmentId)
  } else {
    ElMessage.error('图片上传失败: ' + response.message)
    const index = fileList.value.indexOf(uploadFile)
    if (index !== -1) fileList.value.splice(index, 1)
  }
}

const handleUploadError = () => {
  ElMessage.error('网络错误，图片上传失败')
}

const handleRemove = (uploadFile) => {
  if (uploadFile.response && uploadFile.response.data) {
    const idToRemove = uploadFile.response.data.id
    uploadedAttachmentIds.value = uploadedAttachmentIds.value.filter(id => id !== idToRemove)
  }
}

const handleItemChange = (val) => {
  const selected = repairItems.value.find(i => i.id === val)
  if (selected) faultForm.value.itemName = selected.name
}

// 核心修改：修复 Missing catch or finally 语法错误并增强反馈
const submitFault = async () => {
  if (!faultForm.value.itemId) return ElMessage.warning('请选择建议的维修项目')
  if (!faultForm.value.workerRemark) return ElMessage.warning('请输入发现的问题描述')

  submitting.value = true
  try {
    const postData = {
      appointmentId: currentOrder.value.id,
      workerId: user.value.id,
      workerName: currentWorkerIdentifier.value,
      customerId: currentOrder.value.customerId,
      customerName: currentOrder.value.customerName,
      itemId: faultForm.value.itemId,
      itemName: faultForm.value.itemName,
      workerRemark: faultForm.value.workerRemark,
      urgencyLevel: faultForm.value.urgencyLevel,
      attachmentIds: uploadedAttachmentIds.value
    }

    const res = await request.post('/api/faults/report', postData)
    console.log("服务器响应内容:", res.data);

    // 逻辑修正：显式判断 success 字段
    if (res.data && res.success === true) {
      ElMessage.success('故障上报成功');
      faultVisible.value = false;

      // 清理状态
      fileList.value = [];
      uploadedAttachmentIds.value = [];
      loadData();
    } else {
      ElMessage.error('上报失败：' + (res.message || '未知原因'));
    }
  } catch (error) {
    console.error("请求失败，详细错误信息:", error);
    ElMessage.error('请求异常，详情请查看浏览器控制台');
  } finally {
    // 确保无论成功失败都会停止 loading 状态
    submitting.value = false
  }
}

const openEditDialog = () => { editForm.value = { ...user.value }; editVisible.value = true; }
const saveProfile = async () => {
  const res = await request.post('/api/worker/updateProfile', editForm.value)
  if (res.success) {
    user.value = { ...user.value, ...res.data }
    localStorage.setItem('user', JSON.stringify(user.value))
    editVisible.value = false
    ElMessage.success('更新成功')
  }
}

const handleStatusChange = async (newStatus) => {
  try {
    const res = await request.post('/api/worker/updateWorkStatus', {
      id: user.value.id,
      status: newStatus
    })

    // 【修改】去掉多余的 .data 层级
    if (res.success) {
      ElMessage.success(`状态已切换为: ${newStatus}`)
      const updatedUser = { ...user.value, workStatus: newStatus }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      user.value = updatedUser
    } else {
      ElMessage.error(res.message || '状态更新失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，状态同步失败')
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示').then(() => {
    localStorage.clear()
    location.href = '/login'
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.worker-container { padding: 20px; background: #f0f2f5; min-height: 100vh; }
.header-banner {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.worker-profile { display: flex; align-items: center; gap: 15px; }
.name-row { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: bold; }
.edit-btn { cursor: pointer; color: #409eff; font-size: 16px; }
.stat-row { margin-bottom: 20px; }
.stat-card { text-align: center; }
.stat-card .num { font-size: 30px; font-weight: bold; color: #409eff; }
.task-tabs { background: #fff; border-radius: 8px; }
.settings-container { padding: 60px 0; background: #fff; }
.upload-tip { font-size: 12px; color: #999; margin-top: 5px; }
/* 调整选择框样式使其更融入背景 */
:deep(.el-input__wrapper) {
  box-shadow: none !important;
  background-color: #f5f7fa;
}
</style>
