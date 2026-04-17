// ===== State Management =====
const state = {
    images: [],
    currentIndex: 0,
    watermarkType: 'text',
    watermarkImage: null,
    settings: {
        text: '© My Brand',
        fontSize: 32,
        fontColor: '#ffffff',
        opacity: 70,
        position: 'middle-center',
        padding: 20,
        scale: 20
    },
    exportSettings: {
        format: 'jpeg', // jpeg or png
        quality: 85 // 10-100
    },
    isLoading: false,
    isDownloading: false,
    loadProgress: { current: 0, total: 0 },
    viewMode: 'focus'
};

// ===== DOM Elements =====
const elements = {
    uploadZone: document.getElementById('uploadZone'),
    imageInput: document.getElementById('imageInput'),
    previewArea: document.getElementById('previewArea'),
    thumbnailsContainer: document.getElementById('thumbnailsContainer'),
    previewCanvas: document.getElementById('previewCanvas'),
    imageCount: document.getElementById('imageCount'),
    downloadHint: document.getElementById('downloadHint'),
    textTypeBtn: document.getElementById('textTypeBtn'),
    imageTypeBtn: document.getElementById('imageTypeBtn'),
    textSettings: document.getElementById('textSettings'),
    imageSettings: document.getElementById('imageSettings'),
    watermarkText: document.getElementById('watermarkText'),
    fontSize: document.getElementById('fontSize'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    fontColor: document.getElementById('fontColor'),
    fontColorValue: document.getElementById('fontColorValue'),
    watermarkUploadZone: document.getElementById('watermarkUploadZone'),
    watermarkImageInput: document.getElementById('watermarkImageInput'),
    watermarkPreview: document.getElementById('watermarkPreview'),
    watermarkPreviewImg: document.getElementById('watermarkPreviewImg'),
    removeWatermark: document.getElementById('removeWatermark'),
    watermarkScale: document.getElementById('watermarkScale'),
    watermarkScaleValue: document.getElementById('watermarkScaleValue'),
    opacity: document.getElementById('opacity'),
    opacityValue: document.getElementById('opacityValue'),
    padding: document.getElementById('padding'),
    paddingValue: document.getElementById('paddingValue'),
    addMoreBtn: document.getElementById('addMoreBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    // Export settings
    formatJpg: document.getElementById('formatJpg'),
    formatPng: document.getElementById('formatPng'),
    imageQuality: document.getElementById('imageQuality'),
    qualityValue: document.getElementById('qualityValue'),
    qualityGroup: document.getElementById('qualityGroup'),
    // Modal
    processingModal: document.getElementById('processingModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalDesc: document.getElementById('modalDesc'),
    modalProgressBar: document.getElementById('modalProgressBar'),
    modalProgressText: document.getElementById('modalProgressText')
};

// ===== Initialization =====
function init() {
    setupEventListeners();
    setupDragAndDrop();
    updateExportUI();
}

function setupEventListeners() {
    elements.imageInput.addEventListener('change', handleImageUpload);
    elements.addMoreBtn.addEventListener('click', () => elements.imageInput.click());
    elements.clearAllBtn.addEventListener('click', clearAllImages);
    elements.downloadAllBtn.addEventListener('click', downloadAllImages);

    elements.textTypeBtn.addEventListener('click', () => setWatermarkType('text'));
    elements.imageTypeBtn.addEventListener('click', () => setWatermarkType('image'));

    elements.watermarkText.addEventListener('input', (e) => {
        state.settings.text = e.target.value;
        updatePreview();
    });

    elements.fontSize.addEventListener('input', (e) => {
        state.settings.fontSize = parseInt(e.target.value);
        elements.fontSizeValue.textContent = `${e.target.value}px`;
        updatePreview();
    });

    elements.fontColor.addEventListener('input', (e) => {
        state.settings.fontColor = e.target.value;
        elements.fontColorValue.textContent = e.target.value;
        updatePreview();
    });

    elements.watermarkImageInput.addEventListener('change', handleWatermarkUpload);
    elements.removeWatermark.addEventListener('click', removeWatermarkImage);

    elements.watermarkScale.addEventListener('input', (e) => {
        state.settings.scale = parseInt(e.target.value);
        elements.watermarkScaleValue.textContent = `${e.target.value}%`;
        updatePreview();
    });

    elements.opacity.addEventListener('input', (e) => {
        state.settings.opacity = parseInt(e.target.value);
        elements.opacityValue.textContent = `${e.target.value}%`;
        updatePreview();
    });

    elements.padding.addEventListener('input', (e) => {
        state.settings.padding = parseInt(e.target.value);
        elements.paddingValue.textContent = `${e.target.value}px`;
        updatePreview();
    });

    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.position = btn.dataset.position;
            updatePreview();
        });
    });

    // View Toggle
    elements.viewFocusBtn = document.getElementById('viewFocusBtn');
    elements.viewGridBtn = document.getElementById('viewGridBtn');
    elements.focusView = document.getElementById('focusView');
    elements.gridView = document.getElementById('gridView');
    elements.imageGrid = document.getElementById('imageGrid');

    elements.viewFocusBtn.addEventListener('click', () => setViewMode('focus'));
    elements.viewGridBtn.addEventListener('click', () => setViewMode('grid'));

    // Export settings
    elements.formatJpg.addEventListener('click', () => setExportFormat('jpeg'));
    elements.formatPng.addEventListener('click', () => setExportFormat('png'));

    elements.imageQuality.addEventListener('input', (e) => {
        state.exportSettings.quality = parseInt(e.target.value);
        elements.qualityValue.textContent = `${e.target.value}%`;
    });
}

