<script setup>
// APIs
import { storageAPI } from "@/api/storage";
import { categoryAPI } from "@/api/category";

// Icons
import alarmPath from "@/assets/icons/problem-editor/alarm.svg";
import deletePath from "@/assets/icons/problem-editor/delete.svg";

// PrimeVue
import { useToast } from "primevue/usetoast";
import { Button, MultiSelect, InputText, SelectButton } from "primevue";

// Store
import { storeToRefs } from "pinia";

import { useCreateProblemStore } from "@/store/createProblemStore";

// toastui
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";

// Vue Core
import {
  reactive,
  ref,
  onBeforeMount,
  computed,
  watchEffect,
  watch,
  toRaw,
} from "vue";

const createProblemStore = useCreateProblemStore();
const { createdProblems, targetProblem } = storeToRefs(createProblemStore);
const toast = useToast();
const emits = defineEmits(["deleteProblem"]);

const setType = (type) => {
  localProblem.type = type;
  createProblemStore.updateListItem("TYPE", type);
};
const PROBLEM_TYPES = ["4지선다", "O/X"];
// 카테고리

const category = reactive([]);

const localProblem = reactive({
  ...createdProblems.value.problemLists[targetProblem.value.idx],
});

const currentIdx = computed(() => {
  return targetProblem.value.idx;
});

// 에디터 옵션
const questionEditor = ref(null);
let questionEditorInstance = null;

const explanationEditor = ref(null);

let explanationEditorInstance = null;

// 카테고리 생성용
const doesCategoryExist = computed(() => {
  return category.some((cat) => cat.title == filteredCategory.value);
});
const filteredCategory = ref("");
const onFilterCategory = (event) => {
  filteredCategory.value = event.value;
};

const createCategory = async () => {
  if (!filteredCategory.value.trim()) {
    toast.add({
      severity: "error",
      summary: "카테고리 생성 실패",
      detail: "카테고리가 비어있어 생성이 불가 합니다.",
      life: 4000,
    });
    return;
  }

  const newCategoryData = await categoryAPI.createCategory({
    name: filteredCategory.value.trim().substring(0, 15),
  });

  category.push(...newCategoryData);
  localProblem.category = [...newCategoryData];

  filteredCategory.value = "";
};

watchEffect(() => {
  // 문제 에디터 초기화
  if (questionEditor.value && !questionEditorInstance) {
    questionEditorInstance = new Editor({
      el: questionEditor.value,
      height: "300px",
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["hr", "quote"],
        ["ul", "ol"],
        ["table", "image"],
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
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["hr", "quote"],
        ["ul", "ol"],
        ["table", "image"],
      ],
      events: {
        change: () => {
          const value = explanationEditorInstance.getMarkdown();
          localProblem.explanation = value;
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
  localProblem.validity.title = localProblem.title?.trim().length > 0;
  localProblem.validity.question = localProblem.question?.trim().length > 0;
  localProblem.validity.answer = localProblem.answer?.length > 0;
  localProblem.validity.origin_source =
    localProblem.origin_source?.trim().length > 0;

  if (localProblem.type === "4지선다") {
    localProblem.validity.option_one =
      localProblem.option_one?.trim().length > 0;
    localProblem.validity.option_two =
      localProblem.option_two?.trim().length > 0;
    localProblem.validity.option_three =
      localProblem.option_three?.trim().length > 0;
    localProblem.validity.option_four =
      localProblem.option_four?.trim().length > 0;
  } else {
    delete localProblem.validity.option_one;
    delete localProblem.validity.option_two;
    delete localProblem.validity.option_three;
    delete localProblem.validity.option_four;
  }

  localProblem.isValid = Object.values(localProblem.validity).every(Boolean);
};

watch(localProblem, () => {
  updateValidity();
});

// 문제 변경시 제출, 업데이트
watch(
  () => localProblem,
  (newVal) => {
    if (currentIdx.value !== -1) {
      createProblemStore.submitProblem(currentIdx.value, toRaw(newVal));
    }
  },
  { deep: true }, // 내부 객체 변경까지 감지
);
</script>

<template>
  <main class="flex flex-col flex-grow gap-4">
    <article
      class="flex flex-grow gap-3 py-4 pl-4 pr-10 items-top"
      v-if="currentIdx !== -1"
    >
      <img
        :src="deletePath"
        alt="문제 삭제하기"
        class="w-8 h-8 p-1 align-top rounded-md bg-black-5 hover:scale-110"
        role="button"
        @click="emits('deleteProblem')"
      />
      <form
        class="flex flex-col flex-grow px-6 pt-4 pb-6 border-2 rounded-md border-black-3"
      >
        <fieldset class="block mb-4 addDivider">
          <label class="mr-3">문제 유형 선택</label>
          <ul class="inline cursor-pointer none">
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
        <fieldset class="block mb-4 addDivider">
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
            class="relative items-center py-2 mr-6 text-sm border md:h-9 md:w-60 font-regular border-red"
            @filter="(e) => onFilterCategory(e)"
            panel-class="custom-overlay"
          >
            <template #footer>
              <div class="flex justify-between p-3">
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
        </fieldset>

        <fieldset class="flex flex-col gap-4 mb-4 addDivider">
          <legend class="my-2">
            문제 {{ currentIdx + 1 }} <sup class="text-black-2">*</sup>
          </legend>
          <InputText
            type="text"
            v-model="localProblem.title"
            name="problem"
            class="w-full md:h-10"
            placeholder="문제의 제목을 작성해 주세요.(20자)"
            :invalid="localProblem.title?.trim() == ''"
            @change="
              (e) => createProblemStore.updateListItem('TITLE', e.target.value)
            "
            maxlength="20"
          />
          <div
            ref="questionEditor"
            :class="{
              'border border-red-1 rounded':
                localProblem.question?.trim() === '',
            }"
          ></div>
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
              class="border-2 rounded-full cursor-pointer h-7 w-7 border-black-3 place-items-center text-black-2 hover:bg-black-5"
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
              class="w-full md:h-9"
              placeholder="선택지 내용"
              :invalid="
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
                ]?.trim() === ''
              "
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
        <fieldset class="mb-4 addDivider">
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
              class="flex-grow md:h-10"
              :invalid="localProblem.origin_source?.trim() == ''"
            />
          </div>
          <p class="flex items-center gap-2 text-xs text-black-1">
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
