<script setup>
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ProblemEditorHeader from "./components/ProblemEditorHeader.vue";
import ProblemEditorLists from "./components/ProblemEditorLists.vue";
import ProblemEditorMain from "./components/ProblemEditorMain.vue";
import ProblemEditorGuide from "./components/ProblemEditorGuide.vue";
import { reactive, onBeforeMount, ref, toRaw, watch, nextTick } from "vue";
import { problemAPI } from "@/api/problem";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";
import { useCreateProblemStore } from "@/store/createProblemStore";
import { storeToRefs } from "pinia";

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const isSubmitClicked = ref(false);

const createProblemStore = useCreateProblemStore();
const { targetProblem, createdProblems } = storeToRefs(createProblemStore);
const currentIdx = ref(targetProblem.value.idx);
const problemLength = ref(createdProblems.value.problemLists.length);

// const createdProblems = reactive({
//   folder: { id: "", title: "문제집을 선택하세요" },
//   problemLists: [],
// });
// const targetProblem = reactive({
//   idx: -1,
//   content: {},
// });

// const setTargetProblem = (itemIdx) => {
//   targetProblem.idx = itemIdx;
//   if (itemIdx === -1) {
//     targetProblem.content = {};
//     return;
//   }
//   targetProblem.content = createdProblems.problemLists[itemIdx];
// };

// const setProblemFolder = (folderObject) => {
//   createdProblems.folder = folderObject;
// };

// // 문제 리스트 업데이트 함수
// const addProblem = (problemType = "4지선다") => {
//   const newItem = {
//     type: problemType,
//     validity: {
//       category: false,
//       title: false,
//       question: false,
//       answer: false,
//       origin_source: false,
//     },
//     isValid: false,
//     visited: false,
//   };
//   createdProblems.problemLists.push(newItem);
//   setTargetProblem(createdProblems.problemLists.length - 1);
// };

const deleteProblem = () => {
  confirm.require({
    message: "정말로 문제를 삭제하시겠습니까?",
    header: "문제 삭제 확인",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "삭제",
    rejectLabel: "취소",
    acceptClass: "p-button-danger",
    accept: () => {
      createProblemStore.deleteProblem();
    },
  });
};

// const updateListItem = (type, updatedContent) => {
//   if (type === "TYPE") {
//     createdProblems.problemLists[targetProblem.idx].type = updatedContent;
//   } else if (type === "TITLE") {
//     createdProblems.problemLists[targetProblem.idx].title = updatedContent;
//   }
// };

// //문제 하나 제출
// const submitProblem = (idx, content) => {
//   if (!content || typeof content !== "object") {
//     console.error("Invalid content provided:", content);
//     return;
//   }

//   if (idx >= 0 && idx < createdProblems.problemLists.length) {
//     const updatedProblem = {
//       ...createdProblems.problemLists[idx],
//       ...content,
//     };
//     createdProblems.problemLists.splice(idx, 1, updatedProblem);
//   }
// };

const submitProblems = async () => {
  isSubmitClicked.value = true;

  const hasInvalidProblems = createdProblems.value.problemLists.some(
    (problem) => !problem.isValid,
  );

  if (hasInvalidProblems || createdProblems.value.problemLists.length === 0) {
    toast.add({
      severity: "error",
      summary: "문제 생성 실패",
      detail:
        "필수 항목이 누락되어 제출할 수 없습니다.\n문제집 선택 여부와 필수항목 누락 여부를 확인해주세요.",
      life: 4000,
    });
    return;
  }

  const workbookId = createdProblems.value.folder.id;

  const uploadPromises = createdProblems.value.problemLists.map(
    async (problem, idx) => {
      try {
        const categoryRaw = toRaw(problem.category);
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
        const koreaTimeDiff = 9 * 60 * 60 * 1000;
        const korNow = new Date(utc + koreaTimeDiff);

        const problemForSubmission = {
          title: problem?.title || "",
          question: problem?.question || "",
          answer: problem?.answer || "",
          explanation: problem?.explanation || "",
          origin_source: problem?.origin_source || "",
          problem_type: problem?.type === "4지선다" ? "multiple_choice" : "ox",
          category_id: categoryRaw[0]?.id || 0,
          option_one: problem?.option_one || null,
          option_two: problem?.option_two || null,
          option_three: problem?.option_three || null,
          option_four: problem?.option_four || null,
          shared: problem?.shared || false,
          created_at: korNow,
          updated_at: korNow,
        };

        console.log("problemForSubmission:", problemForSubmission);
        const data = await problemAPI.add(workbookId, problemForSubmission);
        console.log(data);
        return {
          success: true,
          problemTitle: problem?.title || `문제 ${idx + 1}`,
        };
      } catch (error) {
        console.error(
          `문제 제출 실패 (제목: ${problem?.title || "제목 없음"}):`,
          error,
        );
        return {
          success: false,
          problemTitle: problem?.title || `문제 ${idx + 1}`,
        };
      }
    },
  );

  try {
    const uploadResults = await Promise.allSettled(uploadPromises);

    // 실패한 문제 찾기
    const failedProblems = uploadResults
      .filter(
        (result) => result.status === "fulfilled" && !result.value.success,
      )
      .map((result) => result.value.problemTitle);

    if (failedProblems.length > 0) {
      throw new Error(
        `🚨 ${
          failedProblems.length
        }개의 문제가 제출되지 않았습니다: ${failedProblems.join(", ")}`,
      );
    }

    toast.add({
      severity: "success",
      summary: "문제 제출 완료",
      detail: "모든 문제가 성공적으로 제출되었습니다!",
      life: 4000,
    });
    router.push("/my-problems");
    createProblemStore.$reset();
    sessionStorage.removeItem("createProblem");
  } catch (error) {
    console.error("문제 업로드 중 오류 발생:", error);
    toast.add({
      severity: "error",
      summary: "문제 제출 중 오류 발생",
      detail:
        error.message ||
        "🚨 서버 오류가 발생했습니다. 나중에 다시 시도해주세요.",
      life: 5000,
    });
  }
};

