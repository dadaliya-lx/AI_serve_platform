const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const token = localStorage.getItem("token");
  if (token) {
    defaultOptions.headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "auth.html";
        throw new Error("未授权，请重新登录");
      } else if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "请求参数错误");
      } else if (response.status === 404) {
        // 404 错误，返回空数据
        console.warn(`API 未找到: ${API_BASE_URL}${url}`);
        return [];
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // 网络错误或其他错误，返回空数据
    console.warn("API 请求失败:", error);
    return [];
  }
}

async function uploadFile(url, formData) {
  const defaultOptions = {};

  const token = localStorage.getItem("token");
  if (token) {
    defaultOptions.headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...defaultOptions,
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "auth.html";
        throw new Error("未授权，请重新登录");
      } else if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "请求参数错误");
      } else if (response.status === 404) {
        // 404 错误，返回空对象
        console.warn(`API 未找到: ${API_BASE_URL}${url}`);
        return {};
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // 网络错误或其他错误，返回空对象
    console.warn("文件上传失败:", error);
    return {};
  }
}

const APIClient = {
  async register(name, phone, password) {
    return await apiRequest("/register", {
      method: "POST",
      body: JSON.stringify({ name, phone, password }),
    });
  },

  async login(phone, password) {
    return await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
  },

  async submitRepair(formData) {
    return await uploadFile("/repairs", formData);
  },

  async getRepairs() {
    return await apiRequest("/repairs");
  },

  async getRepair(repairId) {
    return await apiRequest(`/repairs/${repairId}`);
  },

  async getRepairDetail(repairId) {
    return await this.getRepair(repairId);
  },

  async deleteRepair(repairId) {
    return await apiRequest(`/repairs/${repairId}`, {
      method: "DELETE",
    });
  },

  async getUserProfile() {
    return await apiRequest("/user/profile");
  },

  async updateUserProfile(data) {
    return await apiRequest("/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // 通知相关方法
  async getNotifications() {
    return await apiRequest("/notifications");
  },

  async markNotificationRead(notificationId) {
    return await apiRequest(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  async getUnreadCount() {
    return await apiRequest("/notifications/unread-count");
  },

  async adminGetRepairs() {
    return await apiRequest("/admin/repairs");
  },

  async adminUpdateRepair(id, data) {
    return await apiRequest(`/admin/repairs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
