import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    component: () => import('../views/Register.vue')
  },
  // 管理员端
  {
    path: '/Admin',
    component: () => import('@/views/Admin/AdminLayout.vue'),
    // 【核心修改 1】确保默认进入 dashboard
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        // 【核心修改 2】确保组件路径正确。
        component: () => import('@/views/Admin/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/Admin/OrderManagement.vue'),
        meta: { title: '预约订单处理' }
      },
      {
        path: 'services',
        name: 'AdminServices',
        component: () => import('@/views/Admin/ServiceManagement.vue'),
        meta: { title: '服务项目维护' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/Admin/UserManagement.vue'),
        meta: { title: '客户档案中心' }
      },
      {
        path: 'staff',
        name: 'AdminStaff',
        component: () => import('@/views/Admin/StaffManagement.vue'),
        meta: { title: '员工档案管理' }
      },
      // --- 新增：配件采购管理路由 ---
      {
        path: 'parts-purchase', // 这里对应 AdminLayout.vue 中的 index="/admin/parts-purchase"
        name: 'AdminPartsPurchase',
        component: () => import('@/views/Admin/PartsPurchase.vue'), // 需确保创建该文件
        meta: { title: '配件采购管理' }
      },
      {
        path: 'parts-consumption',
        name: 'AdminPartsConsumption',
        component: () => import('@/views/Admin/PartsConsumption.vue'),
        meta: { title: '配件消耗记录' }
      },
      {
        path: 'suppliers',
        name: 'SupplierManagement',
        component: () => import('@/views/Admin/SupplierManagement.vue'),
        meta: { title: '供应商管理' }
      }
    ]
  },
  // 工作人员端
  {
    path: '/worker',
    component: () => import('@/views/Worker/WorkerLayout.vue'), // 使用新布局
    redirect: '/worker/orders',
    children: [
      {
        path: 'orders',
        name: 'WorkOrders',
        component: () => import('@/views/Worker/WorkOrders.vue'),
        meta: { title: '我的任务', role: '工作人员' }
      }
    ]
  },
  // 顾客/用户端 (嵌套路由)
  {
    path: '/user',
    component: () => import('../views/User/Index.vue'),
    meta: { requiresAuth: true, role: '用户' },
    redirect: '/user/services',
    children: [
      {
        path: 'services',
        name: 'ServiceList',
        component: () => import('../views/User/ServiceList.vue')
      },
      {
        path: 'appointments',
        component: () => import('../views/User/Appointments.vue')
      },
      {
        path: 'history',
        component: () => import('../views/User/History.vue')
      },
      {
        path: 'profile',
        component: () => import('../views/User/Profile.vue')
      },
      {
        path: 'service-history',
        component: () => import('../views/User/ServiceHistory.vue')
      },
      {
        path: 'ai-assistant',
        name: 'AIAssistant',
        component: () => import('../views/User/AIAssistant.vue'),
        meta: { title: 'AI 养车顾问' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// --- 全局前置守卫 ---
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'))

  // 1. 检查该页面是否需要登录 (通过 meta.role 或 路径前缀判断)
  const isAdminPage = to.path.startsWith('/admin')
  const isUserPage = to.path.startsWith('/user')
  const isWorkPage = to.path.startsWith('/worker')

  if (isAdminPage || isUserPage || isWorkPage) {
    if (!user) {
      return next('/login')
    }

    // 2. 权限校验
    if (isAdminPage && user.role !== '管理员') {
      return next('/login')
    }
    if (isUserPage && user.role !== '用户') {
      return next('/login')
    }
    if (isWorkPage && user.role !== '工作人员') {
      return next('/login')
    }
  }

  next()
})

export default router
