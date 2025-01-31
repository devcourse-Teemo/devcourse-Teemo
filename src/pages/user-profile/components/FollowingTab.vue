<script setup>
import { ref, watch } from "vue";
import { followAPI } from "@/api/follow";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import EmptyText from "@/components/layout/EmptyText.vue";

const route = useRoute();
const followings = ref([]);

watch(
  () => route.params.userId,
  async (userId) => {
    followings.value = await followAPI.getFollowing(userId);
  },
  { immediate: true },
);
</script>
<template>
  <div v-if="!followings.length" class="flex items-center justify-center h-40">
    <EmptyText>팔로잉한 유저가 없습니다...</EmptyText>
  </div>
  <template v-else>
    <div class="grid grid-cols-6 gap-4">
      <RouterLink
        v-for="{ following } in followings"
        :to="`/users/${following.id}`"
        class="flex flex-col justify-center items-center gap-4 w-36 h-40 px-2 py-5 bg-black-6/20 rounded-lg"
      >
        <img
          class="w-16 h-16 rounded-full border border-black-4"
          :src="following.avatar_url"
          alt="프로필 이미지"
        />
        <div class="flex flex-col items-center gap-1">
          <p class="text-sm font-semibold">{{ following.name }}</p>
          <p class="text-xs font-medium text-black-3">
            {{ following.email }}
          </p>
        </div>
      </RouterLink>
    </div>
  </template>
</template>
<style></style>
