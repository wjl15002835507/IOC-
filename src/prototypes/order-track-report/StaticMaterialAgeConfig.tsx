/**
 * @name 静态材料库龄配置
 */
import React, { useMemo, useState } from 'react';
import { BarChart3, ChevronDown, FileText, FolderPlus, Grid2X2, Pencil, PieChart, Plus, Printer, Settings, SlidersHorizontal, UserRound, X } from 'lucide-react';
import './static-material-age-config.css';

type Rule = {
  id: number;
  dev: string;
  category: string;
  baseMonths: number;
  updatedAt: string;
  updatedBy: string;
};

const devOptions = ['软体', '板木', '定制'];
const categoryOptions = ['全部', '五金', '主材', '辅料', '内外架', '铝材', '木皮', '封边带'];
const initialRules: Rule[] = [
  { id: 1, dev: '定制', category: '全部', baseMonths: 3, updatedAt: '2026-07-10 14:22', updatedBy: '王俊杰' },
  { id: 2, dev: '定制', category: '五金', baseMonths: 2, updatedAt: '2026-07-09 10:16', updatedBy: '王俊杰' },
  { id: 3, dev: '软体', category: '全部', baseMonths: 1, updatedAt: '2026-07-08 16:40', updatedBy: '李文静' },
  { id: 4, dev: '板木', category: '木皮', baseMonths: 4, updatedAt: '2026-07-07 09:35', updatedBy: '李文静' },
  { id: 5, dev: '板木', category: '全部', baseMonths: 3, updatedAt: '2026-07-07 09:32', updatedBy: '李文静' },
];

const menuItems = [
  { label: '我的应用', icon: Grid2X2 }, { label: '分析看板', icon: BarChart3 }, { label: '报表中心', icon: FileText },
  { label: '电商运营', icon: PieChart }, { label: '配置中心', icon: Settings }, { label: '导入导出', icon: Printer },
  { label: '导入', icon: FolderPlus }, { label: '自定义报表配置', icon: SlidersHorizontal },
];

const ageOf = (staleDate: string, baseMonths: number) => {
  const [year, month, day] = staleDate.split('/').map(Number);
  const start = new Date(year, month - 1, day);
  const now = new Date(2026, 6, 10);
  const elapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + (now.getDate() >= start.getDate() ? 0 : -1));
  return elapsed + baseMonths;
};

type Props = { onBack?: () => void };

export default function StaticMaterialAgeConfig({ onBack }: Props) {
  const [rules, setRules] = useState(initialRules);
  const [devFilter, setDevFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<Rule | null>(null);
  const [toast, setToast] = useState('');
  const filtered = useMemo(() => rules.filter((rule) => (!devFilter || rule.dev === devFilter) && (!categoryFilter || rule.category === categoryFilter) && (!query || `${rule.dev}${rule.category}`.includes(query))), [rules, devFilter, categoryFilter, query]);
  const openNew = () => setDialog({ id: 0, dev: devFilter || '定制', category: categoryFilter || '全部', baseMonths: 3, updatedAt: '', updatedBy: '' });
  const saveRule = () => {
    if (!dialog?.dev || !dialog.category || dialog.baseMonths < 0) return;
    const next = { ...dialog, id: dialog.id || Date.now(), updatedAt: '2026-08-05 09:30', updatedBy: '王俊杰' };
    setRules((current) => dialog.id ? current.map((rule) => rule.id === dialog.id ? next : rule) : [next, ...current]);
    setDialog(null); setToast('配置已保存'); window.setTimeout(() => setToast(''), 1800);
  };

  return <div className="ioc-shell age-config-shell">
    <header className="topbar"><div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div><div className="topbar-main"><div className="breadcrumb"><b>IOC运营平台</b><span>/</span><strong>静态材料库龄配置</strong></div><div className="user-area"><UserRound size={15}/><span>王俊杰</span><ChevronDown size={14}/></div></div></header>
    <div className="workspace"><aside className="sidebar"><div className="platform-title">IOC运营平台</div><nav>{menuItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={`nav-item ${label === '配置中心' ? 'menu-active' : ''}`} onMouseEnter={() => label === '配置中心' ? undefined : undefined}><Icon size={17}/><span>{label}</span></button>)}</nav><div className="ioc-sidebar-menu age-config-menu"><h3>配置中心</h3><div className="ioc-sidebar-menu-list"><button type="button" className="selected">静态材料库龄配置</button><button type="button" onClick={onBack}>自定义报表配置</button></div></div></aside>
      <main className="main-area"><div className="tabbar"><span className="tab-close"><X size={14}/></span><span className="active-tab">静态材料库龄配置 <X size={12}/></span></div><div className="age-config-content">
        <section className="config-heading"><div><h1>静态材料库龄配置</h1><p>按开发类型维护库龄计算基数，材料类别未单独配置时自动使用“全部”规则。</p></div><button type="button" className="primary-button" onClick={openNew}><Plus size={14}/>新增配置</button></section>
        <section className="config-filter"><label>开发类型<select value={devFilter} onChange={(e) => setDevFilter(e.target.value)}><option value="">全部</option>{devOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>材料类别<select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">全部</option>{categoryOptions.filter((item) => item !== '全部').map((item) => <option key={item}>{item}</option>)}</select></label><label className="config-search">规则搜索<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="输入开发类型或材料类别"/></label><button type="button" className="text-button" onClick={() => { setDevFilter(''); setCategoryFilter(''); setQuery(''); }}>重置</button></section>
        <section className="config-table-panel"><table><thead><tr><th>开发类型</th><th>材料类别</th><th>库龄计算基数</th><th>规则说明</th><th>更新时间</th><th>更新人</th><th>操作</th></tr></thead><tbody>{filtered.map((rule) => <tr key={rule.id}><td><span className="dev-tag">{rule.dev}</span></td><td>{rule.category === '全部' ? <strong className="all-rule">全部</strong> : rule.category}</td><td><strong>{rule.baseMonths} 个月</strong></td><td className="rule-example">呆滞提出时间 2026/06/02 → 实际库龄 {ageOf('2026/06/02', rule.baseMonths)} 个月</td><td>{rule.updatedAt}</td><td>{rule.updatedBy}</td><td><button type="button" className="edit-button" onClick={() => setDialog(rule)}><Pencil size={13}/>编辑</button></td></tr>)}{!filtered.length && <tr><td colSpan={7} className="empty-config">暂无匹配配置</td></tr>}</tbody></table><footer><span>共 {filtered.length} 条规则</span><span>规则优先级：具体材料类别 ＞ 全部</span></footer></section>
      </div></main>
    </div>
    {dialog && <div className="config-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}><section className="config-dialog"><header><div><strong>{dialog.id ? '编辑库龄配置' : '新增库龄配置'}</strong><span>开发类型必须区分，材料类别可配置具体值或全部</span></div><button type="button" onClick={() => setDialog(null)}><X size={18}/></button></header><div className="config-form"><label>开发类型<select value={dialog.dev} onChange={(e) => setDialog({ ...dialog, dev: e.target.value })}>{devOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>材料类别<select value={dialog.category} onChange={(e) => setDialog({ ...dialog, category: e.target.value })}>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>库龄计算基数<input type="number" min="0" max="36" value={dialog.baseMonths} onChange={(e) => setDialog({ ...dialog, baseMonths: Number(e.target.value) })}/><small>单位：个月，实际库龄 = 当前库龄 + 基数</small></label></div><footer><button type="button" className="text-button" onClick={() => setDialog(null)}>取消</button><button type="button" className="primary-button" onClick={saveRule}>保存配置</button></footer></section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
