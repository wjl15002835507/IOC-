/**
 * @name 新供应商开发进度跟踪（移动端）
 */
import React, { useMemo, useState } from 'react';
import { BellOff, ChevronDown, Filter, RotateCcw, Search, Signal, Wifi, X } from 'lucide-react';
import './style.css';

type OrderLine = { po: string; materialCode: string; material: string; unit: string; quantity: number; date: string };
type Supplier = { code: string; name: string; introducedAt: string; officialAt: string; orders: OrderLine[] };
type DatePreset = '不限' | '近1个月' | '近3个月' | '近6个月' | '近1年' | '自定义';
type Filters = { supplier: string; introducedPreset: DatePreset; introducedFrom: string; introducedTo: string; orderPreset: DatePreset; orderFrom: string; orderTo: string };
type ActiveFilterDropdown = 'introduced' | 'order' | null;

const suppliers: Supplier[] = [
  { code: 'V208641', name: '苏州精工五金有限公司', introducedAt: '2026-09-08', officialAt: '2026-09-18', orders: [
    { po: 'PO-261018-042', materialCode: 'M-100284', material: '缓冲铰链 110°', unit: '只', quantity: 1200, date: '2026-10-18' },
    { po: 'PO-261025-019', materialCode: 'M-100284', material: '缓冲铰链 110°', unit: '只', quantity: 800, date: '2026-10-25' },
    { po: 'PO-261106-033', materialCode: 'M-100284', material: '缓冲铰链 110°', unit: '只', quantity: 1600, date: '2026-11-06' },
    { po: 'PO-261029-011', materialCode: 'M-100517', material: '三节静音导轨 450mm', unit: '副', quantity: 480, date: '2026-10-29' },
    { po: 'PO-261113-007', materialCode: 'M-100517', material: '三节静音导轨 450mm', unit: '副', quantity: 720, date: '2026-11-13' },
  ] },
  { code: 'V208655', name: '广东新锐装饰材料有限公司', introducedAt: '2026-09-26', officialAt: '2026-10-02', orders: [
    { po: 'PO-261011-016', materialCode: 'M-304026', material: 'PVC封边带 22mm', unit: '米', quantity: 3000, date: '2026-10-11' },
    { po: 'PO-261024-052', materialCode: 'M-304026', material: 'PVC封边带 22mm', unit: '米', quantity: 4500, date: '2026-10-24' },
    { po: 'PO-261108-021', materialCode: 'M-304026', material: 'PVC封边带 22mm', unit: '米', quantity: 3800, date: '2026-11-08' },
    { po: 'PO-261117-031', materialCode: 'M-304082', material: 'PVC封边带 35mm', unit: '米', quantity: 1600, date: '2026-11-17' },
  ] },
  { code: 'V208672', name: '青岛恒木新材料有限公司', introducedAt: '2026-10-14', officialAt: '2026-10-21', orders: [
    { po: 'PO-261030-008', materialCode: 'M-502109', material: '桦木多层板 18mm', unit: '张', quantity: 360, date: '2026-10-30' },
    { po: 'PO-261112-014', materialCode: 'M-502109', material: '桦木多层板 18mm', unit: '张', quantity: 480, date: '2026-11-12' },
  ] },
  { code: 'V208691', name: '宁波力拓照明科技有限公司', introducedAt: '2026-10-28', officialAt: '2026-11-04', orders: [
    { po: 'PO-261110-027', materialCode: 'M-710055', material: '柜内感应灯 400mm', unit: '套', quantity: 240, date: '2026-11-10' },
    { po: 'PO-261119-005', materialCode: 'M-710055', material: '柜内感应灯 400mm', unit: '套', quantity: 360, date: '2026-11-19' },
  ] },
  { code: 'V208704', name: '佛山森屿五金制品厂', introducedAt: '2026-11-06', officialAt: '2026-11-12', orders: [
    { po: 'PO-261116-012', materialCode: 'M-120430', material: '偏心连接件', unit: '套', quantity: 1800, date: '2026-11-16' },
    { po: 'PO-261121-018', materialCode: 'M-120430', material: '偏心连接件', unit: '套', quantity: 2200, date: '2026-11-21' },
  ] },
];

