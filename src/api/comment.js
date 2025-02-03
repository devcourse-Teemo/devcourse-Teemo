import { supabase } from "./index.js";

export const commentAPI = {
  /**
   * @description 문제 또는 문제집의 댓글 목록을 페이지네이션과 함께 조회
   * @param {object} params - 조회 파라미터
   * @param {number} [params.problem_id] - 문제 ID
   * @param {number} [params.workbook_id] - 문제집 ID
   * @param {number} [params.page=1] - 페이지 번호 (기본값 = 1)
   * @param {number} [params.pageSize=10] - 페이지당 댓글 수 (기본값 = 20)
   *
   * @returns {object} 댓글 목록과 페이지네이션 정보
   * @returns {Array} return.data - 댓글 데이터 배열
   * @returns {number} return.count - 전체 댓글 수
   * @returns {number} return.currentPage - 현재 페이지
   * @returns {number} return.pageSize - 페이지당 댓글 수
   * @returns {number} return.totalPages - 전체 페이지 수
   */
  async getComments({ problem_id, workbook_id, page = 1, pageSize = 20 }) {
    try {
      // 총 개수를 구하는 쿼리
      const countQuery = supabase
        .from('comment')
        .select('id', { count: 'exact' });
  
      if (problem_id) {
        countQuery.eq('problem_id', problem_id);
      } else if (workbook_id) {
        countQuery.eq('workbook_id', workbook_id);
      }
  
      // 데이터를 가져오는 쿼리
      let dataQuery = supabase
        .from('comment')
        .select(`
          *,
          author:user_info(
            id,
            email,
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
  
      if (problem_id) {
        dataQuery = dataQuery.eq('problem_id', problem_id);
      } else if (workbook_id) {
        dataQuery = dataQuery.eq('workbook_id', workbook_id);
      }
  
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
  
      // 두 쿼리를 병렬로 실행
      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery.range(from, to)
      ]);
  
      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;
  
      return {
        data: dataResult.data,
        count: countResult.count || 0,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil((countResult.count || 0) / pageSize)
      };
    } catch (error) {
      console.error('댓글 조회 중 오류:', error);
      throw error;
    }
  },
          
  /**
   * @description 새로운 댓글 생성
   * @param {object} newComment - 생성할 댓글 데이터
   * @param {number} newComment.problem_id - 문제 ID (문제집 댓글이 아닌 경우)
   * @param {number} newComment.workbook_id - 문제집 ID (문제 댓글이 아닌 경우)
   * @param {string} newComment.content - 댓글 내용
   * @returns {object} 생성된 댓글 데이터
   */
  async createComment(newComment) {
    try {
      const { data, error } = await supabase
        .from("comment")
        .insert([newComment])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 댓글 수정 (작성자만 가능)
   * @param {number} id - 댓글 ID
   * @param {object} commentData - 수정할 댓글 데이터
   * @param {string} commentData.content - 수정할 댓글 내용
   * @returns {object} 수정된 댓글 데이터
   */
  async updateComment(id, commentData) {
    try {
      const { data, error } = await supabase
        .from("comment")
        .update(commentData)
        .eq("id", id)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 댓글 삭제 (작성자만 가능)
   * @param {number} id - 댓글 ID
   * @returns {boolean} 삭제 성공 여부
   */
  async deleteComment(id) {
    try {
      const { error } = await supabase.from("comment").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 특정 사용자가 작성한 댓글 목록 조회
   * @param {string} uid - 사용자 ID
   * @param {object} [options] - 조회 옵션
   * @param {number} [options.page=1] - 페이지 번호
   * @param {number} [options.pageSize=10] - 페이지당 댓글 수
   * @returns {object} 댓글 목록과 페이지네이션 정보
   * @returns {Array} return.data - 댓글 데이터 배열
   * @returns {number} return.count - 전체 댓글 수
   * @returns {number} return.currentPage - 현재 페이지
   * @returns {number} return.pageSize - 페이지당 댓글 수
   * @returns {number} return.totalPages - 전체 페이지 수
   */
  async getByUserComment(uid, { page = 1, pageSize = 10 } = {}) {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("comment")
        .select("*", { count: "exact" })
        .eq("uid", uid)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        data,
        count,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
