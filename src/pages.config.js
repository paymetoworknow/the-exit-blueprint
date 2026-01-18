import Dashboard from './pages/Dashboard';
import Stage1Oracle from './pages/Stage1Oracle';
import Stage4Quant from './pages/Stage4Quant';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Stage1Oracle": Stage1Oracle,
    "Stage4Quant": Stage4Quant,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};