const datePresets: DatePreset[] = ['不限', '近1个月', '近3个月', '近6个月', '近1年', '自定义'];
const presetMonths: Partial<Record<DatePreset, number>> = { '近1个月': 1, '近3个月': 3, '近6个月': 6, '近1年': 12 };

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRangeForPreset(preset: Exclude<DatePreset, '自定义'>, today = new Date()) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDay = end.getDate();
  const startMonth = new Date(end.getFullYear(), end.getMonth() - (presetMonths[preset] || 3), 1);
  const lastDayOfStartMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 0).getDate();
  startMonth.setDate(Math.min(startDay, lastDayOfStartMonth));
  return { from: toDateInputValue(startMonth), to: toDateInputValue(end) };
}

function createInitialFilters(): Filters {
  const recentRange = getRangeForPreset('近3个月');
  return { supplier: '', introducedPreset: '近3个月', introducedFrom: recentRange.from, introducedTo: recentRange.to, orderPreset: '不限', orderFrom: '', orderTo: '' };
}

const initialFilters = createInitialFilters();
const stages = ['业务需求', '采购开发', '核价完成', '正式供应商'];

function SupplierCard({ supplier, filters }: { supplier: Supplier; filters: Filters }) {
  const materialRows = useMemo(() => {
    const grouped = new Map<string, { code: string; name: string; unit: string; count: number; quantity: number }>();
    supplier.orders.filter(order => order.date >= supplier.officialAt && (!filters.orderFrom || order.date >= filters.orderFrom) && (!filters.orderTo || order.date <= filters.orderTo)).forEach(order => {
      const key = `${order.materialCode}-${order.unit}`;
      const row = grouped.get(key) || { code: order.materialCode, name: order.material, unit: order.unit, count: 0, quantity: 0 };
      row.count += 1;
      row.quantity += order.quantity;
      grouped.set(key, row);
    });
    return [...grouped.values()];
  }, [supplier, filters.orderFrom, filters.orderTo]);

  if (materialRows.length === 0) return null;
  return <article className="mobile-supplier-card">
    <div className="mobile-supplier-head"><div><h2>{supplier.name}</h2><span>{supplier.code}</span></div><span className="mobile-status">已成为正式供应商</span></div>
    <div className="mobile-intro-date"><span>引进日期</span><b>{supplier.introducedAt}</b><i>示例</i></div>
    <div className="mobile-stage-list">{stages.map((stage, index) => <div className={`mobile-stage ${index === 3 ? 'pending' : ''}`} key={stage}><span className="mobile-stage-node"/><b>{stage}</b><small>{index < 3 ? '数据待补' : '日期待确认'}</small></div>)}</div>
    <div className="mobile-material-heading"><strong>物料下单</strong><span>{materialRows.length} 种物料</span></div>
    <div className="mobile-material-columns"><span>物料名称</span><span>订单次数</span><span>下单数量</span></div>
    <div className="mobile-material-list">{materialRows.map(row => <div className="mobile-material-row" key={row.code}>
      <div className="mobile-material-name"><b>{row.name}</b><small>{row.code}</small></div>
      <div className="mobile-material-metrics"><span><b>{row.count}</b></span><span><b>{row.quantity.toLocaleString()} <i>{row.unit}</i></b></span></div>
    </div>)}</div>
  </article>;
}

