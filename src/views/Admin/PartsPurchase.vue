<template>
  <div class="parts-purchase-container">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>总配件种类</template>
          <div class="stat-value">{{ partsData.length }} <span>种</span></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card warning">
          <template #header>库存预警项</template>
          <div class="stat-value">{{ warningCount }} <span>项</span></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>本月采购支出</template>
          <div class="stat-value">¥{{ monthlyExpenditure.toFixed(2) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <div class="search-bar">
        <div class="left">
          <el-input v-model="searchQuery" placeholder="搜索配件名称/编号/品牌" class="search-input" clearable>
            <template #append><el-button :icon="Search" /></template>
          </el-input>
        </div>
        <div class="right">
          <el-button type="warning" :disabled="multipleSelection.length === 0" @click="openBatchPurchaseDialog">
            批量采购 (已选 {{ multipleSelection.length }} 项)
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openSinglePurchaseDialog(null)">
            新增配件并采购
          </el-button>
        </div>
      </div>

      <el-table :data="filteredParts" border stripe style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="配件编号" width="120" />
        <el-table-column prop="name" label="配件名称" min-width="150" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.stock < 10 ? 'danger' : 'success'">{{ scope.row.stock }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="参考单价" width="110">
          <template #default="scope">¥{{ scope.row.price }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="openSinglePurchaseDialog(scope.row)">采购</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="确认采购清单 (系统将按品牌自动分单)" width="1000px" destroy-on-close>
      <el-alert title="温馨提示：系统会根据配件品牌自动匹配对应的供应商并生成独立订单。" type="info" show-icon :closable="false" style="margin-bottom: 15px;" />
      <el-table :data="purchaseOrder.items" border max-height="450">
        <el-table-column label="配件编号" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.code" size="small" :disabled="!!scope.row.partId" />
          </template>
        </el-table-column>
        <el-table-column label="名称" min-width="150">
          <template #default="scope">
            <el-input v-model="scope.row.partName" size="small" :disabled="!!scope.row.partId" />
          </template>
        </el-table-column>
        <el-table-column label="品牌" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.brand" size="small" placeholder="如: 大众" :disabled="!!scope.row.partId" />
          </template>
        </el-table-column>
        <el-table-column label="分类" width="110">
          <template #default="scope">
            <el-select v-model="scope.row.category" size="small" :disabled="!!scope.row.partId">
              <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="拟定供应商" width="160">
          <template #default="scope">
            <span :style="{ color: matchSupplier(scope.row.brand) ? '#67C23A' : '#F56C6C' }">
              {{ matchSupplier(scope.row.brand)?.name || '未找到匹配供应商' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="scope">
            <el-input-number v-model="scope.row.quantity" :min="1" size="small" style="width: 100px" />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.price" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="scope">
            <el-button type="danger" :icon="Delete" circle size="small" @click="removeItem(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="footer-info">
          <div class="total-price">合计总额：<span>¥ {{ totalAmount }}</span></div>
          <div class="actions">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="submitPurchaseOrder">确认并自动分单提交</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// --- 数据定义 ---
const partsData = ref([])
const suppliers = ref([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const submitting = ref(false)
const multipleSelection = ref([])
const categories = ['保养件', '维修件', '美容件']
const purchaseOrder = ref({ items: [] })

// 修改点：新增本月支出响应式变量
const monthlyExpenditure = ref(0.0)

// --- 数据加载 ---
const fetchPartsData = async () => {
  const res = await request.get('/api/parts')
  if (res.success) partsData.value = res.data || []
}

const fetchSuppliers = async () => {
  const res = await request.get('/api/suppliers/active')
  if (res.success) suppliers.value = res.data || []
}

// 修改点：新增获取本月统计数据的函数
const fetchMonthlyStats = async () => {
  try {
    const res = await request.get('/api/purchase-orders/stats/monthly-expenditure')
    if (res.success) {
      monthlyExpenditure.value = res.data || 0.0
    }
  } catch (error) {
    console.error('获取统计支出失败:', error)
  }
}

// --- 工具函数与计算属性 (保持不变) ---
const matchSupplier = (brand) => {
  if (!brand) return null
  return suppliers.value.find(s => s.name.toLowerCase().includes(brand.toLowerCase()))
}

const filteredParts = computed(() => {
  return partsData.value.filter(item =>
    item.name.includes(searchQuery.value) ||
    item.code.includes(searchQuery.value) ||
    (item.brand && item.brand.includes(searchQuery.value))
  )
})
const warningCount = computed(() => partsData.value.filter(p => p.stock < 10).length)
const totalAmount = computed(() => {
  return purchaseOrder.value.items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0).toFixed(2)
})

// --- 交互逻辑 ---
const handleSelectionChange = (val) => { multipleSelection.value = val }

const openBatchPurchaseDialog = () => {
  purchaseOrder.value.items = multipleSelection.value.map(part => ({
    partId: part.id, code: part.code, partName: part.name,
    brand: part.brand, category: part.category, quantity: 1, price: part.price
  }))
  dialogVisible.value = true
}

const openSinglePurchaseDialog = (row) => {
  if (row) {
    purchaseOrder.value.items = [{
      partId: row.id, code: row.code, partName: row.name,
      brand: row.brand, category: row.category, quantity: 1, price: row.price
    }]
  } else {
    purchaseOrder.value.items = [{ code: '', partName: '', brand: '', category: '保养件', quantity: 1, price: 0 }]
  }
  dialogVisible.value = true
}

const removeItem = (index) => { purchaseOrder.value.items.splice(index, 1) }

// --- 核心逻辑修改：提交成功后刷新统计数据 ---
const submitPurchaseOrder = async () => {
  const items = purchaseOrder.value.items
  if (items.length === 0) return

  const ordersMap = new Map()

  for (const item of items) {
    if (!item.brand || !item.partName || !item.code) {
      return ElMessage.warning(`配件 ${item.partName || '未命名'} 信息不完整`)
    }
    const supplier = matchSupplier(item.brand)
    if (!supplier) {
      return ElMessage.error(`未找到品牌 "${item.brand}" 对应的供应商。`)
    }
    if (!ordersMap.has(supplier.id)) {
      ordersMap.set(supplier.id, [])
    }
    ordersMap.get(supplier.id).push(item)
  }

  try {
    await ElMessageBox.confirm(
      `系统将按品牌自动生成 ${ordersMap.size} 份采购单并直接增加库存。确认执行？`,
      '入库确认'
    );

    submitting.value = true;
    const requests = [];
    ordersMap.forEach((groupItems, sId) => {
      requests.push(request.post('/api/purchase-orders', {
        supplierId: sId,
        items: groupItems
      }));
    });

    await Promise.all(requests);

    ElMessage.success('采购成功，库存与支出已更新！');
    dialogVisible.value = false;
    multipleSelection.value = [];
    
    // 成功后同时刷新列表和统计支出
    fetchPartsData();
    fetchMonthlyStats(); 

  } catch (err) {
    if (err !== 'cancel') ElMessage.error('入库提交失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchPartsData()
  fetchSuppliers()
  fetchMonthlyStats() // 页面挂载时获取初始统计
})
</script>

<style scoped>
/* 样式同前 */
.parts-purchase-container { padding: 10px; }
.stat-cards { margin-bottom: 20px; }
.stat-card { text-align: center; }
.stat-value { font-size: 24px; font-weight: bold; color: #409eff; }
.search-bar { display: flex; justify-content: space-between; margin-bottom: 20px; }
.search-input { width: 300px; }
.footer-info { display: flex; justify-content: space-between; align-items: center; }
.total-price span { color: #f56c6c; font-size: 20px; font-weight: bold; }
</style>