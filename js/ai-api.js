// AI视觉识别相关功能

// 百度智能云API配置
const BAIDU_CLOUD_CONFIG = {
  // 百度智能云API Key
  API_KEY: "Artfb21Kqo4aOwXpgRtsfhcm",
  // 百度智能云Secret Key
  SECRET_KEY: "2KsLUGF90AQ5pY35Lq4dX7oThpKXfvKm",
  // 百度智能云API地址配置
  API_URLS: {
    // 通用物体和场景识别高级版 - 用于识别公共设施类型
    ADVANCED_GENERAL:
      "https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general",
    // 图像主体检测 - 用于检测图像中的主要物体
    OBJECT_DETECT:
      "https://aip.baidubce.com/rest/2.0/image-classify/v1/object_detect",
    // 图像内容理解 - 提交请求
    IMAGE_UNDERSTANDING_REQUEST:
      "https://aip.baidubce.com/rest/2.0/image-classify/v1/image-understanding/request",
    // 图像内容理解 - 获取结果
    IMAGE_UNDERSTANDING_RESULT:
      "https://aip.baidubce.com/rest/2.0/image-classify/v1/image-understanding/get-result",
  },
};

// 获取百度智能云AccessToken
async function getBaiduAccessToken() {
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_CLOUD_CONFIG.API_KEY}&client_secret=${BAIDU_CLOUD_CONFIG.SECRET_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    } else {
      throw new Error("获取AccessToken失败");
    }
  } catch (error) {
    console.error("获取AccessToken错误:", error);
    throw error;
  }
}

