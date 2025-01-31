<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  defineProps,
  watchEffect,
  computed,
  inject,
} from "vue";
import {
  Button,
  Column,
  DataTable,
  Select,
  Tag,
  InputText,
  Listbox,
  Textarea,
  useToast,
  ToggleSwitch,
} from "primevue";
import { storeToRefs } from "pinia";
import { RouterLink } from "vue-router";
import { problemAPI } from "@/api/problem";
import { SORT, SORTS } from "@/const/sorts";
import EmptyText from "./EmptyText.vue";
import { workbookAPI } from "@/api/workbook";
import { useAuthStore } from "@/store/authStore";
import plus from "@/assets/icons/problem-board/plus.svg";
import minus from "@/assets/icons/problem-board/minus.svg";
import sharedIcon from "@/assets/icons/my-problem-sets/share.svg";
import statusWrong from "@/assets/icons/problem-board/status-wrong.svg";
import statusSolved from "@/assets/icons/problem-board/status-solved.svg";
import seeMyProblems from "@/assets/icons/my-problems/see-my-problems.svg";
import checkedMyProblem from "@/assets/icons/my-problems/color-my-problems.svg";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { watch } from "vue";

const props = defineProps({
  problems: {
    type: Array,
    required: true,
  },
  showCheckbox: {
    type: Boolean,
    default: true,
  },
  showDelete: {
    type: Boolean,
    default: false,
  },
  showMinus: {
    type: Boolean,
    default: false,
  },
  showProblem: {
    type: Boolean,
    default: true,
  },
  showMyProblem: {
    type: Boolean,
    default: true,
  },
  showSharedProblem: {
    type: Boolean,
    default: true,
  },
  showAdd: {
    type: Boolean,
    default: false,
  },
  showCategory: {
    type: Boolean,
    default: true,
  },
  showPlus: {
    type: Boolean,
    default: false,
  },
  showSelect: {
    type: Boolean,
    default: true,
  },
  showCount: {
    type: Boolean,
    default: true,
  },
  showStatus: {
    type: Boolean,
    default: true,
  },
  workbookId: String,
});

const route = useRoute();
const router = useRouter();
const popup = ref(null);
const sorts = ref(SORTS);
const currentSort = route.query.sort === SORT.likes ? SORTS[1] : SORTS[0];
const sort = ref(currentSort);
const problemSets = ref([]);
const title = ref("");
const description = ref("");
const shared = ref(false);
const selectedProblems = ref([]);
const showProblemSet = ref(false);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const toast = useToast();

const handleAddClick = () => {
  emit("open-dialog");
};
const emit = defineEmits(["open-dialog"]);

const problemAdd = inject("problems");
const addedProblemDelete = inject("problems");

const ShowProblemSetPopup = () => {
  showProblemSet.value = true;
};

const showAddProblemSet = ref(false);
const showAddProblemSetPopup = () => {
  showAddProblemSet.value = true;
};

const addProblemToProblemSet = async (problemSetId, problems) => {
  const problemIds = problems.map((problem) => problem.id);
  const { data, insertedCount } = await problemAPI.addMultiple(
    problemSetId,
    problemIds,
  );
  if (data) {
    toast.add({
      severity: "success",
      summary: "문제 추가 완료",
      detail: `해당 문제집에 새로운 문제 ${insertedCount}개가 추가되었습니다.`,
      life: 3000,
    });
  } else {
    toast.add({
      severity: "error",
      summary: "문제 추가 실패",
      detail: "문제 추가 중 오류가 발생했습니다.",
      life: 3000,
    });
  }

  if (showProblemSet.value) showProblemSet.value = false;
  if (showAddProblemSet.value) showAddProblemSet.value = false;
  selectedProblems.value = [];
};

const addProblemSet = async () => {
  const problemSet = await workbookAPI.add(
    title.value,
    description.value,
    shared.value,
  );
  problemSets.value = [...problemSets.value, problemSet];
  showAddProblemSet.value = false;
};

