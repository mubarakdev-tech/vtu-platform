import api from "@/lib/api";

export const getProfile = async () => {
  const { data } = await api.get("/user/profile");
  return data;
};

export const updateProfile = async (formData: FormData) => {
  const { data } = await api.put("/user/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { data } = await api.put("/user/change-password", payload);
  return data;
};