import Dashboard from './pages/Dashboard';
import Stage1Oracle from './pages/Stage1Oracle';
import Stage4Quant from './pages/Stage4Quant';
import Stage2Architect from './pages/Stage2Architect';
import Stage3Engine from './pages/Stage3Engine';
import Stage5Exit from './pages/Stage5Exit';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Stage1Oracle": Stage1Oracle,
    "Stage4Quant": Stage4Quant,
    "Stage2Architect": Stage2Architect,
    "Stage3Engine": Stage3Engine,
    "Stage5Exit": Stage5Exit,
    "Settings": Settings,
    "Analytics": Analytics,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};