# 上次反馈预览功能 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在提交反馈后，在输入框上方显示「上次反馈」预览卡片，让用户可以查看、复制或重新载入上次提交的内容。

**Architecture:** 
1. 在 HTML 模板中添加预览卡片 DOM 结构
2. 在 CSS 中添加预览卡片样式（支持垂直/水平布局）
3. 在 UIManager 中添加预览卡片管理逻辑
4. 修改 app.js 的提交流程，提交成功后更新预览卡片

**Tech Stack:** HTML, CSS, JavaScript (ES5), i18n

---

### Task 1: 添加 HTML 模板结构

**Files:**
- Modify: `src/mcp_feedback_enhanced/web/templates/feedback.html:619-622`

**Step 1: 在「文字回饋」label 之后、textarea 之前插入预览卡片结构**

在 `<label class="input-label" data-i18n="feedback.textLabel">文字回饋</label>` 之后，`<textarea id="combinedFeedbackText"` 之前插入：

```html
<!-- 上次反馈预览卡片 -->
<div id="lastFeedbackPreview" class="last-feedback-preview" style="display: none;">
    <div class="last-feedback-header">
        <span class="last-feedback-title">
            <span class="last-feedback-icon">📤</span>
            <span data-i18n="feedback.lastFeedback.title">上次反馈</span>
        </span>
        <div class="last-feedback-actions">
            <button type="button" class="last-feedback-btn" id="copyLastFeedbackBtn" data-i18n-title="feedback.lastFeedback.copy" title="复制">
                <span>📋</span>
            </button>
            <button type="button" class="last-feedback-btn" id="loadLastFeedbackBtn" data-i18n-title="feedback.lastFeedback.load" title="载入到输入框">
                <span>↩</span>
            </button>
            <button type="button" class="last-feedback-btn last-feedback-toggle" id="toggleLastFeedbackBtn" data-i18n-title="feedback.lastFeedback.collapse" title="收起">
                <span class="toggle-icon">▼</span>
            </button>
        </div>
    </div>
    <div class="last-feedback-content" id="lastFeedbackContent">
        <!-- 内容将通过 JS 动态填充 -->
    </div>
</div>
```

**Step 2: 验证 HTML 结构正确**

运行服务器并检查页面加载无错误。

---

### Task 2: 添加 CSS 样式

**Files:**
- Modify: `src/mcp_feedback_enhanced/web/static/css/styles.css` (在文件末尾添加)

**Step 1: 添加预览卡片基础样式**

```css
/* ===== 上次反馈预览卡片 ===== */
.last-feedback-preview {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    margin-bottom: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.last-feedback-preview.collapsed .last-feedback-content {
    display: none;
}

.last-feedback-preview.collapsed .toggle-icon {
    transform: rotate(-90deg);
}

.last-feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    user-select: none;
}

.last-feedback-preview.collapsed .last-feedback-header {
    border-bottom: none;
}

.last-feedback-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
}

.last-feedback-icon {
    font-size: 14px;
}

.last-feedback-actions {
    display: flex;
    align-items: center;
    gap: 4px;
}

.last-feedback-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
}

.last-feedback-btn:hover {
    background: var(--bg-primary);
    border-color: var(--border-color);
    color: var(--text-primary);
}

.last-feedback-btn:active {
    transform: scale(0.95);
}

.toggle-icon {
    transition: transform 0.2s ease;
    font-size: 10px;
}

.last-feedback-content {
    padding: 12px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-height: 150px;
    overflow-y: auto;
}

.last-feedback-content:empty::before {
    content: attr(data-empty-text);
    color: var(--text-secondary);
    font-style: italic;
}

/* 展开更多按钮 */
.last-feedback-expand {
    display: none;
    padding: 6px 12px;
    font-size: 12px;
    color: var(--accent-color);
    background: transparent;
    border: none;
    border-top: 1px solid var(--border-color);
    cursor: pointer;
    width: 100%;
    text-align: center;
    transition: background 0.2s ease;
}

.last-feedback-expand:hover {
    background: var(--bg-secondary);
}

.last-feedback-preview.truncated .last-feedback-expand {
    display: block;
}

.last-feedback-preview.expanded .last-feedback-content {
    max-height: none;
}

.last-feedback-preview.expanded .last-feedback-expand {
    display: none;
}

/* 图片指示器 */
.last-feedback-images {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
    font-size: 12px;
    color: var(--text-secondary);
}

.last-feedback-images-icon {
    font-size: 14px;
}
```

