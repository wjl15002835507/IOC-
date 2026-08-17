import React, { useState } from 'react';
import { BarChart3, FileText, FolderPlus, Grid2X2, PieChart, Printer, Settings, SlidersHorizontal } from 'lucide-react';
import { staticReportMenu } from './StaticMaterialReports';

const entries = [
  { label: '我的应用', icon: Grid2X2 },
  { label: '分析看板', icon: BarChart3 },
  { label: '报表中心', icon: FileText },
  { label: '电商运营', icon: PieChart },
  { label: '配置中心', icon: Settings },
  { label: '导入导出', icon: Printer },
  { label: '导入', icon: FolderPlus },
  { label: '自定义报表配置', icon: SlidersHorizontal },
];

const flyoutEntries = new Set(['分析看板', '报表中心', '配置中心']);

export default function StaticConfigNavigation() {
  const [open, setOpen] = useState('');
  const [menuTop, setMenuTop] = useState(0);
  const navigate = (url: string) => window.location.assign(url);
  const openStaticReport = (id: string) => navigate(`/prototypes/order-track-report?report=static-${id}`);

  const panel = open === '分析看板' ? <>
    <h3>分析看板</h3>
    <div className="ioc-sidebar-menu-list"><button type="button" onClick={() => navigate('/prototypes/order-track-report?view=static-material')}>静态材料处理跟踪分析</button></div>
  </> : open === '报表中心' ? <>
    <section><h4>定制</h4><div className="ioc-sidebar-menu-list">
      <button type="button" onClick={() => navigate('/prototypes/order-track-report')}>订单跟踪报表</button>
      <button type="button" onClick={() => navigate('/prototypes/order-track-report?report=custom-sales')}>定制接单打款销售统计报表</button>
      <button type="button" onClick={() => navigate('/prototypes/order-track-report?report=material-tracking')}>材料跟踪处理报表</button>
    </div></section>
    <section><h4>静态材料分析</h4><div className="ioc-sidebar-menu-list">
      {staticReportMenu.map((item) => <button type="button" key={item.id} onClick={() => openStaticReport(item.id)}>{item.title}</button>)}
    </div></section>
  </> : open === '配置中心' ? <>
    <h3>配置中心</h3>
    <div className="ioc-sidebar-menu-list"><button type="button" className="selected">静态材料配置</button></div>
  </> : null;

  return <aside className="sidebar static-config-navigation" onMouseLeave={() => setOpen('')}>
    <div className="platform-title">IOC运营平台</div>
    <nav data-hover-navigation>{entries.map(({ label, icon: Icon }) => <button key={label} type="button" className={`nav-item ${open === label ? 'menu-active' : ''}`} onMouseEnter={(event) => {
      const sidebarTop = event.currentTarget.closest('.sidebar')?.getBoundingClientRect().top || 0;
      setMenuTop(event.currentTarget.getBoundingClientRect().top - sidebarTop);
      setOpen(flyoutEntries.has(label) ? label : '');
    }} onClick={() => !flyoutEntries.has(label) && navigate('/prototypes/order-track-report')}><Icon size={17}/><span>{label}</span></button>)}</nav>
    {panel && <div className={`ioc-sidebar-menu static-config-side-menu ${open === '报表中心' ? 'ioc-report-center-menu' : ''}`} style={{ top: menuTop }}>{panel}</div>}
  </aside>;
}