const deleteProblem = async (problem_id) => {
  const realDelete = confirm("문제집에서 해당 문제를 빼시겠습니까?");
  if (realDelete) {
    await workbookAPI.removeProblem(props.workbookId, problem_id);
    router.go(0);
  }
  return;
};
const getStatus = (status) => {
  switch (status) {
    case "corrected":
      return statusSolved;
    case "wrong":
      return statusWrong;
    default:
      return "";
  }
};
const getProblemType = (problemType) => {
  switch (problemType) {
    case "multiple_choice":
      return "4지선다";
    case "ox":
      return "O/X";
    default:
      return "";
  }
};

const messageStatus = (status) => {
  switch (status) {
    case "corrected":
      return "맞힌 문제";
    case "wrong":
      return "틀린 문제";
    default:
      return "없음";
  }
};
const handleClickOutside = (event) => {
  if (popup?.value && !popup?.value.contains(event.target)) {
    if (showProblemSet.value) showProblemSet.value = false;
    if (showAddProblemSet.value) showAddProblemSet.value = false;
  }
};

const sortedProblems = computed(() => {
  if (!props.problems) return [];

  const problems = [...props.problems];
  switch (sort.value?.value) {
    case SORT.latest:
      return problems.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    case SORT.likes:
      return problems.sort((a, b) => b.likes_count - a.likes_count);
    default:
      return problems;
  }
});

watch(sort, (newSort) => {
  const newQuery = { ...route.query, sort: newSort.value };
  router.push({ query: newQuery });
});

