import { supabase } from "./index.js";

export const againViewProblemAPI = {
  /**
   * @description 특정 유저의 다시 볼 문제 상태 조회
   * @param {number} userId - 유저 ID
   * @returns {object | null} 다시 볼 문제 상태 데이터 또는 null
   */
  async getAllByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from("again_view_problem")
        .select(`
          problem:problem_id (
            id,
            question,
            answer,
            explanation,
            created_at,
            updated_at,
            origin_source,
            problem_type,
            title,
            category_id,
            uid,
            image_src,
            option_one,
            option_two,
            option_three,
            option_four,
            shared,
            likes:problem_like(count)
          )
        `)
        .eq("uid", userId);
  
      if (error) throw error;
  
      // 데이터 구조를 flat하게 변환
      return data.map(item => ({
        ...item.problem,
        likes: [{ count: item.problem.likes[0]?.count || 0 }]
      }));
  
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 특정 문제의 다시 볼 문제 상태 조회
   * @param {number} userId - 유저 ID
   * @param {number} problemId - 조회할 문제 ID
   * @returns {object | null} 다시 볼 문제 상태 데이터 또는 null
   */
  async getByProblemId(userId, problemId) {
    try {
      const { data, error } = await supabase
        .from("again_view_problem")
        .select("problem_id")
        .eq("problem_id", problemId)
        .eq("uid", userId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 현재 로그인한 사용자의 모든 다시 볼 문제 목록 조회
   * @returns {Array} 다시 볼 문제 목록
   */
  async getAllByCurrentUser() {
    try {
      const { data, error } = await supabase
        .from("again_view_problem")
        .select(
          `
          *,
          problem:problem(
            id,
            title,
            question,
            answer
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 다시 볼 문제로 추가
   * @param {object} newData - 추가할 다시 볼 문제 데이터
   * @param {number} newData.problem_id - 문제 ID
   * @returns {object} 생성된 다시 볼 문제 데이터
   */
  async addAgainViewProblem(newData) {
    try {
      const { data, error } = await supabase
        .from("again_view_problem")
        .insert([newData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 다시 볼 문제에서 제거
   * @param {number} userId - 유저 ID
   * @param {number} problemId - 문제 ID
   * @returns {object} 제거된 다시 볼 문제 데이터
   */
  async delete(problemId) {
    try {
      const { data, error } = await supabase
        .from("again_view_problem")
        .delete()
        .eq("problem_id", problemId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
