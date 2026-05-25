import axios from "axios";

// Get all schemas
export const getAllSchemas = async (token) => {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/api/schemas/getall/schema`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};

// Delete schema
export const deleteSchema = async ({ id, token }) => {
  const response = await axios.delete(
    `${process.env.REACT_APP_API_URL}/api/schemas/remove/schema/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};
// Update schema
export const updateSchema = async ({ id, data, token }) => {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/api/schemas/update/schema/${id}`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
};
