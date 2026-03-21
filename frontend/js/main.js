// 主脚本文件
// 页面加载完成后执行
document.addEventListener("DOMContentLoaded", function () {
  // 初始化移动端菜单
  initMobileMenu();

  // 初始化表单验证
  initFormValidation();

  // 初始化页面动画
  initPageAnimations();

  // 初始化滚动效果
  initScrollEffects();

  // 初始化平滑滚动
  initSmoothScroll();

  // 初始化数据可视化
  initDataVisualization();
});

// 初始化移动端菜单
function initMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      navLinks.classList.toggle("active");
      // 添加动画效果
      if (navLinks.classList.contains("active")) {
        navLinks.style.animation = "slideDown 0.3s ease-out";
      }
    });

    // 点击菜单项后关闭菜单
    const menuItems = navLinks.querySelectorAll("a");
    menuItems.forEach((item) => {
      item.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          navLinks.classList.remove("active");
        }
      });
    });
  }
}

// 初始化表单验证
function initFormValidation() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      let isValid = true;
      const requiredFields = form.querySelectorAll("[required]");

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add("error");
          // 添加错误提示
          if (
            !field.nextElementSibling ||
            !field.nextElementSibling.classList.contains("error-message")
          ) {
            const errorMessage = document.createElement("div");
            errorMessage.className = "error-message";
            errorMessage.style.color = "#dc3545";
            errorMessage.style.fontSize = "14px";
            errorMessage.style.marginTop = "5px";
            errorMessage.textContent = "此字段为必填项";
            field.parentNode.insertBefore(errorMessage, field.nextSibling);
          }
        } else {
          field.classList.remove("error");
          // 移除错误提示
          const errorMessage = field.nextElementSibling;
          if (
            errorMessage &&
            errorMessage.classList.contains("error-message")
          ) {
            errorMessage.remove();
          }
        }
      });

      if (!isValid) {
        e.preventDefault();
        showMessage("请填写所有必填字段", "error");
      }
    });

    // 实时验证
    const inputFields = form.querySelectorAll("input, select, textarea");
    inputFields.forEach((field) => {
      field.addEventListener("blur", function () {
        if (this.hasAttribute("required") && !this.value.trim()) {
          this.classList.add("error");
          // 添加错误提示
          if (
            !this.nextElementSibling ||
            !this.nextElementSibling.classList.contains("error-message")
          ) {
            const errorMessage = document.createElement("div");
            errorMessage.className = "error-message";
            errorMessage.style.color = "#dc3545";
            errorMessage.style.fontSize = "14px";
            errorMessage.style.marginTop = "5px";
            errorMessage.textContent = "此字段为必填项";
            this.parentNode.insertBefore(errorMessage, this.nextSibling);
          }
        } else {
          this.classList.remove("error");
          // 移除错误提示
          const errorMessage = this.nextElementSibling;
          if (
            errorMessage &&
            errorMessage.classList.contains("error-message")
          ) {
            errorMessage.remove();
          }
        }
      });

      // 输入时清除错误状态
      field.addEventListener("input", function () {
        this.classList.remove("error");
        const errorMessage = this.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains("error-message")) {
          errorMessage.remove();
        }
      });
    });
  });
}

// 初始化页面动画
function initPageAnimations() {
  const fadeElements = document.querySelectorAll(
    ".fade-in, .card, .info-card, .stat-card, .chart-card",
  );

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";
    element.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
    observer.observe(element);
  });
}

