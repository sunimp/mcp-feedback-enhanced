/**
 * MCP Feedback Enhanced - UI 管理模組
 * =================================
 * 
 * 處理 UI 狀態更新、指示器管理和頁籤切換
 */

(function() {
    'use strict';

    // 確保命名空間和依賴存在
    window.MCPFeedback = window.MCPFeedback || {};
    const Utils = window.MCPFeedback.Utils;

    /**
     * UI 管理器建構函數
     */
    function UIManager(options) {
        options = options || {};
        
        // 當前狀態
        this.currentTab = options.currentTab || 'combined';
        this.feedbackState = Utils.CONSTANTS.FEEDBACK_WAITING;
        this.layoutMode = options.layoutMode || 'combined-vertical';
        this.lastSubmissionTime = null;
        
        // 上次反馈预览
        this.lastFeedbackData = null;
        this.lastFeedbackCollapsed = false;
        
        // UI 元素
        this.connectionIndicator = null;
        this.connectionText = null;
        this.tabButtons = null;
        this.tabContents = null;
        this.submitBtn = null;
        this.feedbackText = null;
        
        // 回調函數
        this.onTabChange = options.onTabChange || null;
        this.onLayoutModeChange = options.onLayoutModeChange || null;

        // 初始化防抖函數
        this.initDebounceHandlers();

        this.initUIElements();
    }

    /**
     * 初始化防抖處理器
     */
    UIManager.prototype.initDebounceHandlers = function() {
        // 為狀態指示器更新添加防抖
        this._debouncedUpdateStatusIndicator = Utils.DOM.debounce(
            this._originalUpdateStatusIndicator.bind(this),
            100,
            false
        );

        // 為狀態指示器元素更新添加防抖
        this._debouncedUpdateStatusIndicatorElement = Utils.DOM.debounce(
            this._originalUpdateStatusIndicatorElement.bind(this),
            50,
            false
        );
    };

    /**
     * 初始化 UI 元素
     */
    UIManager.prototype.initUIElements = function() {
        // 基本 UI 元素
        this.connectionIndicator = Utils.safeQuerySelector('#connectionIndicator');
        this.connectionText = Utils.safeQuerySelector('#connectionText');

        // 頁籤相關元素
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // 回饋相關元素
        this.submitBtn = Utils.safeQuerySelector('#submitBtn');
        
        // 上次反馈预览元素
        this.lastFeedbackPreview = Utils.safeQuerySelector('#lastFeedbackPreview');
        this.lastFeedbackContent = Utils.safeQuerySelector('#lastFeedbackContent');

        console.log('✅ UI 元素初始化完成');
    };

    /**
     * 初始化頁籤功能
     */
    UIManager.prototype.initTabs = function() {
        const self = this;
        
        // 設置頁籤點擊事件
        this.tabButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                const tabName = button.getAttribute('data-tab');
                self.switchTab(tabName);
            });
        });

        // 根據佈局模式確定初始頁籤
        let initialTab = this.currentTab;
        if (this.layoutMode.startsWith('combined')) {
            initialTab = 'combined';
        } else if (this.currentTab === 'combined') {
            initialTab = 'feedback';
        }

        // 設置初始頁籤
        this.setInitialTab(initialTab);
    };

    /**
     * 設置初始頁籤（不觸發保存）
     */
    UIManager.prototype.setInitialTab = function(tabName) {
        this.currentTab = tabName;
        this.updateTabDisplay(tabName);
        this.handleSpecialTabs(tabName);
        console.log('初始化頁籤: ' + tabName);
    };

    /**
     * 切換頁籤
     */
    UIManager.prototype.switchTab = function(tabName) {
        this.currentTab = tabName;
        this.updateTabDisplay(tabName);
        this.handleSpecialTabs(tabName);
        
        // 觸發回調
        if (this.onTabChange) {
            this.onTabChange(tabName);
        }
        
        console.log('切換到頁籤: ' + tabName);
    };

    /**
     * 更新頁籤顯示
     */
    UIManager.prototype.updateTabDisplay = function(tabName) {
        // 更新按鈕狀態
        this.tabButtons.forEach(function(button) {
            if (button.getAttribute('data-tab') === tabName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // 更新內容顯示
        this.tabContents.forEach(function(content) {
            if (content.id === 'tab-' + tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    };

    /**
     * 處理特殊頁籤
     */
    UIManager.prototype.handleSpecialTabs = function(tabName) {
        if (tabName === 'combined') {
            this.handleCombinedMode();
        }
    };

    /**
     * 處理合併模式
     */
    UIManager.prototype.handleCombinedMode = function() {
        console.log('切換到組合模式');
        
        // 確保合併模式的佈局樣式正確應用
        const combinedTab = Utils.safeQuerySelector('#tab-combined');
        if (combinedTab) {
            combinedTab.classList.remove('combined-vertical', 'combined-horizontal');
            if (this.layoutMode === 'combined-vertical') {
                combinedTab.classList.add('combined-vertical');
            } else if (this.layoutMode === 'combined-horizontal') {
                combinedTab.classList.add('combined-horizontal');
            }
        }
    };

    /**
     * 更新頁籤可見性
     */
    UIManager.prototype.updateTabVisibility = function() {
        const combinedTab = document.querySelector('.tab-button[data-tab="combined"]');
        const feedbackTab = document.querySelector('.tab-button[data-tab="feedback"]');
        const summaryTab = document.querySelector('.tab-button[data-tab="summary"]');

        // 只使用合併模式：顯示合併模式頁籤，隱藏回饋和AI摘要頁籤
        if (combinedTab) combinedTab.style.display = 'inline-block';
        if (feedbackTab) feedbackTab.style.display = 'none';
        if (summaryTab) summaryTab.style.display = 'none';
    };

    /**
     * 設置回饋狀態
     */
    UIManager.prototype.setFeedbackState = function(state, sessionId) {
        const previousState = this.feedbackState;
        this.feedbackState = state;

        if (sessionId) {
            console.log('🔄 會話 ID: ' + sessionId.substring(0, 8) + '...');
        }

        console.log('📊 狀態變更: ' + previousState + ' → ' + state);
        this.updateUIState();
        this.updateStatusIndicator();
    };

    /**
     * 更新 UI 狀態
     */
    UIManager.prototype.updateUIState = function() {
        this.updateSubmitButton();
        this.updateFeedbackInputs();
        this.updateImageUploadAreas();
    };

    /**
     * 更新提交按鈕狀態
     */
    UIManager.prototype.updateSubmitButton = function() {
        const submitButtons = [
            Utils.safeQuerySelector('#submitBtn')
        ].filter(function(btn) { return btn !== null; });

        const self = this;
        submitButtons.forEach(function(button) {
            if (!button) return;

            switch (self.feedbackState) {
                case Utils.CONSTANTS.FEEDBACK_WAITING:
                    button.textContent = window.i18nManager ? window.i18nManager.t('buttons.submit') : '提交回饋';
                    button.className = 'btn btn-primary';
                    button.disabled = false;
                    break;
                case Utils.CONSTANTS.FEEDBACK_PROCESSING:
                    button.textContent = window.i18nManager ? window.i18nManager.t('buttons.processing') : '處理中...';
                    button.className = 'btn btn-secondary';
                    button.disabled = true;
                    break;
                case Utils.CONSTANTS.FEEDBACK_SUBMITTED:
                    button.textContent = window.i18nManager ? window.i18nManager.t('buttons.submitted') : '已提交';
                    button.className = 'btn btn-success';
                    button.disabled = true;
                    break;
            }
        });
    };

    /**
     * 更新回饋輸入框狀態
     */
    UIManager.prototype.updateFeedbackInputs = function() {
        const feedbackInput = Utils.safeQuerySelector('#combinedFeedbackText');

        if (feedbackInput) {
            // 允許在提交後/處理中繼續輸入，避免影響後續輸入體驗
            feedbackInput.disabled = false;
        }
    };

    /**
     * 更新圖片上傳區域狀態
     */
    UIManager.prototype.updateImageUploadAreas = function() {
        const uploadAreas = [
            Utils.safeQuerySelector('#feedbackImageUploadArea'),
            Utils.safeQuerySelector('#combinedImageUploadArea')
        ].filter(function(area) { return area !== null; });

        const canUpload = this.feedbackState === Utils.CONSTANTS.FEEDBACK_WAITING;
        uploadAreas.forEach(function(area) {
            if (canUpload) {
                area.classList.remove('disabled');
            } else {
                area.classList.add('disabled');
            }
        });
    };

    /**
     * 更新狀態指示器（原始版本，供防抖使用）
     */
    UIManager.prototype._originalUpdateStatusIndicator = function() {
        const feedbackStatusIndicator = Utils.safeQuerySelector('#feedbackStatusIndicator');
        const combinedStatusIndicator = Utils.safeQuerySelector('#combinedFeedbackStatusIndicator');

        const statusInfo = this.getStatusInfo();

        if (feedbackStatusIndicator) {
            this._originalUpdateStatusIndicatorElement(feedbackStatusIndicator, statusInfo);
        }

        if (combinedStatusIndicator) {
            this._originalUpdateStatusIndicatorElement(combinedStatusIndicator, statusInfo);
        }

        // 減少重複日誌：只在狀態真正改變時記錄
        if (!this._lastStatusInfo || this._lastStatusInfo.status !== statusInfo.status) {
            console.log('✅ 狀態指示器已更新: ' + statusInfo.status + ' - ' + statusInfo.title);
            this._lastStatusInfo = statusInfo;
        }
    };

    /**
     * 更新狀態指示器（防抖版本）
     */
    UIManager.prototype.updateStatusIndicator = function() {
        if (this._debouncedUpdateStatusIndicator) {
            this._debouncedUpdateStatusIndicator();
        } else {
            // 回退到原始方法（防抖未初始化時）
            this._originalUpdateStatusIndicator();
        }
    };

    /**
     * 獲取狀態信息
     */
    UIManager.prototype.getStatusInfo = function() {
        let icon, title, message, status;

        switch (this.feedbackState) {
            case Utils.CONSTANTS.FEEDBACK_WAITING:
                icon = '⏳';
                title = window.i18nManager ? window.i18nManager.t('status.waiting.title') : '等待回饋';
                message = window.i18nManager ? window.i18nManager.t('status.waiting.message') : '請提供您的回饋意見';
                status = 'waiting';
                break;

            case Utils.CONSTANTS.FEEDBACK_PROCESSING:
                icon = '⚙️';
                title = window.i18nManager ? window.i18nManager.t('status.processing.title') : '處理中';
                message = window.i18nManager ? window.i18nManager.t('status.processing.message') : '正在提交您的回饋...';
                status = 'processing';
                break;

            case Utils.CONSTANTS.FEEDBACK_SUBMITTED:
                const timeStr = this.lastSubmissionTime ?
                    new Date(this.lastSubmissionTime).toLocaleTimeString() : '';
                icon = '✅';
                title = window.i18nManager ? window.i18nManager.t('status.submitted.title') : '回饋已提交';
                message = window.i18nManager ? window.i18nManager.t('status.submitted.message') : '等待下次 MCP 調用';
                if (timeStr) {
                    message += ' (' + timeStr + ')';
                }
                status = 'submitted';
                break;

            default:
                icon = '⏳';
                title = window.i18nManager ? window.i18nManager.t('status.waiting.title') : '等待回饋';
                message = window.i18nManager ? window.i18nManager.t('status.waiting.message') : '請提供您的回饋意見';
                status = 'waiting';
        }

        return { icon: icon, title: title, message: message, status: status };
    };

    /**
     * 更新單個狀態指示器元素（原始版本，供防抖使用）
     */
    UIManager.prototype._originalUpdateStatusIndicatorElement = function(element, statusInfo) {
        if (!element) return;

        // 更新狀態類別
        element.className = 'feedback-status-indicator status-' + statusInfo.status;
        element.style.display = 'block';

        // 更新標題
        const titleElement = element.querySelector('.status-title');
        if (titleElement) {
            titleElement.textContent = statusInfo.icon + ' ' + statusInfo.title;
        }

        // 更新訊息
        const messageElement = element.querySelector('.status-message');
        if (messageElement) {
            messageElement.textContent = statusInfo.message;
        }

        // 減少重複日誌：只記錄元素 ID 變化
        if (element.id) {
            console.log('🔧 已更新狀態指示器: ' + element.id + ' -> ' + statusInfo.status);
        }
    };

    /**
     * 更新單個狀態指示器元素（防抖版本）
     */
    UIManager.prototype.updateStatusIndicatorElement = function(element, statusInfo) {
        if (this._debouncedUpdateStatusIndicatorElement) {
            this._debouncedUpdateStatusIndicatorElement(element, statusInfo);
        } else {
            // 回退到原始方法（防抖未初始化時）
            this._originalUpdateStatusIndicatorElement(element, statusInfo);
        }
    };

    /**
     * 更新連接狀態
     */
    UIManager.prototype.updateConnectionStatus = function(status, text) {
        if (this.connectionIndicator) {
            this.connectionIndicator.className = 'connection-indicator ' + status;
        }
        if (this.connectionText) {
            this.connectionText.textContent = text;
        }
    };

    /**
     * 安全地渲染 Markdown 內容
     */
    UIManager.prototype.renderMarkdownSafely = function(content) {
        try {
            // 檢查 marked 和 DOMPurify 是否可用
            if (typeof window.marked === 'undefined' || typeof window.DOMPurify === 'undefined') {
                console.warn('⚠️ Markdown 庫未載入，使用純文字顯示');
                return this.escapeHtml(content);
            }

            // 配置 marked 使用 highlight.js
            if (typeof window.hljs !== 'undefined' && !this._markedConfigured) {
                window.marked.setOptions({
                    highlight: function(code, lang) {
                        if (lang && window.hljs.getLanguage(lang)) {
                            try {
                                return window.hljs.highlight(code, { language: lang }).value;
                            } catch (e) {
                                console.warn('⚠️ 代碼高亮失敗:', e);
                            }
                        }
                        // 自動檢測語言
                        try {
                            return window.hljs.highlightAuto(code).value;
                        } catch (e) {
                            return code;
                        }
                    },
                    langPrefix: 'hljs language-'
                });
                this._markedConfigured = true;
                console.log('✅ marked.js 已配置 highlight.js 代碼高亮');
            }

            // 使用 marked 解析 Markdown
            const htmlContent = window.marked.parse(content);

            // 使用 DOMPurify 清理 HTML
            const cleanHtml = window.DOMPurify.sanitize(htmlContent, {
                ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'a', 'hr', 'del', 's', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'span'],
                ALLOWED_ATTR: ['href', 'title', 'class', 'align', 'style'],
                ALLOW_DATA_ATTR: false
            });

            return cleanHtml;
        } catch (error) {
            console.error('❌ Markdown 渲染失敗:', error);
            return this.escapeHtml(content);
        }
    };

    /**
     * HTML 轉義函數
     */
    UIManager.prototype.escapeHtml = function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * 更新 AI 摘要內容
     */
    UIManager.prototype.updateAISummaryContent = function(summary) {
        console.log('📝 更新 AI 摘要內容...', '內容長度:', summary ? summary.length : 'undefined');
        console.log('📝 marked 可用:', typeof window.marked !== 'undefined');
        console.log('📝 DOMPurify 可用:', typeof window.DOMPurify !== 'undefined');

        // 渲染 Markdown 內容
        const renderedContent = this.renderMarkdownSafely(summary);
        console.log('📝 渲染後內容長度:', renderedContent ? renderedContent.length : 'undefined');

        const summaryContent = Utils.safeQuerySelector('#summaryContent');
        if (summaryContent) {
            summaryContent.innerHTML = renderedContent;
            console.log('✅ 已更新分頁模式摘要內容（Markdown 渲染）');
        } else {
            console.warn('⚠️ 找不到 #summaryContent 元素');
        }

        const combinedSummaryContent = Utils.safeQuerySelector('#combinedSummaryContent');
        if (combinedSummaryContent) {
            combinedSummaryContent.innerHTML = renderedContent;
            console.log('✅ 已更新合併模式摘要內容（Markdown 渲染）');
        } else {
            console.warn('⚠️ 找不到 #combinedSummaryContent 元素');
        }
    };

    /**
     * 重置回饋表單
     * @param {boolean} clearText - 是否清空文字內容，預設為 false
     */
    UIManager.prototype.resetFeedbackForm = function(clearText) {
        console.log('🔄 重置回饋表單...');

        // 根據參數決定是否清空回饋輸入
        const feedbackInput = Utils.safeQuerySelector('#combinedFeedbackText');
        if (feedbackInput) {
            if (clearText === true) {
                feedbackInput.value = '';
                console.log('📝 已清空文字內容');
            }
            // 保持輸入框可用，避免提交後鎖定
            feedbackInput.disabled = false;
        }

        // 重新啟用提交按鈕
        const submitButtons = [
            Utils.safeQuerySelector('#submitBtn')
        ].filter(function(btn) { return btn !== null; });

        submitButtons.forEach(function(button) {
            button.disabled = false;
            const defaultText = window.i18nManager ? window.i18nManager.t('buttons.submit') : '提交回饋';
            button.textContent = button.getAttribute('data-original-text') || defaultText;
        });

        console.log('✅ 回饋表單重置完成');
    };

    /**
     * 應用佈局模式
     */
    UIManager.prototype.applyLayoutMode = function(layoutMode) {
        this.layoutMode = layoutMode;
        
        const expectedClassName = 'layout-' + layoutMode;
        if (document.body.className !== expectedClassName) {
            console.log('應用佈局模式: ' + layoutMode);
            document.body.className = expectedClassName;
        }

        this.updateTabVisibility();
        
        // 如果當前頁籤不是合併模式，則切換到合併模式頁籤
        if (this.currentTab !== 'combined') {
            this.currentTab = 'combined';
        }
        
        // 觸發回調
        if (this.onLayoutModeChange) {
            this.onLayoutModeChange(layoutMode);
        }
    };

    /**
     * 獲取當前頁籤
     */
    UIManager.prototype.getCurrentTab = function() {
        return this.currentTab;
    };

    /**
     * 獲取當前回饋狀態
     */
    UIManager.prototype.getFeedbackState = function() {
        return this.feedbackState;
    };

    /**
     * 設置最後提交時間
     */
    UIManager.prototype.setLastSubmissionTime = function(timestamp) {
        this.lastSubmissionTime = timestamp;
        this.updateStatusIndicator();
    };

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
        
        // 保存到 localStorage
        this.saveLastFeedbackToStorage(feedbackData);
        
        this.renderLastFeedbackPreview(feedbackData);
    };

    /**
     * 保存上次反馈到 localStorage
     */
    UIManager.prototype.saveLastFeedbackToStorage = function(feedbackData) {
        try {
            // 只保存文字内容，不保存图片数据（太大）
            var dataToSave = {
                feedback: feedbackData.feedback || '',
                imageCount: feedbackData.images ? feedbackData.images.length : 0,
                timestamp: Date.now()
            };
            localStorage.setItem('mcp_last_feedback', JSON.stringify(dataToSave));
            console.log('💾 上次反馈已保存到 localStorage');
        } catch (e) {
            console.warn('⚠️ 无法保存上次反馈到 localStorage:', e);
        }
    };

    /**
     * 从 localStorage 加载上次反馈
     */
    UIManager.prototype.loadLastFeedbackFromStorage = function() {
        try {
            var saved = localStorage.getItem('mcp_last_feedback');
            if (saved) {
                var data = JSON.parse(saved);
                // 构建 feedbackData 格式
                var feedbackData = {
                    feedback: data.feedback || '',
                    images: [], // 图片无法恢复，只显示数量
                    _imageCount: data.imageCount || 0, // 用于显示历史图片数量
                    _timestamp: data.timestamp
                };
                return feedbackData;
            }
        } catch (e) {
            console.warn('⚠️ 无法从 localStorage 加载上次反馈:', e);
        }
        return null;
    };

    /**
     * 渲染上次反馈预览卡片
     */
    UIManager.prototype.renderLastFeedbackPreview = function(feedbackData) {
        var self = this;
        var preview = Utils.safeQuerySelector('#lastFeedbackPreview');
        var content = Utils.safeQuerySelector('#lastFeedbackContent');
        
        if (!preview || !content) {
            console.warn('⚠️ 找不到上次反馈预览元素，将在 100ms 后重试');
            // 延迟重试一次
            setTimeout(function() {
                var retryPreview = Utils.safeQuerySelector('#lastFeedbackPreview');
                var retryContent = Utils.safeQuerySelector('#lastFeedbackContent');
                if (retryPreview && retryContent) {
                    self._doRenderLastFeedbackPreview(retryPreview, retryContent, feedbackData);
                } else {
                    console.error('❌ 重试后仍找不到上次反馈预览元素');
                }
            }, 100);
            return;
        }
        
        this._doRenderLastFeedbackPreview(preview, content, feedbackData);
    };

    /**
     * 实际渲染上次反馈预览卡片
     */
    UIManager.prototype._doRenderLastFeedbackPreview = function(preview, content, feedbackData) {
        // 构建内容 HTML
        var html = '';
        
        // 文字内容
        if (feedbackData.feedback) {
            html += '<div class="last-feedback-text">' + this.escapeHtml(feedbackData.feedback) + '</div>';
        }
        
        // 图片指示器 - 支持实际图片和历史图片数量
        var imageCount = (feedbackData.images && feedbackData.images.length > 0) 
            ? feedbackData.images.length 
            : (feedbackData._imageCount || 0);
            
        if (imageCount > 0) {
            var imagesText = window.i18nManager ? 
                window.i18nManager.t('feedback.lastFeedback.imagesAttached', '张图片') : 
                '张图片';
            html += '<div class="last-feedback-images">';
            html += '<span class="last-feedback-images-icon">🖼️</span>';
            html += '<span>' + imageCount + ' ' + imagesText + '</span>';
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
        
        console.log('🔧 开始初始化上次反馈预览...');
        
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
        
        // 从 localStorage 恢复上次反馈数据
        var savedFeedback = this.loadLastFeedbackFromStorage();
        console.log('🔍 从 localStorage 加载的反馈数据:', savedFeedback);
        
        if (savedFeedback && (savedFeedback.feedback || savedFeedback._imageCount > 0)) {
            this.lastFeedbackData = savedFeedback;
            this.renderLastFeedbackPreview(savedFeedback);
            console.log('📂 已从 localStorage 恢复上次反馈预览');
        } else {
            console.log('📭 localStorage 中没有上次反馈数据');
        }
        
        console.log('✅ 上次反馈预览事件初始化完成');
    };

    // 將 UIManager 加入命名空間
    window.MCPFeedback.UIManager = UIManager;

    console.log('✅ UIManager 模組載入完成');

})();
