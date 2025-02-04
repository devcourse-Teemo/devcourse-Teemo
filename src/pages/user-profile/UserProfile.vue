<script setup>
// APIs
import { userAPI } from "@/api/user";

// Components
import UserProfileTabs from "./components/UserProfileTabs.vue";

import Grade from "@/components/layout/Grade.vue";
import Profile from "@/components/layout/Profile.vue";

// PrimeVue
import { useToast } from "primevue";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";

// Vue Core
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const { user: currentUser } = storeToRefs(authStore);
const user = ref();

watch(
  () => route.params,
  async () => {
    user.value = await userAPI.getOne(route.params.userId);
    if (!user.value) {
      router.replace("/mypage");
      toast.add({
        severity: "error",
        summary: "유저 정보 로딩 에러",
        detail: "해당 유저 정보를 불러올 수 없습니다.",
        life: 3000,
      });
      return;
    }
    if (currentUser.value.id === user.value.id) {
      router.replace("/mypage");
      return;
    }
  },
  {
    immediate: true,
  },
);
</script>
<template>
  <div class="flex flex-col gap-16">
    <h1 class="text-[42px] leading-none font-laundry">회원 정보</h1>
    <section class="flex h-56 gap-5">
      <Profile
        :img-src="user?.avatar_url"
        :name="user?.name"
        :email="user?.email"
        isUserProfile
      />
      <Grade :user-id="route.params.userId" />
    </section>
    <UserProfileTabs :user-id="route.params.userId" />
  </div>
</template>
<style scoped></style>
