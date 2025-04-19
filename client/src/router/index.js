import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Servers from '../views/Servers.vue';
import Rules from '../views/Rules.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/servers',
    name: 'servers',
    component: Servers
  },
  {
    path: '/rules/:serverId',
    name: 'rules',
    component: Rules,
    props: true
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router; 