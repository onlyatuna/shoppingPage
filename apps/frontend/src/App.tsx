/**
 * App.tsx - 應用程式主路由配置
 * 
 * 本檔案是整個前端應用的路由核心，負責定義所有頁面的路徑與對應的元件。
 * 應用程式採用多模組架構，包含投資組合、電商後台、診斷室、退休金計算等功能。
 */

import { Routes, Route, Navigate } from 'react-router-dom';

// ============================================================================
// 模組導入區
// ============================================================================

// === 1. 投資組合模組（Portfolio Module）===
// 路徑：src/features/portfolio/pages/PortfolioPage.tsx
// 功能：一頁式整合頁面，包含投資者行為導航儀、風險問卷、投資組合結果展示
// 特點：使用內部狀態管理（useState）切換不同視圖，不改變瀏覽器網址
import PortfolioPage from '@/features/portfolio/pages/PortfolioPage';

// === 2. 電商後台模組（E-commerce Module）===
// 路徑：src/features/ecommerce/layouts/EcommerceLayout.tsx
// 功能：完整的電商管理系統，包含商品管理、訂單處理、購物車、用戶系統等
// 特點：使用巢狀路由（/app/*），內部包含多個子路由
import EcommerceLayout from '@/features/ecommerce/layouts/EcommerceLayout';

// === 3. 診斷室模組（Diagnosis Module）===
// 路徑：src/features/portfolio/pages/DiagnosisPage.tsx
// 功能：投資者行為診斷與分析工具
import DiagnosisPage from '@/features/portfolio/pages/DiagnosisPage';

// === 4. 退休金計算模組（Pension Module）===
// 路徑：src/features/pension/pages/PensionPage.tsx
// 功能：退休金試算工具，協助用戶規劃退休財務
import PensionPage from '@/features/pension/pages/PensionPage';

// === 5. 手勢縮放模組（Hand Gesture Zoom Module）===
// 路徑：src/features/HandGestureZoom/pages/HandGesturePage.tsx
// 功能：透過相機手勢控制圖片縮放
import HandGesturePage from '@/features/HandGestureZoom/pages/HandGesturePage';

// === 6. 3D 微風模組（Breeze 3D Module）===
// 路徑：src/features/breeze3d/pages/BreezePage.tsx
// 功能：3D 視覺化微風效果展示
import BreezePage from '@/features/breeze3d/pages/BreezePage';

// ============================================================================
// 主應用元件
// ============================================================================

function App() {
    return (
        <Routes>
            {/* ================================================================
                主要功能路由
                ================================================================ */}

            {/* 
             * 首頁路由 - 投資組合一頁式整合頁面
             * 路徑：/
             * 元件：PortfolioPage
             * 說明：
             *   - 這是應用程式的主要入口頁面
             *   - 整合了投資者行為導航儀、風險問卷、投資組合結果等功能
             *   - 頁面內部使用 useState 管理視圖切換（Dashboard → Quiz → Result）
             *   - 不會改變瀏覽器網址，提供流暢的單頁體驗
             */}
            <Route path="/" element={<PortfolioPage />} />

            {/* 
             * 診斷室路由
             * 路徑：/diagnosis
             * 元件：DiagnosisPage
             * 說明：提供投資者行為診斷與分析功能
             */}
            <Route path="/diagnosis" element={<DiagnosisPage />} />

            {/* 
             * 退休金計算路由
             * 路徑：/pension
             * 元件：PensionPage
             * 說明：提供退休金試算與財務規劃工具
             */}
            <Route path="/pension" element={<PensionPage />} />

            {/* 
             * 手勢縮放路由
             * 路徑：/hand-gesture
             * 元件：HandGesturePage
             * 說明：透過相機手勢控制圖片縮放功能
             */}
            <Route path="/hand-gesture" element={<HandGesturePage />} />

            {/* 
             * 3D 微風路由
             * 路徑：/breeze
             * 元件：BreezePage
             * 說明：3D 視覺化微風效果展示頁面
             */}
            <Route path="/breeze" element={<BreezePage />} />

            {/* 
             * 電商後台路由（巢狀路由）
             * 路徑：/app/*
             * 元件：EcommerceLayout
             * 說明：
             *   - 使用萬用字元（*）表示此路徑下包含多個子路由
             *   - EcommerceLayout 內部會定義更多子路由，例如：
             *     /app/login - 登入頁面
             *     /app/cart - 購物車
             *     /app/orders - 訂單管理
             *     /app/profile - 用戶資料
             *     等等...
             */}
            <Route path="/app/*" element={<EcommerceLayout />} />

            {/* ================================================================
                舊版路徑重導向（Legacy Redirects）
                ================================================================ */}

            {/* 
             * 說明：
             *   - 為了向下相容舊版應用的連結，將舊路徑重導向至新的電商模組路徑
             *   - 使用 Navigate 元件的 replace 屬性，避免在瀏覽器歷史記錄中留下重導向前的路徑
             *   - 這樣用戶點擊「上一頁」時不會回到舊路徑
             */}

            {/* 登入頁面重導向：/login → /app/login */}
            <Route path="/login" element={<Navigate to="/app/login" replace />} />

            {/* 註冊頁面重導向：/register → /app/login */}
            <Route path="/register" element={<Navigate to="/app/login" replace />} />

            {/* 購物車頁面重導向：/cart → /app/cart */}
            <Route path="/cart" element={<Navigate to="/app/cart" replace />} />

            {/* 訂單頁面重導向：/orders → /app/orders */}
            <Route path="/orders" element={<Navigate to="/app/orders" replace />} />

            {/* 個人資料頁面重導向：/profile → /app/profile */}
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />



            {/* ================================================================
                404 錯誤處理（Catch-All Route）
                ================================================================ */}

            {/* 
             * 萬用路由 - 處理所有未定義的路徑
             * 路徑：*
             * 行為：重導向至首頁（/）
             * 說明：
             *   - 當用戶訪問不存在的路徑時，自動導向首頁
             *   - 使用 replace 避免在歷史記錄中留下錯誤路徑
             *   - 必須放在所有路由定義的最後，確保其他路由優先匹配
             */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;