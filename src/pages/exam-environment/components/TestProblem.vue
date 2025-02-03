<script setup>
import { againViewProblemAPI } from "@/api/againViewProblem";
import { Button, useToast } from "primevue";
import { computed, watch, ref, onBeforeUnmount } from "vue";
import Viewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import { useAuthStore } from "@/store/authStore";
import { storeToRefs } from "pinia/dist/pinia";

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const el = ref(null);
const viewer = ref(null);
const emit = defineEmits(["selectAnswer"]);

const toast = useToast();
const { problem, currentProblemIndex, userAnswer } = defineProps({
  problem: Object,
  currentProblemIndex: Number,
  userAnswer: String,
});

const isAgainViewProblem = ref(false);

const options = computed(() => [
  problem.option_one,
  problem.option_two,
  problem.option_three,
  problem.option_four,
]);

const addAgainViewProblem = async () => {
  await againViewProblemAPI.addAgainViewProblem({
    problem_id: problem.id,
  });
  isAgainViewProblem.value = true;
  toast.add({
    severity: "success",
    summary: "다시 풀 문제 추가",
    detail: "다시 풀 문제에 추가되었습니다.",
    life: 3000,
  });
};

const deleteAgainViewProblem = async () => {
  await againViewProblemAPI.delete(problem.id);
  isAgainViewProblem.value = false;
  toast.add({
    severity: "success",
    summary: "다시 풀 문제 삭제",
    detail: "다시 풀 문제에서 삭제되었습니다.",
    life: 3000,
  });
};

const handleImageClick = (event) => {
  const img = event.target;
  if (img.requestFullscreen) {
    img.requestFullscreen();
  } else if (img.mozRequestFullScreen) {
    // Firefox
    img.mozRequestFullScreen();
  } else if (img.webkitRequestFullscreen) {
    // Chrome, Safari and Opera
    img.webkitRequestFullscreen();
  } else if (img.msRequestFullscreen) {
    // IE/Edge
    img.msRequestFullscreen();
  }
};

const addImageClickListeners = () => {
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    img.addEventListener("click", handleImageClick);
  });
};

watch(
  () => [problem.id, el.value],
  async ([problemId, elValue]) => {
    // 마크다운 Viewer 설정
    if (el.value && problem.question) {
      viewer.value = new Viewer({
        el: elValue,
        initialValue: problem.question,
      });
    }

    // 이미지 전체화면 이벤트리스너 등록
    addImageClickListeners();

    // 다시 풀 문제 여부 체크
    const data = await againViewProblemAPI.getByProblemId(
      user.value.id,
      problemId,
    );

    isAgainViewProblem.value = data.length ? true : false;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (viewer.value) {
    viewer.value.destroy();
  }
});
</script>
<template>
  <article class="flex flex-col w-[1000px] mx-auto">
    <div class="flex flex-col gap-8 pb-6 border-b">
      <Button
        v-if="isAgainViewProblem"
        @click="deleteAgainViewProblem"
        label="다시 풀 문제"
        icon="pi pi-flag"
        size="small"
        severity="secondary"
        class="w-24 !bg-orange-3 !text-orange-500"
      />
      <Button
        v-else
        @click="addAgainViewProblem"
        label="다시 풀 문제"
        icon="pi pi-flag"
        size="small"
        severity="secondary"
        class="w-24"
      />
      <h2>문제 {{ currentProblemIndex + 1 }} : {{ problem?.title }}</h2>
    </div>
    <div ref="el" class="w-full overflow-hidden mt-6 mb-12"></div>

    <!-- 4지선다 -->
    <template v-if="problem?.problem_type === 'multiple_choice'">
      <div class="flex flex-col gap-4 mb-20">
        <div
          v-for="(option, index) in options"
          :key="index"
          class="flex items-center"
        >
          <button
            @click="emit('selectAnswer', String(index + 1))"
            :id="index"
            type="button"
            :class="[
              'flex justify-center items-center border-2 border-solid w-6 h-6 rounded-full',
              userAnswer === String(index + 1)
                ? 'border-orange-1 bg-orange-1 text-white'
                : 'text-gray-3',
            ]"
          >
            {{ index + 1 }}
          </button>
          <label :for="index" class="pl-3 cursor-pointer"> {{ option }}</label>
        </div>
      </div>
    </template>

    <!-- OX -->
    <template v-if="problem?.problem_type === 'ox'">
      <div class="flex justify-center items-center gap-4 mb-20">
        <button
          v-for="(option, index) in ['O', 'X']"
          @click="emit('selectAnswer', option)"
          :key="index"
          :id="index"
          type="button"
          :class="[
            'flex justify-center items-center w-24 border-2 border-solid text-2xl font-semibold py-2 rounded-lg transition-colors',
            userAnswer === option
              ? 'border-orange-1 bg-orange-1 text-white'
              : 'text-black-3 hover:bg-orange-1/30 hover:border-orange-1/30',
          ]"
        >
          {{ option }}
        </button>
      </div>
    </template>
  </article>
</template>
<style scoped>
:deep(img) {
  max-width: 100%;
  cursor: pointer;
  object-fit: cover;
}

:deep(.toastui-editor-contents) {
  font-family: "Pretendard";
}
:deep(p) {
  font-size: 16px;
}
</style>
