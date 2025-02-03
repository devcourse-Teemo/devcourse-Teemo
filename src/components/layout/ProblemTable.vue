<script setup>
import { ref, defineProps, computed, inject } from "vue";
import {
  Button,
  Column,
  DataTable,
  Select,
  Tag,
  useToast,
  useConfirm,
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
import statusWrong from "@/assets/icons/problem-board/status-wrong.svg";
import statusSolved from "@/assets/icons/problem-board/status-solved.svg";
import checkedMyProblem from "@/assets/icons/my-problems/color-my-problems.svg";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { watch, onBeforeMount } from "vue";
import ConfirmModal from "./ConfirmModal.vue";
import ProblemSetPopUp from "./ProblemSetPopUp.vue";

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
  newTab: {
    type: Boolean,
    default: false,
  },
  workbookId: String,
});

const toast = useToast();
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

let isSortRouting = false;
const currentSort = route.query.sort === SORT.likes ? SORTS[1] : SORTS[0];

const popup = ref(null);
const sorts = ref(SORTS);
const sort = ref(currentSort);
const first = ref(0);
const rows = ref(10);
const selectedProblems = ref([]);
const showProblemSet = ref(false);
const activeFilter = ref(route.query.type || null);

const handleAddClick = () => {
  emit("open-dialog");
};
const emit = defineEmits(["open-dialog", "filter-change"]);

const handleFilterButtonClick = (filterType) => {
  if (activeFilter.value === filterType) {
    // 같은 버튼을 두 번 클릭하면 필터 해제
    activeFilter.value = null;
    emit("filter-change", "all");
    router.replace({ query: { ...route.query, type: undefined } });
  } else {
    // 새로운 필터 적용
    activeFilter.value = filterType;
    emit("filter-change", filterType);
    router.replace({ query: { type: filterType } });
  }
};

const problemAdd = inject("problemAdd");
const addedProblemDelete = inject("addedProblemDelete");
const problemDelete = inject("problemDelete");
const myProblemsDataUpdate = inject("myProblemsDataUpdate");

const ShowProblemSetPopup = () => {
  showProblemSet.value = true;
};

const showAddProblemSet = ref(false);

const addProblemToProblemSet = async (selectedProblemSet) => {
  const problemSetId = selectedProblemSet.id;
  const problemIds = selectedProblems.value.map((problem) => problem.id);
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

  selectedProblems.value = [];
};

const deleteProblem = (problem_id) => {
  confirm.require({
    group: "delete",
    header: "해당 문제를 문제집에서 제거 하시겠습니까?",
    message: "문제를 빼시려면 '제거' 버튼을 클릭하세요",
    accept: async () => {
      await workbookAPI.removeProblem(props.workbookId, problem_id);
      problemDelete();
      myProblemsDataUpdate();
    },
    reject: () => {},
  });
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

const sortedProblems = computed(() => {
  if (!props.problems) return [];

  const problems = [...props.problems];
  switch (sort.value?.value) {
    case SORT.latest:
      return problems.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    case SORT.likes:
      return problems.sort((a, b) => {
        // problem.likes_count가 있는 경우
        const aLikes = a.likes_count ?? 0;
        const bLikes = b.likes_count ?? 0;

        // problem.problem.likes[0]?.count가 있는 경우 (공유받은 문제)
        const aSharedLikes = a.likes ?? 0;
        const bSharedLikes = b.likes ?? 0;

        // 둘 중 존재하는 값 사용
        if (aLikes === bLikes && aSharedLikes === bSharedLikes) {
          return new Date(b.created_at) - new Date(a.created_at);
        } else {
          return (bLikes || bSharedLikes) - (aLikes || aSharedLikes);
        }
      });
    default:
      return problems;
  }
});

watch(
  () => route.query.status,
  () => {
    first.value = 0;
  },
);
watch(
  () => route.query.keyword,
  () => {
    first.value = 0;
  },
);
watch(
  () => route.query.startDate,
  () => {
    first.value = 0;
  },
);
watch(
  () => route.query.endDate,
  () => {
    first.value = 0;
  },
);

watch(
  () => route.query,
  () => {
    console.log(route.query);
  },
);

watch(sort, (newSort) => {
  isSortRouting = true;
  first.value = 0;
  const newQuery = { ...route.query, sort: newSort.value };
  router.replace({ query: { ...newQuery, page: 1 } });
});

watch(first, (newFirst) => {
  if (isSortRouting) {
    isSortRouting = false;
    return;
  }

  const page = newFirst / rows.value + 1;
  const newQuery = { ...route.query, page };
  router.replace({ query: newQuery });
});

onBeforeMount(async () => {
  const page = route.query.page ?? 1;
  first.value = (page - 1) * rows.value;
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
          label="다시 풀 문제"
          icon="pi pi-flag"
          size="small"
          severity="secondary"
          :class="[
            'text-sm',
            activeFilter === 'againView'
              ? '!bg-orange-3 !text-orange-500'
              : 'text-white bg-navy-4',
          ]"
          @click="handleFilterButtonClick('againView')"
        />
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
        v-model:first="first"
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
          headerStyle="min-width: 3rem"
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
        <Column
          field="latest_status"
          header="상태"
          headerStyle="min-width: 5rem"
          v-if="showStatus"
        >
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
        <Column field="title" class="w-[45%]" header="제목" v-if="!newTab">
          <template #body="slotProps">
            <div class="flex justify-between gap-6 w-full">
              <RouterLink
                :to="`${
                  slotProps.data.id === user?.id
                    ? '/my-problems'
                    : '/problem-board'
                }/${slotProps.data.id}`"
              >
                <span class="w-full cursor-pointer line-clamp-1">{{
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
        <Column field="title" class="w-[45%]" header="제목" v-if="newTab">
          <template #body="slotProps">
            <div class="flex justify-between w-full">
              <RouterLink
                target="_blank"
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
        <Column
          field="problem_type"
          header="문제 유형"
          headerStyle="min-width: 6rem"
          v-if="showCategory"
        >
          <template #body="slotProps">
            <Tag
              v-if="getProblemType(slotProps.data.problem_type) === '4지선다'"
              severity="secondary"
              value="4지선다"
            ></Tag>
            <Tag v-else value="O / X" severity="secondary"></Tag>
          </template>
        </Column>

        <Column
          field="category_name"
          header="카테고리"
          headerStyle="min-width: 9rem"
        >
          <template #body="slotProps">
            <span class="line-clamp-1">
              {{ slotProps.data.category_name }}
            </span>
          </template>
        </Column>
        <Column
          field="origin_source"
          header="출처"
          headerStyle="min-width: 9rem"
          ><template #body="slotProps">
            <span class="line-clamp-1">
              {{ slotProps.data.origin_source }}
            </span>
          </template></Column
        >
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

      <ProblemSetPopUp
        :parent-ref="popup"
        v-model:show-problem-set="showProblemSet"
        v-model:show-add-popup="showAddProblemSet"
        @clickProblemSet="addProblemToProblemSet"
        class="absolute -bottom-0 -right-[17rem]"
      />
    </div>
  </section>
  <ConfirmModal group="delete" acceptButtonName="제거" />
</template>
<style scoped>
::v-deep(.p-tag-secondary) {
  font-weight: 400;
}
</style>
