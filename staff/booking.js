// Customer 启动逻辑
document.addEventListener('DOMContentLoaded', async () => {
    await window.initAppCore();

    const session = JSON.parse(sessionStorage.getItem('gembrow_session') || '{}');
    // 允许游客访问，但要记录登录状态
    if (session.mode === 'customer') {
        window.loggedInCustomerName = session.username;
    }

    window.currentMode = 'customer';
    renderCustomerApp();
});

function renderCustomerApp() {
    window.allData = window.loadDb();
    const config = window.elementSdk.config;
    const services = window.getDataByType('service');
    const bookings = window.getDataByType('booking');
    const posts = window.getDataByType('post');

    document.getElementById('app').innerHTML = window.renderCustomerView(config, services, bookings, posts);

    // 绑定事件 (attachEventListeners 里的顾客部分)
}

function renderCustomerView(config, services, bookings, posts) {
    if (currentView === 'mybookings' && loggedInCustomerName) {
        return renderMyBookings(config, bookings);
    } else if (currentView === 'myorders' && loggedInCustomerName) {
        return renderMyOrdersPage(config); // 👇 新增这个页面函数
    } else if (currentView === 'history' && loggedInCustomerName) { // ✅ 新增这行
        return renderHistoryPage(config);
    } else if (currentView === 'profile' && loggedInCustomerName) {
        return renderProfile(config, bookings);
    }

    const customerAccount = loggedInCustomerName ?
        getDataByType('customer_account').find(acc => acc.username === loggedInCustomerName) : null;
    const memberDiscount = customerAccount ? getMembershipDiscount(customerAccount.membershipLevel) : 0;
    const products = getDataByType('product');

    const settings = getDiscountSettings();
    const isShopEnabled = settings.enable_shop !== false;

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return `
        <div>
            ${customerAccount && memberDiscount > 0 ? `
                <div class="mb-8 text-center p-6" style="background: linear-gradient(135deg, ${config.primary_action_color}22 0%, ${config.secondary_action_color}22 100%); border-radius: 16px; border: 2px solid ${config.primary_action_color};">
                    <p style="font-family: Lato, sans-serif; font-size: ${config.font_size * 1.2}px; color: ${config.text_color}; font-weight: 600;">
                        🎉 您的${getMembershipBadge(customerAccount.membershipLevel, config)}享受 <span style="color: ${config.primary_action_color}; font-size: ${config.font_size * 1.4}px;">${memberDiscount * 100}%折扣</span> 优惠！
                    </p>
                </div>
            ` : ''}
            
            <h2 class="mb-8 text-center" style="font-size: ${config.font_size * 2}px; font-weight: 700; background: linear-gradient(135deg, ${config.primary_action_color} 0%, ${config.secondary_action_color} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                我们的服务
            </h2>
            
            ${services.length === 0 ? `
                <div class="text-center py-16" style="background: rgba(255, 255, 255, 0.95); border-radius: 16px;">
                    <div style="font-size: 60px;">💅</div>
                    <p style="font-family: Lato, sans-serif; opacity: 0.6;">精彩服务即将推出</p>
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    ${services.map(service => {
        const rating = getServiceRating(service.id);
        const ratingCount = getDataByType('rating').filter(r => r.serviceId === service.id).length;
        const originalPrice = service.price;
        const discountedPrice = memberDiscount > 0 ? (originalPrice * (1 - memberDiscount)).toFixed(2) : null;
        const displayImage = service.imageUrl || './assets/default_eye.png';

        return `
                            <div class="service-card group" style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <div style="height: 240px; overflow: hidden;">
                                    <img src="${displayImage}" 
                                         class="transition-transform duration-500 group-hover:scale-110"
                                         style="width: 100%; height: 100%; object-fit: cover;" 
                                         onerror="this.src='./assets/default_eye.png'">
                                </div>
                                <div class="p-6 relative bg-white">
                                    <div class="flex justify-between items-start mb-2">
                                        <h3 style="font-size: ${config.font_size * 1.4}px; font-weight: 700; color: ${config.primary_action_color};">
                                            ${service.name}
                                        </h3>
                                        ${rating > 0 ? `
                                            <div class="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                                                <span class="text-yellow-500 font-bold mr-1">★ ${rating}</span>
                                                <span class="text-xs text-gray-400">(${ratingCount})</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <p class="mb-4 line-clamp-2" style="opacity: 0.8; height: 3em;">${service.description}</p>
                                    
                                    <div class="flex items-center justify-between mb-6">
                                        <p style="font-size: ${config.font_size * 1.5}px; color: ${config.primary_action_color}; font-weight: 700;">
                                            ${discountedPrice ? `<span style="text-decoration: line-through; opacity: 0.5; font-size: ${config.font_size}px; color: ${config.text_color};">RM${originalPrice}</span> RM${discountedPrice}` : `RM${originalPrice}`}
                                        </p>
                                        ${service.duration > 0 ? `<span style="background: ${config.primary_action_color}11; color: ${config.primary_action_color}; padding: 4px 10px; border-radius: 20px;">⏱️ ${service.duration}分</span>` : ''}
                                    </div>
                                    <button class="bookServiceBtn btn-primary w-full py-3 rounded-lg" data-service-id="${service.id}" data-service-name="${service.name}" data-service-price="${discountedPrice || originalPrice}" style="background: ${config.primary_action_color}; color: #ffffff;">立即预约 ✨</button>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            `}
            
            ${products.length > 0 ? `
                <h2 class="mb-8 text-center" style="font-size: ${config.font_size * 2}px; font-weight: 700; background: linear-gradient(135deg, ${config.primary_action_color} 0%, ${config.secondary_action_color} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    好物推荐
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
                    ${products.map(product => {
        const displayImage = product.imageUrl || './assets/default_eye.png';
        return `
                            <div class="product-card group" data-id="${product.id}" style="background: rgba(255, 255, 255, 0.95); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer;">
                                <div style="height: 180px; overflow: hidden; background: #f9fafb;"> 
                                    <img src="${displayImage}" 
                                         class="transition-transform duration-500 group-hover:scale-110"
                                         style="width: 100%; height: 100%; object-fit: contain;" 
                                         onerror="this.src='./assets/default_eye.png'">
                                </div>
                                <div class="p-4 relative bg-white">
                                    <h3 class="mb-1" style="font-size: ${config.font_size * 1.1}px; font-weight: 700; color: ${config.text_color}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${product.name}
                                    </h3>
                                    <p class="mb-3" style="font-size: ${config.font_size * 1.2}px; color: ${config.primary_action_color}; font-weight: 700;">
                                        RM${product.price}
                                    </p>
                                    
                                    ${isShopEnabled ? `
                                        <button class="addToCartBtn w-full py-2 rounded-lg" 
                                            data-id="${product.id}"
                                            style="background: ${config.secondary_action_color}; color: #ffffff; font-family: Lato, sans-serif; font-size: ${config.font_size * 0.9}px;">
                                            加入购物车 🛒
                                        </button>
                                    ` : `
                                        <div style="text-align: center; color: ${config.secondary_action_color}; font-size: 12px; opacity: 0.7;">
                                            查看详情 >
                                        </div>
                                    `}
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            ` : ''}

            <h2 class="mt-8 mb-8 text-center" style="font-size: ${config.font_size * 2}px; font-weight: 700; background: linear-gradient(135deg, ${config.primary_action_color} 0%, ${config.secondary_action_color} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                ${config.posts_title}
            </h2>
            
            ${posts.length === 0 ? `
                        <div class="text-center py-16" style="background: rgba(255, 255, 255, 0.95); border-radius: 16px;">
                            <div style="font-size: 60px;">✨</div>
                            <p style="font-family: Lato, sans-serif; font-size: ${config.font_size * 1.1}px; color: ${config.text_color}; opacity: 0.6;">
                                暂无动态分享
                            </p>
                        </div>
                    ` : `
                        <div class="space-y-8">
                            ${posts.slice().reverse().map(post => `
                                <div style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                    ${post.imageUrl ? `
                                        <div style="width: 100%;">
                                            <img src="${post.imageUrl}" style="width: 100%; height: auto; display: block;" onerror="this.style.display='none'">
                                        </div>
                                    ` : ''}
                                    <div class="p-8">
                                        <h3 class="mb-4" style="font-size: ${config.font_size * 1.6}px; font-weight: 700; color: ${config.primary_action_color};">
                                            ${post.postTitle}
                                        </h3>
                                        <p class="mb-4" style="font-family: Lato, sans-serif; font-size: ${config.font_size * 1.05}px; color: ${config.text_color}; opacity: 0.8; line-height: 1.8; white-space: pre-wrap;">${post.postContent}</p>
                                        <p style="font-family: Lato, sans-serif; font-size: ${config.font_size * 0.85}px; color: ${config.text_color}; opacity: 0.5;">
                                            ${new Date(post.createdAt).toLocaleString('zh-CN')}
                                        </p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
            
            ${isShopEnabled ? `
                <div id="cartFab" class="fixed bottom-8 right-6 z-40 cursor-pointer shadow-lg hover:scale-110 transition-transform"
                    style="background: ${config.secondary_action_color}; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #fff;">
                    <span style="font-size: 24px;">🛒</span>
                    ${cartCount > 0 ? `
                        <div style="position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid #fff;">
                            ${cartCount}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

// ==========================================
// 👇 [v1.3.6 Beta] 顾客待办 (支持延迟/服务中显示)
// ==========================================
function renderMyBookings(config, bookings) {
    // 1. 数据准备 (包含 pending 和 serving)
    const myPendingBookings = bookings.filter(b =>
        b.customerName === loggedInCustomerName &&
        (b.status === 'pending' || b.status === 'serving')
    ).sort((a, b) => {
        // 正在服务的排最前
        if (a.status === 'serving' && b.status !== 'serving') return -1;
        if (a.status !== 'serving' && b.status === 'serving') return 1;
        return new Date(a.appointmentDate + 'T' + a.appointmentTime) - new Date(b.appointmentDate + 'T' + b.appointmentTime);
    });

    const allOrders = getDataByType('order');
    const myPendingOrders = allOrders.filter(o =>
        o.customerName === loggedInCustomerName &&
        (o.status === 'pending' || o.status === 'pending_payment' || o.status === 'paid_verify')
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 2. 初始化 Tab
    window.pendingTab = window.pendingTab || 'booking';

    return `
        <div class="max-w-md mx-auto animate-fade-in pb-20">
            <h2 class="text-2xl font-bold mb-4 text-center" style="color: ${config.primary_action_color};">
                ⏳ 我的待办事项
            </h2>

            <div class="flex border-b border-gray-200 mb-6">
                <button onclick="window.pendingTab='booking'; renderApp()" 
                    class="flex-1 pb-3 font-bold transition-colors ${window.pendingTab === 'booking' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-400'}">
                    预约服务 ${myPendingBookings.length > 0 ? `(${myPendingBookings.length})` : ''}
                </button>
                <button onclick="window.pendingTab='order'; renderApp()" 
                    class="flex-1 pb-3 font-bold transition-colors ${window.pendingTab === 'order' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-400'}">
                    商品订单 ${myPendingOrders.length > 0 ? `(${myPendingOrders.length})` : ''}
                </button>
            </div>

            <div class="min-h-[300px]">
                
                <div style="display: ${window.pendingTab === 'booking' ? 'block' : 'none'};">
                    ${myPendingBookings.length === 0 ? `
                        <div class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 opacity-60">
                            <span class="text-4xl">📅</span>
                            <p class="text-sm text-gray-500 mt-2">没有等待中的预约</p>
                            <button onclick="document.getElementById('viewServices').click()" class="text-pink-500 text-xs font-bold mt-2 hover:underline">去预约 &rarr;</button>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${myPendingBookings.map(booking => {
        const isServing = booking.status === 'serving';
        const delay = booking.delayMinutes || 0;

        return `
                                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group 
                                    ${isServing ? 'ring-2 ring-green-500 ring-offset-1' : ''}">
                                    
                                    <div class="absolute left-0 top-0 bottom-0 w-1 ${isServing ? 'bg-green-500' : 'bg-yellow-400'}"></div>
                                    
                                    <div class="flex justify-between items-start mb-2 pl-2">
                                        <h4 class="font-bold text-gray-800">${booking.serviceName}</h4>
                                        <span class="text-xs px-2 py-1 rounded-full font-bold ${isServing ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-yellow-100 text-yellow-700'}">
                                            ${isServing ? '💇‍♀️ 正在服务中' : '⏳ 等待到店'}
                                        </span>
                                    </div>
                                    
                                    <div class="pl-2">
                                        <p class="text-gray-600 text-sm mb-1">
                                            📅 ${booking.appointmentDate} 
                                        </p>
                                        <div class="flex items-center gap-2 mb-3">
                                            <span class="font-bold text-gray-800 text-lg">${booking.appointmentTime}</span>
                                            ${delay > 0 ? `
                                                <span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold border border-red-200 flex items-center gap-1">
                                                    ⏳ 延迟 +${delay}分
                                                </span>
                                            ` : ''}
                                        </div>

                                        ${delay > 0 ? `<p class="text-[10px] text-red-400 mb-2">* 店铺当前繁忙，您的预约时间已顺延，请留意。</p>` : ''}

                                        <div class="flex justify-between items-center border-t border-gray-100 pt-3">
                                            <span class="font-bold text-pink-600">RM${booking.totalAmount || booking.servicePrice}</span>
                                            
                                            ${!isServing ? `
                                                <button class="cancelBookingBtn px-3 py-1 rounded-lg text-xs border border-red-200 text-red-500 hover:bg-red-50 font-bold" data-id="${booking.id}">
                                                    取消预约
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
    }).join('')}
                        </div>
                    `}
                </div>

                <div style="display: ${window.pendingTab === 'order' ? 'block' : 'none'};">
                    ${myPendingOrders.length === 0 ? `
                        <div class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 opacity-60">
                            <span class="text-4xl">📦</span>
                            <p class="text-sm text-gray-500 mt-2">没有处理中的订单</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${myPendingOrders.map(order => `
                                <div class="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-400 relative overflow-hidden">
                                    <div class="flex justify-between items-start mb-3">
                                        <span class="text-xs text-gray-400">
                                            ${new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                        ${order.status === 'pending_payment' ? `<span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-bold">待支付</span>` :
            order.paymentStatus === 'paid_verify' ? `<span class="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-bold">审核中</span>` :
                `<span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600 font-bold">待发货</span>`
        }
                                    </div>

                                    <div class="bg-gray-50 p-3 rounded-lg mb-3">
                                        ${order.items.map(item => `
                                            <div class="flex justify-between text-sm mb-1">
                                                <span class="text-gray-700">${item.name} x${item.quantity}</span>
                                            </div>
                                        `).join('')}
                                        <div class="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-800">
                                            <span>总计</span>
                                            <span class="text-blue-600">RM${order.totalAmount}</span>
                                        </div>
                                    </div>

                                    <div class="text-right flex justify-end gap-2">
                                         ${order.status === 'pending_payment' ?
            `<button onclick="window.showUploadProofModal(getDataByType('order').find(o => o.id === '${order.id}'))" class="px-3 py-1 rounded-lg text-xs bg-pink-500 text-white font-bold shadow-sm">去支付</button>` : ''}
                                         
                                         <button class="cancelOrderBtn px-3 py-1 rounded-lg text-xs border border-red-200 text-red-500 hover:bg-red-50 font-bold" data-id="${order.id}">
                                            取消订单
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

            </div>
        </div>
    `;
}

// ==========================================
// 👇 [v1.3.6] 顾客专属：我的物流与订单页
// ==========================================
function renderMyOrdersPage(config) {
    const allOrders = getDataByType('order');
    // 过滤出当前用户的订单，且必须是包含商品 (items) 的订单
    const myOrders = allOrders.filter(o =>
        o.customerName === loggedInCustomerName &&
        o.items && o.items.some(i => i.type === 'product')
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // 最新在最前

    return `
        <div class="animate-fade-in pb-24 max-w-lg mx-auto">
            <h2 class="text-2xl font-bold mb-6 text-center" style="color: ${config.primary_action_color};">
                📦 我的商品订单
            </h2>

            ${myOrders.length === 0 ? `
                <div class="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <span class="text-4xl">🛒</span>
                    <p class="mt-4 text-gray-500 font-bold">暂无购买记录</p>
                    <button onclick="currentView='services'; renderApp()" class="mt-2 text-pink-500 hover:underline">去逛逛</button>
                </div>
            ` : `
                <div class="space-y-6">
                    ${myOrders.map(order => {
        // 状态翻译
        let statusBadge = '';
        let actionsHtml = '';

        if (order.status === 'pending_payment') {
            statusBadge = `<span class="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">💳 待支付</span>`;
            actionsHtml = `
                                <button onclick="window.showUploadProofModal(getDataByType('order').find(o => o.id === '${order.id}'))" 
                                    class="w-full bg-pink-500 text-white py-2 rounded-lg text-xs font-bold shadow-md hover:bg-pink-600 mt-3">
                                    📤 上传付款凭证 (Pay Now)
                                </button>
                                <button class="w-full mt-2 text-gray-400 text-xs hover:text-red-500" onclick="alert('取消订单功能开发中...')">取消订单</button>
                            `;
        }
        // 🆕 已提交凭证，待商家确认
        else if (order.paymentStatus === 'paid_verify') {
            statusBadge = `<span class="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">🕵️ 待商家核实</span>`;
            actionsHtml = `
                                <div class="mt-2 p-2 bg-orange-50 rounded border border-orange-100 text-xs text-orange-700">
                                    <p><strong>流水号:</strong> ${order.proofRef || '-'}</p>
                                    <p>您的付款正在审核中，请耐心等待。</p>
                                </div>
                            `;
        }
        // 📅 待处理
        if (order.status === 'pending') {
            statusBadge = `<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">⏳ 等待商家发货</span>`;
            actionsHtml = `<p class="text-xs text-gray-400 mt-2">商家正在配货中...</p>`;
        }
        // 🚚 已发货 / 已完成 (但顾客还没确认收货)
        else if (order.status === 'completed' && !order.customerReceived) {
            statusBadge = `<span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">🚚 商家已发货</span>`;
            actionsHtml = `
                                <div class="flex gap-2 mt-3">
                                    <button onclick="window.confirmOrderReceived('${order.id}')" class="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold shadow-md hover:bg-green-600">
                                        ✅ 我已收到货
                                    </button>
                                    <button onclick="window.requestOrderRefund('${order.id}')" class="flex-1 border border-red-200 text-red-500 py-2 rounded-lg text-xs font-bold hover:bg-red-50">
                                        💸 申请退款/售后
                                    </button>
                                </div>
                            `;
        }
        // ✅ 交易成功 (双向确认)
        else if (order.status === 'completed' && order.customerReceived) {
            statusBadge = `<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">🌟 交易成功</span>`;
            actionsHtml = `<p class="text-xs text-green-600 mt-2 font-bold">感谢您的购买！</p>`;
        }
        // 💸 退款中
        else if (order.status === 'refund_requested') {
            statusBadge = `<span class="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">⚠️ 退款申请中</span>`;
            actionsHtml = `<p class="text-xs text-red-400 mt-2">请等待商家联系您处理售后。</p>`;
        }
        else if (order.status === 'cancelled') {
            statusBadge = `<span class="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">🚫 已取消</span>`;
        }

        // 物流信息
        const trackingInfo = order.trackingNumber
            ? `<div class="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex justify-between items-center">
                                 <span>🚚 物流单号: <strong class="select-all font-mono text-sm">${order.trackingNumber}</strong></span>
                                 <button onclick="navigator.clipboard.writeText('${order.trackingNumber}'); showToast('已复制单号')" class="text-blue-400 hover:text-blue-600">📋</button>
                               </div>`
            : '';

        return `
                            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                                <div class="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                                    <div class="text-xs text-gray-400">
                                        <p>单号: ${order.receiptNumber || '-'}</p>
                                        <p>${new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                    ${statusBadge}
                                </div>

                                <div class="space-y-2 mb-3">
                                    ${order.items.map(item => `
                                        <div class="flex justify-between text-sm">
                                            <span class="text-gray-700 font-bold">${item.name} <span class="text-gray-400 text-xs">x${item.quantity}</span></span>
                                            <span class="text-gray-900 font-mono">RM${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                                    <span class="text-xs font-bold text-gray-500">支付方式: ${order.paymentMethod || '-'}</span>
                                    <span class="text-lg font-bold" style="color: ${config.primary_action_color};">RM${order.totalAmount}</span>
                                </div>

                                ${trackingInfo}
                                ${actionsHtml}
                            </div>
                        `;
    }).join('')}
                </div>
            `}
        </div>
    `;
}

// ==========================================
// 👇 [v1.3.6] 个人档案 (支持点击头像上传)
// ==========================================
function renderProfile(config, bookings) {
    const customerAccount = getDataByType('customer_account').find(acc => acc.username === loggedInCustomerName);
    if (!customerAccount) return '';

    const currentAvatar = customerAccount.avatar || customerAccount.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedInCustomerName)}&background=random&color=fff&size=150`;

    return `
        <div class="space-y-6 max-w-md mx-auto pb-20">
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div class="relative group cursor-pointer" onclick="document.getElementById('avatarInput').click()">
                    <img src="${currentAvatar}" 
                         class="w-28 h-28 rounded-full border-4 border-pink-50 shadow-md object-cover group-hover:opacity-80 transition-opacity">
                    <div class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-white text-2xl">📷</span>
                    </div>
                    <input type="file" id="avatarInput" accept="image/*" class="hidden" onchange="window.handleAvatarUpload(this)">
                </div>
                
                <h2 class="mt-4 text-2xl font-bold text-gray-800">${loggedInCustomerName}</h2>
                <p class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full mt-2">点击头像更换照片</p>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 class="font-bold text-gray-800 border-b pb-2 mb-4">基本资料</h3>
                
                <div class="flex justify-between items-center py-2 border-b border-gray-50">
                    <span class="text-gray-500 text-sm">手机号</span>
                    <span class="font-mono font-bold text-gray-700">${customerAccount.phone || '未绑定'}</span>
                </div>
                
                <div class="flex justify-between items-center py-2 border-b border-gray-50">
                    <span class="text-gray-500 text-sm">电子邮箱</span>
                    <span class="text-gray-700 text-sm">${customerAccount.email || '-'}</span>
                </div>

                <div class="py-2 border-b border-gray-50">
                    <div class="flex justify-between items-start">
                        <span class="text-gray-500 text-sm shrink-0">收货地址</span>
                        <span class="text-gray-700 text-sm text-right max-w-[200px] break-words">${customerAccount.address || '<span class="text-gray-300">未填写</span>'}</span>
                    </div>
                </div>

                <div class="flex justify-between items-center py-2 border-b border-gray-50">
                    <span class="text-gray-500 text-sm">注册时间</span>
                    <span class="font-mono text-gray-700 text-sm">${customerAccount.createdAt ? new Date(customerAccount.createdAt).toLocaleDateString() : '-'}</span>
                </div>
                
                ${getDiscountSettings().enable_membership ? `
                    <div class="flex justify-between items-center py-2">
                        <span class="text-gray-500 text-sm">会员等级</span>
                        <div>${getMembershipBadge(customerAccount.membershipLevel, config)}</div>
                    </div>
                ` : ''}

                <div class="pt-4">
                     <button id="editProfileBtn" class="w-full py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow font-bold text-white"
                         style="background: ${config.primary_action_color};">
                         ✏️ 编辑详细资料
                     </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 👇 预约弹窗
// ==========================================
function showBookingModal(config, serviceId, serviceName, servicePrice) {
    const customerAccount = loggedInCustomerName ?
        getDataByType('customer_account').find(acc => acc.username === loggedInCustomerName) : null;
    const prefillPhone = customerAccount ? (customerAccount.phone || '') : '';
    const availablePoints = customerAccount ? customerAccount.points : 0;
    const settings = getDiscountSettings();
    const pointsToRmRate = settings.points_to_rm_rate || 10;
    const showRewards = settings.enable_rewards !== false;

    // 获取服务详情
    const service = getDataByType('service').find(s => s.id === serviceId);
    const duration = service ? (service.duration || 60) : 60;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.95); padding: 24px; border-radius: 16px; max-width: 500px; width: 100%; border: 3px solid ${config.primary_action_color}; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-height: 85vh; overflow-y: auto;">
            <h3 class="mb-2 text-center" style="font-size: ${config.font_size * 1.5}px; font-weight: 700; color: ${config.primary_action_color};">
                预约 ${serviceName}
            </h3>
            <p class="text-center text-xs text-gray-400 mb-6">预计时长: ${duration} 分钟</p>
        
            <form id="bookingForm">
                <div class="mb-4">
                    <label class="block mb-1 font-bold text-sm">姓名</label>
                    <input type="text" id="customerName" required value="${loggedInCustomerName || ''}"
                        class="w-full px-4 py-3 rounded-lg border-2" style="border-color: ${config.text_color}33;">
                </div>
            
                <div class="mb-4">
                    <label class="block mb-1 font-bold text-sm">电话</label>
                    <input type="tel" id="customerPhone" required value="${prefillPhone}"
                        class="w-full px-4 py-3 rounded-lg border-2" style="border-color: ${config.text_color}33;">
                </div>
            
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block mb-1 font-bold text-sm">日期</label>
                        <input type="date" id="appointmentDate" required min="${new Date().toISOString().split('T')[0]}"
                            class="w-full px-3 py-3 rounded-lg border-2" style="border-color: ${config.text_color}33;">
                    </div>
                    <div>
                        <label class="block mb-1 font-bold text-sm">时间</label>
                        <input type="time" id="appointmentTime" required
                            class="w-full px-3 py-3 rounded-lg border-2" style="border-color: ${config.text_color}33;">
                    </div>
                </div>
            
                ${customerAccount && showRewards ? `
                    <div class="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div class="flex justify-between items-center mb-2">
                            <label class="font-bold text-sm">使用积分 (可用: ${availablePoints})</label>
                            <button type="button" id="useMaxPointsBtn" 
                                style="background: ${config.secondary_action_color}; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 12px;">
                                最大
                            </button>
                        </div>
                        <input type="number" id="pointsToUse" value="0" min="0" max="${availablePoints}"
                            class="w-full px-4 py-2 rounded-lg border-2 mb-2" style="border-color: ${config.text_color}33;">
                        <p class="text-xs opacity-60 text-right">10积分 = RM1</p>
                    </div>
                    <div class="mb-6 p-4 rounded-xl" style="background: ${config.secondary_action_color}11;">
                        <div class="flex justify-between text-sm mb-1"><span>原价:</span><span>RM${servicePrice}</span></div>
                        <div class="flex justify-between text-sm mb-2 text-pink-500"><span>积分抵扣:</span><span id="pointsDiscount">-RM0.00</span></div>
                        <div class="flex justify-between font-bold border-t border-gray-300 pt-2">
                            <span>最终价格:</span>
                            <span id="finalPrice" style="color: ${config.primary_action_color};">RM${servicePrice}</span>
                        </div>
                    </div>
                ` : `<div class="mb-6"></div>`}
            
                <div class="flex gap-3 pt-2">
                    <button type="submit" class="flex-1 btn-primary py-3 rounded-lg font-bold text-white shadow-md"
                        style="background: ${config.primary_action_color};">
                        确认预约
                    </button>
                    <button type="button" id="cancelBookingBtn" class="flex-1 py-3 rounded-lg border-2 font-bold"
                        style="border-color: ${config.text_color}; color: ${config.text_color}; background: transparent;">
                        取消
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 积分逻辑
    const pointsInput = document.getElementById('pointsToUse');
    if (pointsInput) {
        pointsInput.addEventListener('input', () => {
            const pointsUsed = parseInt(pointsInput.value) || 0;
            const pointsDiscount = (pointsUsed / pointsToRmRate).toFixed(2);
            const finalPrice = Math.max(0, parseFloat(servicePrice) - parseFloat(pointsDiscount)).toFixed(2);
            document.getElementById('pointsDiscount').textContent = `-RM${pointsDiscount}`;
            document.getElementById('finalPrice').textContent = `RM${finalPrice}`;
        });
        document.getElementById('useMaxPointsBtn').addEventListener('click', () => {
            const maxPointsByPrice = Math.floor(parseFloat(servicePrice) * pointsToRmRate);
            const maxPoints = Math.min(availablePoints, maxPointsByPrice);
            pointsInput.value = maxPoints;
            pointsInput.dispatchEvent(new Event('input'));
        });
    }

    // 提交逻辑
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. 先获取基础信息
        const finalName = document.getElementById('customerName').value;
        const targetDate = document.getElementById('appointmentDate').value;
        const targetTime = document.getElementById('appointmentTime').value;

        // --- 防撞车检测 (保持你原有的逻辑，不要删) ---
        const [h, m] = targetTime.split(':').map(Number);
        const newStart = h * 60 + m;
        const newEnd = newStart + duration;
        const existingBookings = getDataByType('booking').filter(b =>
            b.appointmentDate === targetDate && b.status !== 'cancelled'
        );
        let hasConflict = false;
        for (let b of existingBookings) {
            const [bh, bm] = b.appointmentTime.split(':').map(Number);
            const existStart = bh * 60 + bm;
            const existDuration = b.duration || 60;
            const existEnd = existStart + existDuration;
            if (newStart < existEnd && newEnd > existStart) {
                hasConflict = true;
                break;
            }
        }
        if (hasConflict) {
            showToast('❌ 该时段忙碌或休息中，请换个时间');
            return;
        }
        // ------------------------------------------

        // 👇👇👇【重点】你刚才漏掉的就是这一段！👇👇👇
        // 必须先算出 finalPriceNum，下面的 createRecord 才能用它
        const pointsUsed = (customerAccount && showRewards) ? (parseInt(document.getElementById('pointsToUse')?.value) || 0) : 0;
        const basePrice = parseFloat(servicePrice); // 确保是数字
        const discountAmount = pointsUsed / pointsToRmRate;

        // 这就是 finalPriceNum 的出生地：
        const finalPriceNum = Math.max(0, basePrice - discountAmount);
        // 👆👆👆【重点结束】👆👆👆

        // 生成流水单号
        const newReceiptNo = generateReceiptNumber();

        const success = await createRecord({
            type: 'booking',
            receiptNumber: newReceiptNo,
            customerName: finalName,
            customerPhone: document.getElementById('customerPhone').value,
            serviceId: serviceId,
            serviceName: serviceName,
            appointmentDate: targetDate,
            appointmentTime: targetTime,
            duration: duration,
            status: 'pending',

            // 现在这里就不会报错了，因为上面已经定义了 finalPriceNum
            totalAmount: parseFloat(finalPriceNum.toFixed(2)),
            points_used: pointsUsed
        });

        if (success) {
            if (customerAccount && pointsUsed > 0) {
                await updateRecord(customerAccount, { points: customerAccount.points - pointsUsed });
            }

            modal.remove();

            // 呼叫粉色门票
            const newBooking = {
                id: Date.now().toString(),
                receiptNumber: newReceiptNo,
                serviceName: serviceName,
                appointmentDate: targetDate,
                appointmentTime: targetTime,
                customerName: finalName
            };

            if (typeof showTicketModal === 'function') {
                showTicketModal(config, newBooking);
            }
        }
    });

    document.getElementById('cancelBookingBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// === 评价弹窗 ===
function showRatingModal(config, booking) {
    // 1. 【核心修复】强制重新获取一次最新数据，防止缓存导致能重复评价
    const allRatings = getDataByType('rating'); // 这里的 getDataByType 会读取最新的全局变量
    const hasRated = allRatings.some(r => r.bookingId === booking.id);

    if (hasRated) {
        showToast('您已经评价过这次服务了，谢谢！');
        // 强制刷新一下页面，把那个按钮藏起来
        renderApp();
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.95); padding: 32px; border-radius: 16px; max-width: 400px; width: 100%; border: 3px solid ${config.primary_action_color}; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center;">
            <h3 class="mb-2" style="font-size: ${config.font_size * 1.5}px; font-weight: 700; color: ${config.primary_action_color};">
                服务评价
            </h3>
            <p class="mb-6 opacity-70 text-sm">为 ${booking.serviceName} 打个分吧</p>
            
            <div class="flex justify-center gap-2 mb-6" id="starContainer">
                ${[1, 2, 3, 4, 5].map(i => `
                    <span class="star-btn cursor-pointer transition-transform hover:scale-110" data-value="${i}" style="font-size: 40px; color: #e5e7eb; transition: color 0.2s;">★</span>
                `).join('')}
            </div>
            
            <div class="mb-6 text-left">
                <label class="block mb-2 text-sm font-bold text-gray-600">写点评语 (可选)</label>
                <textarea id="ratingComment" rows="3" placeholder="技术怎么样？环境舒服吗？..." 
                    class="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-pink-400" 
                    style="border-color: ${config.text_color}33; resize: none;"></textarea>
            </div>
            
            <div class="flex gap-3">
                <button id="submitRatingBtn" class="flex-1 btn-primary py-3 rounded-lg font-bold shadow-md"
                    style="background: ${config.primary_action_color}; color: #ffffff;">提交评价</button>
                <button id="cancelRatingBtn" class="flex-1 py-3 rounded-lg font-bold"
                    style="border: 2px solid ${config.text_color}; background: transparent;">取消</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 星星交互逻辑
    let currentRating = 0;
    const stars = modal.querySelectorAll('.star-btn');

    stars.forEach(star => {
        // 鼠标移入预览
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach((s, i) => {
                s.style.color = i < val ? '#fbbf24' : '#e5e7eb'; // 金色 vs 灰色
            });
        });

        // 鼠标移出恢复 (如果没有点击确认，就恢复原样)
        star.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                s.style.color = i < currentRating ? '#fbbf24' : '#e5e7eb';
            });
        });

        // 点击确认
        star.addEventListener('click', () => {
            currentRating = parseInt(star.dataset.value);
            // 点击后加个小动画
            star.style.transform = 'scale(1.4)';
            setTimeout(() => star.style.transform = 'scale(1)', 200);

            stars.forEach((s, i) => {
                s.style.color = i < currentRating ? '#fbbf24' : '#e5e7eb';
            });
        });
    });

    // 提交逻辑
    document.getElementById('submitRatingBtn').addEventListener('click', async () => {
        if (currentRating === 0) {
            showToast('请先点击星星打分哦！⭐');
            return;
        }

        const comment = document.getElementById('ratingComment').value; // 获取评语

        const success = await createRecord({
            type: 'rating',
            serviceId: booking.serviceId,
            bookingId: booking.id, // 关键：绑定订单ID，防止重复
            customerName: booking.customerName,
            rating: currentRating,
            comment: comment,
            createdAt: new Date().toISOString()
        });

        if (success) {
            showToast('评价成功！感谢您的支持 🌹');
            modal.remove();
            // 强制刷新页面，让“去评价”按钮消失，并更新首页分数
            setTimeout(() => {
                renderApp();
            }, 500); // 稍微等半秒让数据存好
        }
    });

    document.getElementById('cancelRatingBtn').addEventListener('click', () => modal.remove());

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ==========================================
// 👇 [v1.3.6 Beta] 编辑个人资料 (支持改名 + 数据迁移)
// ==========================================
function showEditProfileModal(config, customer) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm';
    const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

    modal.innerHTML = `
        <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in border-t-4" style="border-color: ${config.primary_action_color};">
            <div class="p-6 text-center border-b border-gray-100">
                <h3 class="text-xl font-bold text-gray-800">编辑个人资料</h3>
                <p class="text-xs text-gray-400 mt-1">手机与邮箱为唯一凭证</p>
            </div>
            
            <form id="editProfileForm" class="p-6 space-y-4">
                <div class="flex flex-col items-center mb-2">
                    <div class="relative group cursor-pointer" id="avatarDropZone">
                        <div class="w-24 h-24 rounded-full overflow-hidden border-4 shadow-md bg-gray-100 ring-2 ring-offset-2 ring-gray-100">
                            <img id="avatarPreview" src="${customer.avatar || customer.avatarUrl || defaultAvatar}" class="w-full h-full object-cover">
                        </div>
                        <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="text-white text-xs font-bold">📷 更换</span>
                        </div>
                    </div>
                    <input type="file" id="avatarFileInput" accept="image/*" style="display: none;">
                    <input type="hidden" id="avatarBase64" value="${customer.avatar || customer.avatarUrl || ''}">
                </div>

                <div>
                    <label class="block mb-1 text-xs font-bold text-gray-700 uppercase">用户名 (昵称)</label>
                    <input type="text" id="editProfileUsername" required value="${customer.username}"
                        class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:outline-none bg-gray-50 font-bold text-gray-800">
                    <p class="text-[10px] text-gray-400 mt-1 pl-1">修改昵称后，您的历史订单会自动关联到新名字。</p>
                </div>

                <div>
                    <label class="block mb-1 text-xs font-bold text-gray-700 uppercase">WhatsApp / 电话 (唯一)</label>
                    <div class="relative">
                        <input type="tel" id="editProfilePhone" required value="${customer.phone || ''}"
                            onchange="this.value = cleanPhoneNumber(this.value)"
                            class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none bg-green-50 font-bold text-gray-800">
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-lg">📱</span>
                    </div>
                </div>

                <div>
                    <label class="block mb-1 text-xs font-bold text-gray-700 uppercase">电子邮箱 (唯一)</label>
                    <div class="relative">
                        <input type="email" id="editProfileEmail" required value="${customer.email}"
                            class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:outline-none bg-gray-50 font-bold text-gray-800">
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-lg">📧</span>
                    </div>
                </div>

                <div>
                    <label class="block mb-1 text-xs font-bold text-gray-700 uppercase">收货地址</label>
                    <textarea id="editProfileAddress" rows="2" placeholder="请输入完整地址..."
                        class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:outline-none bg-gray-50 font-bold text-gray-800 text-sm">${customer.address || ''}</textarea>
                </div>
                
                <div>
                    <label class="block mb-1 text-xs font-bold text-gray-700 uppercase">新密码 (选填)</label>
                    <input type="password" id="editProfilePassword" placeholder="不修改请留空"
                        class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:outline-none bg-gray-50 font-bold text-gray-800">
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button type="button" id="cancelEditProfileBtn" class="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">取消</button>
                    <button type="submit" class="flex-1 py-3 rounded-xl text-white font-bold shadow-lg transform active:scale-95 transition-all"
                        style="background: ${config.primary_action_color};">保存修改</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 图片上传逻辑
    const dropZone = document.getElementById('avatarDropZone');
    const fileInput = document.getElementById('avatarFileInput');
    const preview = document.getElementById('avatarPreview');
    const hiddenInput = document.getElementById('avatarBase64');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) openCropperModal(file, (base64) => { preview.src = base64; hiddenInput.value = base64; }, true);
    });

    // 提交逻辑 (🔥 核心修改：数据搬家)
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const oldUsername = customer.username; // 记住旧名字
        const newUsername = document.getElementById('editProfileUsername').value.trim();
        const newPhone = cleanPhoneNumber(document.getElementById('editProfilePhone').value);
        const newEmail = document.getElementById('editProfileEmail').value.trim();
        const newAddress = document.getElementById('editProfileAddress').value.trim();
        const newPassword = document.getElementById('editProfilePassword').value;
        const newAvatar = document.getElementById('avatarBase64').value;

        if (!newUsername || !newEmail) return showToast('用户名和邮箱不能为空');

        const allCustomers = getDataByType('customer_account');

        // 1. 检查手机号冲突 (排除自己)
        const phoneConflict = allCustomers.find(c => c.phone === newPhone && c.id !== customer.id);
        if (phoneConflict) return showToast('❌ 该手机号已被其他账号使用');

        // 2. 检查邮箱冲突 (排除自己)
        const emailConflict = allCustomers.find(c => c.email.toLowerCase() === newEmail.toLowerCase() && c.id !== customer.id);
        if (emailConflict) return showToast('❌ 该邮箱已被其他账号使用');

        // 3. 检查用户名冲突 (虽然是昵称，为了避免混淆，最好也不要重复，或者你可以允许重复)
        const nameConflict = allCustomers.find(c => c.username.toLowerCase() === newUsername.toLowerCase() && c.id !== customer.id);
        if (nameConflict) return showToast('❌ 该昵称太受欢迎了，换一个吧');

        // ✅ 准备更新数据
        const updates = {
            username: newUsername,
            phone: newPhone,
            email: newEmail,
            address: newAddress,
            avatar: newAvatar
        };
        if (newPassword && newPassword.length >= 4) updates.password = newPassword;

        // 4. 执行更新
        await updateRecord(customer, updates);

        // 🔥 5. 关键步骤：数据大搬家 (Cascade Update)
        // 如果改了名字，必须把该用户所有的订单、预约、评价里的名字都改成新的
        if (newUsername !== oldUsername) {
            console.log(`🔄 检测到改名: ${oldUsername} -> ${newUsername}，正在迁移数据...`);

            // A. 更新预约 (Bookings)
            const bookings = getDataByType('booking').filter(b => b.customerName === oldUsername);
            for (const b of bookings) {
                await updateRecord(b, { customerName: newUsername });
            }

            // B. 更新订单 (Orders)
            const orders = getDataByType('order').filter(o => o.customerName === oldUsername);
            for (const o of orders) {
                await updateRecord(o, { customerName: newUsername });
            }

            // C. 更新评价 (Ratings)
            const ratings = getDataByType('rating').filter(r => r.username === oldUsername);
            for (const r of ratings) {
                await updateRecord(r, { username: newUsername });
            }

            // D. 更新通知 (Notifications)
            // 暂时没有绑定名字的通知逻辑，略过

            // E. 更新当前登录会话
            loggedInCustomerName = newUsername;
            // 更新 SessionStorage 防止刷新后跳回旧名字或登出
            const sessionStr = sessionStorage.getItem('gembrow_session');
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                session.username = newUsername;
                sessionStorage.setItem('gembrow_session', JSON.stringify(session));
            }

            showToast(`✅ 改名成功！已为您迁移 ${bookings.length + orders.length} 条历史记录`);
        } else {
            showToast('✅ 个人资料已更新');
        }

        modal.remove();
        renderApp();
    });

    document.getElementById('cancelEditProfileBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ==========================================
// 👇 [v1.3.5] 购物车弹窗 (升级版：含支付方式 & 单号)
// ==========================================
function showCartModal(config) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4';

    // 计算总价
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    modal.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.95); padding: 24px; border-radius: 16px; max-width: 500px; width: 100%; border: 3px solid ${config.secondary_action_color}; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
            <div class="flex justify-between items-center mb-6">
                <h3 style="font-size: ${config.font_size * 1.6}px; font-weight: 700; color: ${config.secondary_action_color};">
                    购物车 🛒
                </h3>
                <button id="closeCartBtn" style="background: none; border: none; font-size: 24px; color: ${config.text_color}; cursor: pointer;">✕</button>
            </div>
            
            ${cart.length === 0 ? `
                <div class="text-center py-8">
                    <p style="opacity: 0.6;">购物车是空的，快去选购吧！</p>
                </div>
            ` : `
                <div class="space-y-4 mb-6">
                    ${cart.map((item, index) => `
                        <div class="flex justify-between items-center p-3 rounded-lg" style="background: ${config.secondary_action_color}11;">
                            <div class="flex-1">
                                <h4 style="font-weight: 700; color: ${config.text_color};">${item.name}</h4>
                                <p style="font-size: ${config.font_size * 0.9}px; color: ${config.secondary_action_color};">
                                    RM${item.price} x ${item.quantity}
                                </p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span style="font-weight: 700;">RM${(item.price * item.quantity).toFixed(2)}</span>
                                <button class="removeFromCartBtn text-red-500" data-index="${index}" style="padding: 4px 8px;">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mb-4 pt-4 border-t border-gray-100">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-2">支付方式 (Payment Method)</label>
                    <select id="cartPaymentMethod" class="w-full p-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 focus:border-pink-500 outline-none bg-white">
                        <option value="TNG">🔵 TNG eWallet</option>
                        <option value="Bank Transfer">🏦 银行转账 (Bank Transfer)</option>
                        <option value="COD">🚚 货到付款 (COD)</option>
                        <option value="Store Pickup">🏪 到店自取 (Pay at Store)</option>
                    </select>
                </div>

                <div class="flex justify-between items-center pt-2 mb-6">
                    <span style="font-size: ${config.font_size * 1.1}px; font-weight: 700;">总计:</span>
                    <span style="font-size: ${config.font_size * 1.5}px; font-weight: 700; color: ${config.secondary_action_color};">RM${total}</span>
                </div>
                
                <button id="checkoutBtn" class="w-full btn-primary py-3 rounded-lg font-bold shadow-md"
                    style="background: ${config.secondary_action_color}; color: #ffffff; font-size: ${config.font_size * 1.1}px;">
                    提交订单 (Place Order)
                </button>
            `}
        </div>
    `;

    document.body.appendChild(modal);

    // 绑定事件
    document.getElementById('closeCartBtn').addEventListener('click', () => modal.remove());

    // 删除商品
    document.querySelectorAll('.removeFromCartBtn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.dataset.index);
            cart.splice(index, 1);

            const customers = getDataByType('customer_account');
            const me = customers.find(c => c.username === loggedInCustomerName);
            if (me) await updateRecord(me, { cart: cart });

            modal.remove();
            showCartModal(config);
            renderApp();
        });
    });

    // 结算按钮 (下单)
    document.getElementById('checkoutBtn')?.addEventListener('click', async () => {
        if (!loggedInCustomerName) {
            showToast('请先登录后再提交订单');
            return;
        }

        const payMethod = document.getElementById('cartPaymentMethod').value;
        const receiptNo = generateReceiptNumber();
        const now = new Date().toISOString();

        // 1. 如果是 COD，流程不变 (直接待发货)
        if (payMethod === 'COD' || payMethod === 'Store Pickup') {
            await createRecord({
                type: 'order',
                customerName: loggedInCustomerName,
                items: cart,
                totalAmount: total,
                paymentMethod: payMethod,
                paymentStatus: 'unpaid', // 货到才付
                receiptNumber: receiptNo,
                status: 'pending', // 待发货
                createdAt: now,
                isOnline: true
            });

            // 清空购物车
            const customers = getDataByType('customer_account');
            const me = customers.find(c => c.username === loggedInCustomerName);
            if (me) await updateRecord(me, { cart: [] });
            cart = [];

            showToast(`✅ 订单已提交！单号: ${receiptNo}`);
            modal.remove();
            renderApp();
            return;
        }

        // 2. 如果是 TNG / Bank (需要上传凭证)
        // 先生成一个 "pending_payment" 状态的订单
        await createRecord({
            type: 'order',
            customerName: loggedInCustomerName,
            items: cart,
            totalAmount: total,
            paymentMethod: payMethod, // 这里暂时存大类，后面细分
            paymentStatus: 'pending_proof', // 关键状态：待上传凭证
            receiptNumber: receiptNo,
            status: 'pending_payment', // 关键状态：待支付
            createdAt: now,
            isOnline: true
        });

        // 清空购物车
        const customers = getDataByType('customer_account');
        const me = customers.find(c => c.username === loggedInCustomerName);
        if (me) await updateRecord(me, { cart: [] });
        cart = [];

        modal.remove();

        // 3. 立即引导去上传凭证
        // 我们利用 confirm 引导用户跳转
        if (confirm(`🎉 订单已创建！单号: ${receiptNo}\n\n⚠️ 请立即支付并上传凭证以便商家接单。\n\n点击 [确定] 前往支付页面。`)) {
            currentView = 'myorders';
            renderApp();
            // 延时一点点，自动打开刚才那个单子的支付弹窗 (体验优化)
            setTimeout(() => {
                const orders = getDataByType('order');
                const justNowOrder = orders.find(o => o.receiptNumber === receiptNo);
                if (justNowOrder) window.showUploadProofModal(justNowOrder);
            }, 500);
        } else {
            renderApp();
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ==========================================
// 👇 V1.2.X 核心：顾客加购 (同步到数据库)
// ==========================================
async function addToCart(productId) {
    if (!loggedInCustomerName) {
        showToast('请先登录后再加入购物车');
        return;
    }

    const products = getDataByType('product');
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // 1. 获取当前顾客的最新数据
    const customers = getDataByType('customer_account');
    const me = customers.find(c => c.username === loggedInCustomerName);

    if (!me) return;

    // 2. 获取他现有的购物车 (如果没有就初始化为空)
    let myCart = me.cart || [];

    // 3. 检查是否已存在
    const existingItem = myCart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        myCart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            type: 'product' // 标记类型
        });
    }

    // 4. 🔥 关键：保存回数据库！这样老板那边才能看到
    await updateRecord(me, { cart: myCart });

    showToast(`🛒 已加入: ${product.name}`);

    // 更新全局变量 cart (用于UI显示小红点)
    cart = myCart;
    renderApp();
}
