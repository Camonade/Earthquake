document.addEventListener('DOMContentLoaded', () => {
    const heritageItems = [
        {
            name: '大裂谷',
            shortDesc: '地壳张裂形成的大尺度线性地貌带。',
            longDesc: '大裂谷："大陆正在撕裂的地方"\n如果说断层是皮肤的伤口，大裂谷就是深及骨骼的巨大疤痕。在板块构造的拉张作用下，整个大陆被向两边撕开。中间的地块沿着一系列巨大的正断层不断下陷，两侧相对抬升，形成宽广陡峭的谷地。东非大裂谷就是活生生的例子，那里不仅地貌壮丽，还伴生着密集的火山和地震活动，直观展示了地球裂开的过程。',
            images: [
                'images/大裂谷/东非大裂谷.png',
                'images/大裂谷/云南大裂谷.jpg',
                'images/断裂带/东非大裂谷.png'
            ]
        },
        {
            name: '河流三角洲',
            shortDesc: '地震扰动影响下的河口沉积与河道重组地貌。',
            longDesc: '强震可能引发地面沉降、河道改道和泥沙输运变化，导致三角洲前缘推进或局部后退。该类景观反映了构造活动与沉积过程的耦合效应。',
            images: [
                'images/河流三角洲/奥卡万戈三角洲湖泊.jpg',
                'images/河流三角洲/奥卡万戈三角洲湖泊 (1).jpg',
                'images/河流三角洲/奥卡万戈三角洲湖泊.jpg'
            ]
        },
        {
            name: '瀑布景观',
            shortDesc: '断层抬升与河道突变形成的瀑布系统。',
            longDesc: '地震瀑布："破裂或崩塌，意外创造了新的阶梯"\n地震是瀑布景观的"破坏性创造者"。其成因通常有两种：\n断层和崩塌造坎：地震的直接错动，或是引发的山体崩塌、泥石流，会像堵在河道上的碎石堆，形成新的陡坎。水流越过这些坎，瀑布就诞生了。\n改道汇流：原有景观被破坏后，水文环境改变。如2017年九寨沟地震，火花海溃坝，但水流在下游汇集，意外地创造了双龙海瀑布这个新景点。',
            images: [
                'images/瀑布景观/九寨沟.jpg',
                'images/瀑布景观/黄河断层瀑布—壶口瀑布.jpg',
                'images/瀑布景观/汶川地震堰塞湖.jpg'
            ]
        },
        {
            name: '砂土液化遗迹景观',
            shortDesc: '地震振动使饱和砂层失稳并喷砂冒水。',
            longDesc: '砂土液化遗迹\n"大地在颤抖中短暂变成\'汤\'的证据"\n在饱含水的松散沙土层地区，剧烈的地震摇晃会让沙土瞬间失去承载力，表现为像液体一样。这时，沙子和水会沿着裂缝被挤压喷出地表，形成喷砂冒水的奇观，并可能在原地留下圆形或条带形的陷坑。考古学家推测，青海喇家遗址那保存了灾难瞬间的场景，很可能就是古地震导致的巨大砂土液化泥流瞬间吞噬了聚落。',
            images: [
                'images/砂土液化遗迹景观/地震后的沙火山.jpg',
                'images/砂土液化遗迹景观/地震后的沙火山 (1).jpg',
                'images/砂土液化遗迹景观/地震后的沙火山.jpg'
            ]
        },
        {
            name: '山体崩塌遗迹',
            shortDesc: '强震触发边坡失稳形成崩塌堆积体。',
            longDesc: '地震动会显著降低岩土体稳定性，导致山体崩塌、落石与滑坡链式灾害。崩塌遗迹可反映震源机制、坡体结构与地震烈度分布。',
            images: [
                'images/峡谷/大渡河峡谷.jpg',
                'images/峡谷/青藏高原峡谷.jpg',
                'images/峡谷/突尼斯峡谷.jpg'
            ]
        },
        {
            name: '地震堰塞湖',
            shortDesc: '滑坡堵江后形成的震后湖泊景观。',
            longDesc: '地震堰塞湖\n成因：地震滑坡堵江形成的暂时性水体\n强烈地震在山区触发大型滑坡或崩塌，大量岩土体在数秒至数分钟内涌入河谷，截断水流，形成天然堆石坝（堰塞坝）。上游河水被阻挡后迅速壅高，淹没谷地，即形成堰塞湖。\n其主要特征是成湖极快、坝体松散且稳定性差。一旦水位漫坝或余震触发，极易发生溃决，形成灾害性洪水。',
            images: [
                'images/湖泊景观/小南海堰塞湖.jpg',
                'images/湖泊景观/党家岔堰塞湖.jpg',
                'images/瀑布景观/汶川地震堰塞湖.jpg'
            ]
        },
        {
            name: '地震裂缝遗迹',
            shortDesc: '地表拉张或剪切形成的线性裂缝系统。',
            longDesc: '地裂缝通常与断层活动、场地不均匀变形及液化相关。其几何形态和展布方向可用于识别主控构造并辅助震后地质灾害分区。',
            images: [
                'images/断层地貌/汶川映秀断层.jpg',
                'images/断层地貌/华山断层崖.jpg',
                'images/断裂带/郯庐断裂带.jpg'
            ]
        },
        {
            name: '古地震遗址',
            shortDesc: '保留古地震活动证据的地貌与地层剖面。',
            longDesc: '古地震遗址包含断错地层、液化沉积和变形构造等信息，可用于重建历史地震序列与复发周期，是地震危险性分析的重要基础。',
            images: [
                'images/独特的地貌/海原古柳撕裂.png',
                'images/独特的地貌/九寨沟地震前后.jpg',
                'images/独特的地貌/双乳峰.jpg'
            ]
        },
        {
            name: '地震断层崖',
            shortDesc: '断层快速错动在地表形成陡坎地貌。',
            longDesc: '断层崖通常由同震位移直接形成，具有明显高差和线性展布特征。它是识别活动断层、估算同震位移及评估地震潜势的核心地貌标志。',
            images: [
                'images/断层地貌/华山断层崖.jpg',
                'images/断层地貌/汶川映秀断层.jpg',
                'images/断裂带/郯庐断裂带.jpg'
            ]
        }
    ];

    const grid = document.getElementById('heritageCardGrid');
    const modal = document.getElementById('heritageFullscreenModal');
    const closeBtn = document.getElementById('heritageModalCloseBtn');
    const prevBtn = document.getElementById('heritagePrevBtn');
    const nextBtn = document.getElementById('heritageNextBtn');
    const modalImage = document.getElementById('heritageModalImage');
    const modalTitle = document.getElementById('heritageModalTitle');
    const modalShort = document.getElementById('heritageModalShort');
    const modalDesc = document.getElementById('heritageModalDesc');
    const dotsWrap = document.getElementById('heritageDots');

    if (!grid || !modal || !closeBtn || !prevBtn || !nextBtn || !modalImage || !modalTitle || !modalShort || !modalDesc || !dotsWrap) {
        return;
    }

    let currentItemIndex = 0;
    let currentImageIndex = 0;

    // 找到"地震裂缝遗迹"的索引（作为顶部横幅）
    const featureIndex = heritageItems.findIndex(item => item.name === '地震裂缝遗迹');

    renderFeatureBanner(featureIndex);
    renderCards();
    bindModalEvents();
    setupScrollAnimation();

    function renderFeatureBanner(idx) {
        if (idx < 0) return;
        const item = heritageItems[idx];
        const banner = document.createElement('div');
        banner.className = 'heritage-feature-banner';
        banner.innerHTML = `
            <img src="${item.images[0]}" alt="${item.name}">
            <div class="heritage-feature-overlay">
                <span class="heritage-feature-badge">核心景观</span>
                <h3>${item.name}</h3>
                <p>${item.shortDesc}</p>
            </div>
        `;
        banner.addEventListener('click', () => openModal(idx, 0));
        banner.style.cursor = 'pointer';
        grid.parentNode.insertBefore(banner, grid);
    }

    function renderCards() {
        const cardHtml = heritageItems.map((item, idx) => {
            // 地震裂缝遗迹已作为横幅，跳过
            if (item.name === '地震裂缝遗迹') return '';

            // 为部分卡片添加特色样式
            let extraClass = '';
            if (item.name === '大裂谷') extraClass = 'featured';
            if (item.name === '古地震遗址') extraClass = 'tall';

            return `
                <article class="heritage-card ${extraClass}" data-item-index="${idx}" tabindex="0" role="button" aria-label="查看${item.name}">
                    <img class="heritage-card-image" src="${item.images[0]}" alt="${item.name}" loading="lazy">
                    <span class="heritage-card-number">${String(idx + 1).padStart(2, '0')}</span>
                    <h3>${item.name}</h3>
                    <p>${item.shortDesc}</p>
                </article>
            `;
        }).join('');

        grid.innerHTML = cardHtml;

        grid.querySelectorAll('.heritage-card').forEach((card) => {
            card.addEventListener('click', () => {
                const idx = Number(card.dataset.itemIndex);
                openModal(idx, 0);
            });

            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    const idx = Number(card.dataset.itemIndex);
                    openModal(idx, 0);
                }
            });
        });
    }

    function setupScrollAnimation() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.heritage-card').forEach(card => {
            observer.observe(card);
        });

        // 横幅也做入场动画
        const banner = document.querySelector('.heritage-feature-banner');
        if (banner) {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(30px)';
            banner.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
            requestAnimationFrame(() => {
                banner.style.opacity = '1';
                banner.style.transform = 'translateY(0)';
            });
        }
    }

    function bindModalEvents() {
        closeBtn.addEventListener('click', closeModal);
        prevBtn.addEventListener('click', () => switchImage(-1));
        nextBtn.addEventListener('click', () => switchImage(1));

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!modal.classList.contains('show')) return;

            if (event.key === 'Escape') {
                closeModal();
            } else if (event.key === 'ArrowLeft') {
                switchImage(-1);
            } else if (event.key === 'ArrowRight') {
                switchImage(1);
            }
        });
    }

    function openModal(itemIndex, imageIndex) {
        currentItemIndex = itemIndex;
        currentImageIndex = imageIndex;
        renderModal();
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function switchImage(offset) {
        const images = heritageItems[currentItemIndex].images;
        currentImageIndex = (currentImageIndex + offset + images.length) % images.length;
        renderModal();
    }

    function renderModal() {
        const item = heritageItems[currentItemIndex];
        const imgSrc = item.images[currentImageIndex];

        modalImage.src = imgSrc;
        modalImage.alt = item.name;
        modalTitle.textContent = item.name;
        modalShort.textContent = item.shortDesc;
        modalDesc.textContent = item.longDesc;

        renderDots(item.images.length);
    }

    function renderDots(total) {
        const dots = [];
        for (let i = 0; i < total; i += 1) {
            const active = i === currentImageIndex ? 'active' : '';
            dots.push(`<button type="button" class="heritage-dot ${active}" data-dot-index="${i}" aria-label="切换到第${i + 1}张"></button>`);
        }
        dotsWrap.innerHTML = dots.join('');

        dotsWrap.querySelectorAll('.heritage-dot').forEach((dot) => {
            dot.addEventListener('click', () => {
                currentImageIndex = Number(dot.dataset.dotIndex);
                renderModal();
            });
        });
    }
});
