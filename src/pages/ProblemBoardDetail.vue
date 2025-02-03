<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { problemAPI } from "@/api/problem";
import Menu from "primevue/menu";
import Avatar from "primevue/avatar";
import Badge from "primevue/badge";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import shareIcon from "@/assets/icons/problem-board/fi-rr-share.svg";
import thumbsUpIcon from "@/assets/icons/problem-board/fi-rr-thumbs-up.svg";
import CommentList from "@/pages/problem-set-detail/components/CommentList.vue";
import router from "@/router";

// 더보기 메뉴 상태 관리
const menu = ref();
const showConfirmDialog = ref(false);
const route = useRoute();
const problem = ref(null);

// 댓글 입력 상태 관리
const commentText = ref("");

// 문제 데이터 로드
const loadProblem = async () => {
  try {
    if (!route.params.problemId) {
      console.log("ID가 없습니다");
      return;
    }

    const data = await problemAPI.getById(route.params.problemId);

    if (data) {
      problem.value = data;
    }
  } catch (error) {
    console.error("문제 로딩 실패:", error);
  }
};

onMounted(() => {
  loadProblem();
});

//메뉴 아이템 정의
const menuItems = [
  {
    label: "수정하기",
    icon: "pi pi-pencil",
    command: () => {
      router.push(`/problem-board-update/${route.params.problemId}`);
    },
  },
  {
    label: "삭제하기",
    icon: "pi pi-trash",
    command: () => {
      showConfirmDialog.value = true;
    },
  },
];

const comments = ref([
  {
    id: 1,
    author: "김내현",
    contents: "소방경력공무원 관계법규 개념 예제 문제 ",
    date: "1일전",
  },
  {
    id: 2,
    author: "김내현",
    contents: "소방경력공무원 관계법규 개념 예제 문제 ",
    date: "1일전",
  },
  {
    id: 3,
    author: "김내현",
    contents: "소방경력공무원 관계법규 개념 예제 문제 ",
    date: "1일전",
  },
  {
    id: 4,
    author: "김내현",
    contents: "소방경력공무원 관계법규 개념 예제 문제 ",
    date: "1일전",
  },
]);