// AI识别模块
const AI_API = {
  // 识别公共设施类型和损坏情况（增强版）
  recognizeFacility: async function (imageFile) {
    try {
      // 获取AccessToken
      const accessToken = await getBaiduAccessToken();

      // 将图片转换为Base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // 移除Base64前缀
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // 首先使用主体检测API检测图像中的主要物体
      const objectDetectResponse = await fetch(
        `${BAIDU_CLOUD_CONFIG.API_URLS.OBJECT_DETECT}?access_token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `image=${encodeURIComponent(base64Image)}`,
        },
      );

      const objectDetectData = await objectDetectResponse.json();

      // 然后使用通用物体识别API获取详细信息
      const generalResponse = await fetch(
        `${BAIDU_CLOUD_CONFIG.API_URLS.ADVANCED_GENERAL}?access_token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `image=${encodeURIComponent(base64Image)}&baike_num=5`,
        },
      );

      const generalData = await generalResponse.json();

      // 处理API响应
      if (generalData.error_code) {
        throw new Error(`API错误: ${generalData.error_msg}`);
      }

      // 综合分析结果，提取公共设施类型和损坏情况
      const result = this.analyzeBaiduResult(generalData, objectDetectData);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("识别失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 识别公共设施类型和损坏情况（简化版）
  recognizeFacilitySimple: async function (imageFile) {
    try {
      // 获取AccessToken
      const accessToken = await getBaiduAccessToken();

      // 将图片转换为Base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // 移除Base64前缀
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // 调用百度智能云图像识别API（通用物体识别）
      const response = await fetch(
        `${BAIDU_CLOUD_CONFIG.API_URLS.ADVANCED_GENERAL}?access_token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `image=${encodeURIComponent(base64Image)}&baike_num=5`,
        },
      );

      const data = await response.json();

      // 处理API响应
      if (data.error_code) {
        throw new Error(`API错误: ${data.error_msg}`);
      }

      // 分析识别结果，提取公共设施类型和损坏情况
      const result = this.analyzeBaiduResult(data);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("识别失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 图像内容理解（高级功能）
  imageUnderstanding: async function (imageFile) {
    try {
      // 获取AccessToken
      const accessToken = await getBaiduAccessToken();

      // 将图片转换为Base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // 提交图像内容理解请求
      const requestResponse = await fetch(
        `${BAIDU_CLOUD_CONFIG.API_URLS.IMAGE_UNDERSTANDING_REQUEST}?access_token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `image=${encodeURIComponent(base64Image)}&question=这是什么类型的公共设施？有什么损坏？`,
        },
      );

      const requestData = await requestResponse.json();

      if (requestData.error_code) {
        throw new Error(`API错误: ${requestData.error_msg}`);
      }

      // 等待处理完成并获取结果
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 等待2秒

      const resultResponse = await fetch(
        `${BAIDU_CLOUD_CONFIG.API_URLS.IMAGE_UNDERSTANDING_RESULT}?access_token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `task_id=${requestData.task_id}`,
        },
      );

      const resultData = await resultResponse.json();

      return {
        success: true,
        data: resultData,
      };
    } catch (error) {
      console.error("图像内容理解失败:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 分析百度智能云API返回的结果
  analyzeBaiduResult: function (data, objectDetectData = null) {
    if (!data.result || data.result.length === 0) {
      return {
        type: "未知设施",
        damage: "无法识别损坏情况",
        confidence: 0.5,
        suggestion: "请手动填写报修信息",
      };
    }

    // 提取识别结果
    const topResult = data.result[0];
    let type = "未知设施";
    let damage = "无法识别损坏情况";
    let suggestion = "请手动填写报修信息";

    // 根据识别结果判断设施类型
    const facilityTypes = {
      路灯: ["路灯", "街灯", "照明", "灯杆", "灯泡"],
      垃圾桶: ["垃圾桶", "垃圾箱", "废物箱", "垃圾筒"],
      公交站亭: ["公交站", "车站", "候车亭", "站台", "站牌"],
      人行道: ["人行道", "路面", "步道", "地砖", "路面"],
      消防栓: ["消防栓", "消火栓", "消防龙头", "消防栓"],
      井盖: ["井盖", "窨井盖", "下水道盖", "井盖"],
      健身设施: ["健身器材", "健身设施", "运动器材", "健身器", "锻炼器材"],
    };

    // 匹配设施类型
    for (const [facility, keywords] of Object.entries(facilityTypes)) {
      if (keywords.some((keyword) => topResult.keyword.includes(keyword))) {
        type = facility;
        break;
      }
    }

    // 根据设施类型和识别结果判断损坏情况
    if (type !== "未知设施") {
      // 这里可以根据实际情况添加更复杂的损坏判断逻辑
      // 目前使用简单的规则匹配
      const damageKeywords = {
        损坏: ["损坏", "破损", "坏了", "破裂", "破碎", "毁坏"],
        缺失: ["缺失", "丢失", "不见", "缺少", "脱落", "掉落"],
        故障: ["故障", "失灵", "不工作", "失效", "异常"],
        老化: ["老化", "陈旧", "生锈", "腐蚀", "锈蚀", "褪色"],
      };

      // 检查是否包含损坏相关关键词
      for (const [damageType, keywords] of Object.entries(damageKeywords)) {
        if (keywords.some((keyword) => topResult.keyword.includes(keyword))) {
          damage = damageType;
          break;
        }
      }

      // 生成维修建议
      suggestion = this.generateSuggestion(type, damage);
    }

    return {
      type: type,
      damage: damage,
      confidence: topResult.score,
      suggestion: suggestion,
    };
  },

  // 根据设施类型和损坏情况生成维修建议
  generateSuggestion: function (type, damage) {
    const suggestions = {
      路灯: {
        损坏: "需要更换灯泡或维修线路",
        缺失: "需要安装新的路灯",
        故障: "需要检查并维修控制系统",
        老化: "需要更换老化的路灯设施",
      },
      垃圾桶: {
        损坏: "需要修复或更换垃圾桶",
        缺失: "需要安装新的垃圾桶",
        故障: "需要检查垃圾桶的使用状态",
        老化: "需要更换老化的垃圾桶",
      },
      公交站亭: {
        损坏: "需要修复站亭结构或玻璃",
        缺失: "需要重建公交站亭",
        故障: "需要检查站亭的设施功能",
        老化: "需要翻新或更换站亭",
      },
      人行道: {
        损坏: "需要修复破损的路面",
        缺失: "需要重新铺设人行道",
        故障: "需要检查路面平整度",
        老化: "需要重新铺设或翻新人行道",
      },
      消防栓: {
        损坏: "需要维修消防栓",
        缺失: "需要安装新的消防栓",
        故障: "需要检查消防栓的水压和功能",
        老化: "需要更换老化的消防栓",
      },
      井盖: {
        损坏: "需要修复或更换井盖",
        缺失: "需要安装新的井盖",
        故障: "需要检查井盖的安全性",
        老化: "需要更换老化的井盖",
      },
      健身设施: {
        损坏: "需要修复健身器材",
        缺失: "需要安装新的健身器材",
        故障: "需要检查器材的安全性",
        老化: "需要更换老化的健身器材",
      },
    };

    return suggestions[type]?.[damage] || "请联系专业人员进行检查和维修";
  },

  // 上传图片到服务器
  uploadImage: function (imageFile) {
    return new Promise((resolve, reject) => {
      // 模拟上传过程
      setTimeout(() => {
        // 生成模拟的图片URL
        const mockImageUrl = `https://example.com/uploads/${Date.now()}.jpg`;

        resolve({
          success: true,
          data: {
            url: mockImageUrl,
            filename: imageFile.name,
          },
        });
      }, 1500);
    });
  },

  // 分析图片质量
  analyzeImageQuality: function (imageFile) {
    return new Promise((resolve, reject) => {
      // 模拟图片质量分析
      setTimeout(() => {
        const qualityScore = Math.random() * 20 + 80; // 80-100之间的随机值

        resolve({
          success: true,
          data: {
            quality: qualityScore,
            isAcceptable: qualityScore >= 85,
            message:
              qualityScore >= 85
                ? "图片质量良好"
                : "图片质量不佳，建议重新拍摄",
          },
        });
      }, 1000);
    });
  },

  // 批量识别
  batchRecognize: function (imageFiles) {
    return new Promise((resolve, reject) => {
      // 模拟批量识别
      setTimeout(() => {
        const results = imageFiles.map((file, index) => {
          return {
            fileIndex: index,
            filename: file.name,
            result: {
              type: ["路灯", "垃圾桶", "公交站亭", "人行道", "消防栓"][
                Math.floor(Math.random() * 5)
              ],
              damage: ["损坏", "故障", "缺失", "老化"][
                Math.floor(Math.random() * 4)
              ],
              confidence: (Math.random() * 15 + 85) / 100,
            },
          };
        });

        resolve({
          success: true,
          data: results,
        });
      }, 3000);
    });
  },
};

