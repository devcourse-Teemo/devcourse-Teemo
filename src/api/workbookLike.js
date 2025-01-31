import { supabase } from ".";

// CREATE
const add = async (uid, workbook_id) => {
  try {
    await supabase
      .from("workbook_like")
      .insert([{ uid, workbook_id }])
      .select();
  } catch (error) {
    throw error;
  }
};

// READ
const getUid = async (uid) => {
  await supabase.from("workbook_like").select("workbook_id").eq("uid", uid);
};

const getWorkbookLike = async (uid, workbook_id) => {
  try {
    const { data, error } = await supabase
      .from("workbook_like")
      .select("*")
      .eq("uid", uid)
      .eq("workbook_id", workbook_id);
    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

const getWorkbookLikeCount = async (workbook_id) => {
  const { count, error } = await supabase
    .from("workbook_like")
    .select("*", { count: "exact", head: true })
    .eq("workbook_id", workbook_id);

  if (error) {
    console.error("Error fetching like count:", error);
    return null;
  }

  return count;
};

// DELETE
const remove = async (uid, workbook_id) => {
  const { data, error } = await supabase
    .from("workbook_like")
    .delete()
    .eq("uid", uid)
    .eq("workbook_id", workbook_id);
};

export const workbookLikeAPI = {
  add,
  getUid,
  getWorkbookLike,
  getWorkbookLikeCount,
  remove,
};
