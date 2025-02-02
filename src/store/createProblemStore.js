import { defineStore } from "pinia";

export const useCreateProblemStore = defineStore("createProblem", {
  state: () => ({
    createdProblems: {
      folder: { id: "", title: "문제집을 선택하세요" },
      problemLists: [],
    },
    targetProblem: {
      idx: -1,
      content: {},
    },
    problemSets: [],
    selectedProblemSet: {},
  }),
  actions: {
    //Main 함수
    setProblemFolder(folderObject) {
      console.log("setProblemFolder", folderObject);
      Object.assign(this.createdProblems.folder, folderObject); // 기존 객체를 직접 수정
    },

    addProblem(problemType = "4지선다") {
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
      this.createdProblems.problemLists.push(newItem);
      this.setTargetProblem(this.createdProblems.problemLists.length - 1);
    },
    setTargetProblem(itemIdx) {
      this.targetProblem.idx = itemIdx;
      if (itemIdx === -1) {
        this.targetProblem.content = {};
        return;
      }
      this.targetProblem.content = this.createdProblems.problemLists[itemIdx];
    },
    deleteProblem() {
      if (this.targetProblem.idx !== -1) {
        this.createdProblems.problemLists.splice(this.targetProblem.idx, 1);
        this.setTargetProblem(this.targetProblem.idx - 1);
      }
    },
    updateListItem(type, updatedContent) {
      if (this.targetProblem.idx === -1) return;

      const problem = this.createdProblems.problemLists[this.targetProblem.idx];
      if (!problem) return;

      if (type === "TYPE") {
        problem.type = updatedContent;
      } else if (type === "TITLE") {
        problem.title = updatedContent;
      }
    },
    submitProblem(idx, content) {
      if (!content || typeof content !== "object") {
        console.error("Invalid content provided:", content);
        return;
      }

      if (idx >= 0 && idx < this.createdProblems.problemLists.length) {
        const updatedProblem = {
          ...this.createdProblems.problemLists[idx],
          ...content,
        };
        this.createdProblems.problemLists.splice(idx, 1, updatedProblem);
      }
      console.log(idx, content);
    },
  },
  persist: {
    enabled: true,
    storage: sessionStorage,
    pick: ["createdProblems", "targetProblem"],
  },
});
