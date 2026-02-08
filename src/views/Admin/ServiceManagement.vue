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

    <el-dialog v-model="dialogVisible" title="编辑服务项目" width="500px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editForm.name" placeholder="请输入服务名称" />
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
          <div class="form-tip">点击预览图更换图片，文件将存入指定本地目录</div>
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
import { Tools, Refresh, Plus, Picture } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const serviceList = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)

// 编辑表单数据
const editForm = ref({
  id: null,
  name: '',
  price: 0,
  description: '',
  duration: 0,
  imageUrl: '' // 绑定数据库中的图片路径
})

// 1. 获取服务列表
const fetchServices = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/service-item/list')
    if (res.data.success) {
      serviceList.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 2. 打开编辑弹窗
const handleEdit = (row) => {
  editForm.value = { ...row } // 将当前行数据拷贝到表单
  dialogVisible.value = true
}

// 3. 上传成功逻辑：接收后端返回的相对路径
const handleUploadSuccess = (response) => {
  if (response.success || response.code === 200) {
    // 后端返回的是 webPath 字符串（如 /src/assets/ServiceItem_pic/xxx.jpg）
    editForm.value.imageUrl = response.data
    ElMessage.success('图片上传成功，保存后同步到数据库')
  } else {
    ElMessage.error(response.message || '图片上传失败')
  }
}

// 4. 上传前校验
const beforeUpload = (rawFile) => {
  const isImage = ['image/jpeg', 'image/png', 'image/jpg'].includes(rawFile.type)
  if (!isImage) {
    ElMessage.error('仅支持 JPG/PNG 格式图片')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

// 5. 提交完整表单（包含新图片路径）到数据库
const submitUpdate = async () => {
  submitting.value = true
  try {
    const res = await axios.post('http://localhost:8080/api/service-item/update', editForm.value)
    if (res.data.success) {
      ElMessage.success('信息更新成功')
      dialogVisible.value = false
      fetchServices() // 刷新列表查看最新结果
    } else {
      ElMessage.error(res.data.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('服务器响应错误')
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

/* 上传组件样式：固定大小预览 */
.service-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 120px;
}
.service-uploader:hover { border-color: #409eff; }
.service-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 120px;
  text-align: center;
  line-height: 120px;
}
.service-img-preview {
  width: 178px;
  height: 120px;
  display: block;
  object-fit: cover;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
</style>
