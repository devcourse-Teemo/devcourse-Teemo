<script setup>
// Icons
import { ref } from "vue";

// Vue Core
import logoPath from "@/assets/logos/logo.svg";
import previewIMG from "@/assets/icons/preview.png";
import LoginModal from "@/components/layout/LoginModal.vue";

const showLoginModal = ref(false);

const handleLoginSuccess = () => {
  showLoginModal.value = false;
};
</script>

<template>
  <div class="flex flex-col bg-white">
    <!-- 랜딩 페이지 상단 -->
    <header class="bg-beige-2 w-full fixed left-0 top-0 py-2.5">
      <div
        class="w-full max-w-[1440px] mx-auto flex justify-between items-center px-4"
      >
        <RouterLink to="/home" class="item-middle">
          <img :src="logoPath" alt="Pullgo" class="w-auto h-6" />
        </RouterLink>
        <nav class="flex gap-4">
          <button
            @click="showLoginModal = true"
            class="text-white bg-orange-1 border-none text-sm rounded-[4px] px-4 py-2 font-sans hover:bg-orange-hover transition"
          >
            로그인
          </button>
        </nav>
      </div>
    </header>

    <!-- 랜딩 페이지 메인 섹션 -->
    <main
      class="flex-1 bg-white py-16 pt-[200px] box-border flex flex-col gap-4"
    >
      <div class="w-full px-4 mx-auto text-center">
        <h2 class="mb-6 text-6xl font-laundry">풀고에서 풀고 또 풀자!</h2>
        <p class="text-black text-lg max-w-4xl mx-auto text-[20px]">
          혹시 아직까지 워드로 문제를 만들고 계신가요? "풀고"에서는 문제
          제작부터 공유까지, 여러 플랫폼을 돌아다닐 필요 없이 한 번에 해결할 수
          있습니다. 지금까지 푼 문제들을 모아서 편하게 확인하고, 친구들과 함께
          시험도 만들어 보세요!
        </p>
        <button
          @click="showLoginModal = true"
          class="px-16 py-3 mt-8 text-lg text-white border-none rounded-lg bg-orange-1 hover:bg-orange-hover"
        >
          문제 풀러 가기
        </button>
      </div>
      <!-- 메인 콘텐츠 미리보기 섹션 & 이미지로 대체 예정 -->
      <img
        :src="previewIMG"
        alt="서비스 미리보기"
        class="mx-auto max-w-[1440px]"
      />
    </main>

    <!-- 로그인 모달 -->
    <LoginModal v-model="showLoginModal" @login-success="handleLoginSuccess" />
  </div>

  <LoginModal :modalValue="showLoginModal" />
</template>

<style scoped></style>
