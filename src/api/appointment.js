import axios from 'axios'

const API_URL = 'http://localhost:8080/api' // 根据你的后端地址修改

// 创建预约
export const createAppointment = (appointmentData) => {
  return axios.post(`${API_URL}/appointments`, appointmentData)
}

// 获取用户的所有预约
export const getUserAppointments = (userId) => {
  return axios.get(`${API_URL}/appointments/user/${userId}`)
}

// 取消预约
export const cancelAppointment = (appointmentId) => {
  return axios.put(`${API_URL}/appointments/${appointmentId}/cancel`)
}

// 更新预约状态
export const updateAppointmentStatus = (appointmentId, status) => {
  return axios.put(`${API_URL}/appointments/${appointmentId}/status`, { status })
}
