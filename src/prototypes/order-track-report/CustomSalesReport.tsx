import React, { useState } from 'react';
import { BarChart3, Circle, FileText, FolderPlus, Grid2X2, Menu, PieChart, Printer, Settings, SlidersHorizontal, UserRound, X } from 'lucide-react';

type Props = { onBack: () => void; onOpenStatic: () => void };
type Tab = 'summary' | 'detail';

const summaryRows = [
  ['衣柜', '普定', 3212, 20, 3232, 6970, 49, 7019, 725, 9, 734, 665, 0, 665],
  ['', '轻居', 418, 0, 418, 641, 0, 641, 59, 0, 59, 89, 0, 89],
  ['', '合计', 3630, 20, 3650, 7611, 49, 7660, 784, 9, 793, 754, 0, 754],
  ['柜体', '普定', 263, 8, 271, 600, 2, 602, 57, 5, 62, 49, 0, 49],
  ['', '轻居', 40, 0, 40, 58, 0, 58, 8, 0, 8, 8, 0, 8],
  ['', '合计', 315, 8, 323, 658, 2, 660, 65, 5, 70, 57, 0, 57],
];

const detailRows = Array.from({ length: 27 }, (_, index) => {
  const code = 'EF' + (60825 + Math.floor(index / 7));
  return [code, code + String(index % 7 + 1).padStart(2, '0'), index < 11 ? '1015' : '1020', index < 11 ? '贵州区域' : '河南区域', 'S' + (101000 + index), '轻居定制区域经销商', '2026-07-28 09:' + String(32 + index).padStart(2, '0') + ':31', index % 3 === 0 ? '2026-07-28 10:20:00' : '-'];
});

