import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Stage1Oracle from './pages/Stage1Oracle';
import Stage2Architect from './pages/Stage2Architect';
import Stage3Engine from './pages/Stage3Engine';
import Stage4Quant from './pages/Stage4Quant';
import Stage5Exit from './pages/Stage5Exit';
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};