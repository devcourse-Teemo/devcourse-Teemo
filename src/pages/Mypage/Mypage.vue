<script setup>
// Components
import MypageTabs from "./components/MypageTabs.vue";

import Grade from "@/components/layout/Grade.vue";
import Profile from "@/components/layout/Profile.vue";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>
<template>
  <div class="flex flex-col gap-16">
    <h1 class="text-[42px] leading-none font-laundry">내 정보</h1>
    <section class="flex h-56 gap-5">
      <Profile
        :name="user?.user_metadata.full_name"
        :email="user?.email"
        :img-src="user?.user_metadata?.avatar_url"
      />
      <Grade :user-id="user?.id" />
    </section>
    <MypageTabs />
  </div>
</template>
<style scoped></style>
