<script setup>
import { onMounted, watch, ref } from "vue";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { SelectButton } from "primevue";
import { useProblemUpdateStore } from "@/store/problemUpdateStore";

const problemUpdateStore = useProblemUpdateStore();
const { updateField } = problemUpdateStore;

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
});

let questionEditorInstance = null;
const questionEditor = ref(null);

// 에디터 변경 감지
const handleEditorChange = () => {
  if (questionEditorInstance) {
    const content = questionEditorInstance.getMarkdown();
    updateField("question", content);
  }
};

// 보기 변경 감지
const handleOptionChange = (optionNumber, value) => {
  updateField(`option_${optionNumber}`, value);
};

// 답안 변경 감지
const handleAnswerChange = (value) => {
  updateField("answer", value);
};

onMounted(() => {
  questionEditorInstance = new Editor({
    el: questionEditor.value,
    height: "200px",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    initialValue: props.problem?.question || "",
    toolbarItems: [
      ["heading", "bold", "italic", "strike"],
      ["hr", "quote"],
      ["ul", "ol"],
      ["table", "image"],
    ],
    events: {
      change: handleEditorChange,
    },
  });
});

watch(
  () => props.problem,
  (newProblem) => {
    if (questionEditorInstance) {
      questionEditorInstance.setMarkdown(newProblem.question || "");
    }
  },
);
</script>

<template>
  <div class="mb-8">
    <h3 class="text-gray-2 mb-4">문제 수정</h3>
    <div ref="questionEditor" class="text-gray-700 min-h-4 mb-10 w-full"></div>

    <h3 class="text-gray-2 mb-4">보기 수정</h3>
    <!-- 객관식 보기 -->
    <div
      v-if="props.problem?.problem_type === 'multiple_choice'"
      class="space-y-4"
    >
      <ol class="list-decimal space-y-2 text-gray-700">
        <!-- 보기 1번 -->
        <li class="flex items-center gap-2">
          <input
            type="radio"
            name="answers"
            value="1"
            :checked="props.problem.answer === '1'"
            @change="handleAnswerChange('1')"
            class="cursor-pointer rounded-full h-7 w-7 border-2 border-black-3 place-items-center text-black-2 hover:bg-black-5"
          />
          <input
            type="text"
            :value="props.problem.option_one"
            @input="handleOptionChange('one', $event.target.value)"
            class="md:h-9 w-full border border-gray-300 rounded p-1"
            placeholder="선택지 내용"
          />
        </li>
        <!-- 보기 2번 -->
        <li class="flex items-center gap-2">
          <input
            type="radio"
            name="answers"
            value="2"
            :checked="props.problem.answer === '2'"
            @change="handleAnswerChange('2')"
            class="cursor-pointer rounded-full h-7 w-7 border-2 border-black-3 place-items-center text-black-2 hover:bg-black-5"
          />
          <input
            type="text"
            :value="props.problem.option_two"
            @input="handleOptionChange('two', $event.target.value)"
            class="md:h-9 w-full border border-gray-300 rounded p-1"
            placeholder="선택지 내용"
          />
        </li>
        <!-- 보기 3번 -->
        <li class="flex items-center gap-2">
          <input
            type="radio"
            name="answers"
            value="3"
            :checked="props.problem.answer === '3'"
            @change="handleAnswerChange('3')"
            class="cursor-pointer rounded-full h-7 w-7 border-2 border-black-3 place-items-center text-black-2 hover:bg-black-5"
          />
          <input
            type="text"
            :value="props.problem.option_three"
            @input="handleOptionChange('three', $event.target.value)"
            class="md:h-9 w-full border border-gray-300 rounded p-1"
            placeholder="선택지 내용"
          />
        </li>
        <!-- 보기 4번 -->
        <li class="flex items-center gap-2">
          <input
            type="radio"
            name="answers"
            value="4"
            :checked="props.problem.answer === '4'"
            @change="handleAnswerChange('4')"
            class="cursor-pointer rounded-full h-7 w-7 border-2 border-black-3 place-items-center text-black-2 hover:bg-black-5"
          />
          <input
            type="text"
            :value="props.problem.option_four"
            @input="handleOptionChange('four', $event.target.value)"
            class="md:h-9 w-full border border-gray-300 rounded p-1"
            placeholder="선택지 내용"
          />
        </li>
      </ol>
    </div>

    <!-- OX 보기 -->
    <div v-if="props.problem?.problem_type === 'ox'" class="space-y-4">
      <SelectButton
        v-model="props.problem.answer"
        :options="['O', 'X']"
        selection
      />
    </div>

    <div
      ref="explanationEditor"
      class="text-gray-700 min-h-4 mb-10 w-full"
    ></div>
  </div>
</template>

<style scoped>
.addDivider::after {
  width: 100%;
  height: 1px;
  background-color: #d4d4d4;
  margin-top: 12px;
  content: "";
  display: block;
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
