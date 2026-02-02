// Admin 启动逻辑
document.addEventListener('DOMContentLoaded', async () => {
    await window.initAppCore(); // 等待核心加载

    // 检查权限
    const session = JSON.parse(sessionStorage.getItem('gembrow_session') || '{}');
    if (session.mode !== 'owner') {
        window.location.href = '../index.html'; // 没登录就踢回首页
        return;
    }

    window.currentMode = 'owner';
    // 渲染页面
    const app = document.getElementById('app');
    // 这里你需要稍微改一下 renderApp，或者直接调用 renderOwnerView
    // 建议把原 script.js 里的 renderApp 也复制过来并简化
    renderOwnerApp();
});

function renderOwnerApp() {
    window.allData = window.loadDb();
    const config = window.elementSdk.config;
    // 获取数据...
    const services = window.getDataByType('service');
    const bookings = window.getDataByType('booking');
    const posts = window.getDataByType('post');
    const customers = window.getDataByType('customer_account');

    document.getElementById('app').innerHTML = window.renderOwnerView(config, services, bookings, posts, customers);
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        showMenu = true;
        renderApp();
    });

    // 关闭菜单 (Overlay) - 你的代码优化版
    document.getElementById('menuOverlay')?.addEventListener('click', (e) => {
        // 优化：只有点到半透明背景(ID匹配)时才关闭，点菜单里面的按钮不关闭
        if (e.target.id === 'menuOverlay') {
            showMenu = false;
            renderApp();
        }
    });

    // === 评价按钮监听 (新增) ===
    document.querySelectorAll('.rateServiceBtn, .rateServiceBtnCustomer').forEach(btn => {
        btn.addEventListener('click', () => {
            const bookings = getDataByType('booking');
            const booking = bookings.find(b => b.id === btn.dataset.bookingId);
            if (booking) {
                showRatingModal(config, booking);
            }
        });
    });

    // === 1. 全局导航/登录 ===
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. 清除登录缓存 (防止刷新自动登录)
            localStorage.removeItem('gembrow_session');

            // 2. 重置状态
            loggedInCustomerName = null;
            currentMode = 'login'; // 回到登录页
            showMenu = false;      // 关闭菜单

            // 3. 刷新
            renderApp();
            showToast('已退出登录');
        });
    });

    document.getElementById('myBookingsBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'mybookings';
        renderApp();
    });

    document.getElementById('homeBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'home';
        renderApp();
    });

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const phone = document.getElementById('phone').value;
        if (username === ownerCredentials.username && phone === ownerCredentials.password) {
            isOwner = true;
            loggedInCustomerName = null;
            currentView = 'manage';
        } else {
            isOwner = false;
            loggedInCustomerName = username;
            let customers = getDataByType('customer_account');
            let customer = customers.find(c => c.username === username);
            if (!customer) {
                createRecord({ type: 'customer_account', username, phone, membershipLevel: 'bronze', points: 0 });
            }
            currentView = 'home';
        }
        renderApp();
    });

    document.getElementById('guestLoginBtn')?.addEventListener('click', () => {
        isOwner = false;
        loggedInCustomerName = null;
        currentView = 'home';
        renderApp();
    });

    // === 菜单导航按钮 ===
    // 业主菜单按钮
    document.getElementById('viewManage')?.addEventListener('click', () => {
        currentView = 'manage';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewStats')?.addEventListener('click', () => {
        currentView = 'stats';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewCustomers')?.addEventListener('click', () => {
        currentView = 'customers';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewSettings')?.addEventListener('click', () => {
        currentView = 'settings';
        showMenu = false;
        renderApp();
    });
    // 客户菜单按钮
    document.getElementById('viewServices')?.addEventListener('click', () => {
        currentView = 'services';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewMyBookings')?.addEventListener('click', () => {
        currentView = 'mybookings';
        showMenu = false;
        renderApp();
    });

    document.getElementById('viewHistory')?.addEventListener('click', () => {
        currentView = 'history';
        showMenu = false;
        renderApp();
    });

    document.getElementById('viewProfile')?.addEventListener('click', () => {
        currentView = 'profile';
        showMenu = false;
        renderApp();
    });

    // === 休息时间 ===
    document.getElementById('blockTimeBtn')?.addEventListener('click', () => {
        // 复用 showBookingModal，但这次是老板给自己“占位”
        // 我们传入一个特殊的 serviceName 叫 "⛔ 休息/锁定"
        // 价格 0，时长可以让老板自己填 (这里简化为默认 60分钟，老板可以在弹窗里改)
        // 更好的做法是专门写个 showBlockTimeModal，但为了省事，我们可以直接伪造一个服务

        showBlockTimeModal(config); // 👇 下面有这个新函数
    });

    // === 1. 全局导航/登录 ===
    document.getElementById('addServiceBtn')?.addEventListener('click', () => {
        showServiceModal(config);
    });

    document.querySelectorAll('.editServiceBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = services.find(i => i.id === btn.dataset.id);
            if (s) showEditServiceModal(config, s);
        });
    });

    document.querySelectorAll('.deleteServiceBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = services.find(i => i.id === btn.dataset.id);
            if (s) showConfirmModal(config, `确定删除服务 "${s.name}" 吗？`, async () => deleteRecord(s));
        });
    });

    // === 4. 商品管理 (✅ 你的按钮就是这里修好的) ===
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        // 确保 showProductModal 函数存在
        if (typeof showProductModal === 'function') {
            showProductModal(config);
        } else {
            console.error("❌ 错误：找不到 showProductModal 函数，请检查代码底部是否复制完整！");
        }
    });

    document.querySelectorAll('.editProductBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const products = getDataByType('product');
            const p = products.find(i => i.id === btn.dataset.id);
            if (p) showEditProductModal(config, p);
        });
    });

    document.querySelectorAll('.deleteProductBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const products = getDataByType('product');
            const p = products.find(i => i.id === btn.dataset.id);
            if (p) showConfirmModal(config, `确定下架商品 "${p.name}" 吗？`, async () => deleteRecord(p));
        });
    });

    // === 3.5 客户管理 ===
    // 添加客户按钮
    document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
        showAddCustomerModal(config);
    });

    // 编辑客户按钮
    document.querySelectorAll('.editCustomerBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const customers = getDataByType('customer_account');
            // 注意：这里用的是 dataset.customerId，因为 HTML 里写的是 data-customer-id
            const c = customers.find(i => i.id === btn.dataset.customerId);
            if (c) showEditCustomerModal(config, c);
        });
    });

    // 删除客户按钮
    document.querySelectorAll('.deleteCustomerBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const customers = getDataByType('customer_account');
            const customer = customers.find(c => c.id === btn.dataset.customerId);
            if (customer) showConfirmModal(config, `确定删除客户 "${customer.username}" 及其所有数据吗？`, async () => deleteRecord(customer));
        });
    });

    // === 5. 动态管理 ===
    document.getElementById('addPostBtn')?.addEventListener('click', () => {
        if (typeof showPostModal === 'function') showPostModal(config);
    });

    document.querySelectorAll('.deletePostBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = posts.find(i => i.id === btn.dataset.id);
            if (p) showConfirmModal(config, "确定删除这条动态吗？", async () => deleteRecord(p));
        });
    });

    // === 6. 订单/预约处理 ===

    // 完成预约 (改为弹出日期选择框)
    document.querySelectorAll('.completeBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookings.find(i => i.id === btn.dataset.id);
            if (b) {
                showCompleteBookingModal(config, b);
            }
        });
    });

    // 取消预约
    document.querySelectorAll('.cancelBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookings.find(i => i.id === btn.dataset.id);
            if (b) showConfirmModal(config, "确定取消此预约？", async () => updateRecord(b, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString() // 👈 加上这个，后悔药才能生效！
            }));
        });
    });

    // ↩️ 恢复待办 (后悔药功能 - 升级版)
    document.querySelectorAll('.revertBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookings.find(i => i.id === btn.dataset.id);
            if (b) {
                // 👇 改为调用新的智能处理函数
                window.handleRevertBooking(config, b);
            }
        });
    });

    // 商品订单处理 (保持不变)
    document.querySelectorAll('.completeOrderBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orders = getDataByType('order');
            const o = orders.find(i => i.id === btn.dataset.id);
            if (o) showConfirmModal(config, "确认发货/完成订单？", async () => updateRecord(o, { status: 'completed' }));
        });
    });

    document.querySelectorAll('.cancelOrderBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orders = getDataByType('order');
            const o = orders.find(i => i.id === btn.dataset.id);
            if (o) showConfirmModal(config, "确定取消这个订单吗？", async () => updateRecord(o, { status: 'cancelled' }));
        });
    });

    // === 评价按钮监听 (新增) ===
    document.querySelectorAll('.rateBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const bookings = getDataByType('booking'); // 重新获取最新数据
            const booking = bookings.find(b => b.id === btn.dataset.id);
            if (booking) {
                showRatingModal(config, booking);
            }
        });
    });

    // === 6. Logo 上传事件 (已升级：Logo 圆形，QR 方形) ===
    document.getElementById('logoLoginInput')?.addEventListener('change', function (e) {
        // 👇 最后一个参数 true 代表圆形
        handleFileWithCrop(e.target.files[0], 'logoLoginUrl', 'loginLogoPreviewImg', 'loginLogoPlaceholder', true);
    });

    document.getElementById('logoHeaderInput')?.addEventListener('change', function (e) {
        // 👇 最后一个参数 true 代表圆形
        handleFileWithCrop(e.target.files[0], 'logoHeaderUrl', 'headerLogoPreviewImg', 'headerLogoPlaceholder', true);
    });

    document.getElementById('tngQrInput')?.addEventListener('change', function (e) {
        // 👇 ⚠️ 二维码必须是方形 (false)，切圆了会扫不到
        handleFileWithCrop(e.target.files[0], 'tngQrUrl', 'tngQrPreview', 'tngQrPlaceholder', false);
    });

    // === 7. 设置保存 ===
    document.getElementById('discountSettingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 获取提交按钮来显示“保存中...”
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "💾 保存中...";

        try {
            // 1. 保存管理员账号
            const newAdminUser = document.getElementById('adminUsername').value.trim();
            const newAdminPass = document.getElementById('adminPassword').value.trim();

            // ... (管理员账号保存逻辑保持不变) ...
            let rawData = JSON.parse(localStorage.getItem('gembrow_data') || '[]');
            rawData = rawData.filter(item => item.type !== 'owner_credentials');
            rawData.push({
                id: Date.now().toString(),
                type: 'owner_credentials',
                username: newAdminUser,
                password: newAdminPass,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('gembrow_data', JSON.stringify(rawData));
            ownerCredentials = { username: newAdminUser, password: newAdminPass };

            // 2. 保存普通设置
            const currentSettings = getDataByType('discount_settings')[0] || {};
            const newSettings = {
                custom_terms: document.getElementById('customTerms').value,
                custom_privacy: document.getElementById('customPrivacy').value,
                custom_return: document.getElementById('customReturn').value,
                type: 'discount_settings',
                shop_name: document.getElementById('shopName').value.trim(),
                ssm_number: document.getElementById('ssmNumber').value.trim(),
                shop_address: document.getElementById('shopAddress').value.trim(),
                wa_number: document.getElementById('waNumber').value,

                // 👇👇👇 关键：确保这行存在，才能保存 TNG 图片 👇👇👇
                tng_qr_url: document.getElementById('tngQrUrl').value,

                logo_login: document.getElementById('logoLoginUrl').value || '',
                logo_header: document.getElementById('logoHeaderUrl').value || '',
                map_link: document.getElementById('mapLink').value.trim(),
                fb_link: document.getElementById('fbLink').value.trim(),
                ig_link: document.getElementById('igLink').value.trim(),
                tiktok_link: document.getElementById('tiktokLink').value.trim(),
                enable_rewards: document.getElementById('enableRewards').checked,
                enable_shop: document.getElementById('enableShop').checked,
                default_courier: document.getElementById('defaultCourier').value,
                enable_sst: document.getElementById('enableSST').checked,
                sst_rate: parseInt(document.getElementById('sstRate').value) || 6,
                sst_id: document.getElementById('sstID').value.trim(),
                show_sst_on_receipt: document.getElementById('showSSTOnReceipt').checked,
                bronze_points: parseInt(document.getElementById('bronzePoints').value) || 0,
                bronze_discount: parseInt(document.getElementById('bronzeDiscount').value) || 0,
                silver_points: parseInt(document.getElementById('silverPoints').value) || 100,
                silver_discount: parseInt(document.getElementById('silverDiscount').value) || 5,
                gold_points: parseInt(document.getElementById('goldPoints').value) || 300,
                gold_discount: parseInt(document.getElementById('goldDiscount').value) || 10,
                platinum_points: parseInt(document.getElementById('platinumPoints').value) || 600,
                platinum_discount: parseInt(document.getElementById('platinumDiscount').value) || 15,
                points_to_rm_rate: parseInt(document.getElementById('pointsToRmRate').value) || 10
            };

            if (currentSettings.id) {
                await updateRecord(currentSettings, newSettings);
            } else {
                await createRecord(newSettings);
            }

            showToast('✅ 设置已保存！');
            allData = loadDb();
            renderApp();
            if (typeof initGlobalWidgets === 'function') initGlobalWidgets();

        } catch (error) {
            showToast('❌ 保存失败：' + error.message);
            console.error(error);
        } finally {
            submitBtn.innerText = originalText;
        }
    });

    // 重新绑定事件
    // attachOwnerEventListeners... (你需要把原来 attachEventListeners 里属于老板的部分提取出来)
}

