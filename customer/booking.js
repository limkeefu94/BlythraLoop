
// ==========================================
// 🛍️ Customer Module (Booking, Orders, Profile)
// ==========================================

window.initCustomerModules = function () {
    console.log("✅ Customer Modules Loaded");
};

// ==========================================
// 👇 核心渲染入口: 客户视图
// ==========================================
window.renderCustomerView = function (config, services, bookings, posts) {
    // 1. 路由判断
    if (currentView === 'mybookings' && loggedInCustomerName) {
        return renderMyBookings(config, bookings);
    } else if (currentView === 'myorders' && loggedInCustomerName) {
        return renderMyOrdersPage(config);
    } else if (currentView === 'history' && loggedInCustomerName) {
        return renderHistoryPage(config); // ✅ 新增页面
    } else if (currentView === 'profile' && loggedInCustomerName) {
        return renderProfile(config, bookings);
    }

    // 2. 准备数据
    const customerAccount = loggedInCustomerName ?
        getDataByType('customer_account').find(acc => acc.username === loggedInCustomerName) : null;
    const memberDiscount = customerAccount ? getMembershipDiscount(customerAccount.membershipLevel) : 0;
    const products = getDataByType('product');

    // 3. 构建主页 HTML
    return `
        <div>
            ${customerAccount && memberDiscount > 0 ? `
                <div class="mb-8 text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border-2 border-pink-100 animate-fade-in-up">
                    <p class="font-bold text-lg text-gray-700">
                        🎉 您的${getMembershipBadge(customerAccount.membershipLevel, config)}享受 <span class="text-pink-600 text-2xl font-black">${memberDiscount * 100}%折扣</span> 优惠！
                    </p>
                </div>
            ` : ''}
            
            <h2 class="mb-8 text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 animate-fade-in">
                我们的服务
            </h2>
            
            ${services.length === 0 ? `
                <div class="text-center py-16 bg-white/90 rounded-2xl shadow-sm">
                    <div class="text-6xl mb-4 grayscale opacity-50">💅</div>
                    <p class="text-gray-400">精彩服务即将推出</p>
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 px-2">
                    ${services.map(service => {
        const rating = getServiceRating(service.id);
        const ratingCount = getDataByType('rating').filter(r => r.serviceId === service.id).length;
        const originalPrice = service.price;
        const discountedPrice = memberDiscount > 0 ? (originalPrice * (1 - memberDiscount)).toFixed(2) : null;
        const displayImage = service.imageUrl || '../assets/default_eye.png';

        return `
                            <div class="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                                <div class="h-60 overflow-hidden relative">
                                    <img src="${displayImage}" 
                                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                         onerror="this.src='../assets/default_eye.png'">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <div class="p-6 relative">
                                    <div class="flex justify-between items-start mb-2">
                                        <h3 class="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-pink-600 transition-colors">
                                            ${service.name}
                                        </h3>
                                        ${rating > 0 ? `
                                            <div class="flex items-center bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                <span class="text-yellow-500 font-bold mr-1 text-sm">★ ${rating}</span>
                                                <span class="text-[10px] text-gray-400">(${ratingCount})</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <p class="mb-4 text-gray-500 text-sm line-clamp-2 h-10 leading-relaxed">${service.description}</p>
                                    
                                    <div class="flex items-center justify-between mb-6">
                                        <div class="flex flex-col">
                                            ${discountedPrice ? `
                                                <span class="text-xs text-gray-400 line-through">RM${originalPrice}</span>
                                                <span class="text-2xl font-bold text-pink-600">RM${discountedPrice}</span>
                                            ` : `
                                                <span class="text-2xl font-bold text-gray-800">RM${originalPrice}</span>
                                            `}
                                        </div>
                                        ${service.duration > 0 ? `
                                            <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                                                ⏱️ ${service.duration}分
                                            </span>
                                        ` : ''}
                                    </div>
                                    
                                    <button class="bookServiceBtn w-full py-3 rounded-xl font-bold text-white shadow-md transform active:scale-95 transition-all bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                                        data-service-id="${service.id}" 
                                        data-service-name="${service.name}" 
                                        data-service-price="${discountedPrice || originalPrice}">
                                        立即预约 ✨
                                    </button>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            `}
            
            ${products.length > 0 ? `
                <h2 class="mb-8 text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600 animate-slide-in-up">
                    好物推荐
                </h2>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16 px-2">
                    ${products.map(p => {
        const originalPrice = parseFloat(p.price);
        const discountedPrice = memberDiscount > 0 ? (originalPrice * (1 - memberDiscount)).toFixed(2) : originalPrice.toFixed(2);
        const displayImage = p.imageUrl || '../assets/default_eye.png';

        return `
                            <div class="product-card group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                                 data-id="${p.id}">
                                <div class="h-40 overflow-hidden relative bg-gray-50">
                                    <img src="${displayImage}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                         onerror="this.src='../assets/default_eye.png'">
                                    ${p.stock <= 0 ? `
                                        <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span class="text-white font-bold border-2 border-white px-2 py-1 rounded">SOLD OUT</span>
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="p-3">
                                    <h4 class="font-bold text-gray-800 text-sm mb-1 truncate">${p.name}</h4>
                                    <div class="flex justify-between items-center mt-2">
                                        <div class="flex flex-col">
                                            ${memberDiscount > 0 ? `<span class="text-[10px] text-gray-400 line-through">RM${originalPrice.toFixed(2)}</span>` : ''}
                                            <span class="font-bold text-pink-600">RM${discountedPrice}</span>
                                        </div>
                                        <button class="addToCartBtn w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-600 hover:text-pink-600 flex items-center justify-center transition-colors"
                                            data-id="${p.id}" ${p.stock <= 0 ? 'disabled style="opacity:0.3"' : ''}>
                                            🛒
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            ` : ''}

            ${posts.length > 0 ? `
                <h2 class="mb-6 text-center text-2xl font-bold text-gray-800">最新动态</h2>
                <div class="space-y-6 max-w-2xl mx-auto px-4 pb-12">
                     ${posts.slice().reverse().map(post => `
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h3 class="font-bold text-lg mb-2 text-gray-800">${post.postTitle}</h3>
                            <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-line">${post.postContent}</p>
                            <div class="mt-4 flex justify-between items-center text-xs text-gray-400 border-t border-gray-50 pt-3">
                                <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                                ${isOwner ? `<button class="deletePostBtn text-red-400 hover:text-red-600 font-bold" data-id="${post.id}">删除</button>` : ''}
                            </div>
                        </div>
                     `).join('')}
                </div>
            ` : ''}

            <div class="mt-12 pb-24"></div>

        </div>
    `;
};

// ==========================================
// 📅 我的预约页面
// ==========================================
window.renderMyBookings = function (config, bookings) {
    // 1. 过滤出我的预约 (Pending & Serving)
    const myPendingBookings = bookings.filter(b =>
        b.customerName === loggedInCustomerName &&
        (b.status === 'pending' || b.status === 'serving')
    ).sort((a, b) => {
        // Serving 排最前
        if (a.status === 'serving' && b.status !== 'serving') return -1;
        if (a.status !== 'serving' && b.status === 'serving') return 1;
        // 否则按时间排序
        return new Date(a.appointmentDate + 'T' + a.appointmentTime) - new Date(b.appointmentDate + 'T' + b.appointmentTime);
    });

    // 2. 过滤出我的待付款/待发货/已发货未收货订单
    const allOrders = getDataByType('order');
    const myActiveOrders = allOrders.filter(o =>
        o.customerName === loggedInCustomerName &&
        (o.status === 'pending' ||
            o.status === 'pending_payment' ||
            o.status === 'paid_verify' ||
            (o.status === 'completed' && !o.customerReceived)) && // 🔥 核心修改：已发货但未确认收货，也算进行中
        (o.items && o.items.some(i => i.type === 'product')) // 🔥 仅显示含商品的订单
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Tab 状态控制 (默认 'booking')
    window.pendingTab = window.pendingTab || 'booking';

    return `
        <div class="pb-24 px-4 max-w-lg mx-auto">
            <h2 class="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <button onclick="currentView='home'; renderApp()" class="text-gray-400 hover:text-gray-600">←</button>
                进行中
            </h2>

            <div class="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button onclick="window.pendingTab='booking'; renderApp()" 
                    class="flex-1 py-2 rounded-lg text-sm font-bold transition-all ${window.pendingTab === 'booking' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}">
                    预约服务 (${myPendingBookings.length})
                </button>
                <button onclick="window.pendingTab='order'; renderApp()" 
                    class="flex-1 py-2 rounded-lg text-sm font-bold transition-all ${window.pendingTab === 'order' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}">
                    商品订单 (${myActiveOrders.length})
                </button>
            </div>

            ${window.pendingTab === 'booking' ? `
                <div class="space-y-4 animate-fade-in-right">
                    ${myPendingBookings.length === 0 ? `
                        <div class="text-center py-12 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                            <span class="text-4xl grayscale opacity-30">📅</span>
                            <p class="text-gray-400 text-sm mt-3">暂无预约</p>
                            <button onclick="currentView='home'; renderApp()" class="mt-4 text-pink-600 font-bold text-sm">去预约 ✨</button>
                        </div>
                    ` : myPendingBookings.map(booking => {
        const delay = booking.delayMinutes || 0;
        const isServing = booking.status === 'serving';

        return `
                            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                ${isServing ? `<div class="absolute top-0 left-0 right-0 h-1 bg-green-500 animate-pulse"></div>` :
                booking.status === 'pending' ? `<div class="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>` : ''}
                                
                                <div class="flex justify-between items-start mb-3 pl-3">
                                    <div>
                                        <h3 class="font-bold text-lg text-gray-800">${booking.serviceName}</h3>
                                        <p class="text-xs text-gray-400 font-mono mt-1">NO: ${booking.receiptNumber || 'Wait for check-in'}</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="block text-2xl font-bold ${isServing ? 'text-green-600' : 'text-gray-800'}">
                                            ${booking.appointmentTime}
                                        </span>
                                        <span class="text-xs text-gray-400">${booking.appointmentDate}</span>
                                    </div>
                                </div>

                                <div class="pl-3 border-t border-gray-50 pt-3 flex justify-between items-end">
                                    <div class="flex flex-col gap-1">
                                        ${delay > 0 ? `
                                            <span class="inline-flex items-center gap-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                                                ⚠️ 预计延迟 ${delay} 分钟
                                            </span>
                                        ` : ''}
                                        <span class="text-xs ${isServing ? 'text-green-600 font-bold animate-pulse' : 'text-yellow-600'}">
                                            ${isServing ? '● 正在服务中' : '⏳ 等待服务'}
                                        </span>
                                    </div>

                                    ${!isServing ? `
                                        <button class="cancelBookingBtn text-red-400 text-xs border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                            data-id="${booking.id}">
                                            取消预约
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            ` : `
                <div class="space-y-4 animate-fade-in-left">
                    ${myActiveOrders.length === 0 ? `
                        <div class="text-center py-12 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                            <span class="text-4xl grayscale opacity-30">📦</span>
                            <p class="text-gray-400 text-sm mt-3">暂无进行中的订单</p>
                            <button onclick="currentView='home'; renderApp()" class="mt-4 text-blue-600 font-bold text-sm">去逛逛 🛍️</button>
                        </div>
                    ` : myActiveOrders.map(order => {
        // 状态显示逻辑
        let statusBadge = '';
        let actionBtn = '';

        if (order.status === 'pending_payment') {
            statusBadge = `<span class="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded">💳 待支付</span>`;
            actionBtn = `<button onclick="showUploadProofModal(elementSdk.config, getDataByType('order').find(o => o.id === '${order.id}'))" class="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow hover:bg-orange-600">去支付</button>`;
        } else if (order.status === 'paid_verify') {
            statusBadge = `<span class="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded">🕵️ 待核实</span>`;
        } else if (order.status === 'completed' && !order.customerReceived) {
            statusBadge = `<span class="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded">🚚 商家已发货</span>`;
            actionBtn = `<button onclick="confirmOrderReceived('${order.id}')" class="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow hover:bg-green-600">✅ 确认收货</button>`;
        } else {
            statusBadge = `<span class="bg-yellow-100 text-yellow-600 text-xs font-bold px-2 py-1 rounded">⏳ 待发货</span>`;
        }

        return `
                            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div class="flex justify-between items-start mb-3 pb-2 border-b border-gray-50">
                                    <div class="flex flex-col">
                                        <span class="text-xs text-gray-400 font-mono">#${order.receiptNumber || order.id.slice(-6)}</span>
                                        <span class="text-[10px] text-gray-300">${new Date(order.createdAt).toLocaleString()}</span>
                                    </div>
                                    ${statusBadge}
                                </div>
                                
                                <div class="space-y-2 mb-4">
                                    ${order.items.map(i => `
                                        <div class="flex justify-between text-sm">
                                            <span class="text-gray-700 font-medium">${i.name} <span class="text-gray-400 text-xs">x${i.quantity}</span></span>
                                            <span class="font-mono text-gray-500">RM${(i.price * i.quantity).toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="flex justify-between items-center pt-2">
                                    <span class="font-bold text-gray-800">Total: <span class="text-pink-600 text-lg">RM${parseFloat(order.totalAmount).toFixed(2)}</span></span>
                                    <div class="flex gap-2">
                                        ${order.status === 'pending' ? `<button class="cancelOrderBtn text-red-300 text-xs hover:text-red-500" data-id="${order.id}">取消</button>` : ''}
                                        ${actionBtn}
                                    </div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            `}
        </div>
    `;
};


// ==========================================
// 📦 我的订单历史页面 (My Orders Page)
// ==========================================
window.renderMyOrdersPage = function (config) {
    const allOrders = getDataByType('order');
    // 过滤出当前顾客的商品订单
    const myOrders = allOrders.filter(o =>
        o.customerName === loggedInCustomerName &&
        o.items && o.items.some(i => i.type === 'product')
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return `
        <div class="pb-24 px-4 max-w-lg mx-auto">
             <h2 class="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <button onclick="currentView='history'; renderApp()" class="text-gray-400 hover:text-gray-600">←</button>
                商品订单记录
            </h2>

            ${myOrders.length === 0 ? `
                <div class="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                    <span class="text-4xl grayscale opacity-30">📦</span>
                    <p class="text-gray-400 text-sm mt-3">您还没有买过商品哦</p>
                    <button onclick="currentView='home'; renderApp()" class="mt-4 text-pink-600 font-bold text-sm">去逛逛 🛍️</button>
                </div>
            ` : `
                <div class="space-y-4">
                    ${myOrders.map(order => {
        // 订单状态徽章
        let statusHtml = '';
        let actionHtml = '';

        switch (order.status) {
            case 'pending_payment':
                statusHtml = `<span class="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full">💳 待支付</span>`;
                actionHtml = `<button onclick="showUploadProofModal(elementSdk.config, getDataByType('order').find(o => o.id === '${order.id}'))" class="w-full py-2 bg-pink-600 text-white rounded-lg text-xs font-bold shadow hover:bg-pink-700 mb-2">上传付款凭证</button>`;
                break;
            case 'paid_verify':
                statusHtml = `<span class="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full">🕵️ 待商家核实</span>`;
                break;
            case 'pending':
                statusHtml = `<span class="bg-yellow-100 text-yellow-600 text-[10px] font-bold px-2 py-1 rounded-full">⏳ 等待商家发货</span>`;
                break;
            case 'completed':
                if (order.customerReceived) {
                    statusHtml = `<span class="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full">🌟 交易成功</span>`;
                } else {
                    statusHtml = `<span class="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-1 rounded-full">🚚 商家已发货</span>`;
                    actionHtml = `<button onclick="confirmOrderReceived('${order.id}')" class="w-full py-2 bg-green-500 text-white rounded-lg text-xs font-bold shadow hover:bg-green-600 mb-2">✅ 我已收到货</button>`;
                }
                break;
            case 'refund_requested':
                statusHtml = `<span class="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full">⚠️ 退款申请中</span>`;
                break;
            case 'refunded':
                statusHtml = `<span class="bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">💸 已退款</span>`;
                break;
            case 'cancelled':
                statusHtml = `<span class="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full">🚫 已取消</span>`;
                break;
        }

        // 只有已完成(切未确认收货) 和 已取消/退款的 不显示退款按钮，其他状态(如下单错了)理论上可以联系商家
        // 这里简化：只有 'completed' (且已收货) 或者 'pending' 状态可以申请售后? 
        // 为了逻辑简单：只有交易成功后的一段时间内可以申请售后，或者 待发货时申请退款。
        if (order.status === 'completed' && order.customerReceived && !order.refundRequested) {
            actionHtml += `<button onclick="requestOrderRefund('${order.id}')" class="w-full py-2 border border-red-200 text-red-400 rounded-lg text-xs font-bold hover:bg-red-50">💸 申请退款/售后</button>`;
        }

        return `
                            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div class="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold text-gray-800 text-sm">订单号 #${order.receiptNumber || order.id.slice(-6)}</span>
                                            ${statusHtml}
                                        </div>
                                        <p class="text-[10px] text-gray-400 mt-1">${new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div class="space-y-3 mb-4">
                                     ${order.items.map(i => `
                                        <div class="flex gap-3">
                                            <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                <img src="${i.imageUrl || './assets/default_product.png'}" class="w-full h-full object-cover">
                                            </div>
                                            <div class="flex-1">
                                                <div class="flex justify-between">
                                                    <h4 class="text-xs font-bold text-gray-700 line-clamp-2">${i.name}</h4>
                                                    <span class="text-xs font-mono text-gray-600">x${i.quantity}</span>
                                                </div>
                                                <p class="text-xs text-gray-400 mt-1">RM${parseFloat(i.price).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                <div class="flex justify-between items-center py-2 border-t border-dashed border-gray-200 mb-3">
                                    <span class="text-xs text-gray-500">支付方式: ${order.paymentMethod || 'Online Transfer'}</span>
                                    <div class="text-right">
                                        <span class="text-xs text-gray-500">实付: </span>
                                        <span class="text-base font-bold text-pink-600">RM${parseFloat(order.totalAmount).toFixed(2)}</span>
                                    </div>
                                </div>

                                ${(order.courierCompany && order.trackingNumber) ? `
                                    <div class="bg-blue-50 p-3 rounded-lg mb-4 text-xs">
                                        <p class="font-bold text-blue-700 mb-1">📦 物流信息</p>
                                        <p class="text-blue-600">公司: ${order.courierCompany}</p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span class="text-blue-600">单号: ${order.trackingNumber}</span>
                                            <button onclick="navigator.clipboard.writeText('${order.trackingNumber}'); showToast('已复制单号')" class="text-[10px] bg-white text-blue-500 px-2 py-0.5 rounded border border-blue-200">复制</button>
                                        </div>
                                    </div>
                                ` : ''}

                                ${actionHtml}
                            </div>
                        `;
    }).join('')}
                </div>
            `}
        </div>
    `;
};


// ==========================================
// 📜 历史记录页面 (History Page) - [NEW]
// ==========================================
window.renderHistoryPage = function (config) {
    const allBookings = getDataByType('booking');
    const allOrders = getDataByType('order');

    // 1. 过滤已完成或已取消的记录
    const historyBookings = allBookings.filter(b =>
        b.customerName === loggedInCustomerName &&
        (b.status === 'completed' || b.status === 'cancelled')
    ).map(b => ({ ...b, type: 'booking', date: new Date(b.completedAt || b.createdAt) }));

    const historyOrders = allOrders.filter(o =>
        o.customerName === loggedInCustomerName &&
        (o.status === 'completed' || o.status === 'cancelled' || o.status === 'refunded')
    ).map(o => ({ ...o, type: 'order', date: new Date(o.completedAt || o.createdAt) }));

    const history = [...historyBookings, ...historyOrders].sort((a, b) => b.date - a.date);

    return `
        <div class="pb-24 px-4 max-w-lg mx-auto">
            <h2 class="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <button onclick="currentView='home'; renderApp()" class="text-gray-400 hover:text-gray-600">←</button>
                消费历史
            </h2>

             <div class="bg-gray-100 p-2 rounded-xl mb-6 flex gap-2">
                 <button class="flex-1 py-2 bg-white rounded-lg shadow-sm text-center text-sm font-bold text-gray-800">全部</button>
                 <button onclick="currentView='mybookings'; window.pendingTab='order'; renderApp()" class="flex-1 py-2 text-center text-sm font-bold text-gray-400 hover:text-gray-600">进行中...</button>
             </div>

            ${history.length === 0 ? `
                <div class="text-center py-16 opacity-50">
                    <p>暂无历史记录</p>
                </div>
            ` : `
                <div class="space-y-4">
                    ${history.map(item => {
        const isBooking = item.type === 'booking';
        const statusColor = item.status === 'completed' ? 'text-green-500' : 'text-red-400';
        const statusLabel = item.status === 'completed' ? '✅ 完成' : item.status === 'cancelled' ? '🚫 取消' : '💸 退款';

        return `
                             <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:bg-gray-50 transition-colors">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${isBooking ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}">
                                        ${isBooking ? '💅' : '📦'}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-gray-800 text-sm">
                                            ${isBooking ? item.serviceName : '商品订单'}
                                        </h4>
                                        <div class="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                            <span>${item.date.toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span class="${statusColor}">${statusLabel}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="block font-bold text-gray-800">RM${parseFloat(item.totalAmount || item.servicePrice || 0).toFixed(2)}</span>
                                    ${item.receiptNumber ? `<span class="text-[10px] text-gray-400 font-mono">#${item.receiptNumber.slice(-4)}</span>` : ''}
                                </div>
                             </div>
                        `;
    }).join('')}
                </div>
            `}
        </div>
    `;
};


// ==========================================
// 👤 顾客个人档案 (Customer Profile)
// ==========================================
window.renderProfile = function (config, bookings) {
    const customerAccount = loggedInCustomerName ?
        getDataByType('customer_account').find(acc => acc.username === loggedInCustomerName) : null;

    if (!customerAccount) return `<div class="p-8 text-center">Load Error</div>`;

    const currentAvatar = customerAccount.avatar || customerAccount.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

    return `
        <div class="space-y-6 max-w-md mx-auto pb-20">
            <div class="flex items-center gap-2 mb-4">
                 <button onclick="currentView='home'; renderApp()" class="text-gray-400 hover:text-gray-600 text-xl">←</button>
                 <h2 class="text-2xl font-bold text-gray-800">个人中心</h2>
            </div>

            <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-pink-100 to-purple-100 z-0"></div>
                
                <div class="relative z-10 group cursor-pointer" onclick="document.getElementById('avatarInput').click()">
                    <img src="${currentAvatar}" 
                         class="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover group-hover:opacity-80 transition-opacity bg-white">
                    <div class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-white text-2xl">📷</span>
                    </div>
                    <input type="file" id="avatarInput" accept="image/*" class="hidden" onchange="window.handleAvatarUpload(this)">
                </div>
                
                <h2 class="mt-4 text-2xl font-bold text-gray-800 relative z-10">${loggedInCustomerName}</h2>
                
                ${getDiscountSettings().enable_membership ? `
                    <div class="mt-2 relative z-10 scale-90">
                        ${getMembershipBadge(customerAccount.membershipLevel, config)}
                    </div>
                ` : ''}

                <div class="grid grid-cols-3 gap-8 mt-8 w-full border-t border-gray-100 pt-6">
                     <div class="text-center">
                         <span class="block text-xl font-bold text-gray-800">${customerAccount.points || 0}</span>
                         <span class="text-xs text-gray-400">积分</span>
                     </div>
                     <div class="text-center border-l border-r border-gray-100">
                         <span class="block text-xl font-bold text-gray-800">${bookings.filter(b => b.customerName === loggedInCustomerName && b.status === 'completed').length}</span>
                         <span class="text-xs text-gray-400">服务次数</span>
                     </div>
                     <div class="text-center">
                         <span class="block text-xl font-bold text-gray-800">0</span>
                         <span class="text-xs text-gray-400">优惠券</span>
                     </div>
                </div>
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

                <div class="pt-4">
                     <button id="editProfileBtn" class="w-full py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow font-bold text-white bg-gray-800 hover:bg-black">
                         ✏️ 编辑详细资料
                     </button>
                </div>
            </div>

            <button class="logout-btn w-full py-4 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 font-bold transition-colors">
                退出登录
            </button>
        </div>
    `;
};

// ==========================================
// 🛒 购物车逻辑
// ==========================================
window.addToCart = function (productId) {
    const product = getDataByType('product').find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        showToast('❌ 商品已售罄');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showToast('❌ 库存不足');
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            quantity: 1,
            imageUrl: product.imageUrl, // 存图方便显示
            type: 'product'
        });
    }

    // 更新数据库里的购物车 (customer_account -> cart)
    const customers = getDataByType('customer_account');
    const me = customers.find(c => c.username === loggedInCustomerName);
    if (me) {
        updateRecord(me, { cart: cart }); // 异步更新但不await，直接刷新UI更快
    }

    showToast('🛒 已加入购物车');
    renderApp();
};

window.showCartModal = function (config) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 bg-black/50 backdrop-blur-sm';

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const settings = getDiscountSettings();

    modal.innerHTML = `
        <div class="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-slide-in-up">
            <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <h3 class="font-bold text-gray-800 text-lg">🛍️ 购物车 (${cart.reduce((s, i) => s + i.quantity, 0)})</h3>
                <button id="closeCartBtn" class="bg-gray-200 text-gray-500 w-8 h-8 rounded-full font-bold hover:bg-gray-300">✕</button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                ${cart.length === 0 ? `
                    <div class="text-center py-12 opacity-50">
                        <span class="text-4xl grayscale">🛒</span>
                        <p class="mt-2 text-sm">购物车是空的</p>
                    </div>
                ` : cart.map(item => `
                    <div class="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                             <img src="${item.imageUrl || './assets/default_product.png'}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <h4 class="font-bold text-gray-800 text-sm line-clamp-1">${item.name}</h4>
                            <p class="text-pink-600 font-bold text-sm mt-1">RM${item.price.toFixed(2)}</p>
                        </div>
                        <div class="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1">
                            <button class="cart-minus text-gray-500 hover:text-red-500 font-bold px-1" data-id="${item.id}">-</button>
                            <span class="text-sm font-bold w-4 text-center">${item.quantity}</span>
                            <button class="cart-plus text-gray-500 hover:text-green-500 font-bold px-1" data-id="${item.id}">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="p-4 border-t bg-gray-50 rounded-b-2xl">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-gray-500 text-sm">Total:</span>
                    <span class="text-2xl font-bold text-pink-600">RM${totalAmount.toFixed(2)}</span>
                </div>
                
                <button id="checkoutBtn" class="w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:opacity-90'}"
                    ${cart.length === 0 ? 'disabled' : ''}>
                    <span>💳 去结算</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 绑定加减逻辑
    modal.querySelectorAll('.cart-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = cart.findIndex(i => i.id === btn.dataset.id);
            if (idx > -1) {
                if (cart[idx].quantity > 1) {
                    cart[idx].quantity--;
                } else {
                    cart.splice(idx, 1);
                }
                updateCartDb();
                modal.remove();
                showCartModal(config); // 重新渲染极简版
                renderApp(); // 刷新主界面计数器
            }
        });
    });

    modal.querySelectorAll('.cart-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = cart.find(i => i.id === btn.dataset.id);
            const prod = getDataByType('product').find(p => p.id === btn.dataset.id);
            if (item && prod) {
                if (item.quantity < prod.stock) {
                    item.quantity++;
                    updateCartDb();
                    modal.remove();
                    showCartModal(config);
                    renderApp();
                } else {
                    showToast('❌ 库存不足');
                }
            }
        });
    });

    function updateCartDb() {
        const customers = getDataByType('customer_account');
        const me = customers.find(c => c.username === loggedInCustomerName);
        if (me) updateRecord(me, { cart: cart });
    }

    // 结算逻辑 (Updated to show Payment Modal)
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) return;
        modal.remove(); // Close cart modal
        showPaymentMethodModal(config, totalAmount);
    });

    document.getElementById('closeCartBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

// ==========================================
// 💳 支付方式选择弹窗 (Customer)
// ==========================================
function showPaymentMethodModal(config, totalAmount) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-[60] p-4 bg-black/60 backdrop-blur-sm';

    // Get Discount Settings for TNG QR
    const settings = getDiscountSettings();
    let selectedMethod = null;

    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div class="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 class="font-bold text-gray-800">选择支付方式</h3>
                <button onclick="this.closest('.modal-backdrop').remove()" class="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <div class="p-6">
                <div class="mb-6 text-center">
                    <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Amount</p>
                    <p class="text-4xl font-bold text-gray-800">RM${totalAmount.toFixed(2)}</p>
                </div>

                <div class="space-y-3 mb-6">
                    <button class="payment-option w-full p-4 rounded-xl border-2 border-gray-100 flex items-center gap-4 hover:border-blue-500 hover:bg-blue-50 transition-all group" data-method="TnG">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">🔵</div>
                        <div class="text-left flex-1">
                            <h4 class="font-bold text-gray-800 group-hover:text-blue-700">TNG eWallet</h4>
                            <p class="text-xs text-gray-400">扫码支付 / 此处上传凭证</p>
                        </div>
                        <div class="radio-indicator w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    </button>

                    <button class="payment-option w-full p-4 rounded-xl border-2 border-gray-100 flex items-center gap-4 hover:border-pink-500 hover:bg-pink-50 transition-all group" data-method="Bank Transfer">
                        <div class="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-xl">🏦</div>
                        <div class="text-left flex-1">
                            <h4 class="font-bold text-gray-800 group-hover:text-pink-700">Online Transfer</h4>
                            <p class="text-xs text-gray-400">银行转账 / 此处上传凭证</p>
                        </div>
                        <div class="radio-indicator w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    </button>
                </div>

                <!-- TNG QR Display Area (Hidden by default) -->
                ${settings.tng_qr_url ? `
                <div id="tngQrDisplay" class="hidden mb-6 text-center animate-fade-in-up">
                    <p class="text-xs text-blue-500 font-bold mb-2">请扫描下方二维码支付</p>
                    <img src="${settings.tng_qr_url}" class="w-48 h-48 object-cover rounded-xl mx-auto border-4 border-blue-100">
                    <p class="text-[10px] text-gray-400 mt-2">支付后请截图保存</p>
                </div>
                ` : ''}
                
                <!-- Bank Info Display Area (Hidden by default) -->
                 <div id="bankInfoDisplay" class="hidden mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm animate-fade-in-up">
                    <p class="font-bold text-gray-700 mb-1">Bank: <span class="font-mono">MAYBANK</span></p>
                    <p class="font-bold text-gray-700 mb-1">Acc: <span class="font-mono text-lg select-all">1234567890</span></p>
                    <p class="font-bold text-gray-700">Name: <span class="font-mono uppercase">Gem Brow Beauty</span></p>
                    <p class="text-[10px] text-gray-400 mt-2">支付后请截图保存</p>
                </div>

                <button id="confirmOrderBtn" disabled class="w-full py-3.5 rounded-xl font-bold text-white bg-gray-300 cursor-not-allowed shadow-none transition-all">
                    确认下单
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const options = modal.querySelectorAll('.payment-option');
    const confirmBtn = document.getElementById('confirmOrderBtn');
    const tngQrDisplay = document.getElementById('tngQrDisplay');
    const bankInfoDisplay = document.getElementById('bankInfoDisplay');

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            // Reset UI
            options.forEach(o => {
                o.classList.remove('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-100', 'border-pink-500', 'bg-pink-50', 'ring-pink-100');
                o.querySelector('.radio-indicator').classList.remove('bg-blue-500', 'border-blue-500', 'bg-pink-500', 'border-pink-500');
            });

            selectedMethod = opt.dataset.method;

            // Highlight selected
            if (selectedMethod === 'TnG') {
                opt.classList.add('border-blue-500', 'bg-blue-50', 'ring-2', 'ring-blue-100');
                opt.querySelector('.radio-indicator').classList.add('bg-blue-500', 'border-blue-500');
                if (tngQrDisplay) tngQrDisplay.classList.remove('hidden');
                if (bankInfoDisplay) bankInfoDisplay.classList.add('hidden');
            } else {
                opt.classList.add('border-pink-500', 'bg-pink-50', 'ring-2', 'ring-pink-100');
                opt.querySelector('.radio-indicator').classList.add('bg-pink-500', 'border-pink-500');
                if (tngQrDisplay) tngQrDisplay.classList.add('hidden');
                if (bankInfoDisplay) bankInfoDisplay.classList.remove('hidden');
            }

            confirmBtn.disabled = false;
            confirmBtn.className = 'w-full py-3.5 rounded-xl font-bold text-white bg-gray-900 shadow-lg hover:bg-black hover:scale-[1.02] transform transition-all';
        });
    });

    confirmBtn.addEventListener('click', async () => {
        if (!selectedMethod) return;

        confirmBtn.innerText = '⏳ 创建订单中...';
        confirmBtn.disabled = true;

        // 生成待支付订单
        const newOrder = {
            type: 'order',
            items: [...window.cart],
            totalAmount: totalAmount,
            customerName: loggedInCustomerName,
            status: 'pending_payment', // 待支付
            paymentMethod: selectedMethod, // Saved method
            createdAt: new Date().toISOString(),
            isRetail: false,
        };

        // 🔥 扣减库存逻辑
        const products = getDataByType('product');
        for (const item of window.cart) {
            const product = products.find(p => p.id === item.id);
            if (product) {
                const currentStock = parseInt(product.stock || 0);
                const newStock = Math.max(0, currentStock - item.quantity);
                await updateRecord(product, { stock: newStock });
            }
        }

        const result = await createRecord(newOrder);

        if (result) {
            // 清空购物车
            window.cart = [];
            const customers = getDataByType('customer_account');
            const me = customers.find(c => c.username === loggedInCustomerName);
            if (me) updateRecord(me, { cart: [] });

            modal.remove();
            showToast('✅ 订单已提交，请上传付款凭证');
            currentView = 'mybookings';
            window.pendingTab = 'order'; // 跳到订单Tab
            renderApp();

            // 自动弹出上传凭证窗口 (Delay slightly for data refresh)
            setTimeout(() => {
                const orders = getDataByType('order');
                const myNewOrder = orders.find(o => o.customerName === loggedInCustomerName && o.status === 'pending_payment' && new Date(o.createdAt).getTime() > Date.now() - 5000);
                if (myNewOrder) showUploadProofModal(config, myNewOrder);
            }, 500);
        }
    });

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}



// ==========================================
// 📅 预约弹窗 (Booking Modal)
// ==========================================
window.showBookingModal = function (config, serviceId, serviceName, servicePrice) {
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
                        <input type="date" id="appointmentDate" required min="${getLocalDateString()}"
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
                        <div class="flex gap-2 items-center">
                            <input type="number" id="pointsToUse" value="0" min="0" max="${availablePoints}"
                                class="w-full px-4 py-2 rounded-lg border-2 text-center font-bold text-purple-600">
                            <span class="text-xs text-gray-500 whitespace-nowrap">抵扣 RM <span id="pointsDeductionValue">0.00</span></span>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-2">汇率: ${pointsToRmRate} 积分 = RM 1</p>
                    </div>
                ` : ''}
            
                <div class="flex gap-3 pt-2">
                    <button type="button" id="cancelBookingBtn" class="flex-1 py-3 rounded-lg font-bold border-2 text-gray-500">
                        取消
                    </button>
                    <button type="submit" class="flex-1 py-3 rounded-lg font-bold text-white shadow-md relative overflow-hidden"
                        style="background: ${config.primary_action_color};">
                        <span class="relative z-10">确认预约</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 自动填充日期为明天(如果今天太晚) 或 今天
    // document.getElementById('appointmentDate').valueAsDate = new Date();

    // 积分抵扣逻辑
    const pointsInput = document.getElementById('pointsToUse');
    const deductionLabel = document.getElementById('pointsDeductionValue');

    if (pointsInput) {
        pointsInput.addEventListener('input', () => {
            let val = parseInt(pointsInput.value);
            if (val > availablePoints) val = availablePoints;
            if (val < 0) val = 0;
            // 实时更新显示的抵扣金额
            const ded = val / pointsToRmRate;
            deductionLabel.innerText = ded.toFixed(2);
        });

        document.getElementById('useMaxPointsBtn').addEventListener('click', () => {
            // 计算最大可抵扣 (不能超过服务价格)
            const maxDeductible = servicePrice * pointsToRmRate;
            const realMax = Math.min(availablePoints, maxDeductible); // 取较小值
            pointsInput.value = Math.floor(realMax);

            // 触发 input 事件更新显示
            pointsInput.dispatchEvent(new Event('input'));
        });
    }

    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. 获取基础数据
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        const phone = document.getElementById('customerPhone').value;
        const name = document.getElementById('customerName').value;
        const usedPoints = pointsInput ? parseInt(pointsInput.value) : 0;

        // 2. 验证重复
        const bookings = getDataByType('booking');
        const isConflict = bookings.some(b =>
            b.appointmentDate === date &&
            b.appointmentTime === time &&
            b.status !== 'cancelled'
        );

        if (isConflict) {
            showToast('⚠️ 该时间段已被预约，请换个时间');
            return;
        }

        // 3. 计算最终价格 (积分抵扣)
        const deduction = usedPoints / pointsToRmRate;
        const finalPrice = Math.max(0, servicePrice - deduction);

        // 4. 创建预约记录
        const success = await createRecord({
            type: 'booking',
            customerName: name,
            customerPhone: phone, // 未清洗，建议 cleanPhoneNumber(phone)
            serviceName: serviceName,
            servicePrice: servicePrice, // 原价
            appointmentDate: date,
            appointmentTime: time,
            status: 'pending',
            pointsUsed: usedPoints,
            deductionAmount: deduction,
            totalAmount: finalPrice, // 最终需付
            paymentMethod: null // 还没付
        });

        if (success) {
            // 5. 扣除积分
            if (usedPoints > 0 && customerAccount) {
                await updateRecord(customerAccount, {
                    points: customerAccount.points - usedPoints
                });
            }

            // 6. 自动绑定手机(如果是新填的)
            if (customerAccount && !customerAccount.phone) {
                updateRecord(customerAccount, { phone: phone });
            }

            modal.remove();
            showToast('✅ 预约成功！');

            // 7. 跳转到"我的预约"
            if (loggedInCustomerName) {
                currentView = 'mybookings';
                window.pendingTab = 'booking';
                renderApp();
            }
        }
    });

    document.getElementById('cancelBookingBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

// ==========================================
// 🛠️ Helper Functions
// ==========================================
window.generateReceiptNumber = function () {
    const date = new Date();
    const prefix = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return 'ORD-' + prefix + '-' + random;
};

window.cleanPhoneNumber = function (phone) {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
};

window.calculateMembershipLevel = function (points) {
    if (points >= 5000) return 'Diamond';
    if (points >= 2000) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'Bronze';
};

window.getMembershipBadge = function (level) {
    switch (level) {
        case 'Diamond': return '💎 Diamond';
        case 'Gold': return '🥇 Gold';
        case 'Silver': return '🥈 Silver';
        default: return '🥉 Bronze';
    }
};

window.showQrPopup = function (imageUrl) {
    if (!imageUrl) return;
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in';
    modal.onclick = () => modal.remove();

    const container = document.createElement('div');
    container.className = 'relative flex flex-col items-center';
    modal.appendChild(container);

    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'max-w-full max-h-[80vh] rounded-lg shadow-2xl animate-scale-in object-contain bg-white';
    container.appendChild(img);

    const tip = document.createElement('p');
    tip.className = 'mt-4 text-white opacity-80 text-sm font-bold bg-black/50 px-3 py-1 rounded-full';
    tip.innerText = '点击任意处关闭';
    container.appendChild(tip);

    document.body.appendChild(modal);
};

// ==========================================
// ⭐ 评价弹窗
// ==========================================
window.showRatingModal = function (config, booking) {
    const allRatings = getDataByType('rating');
    const hasRated = allRatings.some(r => r.bookingId === booking.id);

    if (hasRated) {
        showToast('您已经评价过这次服务了，谢谢！');
        renderApp();
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-4" style="border-color: ${config.primary_action_color};">
            <h3 class="mb-2 text-xl font-bold" style="color: ${config.primary_action_color};">服务评价</h3>
            <p class="mb-6 opacity-60 text-sm">为 ${booking.serviceName} 打个分吧</p>
            
            <div class="flex justify-center gap-2 mb-6">
                ${[1, 2, 3, 4, 5].map(i => `
                    <span class="star-btn cursor-pointer transition-transform hover:scale-110 text-4xl text-gray-200" data-value="${i}">★</span>
                `).join('')}
            </div>
            
            <div class="mb-6 text-left">
                <label class="block mb-2 text-xs font-bold text-gray-500 uppercase">写点评语 (可选)</label>
                <textarea id="ratingComment" rows="3" placeholder="技术怎么样？环境舒服吗？..." 
                    class="w-full px-4 py-3 rounded-xl border-2 bg-gray-50 focus:bg-white focus:border-pink-500 outline-none transition-colors"
                    style="border-color: ${config.text_color}33; resize: none;"></textarea>
            </div>
            
            <div class="flex gap-3">
                <button id="submitRatingBtn" class="flex-1 btn-primary py-3 rounded-xl font-bold text-white shadow-md"
                    style="background: ${config.primary_action_color};">提交评价</button>
                <button id="cancelRatingBtn" class="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">取消</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    let currentRating = 0;
    const stars = modal.querySelectorAll('.star-btn');

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach((s, i) => s.style.color = i < val ? '#fbbf24' : '#e5e7eb');
        });
        star.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => s.style.color = i < currentRating ? '#fbbf24' : '#e5e7eb');
        });
        star.addEventListener('click', () => {
            currentRating = parseInt(star.dataset.value);
            star.style.transform = 'scale(1.4)';
            setTimeout(() => star.style.transform = 'scale(1)', 200);
            stars.forEach((s, i) => s.style.color = i < currentRating ? '#fbbf24' : '#e5e7eb');
        });
    });

    document.getElementById('submitRatingBtn').addEventListener('click', async () => {
        if (currentRating === 0) return showToast('请先点击星星打分哦！⭐');

        const success = await createRecord({
            type: 'rating',
            serviceId: booking.serviceId,
            bookingId: booking.id,
            customerName: booking.customerName,
            rating: currentRating,
            comment: document.getElementById('ratingComment').value,
            createdAt: new Date().toISOString()
        });

        if (success) {
            showToast('评价成功！感谢您的支持 🌹');
            modal.remove();
            setTimeout(() => renderApp(), 500);
        }
    });

    document.getElementById('cancelRatingBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

// ==========================================
// ✏️ 编辑个人资料 (支持改名 + 数据迁移)
// ==========================================
window.showEditProfileModal = function (config, customer) {
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
                </div>

                <div>
                    <label class="block mb-1 text-xs font-bold text-gray-700 uppercase">WhatsApp / 电话</label>
                    <input type="tel" id="editProfilePhone" required value="${customer.phone || ''}"
                        onchange="this.value = cleanPhoneNumber(this.value)"
                        class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none bg-green-50 font-bold text-gray-800">
                </div>

                <div>
                    <label class="block mb-1 text-xs font-bold text-gray-700 uppercase">电子邮箱</label>
                    <input type="email" id="editProfileEmail" required value="${customer.email}"
                        class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-pink-500 focus:outline-none bg-gray-50 font-bold text-gray-800">
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
                    <button type="button" id="cancelEditProfileBtn" class="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">取消</button>
                    <button type="submit" class="flex-1 py-3 rounded-xl text-white font-bold shadow-lg transform active:scale-95 transition-all"
                        style="background: ${config.primary_action_color};">保存修改</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 图片上传
    const dropZone = document.getElementById('avatarDropZone');
    const fileInput = document.getElementById('avatarFileInput');
    const preview = document.getElementById('avatarPreview');
    const hiddenInput = document.getElementById('avatarBase64');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (typeof openCropperModal === 'function') {
                openCropperModal(file, (base64) => { preview.src = base64; hiddenInput.value = base64; }, true);
            } else {
                // Fallback
                const reader = new FileReader();
                reader.onload = (e) => { preview.src = e.target.result; hiddenInput.value = e.target.result; };
                reader.readAsDataURL(file);
            }
        }
    });

    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldUsername = customer.username;
        const newUsername = document.getElementById('editProfileUsername').value.trim();
        const newPhone = cleanPhoneNumber(document.getElementById('editProfilePhone').value);
        const newEmail = document.getElementById('editProfileEmail').value.trim();
        const newAddress = document.getElementById('editProfileAddress').value.trim();
        const newPassword = document.getElementById('editProfilePassword').value;
        const newAvatar = document.getElementById('avatarBase64').value;

        if (!newUsername || !newEmail) return showToast('用户名和邮箱不能为空');

        const allCustomers = getDataByType('customer_account');
        if (allCustomers.some(c => c.phone === newPhone && c.id !== customer.id)) return showToast('❌ 手机号已存在');
        if (allCustomers.some(c => c.email.toLowerCase() === newEmail.toLowerCase() && c.id !== customer.id)) return showToast('❌ 邮箱已存在');
        if (allCustomers.some(c => c.username.toLowerCase() === newUsername.toLowerCase() && c.id !== customer.id)) return showToast('❌ 昵称已存在');

        const updates = { username: newUsername, phone: newPhone, email: newEmail, address: newAddress, avatar: newAvatar };
        if (newPassword && newPassword.length >= 4) updates.password = newPassword;

        await updateRecord(customer, updates);

        // 如果改名，迁移数据
        if (newUsername !== oldUsername) {
            const bookings = getDataByType('booking').filter(b => b.customerName === oldUsername);
            for (const b of bookings) await updateRecord(b, { customerName: newUsername });

            const orders = getDataByType('order').filter(o => o.customerName === oldUsername);
            for (const o of orders) await updateRecord(o, { customerName: newUsername });

            const ratings = getDataByType('rating').filter(r => r.username === oldUsername);
            for (const r of ratings) await updateRecord(r, { username: newUsername });

            loggedInCustomerName = newUsername;
            const sessionStr = sessionStorage.getItem('gembrow_session');
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                session.username = newUsername;
                sessionStorage.setItem('gembrow_session', JSON.stringify(session));
            }
            showToast('✅ 资料已更新，历史记录已迁移');
        } else {
            showToast('✅ 资料已更新');
        }

        modal.remove();
        renderApp();
    });

    document.getElementById('cancelEditProfileBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

// ==========================================
// 📜 条款弹窗
// ==========================================
window.showPolicyModal = function (config, type) {
    const settings = getDiscountSettings();
    const defaultTexts = {
        terms: `<div class="p-4"><h3 class="font-bold">免责声明</h3><p>美睫胶水可能引起过敏，请提前告知。</p></div>`,
        privacy: `<div class="p-4"><h3 class="font-bold">隐私政策</h3><p>您的资料仅用于预约联系。</p></div>`,
        return_policy: `<div class="p-4"><h3 class="font-bold">售后服务</h3><p>服务离店后恕不退款。</p></div>`
    };

    const formatText = (text) => text ? `<div class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">${text}</div>` : null;
    const policies = {
        terms: { title: "Terms & Conditions", content: formatText(settings.custom_terms) || defaultTexts.terms },
        privacy: { title: "Privacy Policy", content: formatText(settings.custom_privacy) || defaultTexts.privacy },
        return_policy: { title: "Return Policy", content: formatText(settings.custom_return) || defaultTexts.return_policy }
    };

    const policy = policies[type];
    if (!policy) return;

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] animate-scale-in overflow-hidden border-t-4" style="border-color: ${config.primary_action_color};">
            <div class="p-5 border-b flex justify-between items-center bg-gray-50">
                <h3 class="font-bold text-lg text-gray-800">${policy.title}</h3>
                <button id="closePolicyBtn" class="text-2xl text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div class="p-6 overflow-y-auto custom-scrollbar">
                ${policy.content}
            </div>
            <div class="p-5 border-t bg-gray-50 text-center">
                <button id="okPolicyBtn" class="px-8 py-2.5 rounded-full font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-95" 
                    style="background: ${config.primary_action_color};">
                    我已阅读并同意
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const close = () => modal.remove();
    document.getElementById('closePolicyBtn').addEventListener('click', close);
    document.getElementById('okPolicyBtn').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
};

// ==========================================
// 🔍 商品详情弹窗
// ==========================================
window.showProductDetailModal = function (config, product) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-md';
    const settings = getDiscountSettings();
    const isShopEnabled = settings.enable_shop !== false;

    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full animate-scale-in">
            <div class="relative h-72">
                <img src="${product.imageUrl || './assets/default_product.png'}" class="w-full h-full object-cover">
                <button id="closeDetailBtn" class="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                    <h3 class="text-white font-bold text-2xl drop-shadow-md">${product.name}</h3>
                </div>
            </div>
            
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-2xl font-bold text-pink-600">RM${product.price}</span>
                    <span class="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded">库存: ${product.stock}</span>
                </div>
                
                <div class="mb-6 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 leading-relaxed border border-gray-100 h-32 overflow-y-auto">
                    ${product.description || '暂无描述'}
                </div>

                ${isShopEnabled ? `
                    <button id="detailAddToCartBtn" class="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                        style="background: linear-gradient(135deg, ${config.secondary_action_color}, ${config.primary_action_color});">
                        加入购物车 🛒
                    </button>
                ` : `
                    <button disabled class="w-full py-4 rounded-xl bg-gray-200 text-gray-400 font-bold cursor-not-allowed">
                        暂不支持购买
                    </button>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeDetailBtn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    if (isShopEnabled) {
        document.getElementById('detailAddToCartBtn')?.addEventListener('click', () => {
            addToCart(product.id);
            modal.remove();
        });
    }
};

// ==========================================
// 辅助函数：顾客确认收货 & 申请退款
// ==========================================
window.confirmOrderReceived = async (orderId) => {
    if (!confirm("确认您已经收到商品且无误吗？确认后将无法退款。")) return;

    const orders = getDataByType('order');
    const order = orders.find(o => o.id === orderId);
    if (order) {
        await updateRecord(order, { customerReceived: true, receivedAt: new Date().toISOString() });
        showToast('🎉 交易完成！');
        renderApp();
    }
};

window.requestOrderRefund = async (orderId) => {
    const reason = prompt("请输入退款/售后原因：");
    if (!reason) return;

    const orders = getDataByType('order');
    const order = orders.find(o => o.id === orderId);
    if (order) {
        await updateRecord(order, { status: 'refund_requested', refundReason: reason });
        showToast('✅ 申请已提交，请等待商家联系');
        renderApp();
    }
};

// ==========================================
// 🎟️ 预约凭证弹窗 (粉色门票)
// ==========================================
window.showTicketModal = function (config, booking) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop fixed inset-0 flex items-center justify-center z-[60] p-4 bg-black/60 backdrop-blur-sm';

    // 生成二维码内容
    const qrData = `BOOKING:${booking.receiptNumber}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in relative">
            <!-- 顶部装饰 -->
            <div class="h-32 bg-gradient-to-br from-pink-400 to-pink-600 relative overflow-hidden flex items-center justify-center">
                <div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjwvZz4=')]"></div>
                <div class="text-white text-center z-10">
                    <h3 class="text-2xl font-bold tracking-widest uppercase">Booking Ticket</h3>
                    <p class="text-xs opacity-80 letter-spacing-2">ADMIT ONE</p>
                </div>
            </div>

            <!-- 票据内容 -->
            <div class="p-8 relative bg-white">
                <!-- 撕票虚线效果 -->
                <div class="absolute -top-3 left-0 right-0 h-6 bg-[radial-gradient(circle,transparent_8px,white_9px)] bg-[length:24px_24px] bg-top rotate-180"></div>
                
                <div class="text-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-1">${booking.serviceName}</h2>
                    <p class="text-sm text-gray-400">Guest: ${booking.customerName}</p>
                </div>

                <div class="flex justify-between items-center mb-6 bg-pink-50 p-4 rounded-xl border border-pink-100">
                    <div class="text-center flex-1 border-r border-pink-200">
                        <p class="text-xs text-pink-400 uppercase font-bold">Date</p>
                        <p class="font-bold text-gray-800 text-lg">${booking.appointmentDate}</p>
                    </div>
                    <div class="text-center flex-1">
                        <p class="text-xs text-pink-400 uppercase font-bold">Time</p>
                        <p class="font-bold text-gray-800 text-lg">${booking.appointmentTime}</p>
                    </div>
                </div>

                <div class="flex justify-center mb-6">
                    <div class="p-2 bg-white border-2 border-gray-100 rounded-xl shadow-lg">
                        <img src="${qrUrl}" alt="QR Code" class="w-32 h-32 rounded-lg">
                    </div>
                </div>

                <p class="text-center text-xs text-gray-300 font-mono select-all">${booking.receiptNumber}</p>
            </div>

            <!-- 底部按钮 -->
            <div class="p-4 bg-gray-50 border-t flex gap-3">
                <button id="saveTicketBtn" class="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors">
                    📥 保存凭证
                </button>
                <button id="closeTicketBtn" class="py-3 px-6 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50">
                    关闭
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('saveTicketBtn').addEventListener('click', () => {
        // 使用 html2canvas 截图保存 (需确保 html2canvas 已加载)
        if (typeof html2canvas !== 'function') return showToast('截图功能未加载');

        const card = modal.querySelector('.bg-white');
        html2canvas(card, { backgroundColor: null, scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Ticket_${booking.receiptNumber}.png`;
            link.href = canvas.toDataURL();
            link.click();
            showToast('✅ 凭证已保存到相册');
        });
    });

    const close = () => modal.remove();
    document.getElementById('closeTicketBtn').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
};
