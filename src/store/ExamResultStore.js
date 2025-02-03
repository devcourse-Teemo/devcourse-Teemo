import { defineStore } from "pinia";
import { testResultAPI } from "@/api/testResult";
import { fetchProblemsForTestResult } from "@/api/workbookProblem";
import { problemHistoryAPI } from "@/api/problemHistory";
import { againViewProblemAPI } from "@/api/againViewProblem";

export const useExamResultStore = defineStore("examResult", {
  state: () => ({
    totalCount: 0, // 총 문제 수
    correctCount: 0, // 정답 수
    averageCount: 0, // 평균 점수
    testCenterId: 0, // 시험장 ID
    isTableData: [], // 점수 테이블 데이터
    problems: [], //문제 데이터
    currentProblem: null, //선택된 문제
    columns: 10, // 테이블 열 크기
    workbooks: [], //시험장 문제집 정보

    againViewProblems: [],
    isLoading: false, // 로딩 상태
    error: null, // 에러 메시지
    isInitializing: false,
    isFetchingProblems: false, //상태관리를 위한 변수들
    isFetchingWorkbook: false,
    isGetScores: false,
    isMyOption: false,
    myOption: [],
    status: [],
  }),
  getters: {
    rows: (state) => Math.ceil(state.problems.length / state.columns),

    tableData: (state) => {
      const data = [];
      for (let i = 0; i < state.rows; i++) {
        data.push(
          state.problems.slice(i * state.columns, (i + 1) * state.columns),
        );
      }
      return data;
    },
  },

  actions: {
    //시험점수 가져오기
    async initializeExamData(uid, testResultId) {
      console.log("테스트테스트", { uid, testResultId });
      if (this.isInitializing) {
        this.isInitializing = false;
      }
      this.isInitializing = true;
      try {
        // uid 및 testResultId 유효성 검사
        if (!uid || !testResultId) {
          console.error("유효하지 않은 uid 또는 testResultId:", {
            uid,
            testResultId,
          });
          return;
        }
        console.log("testResultAPI.getScore 호출");
        // 점수 데이터 호출
        const { total, correct } = await testResultAPI.getScore(
          testResultId,
          uid,
        );
        console.log("testResultAPI.getScore 응답:", { total, correct });
        // 상태 업데이트
        this.totalCount = total;
        this.correctCount = correct;

        const average = await testResultAPI.getAverage(testResultId);
        this.averageCount = average;
      } catch (error) {
        console.error("데이터 초기화 중 오류 발생:", error);
      } finally {
        this.isInitializing = false;
      }
    },

    // 시험장 사용자 점수 가져오기
    async getScoresByTestCenter(testCenterId) {
      if (this.isGetScores) return;
      this.isGetScores = true;

      try {
        if (!testCenterId) {
          this.error = "유효하지 않은 시험장 ID입니다.";
          console.error("유효하지 않은 testCenterId:", testCenterId);
          return;
        }
        // Supabase API 호출
        const data = await testResultAPI.getUsersScores(testCenterId);

        if (!data || data.length === 0) {
          console.warn("해당 시험장에 데이터가 없습니다:", testCenterId);
          this.isTableData = [];
          return;
        }

        // Supabase에서 반환된 데이터 매핑
        this.isTableData = data.map((result) => ({
          uid: result.uid,
          userName: result.name,
          correct_count: result.correct_count,
          test_center_id: result.test_center_id,
        }));
      } catch (error) {
        console.error("시험장 사용자 점수 가져오기 오류:", error);
        this.error =
          error.message || "데이터를 가져오는 중 오류가 발생했습니다.";
      } finally {
        this.isGetScores = false;
      }
    },

    // 문제 정보 가져오기
    async fetchProblems(testResultId) {
      if (this.isFetchingProblems) {
        this.isFetchingProblems = false;
      }

      if (!testResultId) {
        console.error("fetchProblems: Invalid testResultId");
        this.error = "Invalid testResultId";
        return;
      }
      this.isFetchingProblems = true;
      try {
        //workbookProblem에서 바로 export중
        const fetchedProblems = await fetchProblemsForTestResult(testResultId);

        if (!fetchedProblems || fetchedProblems.length === 0) {
          this.error = "No problems found for the given testResultId.";
          return;
        }

        // 문제 데이터 정렬 및 추가 필드 생성
        // problem_id 순서대로 정렬
        // this.problems = fetchedProblems
        //   .sort((a, b) => a.id - b.id)
        //   .map((problem, index) => ({
        //     ...problem,
        //     number: index + 1,
        //     flagged: false,}))

        // 문제 데이터 정렬 및 추가 필드 생성
        this.problems = [...fetchedProblems]
          .reverse()
          .map((problem, index) => ({
            ...problem,
            number: index + 1, // 문제 번호 추가
            flagged: false, // 플래그 상태 초기화
          }));

        // 첫 번째 문제 설정
        this.currentProblem =
          this.problems.length > 0 ? this.problems[0] : null;
      } catch (err) {
        console.error("fetchProblems: 로딩에 실패함", err);
        this.error = `문제를 불러오는 데 실패했습니다: ${err.message}`;
      } finally {
        this.isFetchingProblems = false;
        this.error = null;
      }
    },

    //내가고른 선택지
    async fetchMyOption(testResultId, userId) {
      if (!testResultId) {
        console.error("fetchProblems: testResultId가 정의되지 않았습니다.");
        return;
      }

      try {
        const testCenterData = await problemHistoryAPI.getTestCenterId(
          testResultId,
          userId,
        );
        if (!testCenterData) {
          console.error("fetchProblems: test_center_id를 가져오지 못했습니다.");
          return;
        }

        const { test_center_id } = testCenterData;

        const problemHistory = await problemHistoryAPI.getProblemHistory(
          test_center_id,
          userId,
        );
        if (!problemHistory) {
          console.error(
            "fetchProblems: problem_history 데이터를 가져오지 못했습니다.",
          );
          return;
        }

        this.myOption = problemHistory.map((item) => ({
          problem_id: item.problem_id,
          my_option: item.my_option,
        }));

        this.status = problemHistory.map((item) => ({
          problem_id: item.problem_id,
          status: item.status,
        }));
      } catch (error) {
        console.error("fetchProblems 에러:", error);
      }
    },

    //다시볼문제 함수들

    async checkAgainViewStatus(userId, problemId) {
      if (!userId || !problemId) return;
      try {
        const result = await againViewProblemAPI.getByProblemId(
          userId,
          problemId,
        );
        if (result.length > 0) {
          // "다시 풀 문제"로 설정
          if (!this.againViewProblems.includes(problemId)) {
            this.againViewProblems.push(problemId); // 배열에 추가
          }
        } else {
          // "다시 풀 문제"에서 제거
          const index = this.againViewProblems.indexOf(problemId);
          if (index !== -1) {
            this.againViewProblems.splice(index, 1); // 배열에서 제거
          }
        }
      } catch (error) {
        console.error("다시 풀 문제 상태 확인 실패:", error);
      }
    },

    async toggleFlag(problemId, userId, toast) {
      if (!userId || !problemId) {
        console.warn("toggleFlag: 유효하지 않은 userId 또는 problemId");
        return;
      }

      try {
        const isCurrentlyFlagged = this.againViewProblems.includes(problemId);

        if (!isCurrentlyFlagged) {
          this.againViewProblems.push(problemId);
          await againViewProblemAPI.addAgainViewProblem({
            uid: userId,
            problem_id: problemId,
          });
          toast?.add({
            severity: "success",
            summary: "다시 풀 문제 추가",
            detail: "다시 풀 문제로 추가되었습니다.",
            life: 3000,
          });
        } else {
          this.againViewProblems = this.againViewProblems.filter(
            (id) => id !== problemId,
          );
          await againViewProblemAPI.delete(problemId);
          toast?.add({
            severity: "info",
            summary: "다시 풀 문제 해제",
            detail: "다시 풀 문제가 해제되었습니다.",
            life: 3000,
          });
        }
      } catch (error) {
        console.error("플래그 상태 토글 중 오류 발생:", error);
        toast?.add({
          severity: "error",
          summary: "오류 발생",
          detail: "플래그 상태를 업데이트할 수 없습니다.",
          life: 3000,
        });
      }
    },

    async toggleAgainViewProblem(userId, problemId, toast) {
      if (!problemId) {
        console.warn("문제 ID가 유효하지 않습니다.");
        return;
      }

      const problem = this.problems.find((p) => p.id === problemId);
      if (!problem) {
        console.warn(
          "toggleAgainViewProblem: 해당 problemId를 찾을 수 없습니다.",
        );
        return;
      }

      try {
        const isCurrentlyFlagged = this.againViewProblems.includes(problemId);

        if (isCurrentlyFlagged) {
          await againViewProblemAPI.delete(problemId);
          this.againViewProblems = this.againViewProblems.filter(
            (id) => id !== problemId,
          );
          problem.flagged = false;
          toast?.add({
            severity: "info",
            summary: "다시 풀 문제 해제",
            detail: "다시 풀 문제가 해제되었습니다.",
            life: 3000,
          });
        } else {
          await againViewProblemAPI.addAgainViewProblem({
            uid: userId,
            problem_id: problemId,
          });
          this.againViewProblems.push(problemId);
          problem.flagged = true;
          toast?.add({
            severity: "success",
            summary: "다시 풀 문제 추가",
            detail: "다시 풀 문제로 추가되었습니다.",
            life: 3000,
          });
        }
      } catch (error) {
        console.error("다시 풀 문제 토글 실패:", error);
        toast?.add({
          severity: "error",
          summary: "오류 발생",
          detail: "다시 풀 문제를 업데이트할 수 없습니다.",
          life: 3000,
        });
      }
    },

    async selectProblem(problemId, userId) {
      const problem = this.problems.find((p) => p.id === problemId);
      if (!problem) {
        console.warn("selectProblem: 해당 problemId를 찾을 수 없습니다.");
        return;
      }

      this.currentProblem = problem;

      // 현재 문제가 "다시 풀 문제"인지 상태를 업데이트
      if (problemId && userId) {
        try {
          await this.checkAgainViewStatus(userId, problemId);
        } catch (error) {
          console.error("checkAgainViewStatus 호출 중 오류 발생:", error);
        }
      }
    },

    //시험장 문제집 정보
    async fetchAndStoreWorkbook(testResultId) {
      if (this.isFetchingWorkbook) {
        console.warn("fetchworkbook 중복호출 방지");
        return;
      }

      if (!testResultId) {
        console.error("[ERROR] Invalid testResultId:", testResultId);
        return;
      }
      this.isFetchingWorkbook = true;
      try {
        const workbook = await testResultAPI.fetchWorkbookFromTestResult(
          testResultId,
        );
        if (workbook) {
          this.workbooks = [
            {
              id: workbook.id,
              title: workbook.title,
              description: workbook.description,
            },
          ];
        } else {
          console.warn("Workbook not found for testResultId:", testResultId);
        }
      } catch (error) {
        console.error("Error fetching workbook:", error);
      } finally {
        this.isFetchingWorkbook = false;
      }
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: "examResult",
        storage: localStorage,
        paths: [
          "totalCount",
          "correctCount",
          "averageCount",
          "testCenterId",
          "problems",
          "currentProblem",
          "myOption",
          "status",
          "againViewProblems",
        ],
      },
    ],
  },
});
