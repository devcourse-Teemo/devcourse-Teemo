<script setup>
import { problemAPI } from "@/api/problem";
import { useRouter } from "vue-router";

const router = useRouter();
const onClickButton = async (type) => {
  switch (type) {
    case "HOME":
      router.push("/");
      break;
    case "RANDOM":
      const pageList = [
        "mypage",
        "my-problems",
        "my-problem-sets",
        "problem-board",
        "problem-set-board",
        "exam-room",
        "exam-history",
      ];
      const randomNum = Math.floor(Math.random() * 6);
      router.push(`/${pageList[randomNum]}`);
      break;
    case "PROBLEM":
      try {
        const problemId = await problemAPI.getRandom();
        if (problemId) {
          router.push(`/problem-board/${problemId}`);
        } else {
          router.push(`/`);
        }
      } catch {}

      break;
  }
};
</script>
<template>
  <main
    class="bg-bg-404 bg-center bg-no-repeat bg-cover w-screen h-screen flex flex-col place-content-center place-items-center"
  >
    <h1 class="font-laundry text-orange-1 text-[12rem] leading-none">404</h1>
    <p class="text-black-2/50 font-laundry">이런, 페이지가 꼬여버렸네요!</p>
    <button
      class="bg-btn-orange1 bg-contain bg-center bg-no-repeat px-8 py-5 text-white font-medium mt-12 hover:scale-110"
      @click="onClickButton('HOME')"
    >
      홈으로 가기
    </button>
    <button
      class="bg-btn-orange2 bg-contain bg-center bg-no-repeat px-8 py-3 text-white font-medium mt-10 hover:scale-110 text-sm absolute top-14 left-20"
      @click="onClickButton('RANDOM')"
    >
      어디로 갈까?
    </button>
    <button
      class="bg-btn-orange2 bg-contain bg-center bg-no-repeat px-6 py-5 text-white font-medium mt-10 hover:scale-110 text-sm absolute bottom-44 right-80"
      @click="onClickButton('PROBLEM')"
    >
      랜덤 문제 보기
    </button>
  </main>
</template>
<style scoped></style>
