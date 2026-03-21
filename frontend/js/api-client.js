const API_BASE_URL =
  "https://city-public-service-platfom.2213499332.workers.dev/api";

// 工具函数：验证手机号
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 工具函数：验证密码强度
function validatePassword(password) {
  return password.length >= 6;
}

// 工具函数：转义 HTML 防止 XSS
function escapeHtml(text) {
  if (!text) return text;
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 工具函数：防抖
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 请求锁，防止重复提交
const requestLocks = new Map();

async function apiRequest(url, options = {}) {
  // 生成请求锁 key
  const lockKey = `${url}-${JSON.stringify(options.body)}`;

  // 检查是否正在请求中
  if (requestLocks.get(lockKey)) {
    console.warn("请求正在处理中，请稍候...");
    return { success: false, message: "请求正在处理中，请稍候" };
  }

  // 设置请求锁
  requestLocks.set(lockKey, true);

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
        console.warn(`API 未找到: ${API_BASE_URL}${url}`);
        return { success: false, message: "接口不存在" };
      } else if (response.status === 429) {
        throw new Error("请求过于频繁，请稍后再试");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API 请求失败:", error);
    return { success: false, message: error.message || "网络错误，请检查连接" };
  } finally {
    // 释放请求锁
    setTimeout(() => {
      requestLocks.delete(lockKey);
    }, 1000);
  }
}

async function uploadFile(url, formData) {
  const lockKey = `upload-${url}`;

  if (requestLocks.get(lockKey)) {
    console.warn("上传正在处理中，请稍候...");
    return { success: false, message: "上传正在处理中，请稍候" };
  }

  requestLocks.set(lockKey, true);

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
        console.warn(`API 未找到: ${API_BASE_URL}${url}`);
        return { success: false, message: "接口不存在" };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("文件上传失败:", error);
    return { success: false, message: error.message || "上传失败" };
  } finally {
    setTimeout(() => {
      requestLocks.delete(lockKey);
    }, 1000);
  }
}

const APIClient = {
  async register(name, phone, password) {
    // 输入验证
    if (!name || name.trim().length < 2) {
      return { success: false, message: "姓名至少需要2个字符" };
    }

    if (!validatePhone(phone)) {
      return { success: false, message: "请输入正确的手机号" };
    }

    if (!validatePassword(password)) {
      return { success: false, message: "密码至少需要6个字符" };
    }

    // 转义输入防止 XSS
    const safeName = escapeHtml(name.trim());

    return await apiRequest("/register", {
      method: "POST",
      body: JSON.stringify({ name: safeName, phone, password }),
    });
  },

  async login(phone, password) {
    if (!validatePhone(phone)) {
      return { success: false, message: "请输入正确的手机号" };
    }

    if (!password) {
      return { success: false, message: "请输入密码" };
    }

    return await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
  },

  async submitRepair(data) {
    // 验证必填项
    if (!data.facility_type) {
      return { success: false, message: "请选择设施类型" };
    }

    if (!data.damage_type) {
      return { success: false, message: "请选择损坏类型" };
    }

    if (!data.location || data.location.trim().length < 5) {
      return { success: false, message: "请输入详细的位置信息（至少5个字符）" };
    }

    if (!data.description || data.description.trim().length < 10) {
      return { success: false, message: "请详细描述问题（至少10个字符）" };
    }

    // 转义输入
    const safeData = {
      ...data,
      location: escapeHtml(data.location.trim()),
      description: escapeHtml(data.description.trim()),
    };

    return await apiRequest("/repairs", {
      method: "POST",
      body: JSON.stringify(safeData),
    });
  },

  async getRepairs() {
    return await apiRequest("/repairs");
  },

  async getRepair(repairId) {
    if (!repairId) {
      return { success: false, message: "报修编号不能为空" };
    }
    return await apiRequest(`/repairs/${repairId}`);
  },

  async getRepairDetail(repairId) {
    return await this.getRepair(repairId);
  },

  async deleteRepair(repairId) {
    if (!repairId) {
      return { success: false, message: "报修编号不能为空" };
    }
    return await apiRequest(`/repairs/${repairId}`, {
      method: "DELETE",
    });
  },

  async getUserProfile() {
    return await apiRequest("/user/profile");
  },

  async updateUserProfile(data) {
    if (data.name && data.name.trim().length < 2) {
      return { success: false, message: "姓名至少需要2个字符" };
    }

    const safeData = {
      ...data,
      name: data.name ? escapeHtml(data.name.trim()) : undefined,
    };

    return await apiRequest("/user/profile", {
      method: "PUT",
      body: JSON.stringify(safeData),
    });
  },

  async getNotifications() {
    return await apiRequest("/notifications");
  },

  async markNotificationRead(notificationId) {
    if (!notificationId) {
      return { success: false, message: "通知ID不能为空" };
    }
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
    if (!id) {
      return { success: false, message: "报修ID不能为空" };
    }
    return await apiRequest(`/admin/repairs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// 导出工具函数供其他模块使用
window.APIUtils = {
  validatePhone,
  validatePassword,
  escapeHtml,
  debounce,
};
