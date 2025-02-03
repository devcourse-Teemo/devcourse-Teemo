import { supabase } from ".";

// CREATE
const add = async (uid, problem_id) => {
  const { data } = await supabase.from("problem_like").insert([{ uid, problem_id }]).select();
};

// READ
const getUid = async (uid) => {
  await supabase.from("problem_like").select("problem_id").eq("uid", uid);
};

// 좋아요 추가/제거 토글
const toggle = async (uid, problem_id) => {
  try {
    const { data: existing, error: checkError } = await supabase
      .from("problem_like")
      .select("*")
      .eq("uid", uid)
      .eq("problem_id", problem_id);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      await supabase
        .from("problem_like")
        .delete()
        .eq("uid", uid)
        .eq("problem_id", problem_id);
      return { isLiked: false, count: -1 };
    } else {
      await supabase
        .from("problem_like")
        .insert([{ uid, problem_id }]);
      return { isLiked: true, count: 1 };
    }
  } catch (error) {
    throw error;
  }
};

// 특정 문제의 좋아요 수 조회
const getLikeCount = async (problem_id) => {
  const { count } = await supabase
    .from("problem_like")
    .select("*", { count: "exact" })
    .eq("problem_id", problem_id);
  return count;
}

// 사용자의 좋아요 상태 확인
const getUserLikeStatus = async (uid, problem_id) => {
  const { data, error } = await supabase
    .from("problem_like")
    .select("*")
    .eq("uid", uid)
    .eq("problem_id", problem_id);

  if (error) throw error;
  // 좋아요 여부만 확인하면 되므로 배열에 요소가 있는지 체크
  return data && data.length > 0;
};

export const problemLikeAPI = {
  add,
  getUid,
  toggle,
  getLikeCount,
  getUserLikeStatus
};