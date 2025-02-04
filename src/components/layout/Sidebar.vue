<script setup>
// Vue Core
import { RouterLink } from "vue-router";

const logoPath = new URL("@/assets/logos/logo.svg", import.meta.url).href;
const testPath = new URL("@/assets/icons/test.svg", import.meta.url).href;
const boardPath = new URL("@/assets/icons/board.svg", import.meta.url).href;
const libraryPath = new URL("@/assets/icons/library.svg", import.meta.url).href;
</script>

<template>
  <aside
    class="w-[240px] bg-beige-2 h-full flex flex-col relative top-0 z-50 items-center py-6"
  >
    <!-- 로고 -->
    <RouterLink to="/home" class="mb-4">
      <img :src="logoPath" alt="Pullgo" class="w-auto h-auto" />
    </RouterLink>

    <!-- 버튼 -->
    <RouterLink to="/problem-editor">
      <button
        class="bg-orange-1 text-white text-lg border-none px-8 py-2.5 rounded-lg hover:bg-orange-hover cursor-pointer mb-[24px] transition-colors"
        to="/problem-editor"
      >
        새로운 문제 만들기
      </button>
    </RouterLink>

    <!-- 내비게이션 -->
    <nav class="w-full px-6">
      <!-- Library 섹션 -->
      <div class="mb-[24px]">
        <div class="px-2 mb-2 text-sm font-medium text-black-2">
          <img :src="libraryPath" alt="" class="w-3.5 h-auto pr-0.5" />
          LIBRARY
        </div>
        <RouterLink
          to="/my-problems"
          class="block text-[#B1B1B1] hover:bg-beige-1 hover:text-navy-3 px-2 rounded leading-relaxed ml-2"
        >
          보관한 문제
        </RouterLink>
        <RouterLink
          to="/my-problem-sets"
          class="block text-[#B1B1B1] hover:bg-beige-1 px-2 rounded mt-1.5 leading-relaxed hover:text-navy-3 ml-2"
        >
          보관한 문제집
        </RouterLink>
      </div>

      <!-- Board 섹션 -->
      <div class="mb-[24px]">
        <div class="text-[#4F4F4F] text-sm px-2 mb-2 font-medium">
          <img :src="boardPath" alt="" class="w-3.5 h-auto pr-0.5" />
          BOARD
        </div>
        <RouterLink
          to="/problem-board"
          class="block text-[#B1B1B1] hover:bg-beige-1 hover:text-navy-3 px-2 rounded leading-relaxed mt-1.5 ml-2"
        >
          문제 게시판
        </RouterLink>
        <RouterLink
          to="/problem-set-board"
          class="block text-[#B1B1B1] hover:bg-beige-1 hover:text-navy-3 px-2 rounded leading-relaxed mt-1.5 ml-2"
        >
          문제집 게시판
        </RouterLink>
      </div>

      <!-- Test 섹션 -->
      <div>
        <div class="text-[#4F4F4F] text-sm px-2 mb-2 font-medium">
          <img :src="testPath" alt="" class="w-3.5 h-auto pr-0.5" />
          TEST
        </div>
        <RouterLink
          to="/exam-room"
          class="block text-[#B1B1B1] hover:bg-beige-1 hover:text-navy-3 px-2 rounded leading-relaxed ml-2"
        >
          내 시험장
        </RouterLink>
        <RouterLink
          to="/exam-history"
          class="block text-[#B1B1B1] hover:bg-beige-1 hover:text-navy-3 px-2 rounded mt-1.5 leading-relaxed ml-2"
        >
          시험 내역
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>