// 初始化滚动效果
function initScrollEffects() {
  // 滚动时导航栏效果
  window.addEventListener("scroll", function () {
    const header = document.querySelector("header");
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }

    // 滚动时显示回到顶部按钮
    const backToTopBtn = document.getElementById("backToTop");
    if (backToTopBtn) {
      if (window.scrollY > 300) {
        backToTopBtn.style.opacity = "1";
        backToTopBtn.style.visibility = "visible";
      } else {
        backToTopBtn.style.opacity = "0";
        backToTopBtn.style.visibility = "hidden";
      }
    }
  });

  // 回到顶部按钮
  const backToTopBtn = document.createElement("button");
  backToTopBtn.id = "backToTop";
  backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  backToTopBtn.style.position = "fixed";
  backToTopBtn.style.bottom = "30px";
  backToTopBtn.style.right = "30px";
  backToTopBtn.style.width = "50px";
  backToTopBtn.style.height = "50px";
  backToTopBtn.style.border = "none";
  backToTopBtn.style.borderRadius = "50%";
  backToTopBtn.style.backgroundColor = "var(--primary-color)";
  backToTopBtn.style.color = "var(--white)";
  backToTopBtn.style.fontSize = "20px";
  backToTopBtn.style.cursor = "pointer";
  backToTopBtn.style.boxShadow = "var(--shadow-md)";
  backToTopBtn.style.transition = "var(--transition)";
  backToTopBtn.style.opacity = "0";
  backToTopBtn.style.visibility = "hidden";
  backToTopBtn.style.zIndex = "1000";

  backToTopBtn.addEventListener("mouseenter", function () {
    this.style.backgroundColor = "var(--primary-dark)";
    this.style.transform = "scale(1.1)";
  });

  backToTopBtn.addEventListener("mouseleave", function () {
    this.style.backgroundColor = "var(--primary-color)";
    this.style.transform = "scale(1)";
  });

  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  document.body.appendChild(backToTopBtn);
}

// 初始化平滑滚动
function initSmoothScroll() {
  // 为所有内部链接添加平滑滚动
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// 初始化数据可视化
function initDataVisualization() {
  // 这里可以添加图表库的初始化代码
  // 例如使用Chart.js等库创建图表
}

// 工具函数：显示加载动画
function showLoading(element) {
  const loadingHTML = '<div class="loading"></div>';
  if (element) {
    element.innerHTML = loadingHTML;
    element.style.display = "flex";
    element.style.justifyContent = "center";
    element.style.alignItems = "center";
    element.style.minHeight = "100px";
  }
}

// 工具函数：隐藏加载动画
function hideLoading(element, content) {
  if (element) {
    element.innerHTML = content || "";
    element.style.display = "";
    element.style.justifyContent = "";
    element.style.alignItems = "";
    element.style.minHeight = "";
  }
}

// 工具函数：显示消息提示
function showMessage(message, type = "info") {
  // 计算当前已有的消息数量，确定新消息的位置
  const existingMessages = document.querySelectorAll(".message");
  const messageCount = existingMessages.length;
  const topPosition = 20 + messageCount * 70; // 每个消息间隔70px

  const messageDiv = document.createElement("div");
  messageDiv.className = `message message-${type}`;
  messageDiv.style.position = "fixed";
  messageDiv.style.top = `${topPosition}px`;
  messageDiv.style.right = "20px";
  messageDiv.style.padding = "15px 20px";
  messageDiv.style.borderRadius = "var(--border-radius)";
  messageDiv.style.color = "white";
  messageDiv.style.zIndex = "10000";
  messageDiv.style.boxShadow = "var(--shadow-lg)";
  messageDiv.style.transition = "var(--transition)";
  messageDiv.style.opacity = "0";
  messageDiv.style.transform = "translateX(100%)";
  messageDiv.style.fontSize = "16px";
  messageDiv.style.fontWeight = "500";
  messageDiv.style.display = "flex";
  messageDiv.style.alignItems = "center";
  messageDiv.style.gap = "10px";

  // 添加图标
  let icon;
  switch (type) {
    case "success":
      messageDiv.style.backgroundColor = "var(--success-color)";
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      messageDiv.style.backgroundColor = "var(--error-color)";
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case "warning":
      messageDiv.style.backgroundColor = "var(--warning-color)";
      messageDiv.style.color = "var(--text-color)";
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      messageDiv.style.backgroundColor = "var(--primary-color)";
      icon = '<i class="fas fa-info-circle"></i>';
  }

  messageDiv.innerHTML = `${icon} ${message}`;
  document.body.appendChild(messageDiv);

  // 显示动画
  setTimeout(() => {
    messageDiv.style.opacity = "1";
    messageDiv.style.transform = "translateX(0)";
  }, 100);

  // 3秒后隐藏
  setTimeout(() => {
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (document.body.contains(messageDiv)) {
        document.body.removeChild(messageDiv);
      }
    }, 300);
  }, 3000);
}