const onGoingBack = () => {
  window.history.length > 2 ? router.go(-1) : router.push("/");
};

onBeforeRouteLeave((to, from, next) => {
  console.log("onbeforeRouterLeave");

  // 제출 클릭한 경우 건너뛰기
  if (isSubmitClicked.value) return;
  else {
    if (createdProblems.value.problemLists.length > 0) {
      return new Promise((resolve) => {
        confirm.require({
          message:
            "아직 제출되지 않은 문제들이 있습니다. 작성한 문제는 임시 저장됩니다.",
          header: "페이지 나가기 확인",
          icon: "pi pi-exclamation-circle",
          acceptLabel: "저장 후 나가기",
          rejectLabel: "취소",
          accept: () => {
            // sessionStorage.setItem(
            //   "createdProblem",
            //   JSON.stringify(createdProblems.value),
            // );
            // 페이지 이동 허용
            confirm.close(); 
            next(true);
          },
          reject: () => {
            toast.add({
              severity: "info",
              summary: "이동 취소",
              detail: "페이지 이동이 취소되었습니다.",
              life: 3000,
            });
            // 페이지 이동 취소
            confirm.close(); 
            next(false);
          },
        });
      });
    } else {
      return;
    }
  }
});

// const getSessionData = () => {
//   const storedData = sessionStorage.getItem("createdProblems");

//   if (storedData) {
//     confirm.require({
//       message: "저장된 문제가 있습니다. 불러오시겠습니까?",
//       header: "문제 복원",
//       icon: "pi pi-refresh",
//       acceptLabel: "불러오기",
//       rejectLabel: "삭제",
//       accept: () => {
//         try {
//           const parsedData = JSON.parse(storedData);
//           if (typeof parsedData === "object" && parsedData !== null) {
//             Object.assign(createdProblems, parsedData);
//           } else {
//             console.warn("복원할 데이터가 올바르지 않습니다:", parsedData);
//           }
//         } catch (error) {
//           console.error("문제 복원 중 오류 발생:", error);
//         }
//         sessionStorage.removeItem("createdProblems");
//       },
//       reject: () => {
//         sessionStorage.removeItem("createdProblems");
//         toast.add({
//           severity: "info",
//           summary: "저장된 문제 삭제",
//           detail: "임시 저장된 문제가 삭제되었습니다.",
//           life: 3000,
//         });
//       },
//     });
//   }
// };

// setTimeout(() => {
//   getSessionData();
// }, 10);

// 새로운 문제로 이동시 -> 스크롤 상단 고정
watch(
  () => targetProblem.idx,
  async () => {
    await nextTick(); // Vue가 DOM을 업데이트할 때까지 기다림
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" }); // 상단으로 스크롤 이동
  },
);
</script>
<template>
  <div class="flex flex-col h-screen w-full">
    <!-- Confirm 창 -->
    <ConfirmDialog />
    <!-- <ProblemEditorHeader
      :stored-folder="createdProblems.folder"
      @submit-problems="submitProblems"
      @on-going-back="onGoingBack"
      @set-problem-folder="setProblemFolder"
    /> -->
    <ProblemEditorHeader
      @submit-problems="submitProblems"
      @on-going-back="onGoingBack"
    />
    <div class="flex flex-row h-min-screen w-screen flex-grow">
      <!-- <ProblemEditorLists
        :target-problem="targetProblem.idx"
        :problem-list="createdProblems.problemLists"
        @add-problem="addProblem"
        @on-click-problem-list="setTargetProblem"
        class="w-2/12"
      /> -->
      <ProblemEditorLists class="w-2/12" />
      <ProblemEditorMain
        v-if="targetProblem.idx !== -1"
        :key="targetProblem.idx"
        :problem-idx="targetProblem.idx"
        :problem-content="targetProblem.content"
        @delete-problem="deleteProblem"
      />
      <!-- <ProblemEditorMain
        v-if="
          targetProblem.idx !== -1 && createdProblems.problemLists.length > 0
        "
        :key="targetProblem.idx"
        ref="problemEditorMain"
      /> -->
      <ProblemEditorGuide v-else />
    </div>
  </div>
</template>
<style></style>
