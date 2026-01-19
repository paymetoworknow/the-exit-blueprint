import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Stage1Oracle from './pages/Stage1Oracle';
import Stage2Architect from './pages/Stage2Architect';
import Stage3Engine from './pages/Stage3Engine';
import Stage4Quant from './pages/Stage4Quant';
import Stage5Exit from './pages/Stage5Exit';
import RiskAnalysis from './pages/RiskAnalysis';
import Collaboration from './pages/Collaboration';
import DecisionAssistant from './pages/DecisionAssistant';
import BrandAudit from './pages/BrandAudit';
import BusinessPlanGenerator from './pages/BusinessPlanGenerator';
import FormGenerator from './pages/FormGenerator';
import Support from './pages/Support';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Dashboard": Dashboard,
    "Settings": Settings,
    "Stage1Oracle": Stage1Oracle,
    "Stage2Architect": Stage2Architect,
    "Stage3Engine": Stage3Engine,
    "Stage4Quant": Stage4Quant,
    "Stage5Exit": Stage5Exit,
    "RiskAnalysis": RiskAnalysis,
    "Collaboration": Collaboration,
    "DecisionAssistant": DecisionAssistant,
    "BrandAudit": BrandAudit,
    "BusinessPlanGenerator": BusinessPlanGenerator,
    "FormGenerator": FormGenerator,
    "Support": Support,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};