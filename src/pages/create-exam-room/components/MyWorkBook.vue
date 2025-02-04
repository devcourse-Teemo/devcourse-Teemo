<script setup>
// APIs
import { workbookAPI } from "@/api/workbook.js";

// Icons
import shareIcon from "@/assets/icons/my-problem-sets/share.svg";

// Vue Core
import { ref, watchEffect } from "vue";

const { visibleMyBooks, selectedWorkbook } = defineProps({
  selectedWorkbook: Object,
  visibleMyBooks: {
    required: true,
  },
});

const books = ref([]);
const emit = defineEmits(["select-workbook"]);

const handleSelect = (book) => {
  emit("select-workbook", book);
};

watchEffect(async () => {
  if (!visibleMyBooks) return;

  books.value = await Promise.all(
    visibleMyBooks.map(async (book) => {
      try {
        const count = await workbookAPI.getWorkbookProblemCount(book.id);
        return {
          ...book,
          problem_count: count,
        };
      } catch (error) {
        console.error(`문제집 ${book.id}의 문제 수 조회 실패:`, error);
        return {
          ...book,
          problem_count: 0,
        };
      }
    }),
  );
});
</script>

<template>
  <div class="grid grid-cols-3 gap-2">
    <div
      v-for="book in books"
      :key="book.id"
      :class="[
        'w-[calc((100% - 4rem) / 3)] h-[146px] p-4 bg-orange-3 rounded-lg flex flex-col justify-between cursor-pointer hover:bg-orange-200 transition-colors',
        selectedWorkbook?.id === book.id ? 'border-2 border-orange-1' : '',
      ]"
      @click="handleSelect(book)"
    >
      <div>
        <h3 class="font-medium">{{ book.title || "제목 없음" }}</h3>
        <p class="text-sm text-gray-600 truncate">
          {{ book.description || "설명 없음" }}
        </p>
      </div>
      <div class="flex items-center justify-between mt-2">
        <!-- 공유받은 문제집인 경우 생성자 정보 표시 -->
        <div v-if="book.user" class="flex items-center gap-2">
          <img
            :src="book.user.avatar_url || '/default-avatar.png'"
            alt="프로필"
            class="rounded-full w-7 h-7"
          />
          <span class="text-black-1">{{ book.user.name }}</span>
        </div>
        <img v-else-if="book.shared" :src="shareIcon" alt="share" />
        <span v-else class="w-6"></span>
        <p class="font-medium">{{ book.problem_count || 0 }}문제</p>
      </div>
    </div>
  </div>
</template>
