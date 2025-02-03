<script setup>
import { onMounted } from "vue";
import { RouterLink } from "vue-router";
import Profile from "@/components/layout/Profile.vue";
import Grade from "@/components/layout/Grade.vue";
import { useAuthStore } from "@/store/authStore";
import { storeToRefs } from "pinia";
const Card1Img = new URL(
  "@/assets/icons/createProblemsCard.svg",
  import.meta.url,
).href;
const Card2Img = new URL("@/assets/icons/enterTestRoom.svg", import.meta.url)
  .href;
const Card3Img = new URL(
  "@/assets/icons/revisitProblemCard.svg",
  import.meta.url,
).href;

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

onMounted(() => {
  if (window.location.hash.includes("access_token")) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
});
</script>

<template>
  <div class="flex flex-col w-full">
    <h1 class="pb-24 text-5xl text-left font-laundry">
      {{ user?.user_metadata.full_name }}님, 다시 만나 반가워요!
    </h1>
    <div class="flex items-center justify-between w-full h-[226px] gap-4">
      <!-- 프로필 카드 -->
      <Profile
        :name="user?.user_metadata.full_name"
        :email="user?.email"
        :img-src="user?.user_metadata?.avatar_url"
      />

      <!-- 등급 카드 -->
      <Grade :user-id="user?.id" />
    </div>
  </div>

  <!-- 하단 래핑 박스 -->
  <div class="flex flex-col gap-2 pt-24 mx-auto">
    <h2 class="w-full text-xl font-semibold text-left font-pretend">
      공부하러 가기
    </h2>
    <div class="grid grid-cols-3 gap-6 w-full pt-[16px]">
      <!-- 카드 1 -->
      <RouterLink
        to="/problem-editor"
        class="bg-beige-2 rounded-lg p-6 flex flex-col justify-between gap-2 items-end"
      >
        <div class="w-full">
          <p
            class="mb-3 text-xl font-semibold text-left font-pretend text-gray-2"
          >
            문제 생성하기
          </p>
          <p class="text-sm text-left text-gray-1 font-pretend">
            새로운 문제를 만들고, 문제집에 추가하세요.
          </p>
        </div>
        <img :src="Card1Img" class="h-[8rem] w-auto" />
      </RouterLink>

      <!-- 카드 2 -->
      <RouterLink
        to="/exam-room"
        class="bg-beige-2 rounded-lg p-6 flex flex-col justify-between gap-2 items-end"
      >
        <div class="w-full">
          <p
            class="mb-3 text-xl font-semibold text-left font-pretend text-gray-2"
          >
            시험장 입실
          </p>
          <p class="text-sm text-left text-gray-1 font-pretend">
            친구들과 함께 시험을 보고 결과를 공유하세요.
          </p>
        </div>
        <img :src="Card2Img" class="h-[7rem] w-auto" />
      </RouterLink>

      <!-- 카드 3 -->
      <RouterLink
        to="/my-problems?type=againView"
        class="bg-beige-2 rounded-lg p-6 flex flex-col justify-between h-[261px] gap-2 items-end"
      >
        <div>
          <p
            class="mb-3 text-xl font-semibold text-left font-pretend text-gray-2"
          >
            다시 풀 문제
          </p>
          <p class="text-sm text-left text-gray-1 font-pretend">
            틀렸거나, 다시 보고 싶은 문제를 다시 한번 공부해보세요.
          </p>
        </div>
        <img :src="Card3Img" class="h-[7rem] w-auto" />
      </RouterLink>
    </div>
  </div>
</template>