function setViewMode(mode) {
    state.viewMode = mode;

    // Update buttons
    const activeClass = 'view-mode-active';
    if (mode === 'focus') {
        elements.viewFocusBtn.classList.add(activeClass);
        elements.viewGridBtn.classList.remove(activeClass);
        elements.focusView.classList.remove('hidden');
        elements.gridView.classList.add('hidden');
        elements.thumbnailsContainer.parentElement.classList.remove('hidden'); // Show strip in focus mode
        updatePreview();
    } else {
        elements.viewGridBtn.classList.add(activeClass);
        elements.viewFocusBtn.classList.remove(activeClass);
        elements.gridView.classList.remove('hidden');
        elements.focusView.classList.add('hidden');
        elements.thumbnailsContainer.parentElement.classList.add('hidden'); // Hide strip in grid mode
        renderGrid();
    }
}

function setExportFormat(format) {
    state.exportSettings.format = format;
    updateExportUI();
}

function updateExportUI() {
    const isPng = state.exportSettings.format === 'png';
    elements.formatJpg.classList.toggle('active', !isPng);
    elements.formatPng.classList.toggle('active', isPng);
    // Hide quality slider for PNG (lossless)
    elements.qualityGroup.style.display = isPng ? 'none' : 'block';
}

function setupDragAndDrop() {
    [elements.uploadZone, elements.watermarkUploadZone].forEach(zone => {
        if (!zone) return;
        ['dragenter', 'dragover'].forEach(e => zone.addEventListener(e, ev => { ev.preventDefault(); zone.classList.add('dragover'); }));
        ['dragleave', 'drop'].forEach(e => zone.addEventListener(e, ev => { ev.preventDefault(); zone.classList.remove('dragover'); }));
    });
    elements.uploadZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
}

// ===== Optimized Image Handling =====
function handleImageUpload(e) {
    handleFiles(e.target.files);
    e.target.value = '';
}

async function handleFiles(files) {
    if (state.isLoading) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles = Array.from(files).filter(f => validTypes.includes(f.type));

    if (validFiles.length === 0) return;

    state.isLoading = true;
    state.loadProgress = { current: 0, total: validFiles.length };

    elements.uploadZone.classList.add('hidden');
    elements.previewArea.classList.remove('hidden');
    updateLoadingStatus();

    const BATCH_SIZE = 10;

    for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
        const batch = validFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(file => processFile(file)));
        state.loadProgress.current = Math.min(i + BATCH_SIZE, validFiles.length);
        updateLoadingStatus();
        await new Promise(r => setTimeout(r, 10));
    }

    state.isLoading = false;

    // Load first image if needed
    if (state.images.length > 0 && state.currentIndex === 0) {
        // Just init view, default to focus mode or existing mode
        if (!state.viewMode) setViewMode('focus');
        else if (state.viewMode === 'focus') await loadImageForPreview(0);
        else renderGrid();
    }

    updateUI();
}

