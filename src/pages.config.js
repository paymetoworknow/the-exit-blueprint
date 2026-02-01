import { lazy } from 'react';
import __Layout from './Layout.jsx';

// Lazy load all pages for code splitting
const Analytics = lazy(() => import('./pages/Analytics'));
const BrandAudit = lazy(() => import('./pages/BrandAudit'));
const BrandingAssets = lazy(() => import('./pages/BrandingAssets'));
const BusinessPlanGenerator = lazy(() => import('./pages/BusinessPlanGenerator'));
const CRMIntegration = lazy(() => import('./pages/CRMIntegration'));
const Collaboration = lazy(() => import('./pages/Collaboration'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DecisionAssistant = lazy(() => import('./pages/DecisionAssistant'));
const FormGenerator = lazy(() => import('./pages/FormGenerator'));
const RiskAnalysis = lazy(() => import('./pages/RiskAnalysis'));
const Settings = lazy(() => import('./pages/Settings'));
const Stage1Oracle = lazy(() => import('./pages/Stage1Oracle'));
const Stage2Architect = lazy(() => import('./pages/Stage2Architect'));
const Stage3Engine = lazy(() => import('./pages/Stage3Engine'));
const Stage4Quant = lazy(() => import('./pages/Stage4Quant'));
const Stage5Exit = lazy(() => import('./pages/Stage5Exit'));
const Support = lazy(() => import('./pages/Support'));
const InvestorOutreach = lazy(() => import('./pages/InvestorOutreach'));
const Onboarding = lazy(() => import('./pages/Onboarding'));


export const PAGES = {
    "Analytics": Analytics,
    "BrandAudit": BrandAudit,
    "BrandingAssets": BrandingAssets,
    "BusinessPlanGenerator": BusinessPlanGenerator,
    "CRMIntegration": CRMIntegration,
    "Collaboration": Collaboration,
    "Dashboard": Dashboard,
    "DecisionAssistant": DecisionAssistant,
    "FormGenerator": FormGenerator,
    "RiskAnalysis": RiskAnalysis,
    "Settings": Settings,
    "Stage1Oracle": Stage1Oracle,
    "Stage2Architect": Stage2Architect,
    "Stage3Engine": Stage3Engine,
    "Stage4Quant": Stage4Quant,
    "Stage5Exit": Stage5Exit,
    "Support": Support,
    "InvestorOutreach": InvestorOutreach,
    "Onboarding": Onboarding,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};