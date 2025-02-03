import { supabase } from "./index.js";

const getAll = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("invite")
      .select(
        `
        *,
        test_center(*, workbook(title,
        description,
        workbook_problem (count)))
      `,
      )
      .eq("target_uid", userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

const add = async (invites) => {
  try {
    const { data, error } = await supabase
      .from("invite")
      .insert(invites)
      .select();

    if (error) {
      console.error("초대 생성 중 오류:", error); // 에러 로그 출력
      throw error;
    }
    return data;
  } catch (error) {
    console.error(error);
  }
};

const accept = async (userId, id) => {
  try {
    const { data, error: updateError } = await supabase
      .from("invite")
      .update({ participate: true })
      .eq("id", id)
      .select()
      .single();
    if (updateError) throw updateError;

    const { data: result, error: upsertError } = await supabase
      .from("test_center")
      .upsert({ ...data, uid: userId, created_at: new Date() });

    if (upsertError) throw upsertError;
    return result;
  } catch (error) {
    console.error(error);
  }
};

const deny = async (id) => {
  try {
    const { data, error } = await supabase
      .from("invite")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

const getParticipantCount = async (testCenterId) => {
  try {
    const { count, error } = await supabase
      .from("invite")
      .select("*", { count: "exact", head: true })
      .eq("test_center_id", testCenterId)
      .eq("participate", true);

    return count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const inviteAPI = {
  getAll,
  add,
  accept,
  deny,
  getParticipantCount,
};