// ==========================================
// 👇 [v1.3.1-4] 主程序 (带用户头像的菜单)
// ==========================================
function renderMainApp(app, config, services, bookings, posts, customers) {
    cleanupDuplicateNotifications(); // 🔥 紧急清理重复通知
    const currentYear = new Date().getFullYear();
    const settings = getDiscountSettings();

    window.toggleMenu = () => {
        showMenu = !showMenu;
        renderApp();
    };

    // 🟢 [新增] 智能头像逻辑
    let userAvatarUrl = '';
    let userDisplayName = '';
    let userRoleName = '';

    if (currentMode === 'owner') {
        // 店长：显示店铺 Logo 或 默认头像
        userAvatarUrl = settings.logo_header || settings.logo_url || "https://ui-avatars.com/api/?name=Boss&background=000&color=fff&size=128";
        userDisplayName = "👑 店长 (Owner)";
        userRoleName = "Administrator";
    } else if (loggedInCustomerName) {
        // 顾客：尝试查找头像，如果没有就用名字生成
        const currentCustomer = customers.find(c => c.username === loggedInCustomerName);
        // 如果顾客数据里有 avatar 字段就用，没有就用 ui-avatars 生成
        userAvatarUrl = (currentCustomer && currentCustomer.avatar)
            ? currentCustomer.avatar
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedInCustomerName)}&background=random&color=fff&size=128`;
        userDisplayName = loggedInCustomerName;
        userRoleName = "Verified Member";
    } else {
        // 游客
        userAvatarUrl = "https://ui-avatars.com/api/?name=Guest&background=eee&color=999&size=128";
        userDisplayName = "游客 (Guest)";
        userRoleName = "Visitor";
    }

    app.innerHTML = `
        <div class="min-h-full">
            <header class="print:hidden bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40 transition-all duration-300" 
                style="border-bottom: 3px solid ${config.primary_action_color};">
                <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <img src="${settings.logo_header || settings.logo_url || './assets/header_logo.png'}" 
                             alt="${config.app_title}" 
                             class="rounded-full shadow-sm hover:rotate-12 transition-transform duration-500" 
                             style="height: 42px; width: 42px; object-fit: cover;">
                        <h1 class="text-lg font-bold hidden md:block" style="color: ${config.text_color}; font-family: ${config.font_family};">
                            ${settings.shop_name || config.app_title}
                        </h1>
                    </div>

                    <div class="flex items-center gap-3">
                        
                        ${(() => {
            const currentUser = window.currentMode === 'owner' ? 'admin' : window.loggedInCustomerName;
            const readSystemIds = JSON.parse(localStorage.getItem(`read_sys_notis_${currentUser}`) || '[]');

            const allNotis = getDataByType('notification');

            // 🔥 使用完全相同的筛选逻辑
            const unreadCount = allNotis.filter(n => {
                // 1. 筛选发给我的
                let isForMe = (n.targetUser === currentUser) || (n.targetUser === 'all') || (!n.targetUser && currentUser === 'admin');
                if (!isForMe) return false;

                // 2. 筛选未读的
                if (n.targetUser === 'all') {
                    // 系统消息：检查 ID 是否在已读列表
                    return !readSystemIds.some(id => String(id) === String(n.id));
                } else {
                    // 个人消息：检查 isRead 字段
                    return !n.isRead;
                }
            }).length;

            return `
                            <button onclick="showNotificationModal(elementSdk.config)" 
                                class="relative p-2 rounded-xl transition-all hover:bg-gray-100 group">
                                <span class="text-2xl group-hover:scale-110 transition-transform block">📬</span>
                                ${unreadCount > 0 ? `
                                    <span class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm animate-bounce">
                                        ${unreadCount}
                                    </span>
                                ` : ''}
                            </button>
                        `;
        })()}

                    <button onclick="toggleMenu()" 
                        class="px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all" 
                        style="border: 2px solid ${config.primary_action_color}; color: ${config.primary_action_color};">
                        ${loggedInCustomerName ? `<img src="${userAvatarUrl}" class="w-5 h-5 rounded-full border border-current">` : ''}
                        <span>${showMenu ? '✕ 关闭' : '☰ 菜单'}</span>
                    </button>
                </div>
            </header>
            
            ${showMenu ? `
                <div id="menuOverlay" onclick="toggleMenu()" class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm print:hidden flex items-start justify-end">
                    
                    <div onclick="event.stopPropagation()" 
                         class="animate-fade-in-down bg-white w-full md:w-80 shadow-2xl overflow-hidden"
                         style="
                            border-bottom-left-radius: 24px; 
                            border-bottom-right-radius: 0px; 
                            border-bottom-left-radius: 24px;
                            border-top: none; 
                            border-left: 1px solid #eee;
                            border-bottom: 4px solid ${config.primary_action_color};
                         ">
                        
                        <div class="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                            <img src="${userAvatarUrl}" alt="Avatar" 
                                 class="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover bg-white">
                            
                            <div class="flex-1 min-w-0">
                                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">${userRoleName}</p>
                                <h3 class="font-bold text-lg text-gray-800 truncate leading-tight">
                                    ${userDisplayName}
                                </h3>
                                ${loggedInCustomerName ? `<p class="text-xs text-green-500 font-bold mt-1">● Online</p>` : ''}
                            </div>
                        </div>

                        <div class="py-2">
                            <button onclick="currentView='home'; toggleMenu(); renderApp()" class="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-3 text-sm transition-colors">
                                🏠 首页 (Home)
                            </button>
                            
                            ${currentMode === 'owner' ? `
                                <button onclick="currentView='stats'; toggleMenu(); renderApp()" class="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-3 text-sm transition-colors">
                                    📊 报表 (Stats)
                                </button>
                                <button onclick="currentView='customers'; toggleMenu(); renderApp()" class="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-3 text-sm transition-colors">
                                    👥 客户 (CRM)
                                </button>
                                <button onclick="currentView='settings'; toggleMenu(); renderApp()" class="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-3 text-sm transition-colors">
                                    ⚙️ 设置 (Settings)
                                </button>
                            ` : `
                                <button onclick="currentView='mybookings'; toggleMenu(); renderApp()" class="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-3 text-sm transition-colors">
                                    ⏳ 待办事项 (Pending)
                                </button>
                                <button onclick="currentView='history'; toggleMenu(); renderApp()" class="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-3 text-sm transition-colors">
                                    📜 历史与账单 (History)
                                </button>
                                <button onclick="currentView='profile'; toggleMenu(); renderApp()" class="w-full text-left px-5 py-3 hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-3 text-sm transition-colors">
                                    👤 账户设置 (Profile)
                                </button>
                            `}
                            
                            <div class="h-px bg-gray-100 my-1"></div>

                            <button onclick="showFeedbackModal(elementSdk.config)" class="w-full text-left px-5 py-3 hover:bg-yellow-50 font-bold text-gray-600 flex items-center gap-3 text-sm transition-colors">
                                🐞 反馈问题
                            </button>
                            
                            <button class="w-full text-left px-5 py-3 hover:bg-red-50 font-bold text-red-500 flex items-center gap-3 text-sm transition-colors" 
                                onclick="window.handleLogout()">
                                ${loggedInCustomerName || currentMode === 'owner' ? '🚪 退出登录' : '🏠 返回首页'}
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <main class="max-w-7xl mx-auto px-4 md:px-6 py-8 print:p-0">
                ${currentMode === 'owner' ? renderOwnerView(config, services, bookings, posts, customers) : renderCustomerView(config, services, bookings, posts)}
            </main>

            <footer class="mt-auto py-12 text-center border-t border-gray-100 print:hidden bg-[#fafafa]">
               <div class="max-w-7xl mx-auto px-6">
                   <div class="flex justify-center gap-8 mb-8">
                       ${settings.fb_link ? `<a href="${settings.fb_link}" target="_blank" class="opacity-60 hover:opacity-100 hover:scale-110 transition-all"><img src="https://cdn-icons-png.flaticon.com/512/5968/5968764.png" width="24" alt="FB"></a>` : ''}
                       ${settings.ig_link ? `<a href="${settings.ig_link}" target="_blank" class="opacity-60 hover:opacity-100 hover:scale-110 transition-all"><img src="https://cdn-icons-png.flaticon.com/512/3955/3955024.png" width="24" alt="IG"></a>` : ''}
                       ${settings.tiktok_link ? `<a href="${settings.tiktok_link}" target="_blank" class="opacity-60 hover:opacity-100 hover:scale-110 transition-all"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="24" alt="TikTok"></a>` : ''}
                   </div>

                   ${(settings.shop_address || settings.ssm_number) ? `
                       <div class="mb-8 inline-block text-sm opacity-70">
                           ${settings.shop_name ? `<p class="font-bold text-base mb-1">${settings.shop_name}</p>` : ''}
                           ${settings.shop_address ? `
                               <p class="mb-1 flex items-center justify-center gap-1">
                                   📍 ${settings.shop_address}
                                   ${settings.map_link ? `<a href="${settings.map_link}" target="_blank" class="text-blue-500 font-bold ml-1 hover:underline">[导航]</a>` : ''}
                               </p>
                           ` : ''}
                           ${settings.ssm_number ? `<p class="text-xs text-gray-400">SSM: ${settings.ssm_number}</p>` : ''}
                       </div>
                   ` : ''}

                   <div class="flex flex-wrap justify-center gap-6 mb-4 text-xs font-bold uppercase tracking-wider opacity-40">
                       <button class="footer-policy-btn hover:underline" data-type="terms">Terms</button>
                       <button class="footer-policy-btn hover:underline" data-type="privacy">Privacy</button>
                       <button class="footer-policy-btn hover:underline" data-type="return_policy">Return Policy</button>
                   </div>
            
                   <p class="text-[10px] opacity-30 mt-2">
                       Copyright © ${currentYear} ${settings.shop_name || config.app_title}. <br class="md:hidden"> Powered by Threshold Studio.
                   </p>
               </div>
           </footer>
        </div>
    `;

    attachEventListeners(config, services, bookings, posts, customers);
}

