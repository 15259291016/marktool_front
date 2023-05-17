import Vue from 'vue'
import VueRouter from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'
import FileDownload from '../views/Layout/FileDownload'
import Layout from '../views/Layout/Layout'
import Login from '../views/Layout/Login'
import AdminManagement from '../views/Layout/AdminManagement.vue'
import MainPage from '../views/Layout/MainPage.vue'
import FileManagement from '../views/Layout/FileManagement'
import Classification from '../views/Annotator/Classification'
import Multiclassification from '../views/Annotator/Multiclassification.vue'
import Cqa from '../views/Annotator/CQA.vue'
import Graph from '../views/Annotator/Graph.vue'
import TwoTuples from '../views/Annotator/TwoTuples.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/Login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Login
  },
  {
    path: '/Layout',
    component: Layout,
    children: [
      {
        path: 'MainPage',
        component: MainPage
      },
      {
        path: 'AdminManagement',
        component: AdminManagement
      },
      {
        path: 'FileManagement',
        component: FileManagement
      },
      {
        path: 'FileDownload',
        component: FileDownload
      },
      {
        path: 'Classification',
        component: Classification
      },
      {
        path: 'Multiclassification',
        component: Multiclassification
      },
      {
        path: 'Cqa',
        component: Cqa
      },
      {
        path: 'Graph',
        component: Graph
      },
      {
        path: 'TwoTuples',
        component: TwoTuples
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes
})

export default router
