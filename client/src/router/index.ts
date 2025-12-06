import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "@/views/Home.vue";
import Room from "@/views/Room.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: Home },
  { path: "/room/:roomId", name: "room", component: Room, props: true }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