// 图片处理工具
const ImageProcessor = {
  // 压缩图片
  compressImage: function (imageFile, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = function () {
        // 计算压缩后的尺寸
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为Blob
        canvas.toBlob(
          function (blob) {
            resolve(blob);
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = function () {
        reject("图片加载失败");
      };

      img.src = URL.createObjectURL(imageFile);
    });
  },

  // 获取图片EXIF信息
  getExifInfo: function (imageFile) {
    return new Promise((resolve, reject) => {
      // 模拟EXIF信息
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            location: {
              latitude: 39.9042,
              longitude: 116.4074,
            },
            device: "Mobile Phone",
          },
        });
      }, 500);
    });
  },

  // 检测图片中的物体
  detectObjects: function (imageFile) {
    return new Promise((resolve, reject) => {
      // 模拟物体检测
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            objects: [
              {
                type: "路灯",
                confidence: 0.92,
                boundingBox: {
                  x: 100,
                  y: 50,
                  width: 200,
                  height: 300,
                },
              },
            ],
          },
        });
      }, 1500);
    });
  },
};

// AI识别结果处理
const AIResultProcessor = {
  // 格式化识别结果
  formatResult: function (result) {
    if (!result || !result.data) {
      return "识别失败";
    }

    const { type, damage, confidence, suggestion } = result.data;

    return {
      title: `识别结果: ${type}`,
      details: [
        `损坏类型: ${damage}`,
        `置信度: ${(confidence * 100).toFixed(1)}%`,
        `建议: ${suggestion}`,
      ],
    };
  },

  // 生成报修建议
  generateRepairSuggestion: function (result) {
    if (!result || !result.data) {
      return "无法生成建议";
    }

    const { type, damage, suggestion } = result.data;

    return {
      facilityType: type,
      damageDescription: damage,
      suggestedAction: suggestion,
      estimatedTime: this.getEstimatedRepairTime(type),
      priority: this.calculatePriority(type, damage),
    };
  },

  // 计算估计维修时间
  getEstimatedRepairTime: function (facilityType) {
    const timeMap = {
      路灯: "1-2个工作日",
      垃圾桶: "1个工作日",
      公交站亭: "2-3个工作日",
      人行道: "3-5个工作日",
      消防栓: "紧急维修，24小时内",
    };

    return timeMap[facilityType] || "3-5个工作日";
  },

  // 计算优先级
  calculatePriority: function (facilityType, damage) {
    // 高优先级设施
    const highPriorityFacilities = ["消防栓", "路灯"];
    // 高优先级损坏
    const highPriorityDamages = ["漏水", "完全损坏", "故障"];

    if (
      highPriorityFacilities.includes(facilityType) ||
      highPriorityDamages.includes(damage)
    ) {
      return "高";
    }

    return "中";
  },
};

// 导出模块
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AI_API,
    ImageProcessor,
    AIResultProcessor,
  };
}

// 浏览器环境下挂载到全局
if (typeof window !== "undefined") {
  window.AI_API = AI_API;
  window.ImageProcessor = ImageProcessor;
  window.AIResultProcessor = AIResultProcessor;
}