export default function SupplierDevelopmentMobile() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<ActiveFilterDropdown>(null);
  const [supplierQuery, setSupplierQuery] = useState(initialFilters.supplier);
  const visibleSuppliers = suppliers.filter(supplier => (supplier.name.includes(applied.supplier) || supplier.code.includes(applied.supplier)) && supplier.introducedAt >= applied.introducedFrom && supplier.introducedAt <= applied.introducedTo && supplier.orders.some(order => order.date >= supplier.officialAt && order.date >= applied.orderFrom && order.date <= applied.orderTo));
  const introducedFilterActive = Boolean(applied.introducedFrom && applied.introducedTo);
  const orderFilterActive = Boolean(applied.orderFrom || applied.orderTo);
  const hasActiveFilter = Boolean(applied.supplier.trim()) || introducedFilterActive || orderFilterActive;
  const update = (key: keyof Filters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const setDatePreset = (presetKey: 'introducedPreset' | 'orderPreset', fromKey: 'introducedFrom' | 'orderFrom', toKey: 'introducedTo' | 'orderTo', value: DatePreset) => {
    setFilters(current => {
      if (value === '自定义') return { ...current, [presetKey]: value };
      if (value === '不限') return { ...current, [presetKey]: value, [fromKey]: '', [toKey]: '' };
      const range = getRangeForPreset(value);
      return { ...current, [presetKey]: value, [fromKey]: range.from, [toKey]: range.to };
    });
  };
  const openFilters = () => { setActiveDropdown(null); setFilters(applied); setSupplierQuery(applied.supplier); setFiltersOpen(true); };
  const closeFilters = () => { setFilters(applied); setFiltersOpen(false); };
  const resetFilters = () => setFilters(createInitialFilters());
  const applyFilters = () => { setApplied(filters); setSupplierQuery(filters.supplier); setFiltersOpen(false); };
  const applyDropdown = () => { setApplied(filters); setActiveDropdown(null); };
  const searchSupplier = () => {
    setFilters(current => ({ ...current, supplier: supplierQuery }));
    setApplied(current => ({ ...current, supplier: supplierQuery }));
  };

  return <main className="mobile-report-app">
    <div className="mobile-device-status" aria-label="设备状态栏"><span>19:31 <BellOff size={13}/></span><span><Signal size={15}/><Wifi size={16}/><b>98</b></span></div>
    <div className="mobile-top-accent" />
    <div className="mobile-screen-frame"><section className="mobile-screen-panel">
      <h1 className="mobile-report-title">新供应商开发进度跟踪</h1>
      <section className="mobile-filter-section" aria-label="筛选条件">
        <div className="mobile-filter-row">
          <div className="mobile-filter-controls">
            <div className={`mobile-supplier-search ${applied.supplier.trim() ? 'selected' : ''}`}>
              <input className="mobile-supplier-inline-search" aria-label="按供应商名称模糊搜索" value={supplierQuery} placeholder="供应商名称" onChange={event => setSupplierQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') searchSupplier(); }} />
              <button type="button" className="mobile-supplier-search-button" aria-label="搜索供应商" onClick={searchSupplier}><Search size={14}/></button>
            </div>
          <button type="button" className={`mobile-time-shortcut ${introducedFilterActive ? 'selected' : ''}`} aria-pressed={introducedFilterActive} aria-expanded={activeDropdown === 'introduced'} onClick={() => { setFilters(applied); setActiveDropdown(current => current === 'introduced' ? null : 'introduced'); }}>引进时间<ChevronDown size={11}/></button>
          <button type="button" className={`mobile-time-shortcut ${orderFilterActive ? 'selected' : ''}`} aria-pressed={orderFilterActive} aria-expanded={activeDropdown === 'order'} onClick={() => { setFilters(applied); setActiveDropdown(current => current === 'order' ? null : 'order'); }}>下单时间<ChevronDown size={11}/></button>
          </div>
          <button type="button" className={`mobile-filter-button ${hasActiveFilter ? 'selected' : ''}`} aria-label="更多筛选条件" onClick={openFilters}><Filter size={17}/></button>
        </div>
        {activeDropdown && <div className="mobile-filter-dropdown">
          <div className="mobile-dropdown-presets">{datePresets.map(preset => <button type="button" key={preset} className={filters[activeDropdown === 'introduced' ? 'introducedPreset' : 'orderPreset'] === preset ? 'selected' : ''} onClick={() => setDatePreset(activeDropdown === 'introduced' ? 'introducedPreset' : 'orderPreset', activeDropdown === 'introduced' ? 'introducedFrom' : 'orderFrom', activeDropdown === 'introduced' ? 'introducedTo' : 'orderTo', preset)}>{preset}</button>)}</div>
          <div className="mobile-dialog-date-range"><input aria-label={activeDropdown === 'introduced' ? '引进开始日期' : '下单开始日期'} type="date" value={filters[activeDropdown === 'introduced' ? 'introducedFrom' : 'orderFrom']} onChange={event => { update(activeDropdown === 'introduced' ? 'introducedFrom' : 'orderFrom', event.target.value); update(activeDropdown === 'introduced' ? 'introducedPreset' : 'orderPreset', '自定义'); }} /><b>至</b><input aria-label={activeDropdown === 'introduced' ? '引进结束日期' : '下单结束日期'} type="date" value={filters[activeDropdown === 'introduced' ? 'introducedTo' : 'orderTo']} onChange={event => { update(activeDropdown === 'introduced' ? 'introducedTo' : 'orderTo', event.target.value); update(activeDropdown === 'introduced' ? 'introducedPreset' : 'orderPreset', '自定义'); }} /></div>
          <div className="mobile-dropdown-actions"><button type="button" onClick={() => setDatePreset(activeDropdown === 'introduced' ? 'introducedPreset' : 'orderPreset', activeDropdown === 'introduced' ? 'introducedFrom' : 'orderFrom', activeDropdown === 'introduced' ? 'introducedTo' : 'orderTo', activeDropdown === 'introduced' ? '近3个月' : '不限')}>重置</button><button type="button" className="confirm" onClick={applyDropdown}>确认</button></div>
        </div>}
      </section>
      <section className="mobile-supplier-list" aria-label="供应商下单情况">{visibleSuppliers.map(supplier => <SupplierCard key={supplier.code} supplier={supplier} filters={applied} />)}{visibleSuppliers.length === 0 && <div className="mobile-empty">没有符合条件的记录</div>}</section>
      <footer className="mobile-bottom-note">示例数据 · 仅统计正式下单及正式供应商日期之后的订单</footer>
    </section></div>
    {filtersOpen && <div className="mobile-filter-scrim" onClick={closeFilters}>
      <section className="mobile-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" onClick={event => event.stopPropagation()}>
        <header className="mobile-filter-dialog-header"><h2 id="mobile-filter-title">筛选</h2><button type="button" aria-label="关闭筛选" onClick={closeFilters}><X size={23}/></button></header>
        <div className="mobile-filter-dialog-body">
          <label className="mobile-dialog-field"><span>供应商</span><input value={filters.supplier} placeholder="输入供应商名称，支持模糊搜索" onChange={event => update('supplier', event.target.value)} /></label>
          <fieldset className="mobile-date-filter"><div className="mobile-date-filter-heading"><legend>引进时间</legend><div className="mobile-dialog-presets">{datePresets.map(preset => <button type="button" key={preset} className={filters.introducedPreset === preset ? 'selected' : ''} onClick={() => setDatePreset('introducedPreset', 'introducedFrom', 'introducedTo', preset)}>{preset}</button>)}</div></div><div className="mobile-dialog-date-range"><input aria-label="引进开始日期" type="date" value={filters.introducedFrom} onChange={event => { update('introducedFrom', event.target.value); update('introducedPreset', '自定义'); }} /><b>至</b><input aria-label="引进结束日期" type="date" value={filters.introducedTo} onChange={event => { update('introducedTo', event.target.value); update('introducedPreset', '自定义'); }} /></div></fieldset>
          <fieldset className="mobile-date-filter"><div className="mobile-date-filter-heading"><legend>下单时间</legend><div className="mobile-dialog-presets">{datePresets.map(preset => <button type="button" key={preset} className={filters.orderPreset === preset ? 'selected' : ''} onClick={() => setDatePreset('orderPreset', 'orderFrom', 'orderTo', preset)}>{preset}</button>)}</div></div><div className="mobile-dialog-date-range"><input aria-label="下单开始日期" type="date" value={filters.orderFrom} onChange={event => { update('orderFrom', event.target.value); update('orderPreset', '自定义'); }} /><b>至</b><input aria-label="下单结束日期" type="date" value={filters.orderTo} onChange={event => { update('orderTo', event.target.value); update('orderPreset', '自定义'); }} /></div></fieldset>
        </div>
        <footer className="mobile-filter-dialog-actions"><button type="button" className="mobile-dialog-reset" onClick={resetFilters}><RotateCcw size={16}/>重置</button><button type="button" className="mobile-dialog-confirm" onClick={applyFilters}><Search size={16}/>确认</button></footer>
      </section>
    </div>}
  </main>;
}