const toggleMenu = (event) => {
  menu.value.toggle(event);
};
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- 헤더 영역 -->
    <div class="flex justify-between flex-col gap-10">
      <div class="flex gap-2 items-center">
        <Avatar
          image="https://via.placeholder.com/40"
          shape="circle"
          size="large"
        />
        <div>
          <p>
            <strong aria-label="닉네임">닉네임</strong>
            <Badge value="등급" severity="secondary" class="ml-2" />
          </p>
          <span class="text-gray-500 text-sm" aria-label="최종 수정일"
            >2025.01.15.</span
          >
        </div>
      </div>

      <div class="flex items-center gap-4 mb-10">
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-4">{{ problem?.title }}</h1>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <span class="bg-gray-100 px-2 py-1 rounded">{{
              problem?.category?.name
            }}</span>
            <!-- 공개 여부 표시 -->
            <div class="flex items-center gap-1">
              <img :src="shareIcon" alt="공유 아이콘" class="w-4 h-4" />
              <span>{{ problem?.shared ? "공개됨" : "미공개" }}</span>
            </div>
            <!-- 좋아요 수 표시 -->
            <div class="flex items-center gap-1">
              <img :src="thumbsUpIcon" alt="좋아요 아이콘" class="w-4 h-4" />
              <span>{{ problem?.problem_like?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- PrimeVue Menu -->
        <div class="relative">
          <Button
            icon="pi pi-ellipsis-v"
            @click="toggleMenu"
            text
            rounded
            aria-label="더보기"
          />
          <Menu ref="menu" :model="menuItems" :popup="true" />
        </div>
      </div>
    </div>

    <!-- 본문 영역 -->
    <div class="mb-8">
      <p class="text-gray-700 mb-10">{{ problem?.question }}</p>

      <!-- 이미지 섹션 -->
      <div v-if="problem?.image_src" class="mb-10">
        <img
          :src="problem.image_src"
          alt="문제 이미지"
          class="w-full rounded-lg"
        />
      </div>

      <!-- 객관식 보기 -->
      <div v-if="problem?.problem_type === 'multiple_choice'" class="space-y-4">
        <ol class="list-decimal space-y-2 text-gray-700">
          <li v-if="problem.option_one" class="flex items-center gap-2">
            <strong
              class="text-xs rounded-full bg-black-6 w-7 h-7 font-normal item-middle"
              >1</strong
            >
            <span> {{ problem.option_one }}</span>
          </li>
          <li v-if="problem.option_two" class="flex items-center gap-2">
            <strong
              class="text-xs rounded-full bg-black-6 w-7 h-7 font-normal item-middle"
              >2</strong
            >
            <span> {{ problem.option_two }}</span>
          </li>
          <li v-if="problem.option_three" class="flex items-center gap-2">
            <strong
              class="text-xs rounded-full bg-black-6 w-7 h-7 font-normal item-middle"
              >3</strong
            >
            <span> {{ problem.option_three }}</span>
          </li>
          <li v-if="problem.option_four" class="flex items-center gap-2">
            <strong
              class="text-xs rounded-full bg-black-6 w-7 h-7 font-normal item-middle"
              >4</strong
            >
            <span> {{ problem.option_four }}</span>
          </li>
        </ol>
      </div>
    </div>

    <!-- OX 보기 -->
    <div v-if="problem?.problem_type === 'OX'" class="space-y-4">
      <ul>
        <li
          v-if="O"
          class="flex items-center gap-2 rounded border border-gray-200"
        >
          <strong
            class="text-lg font-normal item-middle inline-block border-gray-200 h-full border-r px-4 py-2 bg-black-6"
            >O</strong
          >
          <span class="inline-block px-4 py-2"> {{ problem.option_four }}</span>
        </li>
        <li
          v-if="X"
          class="flex items-center gap-2 rounded border border-gray-200"
        >
          <strong
            class="text-lg font-normal item-middle inline-block border-gray-200 h-full border-r px-4 py-2 bg-black-6"
            >O</strong
          >
          <span class="inline-block px-4 py-2"> {{ problem.option_four }}</span>
        </li>
      </ul>
    </div>

    <!-- 풀이와 답 보기 -->
    <div class="mb-8">
      <Accordion class="w-full">
        <AccordionTab>
          <template #header>
            <span class="text-lg font-semibold">풀이와 답 보기</span>
          </template>
          <div class="p-4 border-b border-gray-200">
            <h4 class="text-lg font-semibold mb-4">정답</h4>
            <p class="text-gray-700">
              {{ problem?.answer || "답이 없습니다." }}
            </p>
          </div>
          <div class="p-4">
            <h4 class="text-lg font-semibold mb-4">문제 해설</h4>
            <p class="text-gray-700">
              {{ problem?.explanation || "해설이 없습니다." }}
            </p>
          </div>
        </AccordionTab>
      </Accordion>
    </div>

    <!-- 출처 -->
    <p class="text-sm text-gray-500 mb-10 bg-black-6 p-4 rounded-lg">
      출처: {{ problem?.origin_source }}
    </p>

    <hr class="w-full mb-10 border border-slate-100" />

    <!--  댓글 리스트 + 입력창 -->
    <CommentList :comments="comments" />

    <!-- 삭제 확인 다이얼로그 -->
    <Dialog
      v-model:visible="showConfirmDialog"
      header="삭제 확인"
      :modal="true"
    >
      <p>정말로 이 게시물을 삭제하시겠습니까?</p>
      <template #footer>
        <Button
          label="취소"
          icon="pi pi-times"
          @click="showConfirmDialog = false"
          text
        />
        <Button
          label="삭제"
          icon="pi pi-trash"
          severity="danger"
          @click="showConfirmDialog = false"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.list-decimal {
  list-style-type: decimal;
}

:deep(.p-menu) {
  width: 200px;
}

:deep(.p-menu .p-menuitem-link) {
  padding: 0.75rem 1rem;
}

:deep(.p-menu .p-menuitem-link:not(.p-disabled):hover) {
  background: rgba(0, 0, 0, 0.1);
}

:deep(.p-menu .p-menuitem-link .p-menuitem-icon) {
  color: #4f4f4f;
}

:deep(.p-menu .p-menuitem-link .p-menuitem-text) {
  color: #4f4f4f;
}

:deep(.p-button.p-button-rounded) {
  width: 2.5rem;
  height: 2.5rem;
  color: #4f4f4f;
}

:deep(.p-button.p-button-text:hover) {
  background: rgba(0, 0, 0, 0.1);
  color: #4f4f4f;
}

:deep(.p-accordion .p-accordion-header .p-accordion-header-link) {
  background-color: #f3f4f6;
  color: #4f4f4f;
  border: none;
  padding: 1rem;
}

:deep(.p-accordion .p-accordion-content) {
  border: none;
  background-color: #ffffff;
}

:deep(
    .p-accordion
      .p-accordion-header:not(.p-disabled).p-highlight
      .p-accordion-header-link
  ) {
  background-color: #f3f4f6;
  color: #4f4f4f;
  border: none;
}

:deep(
    .p-accordion
      .p-accordion-header:not(.p-highlight):not(.p-disabled):hover
      .p-accordion-header-link
  ) {
  background-color: #e5e7eb;
  border: none;
}
</style>
