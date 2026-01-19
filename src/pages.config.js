import Analytics from './pages/Analytics';
import BrandAudit from './pages/BrandAudit';
import BrandingAssets from './pages/BrandingAssets';
import BusinessPlanGenerator from './pages/BusinessPlanGenerator';
import CRMIntegration from './pages/CRMIntegration';
import Collaboration from './pages/Collaboration';
import Dashboard from './pages/Dashboard';
import DecisionAssistant from './pages/DecisionAssistant';
import FormGenerator from './pages/FormGenerator';
import RiskAnalysis from './pages/RiskAnalysis';
import Settings from './pages/Settings';
import Stage1Oracle from './pages/Stage1Oracle';
import Stage2Architect from './pages/Stage2Architect';
import Stage3Engine from './pages/Stage3Engine';
import Stage4Quant from './pages/Stage4Quant';
import Stage5Exit from './pages/Stage5Exit';
import Support from './pages/Support';
import InvestorOutreach from './pages/InvestorOutreach';
import __Layout from './Layout.jsx';


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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};