watchEffect(async () => {
  if (!user.value) return;
  problemSets.value = await workbookAPI.getAll(user.value.id);
});

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", handleClickOutside);
});
</script>
<template>
  <section class="flex flex-col gap-[18px] w-full relative">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <p class="text-xl font-semibold" v-if="showCount">
          {{ problems?.length }} 문제
        </p>
        <Button
          v-if="showProblem"
          label="다시 볼 문제"
          icon="pi pi-flag"
          icon-class="color: white;"
          size="small"
          severity="secondary"
          class="text-sm text-white bg-navy-4"
        />
        <Button
          v-if="showMyProblem"
          label="내 문제만 보기"
          size="small"
          severity="secondary"
          class="text-sm text-white bg-navy-4"
        >
          <template #icon>
            <img :src="seeMyProblems" alt="seeMyProblemsIcon" class="w-5 h-5" />
          </template>
        </Button>
        <Button
          v-if="showSharedProblem"
          label="공유한 문제"
          size="small"
          severity="secondary"
          class="text-sm text-white bg-navy-4"
        >
          <template #icon>
            <img :src="sharedIcon" alt="sharedIcon" class="w-5 h-5" />
          </template>
        </Button>
        <button
          v-if="showAdd"
          @click="handleAddClick"
          class="bg-navy-4 text-white rounded-3xl w-[74px] h-6 item-middle"
        >
          추가하기
        </button>
      </div>
      <Select
        v-if="showSelect"
        v-model="sort"
        :options="sorts"
        optionLabel="name"
        class="w-40"
      />
    </div>

    <!-- 테이블 -->
    <div class="overflow-hidden border border-black-5 rounded-2xl">
      <DataTable
        v-model:selection="selectedProblems"
        :value="sortedProblems"
        dataKey="id"
        paginator
        :rows="10"
      >
        <!-- 검색 결과가 없는 경우 -->
        <template #empty>
          <EmptyText class="py-6">검색된 문제가 없습니다...</EmptyText>
        </template>

        <!-- 체크박스 선택 -->
        <Column
          v-if="showCheckbox"
          selectionMode="multiple"
          headerStyle="width: 3rem"
        ></Column>
        <Column v-if="showDelete" header="제거" field="delete">
          <template #body="slotProps">
            <button @click="deleteProblem(slotProps.data.id)">
              <img :src="minus" alt="문제 제거" />
            </button>
          </template>
        </Column>
        <Column v-if="showPlus" header="추가" field="plus">
          <template #body="slotProps">
            <button @click="problemAdd(slotProps.data)">
              <img :src="plus" alt="문제 추가" />
            </button>
          </template>
        </Column>
        <Column v-if="showMinus" header="빼기" field="minus">
          <template #body="slotProps">
            <button @click="addedProblemDelete(slotProps.data)">
              <img :src="minus" alt="넣은 문제 빼기" />
            </button>
          </template>
        </Column>
        <Column field="latest_status" header="상태" v-if="showStatus">
          <template #body="slotProps">
            <div
              v-if="slotProps.data.latest_status"
              class="w-fit"
              v-tooltip.top="messageStatus(slotProps.data.latest_status)"
            >
              <img
                v-if="getStatus(slotProps.data.latest_status) !== ''"
                :src="getStatus(slotProps.data.latest_status)"
                alt="상태 아이콘"
              />
            </div>
          </template>
        </Column>
        <Column field="title" class="w-[45%]" header="제목">
          <template #body="slotProps">
            <div class="flex justify-between w-full">
              <RouterLink
                :to="`${
                  slotProps.data.id === user?.id
                    ? '/my-problems'
                    : '/problem-board'
                }/${slotProps.data.id}`"
              >
                <span class="w-full cursor-pointer">{{
                  slotProps.data.title
                }}</span>
              </RouterLink>
              <img
                v-if="slotProps.data.uid === user?.id"
                :src="checkedMyProblem"
                alt="checkedMyProblemIcon"
                class="w-5 h-5"
                v-tooltip.top="'내가 만든 문제'"
              />
            </div>
          </template>
        </Column>
        <Column field="problem_type" header="문제 유형" v-if="showCategory">
          <template #body="slotProps">
            <Tag
              v-if="getProblemType(slotProps.data.problem_type) === '4지선다'"
              severity="secondary"
              value="4지선다"
            ></Tag>
            <Tag v-else value="O / X" severity="secondary"></Tag>
          </template>
        </Column>

        <Column field="category_name" header="카테고리">
          <template #body="slotProps">
            {{ slotProps.data.category_name }}
          </template>
        </Column>
        <Column field="origin_source" header="출처"></Column>
      </DataTable>
    </div>

    <!-- 팝업 -->
    <div class="h-24"></div>
    <div ref="popup" class="absolute bottom-0 -translate-x-1/2 left-1/2">
      <Button
        v-if="selectedProblems.length"
        type="button"
        :label="`문제집에 ${selectedProblems.length}문제 추가하기`"
        icon="pi pi-folder"
        @click="ShowProblemSetPopup"
      />

      <div v-if="showProblemSet" class="w-64 absolute -bottom-0 -right-[17rem]">
        <Listbox
          :key="problemSets.length"
          :options="problemSets"
          filter
          optionLabel="title"
          listStyle="max-height: 14rem"
        >
          <template #option="slotProps">
            <div
              class="flex items-center w-full gap-2"
              @click="
                addProblemToProblemSet(slotProps.option.id, selectedProblems)
              "
            >
              <i class="pi pi-folder"></i>
              <div>{{ slotProps.option.title }}</div>
            </div>
          </template>
        </Listbox>
        <Button
          label="새로운 문제집 만들기"
          icon="pi pi-plus"
          class="w-[14.4rem]"
          @click="showAddProblemSetPopup"
        />
      </div>

      <div
        v-if="showAddProblemSet"
        class="w-64 absolute bottom-0 -right-[34rem]"
      >
        <div class="flex flex-col gap-4 px-4 py-2 bg-white border rounded-lg">
          <div class="flex flex-col gap-2">
            <label for="title" class="text-sm">문제집 이름</label>
            <InputText
              id="title"
              v-model="title"
              placeholder="문제집 이름을 입력해주세요"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="description" class="text-sm">문제집 설명</label>
            <Textarea
              v-model="description"
              id="description"
              class="border rounded-md resize-none font-sans px-2 py-1.5"
              rows="5"
              cols="30"
              placeholder="문제집 설명을 입력해주세요"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="shared" class="text-sm">게시판 공유 여부</label>
            <ToggleSwitch id="shared" v-model="shared" />
          </div>
        </div>
        <Button
          @click="addProblemSet"
          label="문제집 추가하기"
          icon="pi pi-plus"
          class="w-[14.4rem]"
        />
      </div>
    </div>
  </section>
</template>
<style scoped>
::v-deep(.p-tag-secondary) {
  font-weight: 400;
}
</style>
