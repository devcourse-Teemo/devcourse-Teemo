<script setup>
import { ref, watch, nextTick } from "vue";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { useProblemUpdateStore } from "@/store/problemUpdateStore";

const props = defineProps({
  answer: {
    type: String,
    default: "",
  },
  explanation: {
    type: String,
    default: "",
  },
  source: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:source"]);
const problemUpdateStore = useProblemUpdateStore();
const { updateField } = problemUpdateStore;
const isOpen = ref(false);
const explanationEditor = ref(null);
let explanationEditorInstance = null;

// 설명 에디터 변경 감지
const handleExplanationChange = () => {
  if (explanationEditorInstance) {
    const content = explanationEditorInstance.getMarkdown();
    updateField("explanation", content);
  }
};

// 출처 변경 감지
const handleSourceChange = (event) => {
  updateField("origin_source", event.target.value);
};

const toggleAccordion = async () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    await nextTick();
    if (!explanationEditorInstance) {
      explanationEditorInstance = new Editor({
        el: explanationEditor.value,
        height: "200px",
        initialEditType: "wysiwyg",
        previewStyle: "vertical",
        initialValue: props.explanation || "",
        toolbarItems: [
          ["heading", "bold", "italic", "strike"],
          ["hr", "quote"],
          ["ul", "ol"],
          ["table", "image"],
        ],
        events: {
          change: handleExplanationChange,
        },
      });
    }
  }
};

// 별도로 watch 설정
watch(
  () => props.explanation,
  (newExplanation) => {
    if (explanationEditorInstance) {
      explanationEditorInstance.setMarkdown(newExplanation || "");
    }
  },
);
</script>

<template>
  <div class="w-full rounded-lg bg-black-3/15 px-4 mb-4 py-6">
    <div
      @click="toggleAccordion"
      class="cursor-pointer flex justify-between items-center"
    >
      <span class="text-lg font-semibold text-black-2">풀이와 답 수정</span>
      <svg
        :class="{
          'transform rotate-180': isOpen,
          'transform rotate-0': !isOpen,
        }"
        class="w-5 h-5 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </div>

    <div v-if="isOpen" class="p-4 border-t border-b border-gray-300 mt-4">
      <h4 class="text-lg font-semibold text-black-2 mb-4">정답</h4>
      <p class="text-gray-700">
        {{ answer || "답이 없습니다." }}
      </p>
    </div>
    <div v-if="isOpen" class="p-4">
      <h4 class="text-lg font-semibold text-black-2 mb-4">문제 해설</h4>
      <div
        ref="explanationEditor"
        class="text-gray-700 min-h-4 mb-10 w-full"
      ></div>
    </div>
  </div>

  <!-- 출처  -->
  <div
    v-if="source"
    class="text-gray-500 mt-4 p-4 border-b border-gray-300 mb-10 item-middle gap-2"
  >
    출처 |
    <input
      type="text"
      :value="source"
      :maxlength="20"
      @input="handleSourceChange"
      class="border border-gray-300 rounded p-1 flex-grow"
    />
  </div>
</template>

<style scoped>
.bg-black-3 {
  background-color: #333;
}
.bg-black-6 {
  background-color: #666;
}
:deep(button) {
  text-align: center;
}
:deep(.toastui-editor-contents) {
  font-family: "Pretendard";
}
:deep(p) {
  font-size: 16px;
}
</style>