**Step 2: 验证样式正确加载**

刷新页面，检查 CSS 无语法错误。

---

### Task 3: 添加 i18n 翻译

**Files:**
- Modify: `src/mcp_feedback_enhanced/web/locales/zh-TW/translation.json`
- Modify: `src/mcp_feedback_enhanced/web/locales/zh-CN/translation.json`
- Modify: `src/mcp_feedback_enhanced/web/locales/en/translation.json`

**Step 1: 在 feedback 对象中添加 lastFeedback 键**

zh-TW/translation.json 的 feedback 对象中添加：
```json
"lastFeedback": {
    "title": "上次反饋",
    "copy": "複製內容",
    "load": "載入到輸入框",
    "collapse": "收起",
    "expand": "展開",
    "showMore": "展開更多",
    "copied": "已複製到剪貼板",
    "loaded": "已載入到輸入框",
    "imagesAttached": "張圖片"
}
```

zh-CN/translation.json 的 feedback 对象中添加：
```json
"lastFeedback": {
    "title": "上次反馈",
    "copy": "复制内容",
    "load": "载入到输入框",
    "collapse": "收起",
    "expand": "展开",
    "showMore": "展开更多",
    "copied": "已复制到剪贴板",
    "loaded": "已载入到输入框",
    "imagesAttached": "张图片"
}
```

en/translation.json 的 feedback 对象中添加：
```json
"lastFeedback": {
    "title": "Last Feedback",
    "copy": "Copy content",
    "load": "Load to input",
    "collapse": "Collapse",
    "expand": "Expand",
    "showMore": "Show more",
    "copied": "Copied to clipboard",
    "loaded": "Loaded to input",
    "imagesAttached": "image(s)"
}
```

---

### Task 4: 添加 UIManager 预览卡片管理方法

**Files:**
- Modify: `src/mcp_feedback_enhanced/web/static/js/modules/ui-manager.js`

**Step 1: 在 UIManager 构造函数中添加状态属性**

在 `this.lastSubmissionTime = null;` 之后添加：
```javascript
// 上次反馈预览
this.lastFeedbackData = null;
this.lastFeedbackCollapsed = false;
```

**Step 2: 在 initUIElements 方法中添加预览卡片元素引用**

在 `this.submitBtn = Utils.safeQuerySelector('#submitBtn');` 之后添加：
```javascript
// 上次反馈预览元素
this.lastFeedbackPreview = Utils.safeQuerySelector('#lastFeedbackPreview');
this.lastFeedbackContent = Utils.safeQuerySelector('#lastFeedbackContent');
```

**Step 3: 在 UIManager 原型上添加 showLastFeedback 方法**

