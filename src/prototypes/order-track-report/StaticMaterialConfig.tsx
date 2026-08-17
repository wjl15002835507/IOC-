/** @name 静态材料配置 */
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Circle, Plus, Search, UserRound, X } from 'lucide-react';
import './static-material-config.css';
import StaticConfigNavigation from './StaticConfigNavigation';
import { readStaticMaterialConfig, saveStaticMaterialConfig, type StaticConfigItem as Item, type StaticConfigType as ConfigType, type StaticMaterialConfigData as DataSet, type StaticMaterialType as MaterialType } from './static-material-config-data';

export default function StaticMaterialConfig() {
  const [configType, setConfigType] = useState<ConfigType>('solution');
  const [materialType, setMaterialType] = useState<MaterialType>('static');
  const [data, setData] = useState<DataSet>(() => readStaticMaterialConfig());
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [toast, setToast] = useState('');
  const label = configType === 'solution' ? '处理方案' : '静态原因';
  const materialLabel = materialType === 'static' ? '静态材料' : '机电材料';
  const items = data[configType][materialType];
  const rows = useMemo(() => items.filter((item) => (!keyword || item.name.includes(keyword.trim())) && (!status || String(item.enabled) === status)), [items, keyword, status]);
  useEffect(() => saveStaticMaterialConfig(data), [data]);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1800); };
  const switchConfigType = (next: ConfigType) => { setConfigType(next); setMaterialType('static'); setKeyword(''); setStatus(''); setDialogOpen(false); };
  const switchMaterialType = (next: MaterialType) => { setMaterialType(next); setKeyword(''); setStatus(''); setDialogOpen(false); };
  const toggleEnabled = (id: number) => setData((current) => ({ ...current, [configType]: { ...current[configType], [materialType]: current[configType][materialType].map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item) } }));
  const addItem = () => {
    const name = newName.trim();
    if (!name) return showToast(`请输入${label}名称`);
    if (items.some((item) => item.name === name)) return showToast(`${label}已存在，请勿重复新增`);
    const next: Item = { id: Date.now(), name, enabled: true, createdAt: '2026-08-14 14:30', createdBy: '王俊杰' };
    setData((current) => ({ ...current, [configType]: { ...current[configType], [materialType]: [next, ...current[configType][materialType]] } }));
    setNewName(''); setDialogOpen(false); showToast(`${label}已新增`);
  };

  return <div className="ioc-shell static-config-shell">
    <header className="topbar"><div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div><div className="topbar-main"><div className="breadcrumb"><b>IOC运营平台</b><span>/</span><strong>静态材料配置</strong></div><div className="user-area"><UserRound size={15}/><span>王俊杰</span><ChevronDown size={14}/></div></div></header>
    <div className="workspace"><StaticConfigNavigation/><main className="main-area"><div className="tabbar"><span className="tab-close"><X size={14}/></span><span className="active-tab"><Circle size={8} fill="currentColor"/>静态材料配置<X size={12}/></span></div>
      <div className="static-config-content">
        <div className="config-page-tabs" role="tablist"><button type="button" className={configType === 'solution' ? 'active' : ''} onClick={() => switchConfigType('solution')}>处理方案配置</button><button type="button" className={configType === 'reason' ? 'active' : ''} onClick={() => switchConfigType('reason')}>静态原因配置</button></div>
        <section className="static-config-filter-row"><div className="material-page-tabs" role="tablist" aria-label={`${label}材料类型`}><button type="button" className={materialType === 'static' ? 'active' : ''} onClick={() => switchMaterialType('static')}>静态材料</button><button type="button" className={materialType === 'electromechanical' ? 'active' : ''} onClick={() => switchMaterialType('electromechanical')}>机电材料</button></div><div className="static-config-filters"><label><span>{label}名称</span><div className="config-keyword"><Search size={14}/><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={`请输入${label}名称`}/></div></label><label><span>状态</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">全部</option><option value="true">已启用</option><option value="false">未启用</option></select></label><div className="static-config-actions"><button type="button" className="primary-button" onClick={() => showToast('查询完成')}>查询</button><button type="button" className="reset-button" onClick={() => { setKeyword(''); setStatus(''); }}>重置</button></div></div></section>
        <section className="static-config-table"><div className="static-config-toolbar"><button type="button" className="primary-button" onClick={() => setDialogOpen(true)}><Plus size={14}/>新增{label}</button><span>{materialLabel}已配置 {items.length} 项</span></div><table><thead><tr><th>序号</th><th>{label}名称</th><th>状态</th><th>创建时间</th><th>创建人</th><th>操作</th></tr></thead><tbody>{rows.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.name}</strong></td><td><span className={`status-tag ${item.enabled ? 'enabled' : 'disabled'}`}><i/>{item.enabled ? '已启用' : '未启用'}</span></td><td>{item.createdAt}</td><td>{item.createdBy}</td><td><button type="button" className={item.enabled ? 'disable-action' : 'enable-action'} onClick={() => toggleEnabled(item.id)}>{item.enabled ? '停用' : '启用'}</button></td></tr>)}{!rows.length && <tr><td colSpan={6} className="empty-config">暂无符合条件的配置</td></tr>}</tbody></table><footer>共 {rows.length} 条记录</footer></section>
      </div>
    </main></div>
    {dialogOpen && <div className="static-config-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDialogOpen(false)}><section className="static-config-dialog"><header><strong>新增{materialLabel}{label}</strong><button type="button" onClick={() => setDialogOpen(false)}><X size={18}/></button></header><div><label>{label}名称<input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addItem()}/></label><p>新增后名称不可修改，可通过状态控制是否启用。</p></div><footer><button type="button" className="reset-button" onClick={() => setDialogOpen(false)}>取消</button><button type="button" className="primary-button" onClick={addItem}>确定</button></footer></section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
