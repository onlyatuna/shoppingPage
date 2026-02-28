/**
 * App.tsx - 應用程式主路由配置
 * 
 * 本檔案是整個前端應用的路由核心，負責定義所有頁面的路徑與對應的元件。
 * 應用程式採用多模組架構，包含投資組合、電商後台、診斷室、退休金計算等功能。
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// ============================================================================
// 輔助組件：保留查詢參數的重導向
// ============================================================================
const NavigateWithQuery = ({ to, replace }: { to: string, replace?: boolean }) => {
    const { search } = useLocation();
    return <Navigate to={`${to}${search}`} replace={replace} />;
};

// ============================================================================
// 模組導入區
// ============================================================================

// === 1. 投資組合與共用 Layout ===
import PortfolioLayout from '@/features/portfolio/layouts/PortfolioLayout';
import PortfolioPage from '@/features/portfolio/pages/PortfolioPage';
import LabHubPage from '@/features/portfolio/pages/LabHubPage';

// === 2. Case Studies ===
import EcommerceCaseStudy from '@/features/portfolio/pages/work/EcommerceCaseStudy';
import PensionCaseStudy from '@/features/portfolio/pages/work/PensionCaseStudy';

// === 3. 各專案 Demo / Pages ===
import EcommerceLayout from '@/features/ecommerce/layouts/EcommerceLayout';
import DiagnosisPage from '@/features/portfolio/pages/DiagnosisPage'; // 從這裡重構到 BehavioralPage? 原有還有 DiagnosisPage 也需要移轉嗎? 先保留
import BehavioralPage from '@/features/behavioral/pages/BehavioralPage';
import PensionPage from '@/features/pension/pages/PensionPage';
import HandGesturePage from '@/features/HandGestureZoom/pages/HandGesturePage';
import BreezePage from '@/features/breeze3d/pages/BreezePage';
import ArcadePage from '@/features/arcade/pages/ArcadePage';

// ============================================================================
// 主應用元件
// ============================================================================

function App() {
    return (
        <Routes>
            {/* 
              * 全局包覆 PortfolioLayout
              * Navbar 與 Footer 會自動在這些頁面顯示，包含返回按鈕（若非首頁）
              */}
            <Route element={<PortfolioLayout />}>
                {/* 1. 首頁 `/` */}
                <Route path="/" element={<PortfolioPage />} />

                {/* 2. 工作案例 (Work) */}
                <Route path="/work/ecommerce" element={<EcommerceCaseStudy />} />
                <Route path="/work/pension" element={<PensionCaseStudy />} />

                {/* 3. 實驗室集線器 (Lab) */}
                <Route path="/lab" element={<LabHubPage />} />

                {/* 4. 原有的專案展示 (轉移到 Route 之下) */}
                <Route path="/lab/pacman" element={<ArcadePage />} />
                <Route path="/lab/breeze3d" element={<BreezePage />} />
                <Route path="/lab/hand-gesture" element={<HandGesturePage />} />
                <Route path="/lab/behavioral" element={<BehavioralPage />} />
                {/* Diagnosis 保留在 /lab/diagnosis, 或原路徑，配合 BehavioralPage */}
                <Route path="/lab/diagnosis" element={<DiagnosisPage />} />
            </Route>

            {/* 
              * ========== 獨立 DEMO 路由 (不包 PortfolioLayout) ========== 
              * 針對有自己 Layout 或不需要 Portfolio Navbar (例如全螢幕電商、全螢幕 Dashboard)
              */}
            <Route path="/work/ecommerce/demo/*" element={<EcommerceLayout />} />
            <Route path="/work/pension/demo" element={<PensionPage />} />

            {/* 保留舊版捷徑供相容 */}
            <Route path="/diagnosis" element={<Navigate to="/lab/diagnosis" replace />} />
            <Route path="/pension" element={<Navigate to="/work/pension/demo" replace />} />
            <Route path="/hand-gesture" element={<Navigate to="/lab/hand-gesture" replace />} />
            <Route path="/breeze" element={<Navigate to="/lab/breeze3d" replace />} />
            <Route path="/arcade" element={<Navigate to="/lab/pacman" replace />} />


            {/* ================================================================
                電商舊版路徑重導向（Legacy Redirects）
                ================================================================ */}
            <Route path="/app/*" element={<Navigate to="/work/ecommerce/demo" replace />} />
            <Route path="/login" element={<Navigate to="/work/ecommerce/demo/login" replace />} />
            <Route path="/register" element={<Navigate to="/work/ecommerce/demo/login" replace />} />
            <Route path="/cart" element={<Navigate to="/work/ecommerce/demo/cart" replace />} />
            <Route path="/orders" element={<Navigate to="/work/ecommerce/demo/orders" replace />} />
            <Route path="/payment/callback" element={<NavigateWithQuery to="/work/ecommerce/demo/payment/callback" replace />} />
            <Route path="/profile" element={<NavigateWithQuery to="/work/ecommerce/demo/profile" replace />} />

            {/* ================================================================
                404 錯誤處理（Catch-All Route）
                ================================================================ */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;