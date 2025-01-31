<script setup>
import deletePath from "@/assets/icons/problem-editor/delete.svg";
import alarmPath from "@/assets/icons/problem-editor/alarm.svg";
import {
  reactive,
  ref,
  onBeforeMount,
  computed,
  onBeforeUnmount,
  watchEffect,
  watch,
  defineExpose,
  toRaw,
} from "vue";
import {
  Listbox,
  Button,
  ToggleSwitch,
  MultiSelect,
  InputText,
  StyleClass,
  SelectButton,
} from "primevue";

import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { storageAPI } from "@/api/storage";
import { HtmlGenerator, parse } from "latexjs";
import { categoryAPI } from "@/api/category";

const props = defineProps({
  problemIdx: {
    type: Number,
  },
  problemContent: {
    type: {
      title: String,
      question: String,
      answer: String,
      explanation: String,
      origin_source: String,
      problem_type: String,
      category: Array,
      image_src: String,
      option_one: String,
      option_two: String,
      option_three: String,
      option_four: String,
      shared: Boolean,
    },
    default: () => ({
      title: "",
      question: "",
      answer: "",
      explanation: "",
      origin_source: "",
      problem_type: "",
      category: [],
      image_src: "",
      option_one: "",
      option_two: "",
      option_three: "",
      option_four: "",
      shared: false,
    }),
  },
});

const emits = defineEmits(["updateListItem", "deleteProblem", "submitProblem"]);

const setType = (type) => {
  localProblem.type = type;
  emits("updateListItem", "TYPE", type);
};
const PROBLEM_TYPES = ["4지선다", "O/X"];
// 카테고리

const category = reactive([]);

const localProblem = reactive({
  ...props.problemContent,
});

const currentIdx = computed(() => {
  return props.problemIdx;
});

// 에디터 옵션
const questionEditor = ref(null);
let questionEditorInstance = null;

const explanationEditor = ref(null);

let explanationEditorInstance = null;

// 카테고리 생성용
const doesCategoryExist = computed(() => {
  console.log(filteredCategory.value);
  return JSON.stringify(category).indexOf(`${filteredCategory.value}`) === -1
    ? false
    : true;
});
const filteredCategory = ref("");
const onFilterCategory = (event) => {
  filteredCategory.value = event.value;
};

const createCategory = async () => {
  if (!filteredCategory.value.trim()) {
    console.error("Category name cannot be empty");
    return;
  }

  const newCategoryData = await categoryAPI.createCategory({
    name: filteredCategory.value.trim(),
  });

  console.log(newCategoryData);
  category.push(...newCategoryData);
  localProblem.category = [...newCategoryData];

  filteredCategory.value = "";

  console.log("새로운 카테고리가 생성되고 선택되었습니다:", newCategoryData);
};