function processFile(file) {
    return new Promise(resolve => {
        const blobUrl = URL.createObjectURL(file);
        state.images.push({
            name: file.name,
            file: file,
            blobUrl: blobUrl,
            loaded: false,
            image: null
        });
        resolve();
    });
}

function updateLoadingStatus() {
    const { current, total } = state.loadProgress;
    elements.imageCount.textContent = `Đang tải... ${current}/${total} ảnh`;
}

async function loadImageForPreview(index) {
    const item = state.images[index];
    if (!item || item.loaded) return item?.image;

    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            item.image = img;
            item.loaded = true;
            resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = item.blobUrl;
    });
}

function handleWatermarkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
        state.watermarkImage = img;
        elements.watermarkPreviewImg.src = blobUrl;
        elements.watermarkPreview.classList.remove('hidden');
        elements.watermarkUploadZone.classList.add('hidden');
        updatePreview();
    };
    img.src = blobUrl;
    e.target.value = '';
}

function removeWatermarkImage() {
    state.watermarkImage = null;
    elements.watermarkPreview.classList.add('hidden');
    elements.watermarkUploadZone.classList.remove('hidden');
    updatePreview();
}

function clearAllImages() {
    state.images.forEach(item => {
        if (item.blobUrl) URL.revokeObjectURL(item.blobUrl);
    });
    state.images = [];
    state.currentIndex = 0;
    updateUI();
}

// ===== UI Updates =====
function updateUI() {
    const hasImages = state.images.length > 0;
    const count = state.images.length;

    elements.uploadZone.classList.toggle('hidden', hasImages);
    elements.previewArea.classList.toggle('hidden', !hasImages);
    elements.imageCount.textContent = `${count} ảnh đã chọn`;

    // Update download hint
    if (count === 1) {
        elements.downloadHint.textContent = `Tải file ${state.exportSettings.format.toUpperCase()} đơn lẻ`;
    } else if (count > 1) {
        elements.downloadHint.textContent = `Tải file ZIP (${count} ảnh, đánh số 1-${count})`;
    } else {
        elements.downloadHint.textContent = '';
    }

    if (state.viewMode === 'grid') {
        renderGrid();
    } else {
        renderThumbnails();
        if (hasImages) updatePreview();
    }
}

function renderGrid() {
    const container = elements.imageGrid;
    container.innerHTML = '';

    state.images.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = `grid-item ${i === state.currentIndex ? 'selected' : ''}`;
        div.innerHTML = `
            <img src="${item.blobUrl}" alt="${item.name}" loading="lazy">
            <div class="grid-item-actions">
                <button class="remove-btn" title="Xóa ảnh này">×</button>
            </div>
            <span class="index-badge">${i + 1}</span>
        `;

        div.addEventListener('click', (e) => {
            if (e.target.closest('.remove-btn')) {
                e.stopPropagation();
                removeImage(i);
            } else {
                state.currentIndex = i;
                setViewMode('focus');
            }
        });

        container.appendChild(div);
    });
}

