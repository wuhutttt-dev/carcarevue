<template>
  <el-card class="service-card" shadow="never">
    <template #header>
      <div class="header-box">
        <div class="title-area">
          <el-icon><Tools /></el-icon>
          <span class="title">服务项目维护</span>
        </div>
        <div class="action-area">
          <el-button type="success" icon="Plus" @click="handleAdd">新增项目</el-button>
          <el-button type="primary" icon="Refresh" @click="fetchServices" :loading="loading">刷新数据</el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeCategory" @tab-change="handleTabChange" class="category-tabs">
      <el-tab-pane label="保养项目管理" name="maintenance" />
      <el-tab-pane label="维修项目管理" name="repair" />
    </el-tabs>

    <el-table :data="serviceList" border stripe v-loading="loading" style="margin-top: 15px">
      <el-table-column type="index" label="序号" width="60" align="center" />

      <el-table-column label="项目图片" width="100" align="center">
        <template #default="scope">
          <el-image
            style="width: 50px; height: 50px; border-radius: 4px"
            :src="scope.row.imageUrl"
            :preview-src-list="[scope.row.imageUrl]"
            fit="cover"
          >
            <template #error>
              <div class="image-slot"><el-icon><Picture /></el-icon></div>
            </template>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column prop="name" label="服务名称" width="150" />
      <el-table-column prop="description" label="项目内容描述" min-width="200" show-overflow-tooltip />

      <el-table-column label="适用车型" width="120" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.vehicleType === '通用'" type="info">通用</el-tag>
          <el-tag v-else-if="scope.row.vehicleType === '燃油车'" type="warning">燃油车</el-tag>
          <el-tag v-else-if="scope.row.vehicleType === '电车'" type="success">电车</el-tag>
          <el-tag v-else type="info">{{ scope.row.vehicleType || '未分类' }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="duration" label="预计耗时" width="100" align="center">
        <template #default="scope">
          <el-tag type="info" effect="plain">{{ scope.row.duration || 0 }} 分钟</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="标准价格" width="120">
        <template #default="scope">
          <span class="price-tag">¥ {{ scope.row.price }}</span>
        </template>
      </el-table-column>

      <el-table-column label="管理操作" width="180" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">修改信息</el-button>
          <el-button type="danger" size="small" @click="confirmDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editForm.id ? '编辑服务' : '新增服务'" width="550px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editForm.name" placeholder="请输入服务名称" />
        </el-form-item>

        <el-form-item label="所属分类">
          <el-select v-model="editForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="保养项目" value="maintenance" />
            <el-option label="维修项目" value="repair" />
          </el-select>
        </el-form-item>

        <el-form-item label="适用车型">
          <el-select v-model="editForm.vehicleType" placeholder="请选择适用车型" style="width: 100%">
            <el-option label="通用项目 (全系适用)" value="通用" />
            <el-option label="燃油车专用 (ICE)" value="燃油车" />
            <el-option label="电动车专用 (EV)" value="电车" />
          </el-select>
        </el-form-item>

        <el-form-item label="项目图片">
          <el-upload
            class="service-uploader"
            action="http://localhost:8080/api/service-item/uploadImage"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            name="file"
          >
            <img v-if="editForm.imageUrl" :src="editForm.imageUrl" class="service-img-preview" />
            <el-icon v-else class="service-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="form-tip">点击预览图更换图片</div>
        </el-form-item>

        <el-form-item label="服务时长">
          <el-input-number v-model="editForm.duration" :min="1" controls-position="right" style="width: 100%" />
          <div class="form-tip">单位：分钟</div>
        </el-form-item>

        <el-form-item label="服务单价">
          <el-input-number v-model="editForm.price" :precision="2" :min="0" controls-position="right" style="width: 100%" />
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
import { Tools, Refresh, Plus, Picture } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const serviceList = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const activeCategory = ref('maintenance')

// 表单初始状态，已增加 vehicleType 默认值
const initialForm = {
  id: null,
  name: '',
  price: 0,
  description: '',
  duration: 30,
  imageUrl: '',
  category: 'maintenance',
  vehicleType: '通用'
}
const editForm = ref({ ...initialForm })

const fetchServices = async () => {
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:8080/api/service-item/listByCategory?category=${activeCategory.value}`)
    if (res.data.success) {
      serviceList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  fetchServices()
}

const handleAdd = () => {
  editForm.value = { ...initialForm, category: activeCategory.value }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  editForm.value = { ...row }
  dialogVisible.value = true
}

const handleUploadSuccess = (response) => {
  if (response.success) {
    editForm.value.imageUrl = response.data
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('上传失败')
  }
}

const beforeUpload = (file) => {
  const isImg = file.type.startsWith('image/')
  if (!isImg) ElMessage.error('只能上传图片文件')
  return isImg
}

const submitUpdate = async () => {
  submitting.value = true
  try {
    const res = await axios.post('http://localhost:8080/api/service-item/update', editForm.value)
    if (res.data.success) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      fetchServices()
    }
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (row) => {
  ElMessageBox.confirm(`确定要删除“${row.name}”吗？`, '警告', { type: 'warning' }).then(async () => {
    try {
      const res = await axios.delete(`http://localhost:8080/api/service-item/delete/${row.id}`)
      if (res.data.success) {
        ElMessage.success('已删除')
        fetchServices()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(fetchServices)
</script>

<style scoped>
.header-box { display: flex; justify-content: space-between; align-items: center; }
.title-area { display: flex; align-items: center; gap: 8px; }
.title { font-weight: bold; font-size: 16px; color: #303133; }
.action-area { display: flex; gap: 10px; }
.category-tabs { margin-top: 10px; }
.price-tag { color: #f56c6c; font-weight: bold; }
.form-tip { font-size: 12px; color: #909399; margin-top: 4px; }

.service-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  width: 178px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
}
.service-uploader:hover { border-color: #409eff; }
.service-img-preview { width: 100%; height: 100%; object-fit: cover; }
.service-uploader-icon { font-size: 28px; color: #8c939d; }
</style>