export default function CustomSalesReport({ onBack, onOpenStatic }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [expanded, setExpanded] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [analysisMenuOpen, setAnalysisMenuOpen] = useState(false);
  const [sidebarMenuTop, setSidebarMenuTop] = useState(0);
  const [toast, setToast] = useState('');

  const action = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  return (
    <div className="ioc-shell custom-sales">
      <header className="topbar">
        <div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div>
        <div className="topbar-main">
          <Menu size={17} />
          <div className="breadcrumb"><span>首页</span><b>/</b><strong>定制接单打款销售统计报表</strong></div>
          <div className="user-area"><UserRound size={15} /><span>王俊励</span></div>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar" onMouseLeave={() => { setAnalysisMenuOpen(false); setReportMenuOpen(false); }}>
          <div className="platform-title">IOC运营平台</div>
          <nav>
            <button type="button" className="nav-item"><Grid2X2 size={17} />我的应用</button>
            <button type="button" className={'nav-item ' + (analysisMenuOpen ? 'menu-active' : '')} onMouseEnter={(event) => { const sidebarTop = event.currentTarget.closest('.sidebar')?.getBoundingClientRect().top || 0; setSidebarMenuTop(event.currentTarget.getBoundingClientRect().top - sidebarTop); setAnalysisMenuOpen(true); setReportMenuOpen(false); }}><BarChart3 size={17} />分析看板</button>
            <button type="button" className={'nav-item ' + (reportMenuOpen ? 'menu-active' : '')} onMouseEnter={(event) => { const sidebarTop = event.currentTarget.closest('.sidebar')?.getBoundingClientRect().top || 0; setSidebarMenuTop(event.currentTarget.getBoundingClientRect().top - sidebarTop); setReportMenuOpen(true); setAnalysisMenuOpen(false); }}><FileText size={17} />报表中心</button>
            <button type="button" className="nav-item"><PieChart size={17} />电商运营</button>
            <button type="button" className="nav-item"><Settings size={17} />配置中心</button>
            <button type="button" className="nav-item"><Printer size={17} />导入导出</button>
            <button type="button" className="nav-item"><FolderPlus size={17} />导入</button>
            <button type="button" className="nav-item"><SlidersHorizontal size={17} />自定义报表配置</button>
          </nav>
          {analysisMenuOpen && <div className="ioc-sidebar-menu" style={{ top: sidebarMenuTop }}><h3>分析看板</h3><div className="ioc-sidebar-menu-list"><button type="button" onClick={onOpenStatic}>静态材料处理跟踪分析</button></div></div>}
          {reportMenuOpen && <div className="ioc-sidebar-menu" style={{ top: sidebarMenuTop }}><h3>报表中心</h3><div className="ioc-sidebar-menu-list"><button type="button" onClick={onBack}>订单跟踪报表</button><button type="button" className="selected" onClick={() => setReportMenuOpen(false)}>定制接单打款销售统计报表</button></div></div>}
        </aside>
        <main className="main-area">
          <div className="tabbar"><div className="tab-close"><X size={18} /></div><div className="active-tab"><Circle size={8} fill="currentColor" />定制接单打款销售统计报表<X size={13} /></div></div>
          <div className="custom-body">
            <div className="custom-tabs"><button type="button" className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>汇总</button><button type="button" className={tab === 'detail' ? 'active' : ''} onClick={() => setTab('detail')}>明细</button></div>
            {tab === 'summary' ? <Summary action={action} /> : <Detail expanded={expanded} toggle={() => setExpanded(value => !value)} action={action} />}
          </div>
        </main>
      </div>
      <div className="watermark-layer" aria-hidden="true">{Array.from({ length: 96 }, (_, index) => <span key={index}>QY-00260959　王俊励　2026-07-28</span>)}</div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Actions({ action, reset = false }: { action: (message: string) => void; reset?: boolean }) {
  return <div className="custom-actions"><button type="button" onClick={() => action('查询完成')}>查询</button>{reset && <button type="button" className="secondary" onClick={() => action('已重置')}>重置</button>}<button type="button" onClick={() => action('导出成功')}>导出</button></div>;
}

function Summary({ action }: { action: (message: string) => void }) {
  return <><div className="custom-filter"><label>粒度<select defaultValue="day"><option value="day">日</option></select></label><label>时间<input value="2026-07-28" readOnly /></label><Actions action={action} /></div><div className="custom-table summary"><table><thead><tr><th rowSpan={2}>产品类型</th><th rowSpan={2}>销售类型</th><th colSpan={6}>接单量（截止07/27/24点）</th><th colSpan={6}>接单量（截止07/28/18点）</th></tr><tr>{Array.from({ length: 12 }, (_, index) => <th key={index}>{['客单单', '线上样单', '合计'][index % 3]}</th>)}</tr></thead><tbody>{summaryRows.map((row, index) => <tr key={index}>{row.map((value, cellIndex) => <td key={cellIndex} className={cellIndex > 1 && cellIndex < 8 ? 'warm' : cellIndex > 7 ? 'cool' : ''}>{value}</td>)}</tr>)}</tbody></table></div></>;
}

function Detail({ expanded, toggle, action }: { expanded: boolean; toggle: () => void; action: (message: string) => void }) {
  const fields = ['接单日期', '付款日期', '产品类型', '销售类型', '订单类型', '订单号', '柜子号', '办事处', '门店'];
  const headers = ['订单号', '柜子号', '办事处编码', '办事处名称', '经销商编码', '经销商描述', '门店编码', '门店名称', '客户姓名', '接单时间', '终止时间', '产品类型', '销售类型', '订单类型', '客户经理', '暂停时间', '恢复时间'];
  return <><div className={'custom-filter detail ' + (expanded ? 'expanded' : '')}>{fields.map((field, index) => <label key={field} className={!expanded && index > 3 ? 'hidden' : ''}>{field}{index < 5 ? <select defaultValue={index === 0 ? 'today' : 'all'}><option value="today">2026-07-28 - 2026-07-28</option><option value="all">全部</option></select> : <input placeholder="请输入" />}</label>)}<div className="detail-actions"><button type="button" className="link" onClick={toggle}>{expanded ? '收起' : '展开'}</button><Actions action={action} reset /></div></div><div className="custom-table"><table><thead><tr>{headers.map((header, index) => <th key={header} className={[6, 14, 15, 16].includes(index) ? 'is-new' : ''}>{header}</th>)}</tr></thead><tbody>{detailRows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, cellIndex) => <td key={cellIndex}>{value}</td>)}</tr>)}</tbody></table></div><footer className="custom-page">共1003条　50条/页　<b>1</b>　2　3　4　5　…　21</footer></>;
}
