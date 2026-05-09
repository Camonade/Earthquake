// 地震遗迹景观页面逻辑
class EarthquakeHeritage {
    constructor() {
        this.heritageData = [];
        this.filteredData = [];
        this.currentFilters = {
            continent: '',
            year: '',
            magnitude: '',
            search: ''
        };

        this.localImageMap = {
            tanlu_fault: ['images/郯庐断裂带.png', 'images/郯庐断裂带2.png'],
            tancheng_1668: ['images/熊耳山大裂谷.png'],
            jiji_1999_canyon: ['images/大安溪峡谷.png'],
            jiuzhaigou_waterfall: ['images/九寨沟熊猫海瀑布.png'],
            landslide_dam_lakes: ['images/小南海堰塞湖.png', 'images/党家岔堰塞湖.png'],
            beijing_sand_liquefaction: ['images/沙火山.png'],
            okavango_delta: ['images/奥卡万戈三角洲.png'],
            haiyuan_guliu: ['images/海原地震古柳撕裂.png'],
            tianzhu_mountain: ['images/天柱山双乳峰.png'],
            east_african_rift: ['images/东非大裂谷.png'],
            huashan_west_peak: ['images/华山西峰.png'],
            weihe_valley: ['images/渭河谷地.png'],
            datong_yungang_caves: ['images/大同云冈石窟.png'],
            tiger_mountain_collapse: ['images/崩塌老虎上山.png']
        };

        this.init();
    }

    async init() {
        await this.loadHeritageData();
        this.setupEventListeners();
        this.renderHeritageGrid();
    }

    async loadHeritageData() {
        try {
            const response = await fetch('earthquake-heritage.json');
            this.heritageData = await response.json();
            this.filteredData = [...this.heritageData];
        } catch (error) {
            console.error('加载地震遗迹数据失败:', error);
            this.showError('数据加载失败，请刷新页面重试');
        }
    }

