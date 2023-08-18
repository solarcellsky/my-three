import Vue from 'vue'
import VueRouter from 'vue-router'
import Map from '../views/map/Index'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/Map',
  },
  {
    path: '/Map',
    name: 'Map',
    component: Map
  }
]

const router = new VueRouter({
  routes
})

export default router