watchEffect(() => {
  // 문제 에디터 초기화
  if (questionEditor.value && !questionEditorInstance) {
    questionEditorInstance = new Editor({
      el: questionEditor.value,
      height: "200px",
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["hr", "quote"],
        ["ul", "ol", "task", "indent", "outdent"],
        ["table", "image", "link"],
        ["code", "codeblock"],
      ],
      events: {
        change: () => {
          const value = questionEditorInstance.getMarkdown();
          localProblem.question = value; // question만 업데이트
        },
      },
      hooks: {
        addImageBlobHook: async (fileOrBlob, callback) => {
          // 이미지 업로드 처리
          try {
            const { type, size } = fileOrBlob;

            if (!type.startsWith("image/")) {
              throw new Error("이미지 파일만 업로드할 수 있습니다.");
            }

            const MAX_FILE_SIZE = 50 * 1024 * 1024;
            if (size > MAX_FILE_SIZE) {
              throw new Error("파일 크기가 50MB를 초과할 수 없습니다.");
            }

            const imageUrl = await storageAPI.uploadImage(fileOrBlob);
            callback(imageUrl, fileOrBlob.name);
          } catch (err) {
            console.error("이미지 업로드 실패:", err);
          }
        },
      },
      customHTMLRenderer: {
        latex(node) {
          const generator = new latexjs.HtmlGenerator({ hyphenate: false });
          const { body } = latexjs
            .parse(node.literal, { generator })
            .htmlDocument();

          return [
            { type: "openTag", tagName: "div", outerNewLine: true },
            { type: "html", content: body.innerHTML },
            { type: "closeTag", tagName: "div", outerNewLine: true },
          ];
        },
      },
    });

    // 초기 question 값 설정
    if (localProblem.question) {
      questionEditorInstance.setMarkdown(localProblem.question);
    }
  }

  // 풀이 에디터 초기화
  if (explanationEditor.value && !explanationEditorInstance) {
    explanationEditorInstance = new Editor({
      el: explanationEditor.value,
      height: "200px",
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
      events: {
        change: () => {
          const value = explanationEditorInstance.getMarkdown();
          localProblem.explanation = value; // explanation만 업데이트
        },
      },
      hooks: {
        addImageBlobHook: async (fileOrBlob, callback) => {
          // 이미지 업로드 처리
          try {
            const { type, size } = fileOrBlob;

            if (!type.startsWith("image/")) {
              throw new Error("이미지 파일만 업로드할 수 있습니다.");
            }

            const MAX_FILE_SIZE = 50 * 1024 * 1024;
            if (size > MAX_FILE_SIZE) {
              throw new Error("파일 크기가 50MB를 초과할 수 없습니다.");
            }

            const imageUrl = await storageAPI.uploadImage(fileOrBlob);
            callback(imageUrl, fileOrBlob.name);
          } catch (err) {
            console.error("이미지 업로드 실패:", err);
          }
        },
      },
    });

    // 초기 explanation 값 설정
    if (localProblem.explanation) {
      explanationEditorInstance.setMarkdown(localProblem.explanation);
    }
  }
});

onBeforeMount(async () => {
  const categoryData = await categoryAPI.getAll();
  category.push(...categoryData);
  localProblem.type = localProblem.type === "" ? "4지선다" : localProblem.type;
});

const updateValidity = () => {
  localProblem.validity.category = localProblem.category?.length > 0;
  localProblem.validity.title = localProblem.title?.length > 0 ? true : false;
  localProblem.validity.question =
    localProblem.question?.length > 0 ? true : false;
  localProblem.validity.answer = localProblem.answer?.length > 0 ? true : false;
  localProblem.validity.origin_source =
    localProblem.origin_source?.length > 0 ? true : false;
};

// Call updateValidity inside watchEffect so Vue tracks dependencies correctly
watchEffect(() => {
  updateValidity();
});

const submitProblem = () => {
  const categoryRaw = toRaw(localProblem.category);
  updateValidity();
  localProblem.isValid = Object.values(localProblem.validity).every(Boolean);
  localProblem.visited = true;
  emits("submitProblem", currentIdx.value, {
    ...localProblem,
    category: categoryRaw,
  });
  console.log(localProblem);
};

defineExpose({
  submitProblem,
});

// 문제 변경시 제출, 업데이트
onBeforeUnmount(() => {
  submitProblem();
});
</script>

