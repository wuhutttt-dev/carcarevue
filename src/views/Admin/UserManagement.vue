<template>
  <el-card class="user-card" shadow="never">
    <template #header>
      <div class="header-box">
        <div class="title-area">
          <el-icon><UserIcon /></el-icon>
          <span class="title">客户档案中心</span>
        </div>
        <el-button type="primary" icon="Refresh" @click="fetchUsers" :loading="loading">刷新名单</el-button>
      </div>
    </template>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="输入客户姓名或手机号搜索"
        class="search-input"
        clearable
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>

    <el-table :data="filteredUsers" border stripe v-loading="loading" style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="realName" label="客户姓名" width="120" />
      <el-table-column prop="gender" label="性别" width="70" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.gender === '女' ? 'danger' : 'primary'" size="small">
            {{ scope.row.gender || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号码" width="130" />

      <el-table-column prop="email" label="电子邮箱" min-width="200" show-overflow-tooltip />

      <el-table-column prop="status" label="账户状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'">
            {{ scope.row.status || '正常' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="管理操作" width="260" fixed="right" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" plain @click="showOrders(scope.row)">
            历史订单
          </el-button>

          <el-button
            size="small"
            :type="scope.row.status === '正常' ? 'warning' : 'success'"
            @click="toggleStatus(scope.row)"
          >
            {{ scope.row.status === '正常' ? '禁用' : '解禁' }}
          </el-button>

          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">
            注销
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="orderDialogVisible"
      :title="`【${currentUser.realName}】的历史订单`"
      width="800px"
      destroy-on-close
    >
      <el-table :data="userOrders" border stripe v-loading="orderLoading" max-height="400">
        <el-table-column prop="appointmentTime" label="时间" width="160" />
        <el-table-column prop="serviceType" label="项目" />
        <el-table-column prop="finalPrice" label="金额" width="100">
          <template #default="scope">¥{{ scope.row.finalPrice }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </el-card>
</template>

<script setup>
// 脚本部分逻辑无需变动，保持原样
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { Search, Refresh, User as UserIcon } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const userList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const orderDialogVisible = ref(false)
const orderLoading = ref(false)
const userOrders = ref([])
const currentUser = ref({})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/customer/listAll')
    if (res.data.success) userList.value = res.data.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const showOrders = async (user) => {
  currentUser.value = user
  orderDialogVisible.value = true
  orderLoading.value = true
  try {
    const res = await axios.get(`http://localhost:8080/api/appointment/listAll`)
    if (res.data.success) {
      userOrders.value = res.data.data.filter(order => order.customerName === user.realName)
    }
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    orderLoading.value = false
  }
}

const toggleStatus = async (user) => {
  const newStatus = user.status === '正常' ? '禁用' : '正常'
  try {
    const res = await axios.post('http://localhost:8080/api/customer/updateStatus', {
      id: user.id,
      status: newStatus
    })
    if (res.data.success) {
      ElMessage.success(`用户已${newStatus === '正常' ? '恢复' : '停用'}`)
      fetchUsers()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要注销该客户档案吗？此操作不可恢复。', '警告', {
    type: 'error'
  }).then(async () => {
    const res = await axios.delete(`http://localhost:8080/api/customer/delete/${id}`)
    if (res.data.success) {
      ElMessage.success('注销成功')
      fetchUsers()
    }
  })
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return userList.value
  const q = searchQuery.value.toLowerCase()
  return userList.value.filter(u =>
    (u.realName && u.realName.toLowerCase().includes(q)) ||
    (u.phone && u.phone.includes(q))
  )
})

onMounted(fetchUsers)
</script>

<style scoped>
.user-card { margin: 0; border-radius: 8px; }
.header-box { display: flex; justify-content: space-between; align-items: center; }
.title-area { display: flex; align-items: center; gap: 8px; }
.title { font-weight: bold; font-size: 16px; }
.search-bar { margin-bottom: 20px; }
.search-input { width: 300px; }
</style>
