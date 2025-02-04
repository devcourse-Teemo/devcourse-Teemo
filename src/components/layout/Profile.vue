<script setup>
// APIs
import { followAPI } from "@/api/follow";

// PrimeVue
import { Button, useToast } from "primevue";

// Store
import { storeToRefs } from "pinia";

import { useAuthStore } from "@/store/authStore";

// Vue Core
import { useRoute } from "vue-router";
import { ref, watchEffect } from "vue";

const { imgSrc, name, email } = defineProps({
  imgSrc: String,
  name: String,
  email: String,
  isUserProfile: {
    type: Boolean,
    default: false,
  },
});

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const toast = useToast();
const route = useRoute();

const followId = ref(route.params.userId);
const isFollowing = ref(false);

const followUser = async () => {
  if (!followId.value) return;

  isFollowing.value = !isFollowing.value;
  const { data, error } = await followAPI.followUser(
    user.value.id,
    followId.value,
  );
  if (error) {
    toast.add({
      severity: "error",
      summary: "팔로우 실패",
      detail: error,
      life: 3000,
    });
  } else {
    toast.add({
      severity: "success",
      summary: "팔로우 성공",
      detail: `${data.user.name}님을 팔로우했습니다.`,
      life: 3000,
    });
  }
};

const unfollowUser = async () => {
  if (!followId.value) return;

  isFollowing.value = !isFollowing.value;
  await followAPI.unfollowUser(followId.value);
  toast.add({
    severity: "success",
    summary: "팔로우 취소 성공",
    detail: `팔로우를 성공적으로 취소했습니다.`,
    life: 3000,
  });
};

watchEffect(async () => {
  const userId = route.params.userId;
  if (!userId) return;

  followId.value = userId;
  isFollowing.value = await followAPI.checkIsFollowing(user.value.id, userId);
});
</script>
<template>
  <article
    class="flex flex-col items-center justify-center h-56 gap-4 w-52 bg-beige-2 px-11 rounded-2xl"
  >
    <img
      :class="[
        'rounded-full border border-black-4 object-cover',
        isUserProfile ? 'w-24 h-24' : 'w-32 h-32',
      ]"
      :src="imgSrc"
      alt="내 프로필 이미지"
    />
    <div class="flex flex-col items-center">
      <p class="text-xl font-semibold">
        {{ name }}
      </p>
      <p class="text-sm font-medium text-gray-3">
        {{ email }}
      </p>
    </div>
    <template v-if="isUserProfile">
      <Button
        v-if="!isFollowing"
        @click="followUser"
        severity="primary"
        class="flex items-center justify-center w-full h-3 border border-black-3"
        label="팔로우"
      />
      <Button
        v-else
        @click="unfollowUser"
        severity="primary"
        variant="outlined"
        class="flex items-center justify-center w-full h-3 border border-black-3"
        label="팔로우 취소"
      />
    </template>
  </article>
</template>
<style scoped></style>
