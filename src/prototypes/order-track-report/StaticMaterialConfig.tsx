/** @name 静态材料配置 */
import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Circle, Pencil, Plus, Search, UserRound, X } from 'lucide-react';
import './static-material-config.css';
import StaticConfigNavigation from './StaticConfigNavigation';
import { normalizeAlertCondition, readAlertLevelConfig, readStaticMaterialConfig, saveAlertLevelConfig, saveStaticMaterialConfig, validateAlertLevelConfig, type AlertConditionBoundary, type AlertLevelConfigItem, type StaticConfigItem as Item, type StaticConfigType as ConfigType, type StaticMaterialConfigData as DataSet, type StaticMaterialType as MaterialType } from './static-material-config-data';

type ConfigPage = ConfigType | 'alert';

export default function StaticMaterialConfig() {
  const [configPage, setConfigPage] = useState<ConfigPage>('solution');
  const [materialType, setMaterialType] = useState<MaterialType>('static');
  const [data, setData] = useState<DataSet>(() => readStaticMaterialConfig());
  const [alertLevels, setAlertLevels] = useState<AlertLevelConfigItem[]>(() => readAlertLevelConfig());
  const [editingAlert, setEditingAlert] = useState<number | null>(null);
  const [draftAlert, setDraftAlert] = useState<AlertLevelConfigItem | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [toast, setToast] = useState('');
  const configType: ConfigType = configPage === 'reason' ? 'reason' : 'solution';
  const label = configType === 'solution' ? '处理方案' : '静态原因';
  const materialLabel = materialType === 'static' ? '静态材料' : '机电材料';
  const items = data[configType][materialType];
  const rows = useMemo(() => items.filter((item) => (!keyword || item.name.includes(keyword.trim())) && (!status || String(item.enabled) === status)), [items, keyword, status]);
  useEffect(() => saveStaticMaterialConfig(data), [data]);
  useEffect(() => saveAlertLevelConfig(alertLevels), [alertLevels]);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1800); };
  const switchConfigType = (next: ConfigType) => { setConfigPage(next); setMaterialType('static'); setKeyword(''); setStatus(''); setDialogOpen(false); setEditingAlert(null); };
  const switchAlertLevel = () => { setConfigPage('alert'); setKeyword(''); setStatus(''); setDialogOpen(false); setEditingAlert(null); };
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
  const startAlertEdit = (item: AlertLevelConfigItem) => { setEditingAlert(item.id); setDraftAlert({ ...item }); };
  const cancelAlertEdit = () => { setEditingAlert(null); setDraftAlert(null); };
  const saveAlertEdit = () => {
    if (!draftAlert || !Number.isFinite(draftAlert.retention.min) || !Number.isFinite(draftAlert.retention.max) || !Number.isFinite(draftAlert.staticMonths.min) || !Number.isFinite(draftAlert.staticMonths.max)) return showToast('请完整填写留存率和静态月数区间');
    const nextAlertLevels = alertLevels.map(item => item.id === draftAlert.id ? { ...item, retention: { ...draftAlert.retention }, staticMonths: { ...draftAlert.staticMonths } } : item);
    const validationMessage = validateAlertLevelConfig(nextAlertLevels);
    if (validationMessage) return showToast(validationMessage);
    setAlertLevels(nextAlertLevels);
    cancelAlertEdit();
    showToast('警报级别配置已保存');
  };
  const updateAlertCondition = (key: 'retention' | 'staticMonths', field: 'min' | 'max', value: string) => setDraftAlert(current => current ? { ...current, [key]: { ...current[key], [field]: value === '' ? undefined : Number(value) } } : current);
  const updateAlertBoundary = (key: 'retention' | 'staticMonths', endpoint: 'minBoundary' | 'maxBoundary', boundary: AlertConditionBoundary) => setDraftAlert(current => current ? { ...current, [key]: { ...current[key], [endpoint]: boundary } } : current);
  const alertConditionDisplay = (condition: AlertLevelConfigItem['retention'], unit: '%' | '个月') => {
    const normalized = normalizeAlertCondition(condition, condition);
    const minIncluded = normalized.minBoundary === 'closed';
    const maxIncluded = normalized.maxBoundary === 'closed';
    return <span className="alert-condition-display" title={`${minIncluded ? '闭区间，包含' : '开区间，不包含'}最小值；${maxIncluded ? '闭区间，包含' : '开区间，不包含'}最大值`} aria-label={`${minIncluded ? '包含' : '不包含'}最小值 ${normalized.min}${unit}，${maxIncluded ? '包含' : '不包含'}最大值 ${normalized.max}${unit}`}><strong className={`alert-condition-bracket ${minIncluded ? 'is-closed' : 'is-open'}`}>{minIncluded ? '[' : '('}</strong><span>{normalized.min}{unit}</span><span className="alert-condition-to">至</span><span>{normalized.max}{unit}</span><strong className={`alert-condition-bracket ${maxIncluded ? 'is-closed' : 'is-open'}`}>{maxIncluded ? ']' : ')'}</strong></span>;
  };
  const alertConditionEditor = (key: 'retention' | 'staticMonths', unit: '%' | '个月', fallback: AlertLevelConfigItem['retention']) => {
    const condition = draftAlert?.[key] || fallback;
    return <div className="alert-condition-editor"><div className="alert-condition-endpoint"><select aria-label={`${key}最小值区间类型`} value={condition.minBoundary} onChange={event => updateAlertBoundary(key, 'minBoundary', event.target.value as AlertConditionBoundary)}><option value="open">开区间</option><option value="closed">闭区间</option></select><input aria-label={`${key}最小值`} type="number" min="0" step={unit === '%' ? '0.01' : '1'} value={condition.min} onChange={event => updateAlertCondition(key, 'min', event.target.value)} /></div><span>至</span><div className="alert-condition-endpoint"><select aria-label={`${key}最大值区间类型`} value={condition.maxBoundary} onChange={event => updateAlertBoundary(key, 'maxBoundary', event.target.value as AlertConditionBoundary)}><option value="open">开区间</option><option value="closed">闭区间</option></select><input aria-label={`${key}最大值`} type="number" min="0" step={unit === '%' ? '0.01' : '1'} value={condition.max} onChange={event => updateAlertCondition(key, 'max', event.target.value)} /></div><em>{unit}</em></div>;
  };

  return <div className="ioc-shell static-config-shell">
    <header className="topbar"><div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div><div className="topbar-main"><div className="breadcrumb"><b>IOC运营平台</b><span>/</span><strong>静态材料配置</strong></div><div className="user-area"><UserRound size={15}/><span>王俊杰</span><ChevronDown size={14}/></div></div></header>
    <div className="workspace"><StaticConfigNavigation/><main className="main-area"><div className="tabbar"><span className="tab-close"><X size={14}/></span><span className="active-tab"><Circle size={8} fill="currentColor"/>静态材料配置<X size={12}/></span></div>
      <div className="static-config-content">
        <div className="config-page-tabs" role="tablist"><button type="button" className={configPage === 'solution' ? 'active' : ''} onClick={() => switchConfigType('solution')}>处理方案配置</button><button type="button" className={configPage === 'reason' ? 'active' : ''} onClick={() => switchConfigType('reason')}>静态原因配置</button><button type="button" className={configPage === 'alert' ? 'active' : ''} onClick={switchAlertLevel}>警报级别</button></div>
        {configPage === 'alert' ? <section className="alert-level-config-panel"><table className="alert-level-config-table"><thead><tr><th>警报级别</th><th>严重度</th><th>留存率</th><th>静态月数</th><th>操作</th></tr></thead><tbody>{alertLevels.map(item => { const editing = editingAlert === item.id; return <tr key={item.id}><td><strong>{item.level}</strong></td><td><span className={`alert-severity severity-${item.level === '-' ? 'normal' : item.level[0]}`}>{item.severity}</span></td><td>{editing ? alertConditionEditor('retention', '%', item.retention) : alertConditionDisplay(item.retention, '%')}</td><td>{editing ? alertConditionEditor('staticMonths', '个月', item.staticMonths) : alertConditionDisplay(item.staticMonths, '个月')}</td><td>{editing ? <span className="alert-level-edit-actions"><button type="button" className="alert-save-button" onClick={saveAlertEdit}><Check size={13}/>保存</button><button type="button" className="alert-cancel-button" onClick={cancelAlertEdit}>取消</button></span> : <button type="button" className="alert-edit-button" onClick={() => startAlertEdit(item)}><Pencil size={13}/>编辑</button>}</td></tr>; })}</tbody></table></section> : <><section className="static-config-filter-row"><div className="material-page-tabs" role="tablist" aria-label={`${label}材料类型`}><button type="button" className={materialType === 'static' ? 'active' : ''} onClick={() => switchMaterialType('static')}>静态材料</button><button type="button" className={materialType === 'electromechanical' ? 'active' : ''} onClick={() => switchMaterialType('electromechanical')}>机电材料</button></div><div className="static-config-filters"><label><span>{label}名称</span><div className="config-keyword"><Search size={14}/><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={`请输入${label}名称`}/></div></label><label><span>状态</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">全部</option><option value="true">已启用</option><option value="false">未启用</option></select></label><div className="static-config-actions"><button type="button" className="primary-button" onClick={() => showToast('查询完成')}>查询</button><button type="button" className="reset-button" onClick={() => { setKeyword(''); setStatus(''); }}>重置</button></div></div></section>
        <section className="static-config-table"><div className="static-config-toolbar"><button type="button" className="primary-button" onClick={() => setDialogOpen(true)}><Plus size={14}/>新增{label}</button><span>{materialLabel}已配置 {items.length} 项</span></div><table><thead><tr><th>序号</th><th>{label}名称</th><th>状态</th><th>创建时间</th><th>创建人</th><th>操作</th></tr></thead><tbody>{rows.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.name}</strong></td><td><span className={`status-tag ${item.enabled ? 'enabled' : 'disabled'}`}><i/>{item.enabled ? '已启用' : '未启用'}</span></td><td>{item.createdAt}</td><td>{item.createdBy}</td><td><button type="button" className={item.enabled ? 'disable-action' : 'enable-action'} onClick={() => toggleEnabled(item.id)}>{item.enabled ? '停用' : '启用'}</button></td></tr>)}{!rows.length && <tr><td colSpan={6} className="empty-config">暂无符合条件的配置</td></tr>}</tbody></table><footer>共 {rows.length} 条记录</footer></section></>}
      </div>
    </main></div>
    {dialogOpen && <div className="static-config-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDialogOpen(false)}><section className="static-config-dialog"><header><strong>新增{materialLabel}{label}</strong><button type="button" onClick={() => setDialogOpen(false)}><X size={18}/></button></header><div><label>{label}名称<input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addItem()}/></label><p>新增后名称不可修改，可通过状态控制是否启用。</p></div><footer><button type="button" className="reset-button" onClick={() => setDialogOpen(false)}>取消</button><button type="button" className="primary-button" onClick={addItem}>确定</button></footer></section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