在 `setLastSubmissionTime` 方法之后添加：
```javascript
/**
 * 显示上次反馈预览
 * @param {Object} feedbackData - 反馈数据 { feedback: string, images: array }
 */
UIManager.prototype.showLastFeedback = function(feedbackData) {
    if (!feedbackData || (!feedbackData.feedback && (!feedbackData.images || feedbackData.images.length === 0))) {
        this.hideLastFeedback();
        return;
    }

    this.lastFeedbackData = feedbackData;
    
    var preview = Utils.safeQuerySelector('#lastFeedbackPreview');
    var content = Utils.safeQuerySelector('#lastFeedbackContent');
    
    if (!preview || !content) {
        console.warn('⚠️ 找不到上次反馈预览元素');
        return;
    }
    
    // 构建内容 HTML
    var html = '';
    
    // 文字内容
    if (feedbackData.feedback) {
        html += '<div class="last-feedback-text">' + this.escapeHtml(feedbackData.feedback) + '</div>';
    }
    
    // 图片指示器
    if (feedbackData.images && feedbackData.images.length > 0) {
        var imagesText = window.i18nManager ? 
            window.i18nManager.t('feedback.lastFeedback.imagesAttached', '张图片') : 
            '张图片';
        html += '<div class="last-feedback-images">';
        html += '<span class="last-feedback-images-icon">🖼️</span>';
        html += '<span>' + feedbackData.images.length + ' ' + imagesText + '</span>';
        html += '</div>';
    }
    
    content.innerHTML = html;
    
    // 显示预览卡片
    preview.style.display = 'block';
    
    // 恢复折叠状态
    if (this.lastFeedbackCollapsed) {
        preview.classList.add('collapsed');
    } else {
        preview.classList.remove('collapsed');
    }
    
    // 检查是否需要截断
    this.checkLastFeedbackTruncation();
    
    console.log('📤 已显示上次反馈预览');
};

/**
 * 隐藏上次反馈预览
 */
UIManager.prototype.hideLastFeedback = function() {
    var preview = Utils.safeQuerySelector('#lastFeedbackPreview');
    if (preview) {
        preview.style.display = 'none';
    }
    this.lastFeedbackData = null;
};

/**
 * 检查并处理内容截断
 */
UIManager.prototype.checkLastFeedbackTruncation = function() {
    var content = Utils.safeQuerySelector('#lastFeedbackContent');
    var preview = Utils.safeQuerySelector('#lastFeedbackPreview');
    
    if (!content || !preview) return;
    
    // 检查内容是否超过最大高度
    if (content.scrollHeight > 150) {
        preview.classList.add('truncated');
    } else {
        preview.classList.remove('truncated');
    }
};

/**
 * 切换上次反馈预览的折叠状态
 */
UIManager.prototype.toggleLastFeedbackCollapse = function() {
    var preview = Utils.safeQuerySelector('#lastFeedbackPreview');
    if (!preview) return;
    
    this.lastFeedbackCollapsed = !this.lastFeedbackCollapsed;
    
    if (this.lastFeedbackCollapsed) {
        preview.classList.add('collapsed');
    } else {
        preview.classList.remove('collapsed');
    }
    
    // 保存折叠偏好到 localStorage
    try {
        localStorage.setItem('lastFeedbackCollapsed', this.lastFeedbackCollapsed ? 'true' : 'false');
    } catch (e) {
        console.warn('⚠️ 无法保存折叠偏好');
    }
};

/**
 * 获取上次反馈数据
 */
UIManager.prototype.getLastFeedbackData = function() {
    return this.lastFeedbackData;
};

/**
 * 初始化上次反馈预览事件
 */
UIManager.prototype.initLastFeedbackEvents = function() {
    var self = this;
    
    // 从 localStorage 恢复折叠状态
    try {
        var saved = localStorage.getItem('lastFeedbackCollapsed');
        this.lastFeedbackCollapsed = saved === 'true';
    } catch (e) {
        this.lastFeedbackCollapsed = false;
    }
    
    // 折叠/展开按钮
    var toggleBtn = Utils.safeQuerySelector('#toggleLastFeedbackBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            self.toggleLastFeedbackCollapse();
        });
    }
    
    // 点击 header 也可以折叠/展开
    var header = Utils.safeQuerySelector('.last-feedback-header');
    if (header) {
        header.addEventListener('click', function(e) {
            // 如果点击的是按钮，不触发
            if (e.target.closest('.last-feedback-btn')) return;
            self.toggleLastFeedbackCollapse();
        });
    }
    
    console.log('✅ 上次反馈预览事件初始化完成');
};
```

---

### Task 5: 在 app.js 中集成预览卡片功能

**Files:**
- Modify: `src/mcp_feedback_enhanced/web/static/js/app.js`

**Step 1: 在 initApp 方法中初始化预览卡片事件**

在 UIManager 初始化之后，添加：
```javascript
// 初始化上次反馈预览事件
if (this.uiManager && this.uiManager.initLastFeedbackEvents) {
    this.uiManager.initLastFeedbackEvents();
}
```

**Step 2: 修改 submitFeedbackInternal 方法，提交成功后显示预览**

在 `this.uiManager.resetFeedbackForm(true);` 之后添加：
```javascript
// 显示上次反馈预览
if (this.uiManager && this.uiManager.showLastFeedback) {
    this.uiManager.showLastFeedback(feedbackData);
}
```

**Step 3: 添加复制和载入按钮事件处理**