    setupEventListeners() {
        // 筛选器事件
        document.getElementById('continentFilter').addEventListener('change', (e) => {
            this.currentFilters.continent = e.target.value;
            this.applyFilters();
        });

        document.getElementById('yearFilter').addEventListener('change', (e) => {
            this.currentFilters.year = e.target.value;
            this.applyFilters();
        });

        document.getElementById('magnitudeFilter').addEventListener('change', (e) => {
            this.currentFilters.magnitude = e.target.value;
            this.applyFilters();
        });

        // 搜索事件
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            this.currentFilters.search = searchInput.value.toLowerCase();
            this.applyFilters();
        });

        // 模态框事件
        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('heritageModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('heritageModal')) {
                this.closeModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    applyFilters() {
        this.filteredData = this.heritageData.filter(site => {
            // 大洲筛选
            if (this.currentFilters.continent) {
                const continent = this.getContinent(site.location);
                if (continent !== this.currentFilters.continent) {
                    return false;
                }
            }

            // 年份筛选
            if (this.currentFilters.year) {
                const yearRange = this.parseYearRange(this.currentFilters.year);
                if (site.year < yearRange.min || site.year > yearRange.max) {
                    return false;
                }
            }

            // 震级筛选
            if (this.currentFilters.magnitude) {
                const magRange = this.parseMagnitudeRange(this.currentFilters.magnitude);
                if (site.magnitude < magRange.min || site.magnitude > magRange.max) {
                    return false;
                }
            }

            // 搜索筛选
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${site.name} ${site.location} ${site.description} ${site.features.join(' ')}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.renderHeritageGrid();
    }

    getContinent(location) {
        const continentMap = {
            '中国': '亚洲',
            '日本': '亚洲',
            '尼泊尔': '亚洲',
            '美国': '北美洲',
            '墨西哥': '北美洲',
            '意大利': '欧洲',
            '新西兰': '大洋洲'
        };

        for (const [country, continent] of Object.entries(continentMap)) {
            if (location.includes(country)) {
                return continent;
            }
        }

        return '其他';
    }

    parseYearRange(yearRange) {
        switch (yearRange) {
            case '1900-1950':
                return { min: 1900, max: 1950 };
            case '1951-2000':
                return { min: 1951, max: 2000 };
            case '2001-现在':
                return { min: 2001, max: new Date().getFullYear() };
            default:
                return { min: 0, max: 9999 };
        }
    }

    parseMagnitudeRange(magRange) {
        switch (magRange) {
            case '6-7':
                return { min: 6.0, max: 7.0 };
            case '7-8':
                return { min: 7.0, max: 8.0 };
            case '8+':
                return { min: 8.0, max: 10.0 };
            default:
                return { min: 0, max: 10.0 };
        }
    }

    renderHeritageGrid() {
        const grid = document.getElementById('heritageGrid');
        const loading = document.getElementById('loading');
        const noResults = document.getElementById('noResults');

        loading.style.display = 'none';

        if (this.filteredData.length === 0) {
            noResults.style.display = 'block';
            grid.innerHTML = '';
            return;
        }

        noResults.style.display = 'none';
        grid.innerHTML = '';

        this.filteredData.forEach(site => {
            const card = this.createHeritageCard(site);
            grid.appendChild(card);
        });
    }

    getLocalImageCandidates(site) {
        const rawName = site.name || site.id || 'unknown';
        const safeName = encodeURIComponent(rawName.trim());
        return [
            `images/${safeName}.png`,
            `images/${safeName}.jpg`,
            `images/${safeName}.jpeg`,
            `images/${encodeURIComponent(site.id)}.png`,
            `images/${encodeURIComponent(site.id)}.jpg`,
            `images/${encodeURIComponent(site.id)}.jpeg`
        ];
    }

    normalizeUrl(url) {
        return url.startsWith('http') ? url : encodeURI(url);
    }

    getLocalImageUrls(site) {
        const mapped = this.localImageMap[site.id];
        if (mapped && mapped.length) {
            return mapped.map(url => this.normalizeUrl(url));
        }

        const rawName = site.name || site.id || 'unknown';
        const safeName = encodeURIComponent(rawName.trim());
        return [
            this.normalizeUrl(`images/${safeName}.png`),
            this.normalizeUrl(`images/${safeName}.jpg`),
            this.normalizeUrl(`images/${safeName}.jpeg`),
            this.normalizeUrl(`images/${encodeURIComponent(site.id)}.png`),
            this.normalizeUrl(`images/${encodeURIComponent(site.id)}.jpg`),
            this.normalizeUrl(`images/${encodeURIComponent(site.id)}.jpeg`)
        ];
    }

    loadImageWithFallback(img, candidates, onLastFail) {
        const tryNext = () => {
            if (!candidates.length) {
                if (typeof onLastFail === 'function') {
                    onLastFail();
                } else {
                    img.style.display = 'none';
                }
                return;
            }

            const nextUrl = candidates.shift();
            img.onerror = tryNext;
            img.src = this.normalizeUrl(nextUrl);
        };

        tryNext();
    }

    createHeritageCard(site) {
        const card = document.createElement('div');
        card.className = 'heritage-card';
        card.onclick = () => this.showHeritageDetail(site);

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image';

        const imageUrls = [...this.getLocalImageUrls(site), ...(site.images || [])];
        const img = document.createElement('img');
        img.alt = site.name;
        img.loading = 'lazy';
        this.loadImageWithFallback(img, [...imageUrls], () => {
            const placeholder = document.createElement('div');
            placeholder.className = 'card-placeholder';
            placeholder.innerHTML = '<i class="fas fa-landmark"></i>';
            imageWrapper.innerHTML = '';
            imageWrapper.appendChild(placeholder);
        });

        imageWrapper.appendChild(img);
        card.appendChild(imageWrapper);

        const content = document.createElement('div');
        content.className = 'card-content';
        content.innerHTML = `
            <div class="card-header">
                <div>
                    <h3 class="card-title">${site.name}</h3>
                    <div class="card-meta">
                        <span>${site.year}年</span>
                        <span>${site.location}</span>
                    </div>
                </div>
                <div class="magnitude-badge">M${site.magnitude}</div>
            </div>
            <p class="card-description">${site.description}</p>
            <div class="card-features">
                ${site.features.slice(0, 3).map(feature =>
                    `<span class="feature-tag">${feature}</span>`
                ).join('')}
                ${site.features.length > 3 ? `<span class="feature-tag">+${site.features.length - 3}</span>` : ''}
            </div>
            <div class="card-footer">
                <div class="location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${site.location}
                </div>
                <div class="visitors">
                    <i class="fas fa-users"></i>
                    ${site.visitors}
                </div>
            </div>
        `;

        card.appendChild(content);
        return card;
    }

    showHeritageDetail(site) {
        const modal = document.getElementById('heritageModal');
        const title = document.getElementById('modalTitle');
        const image = document.getElementById('modalImage');
        const meta = document.getElementById('modalMeta');
        const description = document.getElementById('modalDescription');
        const features = document.getElementById('modalFeatures');

        title.textContent = site.name;

        const imageUrls = [...this.getLocalImageUrls(site), ...(site.images || [])];
        this.loadImageWithFallback(image, [...imageUrls]);
        image.style.display = 'block';
        this.renderModalGallery(site);

        meta.innerHTML = `
            <div class="meta-item">
                <div class="meta-label">发生时间</div>
                <div class="meta-value">${site.year}年</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">震级</div>
                <div class="meta-value">M${site.magnitude}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">位置</div>
                <div class="meta-value">${site.location}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">保护状态</div>
                <div class="meta-value">${site.preservation_status}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">年均游客</div>
                <div class="meta-value">${site.visitors}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">坐标</div>
                <div class="meta-value">${site.coordinates[0].toFixed(4)}, ${site.coordinates[1].toFixed(4)}</div>
            </div>
        `;

        description.textContent = site.description;

        features.innerHTML = site.features.map(feature =>
            `<div class="feature-item">${feature}</div>`
        ).join('');

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('heritageModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    renderModalGallery(site) {
        const gallery = document.getElementById('modalGallery');
        gallery.innerHTML = '';

        const imageUrls = [...new Set([...(this.getLocalImageUrls(site) || []), ...(site.images || [])])];

        imageUrls.forEach(url => {
            const thumb = document.createElement('img');
            thumb.src = this.normalizeUrl(url);
            thumb.alt = site.name;
            thumb.onerror = () => {
                thumb.style.display = 'none';
            };
            gallery.appendChild(thumb);
        });

        if (!gallery.children.length) {
            gallery.innerHTML = '<div class="gallery-empty">暂无图片展示</div>';
        }
    }

    showError(message) {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        `;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new EarthquakeHeritage();
});