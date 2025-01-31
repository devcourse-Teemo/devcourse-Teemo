<script setup>
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ProblemEditorHeader from "./components/ProblemEditorHeader.vue";
import ProblemEditorLists from "./components/ProblemEditorLists.vue";
import ProblemEditorMain from "./components/ProblemEditorMain.vue";
import ProblemEditorGuide from "./components/ProblemEditorGuide.vue";
import { reactive, onBeforeMount, ref, toRaw, watch, nextTick } from "vue";
import { problemAPI } from "@/api/problem";

const router = useRouter();

const problemEditorMain = ref(null);
const isSubmitClicked = ref(false);
const createdProblems = reactive({
  folder: { id: "", title: "문제집을 선택하세요" },
  problemLists: [],
});
const targetProblem = reactive({
  idx: -1,
  content: {},
});
const setTargetProblem = (itemIdx) => {
  targetProblem.idx = itemIdx;
  if (itemIdx === -1) {
    targetProblem.content = {};
    return;
  }
  targetProblem.content = createdProblems.problemLists[itemIdx];
};
const setProblemFolder = (folderObject) => {
  createdProblems.folder = folderObject;
};

// 데이터 입력 확인용
const invalidList = reactive({});

// 데이터 제출 validation 확인
const isSubmissionValid = () => {
  invalidList.folder = createdProblems.folder.id === "" ? false : true;
};

// 문제 리스트 업데이트 함수
const addProblem = (problemType = "4지선다") => {
  const newItem = {
    type: problemType,
    validity: {
      category: false,
      title: false,
      question: false,
      answer: false,
      origin_source: false,
    },
    isValid: false,
    visited: false,
  };
  createdProblems.problemLists.push(newItem);
  setTargetProblem(createdProblems.problemLists.length - 1);
};

const deleteProblem = () => {
  const answer = window.confirm("정말로 문제를 삭제하시겠습니까?");
  if (answer) {
    createdProblems.problemLists.splice(targetProblem.idx, 1);
    setTargetProblem(targetProblem.idx - 1);
  }
};

const updateListItem = (type, updatedContent) => {
  if (type === "TYPE") {
    createdProblems.problemLists[targetProblem.idx].type = updatedContent;
  } else if (type === "TITLE") {
    createdProblems.problemLists[targetProblem.idx].title = updatedContent;
  }
};

//문제 하나 제출
const submitProblem = (idx, content) => {
  if (!content || typeof content !== "object") {
    console.error("Invalid content provided:", content);
    return;
  }

  if (idx >= 0 && idx < createdProblems.problemLists.length) {
    const updatedProblem = {
      ...createdProblems.problemLists[idx],
      ...content,
    };
    createdProblems.problemLists.splice(idx, 1, updatedProblem);
  }
};