<template>
  <main class="flex flex-col gap-4 flex-grow">
    <article
      class="flex items-top flex-grow pl-4 pr-10 py-4 gap-3"
      v-if="props.problemIdx !== -1"
    >
      <img
        :src="deletePath"
        alt="문제 삭제하기"
        class="align-top bg-black-5 p-1 rounded-md w-8 h-8 hover:scale-110"
        role="button"
        @click="emits('deleteProblem')"
      />
      <form
        class="border-2 border-black-3 flex flex-col flex-grow px-6 pb-6 pt-4 rounded-md"
      >
        <fieldset class="addDivider mb-4 block">
          <label class="mr-3">문제 유형 선택</label>
          <ul class="none inline cursor-pointer">
            <li
              v-for="type in PROBLEM_TYPES"
              :key="type"
              class="inline rounded px-3 py-1.5 leading-relaxed mr-2"
              :class="[
                localProblem.type === type
                  ? 'bg-orange-1 text-white hover:bg-orange-hover'
                  : 'bg-black-5 text-black-1 hover:bg-black-5',
              ]"
              @click="setType(type)"
            >
              {{ type }}
            </li>
          </ul>
        </fieldset>
        <fieldset class="addDivider block mb-4">
          <label for="category" class="mr-4"
            >카테고리 <sup class="text-black-2">*</sup></label
          >
          <MultiSelect
            v-model="localProblem.category"
            display="chip"
            :options="category"
            optionLabel="name"
            filter
            :invalid="localProblem.category?.length == 0"
            :selection-limit="1"
            class="md:h-9 items-center md:w-60 font-regular text-sm py-2 mr-6 relative border border-red"
            @filter="(e) => onFilterCategory(e)"
            panel-class="custom-overlay"
          >
            <template #footer>
              <div class="p-3 flex justify-between">
                <Button
                  label="카테고리 추가"
                  severity="secondary"
                  text
                  size="small"
                  icon="pi pi-plus"
                  :disabled="doesCategoryExist"
                  @click="createCategory"
                />
              </div>
            </template>
          </MultiSelect>

          <label for="shared" class="mr-2"> 공개 여부 </label>
          <ToggleSwitch
            v-model="localProblem.shared"
            name="shared"
            class="align-middle"
          />
        </fieldset>

        <fieldset class="addDivider flex flex-col gap-4 mb-4">
          <legend class="my-2">
            문제 {{ currentIdx + 1 }} <sup class="text-black-2">*</sup>
          </legend>
          <InputText
            type="text"
            v-model="localProblem.title"
            name="problem"
            class="md:h-10 w-full"
            placeholder="문제의 제목을 작성해 주세요."
            :invalid="localProblem.title == ''"
            @change="(e) => emits('updateListItem', 'TITLE', e.target.value)"
          />
          <div ref="questionEditor"></div>
          <p>답 <sup class="text-black-2">*</sup></p>
          <div
            v-if="localProblem.type == '4지선다'"
            v-for="(_, idx) in 4"
            :key="idx"
            class="flex items-center gap-2"
          >
            <input
              type="radio"
              name="answers"
              :value="idx + 1"
              :checked="localProblem.answer === String(idx + 1)"
              @change="localProblem.answer = String(idx + 1)"
              class="cursor-pointer rounded-full h-7 w-7 border-2 border-black-3 place-items-center text-black-2 hover:bg-black-5"
              :invalid="false"
            /><InputText
              type="text"
              v-model="
                localProblem[
                  `option_${
                    idx === 0
                      ? 'one'
                      : idx === 1
                      ? 'two'
                      : idx === 2
                      ? 'three'
                      : 'four'
                  }`
                ]
              "
              name="option"
              class="md:h-9 w-full"
              placeholder="선택지 내용"
            />
          </div>
          <div v-else-if="localProblem.type == 'O/X'">
            <SelectButton
              v-model="localProblem.answer"
              :options="['O', 'X']"
              selection
            />
          </div>
        </fieldset>
        <fieldset class="addDivider mb-4">
          <legend class="my-2">풀이</legend>
          <div ref="explanationEditor" class="mb-6"></div>
        </fieldset>
        <fieldset class="flex flex-col gap-2 mb-4">
          <div class="flex items-center gap-4">
            <label for="origin_source"
              >출처 <sup class="text-black-2">*</sup>
            </label>
            <InputText
              type="text"
              v-model="localProblem.origin_source"
              name="origin_source"
              class="md:h-10 flex-grow"
              :invalid="localProblem.origin_source == ''"
            />
          </div>
          <p class="flex gap-2 text-black-1 items-center text-xs">
            <img :src="alarmPath" alt="사용자 출처 저작권 안내 문구" />문제의
            출처를 최대한 자세하게 써주세요. 타인의 문제를 허락없이 공유하여
            법적인 제제를 받는 경우, 풀고에서 책임지지 않습니다.
          </p>
        </fieldset>
      </form>
    </article>
  </main>
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
:deep(.custom-overlay) {
  position: absolute !important;
  top: 188px !important;
  bottom: auto !important;
  transform: none !important;
}
</style>
