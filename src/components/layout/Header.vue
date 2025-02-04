<script setup>
// APIs
import { supabase } from "@/api";
import { userAPI } from "@/api/user";

// Components
import LoginModal from "./LoginModal.vue";
import Notification from "./Notification.vue";

// PrimeVue
import Menu from "primevue/menu";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";

// Vue Core
import { ref, onBeforeMount } from "vue";
import { useRouter, RouterLink } from "vue-router";

const pointPath = new URL("@/assets/icons/point.svg", import.meta.url).href;

const router = useRouter();

// 유저 정보
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const userInfo = ref();

const showLoginModal = ref(false);

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push("/");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

const handleLoginSuccess = () => {
  showLoginModal.value = false;
};

// Menu 참조
const menu = ref(null);

// 메뉴 항목 정의
const menuItems = [
  {
    label: "프로필",
    icon: "pi pi-user",
    command: () => {
      router.push("/mypage");
    },
  },
  {
    label: "로그아웃",
    icon: "pi pi-sign-out",
    command: handleLogout,
  },
];

// Menu 열기 함수
const openMenu = (event) => {
  menu.value.toggle(event); // 클릭 위치에서 메뉴 표시
};

supabase
  .channel("point-channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "point" },
    ({ new: newPoint }) => {
      if (newPoint.uid === user.value.id) {
        userInfo.value.total_points += newPoint.change_value;
      }
    },
  )
  .subscribe();

onBeforeMount(async () => {
  await authStore.initializeAuth();
  userInfo.value = await userAPI.getOne(user.value.id);
});
</script>

<template>
  <header class="w-full">
    <nav
      class="flex items-center justify-end px-16 py-6 space-x-3 text-gray-600"
    >
      <!-- 알림 및 포인트 -->
      <Notification />

      <RouterLink
        to="/mypage?tab=포인트+내역"
        class="flex items-center px-2 py-1 h-[24px] bg-black-5 rounded-full font-pretend"
      >
        <!-- 별 아이콘 -->
        <img :src="pointPath" alt="point" class="mr-1" />
        <!-- 포인트 숫자 -->
        <span class="text-sm font-bold text-gray-800">
          {{ userInfo?.total_points }}
        </span>
      </RouterLink>
      <!-- 메뉴 트리거 -->
      <div
        @click="openMenu"
        class="flex items-center gap-2 cursor-pointer font-pretend"
      >
        <span class="font-medium">{{ userInfo?.name }}님</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <!-- Menu -->
      <Menu
        :model="menuItems"
        ref="menu"
        popup
        appendTo="body"
        class="p-menu w-[200px]"
      />
    </nav>

    <!-- 로그인 모달 -->
    <LoginModal
      :modalValue="showLoginModal"
      @login-success="handleLoginSuccess"
    />
  </header>
</template>
