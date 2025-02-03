import { defineStore } from "pinia";
import { workbookAPI } from "@/api/workbook";

export const useWorkbookStore = defineStore("workbook", {
  state: () => ({
    workbooks: [], // 문제집 목록
    problemCounts: {}, // 문제 수 저장 { [workbookId]: count }
    sharedWorkbooks: [],
    title: "",
    description: "",
    shared: false,
    isMyBooksViewAll: false,
    isSharedBooksViewAll: false,
  }),
  actions: {
    async loadWorkbooks(userId) {
      try {
        //최신순으로 바꿈
        this.workbooks = await workbookAPI.getAllNewWorkbooks(userId);
      } catch (error) {
        console.error("문제집 데이터를 불러오는 중 오류:", error);
      }
    },

    // 특정 문제집의 문제 수 가져오기
    async fetchProblemCount(workbookId) {
      try {
        const count = await workbookAPI.getWorkbookProblemCount(workbookId);
        this.problemCounts[workbookId] = count; // 상태에 저장
      } catch (error) {
        console.error(
          `문제 수 가져오기 실패 (workbookId: ${workbookId}):`,
          error,
        );
        this.problemCounts[workbookId] = 0; // 실패 시 기본값 설정
      }
    },

    async loadSharedWorkbooks(uid) {
      try {
        this.sharedWorkbooks = await workbookAPI.fetchSharedWorkbooks(uid);
      } catch (error) {
        console.error("공유받은 문제집 불러오기 오류", error);
      }
    },

    updateWorkbook({ title, description, shared }) {
      this.title = title;
      this.description = description;
      this.shared = shared;
    },
    toggleMyBooksViewAll() {
      this.isMyBooksViewAll = !this.isMyBooksViewAll;
    },
    toggleSharedBooksViewAll() {
      this.isSharedBooksViewAll = !this.isSharedBooksViewAll;
    },
    resetViewState() {
      this.isMyBooksViewAll = false;
      this.isSharedBooksViewAll = false;
    },
    setMounted() {
      this.isMounted = true;
    },
  },

  persist: {
    enabled: true, // localStorage 자동 저장
    strategies: [
      {
        key: "workbookState",
        storage: localStorage,
        paths: ["isMyBooksViewAll", "isSharedBooksViewAll"], // 필요한 상태만 저장
      },
    ],
  },
});