const submitProblems = async () => {
  // 문제 업로드
  // pageLeave에서 뒤로 가기 구분용
  isSubmitClicked.value = true;

  if (problemEditorMain.value) {
    problemEditorMain.value.submitProblem();
  }

  const hasInvalidProblems = createdProblems.problemLists.some(
    (problem) => !problem.isValid,
  );

  // inValid 문제 있는지, folder가 선택 됐는지 확인
  if (
    hasInvalidProblems ||
    createdProblems.folder.id.length === 0 ||
    createdProblems.problemLists.length === 0
  ) {
    alert(
      "🚨필수 항목이 누락되어 제출할 수 없습니다. 문제집 선택 여부와 필수항목 누락 여부를 확인해주세요!",
    );
    return;
  }

  // 없으면
  const workbookId = createdProblems.folder.id;

  const uploadPromises = createdProblems.problemLists.map(
    async (problem, idx) => {
      try {
        const categoryRaw = toRaw(problem.category);
        // time
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
        const koreaTimeDiff = 9 * 60 * 60 * 1000;
        const korNow = new Date(utc + koreaTimeDiff);

        const problemForSubmission = {
          title: problem?.title || "", // 제목
          question: problem?.question || "", // 질문
          answer: problem?.answer || "", // 정답
          explanation: problem?.explanation || "", // 풀이
          origin_source: problem?.origin_source || "", // 출처
          problem_type: problem?.type === "4지선다" ? "multiple_choice" : "ox", // 문제 유형 변환
          category_id: categoryRaw[0]?.id || 0, // 카테고리 ID 추출
          option_one: problem?.option_one || null, // 보기 1
          option_two: problem?.option_two || null, // 보기 2
          option_three: problem?.option_three || null, // 보기 3
          option_four: problem?.option_four || null, // 보기 4
          shared: problem?.shared || false, // 공개 여부
          created_at: korNow,
          updated_at: korNow,
        };
        console.log("problemForSubmission:", problemForSubmission);
        const data = await problemAPI.add(workbookId, problemForSubmission);
        console.log(data);
      } catch (error) {
        console.error(error);
      }
    },
  );

  try {
    // 모든 문제 업로드가 완료될 때까지 기다림
    const uploadResults = await Promise.allSettled(uploadPromises);

    // 실패한 문제가 있는지 확인 및 라우팅 방지
    const hasErrors = uploadResults.some(
      (result) => result.status === "rejected",
    );
    if (hasErrors) {
      alert("🚨일부 문제 제출에 실패했습니다. 다시 확인 후 제출해주세요!");
      return;
    }

    // 업로드 완료 후 홈으로 리다이렉트
    router.push("/");
  } catch (error) {
    console.error("문제 업로드 중 오류 발생:", error);
  }
};

// 제출 가능한 상태인지 확인

const onGoingBack = () => {
  window.history.length > 2 ? router.go(-1) : router.push("/");
};

onBeforeRouteLeave((to, from) => {
  // 제출 클릭한 경우 건너뛰기
  if (isSubmitClicked.value) return true;
  else {
    if (problemEditorMain.value) {
      problemEditorMain.value.submitProblem();
    }
    if (createdProblems.problemLists.length > 0) {
      const answer = window.confirm(
        "아직 제출되지 않은 문제들이 있습니다. 작성한 문제는 임시저장됩니다.",
      );
      if (answer) {
        sessionStorage.setItem(
          "createdProblems",
          JSON.stringify(createdProblems),
        );
        return true;
      }
      return false;
    }
  }
});

const getSessionData = () => {
  const storedData = sessionStorage.getItem("createdProblems"); // 변수명 변경

  if (createdProblems && storedData) {
    try {
      const answer = window.confirm(
        "저장해둔 문제가 있습니다. 불러오시겠습니까?",
      );
      if (answer) {
        const parsedData = JSON.parse(storedData); // JSON 데이터를 객체로 변환
        if (typeof parsedData === "object" && parsedData !== null) {
          Object.assign(createdProblems, parsedData); // createdProblems에 병합
        } else {
          console.warn("Parsed data is not a valid object:", parsedData);
        }
      }
      sessionStorage.removeItem("createdProblems");
    } catch (error) {
      console.error("Failed to parse sessionStorage data:", error);
    }
  }
};

setTimeout(() => {
  getSessionData();
}, 10);

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
    <ProblemEditorHeader
      :stored-folder="createdProblems.folder"
      @submit-problems="submitProblems"
      @on-going-back="onGoingBack"
      @set-problem-folder="setProblemFolder"
    />
    <div class="flex flex-row h-min-screen w-screen flex-grow">
      <ProblemEditorLists
        :target-problem="targetProblem.idx"
        :problem-list="createdProblems.problemLists"
        @add-problem="addProblem"
        @on-click-problem-list="setTargetProblem"
        class="w-2/12"
      />
      <ProblemEditorMain
        v-if="
          targetProblem.idx !== -1 && createdProblems.problemLists.length > 0
        "
        ref="problemEditorMain"
        :key="targetProblem.idx"
        :problem-idx="targetProblem.idx"
        :problem-content="targetProblem.content"
        @update-list-Item="updateListItem"
        @delete-problem="deleteProblem"
        @submit-problem="submitProblem"
      />
      <ProblemEditorGuide v-else @add-problem="addProblem" />
    </div>
  </div>
</template>
<style></style>
