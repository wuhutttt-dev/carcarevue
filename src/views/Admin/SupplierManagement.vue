<template>
  <div class="supplier-manage">
    <el-card shadow="never">
      <template #header>
        <div class="header-content">
          <span class="title">供应商名录</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增供应商
          </el-button>
        </div>
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="输入供应商名称搜索"
            @clear="loadData"
            clearable
            style="width: 200px; margin-right: 10px"
          />
          <el-button @click="handleSearch">搜索</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="供应商名称" min-width="150" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="address" label="办公地址" show-overflow-tooltip />

        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="启用"
              inactive-text="停用"
              @change="toggleStatus(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑供应商' : '新增供应商'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入公司全称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="手机或座机" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" placeholder="详细地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, OfficeBuilding } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const tableData = ref([])
const formRef = ref(null)
const searchQuery = ref('') // 用于绑定搜索输入框

const handleSearch = async () => {
  loading.value = true
  try {
    // 将 searchQuery 作为参数发送给后端
    const res = await request.get('/api/suppliers/list', {
      params: { name: searchQuery.value } // 使用 axios 的 params 会自动拼接成 ?name=xxx
    })
    tableData.value = res.data
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const form = ref({
  id: null,
  name: '',
  contact: '',
  phone: '',
  address: '',
  status: 1
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

// 获取列表数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/suppliers/list') // 补上 /list
    tableData.value = res.data
  } catch (error) {
    ElMessage.error('获取供应商列表失败')
  } finally {
    loading.value = false
  }
}

// 状态切换操作
const toggleStatus = async (row) => {
  try {
    // 构造 Update 请求体
    // 注意：因为你的 UpdateReq 可能有 @NotBlank 校验，这里需要传全量字段
    const payload = {
      id: row.id,
      name: row.name,
      contact: row.contact,
      phone: row.phone,
      address: row.address,
      status: row.status
    }

    await request.post('/api/suppliers/update', payload)
    ElMessage.success(`供应商 [${row.name}] 状态已更新`)
  } catch (error) {
    // 如果失败，将 UI 状态回滚
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态修改失败')
  }
}

// 打开新增
const handleAdd = () => {
  form.value = { id: null, name: '', contact: '', phone: '', address: '', status: 1 }
  dialogVisible.value = true
}

// 打开编辑
const handleEdit = (row) => {
  form.value = { ...row } // 这里确保 row 里面确实有 id 属性
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        // 动态判断路径：有 id 走 update，没 id 走 add
        const url = form.value.id ? '/api/suppliers/update' : '/api/suppliers/add'
        console.log("提交前的完整数据：", form.value);

        // 发送 POST 请求
        const res = await request.post(url, form.value)

        if (res.success) {
          ElMessage.success(form.value.id ? '修改信息成功' : '新增供应商成功')
          dialogVisible.value = false
          loadData() // 刷新表格
        }
      } catch (error) {
        ElMessage.error('操作失败，请检查网络或后端日志')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 删除供应商 (需要后端实现 delete 接口，或调用你 Service 里的 delete 方法)
const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该供应商吗？此操作不可恢复', '提示', {
    type: 'warning'
  }).then(async () => {
    // 注意：你目前的 Controller 还没写 deleteMapping，建议补上
    await request.delete(`/api/suppliers/${id}`)
    ElMessage.success('删除成功')
    loadData()
  })
}

onMounted(loadData)
</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.supplier-manage {
  background-color: transparent;
}
</style>
