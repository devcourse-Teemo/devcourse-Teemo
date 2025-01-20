import { supabase } from "./index.js";

const getAll = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("invite")
      .select(`*, test_center(*)`)
      .eq("target_uid", userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(error);
  }
};

const add = async (targetUserId, testCenterId) => {
  try {
    const { data, error } = await supabase
      .from("invite")
      .insert([{ target_uid: targetUserId, test_center_id: testCenterId }])
      .select();

    if (error) throw error;
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

export const inviteAPI = {
  getAll,
  add,
  accept,
  deny,
};