// 工具函数：获取URL参数
function getURLParams() {
  const params = {};
  const urlParams = new URLSearchParams(window.location.search);

  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }

  return params;
}

// 工具函数：格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 工具函数：模拟API请求
function mockAPIRequest(url, method = "GET", data = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟不同接口的响应
      if (url.includes("/api/repair")) {
        if (method === "POST") {
          resolve({
            success: true,
            data: {
              repairId: "R" + Date.now(),
              status: "pending",
              message: "报修提交成功",
            },
          });
        } else if (method === "GET") {
          resolve({
            success: true,
            data: {
              repairId: "R123456",
              status: "processing",
              progress: 60,
              description: "路灯损坏",
              location: "中心广场",
              submitTime: "2026-03-01 10:30",
              updateTime: "2026-03-02 14:20",
            },
          });
        }
      } else if (url.includes("/api/ai/recognize")) {
        resolve({
          success: true,
          data: {
            type: "路灯",
            damage: "灯泡损坏",
            confidence: 0.92,
            suggestion: "需要更换灯泡",
          },
        });
      } else if (url.includes("/api/news")) {
        resolve({
          success: true,
          data: [
            {
              id: 1,
              title: "关于开展城市公共设施安全检查的通知",
              content:
                "为确保城市公共设施安全运行，我单位将于近期开展全面安全检查...",
              date: "2026-03-01",
            },
            {
              id: 2,
              title: "公共设施报修流程优化通知",
              content: "为提高服务效率，我单位对公共设施报修流程进行了优化...",
              date: "2026-02-20",
            },
            {
              id: 3,
              title: "AI智能报修系统上线公告",
              content:
                "我单位正式上线AI智能报修系统，市民可通过上传图片进行智能识别...",
              date: "2026-02-10",
            },
          ],
        });
      }

      // 默认响应
      resolve({
        success: true,
        data: {},
      });
    }, 1000);
  });
}

// 工具函数：处理图片上传
function handleImageUpload(fileInput, previewElement) {
  return new Promise((resolve, reject) => {
    const file = fileInput.files[0];
    if (!file) {
      reject("请选择图片");
      return;
    }

    // 检查文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      reject("只支持JPG、PNG、GIF格式的图片");
      return;
    }

    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      reject("图片大小不能超过5MB");
      return;
    }

    // 预览图片
    if (previewElement) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewElement.src = e.target.result;
        previewElement.style.display = "block";
        // 添加淡入效果
        previewElement.style.opacity = "0";
        previewElement.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          previewElement.style.opacity = "1";
        }, 100);
      };
      reader.readAsDataURL(file);
    }

    resolve(file);
  });
}

// 工具函数：设置本地存储
function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("存储数据失败:", error);
    return false;
  }
}

// 工具函数：获取本地存储
function getLocalStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error("获取数据失败:", error);
    return defaultValue;
  }
}

// 工具函数：移除本地存储
function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("移除数据失败:", error);
    return false;
  }
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

// 工具函数：节流
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 工具函数：添加CSS类
function addClass(element, className) {
  if (element && !element.classList.contains(className)) {
    element.classList.add(className);
  }
}