function renderThumbnails() {
    const container = elements.thumbnailsContainer;
    container.innerHTML = '';

    state.images.forEach((item, i) => {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail ${i === state.currentIndex ? 'active' : ''}`;
        thumb.innerHTML = `
            <img src="${item.blobUrl}" alt="${item.name}" loading="lazy">
            <span class="thumb-index">${i + 1}</span>
            <button class="remove-btn" data-index="${i}">×</button>
        `;

        thumb.addEventListener('click', async (e) => {
            if (e.target.classList.contains('remove-btn')) {
                e.stopPropagation(); // Prevent preview selection when removing
                removeImage(i);
            } else {
                state.currentIndex = i;
                await loadImageForPreview(i);
                updateUI();
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });

        container.appendChild(thumb);
    });
}

function removeImage(index) {
    const item = state.images[index];
    if (item.blobUrl) URL.revokeObjectURL(item.blobUrl);

    state.images.splice(index, 1);
    if (state.currentIndex >= state.images.length) {
        state.currentIndex = Math.max(0, state.images.length - 1);
    }
    updateUI();
}

function setWatermarkType(type) {
    state.watermarkType = type;
    elements.textTypeBtn.classList.toggle('active', type === 'text');
    elements.imageTypeBtn.classList.toggle('active', type === 'image');
    elements.textSettings.classList.toggle('hidden', type !== 'text');
    elements.imageSettings.classList.toggle('hidden', type !== 'image');
    updatePreview();
}

// ===== Preview & Rendering =====
async function updatePreview() {
    if (state.viewMode !== 'focus') return; // Only process canvas in focus mode

    if (state.images.length === 0) return;

    const currentItem = state.images[state.currentIndex];
    if (!currentItem) return;

    if (!currentItem.loaded) {
        await loadImageForPreview(state.currentIndex);
    }

    if (!currentItem.image) return;

    const canvas = elements.previewCanvas;
    const ctx = canvas.getContext('2d');
    const img = currentItem.image;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);
    applyWatermark(ctx, img.width, img.height);
}

function applyWatermark(ctx, width, height) {
    const { position, padding, opacity } = state.settings;
    ctx.globalAlpha = opacity / 100;

    if (state.watermarkType === 'text') {
        drawTextWatermark(ctx, width, height, position, padding);
    } else if (state.watermarkImage) {
        drawImageWatermark(ctx, width, height, position, padding);
    }

    ctx.globalAlpha = 1;
}

function drawTextWatermark(ctx, canvasWidth, canvasHeight, position, padding) {
    const { text, fontSize, fontColor } = state.settings;

    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = fontColor;
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    const { x, y } = calculatePosition(position, padding, canvasWidth, canvasHeight, textWidth, textHeight);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(text, x, y + textHeight / 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawImageWatermark(ctx, canvasWidth, canvasHeight, position, padding) {
    const { scale } = state.settings;
    const watermark = state.watermarkImage;

    const maxWidth = canvasWidth * (scale / 100);
    const ratio = maxWidth / watermark.width;
    const wmWidth = maxWidth;
    const wmHeight = watermark.height * ratio;

    const { x, y } = calculatePosition(position, padding, canvasWidth, canvasHeight, wmWidth, wmHeight);
    ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
}

function calculatePosition(position, padding, canvasWidth, canvasHeight, elementWidth, elementHeight) {
    let x, y;
    const [vertical, horizontal] = position.split('-');

    switch (horizontal) {
        case 'left': x = padding; break;
        case 'center': x = (canvasWidth - elementWidth) / 2; break;
        case 'right': x = canvasWidth - elementWidth - padding; break;
    }

    switch (vertical) {
        case 'top': y = padding; break;
        case 'middle': y = (canvasHeight - elementHeight) / 2; break;
        case 'bottom': y = canvasHeight - elementHeight - padding; break;
    }

    return { x, y };
}

// ===== Processing Modal Helpers =====
function showProcessingModal(title, desc) {
    elements.processingModal.classList.remove('hidden');
    elements.processingModal.classList.add('flex');
    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = desc;
    updateModalProgress(0, '0%');
}

function hideProcessingModal() {
    elements.processingModal.classList.add('hidden');
    elements.processingModal.classList.remove('flex');
}

function updateModalProgress(percent, text) {
    elements.modalProgressBar.style.width = `${percent}%`;
    elements.modalProgressText.textContent = text || `${Math.round(percent)}%`;
}

// ===== Download with ZIP support =====
async function downloadAllImages() {
    if (state.images.length === 0 || state.isDownloading) return;

    state.isDownloading = true;
    const btn = elements.downloadAllBtn;
    const originalText = btn.innerHTML;
    const total = state.images.length;
    const { format, quality } = state.exportSettings;
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    try {
        if (total === 1) {
            // Single image: direct download
            showProcessingModal('Đang xử lý...', 'Đang chuẩn bị file...');
            btn.disabled = true;
            
            updateModalProgress(50);
            await processAndDownloadSingle(0, ext);
            
            updateModalProgress(100, 'Hoàn tất!');
            elements.modalTitle.textContent = 'Thành công!';
            elements.modalDesc.textContent = 'Đã tải xong ảnh về máy';
            
            setTimeout(() => {
                hideProcessingModal();
                btn.disabled = false;
            }, 1500);
        } else {
            // Multiple images: create ZIP
            btn.disabled = true;
            await downloadAsZip(btn, originalText, total, format, quality, ext);
        }
    } catch (error) {
        console.error('Download error:', error);
        hideProcessingModal();
        btn.disabled = false;
    }

    state.isDownloading = false;
}

async function downloadAsZip(btn, originalText, total, format, quality, ext) {
    const zip = new JSZip();
    const folder = zip.folder('watermarked_images');

    showProcessingModal('Đang xử lý ảnh...', 'Đang áp dụng watermark...');

    for (let i = 0; i < total; i++) {
        const percent = (i / total) * 100;
        updateModalProgress(percent, `Đã xử lý ${i}/${total}`);

        const blob = await processImageToBlob(i, format, quality);
        if (blob) {
            // Name files as 1.jpg, 2.jpg, etc.
            const fileName = `${i + 1}.${ext}`;
            folder.file(fileName, blob);
        }

        // Allow UI to update
        await new Promise(r => setTimeout(r, 10));
    }

    // Generate ZIP
    elements.modalTitle.textContent = 'Đang nén file ZIP...';
    elements.modalDesc.textContent = 'Quá trình này có thể mất vài phút cho nhiều ảnh lớn';
    updateModalProgress(0, 'Chuẩn bị nén...');

    const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    }, (metadata) => {
        updateModalProgress(metadata.percent, `Đang nén ${Math.round(metadata.percent)}%`);
    });

    // Download ZIP
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `watermarked_${total}_images.zip`;
    link.click();
    URL.revokeObjectURL(link.href);

    // Done
    elements.modalTitle.textContent = 'Thành công!';
    elements.modalDesc.textContent = `Đã tải xuống ${total} ảnh`;
    updateModalProgress(100, 'Hoàn tất!');

    setTimeout(() => {
        hideProcessingModal();
        btn.disabled = false;
    }, 2000);
}

async function processImageToBlob(index, format, quality) {
    const item = state.images[index];

    if (!item.loaded) {
        await loadImageForPreview(index);
    }

    if (!item.image) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = item.image.width;
    canvas.height = item.image.height;

    ctx.drawImage(item.image, 0, 0);
    applyWatermark(ctx, item.image.width, item.image.height);

    return new Promise(resolve => {
        canvas.toBlob(
            blob => {
                // Clean up memory for images not currently previewed
                if (index !== state.currentIndex && state.viewMode === 'grid') {
                    // In grid mode we might want to keep memory clean
                    // But if we navigate back to focus, we reload.
                    // This logic is fine.
                    item.image = null;
                    item.loaded = false;
                }
                resolve(blob);
            },
            `image/${format}`,
            quality / 100
        );
    });
}

async function processAndDownloadSingle(index, ext) {
    const item = state.images[index];
    const { format, quality } = state.exportSettings;

    if (!item.loaded) {
        await loadImageForPreview(index);
    }

    if (!item.image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = item.image.width;
    canvas.height = item.image.height;

    ctx.drawImage(item.image, 0, 0);
    applyWatermark(ctx, item.image.width, item.image.height);

    const link = document.createElement('a');
    link.download = `1.${ext}`;

    if (format === 'jpeg') {
        link.href = canvas.toDataURL('image/jpeg', quality / 100);
    } else {
        link.href = canvas.toDataURL('image/png');
    }

    link.click();
}

// ===== Start App =====
init();

// ===== Range Slider Progress Color =====
document.querySelectorAll('.range-slider').forEach(slider => {
    function updateSliderColor() {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, #6366f1 ${value}%, #e2e8f0 ${value}%)`;
    }
    slider.addEventListener('input', updateSliderColor);
    // Initialize color on load
    updateSliderColor();
});