// ==========================================
// 👇 [v1.3.6 Beta] 老板后台 (修复：取消撤回时限 & 样式保持)
// ==========================================
function renderOwnerView(config, services, bookings, posts, customers) {
    window.cashierMode = window.cashierMode || 'booking';
    window.ownerContentTab = window.ownerContentTab || 'service';

    window.filterStatus = window.filterStatus || 'pending';
    window.searchQuery = window.searchQuery || '';
    window.orderFilterStatus = window.orderFilterStatus || 'pending';

    const orders = getDataByType('order');
    const products = getDataByType('product');

    if (currentView === 'stats') return renderStats(config, services, bookings, customers, orders);
    else if (currentView === 'customers') return renderCustomersManagement(config, customers, bookings);
    else if (currentView === 'settings') return renderSettings(config);

    // 1. 预约筛选
    let filteredBookings = bookings.filter(b => {
        if (window.filterStatus === 'all') return true;
        if (window.filterStatus === 'pending') return b.status === 'pending' || b.status === 'serving' || b.status === 'finished';
        return b.status === window.filterStatus;
    }).filter(b => {
        if (!window.searchQuery) return true;
        const q = window.searchQuery.toLowerCase();
        return (b.customerName || '').toLowerCase().includes(q) ||
            (b.customerPhone || '').includes(q) ||
            (b.serviceName || '').toLowerCase().includes(q) ||
            (b.receiptNumber || '').toLowerCase().includes(q);
    });

    filteredBookings.sort((a, b) => {
        if (a.status === 'serving' && b.status !== 'serving') return -1;
        if (a.status !== 'serving' && b.status === 'serving') return 1;
        if (window.filterStatus === 'pending') {
            return new Date(`${a.appointmentDate}T${a.appointmentTime}`) - new Date(`${b.appointmentDate}T${b.appointmentTime}`);
        }
        return new Date(b.completedAt || b.cancelledAt || b.createdAt) - new Date(a.completedAt || a.cancelledAt || a.createdAt);
    });

    // 2. 订单筛选
    const filteredOrders = orders.filter(o => {
        if (window.orderFilterStatus === 'all') return true;
        if (window.orderFilterStatus === 'pending') return o.status === 'pending' || o.status === 'pending_payment' || o.status === 'paid_verify';
        return o.status === window.orderFilterStatus;
    });
    filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const pendingOrderCount = orders.filter(o => o.status === 'pending' || o.status === 'pending_payment' || o.status === 'paid_verify').length;

    // 🅰️ 零售模式
    if (window.cashierMode === 'retail') {
        return `
            <div>
                <div class="mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 sticky top-0 z-30">
                    <button onclick="window.cashierMode='booking'; renderApp()" class="flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gray-50 text-gray-500 hover:bg-gray-100"><span>📅</span> 预约管理</button>
                    <button onclick="window.cashierMode='retail'; renderApp()" class="flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 bg-pink-600 text-white shadow-md"><span>🛒</span> 零售开单</button>
                </div>
                ${renderRetailPad(config, services)}
            </div>
        `;
    }

    // 🅱️ 预约管理模式
    return `
        <div class="animate-fade-in-up pb-20">
            <div class="mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 sticky top-0 z-30">
                <button onclick="window.cashierMode='booking'; renderApp()" class="flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gray-800 text-white shadow-md"><span>📅</span> 预约管理</button>
                <button onclick="window.cashierMode='retail'; renderApp()" class="flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gray-50 text-gray-500 hover:bg-gray-100"><span>🛒</span> 零售开单</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 items-start">
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <h2 class="font-bold text-gray-800 text-lg">📅 预约管理</h2>
                        <div class="flex gap-2">
                            <button id="blockTimeBtn" class="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold shadow-md">⛔ 锁定</button>
                            <select onchange="window.filterStatus = this.value; renderApp()" class="px-2 py-1.5 rounded-lg border bg-gray-50 text-xs font-bold outline-none">
                                <option value="pending" ${window.filterStatus === 'pending' ? 'selected' : ''}>⏳ 待服务</option>
                                <option value="all" ${window.filterStatus === 'all' ? 'selected' : ''}>📂 全部</option>
                                <option value="completed" ${window.filterStatus === 'completed' ? 'selected' : ''}>✅ 已完成</option>
                                <option value="cancelled" ${window.filterStatus === 'cancelled' ? 'selected' : ''}>🚫 已取消</option>
                            </select>
                        </div>
                    </div>

                    <div class="relative">
                         <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                         <input type="text" id="searchInput" placeholder="搜客户/电话/单号..." value="${window.searchQuery}" 
                            oninput="window.searchQuery=this.value; renderApp()"
                            class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-pink-500 focus:outline-none text-sm font-bold shadow-sm">
                    </div>

                    ${filteredBookings.length === 0 ? `
                        <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-200"><p class="text-gray-400 text-sm">📭 暂无记录</p></div>
                    ` : `
                        <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                            ${filteredBookings.map(booking => {
        const now = new Date();
        let canRevert = false;
        let isLocked = false;

        // 🔥 核心修复：计算是否可撤销 (无论是完成还是取消)
        const actionTime = booking.completedAt || booking.cancelledAt;
        if (actionTime) {
            const diffMins = (now - new Date(actionTime)) / 1000 / 60;
            if (diffMins <= 30) canRevert = true; // 30分钟内可撤销
            if (diffMins / 60 >= 24) isLocked = true;
        }

        const isServing = booking.status === 'serving';
        const delay = booking.delayMinutes || 0;
        const service = services.find(s => s.name === booking.serviceName);
        const imgUrl = service ? (service.imageUrl || service.imgUrl) : 'https://cdn-icons-png.flaticon.com/512/2813/2813248.png';

        return `
                                    <div onclick="if(typeof showOwnerAppointmentModal === 'function') showOwnerAppointmentModal(elementSdk.config, getDataByType('booking').find(x => x.id === '${booking.id}'))" 
                                         class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative hover:shadow-md transition-shadow group cursor-pointer
                                         ${isServing ? 'ring-2 ring-green-500 ring-offset-1' : ''}">
                                        
                                        <div class="absolute left-0 top-4 bottom-4 w-1 rounded-r-lg ${isServing ? 'bg-green-500' : booking.status === 'pending' ? 'bg-yellow-400' : booking.status === 'completed' ? 'bg-green-500' : 'bg-red-400'}"></div>
                                        
                                        <div class="pl-4 flex gap-3">
                                            <div class="w-14 h-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                                <img src="${imgUrl}" class="w-full h-full object-cover">
                                            </div>

                                            <div class="flex-1 min-w-0">
                                                <div class="flex justify-between items-start mb-1">
                                                    <h3 class="font-bold text-gray-800 text-base truncate">${booking.customerName}</h3>
                                                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">${booking.receiptNumber?.slice(-4) || '---'}</span>
                                                </div>
                                                <p class="text-xs text-gray-500 mb-1">📞 ${booking.customerPhone}</p>
                                                
                                                <div class="flex items-center justify-between mt-2">
                                                    <span class="text-sm font-bold text-pink-600 truncate">💅 ${booking.serviceName}</span>
                                                    <div class="text-right">
                                                        <div class="text-xs text-gray-500 font-mono">📅 ${booking.appointmentDate || '-'}</div>
                                                        <div class="text-sm font-bold text-gray-800">
                                                            ${booking.appointmentTime}
                                                            ${delay > 0 ? `<span class="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded">+${delay}m</span>` : ''}
                                                        </div>
                                                        ${isServing ? `<span class="text-[9px] text-green-600 font-bold animate-pulse">● 服务中</span>` : ''}
                                                    </div>
                                                </div>

                                                ${booking.status === 'pending' ? `
                                                    <div class="mt-2 pt-2 border-t border-gray-100 flex justify-end gap-2">
                                                        <button onclick="event.stopPropagation(); window.showCancelReasonModal('${booking.id}')" class="text-red-500 text-xs px-2 py-1 rounded border border-red-100 hover:bg-red-50">取消</button>
                                                        <button onclick="event.stopPropagation(); showCashierModal(elementSdk.config, getDataByType('booking').find(b => b.id === '${booking.id}'))" class="bg-blue-600 text-white text-xs px-3 py-1 rounded font-bold shadow hover:bg-blue-700">💰 收银</button>
                                                    </div>
                                                ` : ''}

                                                ${booking.status === 'completed' ? `
                                                    <div class="mt-2 pt-2 border-t border-gray-100 flex justify-end gap-2 text-[10px]">
                                                        <button onclick="event.stopPropagation(); showReceiptModal(elementSdk.config, getDataByType('booking').find(x => x.id === '${booking.id}'))" class="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">🎫 小票</button>
                                                        ${!isLocked && canRevert ? `<button onclick="event.stopPropagation(); window.handleRevertBooking(elementSdk.config, getDataByType('booking').find(x => x.id === '${booking.id}'))" class="text-red-400 underline px-2 py-1">撤销</button>` : ''}
                                                    </div>
                                                ` : ''}

                                                ${booking.status === 'cancelled' ? `
                                                    <div class="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                                                        <p class="text-[10px] text-red-400">🚫 ${booking.cancelReason || '无原因'}</p>
                                                        
                                                        ${!isLocked && canRevert ? `
                                                            <button onclick="event.stopPropagation(); window.handleRevertBooking(elementSdk.config, getDataByType('booking').find(x => x.id === '${booking.id}'))" 
                                                              class="text-gray-400 text-xs underline hover:text-blue-500">
                                                              撤销取消
                                                            </button>
                                                        ` : ''}
                                                   </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
    }).join('')}
                        </div>
                    `}
                </div>

                <div class="space-y-4">
                    <div class="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
                            📦 订单 
                            ${pendingOrderCount > 0 ? `<span class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">${pendingOrderCount}</span>` : ''}
                        </h2>
                        <select onchange="window.orderFilterStatus = this.value; renderApp()" class="px-2 py-1.5 rounded-lg border bg-gray-50 text-xs font-bold outline-none">
                            <option value="pending" ${window.orderFilterStatus === 'pending' ? 'selected' : ''}>⏳ 待确认</option>
                            <option value="all" ${window.orderFilterStatus === 'all' ? 'selected' : ''}>📂 全部</option>
                            <option value="completed" ${window.orderFilterStatus === 'completed' ? 'selected' : ''}>✅ 已完成</option>
                            <option value="cancelled" ${window.orderFilterStatus === 'cancelled' ? 'selected' : ''}>🚫 已取消</option>
                        </select>
                    </div>

                    ${filteredOrders.length === 0 ? `
                        <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-200"><p class="text-gray-400 text-sm">📭 暂无订单</p></div>
                    ` : `
                        <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                            ${filteredOrders.slice().reverse().map(order => `
                                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div class="flex justify-between items-start mb-2 border-b border-gray-50 pb-2">
                                        <div>
                                            <h3 class="font-bold text-sm text-gray-800">${order.customerName}</h3>
                                            <p class="text-[10px] text-gray-400 font-mono">#${order.receiptNumber || order.id.slice(-6)}</p>
                                        </div>
                                        <span class="text-[10px] font-bold px-2 py-1 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-600'}">
                                            ${order.status === 'completed' ? '已完成' : order.status === 'cancelled' ? '已取消' : '待处理'}
                                        </span>
                                    </div>
                                    <div class="space-y-1 mb-3">
                                        ${order.items.map(item => `<div class="flex justify-between text-sm"><span class="text-gray-600 truncate w-32">${item.name} <span class="text-gray-400 text-xs">x${item.quantity}</span></span><span class="font-mono text-gray-800">RM${(item.price * item.quantity).toFixed(2)}</span></div>`).join('')}
                                        <div class="flex justify-between font-bold text-sm pt-1 mt-1 border-t border-dashed border-gray-200"><span>Total</span><span class="text-pink-600">RM${parseFloat(order.totalAmount).toFixed(2)}</span></div>
                                    </div>
                                    ${order.status !== 'completed' && order.status !== 'cancelled' ? `
                                        <div class="flex gap-2 mt-2">
                                            <button onclick="window.showFulfillOrderModal(elementSdk.config, getDataByType('order').find(o => o.id === '${order.id}'))" class="flex-1 py-1.5 rounded bg-blue-600 text-white text-xs font-bold shadow hover:bg-blue-700">处理/发货</button>
                                            <button class="cancelOrderBtn flex-1 py-1.5 rounded border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50" data-id="${order.id}">取消</button>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>

            <hr class="my-8 border-gray-200">
            ${renderAssetTabs(services, products, posts, config)}
        </div>
    `;
}

// ==========================================
// 👇 [v1.3.6 (Beta) Fix] 全能财务驾驶舱 (防重算版)
// ==========================================
window.statsDateRange = window.statsDateRange || 'today';

function renderStats(config, services, bookings, customers, orders) {
    let allTransactions = [];

    // 1. 建立“已入账单号”名单 (白名单)
    // 只统计 status='completed' 的订单，'cancelled' 的会被自动过滤
    const processedReceipts = new Set(
        orders.filter(o => o.status === 'completed' && o.receiptNumber)
            .map(o => o.receiptNumber)
    );

    // A. 处理预约单
    bookings.forEach(b => {
        if (b.status === 'completed') {
            // 🛑 防重防火墙：如果这单已经有对应的 Order 在下面统计了，这里就跳过
            if (b.receiptNumber && processedReceipts.has(b.receiptNumber)) {
                return;
            }

            allTransactions.push({
                type: 'Service',
                rawDate: new Date(b.completedAt || `${b.appointmentDate}T${b.appointmentTime}`),
                receiptNo: b.receiptNumber || '-',
                customer: b.customerName,
                payment: b.paymentMethod || 'Cash',
                summary: `💅 ${b.serviceName}`,
                amount: parseFloat(b.totalAmount || b.servicePrice || 0),
                originalObj: b
            });
        }
    });

    // B. 处理流水单 (Orders)
    orders.forEach(o => {
        // 🔥 关键：只统计已完成的，撤回的(cancelled)会被忽略
        if (o.status === 'completed') {
            const summary = o.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
            allTransactions.push({
                type: o.isRetail ? 'Retail' : 'Order',
                rawDate: new Date(o.completedAt || o.createdAt),
                receiptNo: o.receiptNumber || '-',
                customer: o.customerName,
                payment: o.paymentMethod || 'Cash',
                summary: `📦 ${summary}`,
                amount: parseFloat(o.totalAmount || 0),
                originalObj: o
            });
        }
    });

    // --- 以下渲染逻辑保持不变 ---
    const now = new Date();
    const todayStr = now.toLocaleDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filteredData = allTransactions.filter(t => {
        const tDate = t.rawDate;
        const tDateStr = tDate.toLocaleDateString();
        if (window.statsDateRange === 'today') return tDateStr === todayStr;
        else if (window.statsDateRange === 'yesterday') return tDateStr === yesterdayStr;
        else if (window.statsDateRange === 'month') return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        else return true;
    });

    filteredData.sort((a, b) => b.rawDate - a.rawDate);

    const totalRevenue = filteredData.reduce((sum, t) => sum + t.amount, 0);
    const totalCount = filteredData.length;

    return `
        <div class="space-y-6">
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">📊 财务报表</h2>
                    <p class="text-xs text-gray-400 mt-1">
                        ${window.statsDateRange === 'today' ? `📅 今天 (${todayStr})` :
            window.statsDateRange === 'yesterday' ? `⏮ 昨天 (${yesterdayStr})` :
                window.statsDateRange === 'month' ? `🗓 本月 (${currentYear}-${currentMonth + 1})` : '📈 历史全部数据'}
                    </p>
                </div>
                <div class="flex bg-gray-100 p-1 rounded-xl">
                    <button onclick="window.statsDateRange='today'; renderApp()" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.statsDateRange === 'today' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">今天</button>
                    <button onclick="window.statsDateRange='yesterday'; renderApp()" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.statsDateRange === 'yesterday' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">昨天</button>
                    <button onclick="window.statsDateRange='month'; renderApp()" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.statsDateRange === 'month' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">本月</button>
                    <button onclick="window.statsDateRange='all'; renderApp()" class="px-4 py-2 rounded-lg text-sm font-bold transition-all ${window.statsDateRange === 'all' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">全部</button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 print:hidden">
                <div class="bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl p-4 text-white shadow-lg shadow-pink-200">
                    <p class="text-xs opacity-80 font-bold uppercase">Total Revenue</p>
                    <h3 class="text-2xl font-bold mt-1">RM${totalRevenue.toFixed(2)}</h3>
                </div>
                <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <p class="text-xs text-gray-400 font-bold uppercase">Transactions</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">${totalCount}</h3>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 class="font-bold text-gray-700">📜 交易流水</h3>
                    <button onclick="printStats('${window.statsDateRange}')" class="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-black transition-colors print:hidden">
                        🖨️ 打印
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-xs text-gray-400 uppercase border-b bg-gray-50">
                                <th class="p-4 pl-6">Time</th>
                                <th class="p-4">No.</th>
                                <th class="p-4">Cust</th>
                                <th class="p-4">Detail</th>
                                <th class="p-4 text-right pr-6">Amt</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">
                            ${filteredData.length === 0 ? `<tr><td colspan="5" class="p-8 text-center text-gray-400">无记录</td></tr>` :
            filteredData.map(t => `
                                <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                    <td class="p-4 pl-6 font-mono text-xs text-gray-500">${t.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td class="p-4 font-mono font-bold text-gray-600">${t.receiptNo}</td>
                                    <td class="p-4 font-bold text-gray-800">${t.customer}</td>
                                    <td class="p-4 text-gray-600 truncate max-w-[200px]">${t.summary}</td>
                                    <td class="p-4 text-right pr-6 font-bold">RM${t.amount.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 👇 设置页面 (v1.1.0 升级版：底部吸附栏 + UI修复)
// ==========================================
function renderSettings(config) {
    const discountSettings = getDiscountSettings();
    const owners = getDataByType('owner_credentials');
    const currentOwner = owners.length > 0 ? owners[0] : ownerCredentials;

    return `
        <div class="pb-32">
            <div class="flex items-center gap-3 mb-6">
                <h2 style="font-size: ${config.font_size * 2}px; font-weight: 700; color: ${config.primary_action_color}; margin-bottom: 0;">
                    ⚙️ 系统设置
                </h2>
                
                ${(() => {
            const currentVersion = 'v1.3.6 正式版';
            // 检查是否已读
            const lastSeen = localStorage.getItem('BlythraLoop_last_seen_version');
            const showBadge = lastSeen !== currentVersion;

            return `
                    <button onclick="handleVersionClick(elementSdk.config, '${currentVersion}')" 
                        class="px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-bold hover:bg-pink-200 transition-colors cursor-pointer relative group">
                        ${currentVersion}
                        
                        ${showBadge ? `
                            <span id="versionBadge" class="absolute -top-1 -right-1 flex h-3 w-3">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                            </span>
                        ` : ''}
                        
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            点击查看更新内容
                        </div>
                    </button>
                    `;
        })()}
                </div>
            
            <form id="discountSettingsForm">
                
                <div class="mb-6 p-6 rounded-2xl bg-red-50 border-2 border-red-100 shadow-sm">
                    <h3 class="mb-4 font-bold text-lg text-red-600 border-b border-red-200 pb-2 flex items-center gap-2">
                        🔐 管理员账号安全
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="mb-2">
                            <label class="block mb-1 text-sm font-bold text-gray-600">管理员用户名 (Login ID)</label>
                            <input type="text" id="adminUsername" value="${currentOwner.username}" required
                                class="w-full px-3 py-2 rounded border focus:outline-none focus:border-red-500 bg-white font-bold text-gray-700">
                        </div>
                        <div class="mb-2">
                            <label class="block mb-1 text-sm font-bold text-gray-600">新密码 (Password)</label>
                            <input type="text" id="adminPassword" value="${currentOwner.password}" required
                                class="w-full px-3 py-2 rounded border focus:outline-none focus:border-red-500 bg-white font-bold text-gray-700">
                        </div>
                    </div>
                </div>

                <div class="mb-6 p-6 rounded-2xl bg-white shadow-sm">
                    <h3 class="mb-4 font-bold text-lg text-gray-800 border-b pb-2">🖼️ 品牌 Logo 设置</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col items-center p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-pink-300 transition-colors">
                            <label class="mb-2 text-sm font-bold text-gray-600">🏠 登录页 Logo (大图)</label>
                            <div class="w-32 h-32 mb-3 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden border border-gray-100 cursor-pointer relative group"
                                 onclick="document.getElementById('logoLoginInput').click()">
                                <img id="loginLogoPreviewImg" src="${discountSettings.logo_login || discountSettings.logo_url || ''}" class="w-full h-full object-contain" style="display: ${discountSettings.logo_login || discountSettings.logo_url ? 'block' : 'none'}">
                                <span id="loginLogoPlaceholder" style="display: ${discountSettings.logo_login || discountSettings.logo_url ? 'none' : 'block'}" class="text-4xl opacity-20">➕</span>
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all">
                                    <span class="text-xs text-gray-500 opacity-0 group-hover:opacity-100 bg-white px-2 py-1 rounded-full shadow-sm">点击更换</span>
                                </div>
                            </div>
                            <input type="file" id="logoLoginInput" accept="image/*" style="display: none;">
                            <input type="hidden" id="logoLoginUrl" value="${discountSettings.logo_login || discountSettings.logo_url || ''}">
                        </div>

                        <div class="flex flex-col items-center p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-pink-300 transition-colors">
                            <label class="mb-2 text-sm font-bold text-gray-600">🔝 顶部菜单 Logo (小图)</label>
                            <div class="w-32 h-32 mb-3 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden border border-gray-100 cursor-pointer relative group"
                                 onclick="document.getElementById('logoHeaderInput').click()">
                                <img id="headerLogoPreviewImg" src="${discountSettings.logo_header || ''}" class="w-full h-full object-contain" style="display: ${discountSettings.logo_header ? 'block' : 'none'}">
                                <span id="headerLogoPlaceholder" style="display: ${discountSettings.logo_header ? 'none' : 'block'}" class="text-4xl opacity-20">➕</span>
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all">
                                    <span class="text-xs text-gray-500 opacity-0 group-hover:opacity-100 bg-white px-2 py-1 rounded-full shadow-sm">点击更换</span>
                                </div>
                            </div>
                            <input type="file" id="logoHeaderInput" accept="image/*" style="display: none;">
                            <input type="hidden" id="logoHeaderUrl" value="${discountSettings.logo_header || ''}">
                        </div>
                    </div>
                </div>

                <div class="mb-6 p-6 rounded-2xl bg-white shadow-sm">
                    <h3 class="mb-4 font-bold text-lg text-gray-800 border-b pb-2">🏢 店铺与商家信息</h3>
                    
                    <div class="mb-4">
                        <label class="block mb-1 text-sm font-bold text-gray-600">店铺名称</label>
                        <input type="text" id="shopName" value="${discountSettings.shop_name || config.app_title}" class="w-full px-3 py-2 rounded border">
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label class="block mb-1 text-sm font-bold text-green-600">WhatsApp (会自动格式化)</label>
                            <input type="text" id="waNumber" value="${discountSettings.wa_number || ''}" 
                                onchange="this.value = cleanPhoneNumber(this.value)"
                                placeholder="e.g. 0123456789"
                                class="w-full px-3 py-2 rounded border border-green-200 bg-green-50">
                        </div>
                        <div>
                            <label class="block mb-1 text-sm font-bold text-gray-600">SSM 注册号</label>
                            <input type="text" id="ssmNumber" value="${discountSettings.ssm_number || ''}" class="w-full px-3 py-2 rounded border">
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block mb-1 text-sm font-bold text-gray-600">店铺地址</label>
                        <textarea id="shopAddress" rows="2" class="w-full px-3 py-2 rounded border">${discountSettings.shop_address || ''}</textarea>
                    </div>

                    <div class="mb-4">
                        <label class="block mb-1 text-sm font-bold text-gray-600">Google Map 导航链接</label>
                        <input type="text" id="mapLink" value="${discountSettings.map_link || ''}" placeholder="http://googleusercontent.com/maps.google.com/..." class="w-full px-3 py-2 rounded border">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block mb-1 text-sm font-bold text-blue-800">Facebook 链接</label>
                            <input type="text" id="fbLink" value="${discountSettings.fb_link || ''}" class="w-full px-3 py-2 rounded border">
                        </div>
                        <div>
                            <label class="block mb-1 text-sm font-bold text-pink-600">Instagram 链接</label>
                            <input type="text" id="igLink" value="${discountSettings.ig_link || ''}" class="w-full px-3 py-2 rounded border">
                        </div>
                        <div>
                            <label class="block mb-1 text-sm font-bold text-black">TikTok 链接</label>
                            <input type="text" id="tiktokLink" value="${discountSettings.tiktok_link || ''}" class="w-full px-3 py-2 rounded border">
                        </div>
                    </div>
                </div>

                <div class="mb-6 p-6 rounded-2xl bg-blue-50 border-2 border-blue-100 shadow-sm">
                    <h3 class="mb-4 font-bold text-lg text-blue-800 border-b border-blue-200 pb-2">🧾 财务与税务 (SST)</h3>
                    
                    <div class="flex items-center justify-between mb-4">
                        <span class="font-bold text-gray-700">启用 SST 税务计算</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="enableSST" class="sr-only peer" ${discountSettings.enable_sst ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block mb-1 text-sm font-bold text-gray-600">SST 税率 (%)</label>
                            <input type="number" id="sstRate" value="${discountSettings.sst_rate || 6}" class="w-full px-3 py-2 rounded border">
                        </div>
                        <div>
                            <label class="block mb-1 text-sm font-bold text-gray-600">SST 注册号</label>
                            <input type="text" id="sstID" value="${discountSettings.sst_id || ''}" class="w-full px-3 py-2 rounded border">
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <span class="font-bold text-sm text-gray-600">在收据上显示 SST 金额?</span>
                        <input type="checkbox" id="showSSTOnReceipt" ${discountSettings.show_sst_on_receipt ? 'checked' : ''} class="w-5 h-5 accent-blue-600">
                    </div>

                    <div class="mb-6">
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Touch 'n Go QR Code</label>
                        <div class="relative group cursor-pointer w-48 h-48 mx-auto" onclick="document.getElementById('tngQrInput').click()">
                            
                            <img id="tngQrPreview" 
                                 src="${discountSettings.tng_qr_url || ''}" 
                                 class="w-full h-full object-cover rounded-xl border-2 border-dashed border-blue-300 shadow-sm ${discountSettings.tng_qr_url ? 'block' : 'hidden'}">
                            
                            <div id="tngQrPlaceholder" 
                                 class="absolute inset-0 flex flex-col items-center justify-center bg-blue-50 rounded-xl border-2 border-dashed border-blue-300 ${discountSettings.tng_qr_url ? 'hidden' : 'flex'}">
                                 <span class="text-4xl mb-2">📷</span>
                                 <p class="text-xs text-blue-500 font-bold">点击上传二维码</p>
                                 <p class="text-[10px] text-gray-400 mt-1">支持拖拽裁剪</p>
                            </div>

                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-xl flex items-center justify-center">
                                <span class="text-white opacity-0 group-hover:opacity-100 font-bold text-sm bg-black/50 px-3 py-1 rounded-full">更换图片</span>
                            </div>

                            <input type="hidden" id="tngQrUrl" value="${discountSettings.tng_qr_url || ''}">
                            <input type="file" id="tngQrInput" accept="image/*" class="hidden">
                        </div>
                    </div>

                <div class="mb-6 p-6 rounded-2xl bg-purple-50 border-2 border-purple-100 shadow-sm">
                    <h3 class="mb-4 font-bold text-lg text-purple-800 border-b border-purple-200 pb-2">⭐ 积分与会员等级</h3>
                    <div class="flex items-center justify-between mb-6">
                        <span class="font-bold text-gray-700">启用积分系统</span>
                        <input type="checkbox" id="enableRewards" ${discountSettings.enable_rewards !== false ? 'checked' : ''} class="w-5 h-5 accent-purple-500">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div><label class="block text-xs font-bold text-purple-600">铜牌积分/折扣</label><div class="flex gap-2"><input type="number" id="bronzePoints" value="${discountSettings.bronze_points || 0}" class="w-1/2 p-2 rounded border"><input type="number" id="bronzeDiscount" value="${discountSettings.bronze_discount || 0}" class="w-1/2 p-2 rounded border"></div></div>
                        <div><label class="block text-xs font-bold text-gray-600">银牌积分/折扣</label><div class="flex gap-2"><input type="number" id="silverPoints" value="${discountSettings.silver_points || 100}" class="w-1/2 p-2 rounded border"><input type="number" id="silverDiscount" value="${discountSettings.silver_discount || 5}" class="w-1/2 p-2 rounded border"></div></div>
                        <div><label class="block text-xs font-bold text-yellow-600">金牌积分/折扣</label><div class="flex gap-2"><input type="number" id="goldPoints" value="${discountSettings.gold_points || 300}" class="w-1/2 p-2 rounded border"><input type="number" id="goldDiscount" value="${discountSettings.gold_discount || 10}" class="w-1/2 p-2 rounded border"></div></div>
                        <div><label class="block text-xs font-bold text-cyan-600">白金积分/折扣</label><div class="flex gap-2"><input type="number" id="platinumPoints" value="${discountSettings.platinum_points || 600}" class="w-1/2 p-2 rounded border"><input type="number" id="platinumDiscount" value="${discountSettings.platinum_discount || 15}" class="w-1/2 p-2 rounded border"></div></div>
                    </div>
                    <div>
                        <label class="block mb-1 text-xs font-bold text-gray-600">积分兑换比 (10 积分 = ? RM)</label>
                        <input type="number" id="pointsToRmRate" value="${discountSettings.points_to_rm_rate || 10}" class="w-full px-3 py-2 rounded border">
                    </div>
                </div>

                <div class="mb-6 p-6 rounded-2xl bg-green-50 border-2 border-green-100 shadow-sm">
                    <h3 class="mb-4 font-bold text-lg text-green-800 border-b border-green-200 pb-2">🛍️ 商品管理</h3>
                    <div class="flex items-center justify-between">
                        <span class="font-bold">启用商品功能</span>
                        <input type="checkbox" id="enableShop" ${discountSettings.enable_shop !== false ? 'checked' : ''} class="w-5 h-5 accent-green-500">
                    </div>
                </div>
                <div class="mb-4">
                        <label class="block mb-1 text-sm font-bold text-gray-600">默认物流公司 (Default Courier)</label>
                        <select id="defaultCourier" class="w-full px-3 py-2 rounded border bg-gray-50 text-gray-700 font-bold">
                            <option value="">-- 请选择 --</option>
                            <option value="J&T" ${discountSettings.default_courier === 'J&T' ? 'selected' : ''}>J&T Express</option>
                            <option value="PosLaju" ${discountSettings.default_courier === 'PosLaju' ? 'selected' : ''}>Pos Laju</option>
                            <option value="GDEX" ${discountSettings.default_courier === 'GDEX' ? 'selected' : ''}>GDEX</option>
                            <option value="NinjaVan" ${discountSettings.default_courier === 'NinjaVan' ? 'selected' : ''}>Ninja Van</option>
                            <option value="ShopeeXpress" ${discountSettings.default_courier === 'ShopeeXpress' ? 'selected' : ''}>Shopee Xpress</option>
                            <option value="DHL" ${discountSettings.default_courier === 'DHL' ? 'selected' : ''}>DHL eCommerce</option>
                            <option value="CityLink" ${discountSettings.default_courier === 'CityLink' ? 'selected' : ''}>CityLink</option>
                            <option value="Lalamove" ${discountSettings.default_courier === 'Lalamove' ? 'selected' : ''}>Lalamove</option>
                            <option value="GrabExpress" ${discountSettings.default_courier === 'GrabExpress' ? 'selected' : ''}>GrabExpress</option>
                        </select>
                        <p class="text-[10px] text-gray-400 mt-1">设置后，发货时会自动填入此物流。</p>
                    </div>

                <div class="mb-6 p-6 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300">
                    <h3 class="mb-2 font-bold text-gray-700">💾 数据备份</h3>
                    <div class="flex gap-4">
                        <button type="button" onclick="exportData()" class="flex-1 py-3 rounded-lg bg-gray-600 text-white font-bold">⬇️ 导出</button>
                        <button type="button" onclick="document.getElementById('importFile').click()" class="flex-1 py-3 rounded-lg bg-white border font-bold">⬆️ 恢复</button>
                        <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importData(this)">
                    </div>
                </div>

                <div class="mb-6 p-6 rounded-2xl bg-gray-50 border-2 border-gray-200">
                    <h3 class="mb-4 font-bold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
                        📜 店铺条款与声明 (Policies)
                        <span class="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded">支持自定义</span>
                    </h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block mb-2 text-xs font-bold text-gray-600 uppercase">服务条款 (Terms & Conditions)</label>
                            <textarea id="customTerms" rows="4" placeholder="默认使用系统标准条款。如需修改，请在此输入..." 
                                class="w-full px-4 py-3 rounded-lg border focus:border-gray-500 text-sm"
                                style="font-family: monospace;">${discountSettings.custom_terms || ''}</textarea>
                            <p class="text-[10px] text-gray-400 mt-1">留空则显示系统默认的“免责声明、迟到规则”等。</p>
                        </div>

                        <div>
                            <label class="block mb-2 text-xs font-bold text-gray-600 uppercase">隐私政策 (Privacy Policy)</label>
                            <textarea id="customPrivacy" rows="3" placeholder="默认使用系统标准隐私政策..." 
                                class="w-full px-4 py-3 rounded-lg border focus:border-gray-500 text-sm"
                                style="font-family: monospace;">${discountSettings.custom_privacy || ''}</textarea>
                        </div>

                        <div>
                            <label class="block mb-2 text-xs font-bold text-gray-600 uppercase">售后与退款 (Return & Refund)</label>
                            <textarea id="customReturn" rows="3" placeholder="默认使用系统标准退换货政策..." 
                                class="w-full px-4 py-3 rounded-lg border focus:border-gray-500 text-sm"
                                style="font-family: monospace;">${discountSettings.custom_return || ''}</textarea>
                        </div>
                    </div>
                </div>

                <div class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 flex gap-4 items-center justify-center z-40 border-t border-gray-100">
                    
                    <button type="submit" class="w-full max-w-md py-4 rounded-xl font-bold text-white shadow-lg text-lg transform active:scale-95 transition-transform flex items-center justify-center gap-2" 
                        style="background: ${config.primary_action_color};">
                        <span>💾 保存所有设置</span>
                    </button>
                </div>
         </form>     
     </div>
    `;
}

// ==========================================
// 👇 [v1.3.6（Beta] 客户管理 (美观样式 + 功能融合版)
// ==========================================
function renderCustomersManagement(config, customers, bookings) {
    const settings = getDiscountSettings();

    // 搜索筛选逻辑
    window.filterCustomerTable = (query) => {
        const lowerQ = query.toLowerCase();
        const rows = document.querySelectorAll('#customerTableBody tr');
        let hasResult = false;
        rows.forEach(row => {
            if (row.id === 'noDataRow') return;
            const name = row.dataset.name.toLowerCase();
            const phone = row.dataset.phone;
            if (name.includes(lowerQ) || phone.includes(lowerQ)) {
                row.style.display = ''; hasResult = true;
            } else {
                row.style.display = 'none';
            }
        });
        const noDataRow = document.getElementById('noDataRow');
        if (noDataRow) noDataRow.style.display = hasResult ? 'none' : '';
    };

    return `
        <div class="p-4 animate-fade-in pb-20">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold" style="color: ${config.primary_action_color};">👥 客户管理 (${customers.length})</h2>
                <button id="addCustomerBtn" class="px-6 py-2 rounded-lg text-white font-bold shadow-md transform active:scale-95 transition-transform" 
                    style="background: ${config.primary_action_color};">
                    + 添加客户
                </button>
            </div>
            
            <div class="mb-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input type="text" placeholder="搜索客户名字 / 电话号码..." 
                        oninput="window.filterCustomerTable(this.value)" 
                        class="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-100 focus:border-pink-500 focus:outline-none font-bold text-gray-700">
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="p-4 text-gray-500">用户名</th>
                            <th class="p-4 text-gray-500">电话</th> 
                            ${settings.enable_membership ? '<th class="p-4 text-gray-500">等级</th>' : ''}
                            <th class="p-4 text-gray-500 text-center">积分 / 信誉</th>
                            <th class="p-4 text-gray-500 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody id="customerTableBody">
                        ${customers.length === 0 ? `
                            <tr><td colspan="5" class="p-8 text-center text-gray-400">暂无客户数据</td></tr>
                        ` : customers.map(acc => {
        const lateCount = bookings.filter(b => b.customerName === acc.username && (b.markedLate15m || b.markedSevere30m)).length;

        return `
                            <tr class="border-b last:border-0 hover:bg-gray-50 transition-colors" 
                                data-name="${acc.username || ''}" 
                                data-phone="${acc.phone || ''}">
                                
                                <td class="p-4 font-bold text-gray-700">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                            <img src="${acc.avatar || acc.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}" class="w-full h-full object-cover">
                                        </div>
                                        ${acc.username}
                                    </div>
                                </td>
                                <td class="p-4 text-gray-600 font-mono">${acc.phone || '-'}</td> 
                                
                                ${settings.enable_membership ? `<td class="p-4">${getMembershipBadge(acc.membershipLevel, config)}</td>` : ''}
                                
                                <td class="p-4 text-center">
                                    <div class="font-bold text-purple-600">${acc.points} 分</div>
                                    ${lateCount > 0
                ? `<div class="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">迟到 ${lateCount} 次</div>`
                : `<div class="text-[10px] text-green-500 mt-1 opacity-60">记录良好</div>`
            }
                                </td>
                                
                                <td class="p-4 text-right flex justify-end gap-2">
                                    <button onclick="showCustomerDetailModal(elementSdk.config, getDataByType('customer_account').find(c => c.id === '${acc.id}'))" 
                                        class="text-purple-600 font-bold border border-purple-200 px-3 py-1 rounded hover:bg-purple-50 transition-colors text-xs">
                                        👁️ 档案
                                    </button>
                                    <button onclick="showEditCustomerModal(elementSdk.config, '${acc.id}')" 
                                        class="text-blue-500 font-bold border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors text-xs">
                                        ✏️ 编辑
                                    </button>
                                    
                                    <button class="deleteCustomerBtn text-red-500 font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors text-xs" 
                                        data-customer-id="${acc.id}">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        `}).join('')}
                        
                        <tr id="noDataRow" style="display: none;">
                            <td colspan="5" class="p-8 text-center text-gray-400">🔍 找不到匹配的客户</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ==========================================
// 👇 [v1.3.5] 零售收银面板 (优化版：图片比例 & 布局宽度)
// ==========================================
window.retailCart = window.retailCart || [];
window.retailCustomer = window.retailCustomer || null;
window.retailCategoryFilter = window.retailCategoryFilter || 'all';

function renderRetailPad(config, services) {
    const products = getDataByType('product');
    const customers = getDataByType('customer_account');

    // 1. 合并与筛选
    let allItems = [];
    const markedProducts = products.map(p => ({ ...p, itemType: 'product' }));
    const markedServices = services.map(s => ({ ...s, itemType: 'service', stock: 9999 }));

    if (window.retailCategoryFilter === 'product') {
        allItems = markedProducts;
    } else if (window.retailCategoryFilter === 'service') {
        allItems = markedServices;
    } else {
        allItems = [...markedProducts, ...markedServices];
    }

    const total = window.retailCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return `
        <div class="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)] min-h-[600px]">
            
            <div class="lg:w-3/4 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b bg-gray-50 flex flex-col md:flex-row gap-3 justify-between items-center">
                    
                    <div class="flex gap-2 w-full md:w-auto flex-1">
                        <div class="relative flex-1">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            <input type="text" id="retailSearch" placeholder="搜索商品/服务..." 
                                oninput="window.filterRetailProducts(this.value)"
                                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-pink-500 focus:outline-none font-bold text-sm">
                        </div>
                    </div>
                    
                    <div class="flex gap-2 w-full md:w-auto justify-center">
                        <button onclick="window.retailCategoryFilter='all'; renderApp()" 
                            class="px-4 py-2 rounded-lg text-xs font-bold transition-all ${window.retailCategoryFilter === 'all' ? `bg-gray-800 text-white shadow` : 'bg-white border text-gray-500 hover:bg-gray-50'}">
                            全部
                        </button>
                        <button onclick="window.retailCategoryFilter='product'; renderApp()" 
                            class="px-4 py-2 rounded-lg text-xs font-bold transition-all ${window.retailCategoryFilter === 'product' ? `bg-pink-600 text-white shadow` : 'bg-white border text-gray-500 hover:bg-gray-50'}">
                            📦 商品
                        </button>
                        <button onclick="window.retailCategoryFilter='service'; renderApp()" 
                            class="px-4 py-2 rounded-lg text-xs font-bold transition-all ${window.retailCategoryFilter === 'service' ? `bg-purple-600 text-white shadow` : 'bg-white border text-gray-500 hover:bg-gray-50'}">
                            💆‍♀️ 服务
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
                    <div id="retailProductGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        ${allItems.map(item => {
        const isService = item.itemType === 'service';
        const stock = parseInt(item.stock || 0);
        const isOOS = !isService && stock <= 0;

        return `
                                <div onclick="${isOOS ? '' : `window.addToRetailCart('${item.id}', '${item.itemType}')`}" 
                                     class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col relative group transition-all ${isOOS ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:border-pink-300 active:scale-[0.98] duration-200'}">
                                    
                                    <div class="aspect-[4/3] w-full bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                                        <img src="${item.imageUrl || './assets/default_eye.png'}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                                        ${isService ? `<span class="absolute top-2 right-2 bg-purple-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">服务</span>` : ''}
                                        ${!isOOS && !isService ? `<span class="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">存: ${stock}</span>` : ''}
                                    </div>
                                    
                                    <h4 class="font-bold text-gray-800 text-sm truncate mb-1" title="${item.name}">${item.name}</h4>
                                    
                                    <div class="mt-auto flex justify-between items-center">
                                        <span class="font-bold text-pink-600 text-base">RM${parseFloat(item.price).toFixed(0)}<span class="text-xs">.00</span></span>
                                        ${isOOS ?
                `<span class="text-[10px] font-bold px-2 py-1 rounded bg-red-100 text-red-600">缺货</span>` :
                `<div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-pink-500 group-hover:text-white transition-colors text-lg font-bold">+</div>`
            }
                                    </div>
                                </div>
                            `;
    }).join('')}
                    </div>
                </div>
            </div>

            <div class="lg:w-1/4 flex flex-col bg-white rounded-2xl shadow-xl border-t-4 border-l border-gray-200" style="border-top-color: ${config.primary_action_color};">
                
                <div class="p-4 border-b bg-yellow-50/50">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">当前会员</span>
                        ${window.retailCustomer ? `
                            <button onclick="window.retailCustomer=null; renderApp()" class="text-xs text-red-400 hover:text-red-600 font-bold">✕ 解绑</button>
                        ` : ''}
                    </div>
                    
                    ${window.retailCustomer ? `
                        <div class="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-yellow-200 shadow-sm">
                            <img src="${window.retailCustomer.avatar || 'https://via.placeholder.com/50'}" class="w-8 h-8 rounded-full object-cover border border-gray-100">
                            <div class="flex-1 min-w-0">
                                <div class="font-bold text-sm text-gray-800 truncate">${window.retailCustomer.username}</div>
                                <div class="text-xs text-yellow-600 font-bold">积分: ${window.retailCustomer.points}</div>
                            </div>
                        </div>
                    ` : `
                        <select onchange="window.selectRetailCustomer(this.value)" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 focus:outline-none focus:border-yellow-400 bg-white cursor-pointer">
                            <option value="">👤 散客 (Walk-in)</option>
                            ${customers.map(c => `<option value="${c.id}">👑 ${c.username}</option>`).join('')}
                        </select>
                    `}
                </div>

                <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gray-50/30">
                    <div class="flex justify-between items-center px-1 mb-1">
                        <span class="text-xs font-bold text-gray-400">购物车 (${window.retailCart.length})</span>
                        <button onclick="window.retailCart=[]; renderApp()" class="text-[10px] text-red-400 hover:text-red-600 font-bold hover:underline">清空</button>
                    </div>

                    ${window.retailCart.length === 0 ? `
                        <div class="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                            <span class="text-5xl grayscale">🛒</span>
                            <p class="text-xs font-bold">未选择项目</p>
                        </div>
                    ` : window.retailCart.map((item, idx) => `
                        <div class="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm group">
                            <div class="flex-1 min-w-0">
                                <div class="font-bold text-sm text-gray-700 truncate mb-0.5">
                                    ${item.name}
                                </div>
                                <div class="text-xs text-gray-400 font-mono">RM${item.price}</div>
                            </div>
                            <div class="flex items-center gap-2 pl-2">
                                <div class="flex items-center bg-gray-50 border rounded-lg h-7">
                                    <button onclick="window.updateRetailQty(${idx}, -1)" class="w-7 h-full text-gray-400 hover:text-red-500 font-bold transition-colors">-</button>
                                    <span class="w-6 text-center text-xs font-bold text-gray-700">${item.quantity}</span>
                                    <button onclick="window.updateRetailQty(${idx}, 1)" class="w-7 h-full text-gray-400 hover:text-green-500 font-bold transition-colors">+</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="p-4 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10">
                    <div class="flex justify-between items-end mb-4">
                        <div class="text-xs text-gray-400 font-bold uppercase">Total Amount</div>
                        <div class="text-2xl font-bold text-gray-800">
                            <span class="text-sm align-top text-gray-400 mr-0.5">RM</span>${total.toFixed(2)}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="window.showRetailPaymentModal('TNG', ${total})" 
                            class="py-3 rounded-xl font-bold text-sm text-white shadow-md bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all ${window.retailCart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                            TNG
                        </button>
                        <button onclick="window.showRetailPaymentModal('Cash', ${total})" 
                            class="py-3 rounded-xl font-bold text-sm text-white shadow-md bg-green-600 hover:bg-green-700 active:scale-95 transition-all ${window.retailCart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                            Cash
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 👇 [v1.3.6 Beta 1] 收银台 (修复 TNG 选中状态)
// ==========================================
function showCashierModal(config, appointment = null) {
    const allServices = getDataByType('service');
    const allProducts = getDataByType('product');
    const allOrders = getDataByType('order');
    const settings = getDiscountSettings();

    // 初始化
    let customerName = '';
    let customerPhone = '';
    let itemsToPay = [];
    let manualAdjustment = 0;
    let mobileActiveTab = 'bill';

    // 支付状态
    let selectedMethod = null; // 'TNG' or 'Cash'
    let isPaymentDone = false;
    let savedOrderObject = null;

    if (appointment) {
        customerName = appointment.customerName;
        customerPhone = appointment.customerPhone || '-';
        itemsToPay.push({
            id: appointment.serviceId || 'srv_temp',
            name: `(预约) ${appointment.serviceName}`,
            price: parseFloat(appointment.totalAmount || 0),
            quantity: 1, type: 'service', isOriginal: true
        });
    } else {
        if (window.cart && window.cart.length > 0) {
            customerName = loggedInCustomerName || 'Walk-in Guest';
            const acc = getDataByType('customer_account').find(c => c.username === customerName);
            customerPhone = acc ? acc.phone : '-';
            itemsToPay = window.cart.map(item => ({ ...item, isOriginal: true }));
        } else {
            showToast('购物车是空的！');
            return;
        }
    }

    let finalItems = [...itemsToPay];
    let mergedOrderIds = [];
    let addQty = 1;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-0 md:p-6 bg-black/60 backdrop-blur-sm';

    const renderContent = () => {
        // === 成功页 ===
        if (isPaymentDone) {
            modal.innerHTML = `
                <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-scale-in border-t-8 border-gray-800">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-4xl">✅</span>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-1">收款成功!</h3>
                    <p class="text-gray-500 mb-6">单号: ${savedOrderObject.receiptNumber}</p>
                    <p class="text-4xl font-bold text-gray-900 mb-8">RM${parseFloat(savedOrderObject.totalAmount).toFixed(2)}</p>
                    
                    <div class="space-y-3">
                        <button id="successPrintBtn" class="w-full py-3 rounded-xl font-bold text-gray-700 border-2 border-gray-200 hover:border-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2">
                            🖨️ 打印收据
                        </button>
                        <button id="successWABtn" class="w-full py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 shadow-md flex items-center justify-center gap-2">
                            📱 发送 WhatsApp
                        </button>
                        <button onclick="document.querySelector('.modal-backdrop').remove(); renderApp()" class="w-full py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 mt-4">
                            关闭
                        </button>
                    </div>
                </div>
            `;
            document.getElementById('successPrintBtn').addEventListener('click', () => {
                if (savedOrderObject && typeof showReceiptModal === 'function') showReceiptModal(config, savedOrderObject);
            });
            document.getElementById('successWABtn').addEventListener('click', () => {
                window.sendReceiptByWhatsApp(customerPhone, savedOrderObject.receiptNumber, savedOrderObject.totalAmount);
            });
            return;
        }

        // === 收银主界面 ===
        const itemsTotal = finalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const finalTotal = itemsTotal + parseFloat(manualAdjustment);
        const cleanName = customerName.trim().toLowerCase();

        const pickupOrders = allOrders.filter(o => {
            const targetName = (o.customerName || '').trim().toLowerCase();
            return targetName === cleanName && (o.paymentMethod === 'Store Pickup' || o.paymentMethod === 'COD') && o.status === 'pending' && !mergedOrderIds.includes(o.id);
        });

        const serviceOptions = allServices.map(s => `<option value="service|${s.id}|${s.name}|${s.price}">💆‍♀️ ${s.name} (RM${s.price})</option>`).join('');
        const productOptions = allProducts.map(p => {
            const stock = parseInt(p.stock || 0);
            return `<option value="product|${p.id}|${p.name}|${p.price}" ${stock <= 0 ? 'disabled' : ''}>📦 ${p.name} (RM${p.price}) ${stock <= 0 ? '[缺货]' : ''}</option>`;
        }).join('');

        const leftPanelClass = mobileActiveTab === 'add' ? 'flex' : 'hidden md:flex';
        const rightPanelClass = mobileActiveTab === 'bill' ? 'flex' : 'hidden md:flex';
        const tabActive = "bg-gray-800 text-white shadow-md";
        const tabInactive = "bg-gray-100 text-gray-500";

        modal.innerHTML = `
            <div class="bg-white w-full h-full md:h-[90vh] md:max-w-5xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up border border-gray-200">
                <div class="md:hidden p-2 flex gap-2 border-b bg-white z-20 shrink-0">
                    <button onclick="window.setMobileTab('add')" class="flex-1 py-2 rounded-lg font-bold text-sm ${mobileActiveTab === 'add' ? tabActive : tabInactive}">🛒 加购</button>
                    <button onclick="window.setMobileTab('bill')" class="flex-1 py-2 rounded-lg font-bold text-sm ${mobileActiveTab === 'bill' ? tabActive : tabInactive}">🧾 结账</button>
                    <button onclick="document.querySelector('.modal-backdrop').remove()" class="px-3 rounded-lg bg-gray-100 text-gray-400 font-bold">✕</button>
                </div>

                <div class="${leftPanelClass} w-full md:w-5/12 bg-gray-50 border-r border-gray-200 flex-col h-full overflow-hidden">
                    <div class="p-4 border-b border-gray-200 bg-white hidden md:block"><h3 class="font-bold text-lg text-gray-800">🛒 添加项目</h3></div>
                    <div class="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <select id="posAddItemSelect" class="w-full p-2.5 rounded-lg border-2 border-gray-200 focus:border-pink-500 outline-none mb-3 font-bold text-gray-700 text-sm">
                                <option value="">👇 点击选择...</option>
                                <optgroup label="📦 商品产品">${productOptions}</optgroup>
                                <optgroup label="💆‍♀️ 服务项目">${serviceOptions}</optgroup>
                            </select>
                            <div class="flex gap-2">
                                <div class="flex items-center border-2 rounded-lg bg-gray-50 h-10">
                                    <button onclick="window.adjustPosAddQty(-1)" class="px-3 font-bold text-gray-500 hover:text-pink-600 rounded-l-lg">-</button>
                                    <input id="posAddQtyInput" type="number" value="${addQty}" class="w-10 text-center bg-transparent font-bold outline-none text-sm" readonly>
                                    <button onclick="window.adjustPosAddQty(1)" class="px-3 font-bold text-gray-500 hover:text-green-600 rounded-r-lg">+</button>
                                </div>
                                <button id="posAddItemBtn" class="flex-1 bg-gray-800 text-white font-bold rounded-lg shadow text-sm hover:bg-black">+ 加入</button>
                            </div>
                        </div>
                        ${pickupOrders.length > 0 ? `
                            <div class="bg-orange-50 p-4 rounded-xl border-2 border-orange-200 animate-pulse-slow">
                                <div class="flex justify-between items-start mb-2"><h4 class="font-bold text-orange-800 text-sm">🕵️ 发现待自取订单</h4><span class="bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">${pickupOrders.length} 单</span></div>
                                <button id="posMergeBtn" class="w-full py-2 bg-orange-500 text-white rounded-lg font-bold text-sm shadow hover:bg-orange-600">➕ 合并结账</button>
                            </div>` : ''}
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <label class="block text-xs font-bold text-gray-400 mb-2 uppercase">⚖️ 调整/折扣</label>
                            <div class="relative"><span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">RM</span><input type="number" id="posAdjustmentInput" value="${manualAdjustment}" placeholder="0" class="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-pink-100 focus:border-pink-500 outline-none font-bold text-gray-700 text-sm"></div>
                        </div>
                    </div>
                </div>

                <div class="${rightPanelClass} w-full md:w-7/12 flex-col h-full relative bg-white">
                    <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-50 shrink-0">
                        <div><p class="text-xs text-blue-400 font-bold uppercase mb-1">Customer</p><h2 class="text-xl font-bold text-blue-900 leading-none">${customerName}</h2></div>
                        <button onclick="document.querySelector('.modal-backdrop').remove()" class="hidden md:flex w-8 h-8 rounded-full bg-white text-gray-400 hover:text-red-500 font-bold shadow-sm items-center justify-center">✕</button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white">
                        ${finalItems.length === 0 ? `<div class="h-full flex flex-col items-center justify-center opacity-30"><span class="text-6xl mb-4">🧾</span><p>暂无项目</p></div>` : finalItems.map((item, index) => `
                            <div class="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-pink-200 shadow-sm bg-white">
                                <div class="flex-1 min-w-0 pr-2">
                                    <div class="flex items-center gap-2 mb-1"><span class="text-xs px-1.5 py-0.5 rounded font-bold ${item.type === 'service' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}">${item.type === 'service' ? '服务' : '商品'}</span>${item.fromOrderId ? '<span class="text-[10px] bg-orange-100 text-orange-600 px-1 rounded">自取</span>' : ''}<h4 class="font-bold text-gray-800 truncate text-sm">${item.name}</h4></div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-7"><button onclick="window.updatePosItemQty(${index}, -1)" class="w-6 h-full text-gray-500 hover:text-red-500 font-bold">-</button><span class="w-6 text-center text-xs font-bold text-gray-700">${item.quantity}</span><button onclick="window.updatePosItemQty(${index}, 1)" class="w-6 h-full text-gray-500 hover:text-green-500 font-bold">+</button></div>
                                    <div class="text-right w-20"><p class="font-bold text-gray-800 text-sm">RM${(item.price * item.quantity).toFixed(2)}</p>${!item.isOriginal && !item.fromOrderId ? `<button onclick="window.updatePosItemQty(${index}, -999)" class="text-[10px] text-red-400 hover:text-red-600">删除</button>` : ''}</div>
                                </div>
                            </div>`).join('')}
                    </div>

                    <div class="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 shrink-0">
                        <div class="flex justify-between items-end mb-4">
                            <div><p class="text-xs font-bold text-gray-400 uppercase">TOTAL AMOUNT</p><p class="text-[10px] text-gray-400">应收总额</p></div>
                            <div class="text-right">${parseFloat(manualAdjustment) !== 0 ? `<p class="text-xs text-pink-500 font-bold mb-1">含调整: RM${manualAdjustment}</p>` : ''}<span class="text-3xl font-bold text-gray-900 tracking-tight">RM${finalTotal.toFixed(2)}</span></div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mb-4">
                            <button onclick="window.selectPaymentMethod('TNG')" 
                                class="py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${selectedMethod === 'TNG' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}">
                                <span>🔵</span> TNG
                            </button>
                            <button onclick="window.selectPaymentMethod('Cash')" 
                                class="py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${selectedMethod === 'Cash' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-100' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}">
                                <span>💵</span> Cash
                            </button>
                        </div>

                        <button id="finalConfirmBtn" 
                            class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg text-lg transition-all flex items-center justify-center gap-2 ${selectedMethod ? 'bg-gray-800 hover:bg-black transform active:scale-[0.98]' : 'bg-gray-400 cursor-not-allowed'}" 
                            ${!selectedMethod ? 'disabled' : ''}>
                            ${selectedMethod ? `✅ 确认收款 RM${finalTotal.toFixed(2)}` : '请选择支付方式'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        window.setMobileTab = (tab) => { mobileActiveTab = tab; renderContent(); }
        window.adjustPosAddQty = (c) => { const n = addQty + c; if (n >= 1) { addQty = n; document.getElementById('posAddQtyInput').value = addQty; } }
        window.updatePosItemQty = (i, c) => { if (c === -999) finalItems.splice(i, 1); else { const n = finalItems[i].quantity + c; if (n >= 1) finalItems[i].quantity = n; } renderContent(); }

        // 🔥 修复：选中支付方式的逻辑
        window.selectPaymentMethod = (method) => {
            // 如果点的是 TNG，且配置了二维码
            if (method === 'TNG' && settings.tng_qr_url) {
                // 1. 弹出大图
                showQrPaymentCheck(settings.tng_qr_url, finalTotal, () => {
                    // 2. 扫码弹窗关闭时的回调：
                    // 这里我们不直接提交，而是把 TNG 设为选中状态
                    selectedMethod = 'TNG';
                    renderContent(); // 重新渲染，让按钮变色
                });
            } else {
                // 如果是 Cash，或者没有二维码
                selectedMethod = method;
                renderContent();
            }
        };

        // 绑定其他事件
        document.getElementById('posAddItemBtn').addEventListener('click', () => {
            const val = document.getElementById('posAddItemSelect').value;
            if (!val) return showToast('请先选择项目');
            const [type, id, name, price] = val.split('|');
            const existing = finalItems.find(i => i.id === id && !i.isOriginal && !i.fromOrderId);
            if (existing) existing.quantity += addQty; else finalItems.push({ id, name, price: parseFloat(price), quantity: addQty, type, isAdded: true });
            addQty = 1; if (window.innerWidth < 768) mobileActiveTab = 'bill'; renderContent();
        });

        const mergeBtn = document.getElementById('posMergeBtn');
        if (mergeBtn) mergeBtn.addEventListener('click', () => {
            pickupOrders.forEach(o => { o.items.forEach(i => finalItems.push({ ...i, price: parseFloat(i.price), fromOrderId: o.id })); mergedOrderIds.push(o.id); });
            if (window.innerWidth < 768) mobileActiveTab = 'bill'; renderContent(); showToast('✅ 已合并自取单');
        });

        document.getElementById('posAdjustmentInput').addEventListener('change', (e) => { manualAdjustment = e.target.value || 0; renderContent(); });

        // ⚡️ 最终确认逻辑
        const confirmBtn = document.getElementById('finalConfirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                if (!selectedMethod) return;
                confirmBtn.innerHTML = '⏳ 提交中...';
                confirmBtn.disabled = true;
                await executeCheckout(selectedMethod, finalTotal);
            });
        }
    };

    // 写入数据库
    async function executeCheckout(method, finalTotal) {
        const receiptNo = generateReceiptNumber();
        savedOrderObject = {
            type: 'order', receiptNumber: receiptNo, customerName: customerName,
            items: finalItems, totalAmount: finalTotal, adjustment: manualAdjustment,
            paymentMethod: method, status: 'completed', paymentStatus: 'paid',
            completedAt: new Date().toISOString(), isWalkIn: true,
            mergedFrom: mergedOrderIds.length > 0 ? mergedOrderIds : null
        };

        await createRecord(savedOrderObject);

        // 回写单号给预约
        if (appointment) await updateRecord(appointment, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            paymentMethod: method,
            totalAmount: finalTotal,
            receiptNumber: receiptNo // 👈 关联单号
        });

        // 还原合并单状态
        if (mergedOrderIds.length > 0) {
            for (const oldId of mergedOrderIds) {
                const o = allOrders.find(x => x.id === oldId);
                if (o) await updateRecord(o, {
                    status: 'completed',
                    pickupStatus: 'merged_into_' + receiptNo,
                    customerReceived: true
                });
            }
        }

        // 扣库存
        const products = getDataByType('product');
        for (const item of finalItems) {
            if (item.type === 'product' || item.stock) {
                const p = products.find(prod => prod.id === item.id) || products.find(prod => prod.name === item.name);
                if (p) await updateRecord(p, { stock: Math.max(0, parseInt(p.stock || 0) - item.quantity) });
            }
        }

        if (!appointment) window.cart = [];
        isPaymentDone = true;
        renderContent(); // 切换成功页
    }

    document.body.appendChild(modal);
    renderContent();
}

// ==========================================
// 👇 [v1.3.6 Final] 商家发货弹窗 (强制单号 + 商家自送)
// ==========================================
function showFulfillOrderModal(config, order) {
    const products = getDataByType('product');
    const settings = getDiscountSettings();
    let stockIssues = [];

    // 1. 库存检查
    order.items.forEach(item => {
        const p = products.find(prod => prod.id === item.id) || products.find(prod => prod.name === item.name);
        if (p) {
            const currentStock = parseInt(p.stock || 0);
            if (item.quantity > currentStock) {
                stockIssues.push(`❌ ${item.name}: 需 ${item.quantity} / 存 ${currentStock}`);
            }
        }
    });

    const hasStockIssue = stockIssues.length > 0;

    // 2. 物流列表 (加入“商家自送”)
    const couriers = [
        'J&T', 'PosLaju', 'GDEX', 'NinjaVan', 'ShopeeXpress', 'DHL',
        'CityLink', 'Lalamove', 'GrabExpress',
        'Shop Delivery (商家自送)', // 👈 新增这个
        'Other'
    ];
    const defaultCourier = settings.default_courier || '';

    // 3. 构建凭证显示 HTML (保持不变)
    let proofHtml = '';
    if (order.proofRef || order.proofImageName) {
        proofHtml = `
            <div class="bg-orange-50 p-4 rounded-xl border-2 border-orange-200 mb-4">
                <div class="flex items-center gap-2 mb-2 border-b border-orange-200 pb-2">
                    <span class="text-xl">🕵️</span>
                    <h4 class="font-bold text-orange-900 text-sm">顾客已提交支付凭证</h4>
                </div>
                <div class="space-y-1 text-xs text-orange-800">
                    <div class="flex justify-between">
                        <span class="opacity-70">转账方式:</span>
                        <span class="font-bold">${order.paymentMethod}</span>
                    </div>
                    ${order.proofRef ? `<div class="flex justify-between"><span class="opacity-70">Ref No:</span><strong class="select-all">${order.proofRef}</strong></div>` : ''}
                    ${order.proofImageName ? `<div class="flex justify-between mt-1"><span class="opacity-70">截图:</span><span>📷 ${order.proofImageName}</span></div>` : ''}
                </div>
            </div>
        `;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border-4 border-purple-500">
            <div class="p-6 bg-purple-50 border-b border-purple-100">
                <h3 class="text-xl font-bold text-purple-900">📦 发货 / 核销确认</h3>
                <p class="text-xs text-purple-600 mt-1">单号: ${order.receiptNumber || '未生成'}</p>
            </div>
            
            <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                <div class="p-3 rounded-lg ${hasStockIssue ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}">
                    <p class="text-xs font-bold uppercase mb-1 ${hasStockIssue ? 'text-red-600' : 'text-green-600'}">
                        ${hasStockIssue ? '⚠️ 库存不足 (Stock Alert)' : '✅ 库存充足 (Stock OK)'}
                    </p>
                    ${hasStockIssue ? `<p class="text-[10px] text-red-500 font-bold">🚫 无法发货！请先修改订单数量。</p>` : ''}
                </div>

                ${proofHtml}

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">支付方式</label>
                    <select id="fulfillPaymentMethod" class="w-full px-4 py-2 rounded-lg border border-purple-200 font-bold text-gray-700 bg-gray-50"
                        ${(order.proofRef || order.proofImageName) ? 'disabled' : ''}>
                        <option value="Online Transfer" ${order.paymentMethod === 'Online Transfer' ? 'selected' : ''}>🏦 银行转账</option>
                        <option value="COD" ${order.paymentMethod === 'COD' ? 'selected' : ''}>🚚 货到付款 (COD)</option>
                        <option value="Cash" ${order.paymentMethod === 'Cash' ? 'selected' : ''}>💵 现金 (自取)</option>
                        <option value="TNG" ${order.paymentMethod === 'TNG' ? 'selected' : ''}>🔵 TNG eWallet</option>
                    </select>
                </div>

                <div class="grid grid-cols-3 gap-2">
                    <div class="col-span-1">
                        <label class="block text-xs font-bold text-gray-500 mb-1">物流公司</label>
                        <select id="fulfillCourier" class="w-full px-2 py-2 rounded-lg border focus:border-purple-500 outline-none text-sm font-bold bg-gray-50">
                            <option value="">选择...</option>
                            ${couriers.map(c => `<option value="${c}" ${c === defaultCourier ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-span-2">
                        <label class="block text-xs font-bold text-gray-500 mb-1">物流单号 <span class="text-red-500">*</span></label>
                        <input type="text" id="fulfillTracking" placeholder="必填..." 
                            class="w-full px-4 py-2 rounded-lg border focus:border-purple-500 outline-none">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">备注</label>
                    <input type="text" id="fulfillPaymentRef" placeholder="商家备注..." value="${order.proofRef || ''}" 
                        class="w-full px-4 py-2 rounded-lg border focus:border-purple-500 outline-none">
                </div>

                <div class="flex gap-3 mt-6">
                    <button onclick="document.querySelector('.modal-backdrop').remove()" class="flex-1 py-3 rounded-xl font-bold text-gray-500 border hover:bg-gray-50">取消</button>
                    <button id="confirmFulfillBtn" class="flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-all ${hasStockIssue ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}" ${hasStockIssue ? 'disabled' : ''}>
                        ✅ 确认发货
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 🔥 监听物流选择，自动处理“商家自送”
    const courierSelect = document.getElementById('fulfillCourier');
    const trackingInput = document.getElementById('fulfillTracking');

    courierSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Shop Delivery (商家自送)') {
            trackingInput.value = '商家亲自配送'; // 自动填入
            trackingInput.disabled = true;       // 锁定不让改
            trackingInput.classList.add('bg-gray-100');
        } else {
            if (trackingInput.value === '商家亲自配送') trackingInput.value = ''; // 清空
            trackingInput.disabled = false;
            trackingInput.classList.remove('bg-gray-100');
        }
    });

    // 确认发货逻辑
    document.getElementById('confirmFulfillBtn').addEventListener('click', async () => {
        const courier = courierSelect.value;
        const trackingNo = trackingInput.value;
        const paymentRef = document.getElementById('fulfillPaymentRef').value;
        const finalMethod = document.getElementById('fulfillPaymentMethod').value;

        // 🛑 强制校验：必须选物流 + 必须填单号
        if (!courier) {
            alert('请选择物流公司！');
            return;
        }
        if (!trackingNo) {
            alert('请填写物流单号 (Tracking No)！');
            return;
        }

        const btn = document.getElementById('confirmFulfillBtn');
        btn.innerText = "⏳ 处理中...";
        btn.disabled = true;

        // 1. 扣库存
        for (const item of order.items) {
            const p = products.find(prod => prod.id === item.id) || products.find(prod => prod.name === item.name);
            if (p) {
                const newStock = Math.max(0, parseInt(p.stock) - item.quantity);
                await updateRecord(p, { stock: newStock });
            }
        }

        // 2. 更新订单
        await updateRecord(order, {
            status: 'completed',
            paymentStatus: 'paid',
            completedAt: new Date().toISOString(),
            courier: courier,
            trackingNumber: trackingNo,
            paymentReference: paymentRef,
            paymentMethod: finalMethod
        });

        showToast('✅ 发货成功！');
        modal.remove();
        renderApp();
    });
}

// ==========================================
// 👇 [v1.3.6 Style] 服务弹窗 (美化版 - 支持添加/编辑)
// ==========================================
function showEditServiceModal(config, serviceId = null) {
    const services = getDataByType('service');
    // 🔥 关键逻辑：如果有ID就是编辑，没有就是添加（给一个空对象）
    const service = serviceId
        ? services.find(s => s.id === serviceId)
        : { name: '', price: '', duration: 60, description: '', imageUrl: '' };
    const isEdit = !!serviceId;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm';

    // 👇 使用你提供的精美样式
    modal.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.95); padding: 32px; border-radius: 16px; max-width: 500px; width: 100%; border: 3px solid ${config.primary_action_color}; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto;" class="animate-scale-in">
            <h3 class="mb-6" style="font-size: ${config.font_size * 1.6}px; font-weight: 700; color: ${config.primary_action_color};">
                ${isEdit ? '编辑服务' : '添加新服务'}: ${service.name}
            </h3>
            
            <form id="editServiceForm">
                <div class="mb-4">
                    <label class="block mb-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size * 0.9}px; color: ${config.text_color}; font-weight: 600;">服务名称</label>
                    <input type="text" id="editServiceName" required value="${service.name}"
                        class="w-full px-4 py-3 rounded-lg border-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size}px; border-color: ${config.text_color}33;">
                </div>
                
                <div class="mb-4">
                    <label class="block mb-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size * 0.9}px; color: ${config.text_color}; font-weight: 600;">价格 (RM)</label>
                    <input type="number" id="editServicePrice" required min="0" step="0.01" value="${service.price}"
                        class="w-full px-4 py-3 rounded-lg border-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size}px; border-color: ${config.text_color}33;">
                </div>
                
                <div class="mb-4">
                    <label class="block mb-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size * 0.9}px; color: ${config.text_color}; font-weight: 600;">时长 (分钟)</label>
                    <input type="number" id="editServiceDuration" min="0" value="${service.duration || 60}"
                        class="w-full px-4 py-3 rounded-lg border-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size}px; border-color: ${config.text_color}33;">
                </div>

                <div class="mb-4">
                    <label class="block mb-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size * 0.9}px; color: ${config.text_color}; font-weight: 600;">服务图片</label>
                    <input type="file" id="editFileInput" accept="image/*" style="display: none;">
                    
                    <div id="editDropZone" style="border: 2px dashed ${config.primary_action_color}; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s; background: ${config.primary_action_color}11;">
                         <img id="editImagePreview" src="${service.imageUrl || ''}" style="max-height: 150px; margin: 0 auto; border-radius: 8px; display: ${service.imageUrl ? 'block' : 'none'};">
                        <p id="editUploadText" style="color: ${config.text_color}; opacity: 0.7; pointer-events: none; display: ${service.imageUrl ? 'none' : 'block'};">
                            📸 点击修改图片<br><span style="font-size: 12px;">(拖拽或粘贴链接)</span>
                        </p>
                    </div>

                    <input type="text" id="editServiceImage" placeholder="图片链接..." value="${service.imageUrl || ''}"
                        class="w-full px-4 py-2 mt-2 rounded-lg border-2 text-sm"
                        style="font-family: Lato, sans-serif; border-color: ${config.text_color}33; color: ${config.text_color};">
                </div>
                
                <div class="mb-6">
                    <label class="block mb-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size * 0.9}px; color: ${config.text_color}; font-weight: 600;">描述</label>
                    <textarea id="editServiceDescription" rows="3"
                        class="w-full px-4 py-3 rounded-lg border-2" style="font-family: Lato, sans-serif; font-size: ${config.font_size}px; border-color: ${config.text_color}33;">${service.description || ''}</textarea>
                </div>
                
                <div class="flex gap-3">
                    <button type="submit" class="flex-1 btn-primary py-3 rounded-lg font-bold shadow-md"
                        style="font-family: Lato, sans-serif; background: ${config.primary_action_color}; color: #ffffff; font-size: ${config.font_size * 1.1}px;">保存更改</button>
                    <button type="button" id="cancelEditServiceBtn" class="flex-1 py-3 rounded-lg font-bold"
                        style="font-family: Lato, sans-serif; background: transparent; color: ${config.text_color}; font-size: ${config.font_size * 1.1}px; border: 2px solid ${config.text_color};">取消</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 图片处理逻辑
    const dropZone = document.getElementById('editDropZone');
    const fileInput = document.getElementById('editFileInput');
    const imageInput = document.getElementById('editServiceImage');
    const preview = document.getElementById('editImagePreview');
    const text = document.getElementById('editUploadText');

    const updatePreview = (src) => {
        if (src) {
            preview.src = src;
            preview.style.display = 'block';
            text.style.display = 'none';
        } else {
            preview.style.display = 'none';
            text.style.display = 'block';
        }
    };

    imageInput.addEventListener('input', () => updatePreview(imageInput.value));
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // 假设 openCropperModal 已经定义好
            if (typeof openCropperModal === 'function') {
                openCropperModal(file, (base64) => {
                    imageInput.value = base64;
                    updatePreview(base64);
                });
            } else {
                // 兜底：如果没有裁剪器，直接转Base64
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageInput.value = e.target.result;
                    updatePreview(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }
    });

    // 提交处理
    document.getElementById('editServiceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('editServiceName').value,
            price: parseFloat(document.getElementById('editServicePrice').value),
            duration: parseInt(document.getElementById('editServiceDuration').value) || 0,
            description: document.getElementById('editServiceDescription').value,
            imageUrl: imageInput.value
        };

        if (isEdit) {
            await updateRecord(service, formData);
        } else {
            await createRecord({ type: 'service', ...formData });
        }
        modal.remove();
        renderApp();
    });

    document.getElementById('cancelEditServiceBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// 2. 商品编辑/添加弹窗
function showEditProductModal(config, productId = null) {
    const products = getDataByType('product');
    const product = productId ? products.find(p => p.id === productId) : { name: '', price: '', stock: 0, imageUrl: '' };
    const isEdit = !!productId;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm';

    modal.innerHTML = `
        <div class="bg-white w-full max-w-sm rounded-2xl p-6 animate-scale-in">
            <h3 class="text-xl font-bold mb-4 text-gray-800">${isEdit ? '编辑商品' : '上架新商品'}</h3>
            <form id="productForm" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">商品名称</label>
                    <input type="text" id="prodName" value="${product.name}" required class="w-full px-4 py-2 rounded-lg border border-gray-200">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">价格 (RM)</label>
                        <input type="number" id="prodPrice" value="${product.price}" required class="w-full px-4 py-2 rounded-lg border border-gray-200">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">库存数量</label>
                        <input type="number" id="prodStock" value="${product.stock}" required class="w-full px-4 py-2 rounded-lg border border-gray-200">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1">图片链接 (选填)</label>
                    <input type="text" id="prodImg" value="${product.imageUrl || ''}" placeholder="https://..." class="w-full px-4 py-2 rounded-lg border border-gray-200 text-xs">
                </div>
                <div class="flex gap-2 pt-2">
                    <button type="button" class="flex-1 py-2 rounded-lg bg-gray-100 font-bold text-gray-500" onclick="this.closest('.modal-backdrop').remove()">取消</button>
                    <button type="submit" class="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold shadow-md">保存</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('productForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('prodName').value,
            price: document.getElementById('prodPrice').value,
            stock: parseInt(document.getElementById('prodStock').value) || 0,
            imageUrl: document.getElementById('prodImg').value
        };

        if (isEdit) {
            await updateRecord(product, data);
        } else {
            await createRecord({ type: 'product', ...data });
        }
        modal.remove();
        renderApp();
    };
}

// ==========================================
// 👇 [v1.3.6 Final Fix] 自动化大脑 (防重发/防连击)
// ==========================================
function initAutomation() {
    console.log("🧠 自动化大脑已启动 (5s 轮询)...");

    // 🔥 [Fix] 防止重复启动（避免通知连击）
    if (window.__automationIntervalId) {
        console.log('🧠 自动化大脑已在运行，跳过重复启动');
        return;
    }

    window.__automationIntervalId = setInterval(async () => {
        // 🔥 每次都读最新的 LocalStorage
        const freshData = JSON.parse(localStorage.getItem('gembrow_data') || '[]');
        const bookings = freshData.filter(item => item.type === 'booking');

        const newNotifications = [];
        let hasChanges = false;
        let updatedBookings = [...bookings];
        const now = new Date();

        // Helper: Create Notification
        const addNoti = (targetUser, title, msg, dedupeKey) => {
            if (dedupeKey) {
                const key = String(dedupeKey);
                // Check DB
                if (freshData.some(n => n.type === 'notification' && String(n.dedupeKey || '') === key)) return;
                // Check Batch
                if (newNotifications.some(n => String(n.dedupeKey || '') === key)) return;
            }

            const noti = {
                type: 'notification',
                category: 'alert',
                subtype: 'automation',
                dedupeKey: dedupeKey ? String(dedupeKey) : null,
                id: 'noti_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                version: Date.now(),
                title: title,
                message: msg,
                targetUser: targetUser,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            newNotifications.push(noti);

            // Show Toast
            if (window.loggedInCustomerName === targetUser ||
                (targetUser === 'admin' && window.currentMode === 'owner')) {
                showToast(`🔔 ${title}`);
                console.log(`🔔 触发通知: ${title} -> ${targetUser}`);
            }
        };

        for (let b of updatedBookings) {
            if (b.status !== 'pending') continue;

            // 🔥 [Fix] 健壮的日期解析 (Robust Date Parsing)
            // 避免 new Date("2023-10-10T10:00") 在某些浏览器解析为 UTC 或失败
            try {
                if (!b.appointmentDate || !b.appointmentTime) continue;

                const [year, month, day] = b.appointmentDate.split('-').map(Number);
                const [hour, minute] = b.appointmentTime.split(':').map(Number);

                // 本地时间构造 (Month is 0-indexed)
                const apptTime = new Date(year, month - 1, day, hour, minute, 0);

                // 计算差异 (分钟)
                // Past = Positive (Now > Appt), Future = Negative (Now < Appt)
                // wait... (now - apptTime)
                // if now=10:00, appt=10:10. diff = -10 min. (Future)
                // if now=10:15, appt=10:00. diff = +15 min. (Past/Late)
                const diffMinutes = (now - apptTime) / 1000 / 60;

                // Debug log (只在接近时间点时打印，避免刷屏)
                if (Math.abs(diffMinutes) < 60) {
                    // console.log(`🔍 检查预约 [${b.customerName}]: 时间=${b.appointmentTime}, 差距=${diffMinutes.toFixed(1)}分`);
                }

                // 1. ⏰ 提前 10 分钟 (-10 到 -8 之间)
                if (diffMinutes >= -10 && diffMinutes < -8 && !b.reminded10m) {
                    addNoti(b.customerName, '⏰ 预约提醒', `亲，您的预约将在 10 分钟后开始，请准备。`, `bk_${b.id}_remind10_cust`);
                    addNoti('admin', '⏰ 接待提醒', `顾客 ${b.customerName} 将在 10 分钟后到达。`, `bk_${b.id}_remind10_admin`);
                    b.reminded10m = true;
                    hasChanges = true;
                    console.log(`✅ 标记 10分钟提醒: ${b.customerName}`);
                }

                // 2. 🐢 迟到 15 分钟 (15 到 17 之间)
                if (diffMinutes >= 15 && diffMinutes < 17 && !b.markedLate15m) {
                    addNoti(b.customerName, '🐢 迟到提醒', `您已迟到 15 分钟，请尽快到达以免被取消。`, `bk_${b.id}_late15_cust`);
                    addNoti('admin', '🐢 顾客迟到', `${b.customerName} 已迟到 15 分钟 (自动标记)。`, `bk_${b.id}_late15_admin`);
                    b.markedLate15m = true;
                    if (!b.delayMinutes) b.delayMinutes = 15;
                    hasChanges = true;
                    console.log(`✅ 标记 15分钟迟到: ${b.customerName}`);
                }

                // 3. 💀 严重超时 30 分钟 (30 到 32 之间)
                if (diffMinutes >= 30 && diffMinutes < 32 && !b.markedSevere30m) {
                    addNoti(b.customerName, '🚫 预约已取消', `因迟到超过 30 分钟，系统已自动取消您的预约。`, `bk_${b.id}_cancel30_cust`);
                    addNoti('admin', '🚫 自动取消', `${b.customerName} 迟到超 30 分钟，系统已执行取消。`, `bk_${b.id}_cancel30_admin`);
                    b.status = 'cancelled';
                    b.cancelReason = '系统自动取消 (迟到 > 30m)';
                    b.cancelledAt = new Date().toISOString();
                    b.markedSevere30m = true;
                    hasChanges = true;
                    console.log(`✅ 执行 30分钟自动取消: ${b.customerName}`);
                }
            } catch (e) {
                console.error("❌ 自动化日期解析错误:", e);
            }
        }

        if (hasChanges || newNotifications.length > 0) {
            const otherData = freshData.filter(d => d.type !== 'booking');
            const finalData = [...otherData, ...updatedBookings, ...newNotifications];

            localStorage.setItem('gembrow_data', JSON.stringify(finalData));

            allData = finalData;
            if (currentView === 'manage' || currentView === 'mybookings') renderApp();
        }

    }, 5000); // 5秒轮询
}

// ==========================================
// 👇 [v1.3.6 Final] 系统通知检查 (正式版日志)
// ==========================================
function checkAndCreateSystemNotifications() {
    const appChangelog = [
        {
            version: "v1.3.6 (正式版)",
            date: "2026-01-07",
            title: "🤖 自动化大脑 & 体验升级",
            features: [
                "⚡️ <b>自动化提醒</b>：预约前10分钟通知，迟到15分钟标记，迟到30分钟自动取消。",
                "🛡️ <b>身份安全</b>：用户名改为昵称，手机/邮箱唯一，改名后数据自动迁移。",
                "🔔 <b>消息中心 2.0</b>：通知支持点击查看详情，且商家/顾客完全隔离。",
                "🧾 <b>完美打印</b>：修复打印偏移，支持补打历史收据，店名动态跟随设置。"
            ]
        },
        {
            version: "v1.3.6 (Beta)",
            date: "2026-01-05",
            title: "💳 收银台逻辑闭环 (Cashier Logic)",
            features: [
                "💸 <b>智能收银流程</b>：重构 TNG 支付逻辑，选择 -> 扫码 -> 确认，流程更严谨。",
                "💊 <b>后悔药 Pro</b>：撤销订单时自动回滚库存、作废旧单据、还原合并单状态。",
                "📊 <b>精准财务</b>：统计报表新增“防重算”防火墙，自动过滤无效单据。",
                "🧾 <b>单号关联</b>：修复了预约单据没有正确关联流水号的问题。"
            ]
        },
        {
            version: "v1.3.5",
            date: "2026-01-04",
            title: "🛒 零售与支付闭环 (Retail & Payment)",
            features: [
                "📱 <b>零售收银升级</b>：优化 Pad 端布局，左侧选品、右侧结算，支持分类筛选。",
                "📦 <b>真实库存扣减</b>：无论是零售还是发货，系统现在会自动扣除对应商品的库存。",
                "🖨️ <b>热敏小票</b>：新增标准的 80mm 商业收据样式，支持新窗口静默打印。",
                "📤 <b>凭证上传</b>：顾客选择转账/TNG时，可以上传支付截图供商家核销。"
            ]
        },
        {
            version: "v1.3.3",
            date: "2026-01-02",
            title: "🎨 颜值与交互进化 (UI/UX Evolution)",
            features: [
                "👤 <b>头像自定义</b>：顾客与店长均可点击头像上传个性化照片，系统自动智能压缩。",
                "📱 <b>灵动菜单</b>：全新顶部下滑式菜单，单手操作更丝滑。",
                "🧩 <b>界面修复</b>：修复 Google 翻译/WhatsApp 按钮遮挡裁剪页面的问题。"
            ]
        },
        {
            version: "v1.3.0",
            date: "2025-12-31",
            title: "🚀 智能商业版 (Smart Business)",
            features: [
                "💰 <b>智能收银台</b>：支持关联库存商品、自动扣减库存。",
                "🔗 <b>全渠道同步</b>：收银时自动合并顾客的“购物车”和“待处理订单”。"
            ]
        }
    ];

    window.appChangelog = appChangelog;

    const latestVersion = appChangelog[0];
    const notifications = getDataByType('notification');

    // 🔍 检查是否已发送 (这次我们稍微放宽条件，确保你调试时能看到)
    // 如果你想强制再看一次，可以手动把 hasNotified 设为 false
    const hasNotified = notifications.some(n =>
        n.category === 'system' &&
        n.version === latestVersion.version
    );

    // 🔥 调试模式：即使发过了，为了让你看到，我们这里暂时允许重发
    // 正式上线后把 (|| true) 去掉即可
    if (!hasNotified) {
        console.log(`🚀 推送新版本通知: ${latestVersion.version}`);

        const newNoti = {
            type: 'notification',
            category: 'system',
            subtype: 'version_update',
            id: 'sys_' + Date.now(),
            version: latestVersion.version,
            title: `🚀 系统升级: ${latestVersion.version}`,
            message: `更新内容：\n${latestVersion.features.map(f => '• ' + f.replace(/<[^>]*>/g, '')).join('\n')}`,

            targetUser: 'all', // 🔥 核心修改：发给所有人

            isRead: false,
            createdAt: new Date().toISOString()
        };

        let allData = JSON.parse(localStorage.getItem('gembrow_data') || '[]');
        allData.push(newNoti);
        localStorage.setItem('gembrow_data', JSON.stringify(allData));

        renderApp();
        showToast(`🎉 系统已更新至 ${latestVersion.version}`);
    }
}

// 3. 取消订单 (如果之前是已完成，则要把库存加回去)
// 注意：目前的 cancelOrderBtn 还是原来的逻辑，建议也换成这个
// 在 attachEventListeners 里修改 cancelOrderBtn 的逻辑
function setupOrderListeners(config) {
    document.querySelectorAll('.cancelOrderBtn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const orders = getDataByType('order');
            const o = orders.find(i => i.id === btn.dataset.id);
            if (!o) return;

            showConfirmModal(config, "确定取消这个订单吗？", async () => {
                // 如果是“已完成”的订单被取消，要把库存还回去
                if (o.status === 'completed') {
                    const products = getDataByType('product');
                    for (const item of o.items) {
                        const product = products.find(p => p.id === item.id);
                        if (product) {
                            await updateRecord(product, { stock: product.stock + item.quantity });
                        }
                    }
                    showToast('🔄 已撤销完成，库存已退回');
                }

                await updateRecord(o, { status: 'cancelled' });
                renderApp();
            });
        });
    });
}

function attachEventListeners(config, services, bookings, posts) {
    // === 0. 菜单控制 (补回) ===

    // 打开菜单 (Menu Button)
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        showMenu = true;
        renderApp();
    });

    // 关闭菜单 (Overlay) - 你的代码优化版
    document.getElementById('menuOverlay')?.addEventListener('click', (e) => {
        // 优化：只有点到半透明背景(ID匹配)时才关闭，点菜单里面的按钮不关闭
        if (e.target.id === 'menuOverlay') {
            showMenu = false;
            renderApp();
        }
    });

    // === 评价按钮监听 (新增) ===
    document.querySelectorAll('.rateServiceBtn, .rateServiceBtnCustomer').forEach(btn => {
        btn.addEventListener('click', () => {
            const bookings = getDataByType('booking');
            const booking = bookings.find(b => b.id === btn.dataset.bookingId);
            if (booking) {
                showRatingModal(config, booking);
            }
        });
    });

    // === 1. 全局导航/登录 ===
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. 清除登录缓存 (防止刷新自动登录)
            localStorage.removeItem('gembrow_session');

            // 2. 重置状态
            loggedInCustomerName = null;
            currentMode = 'login'; // 回到登录页
            showMenu = false;      // 关闭菜单

            // 3. 刷新
            renderApp();
            showToast('已退出登录');
        });
    });

    document.getElementById('myBookingsBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'mybookings';
        renderApp();
    });

    document.getElementById('homeBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        currentView = 'home';
        renderApp();
    });

    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const phone = document.getElementById('phone').value;
        if (username === ownerCredentials.username && phone === ownerCredentials.password) {
            isOwner = true;
            loggedInCustomerName = null;
            currentView = 'manage';
        } else {
            isOwner = false;
            loggedInCustomerName = username;
            let customers = getDataByType('customer_account');
            let customer = customers.find(c => c.username === username);
            if (!customer) {
                createRecord({ type: 'customer_account', username, phone, membershipLevel: 'bronze', points: 0 });
            }
            currentView = 'home';
        }
        renderApp();
    });

    document.getElementById('guestLoginBtn')?.addEventListener('click', () => {
        isOwner = false;
        loggedInCustomerName = null;
        currentView = 'home';
        renderApp();
    });

    // === 菜单导航按钮 ===
    // 业主菜单按钮
    document.getElementById('viewManage')?.addEventListener('click', () => {
        currentView = 'manage';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewStats')?.addEventListener('click', () => {
        currentView = 'stats';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewCustomers')?.addEventListener('click', () => {
        currentView = 'customers';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewSettings')?.addEventListener('click', () => {
        currentView = 'settings';
        showMenu = false;
        renderApp();
    });
    // 客户菜单按钮
    document.getElementById('viewServices')?.addEventListener('click', () => {
        currentView = 'services';
        showMenu = false;
        renderApp();
    });
    document.getElementById('viewMyBookings')?.addEventListener('click', () => {
        currentView = 'mybookings';
        showMenu = false;
        renderApp();
    });

    document.getElementById('viewHistory')?.addEventListener('click', () => {
        currentView = 'history';
        showMenu = false;
        renderApp();
    });

    document.getElementById('viewProfile')?.addEventListener('click', () => {
        currentView = 'profile';
        showMenu = false;
        renderApp();
    });

    // === 休息时间 ===
    document.getElementById('blockTimeBtn')?.addEventListener('click', () => {
        // 复用 showBookingModal，但这次是老板给自己“占位”
        // 我们传入一个特殊的 serviceName 叫 "⛔ 休息/锁定"
        // 价格 0，时长可以让老板自己填 (这里简化为默认 60分钟，老板可以在弹窗里改)
        // 更好的做法是专门写个 showBlockTimeModal，但为了省事，我们可以直接伪造一个服务

        showBlockTimeModal(config); // 👇 下面有这个新函数
    });

    // === 1. 全局导航/登录 ===
    document.getElementById('addServiceBtn')?.addEventListener('click', () => {
        showServiceModal(config);
    });

    document.querySelectorAll('.editServiceBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = services.find(i => i.id === btn.dataset.id);
            if (s) showEditServiceModal(config, s);
        });
    });

    document.querySelectorAll('.deleteServiceBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = services.find(i => i.id === btn.dataset.id);
            if (s) showConfirmModal(config, `确定删除服务 "${s.name}" 吗？`, async () => deleteRecord(s));
        });
    });

    // === 4. 商品管理 (✅ 你的按钮就是这里修好的) ===
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        // 确保 showProductModal 函数存在
        if (typeof showProductModal === 'function') {
            showProductModal(config);
        } else {
            console.error("❌ 错误：找不到 showProductModal 函数，请检查代码底部是否复制完整！");
        }
    });

    document.querySelectorAll('.editProductBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const products = getDataByType('product');
            const p = products.find(i => i.id === btn.dataset.id);
            if (p) showEditProductModal(config, p);
        });
    });

    document.querySelectorAll('.deleteProductBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const products = getDataByType('product');
            const p = products.find(i => i.id === btn.dataset.id);
            if (p) showConfirmModal(config, `确定下架商品 "${p.name}" 吗？`, async () => deleteRecord(p));
        });
    });

    // === 3.5 客户管理 ===
    // 添加客户按钮
    document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
        showAddCustomerModal(config);
    });

    // 编辑客户按钮
    document.querySelectorAll('.editCustomerBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const customers = getDataByType('customer_account');
            // 注意：这里用的是 dataset.customerId，因为 HTML 里写的是 data-customer-id
            const c = customers.find(i => i.id === btn.dataset.customerId);
            if (c) showEditCustomerModal(config, c);
        });
    });

    // 删除客户按钮
    document.querySelectorAll('.deleteCustomerBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const customers = getDataByType('customer_account');
            const customer = customers.find(c => c.id === btn.dataset.customerId);
            if (customer) showConfirmModal(config, `确定删除客户 "${customer.username}" 及其所有数据吗？`, async () => deleteRecord(customer));
        });
    });

    // === 5. 动态管理 ===
    document.getElementById('addPostBtn')?.addEventListener('click', () => {
        if (typeof showPostModal === 'function') showPostModal(config);
    });

    document.querySelectorAll('.deletePostBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = posts.find(i => i.id === btn.dataset.id);
            if (p) showConfirmModal(config, "确定删除这条动态吗？", async () => deleteRecord(p));
        });
    });

    // === 6. 订单/预约处理 ===

    // 完成预约 (改为弹出日期选择框)
    document.querySelectorAll('.completeBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookings.find(i => i.id === btn.dataset.id);
            if (b) {
                showCompleteBookingModal(config, b);
            }
        });
    });

    // 取消预约
    document.querySelectorAll('.cancelBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookings.find(i => i.id === btn.dataset.id);
            if (b) showConfirmModal(config, "确定取消此预约？", async () => updateRecord(b, {
                status: 'cancelled',
                cancelledAt: new Date().toISOString() // 👈 加上这个，后悔药才能生效！
            }));
        });
    });

    // ↩️ 恢复待办 (后悔药功能 - 升级版)
    document.querySelectorAll('.revertBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookings.find(i => i.id === btn.dataset.id);
            if (b) {
                // 👇 改为调用新的智能处理函数
                window.handleRevertBooking(config, b);
            }
        });
    });

    // 商品订单处理 (保持不变)
    document.querySelectorAll('.completeOrderBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orders = getDataByType('order');
            const o = orders.find(i => i.id === btn.dataset.id);
            if (o) showConfirmModal(config, "确认发货/完成订单？", async () => updateRecord(o, { status: 'completed' }));
        });
    });

    document.querySelectorAll('.cancelOrderBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orders = getDataByType('order');
            const o = orders.find(i => i.id === btn.dataset.id);
            if (o) showConfirmModal(config, "确定取消这个订单吗？", async () => updateRecord(o, { status: 'cancelled' }));
        });
    });

    // === 评价按钮监听 (新增) ===
    document.querySelectorAll('.rateBookingBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const bookings = getDataByType('booking'); // 重新获取最新数据
            const booking = bookings.find(b => b.id === btn.dataset.id);
            if (booking) {
                showRatingModal(config, booking);
            }
        });
    });

    // === 6. Logo 上传事件 (已升级：Logo 圆形，QR 方形) ===
    document.getElementById('logoLoginInput')?.addEventListener('change', function (e) {
        // 👇 最后一个参数 true 代表圆形
        handleFileWithCrop(e.target.files[0], 'logoLoginUrl', 'loginLogoPreviewImg', 'loginLogoPlaceholder', true);
    });

    document.getElementById('logoHeaderInput')?.addEventListener('change', function (e) {
        // 👇 最后一个参数 true 代表圆形
        handleFileWithCrop(e.target.files[0], 'logoHeaderUrl', 'headerLogoPreviewImg', 'headerLogoPlaceholder', true);
    });

    document.getElementById('tngQrInput')?.addEventListener('change', function (e) {
        // 👇 ⚠️ 二维码必须是方形 (false)，切圆了会扫不到
        handleFileWithCrop(e.target.files[0], 'tngQrUrl', 'tngQrPreview', 'tngQrPlaceholder', false);
    });

    // === 7. 设置保存 ===
    document.getElementById('discountSettingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 获取提交按钮来显示“保存中...”
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "💾 保存中...";

        try {
            // 1. 保存管理员账号
            const newAdminUser = document.getElementById('adminUsername').value.trim();
            const newAdminPass = document.getElementById('adminPassword').value.trim();

            // ... (管理员账号保存逻辑保持不变) ...
            let rawData = JSON.parse(localStorage.getItem('gembrow_data') || '[]');
            rawData = rawData.filter(item => item.type !== 'owner_credentials');
            rawData.push({
                id: Date.now().toString(),
                type: 'owner_credentials',
                username: newAdminUser,
                password: newAdminPass,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('gembrow_data', JSON.stringify(rawData));
            ownerCredentials = { username: newAdminUser, password: newAdminPass };

            // 2. 保存普通设置
            const currentSettings = getDataByType('discount_settings')[0] || {};
            const newSettings = {
                custom_terms: document.getElementById('customTerms').value,
                custom_privacy: document.getElementById('customPrivacy').value,
                custom_return: document.getElementById('customReturn').value,
                type: 'discount_settings',
                shop_name: document.getElementById('shopName').value.trim(),
                ssm_number: document.getElementById('ssmNumber').value.trim(),
                shop_address: document.getElementById('shopAddress').value.trim(),
                wa_number: document.getElementById('waNumber').value,

                // 👇👇👇 关键：确保这行存在，才能保存 TNG 图片 👇👇👇
                tng_qr_url: document.getElementById('tngQrUrl').value,

                logo_login: document.getElementById('logoLoginUrl').value || '',
                logo_header: document.getElementById('logoHeaderUrl').value || '',
                map_link: document.getElementById('mapLink').value.trim(),
                fb_link: document.getElementById('fbLink').value.trim(),
                ig_link: document.getElementById('igLink').value.trim(),
                tiktok_link: document.getElementById('tiktokLink').value.trim(),
                enable_rewards: document.getElementById('enableRewards').checked,
                enable_shop: document.getElementById('enableShop').checked,
                default_courier: document.getElementById('defaultCourier').value,
                enable_sst: document.getElementById('enableSST').checked,
                sst_rate: parseInt(document.getElementById('sstRate').value) || 6,
                sst_id: document.getElementById('sstID').value.trim(),
                show_sst_on_receipt: document.getElementById('showSSTOnReceipt').checked,
                bronze_points: parseInt(document.getElementById('bronzePoints').value) || 0,
                bronze_discount: parseInt(document.getElementById('bronzeDiscount').value) || 0,
                silver_points: parseInt(document.getElementById('silverPoints').value) || 100,
                silver_discount: parseInt(document.getElementById('silverDiscount').value) || 5,
                gold_points: parseInt(document.getElementById('goldPoints').value) || 300,
                gold_discount: parseInt(document.getElementById('goldDiscount').value) || 10,
                platinum_points: parseInt(document.getElementById('platinumPoints').value) || 600,
                platinum_discount: parseInt(document.getElementById('platinumDiscount').value) || 15,
                points_to_rm_rate: parseInt(document.getElementById('pointsToRmRate').value) || 10
            };

            if (currentSettings.id) {
                await updateRecord(currentSettings, newSettings);
            } else {
                await createRecord(newSettings);
            }

            showToast('✅ 设置已保存！');
            allData = loadDb();
            renderApp();
            if (typeof initGlobalWidgets === 'function') initGlobalWidgets();

        } catch (error) {
            showToast('❌ 保存失败：' + error.message);
            console.error(error);
        } finally {
            submitBtn.innerText = originalText;
        }
    });

    // === 8. 顾客功能 ===
    document.querySelectorAll('.bookServiceBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!loggedInCustomerName) {
                showToast('请先登录后预约');
                return;
            }
            showBookingModal(config, btn.dataset.serviceId, btn.dataset.serviceName, parseFloat(btn.dataset.servicePrice));
        });
    });

    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof addToCart === 'function') addToCart(btn.dataset.id);
        });
    });

    document.getElementById('cartFab')?.addEventListener('click', () => {
        if (typeof showCartModal === 'function') showCartModal(config);
    });

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const products = getDataByType('product');
            const p = products.find(i => i.id === card.dataset.id);
            if (p && typeof showProductDetailModal === 'function') showProductDetailModal(config, p);
        });
    });

    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderApp();
    });

    // 编辑个人资料
    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        console.log('Edit profile button clicked');
        const customer = getDataByType('customer_account').find(acc => acc.username === loggedInCustomerName);
        console.log('Customer found:', customer);
        if (customer) {
            showEditProfileModal(config, customer);
        }
    });

    // === 11. 底部条款监听 (新增) ===
    document.querySelectorAll('.footer-policy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showPolicyModal(config, btn.dataset.type);
        });
    });
}