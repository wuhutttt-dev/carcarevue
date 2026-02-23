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
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="email" label="邮箱" min-width="180" />

        <el-table-column label="管理操作" width="180" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDel(scope.row.id)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '修改员工信息' : '添加新员工'"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入登录账号" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>

        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入电子邮箱" />
        </el-form-item>

        <el-form-item label="初始密码" v-if="!form.id">
          <el-input v-model="form.password" placeholder="为空则默认为 123456" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Avatar } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)

// 响应式表单对象，已删除 jobTitle 和 specialization
const form = ref({
  id: null,
  username: '',
  realName: '',
  gender: '男',
  phone: '',
  email: '',
  password: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/admin/listStaff')
    if (res.success) {
      tableData.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 打开新增
const handleAdd = () => {
  form.value = { id: null, realName: '', gender: '男', phone: '', email: '', password: '' }
  dialogVisible.value = true
}

// 打开编辑
const handleEdit = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  const api = form.value.id ? '/updateStaff' : '/addStaff'
  try {
    const res = await request.post('/api/admin' + api, form.value)
    if (res.success) {
      ElMessage.success('操作成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error('网络请求错误')
  }
}

// 删除操作
const handleDel = (id) => {
  ElMessageBox.confirm('确定要永久删除该员工档案吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete(`/api/admin/deleteStaff/${id}`)
      if (res.success) {
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
  padding: 0;
}
.header-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-area {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  font-weight: bold;
  font-size: 16px;
}
.staff-card {
  border-radius: 8px;
}
</style>
