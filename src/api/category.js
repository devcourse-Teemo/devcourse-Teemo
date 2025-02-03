import { supabase } from "./index.js";

export const categoryAPI = {
  /**
   * @description 모든 카테고리를 조회하고 생성일 기준 내림차순으로 정렬
   * @returns {Array} 카테고리 목록과 각 카테고리에 속한 문제 수를 반환
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("category")
        .select(
          `
          *,
          problems:problem(count)
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
   * @description 카테고리 이름으로 검색하기 (부분 일치)
   * @param {string} searchTerm - 검색할 카테고리 이름
   * @returns {Array} 검색된 카테고리 목록을 생성일 기준 내림차순으로 반환
   */
  async searchByName(searchTerm) {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 새로운 카테고리 생성 (중복 검사 및 유효성 검사 포함)
   * @param {object} newData - 새로 생성할 카테고리 데이터
   * @param {string} newData.name - 카테고리 이름
   * @throws {Error} 동일한 이름의 카테고리가 이미 존재하는 경우 에러 반환
   * @throws {Error} 카테고리 이름이 비어있거나 20자를 초과하는 경우 에러 반환
   * @returns {Array} 생성된 카테고리 데이터
   */
  async createCategory(newData) {
    try {
      // 입력값 유효성 검사
      if (!newData.name || newData.name.trim() === "") {
        throw new Error("카테고리 이름을 입력해주세요.");
      }

      if (newData.name.length > 20) {
        throw new Error("카테고리 이름은 20자를 초과할 수 없습니다.");
      }

      // 1. 중복 검사
      // TODO: .single 하면 406에러 생김
      // https://github.com/supabase/supabase/issues/2395
      const { data: existing } = await supabase
        .from("category")
        .select("id")
        .eq("name", newData.name.trim())
        .maybeSingle();

      if (existing) {
        throw new Error("이미 존재하는 카테고리입니다.");
      }

      // 2. 새 카테고리 생성
      const { data, error } = await supabase
        .from("category")
        .insert([{ ...newData, name: newData.name.trim() }])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * @description 카테고리 id로 카테고리 이름 조회
   * @param {*} categoryId
   * @returns {Array} 검색된 카테고리 목록을 생성일 기준 내림차순으로 반환
   */
  async getCategoryNameById(categoryId) {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("name")
        .eq("id", categoryId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
