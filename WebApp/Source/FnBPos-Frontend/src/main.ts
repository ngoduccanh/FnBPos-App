import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import './style.css';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { initNetworkStatusListener } from './services/useNetworkStatus';
import { registerAllPosQueueHandlers } from './services/posQueue/posQueueHandlers';
import { initQueueResumeOnOnline, resumeQueueOnStartup } from './services/posQueue/posQueueService';
import { signalRService } from './services/signalr/signalRService';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// ⚡ Khởi động hệ thống
initNetworkStatusListener();    // 1. Lắng nghe online/offline (dùng chung toàn app)
registerAllPosQueueHandlers();  // 2. Đăng ký handlers & rollback handlers
initQueueResumeOnOnline();      // 3. Queue tự resume khi mạng trở lại
resumeQueueOnStartup();         // 4. Tiếp tục job dang dở từ phiên trước
signalRService.start();         // 5. Kết nối SignalR Real-time Hubs

app.mount('#app');

