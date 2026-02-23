import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. 创建 axios 实例
const service = axios.create({
    baseURL: 'http://localhost:8080', // 你的后端地址
    timeout: 5000                     // 请求超时时间
})

// 2. 请求拦截器 (Request Interceptor)
// 作用：在每一条请求发出去之前，自动在 Header 里塞入 Token
service.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            // 规范：加个 Bearer 前缀，注意后面有个空格
            config.headers['Authorization'] = 'Bearer ' + token
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 3. 响应拦截器 (Response Interceptor)
// 作用：如果后端发现 Token 假了或者过期了，返回 401，这里负责跳回登录页
service.interceptors.response.use(
    response => {
        // 直接返回数据部分，这样你在页面里拿数据就不用写多个 .data 了
        return response.data
    },
    error => {
        if (error.response && error.response.status === 401) {
            ElMessage.error('登录已过期或无权限，请重新登录')
            localStorage.clear() // 清空缓存
            window.location.href = '/login' // 强制跳回登录
        } else {
            ElMessage.error(error.message || '网络异常')
        }
        return Promise.reject(error)
    }
)

export default service
