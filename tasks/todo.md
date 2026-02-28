# Task: Refactor into Professional Portfolio

## Items
- [x] Step 1: Extract Hardcoded Features
  - [ ] Analyze `PortfolioPage.tsx`
  - [ ] Extract `BehavioralCompassCard`, `TrustVaultModal`, FinTech cards, and related state into a standalone page (e.g., `BehavioralPage.tsx`).
  - [ ] Extract the "Smart Savings Tracker" section into its own component or standalone page if needed.
  - [ ] Clean up `PortfolioPage.tsx` to an empty template for Phase 3.
  - [ ] Verify with User.
- [x] Step 2: Layout & Routing
  - [ ] Create `<PortfolioLayout />` (global Navbar and Footer, with back button for demo/lab).
  - [ ] Setup routes (`/`, `/work/ecommerce`, `/work/ecommerce/demo`, `/work/pension`, `/work/pension/demo`, `/lab/*`).
  - [ ] Verify with User.
- [x] Step 3: Portfolio Home
  - [ ] Build Hero Section.
  - [ ] Build Core Work Section with `<CaseStudyCard />` component.
  - [ ] Build Lab Section with `<LabCard />` component.
  - [ ] Verify with User.
- [x] Step 4: Case Study Template
  - [ ] Create `EcommerceCaseStudy.tsx` & `PensionCaseStudy.tsx`.
  - [ ] Implement sections: Context, Challenge, Solution, "View Live Demo" CTA.
  - [ ] Verify with User.
- [x] Step 5: Fix E-commerce Navigation Paths
  - [ ] Find and update all hardcoded `/app` prefixes to `/work/ecommerce/demo`.
  - [ ] Check `ProductCard.tsx`, `Navbar.tsx`, `AdminProductsPage.tsx`, Checkout flow.
  
## Lessons Learned
(To be updated)