// 工具函数：移除CSS类
function removeClass(element, className) {
  if (element && element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

// 工具函数：切换CSS类
function toggleClass(element, className) {
  if (element) {
    element.classList.toggle(className);
  }
}

// 用户认证管理器
const AuthManager = {
  // 用户数据存储键名
  STORAGE_KEYS: {
    USERS: "users",
    CURRENT_USER: "currentUser",
  },

  // 默认头像路径
  DEFAULT_AVATAR: "images/Avatar/209578cb286ca29f11de996cd7c34102.jpg",

  // 获取所有用户
  getUsers: function () {
    return getLocalStorage(this.STORAGE_KEYS.USERS, []);
  },

  // 保存用户列表
  saveUsers: function (users) {
    setLocalStorage(this.STORAGE_KEYS.USERS, users);
  },

  // 生成用户ID
  generateUserId: function () {
    return "U" + Date.now() + Math.random().toString(36).substr(2, 9);
  },

  // 注册新用户
  register: function (name, phone, password) {
    const users = this.getUsers();

    // 检查手机号是否已注册
    const existingUser = users.find((u) => u.phone === phone);
    if (existingUser) {
      return {
        success: false,
        message: "该手机号已被注册，请直接登录",
      };
    }

    // 创建新用户
    const newUser = {
      id: this.generateUserId(),
      name: name,
      phone: phone,
      password: password,
      avatar: this.DEFAULT_AVATAR,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    return {
      success: true,
      message: "注册成功",
      user: newUser,
    };
  },

  // 用户登录
  login: function (phone, password) {
    const users = this.getUsers();

    // 查找用户
    const user = users.find(
      (u) => u.phone === phone && u.password === password,
    );
    if (!user) {
      return {
        success: false,
        message: "手机号或密码错误",
      };
    }

    // 保存当前登录用户（不保存密码）
    const currentUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar || this.DEFAULT_AVATAR,
    };
    setLocalStorage(this.STORAGE_KEYS.CURRENT_USER, currentUser);

    return {
      success: true,
      message: "登录成功",
      user: currentUser,
    };
  },

  // 更新用户信息
  updateUser: function (userId, updates) {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return {
        success: false,
        message: "用户不存在",
      };
    }

    // 更新用户数据
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveUsers(users);

    // 如果是当前登录用户，也更新currentUser
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedCurrentUser = {
        ...currentUser,
        ...updates,
      };
      setLocalStorage(this.STORAGE_KEYS.CURRENT_USER, updatedCurrentUser);
    }

    return {
      success: true,
      message: "更新成功",
      user: users[userIndex],
    };
  },

  // 修改用户名
  updateName: function (newName) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "请先登录",
      };
    }

    return this.updateUser(currentUser.id, { name: newName });
  },

  // 修改头像
  updateAvatar: function (newAvatar) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "请先登录",
      };
    }

    return this.updateUser(currentUser.id, { avatar: newAvatar });
  },

  // 用户登出
  logout: function () {
    removeLocalStorage(this.STORAGE_KEYS.CURRENT_USER);
    window.location.href = "index.html";
  },

  // 检查是否已登录
  isLoggedIn: function () {
    const currentUser = getLocalStorage(this.STORAGE_KEYS.CURRENT_USER);
    if (!currentUser) {
      return false;
    }

    // 检查用户是否仍然存在（可能已被管理员删除）
    const users = this.getUsers();
    const userExists = users.some((u) => u.id === currentUser.id);

    if (!userExists) {
      // 用户已被删除，清除登录状态
      removeLocalStorage(this.STORAGE_KEYS.CURRENT_USER);
      return false;
    }

    return true;
  },

  // 获取当前登录用户
  getCurrentUser: function () {
    const user = getLocalStorage(this.STORAGE_KEYS.CURRENT_USER);
    if (!user) {
      return null;
    }

    // 检查用户是否仍然存在（可能已被管理员删除）
    const users = this.getUsers();
    const userExists = users.some((u) => u.id === user.id);

    if (!userExists) {
      // 用户已被删除，清除登录状态
      removeLocalStorage(this.STORAGE_KEYS.CURRENT_USER);
      return null;
    }

    if (!user.avatar) {
      user.avatar = this.DEFAULT_AVATAR;
    }
    return user;
  },

  // 获取用户ID
  getCurrentUserId: function () {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  },

  // 初始化演示用户（如果没有用户）
  initDemoUser: function () {
    const users = this.getUsers();
    if (users.length === 0) {
      // 创建演示用户
      const demoUser = {
        id: this.generateUserId(),
        name: "演示用户",
        phone: "13800138000",
        password: "123456",
        avatar: this.DEFAULT_AVATAR,
        createdAt: new Date().toISOString(),
      };
      users.push(demoUser);
      this.saveUsers(users);
      console.log("演示用户已创建：手机号 13800138000，密码 123456");
    }
  },
};

// 页面加载时初始化演示用户
document.addEventListener("DOMContentLoaded", function () {
  AuthManager.initDemoUser();
});
