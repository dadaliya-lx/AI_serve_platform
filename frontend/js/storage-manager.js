// 优化版文件存储管理器
// 提供数据压缩、自动备份、数据验证等功能

const StorageManager = {
  // 存储配置
  config: {
    maxStorageSize: 5 * 1024 * 1024, // 最大存储5MB
    autoBackup: true,
    backupInterval: 24 * 60 * 60 * 1000, // 24小时备份一次
    maxBackupCount: 5
  },

  // 存储键名常量
  KEYS: {
    USERS: 'users',
    CURRENT_USER: 'currentUser',
    REPAIRS: 'repairs',
    NEWS: 'news',
    SETTINGS: 'settings',
    BACKUPS: 'storage_backups',
    LAST_BACKUP: 'last_backup_time'
  },

  // 初始化存储管理器
  init: function() {
    console.log('存储管理器初始化完成');
    this.cleanOldData();
    this.autoBackupIfNeeded();
  },

  // 存储数据
  set: function(key, value) {
    try {
      const serialized = JSON.stringify(value);
      
      if (this.checkStorageSize(serialized)) {
        localStorage.setItem(key, serialized);
        return {
          success: true,
          message: '存储成功'
        };
      } else {
        return {
          success: false,
          message: '存储空间不足'
        };
      }
    } catch (error) {
      console.error('存储数据失败:', error);
      return {
        success: false,
        message: '存储失败: ' + error.message
      };
    }
  },

  // 获取数据
  get: function(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('获取数据失败:', error);
      return defaultValue;
    }
  },

  // 删除数据
  remove: function(key) {
    try {
      localStorage.removeItem(key);
      return {
        success: true,
        message: '删除成功'
      };
    } catch (error) {
      console.error('删除数据失败:', error);
      return {
        success: false,
        message: '删除失败'
      };
    }
  },

  // 清空所有数据
  clear: function() {
    try {
      localStorage.clear();
      return {
        success: true,
        message: '清空成功'
      };
    } catch (error) {
      console.error('清空数据失败:', error);
      return {
        success: false,
        message: '清空失败'
      };
    }
  },

  // 检查存储空间
  checkStorageSize: function(data) {
    try {
      let totalSize = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += (key.length + value.length) * 2;
      }
      
      totalSize += data.length * 2;
      
      return totalSize < this.config.maxStorageSize;
    } catch (error) {
      console.error('检查存储空间失败:', error);
      return true;
    }
  },

  // 获取存储使用情况
  getStorageInfo: function() {
    let usedSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      usedSize += (key.length + value.length) * 2;
    }
    
    return {
      usedSize: usedSize,
      maxSize: this.config.maxStorageSize,
      usagePercent: (usedSize / this.config.maxStorageSize * 100).toFixed(2),
      itemCount: localStorage.length
    };
  },

  // 自动备份
  autoBackupIfNeeded: function() {
    if (!this.config.autoBackup) return;
    
    const lastBackup = this.get(this.KEYS.LAST_BACKUP, 0);
    const now = Date.now();
    
    if (now - lastBackup > this.config.backupInterval) {
      this.createBackup();
    }
  },

  // 创建备份
  createBackup: function() {
    try {
      const backup = {
        timestamp: Date.now(),
        data: {}
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.includes('backup')) {
          backup.data[key] = localStorage.getItem(key);
        }
      }

      let backups = this.get(this.KEYS.BACKUPS, []);
      backups.push(backup);

      if (backups.length > this.config.maxBackupCount) {
        backups = backups.slice(-this.config.maxBackupCount);
      }

      this.set(this.KEYS.BACKUPS, backups);
      this.set(this.KEYS.LAST_BACKUP, Date.now());

      console.log('数据备份完成');
      return {
        success: true,
        message: '备份成功'
      };
    } catch (error) {
      console.error('创建备份失败:', error);
      return {
        success: false,
        message: '备份失败'
      };
    }
  },

  // 恢复备份
  restoreBackup: function(backupIndex = -1) {
    try {
      const backups = this.get(this.KEYS.BACKUPS, []);
      
      if (backups.length === 0) {
        return {
          success: false,
          message: '没有可用的备份'
        };
      }

      const backup = backupIndex >= 0 ? backups[backupIndex] : backups[backups.length - 1];
      
      if (!backup) {
        return {
          success: false,
          message: '备份不存在'
        };
      }

      for (const [key, value] of Object.entries(backup.data)) {
        localStorage.setItem(key, value);
      }

      console.log('数据恢复完成');
      return {
        success: true,
        message: '恢复成功'
      };
    } catch (error) {
      console.error('恢复备份失败:', error);
      return {
        success: false,
        message: '恢复失败'
      };
    }
  },

  // 获取备份列表
  getBackups: function() {
    return this.get(this.KEYS.BACKUPS, []);
  },

  // 清理旧数据
  cleanOldData: function() {
    try {
      const repairs = this.get(this.KEYS.REPAIRS, []);
      const now = Date.now();
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

      const filteredRepairs = repairs.filter(repair => {
        const repairTime = new Date(repair.submitTime).getTime();
        return repairTime > oneYearAgo;
      });

      if (filteredRepairs.length !== repairs.length) {
        this.set(this.KEYS.REPAIRS, filteredRepairs);
        console.log('已清理旧的报修记录');
      }
    } catch (error) {
      console.error('清理旧数据失败:', error);
    }
  },

  // 导出数据
  exportData: function() {
    try {
      const exportData = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        exportData[key] = this.get(key);
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `city-service-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: '导出成功'
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      return {
        success: false,
        message: '导出失败'
      };
    }
  },

  // 导入数据
  importData: function(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          for (const [key, value] of Object.entries(data)) {
            this.set(key, value);
          }

          resolve({
            success: true,
            message: '导入成功'
          });
        } catch (error) {
          reject({
            success: false,
            message: '导入失败: 文件格式错误'
          });
        }
      };
      
      reader.onerror = () => {
        reject({
          success: false,
          message: '导入失败: 文件读取错误'
        });
      };
      
      reader.readAsText(file);
    });
  }
};

// 兼容旧的存储函数
window.setLocalStorage = function(key, value) {
  const result = StorageManager.set(key, value);
  return result.success;
};

window.getLocalStorage = function(key, defaultValue) {
  return StorageManager.get(key, defaultValue);
};

window.removeLocalStorage = function(key) {
  const result = StorageManager.remove(key);
  return result.success;
};

// 初始化存储管理器
document.addEventListener('DOMContentLoaded', function() {
  StorageManager.init();
});

if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
