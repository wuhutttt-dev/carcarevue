<template>
  <div class="staff-manage">
    <el-card class="staff-card" shadow="never">
      <template #header>
        <div class="header-box">
          <div class="title-area">
            <el-icon><Avatar /></el-icon>
            <span class="title">工作人员档案管理</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新增工作人员
          </el-button>
        </div>
      </template>

      <el-table
        :data="tableData"
        border
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80" align="center" />

        <el-table-column prop="jobTitle" label="职位" width="150">
          <template #default="scope">
            <el-tag effect="plain">{{ scope.row.jobTitle }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="email" label="邮箱" min-width="180" />

        <el-table-column label="管理操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDel(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑员工' : '新增员工'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" label-width="100px" style="padding-right: 20px">
        <el-form-item label="账号">
          <el-input v-model="form.username" :disabled="!!form.id" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="密码" v-if="!form.id">
          <el-input v-model="form.password" type="password" show-password placeholder="初始密码" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="form.realName" placeholder="员工真实姓名" />
        </el-form-item>
        <el-form-item label="职位">
          <el-select v-model="form.jobTitle" placeholder="请选择职位" style="width: 100%">
            <el-option label="维修技师" value="维修技师" />
            <el-option label="前台接待" value="前台接待" />
            <el-option label="洗车工" value="洗车工" />
            <el-option label="店长" value="店长" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="电子邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Avatar } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({ gender: '男' })

const loadData = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/admin/listStaff')
    if (res.data.success) {
      tableData.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取员工列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  form.value = { gender: '男', jobTitle: '维修技师' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  const api = form.value.id ? '/updateStaff' : '/addStaff'
  try {
    const res = await axios.post('http://localhost:8080/api/admin' + api, form.value)
    if (res.data.success) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('网络请求错误')
  }
}

const handleDel = (id) => {
  ElMessageBox.confirm('确定要永久删除该员工档案吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await axios.delete(`http://localhost:8080/api/admin/deleteStaff/${id}`)
      if (res.data.success) {
        ElMessage.success('删除成功')
        loadData()
      }
    } catch (error) {
      ElMessage.error('删除操作失败')
    }
  }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.staff-manage {
  padding: 0; /* 如果 AdminLayout 有内边距，这里可以设为 0 */
}

.staff-card {
  border-radius: 8px;
  border: none;
}

/* 统一 Header 布局方案 */
.header-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 统一图标与文字的紧凑排列 */
.title-area {
  display: flex;
  align-items: center;
  gap: 8px; /* 解决图标离字太远的问题 */
}

.title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

/* 保持表格上方间距一致 */
:deep(.el-card__body) {
  padding: 20px;
}
</style>