在 initApp 或 initEventListeners 中添加：
```javascript
// 复制上次反馈
var copyLastFeedbackBtn = Utils.safeQuerySelector('#copyLastFeedbackBtn');
if (copyLastFeedbackBtn) {
    copyLastFeedbackBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        self.copyLastFeedback();
    });
}

// 载入上次反馈到输入框
var loadLastFeedbackBtn = Utils.safeQuerySelector('#loadLastFeedbackBtn');
if (loadLastFeedbackBtn) {
    loadLastFeedbackBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        self.loadLastFeedback();
    });
}
```

**Step 4: 添加 copyLastFeedback 和 loadLastFeedback 方法**

```javascript
/**
 * 复制上次反馈内容到剪贴板
 */
FeedbackApp.prototype.copyLastFeedback = function() {
    var feedbackData = this.uiManager ? this.uiManager.getLastFeedbackData() : null;
    if (!feedbackData || !feedbackData.feedback) {
        var noContent = window.i18nManager ? window.i18nManager.t('feedback.noContent') : '没有可复制的内容';
        Utils.showMessage(noContent, Utils.CONSTANTS.MESSAGE_WARNING);
        return;
    }
    
    var self = this;
    navigator.clipboard.writeText(feedbackData.feedback).then(function() {
        var copied = window.i18nManager ? window.i18nManager.t('feedback.lastFeedback.copied') : '已复制到剪贴板';
        Utils.showMessage(copied, Utils.CONSTANTS.MESSAGE_SUCCESS);
    }).catch(function(err) {
        console.error('复制失败:', err);
        var failed = window.i18nManager ? window.i18nManager.t('feedback.copyFailed') : '复制失败';
        Utils.showMessage(failed, Utils.CONSTANTS.MESSAGE_ERROR);
    });
};

/**
 * 载入上次反馈内容到输入框
 */
FeedbackApp.prototype.loadLastFeedback = function() {
    var feedbackData = this.uiManager ? this.uiManager.getLastFeedbackData() : null;
    if (!feedbackData) {
        return;
    }
    
    var feedbackInput = Utils.safeQuerySelector('#combinedFeedbackText');
    if (feedbackInput && feedbackData.feedback) {
        feedbackInput.value = feedbackData.feedback;
        feedbackInput.focus();
        
        var loaded = window.i18nManager ? window.i18nManager.t('feedback.lastFeedback.loaded') : '已载入到输入框';
        Utils.showMessage(loaded, Utils.CONSTANTS.MESSAGE_SUCCESS);
    }
    
    // 如果有图片，也恢复图片（可选功能）
    // 注意：图片恢复可能需要额外处理，暂时只恢复文字
};
```

**Step 5: 在新会话开始时隐藏预览卡片**

在处理新会话的逻辑中（handleNewSession 或类似方法）添加：
```javascript
// 隐藏上次反馈预览（新会话开始）
if (this.uiManager && this.uiManager.hideLastFeedback) {
    this.uiManager.hideLastFeedback();
}
```

---

### Task 6: 测试与验证

**Step 1: 手动测试提交流程**

1. 启动服务器
2. 输入反馈内容并提交
3. 验证：
   - 输入框被清空
   - 预览卡片出现，显示刚才输入的内容
   - 点击「复制」按钮能复制内容
   - 点击「载入」按钮能将内容填回输入框
   - 点击 header 或折叠按钮能收起/展开

**Step 2: 测试布局兼容性**

1. 切换到水平布局模式
2. 验证预览卡片正确显示在输入框上方
3. 验证折叠功能正常工作

**Step 3: 测试 i18n**

1. 切换到英文
2. 验证所有文本正确翻译

---

### Task 7: 提交代码

**Step 1: 检查所有修改的文件**

```bash
git status
```

**Step 2: 添加并提交**

```bash
git add src/mcp_feedback_enhanced/web/templates/feedback.html
git add src/mcp_feedback_enhanced/web/static/css/styles.css
git add src/mcp_feedback_enhanced/web/static/js/modules/ui-manager.js
git add src/mcp_feedback_enhanced/web/static/js/app.js
git add src/mcp_feedback_enhanced/web/locales/
git commit -m "feat: add last feedback preview card after submission"
```
