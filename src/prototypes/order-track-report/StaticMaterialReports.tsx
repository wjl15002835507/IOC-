import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, History, Pencil, RotateCcw, Search, Upload, X } from 'lucide-react';
import { getEnabledConfigValues, type StaticMaterialType } from './static-material-config-data';
import { createXlsxTemplate } from './xlsx-template';

export type StaticReportId = 'strategic' | 'special' | 'strategic-special-base' | 'new-static' | 'electromechanical' | 'static-consumption' | 'warning';

type Column = { key: string; label: string; width?: number };
type Filter = { key: string; label: string; type?: 'select' | 'date' | 'month'; options?: string[]; placeholder?: string };
type ChangeRecord = { solution: string; opinion: string; updatedBy: string; updatedAt: string };
type Row = Record<string, string | number | ChangeRecord[]> & { changeHistory?: ChangeRecord[] };
type ReportConfig = { title: string; total: number; columns: Column[]; filters: Filter[]; rows: Row[] };
type NewStaticTab = 'static' | 'electromechanical';
type NewStaticTabConfig = Omit<ReportConfig, 'title'> & { label: string; templateFields: string[] };
type ImportMode = 'solution' | 'responsible-unit';

const baseRows: Row[] = [
  { material:'101013732', materialGroup:'RA011316', materialGroupName:'原材料/板材/木皮板/多层/3木皮板', materialDescription:'3多层板单面贴水曲柳直纹木皮板2440*1220TT', productionType:'定量', development:'板木', category:'板材', factorySet:'6199', factoryName:'板木公司供应工厂', warehouseSet:'D001', warehouseName:'工业园板材三胺板呆滞库', unit:'ZHA', unitName:'张', reportedStock:28, availableStock:18, plannedDemand:6, supplierUnreceived:0, totalRequired:22, currentStock:18, received:'是', receivedQuantity:4, lastYearInbound:42, lastYearOutbound:24, responsibleUnit:'板木采购部', solutionDepartment:'板木产品部', staticReason:'采购大于需求', solution:'生产留用', opinion:'调贴皮车间砂光后转作在用木皮板', retainedQuantity:12, retainedDate:'2026-08-31', totalOutbound:4, outboundRatio:'18.18%', retention:'81.82%', staticDate:'2026-08-01', staticMonths:0, expectedDate:'2026-10-31', expectedSampleDate:'', changeHistory:[{solution:'材料替换',opinion:'评估同类板件替换使用',updatedBy:'李伟',updatedAt:'2026-08-07 16:42'},{solution:'生产留用',opinion:'调贴皮车间砂光后转作在用木皮板',updatedBy:'王俊励',updatedAt:'2026-08-11 09:30'}] },
  { material:'104009061', materialGroup:'RF050100', materialGroupName:'定制衣柜原材料/封边带', materialDescription:'H214#墨韵细木纹PVC浮雕封边带哑光1.2*28mm', productionType:'定性', development:'板木', category:'封边带', factorySet:'6199', factoryName:'板木公司供应工厂', warehouseSet:'D004', warehouseName:'定制呆滞库', unit:'M', unitName:'米', reportedStock:680, availableStock:570, plannedDemand:90, supplierUnreceived:20, totalRequired:610, currentStock:570, received:'否', receivedQuantity:0, lastYearInbound:1260, lastYearOutbound:690, responsibleUnit:'板木采购部', staticReason:'物料替换', solution:'材料替换', opinion:'替换相近颜色衣柜隔板封边带，优先用于隐藏部位', retainedQuantity:'', retainedDate:'', totalOutbound:40, outboundRatio:'6.56%', retention:'93.44%', staticDate:'2026-08-01', staticMonths:0, expectedDate:'2027-03-31', expectedSampleDate:'', changeHistory:[{solution:'方案待定',opinion:'',updatedBy:'赵敏',updatedAt:'2026-08-05 09:26'}] },
  { material:'104009061', materialGroup:'RF050100', materialGroupName:'定制衣柜原材料/封边带', materialDescription:'H214#墨韵细木纹PVC浮雕封边带哑光1.2*28mm', productionType:'定性', development:'定制', category:'封边带', factorySet:'8599', factoryName:'定制公司供应工厂', warehouseSet:'RC8Z', warehouseName:'定制呆滞库', unit:'M', unitName:'米', reportedStock:663, availableStock:558, plannedDemand:90, supplierUnreceived:40, totalRequired:613, currentStock:558, received:'否', receivedQuantity:0, lastYearInbound:1180, lastYearOutbound:622, responsibleUnit:'定制采购部', staticReason:'物料替换', solution:'材料替换', opinion:'替换相近颜色衣柜隔板封边带，优先用于隐藏部位', retainedQuantity:'', retainedDate:'', totalOutbound:55, outboundRatio:'8.97%', retention:'91.03%', staticDate:'2026-08-01', staticMonths:0, expectedDate:'2027-03-31', expectedSampleDate:'', changeHistory:[{solution:'方案待定',opinion:'',updatedBy:'赵敏',updatedAt:'2026-08-05 09:26'}] },
  { material:'301000214', materialGroup:'RM010101', materialGroupName:'机电材料/照明/灯带电源', materialDescription:'嵌入式灯带电源 24V', productionType:'定量', development:'配套', category:'电器', factorySet:'8599', factoryName:'定制公司供应工厂', warehouseSet:'D021', warehouseName:'成都一厂机电呆滞库', unit:'EA', unitName:'个', reportedStock:60, availableStock:54, plannedDemand:0, supplierUnreceived:0, totalRequired:60, currentStock:54, received:'是', receivedQuantity:6, lastYearInbound:96, lastYearOutbound:42, responsibleUnit:'机电部', staticReason:'业务调整', solution:'生产留用', opinion:'在新品样柜中优先配置消耗', retainedQuantity:54, retainedDate:'2026-12-31', totalOutbound:6, outboundRatio:'10.00%', retention:'90.00%', staticDate:'2026-08-01', staticMonths:0, expectedDate:'2026-12-31', expectedSampleDate:'' },
  { material:'105099901', materialGroup:'RF070801', materialGroupName:'辅料/装饰件', materialDescription:'清丰分厂专用装饰件', productionType:'定性', category:'五金', factorySet:'8999', factoryName:'清丰分公司供应工厂', warehouseSet:'QF01', warehouseName:'清丰呆滞库', unit:'EA', unitName:'个', reportedStock:36, availableStock:36, plannedDemand:0, supplierUnreceived:0, totalRequired:36, currentStock:36, received:'否', receivedQuantity:0, lastYearInbound:36, lastYearOutbound:0, responsibleUnit:'', staticReason:'采购大于需求', solution:'', opinion:'', retainedQuantity:'', retainedDate:'', totalOutbound:0, outboundRatio:'0.00%', retention:'100.00%', staticDate:'2026-08-01', staticMonths:0, expectedDate:'2026-11-30', expectedSampleDate:'' },
];

const DEVELOPMENT_OPTIONS = ['板木', '软体', '定制'];
const branchCodes = (value: unknown) => String(value ?? '').split('/').map(code => code.trim()).filter(Boolean);
const calculatedDevelopmentType = (row: Row, rows: Row[] = baseRows): string => {
  const codes = branchCodes(row.factorySet);
  const description = String(row.materialDescription ?? '');
  if (codes.includes('8599')) return '定制';
  if (codes.includes('6199')) return '板木';
  if (codes.includes('6299')) return '软体';
  if (codes.includes('8699')) return description.includes('定制') ? '定制' : '板木';
  if (codes.some(code => code === '8899' || code === '8999')) {
    const sameMaterial = rows.find(candidate => candidate.material === row.material && branchCodes(candidate.factorySet).some(code => ['6199', '6299', '8599', '8699'].includes(code)));
    return sameMaterial ? calculatedDevelopmentType(sameMaterial, rows) : '';
  }
  return '';
};
const recordKey = (row: Row) => `${String(row.factorySet ?? '').trim()}|${String(row.material ?? '').trim()}`;
const newStaticImportKey = (row: Row) => `${String(row.material ?? '').trim()}|${String(row.factorySet ?? '').trim()}|${String(row.staticDate ?? '').trim()}`;
const importFieldKey: Record<string, string> = { '工厂编码':'factorySet', '工厂描述':'factoryName', '物料编码':'material', '物料描述':'materialDescription', '开发类型':'development', '责任单位':'responsibleUnit', '静态提出日期':'staticDate', '处理方案类型':'solution', '处理意见':'opinion', '方案制定部门':'solutionDepartment', '留用数量':'retainedQuantity', '留用时间':'retainedDate', '预计消耗完成时间':'expectedDate', '预计打样完成时间':'expectedSampleDate', '静态原因':'staticReason' };

type BaselineSnapshot = { included: boolean; value?: string };
// Each uninterrupted strategic/special membership period freezes the first SAP baseline value.
const frozenBaselineConsumption = (snapshots: BaselineSnapshot[]) => {
  let inActivePeriod = false;
  let frozenValue = '';
  for (const snapshot of snapshots) {
    if (!snapshot.included) {
      inActivePeriod = false;
      frozenValue = '';
    } else if (!inActivePeriod) {
      inActivePeriod = true;
      frozenValue = snapshot.value ?? '';
    }
  }
  return frozenValue;
};

const strategicRows: Row[] = [
  { category:'五金', materialCode:'117000001', materialDescription:'直径1.4钢丝', baselineAverageConsumption:frozenBaselineConsumption([{included:true,value:'4,820.16'},{included:true,value:'4,991.20'}]), preparationDays:'30天', currentStock:'174,993.03', averageConsumption:'4,929.38', supplyDays:'35.5', overstockQuantity:'27,111.59' },
  { category:'板材', materialCode:'101014131', materialDescription:'18mm双面星辰链结哑光三胺板', baselineAverageConsumption:frozenBaselineConsumption([{included:true,value:'18.60'},{included:false},{included:true,value:'20.40'},{included:true,value:'21.10'}]), preparationDays:'45天', currentStock:'824.00', averageConsumption:'18.60', supplyDays:'44.3', overstockQuantity:'173.00' },
  { category:'封边带', materialCode:'104009061', materialDescription:'H214#墨韵细木纹PVC浮雕封边带', baselineAverageConsumption:frozenBaselineConsumption([{included:true,value:'16.25'}]), preparationDays:'60天', currentStock:'1,128.00', averageConsumption:'14.70', supplyDays:'76.7', overstockQuantity:'245.00' },
];
const specialRows: Row[] = strategicRows.map((row, index) => ({ ...row, category:['刀具','电器','五金'][index], materialCode: ['205009815','301002596','198008694'][index], materialDescription: ['专项刀具MX-203眉线立铣金刚石刀','智能灯控模块 A3 专项备料','M079-128珍珠铬锌合金拉手'][index], preparationDays: ['20天','35天','50天'][index] }));
const strategicDataUpdatedAt = { strategic:'2026-08-19 08:00:00', special:'2026-08-19 08:00:00' };

const strategicColumns: Column[] = [
  {key:'category',label:'材料类别'}, {key:'materialCode',label:'物料编码'}, {key:'materialDescription',label:'物料描述',width:280},
  {key:'baselineAverageConsumption',label:'备料时3月月均消耗量',width:160}, {key:'preparationDays',label:'备料天数'},
  {key:'currentStock',label:'当前库存'}, {key:'averageConsumption',label:'近3月月均消耗量',width:150}, {key:'supplyDays',label:'可供应天数'},
  {key:'overstockQuantity',label:'超量备料'},
];

const strategicSpecialBaseColumns: Column[] = [
  { key: 'materialCode', label: '物料编码', width: 116 },
  { key: 'materialDescription', label: '物料描述', width: 300 },
  { key: 'materialType', label: '物料类型', width: 120 },
  { key: 'preparationPeriod', label: '备料周期', width: 104 },
  { key: 'referenceUnit', label: '引用单位', width: 116 },
  { key: 'createdAt', label: '创建日期', width: 116 },
  { key: 'createdBy', label: '创建人', width: 120 },
  { key: 'status', label: '状态', width: 94 },
  { key: 'changeType', label: '对比上次版本', width: 112 },
  { key: 'versionNo', label: '版本号', width: 142 },
];

const strategicSpecialVersionRows: Record<string, Row[]> = {
  'V20260812-001': [
    { materialCode:'117000001', materialDescription:'直径 1.4 钢丝', materialType:'战略', preparationPeriod:'30', referenceUnit:'天', createdAt:'2026-08-12', createdBy:'物料主数据组', status:'有效' },
    { materialCode:'101014131', materialDescription:'18mm 双面星辰链结哑光三胺板', materialType:'战略', preparationPeriod:'45', referenceUnit:'天', createdAt:'2026-08-12', createdBy:'板木采购部', status:'有效' },
    { materialCode:'205009815', materialDescription:'MX-203 眉线立铣金刚石刀', materialType:'专项', preparationPeriod:'20', referenceUnit:'天', createdAt:'2026-08-12', createdBy:'工艺技术部', status:'有效' },
  ],
  'V20260813-002': [
    { materialCode:'117000001', materialDescription:'直径 1.4 钢丝', materialType:'战略', preparationPeriod:'30', referenceUnit:'天', createdAt:'2026-08-12', createdBy:'物料主数据组', status:'有效' },
    { materialCode:'104009061', materialDescription:'H214# 墨韵细木纹 PVC 浮雕封边带', materialType:'专项', preparationPeriod:'60', referenceUnit:'天', createdAt:'2026-08-13', createdBy:'定制采购部', status:'有效' },
    { materialCode:'205009815', materialDescription:'MX-203 眉线立铣金刚石刀', materialType:'专项', preparationPeriod:'20', referenceUnit:'天', createdAt:'2026-08-12', createdBy:'工艺技术部', status:'有效' },
  ],
  'V20260813-003': [
    { materialCode:'117000001', materialDescription:'直径 1.4 钢丝', materialType:'战略', preparationPeriod:'30', referenceUnit:'天', createdAt:'2026-08-12', createdBy:'物料主数据组', status:'有效' },
    { materialCode:'104009061', materialDescription:'H214# 墨韵细木纹 PVC 浮雕封边带', materialType:'专项', preparationPeriod:'60', referenceUnit:'天', createdAt:'2026-08-13', createdBy:'定制采购部', status:'有效' },
    { materialCode:'301002596', materialDescription:'智能灯控模块 A3 专项备料', materialType:'专项', preparationPeriod:'35', referenceUnit:'天', createdAt:'2026-08-13', createdBy:'机电采购部', status:'有效' },
  ],
};

const DEFAULT_SOLUTION = '方案待定';
const commonSolutions = [DEFAULT_SOLUTION,'生产留用','售后留用','材料替换','采购处理','报废/变卖','开发新品','开发特款'];
const configOptions = (materialType: StaticMaterialType, configType: 'solution' | 'reason', includePending = false) => {
  const values = getEnabledConfigValues(materialType, configType);
  return includePending ? [DEFAULT_SOLUTION, ...values] : values;
};
const newStaticStaticColumns: Column[] = [
  {key:'material',label:'物料编码'},{key:'materialDescription',label:'物料描述',width:300},{key:'productionType',label:'产生类型'},
  {key:'category',label:'材料类别'},
  {key:'materialGroup',label:'物料组'},{key:'materialGroupName',label:'物料组描述',width:220},{key:'factorySet',label:'工厂编码'},
  {key:'factoryName',label:'工厂描述',width:180},{key:'development',label:'开发类型'},{key:'unit',label:'单位'},
  {key:'currentStock',label:'提出时可用库存'},{key:'supplierUnreceived',label:'供应商未交量',width:120},{key:'plannedDemand',label:'计划需求量'},
  {key:'totalRequired',label:'提报时总应消耗量'},{key:'staticDate',label:'静态提出日期',width:112},{key:'lastYearInbound',label:'近一年入库量'},
  {key:'lastYearOutbound',label:'近一年出库量'},{key:'responsibleUnit',label:'责任单位',width:130},{key:'staticReason',label:'静态原因',width:130},
  {key:'solution',label:'处理方案类型',width:130},{key:'opinion',label:'处理意见',width:280},{key:'solutionDepartment',label:'方案制定部门',width:130},{key:'expectedDate',label:'预计消耗完成时间',width:140},
  {key:'retainedQuantity',label:'留用数量'},{key:'retainedDate',label:'留用时间',width:112},{key:'expectedSampleDate',label:'预计打样完成时间',width:140},
];
const newStaticElectromechanicalColumns: Column[] = [
  {key:'material',label:'物料编码'},{key:'materialDescription',label:'物料描述',width:300},{key:'productionType',label:'产生类型'},
  {key:'materialGroup',label:'物料组'},
  {key:'materialGroupName',label:'物料组描述',width:220},{key:'factorySet',label:'工厂编码'},{key:'factoryName',label:'工厂描述',width:180},
  {key:'unit',label:'单位'},{key:'totalRequired',label:'提报时总应消耗量'},{key:'staticDate',label:'静态提出日期',width:112},
  {key:'lastYearInbound',label:'近一年入库量'},{key:'lastYearOutbound',label:'近一年出库量'},{key:'responsibleUnit',label:'责任单位',width:130},
  {key:'staticReason',label:'静态原因',width:130},{key:'solution',label:'处理方案类型',width:130},{key:'opinion',label:'处理意见',width:280},{key:'solutionDepartment',label:'方案制定部门',width:130},
  {key:'retainedQuantity',label:'留用数量'},{key:'retainedDate',label:'留用时间',width:112},
];
const newStaticBaseFilters: Filter[] = [{key:'staticDate',label:'静态提出日期',type:'month'},{key:'factoryName',label:'工厂描述',options:['板木公司供应工厂','定制公司供应工厂','清丰分公司供应工厂']},{key:'material',label:'物料编码',placeholder:'请输入物料编码'}];
const maintenanceFilters = (materialType: StaticMaterialType): Filter[] => [{key:'solution',label:'处理方案类型',options:configOptions(materialType, 'solution', true)},{key:'opinion',label:'处理意见',placeholder:'请输入处理意见'},{key:'responsibleUnit',label:'责任单位',placeholder:'请输入责任单位'},{key:'staticReason',label:'静态原因',options:configOptions(materialType, 'reason')}];
const newStaticTabs: Record<NewStaticTab, NewStaticTabConfig> = {
  static: { label:'静态材料', total:137, filters:[newStaticBaseFilters[0],newStaticBaseFilters[1],{key:'development',label:'开发类型',options:DEVELOPMENT_OPTIONS},{key:'category',label:'材料类别',options:['板材','封边带','五金','电器']},newStaticBaseFilters[2],...maintenanceFilters('static')], columns:newStaticStaticColumns, rows:baseRows.filter(row=>row.category !== '电器'), templateFields:['工厂编码','工厂描述','物料编码','物料描述','开发类型','责任单位','静态提出日期','处理方案类型','处理意见','方案制定部门','预计消耗完成时间','留用数量','留用时间','预计打样完成时间','静态原因'] },
  electromechanical: { label:'机电材料', total:28, filters:[...newStaticBaseFilters,...maintenanceFilters('electromechanical')], columns:newStaticElectromechanicalColumns, rows:baseRows.filter(row=>row.category === '电器'), templateFields:['工厂编码','工厂描述','物料编码','物料描述','责任单位','静态提出日期','处理方案类型','处理意见','方案制定部门','留用数量','留用时间','静态原因'] },
};
const electromechanicalConsumptionColumns: Column[] = [
  {key:'material',label:'物料编码'},{key:'materialDescription',label:'物料描述',width:300},{key:'productionType',label:'产生类型'},{key:'factoryName',label:'工厂描述',width:180},
  {key:'development',label:'对应开发'},{key:'category',label:'材料类别'},{key:'unitName',label:'单位名称'},
  {key:'reportedStock',label:'提报时总应消耗量',width:140},{key:'availableStock',label:'现可用库存',width:120},{key:'totalRequired',label:'当前应消耗总量'},
  {key:'staticDate',label:'静态提出日期',width:112},{key:'received',label:'是否入库'},
  {key:'receivedQuantity',label:'入库数量'},{key:'responsibleUnit',label:'责任单位',width:130},{key:'staticReason',label:'静态原因',width:130},
  {key:'solution',label:'处理方案类型',width:130},{key:'opinion',label:'处理意见',width:280},{key:'retainedQuantity',label:'留用数量'},
  {key:'retainedDate',label:'留用时间',width:112},{key:'totalOutbound',label:'总出库量'},{key:'outboundRatio',label:'总出库比例'},
];
const staticConsumptionColumns: Column[] = [
  {key:'material',label:'物料编码'},{key:'materialDescription',label:'物料描述',width:300},{key:'productionType',label:'产生类型'},{key:'factoryName',label:'工厂描述',width:180},
  {key:'development',label:'开发类型'},{key:'category',label:'材料类别'},{key:'unit',label:'单位'},
  {key:'reportedStock',label:'提报时总应消耗量',width:140},{key:'availableStock',label:'现可用库存',width:120},{key:'supplierUnreceived',label:'当前供应商未交量',width:120},
  {key:'plannedDemand',label:'当前计划需求量'},{key:'totalRequired',label:'当前应消耗总量'},{key:'staticDate',label:'静态提出日期',width:112},
  {key:'solution',label:'处理方案类型',width:130},{key:'opinion',label:'处理意见',width:280},{key:'responsibleUnit',label:'责任单位',width:130},{key:'staticReason',label:'静态原因',width:130},{key:'staticMonths',label:'静态月数'},
  {key:'receivedQuantity',label:'入库数量'},{key:'totalOutbound',label:'总出库量'},{key:'outboundRatio',label:'总出库比例'},
  {key:'retainedQuantity',label:'留用数量'},{key:'retainedDate',label:'留用时间',width:112},{key:'expectedSampleDate',label:'预计打样完成时间',width:140},
  {key:'expectedDate',label:'预计消耗完成时间',width:140},
];
const warningColumns: Column[] = [
  {key:'factoryName',label:'工厂',width:180},{key:'category',label:'材料类别'},{key:'warehouseName',label:'库存地点',width:220},
  {key:'material',label:'物料编码'},{key:'materialDescription',label:'物料名称',width:280},{key:'development',label:'对应开发'},
  {key:'totalRequired',label:'提报时总应消耗量'},{key:'currentStock',label:'现可用库存'},{key:'unitName',label:'单位'},
  {key:'staticReason',label:'静态原因',width:130},{key:'solution',label:'处理方案类型',width:130},{key:'solutionDepartment',label:'方案制定部门',width:130},{key:'retainedQuantity',label:'留用数量'},
  {key:'retainedDate',label:'留用时间',width:112},{key:'opinion',label:'处理意见',width:280},{key:'totalOutbound',label:'总出库量'},
  {key:'outboundRatio',label:'出库比例'},{key:'retention',label:'留存率'},{key:'warningLevel',label:'警报级别'},
  {key:'staticDate',label:'呆滞提出时间',width:120},{key:'staticMonths',label:'静态月数'},
];
const reports: Record<StaticReportId, ReportConfig> = {
  strategic: { title:'战略备料表', total:86, columns:strategicColumns, filters:[{key:'category',label:'材料类别',options:['五金','板材','封边带']},{key:'materialCode',label:'物料编码',placeholder:'请输入物料编码'},{key:'materialDescription',label:'物料描述',placeholder:'请输入物料描述'},{key:'preparationDays',label:'备料天数',options:['20天','30天','45天','60天']},{key:'supplyDays',label:'可供应天数',options:['30天以内','30-60天','60天以上']}], rows:strategicRows },
  special: { title:'专项备料表', total:42, columns:strategicColumns, filters:[{key:'category',label:'材料类别',options:['刀具','电器','五金']},{key:'materialCode',label:'物料编码',placeholder:'请输入物料编码'},{key:'materialDescription',label:'物料描述',placeholder:'请输入物料描述'},{key:'preparationDays',label:'备料天数',options:['20天','30天','45天','60天']},{key:'supplyDays',label:'可供应天数',options:['30天以内','30-60天','60天以上']}], rows:specialRows },
  'strategic-special-base': { title:'战略和专项材料备料基础数据', total:12846, columns:strategicSpecialBaseColumns, filters:[{key:'version',label:'数据版本',options:['V20260813-003','V20260813-002','V20260812-001']},{key:'materialCode',label:'物料编码',placeholder:'请输入物料编码'},{key:'materialDescription',label:'物料描述',placeholder:'请输入物料描述'},{key:'materialType',label:'物料类型',options:['战略','专项']},{key:'status',label:'状态',options:['有效','失效']},{key:'changeType',label:'对比上次版本',options:['保持','新增','移除']}], rows:strategicSpecialVersionRows['V20260813-003'] },
  'new-static': { title:'新增静态物料表', ...newStaticTabs.static },
  electromechanical: { title:'机电材料跟踪消耗报表', total:84, filters:[{key:'staticDate',label:'静态提出日期',type:'month'},{key:'factoryName',label:'工厂描述',options:['定制公司供应工厂','板木公司供应工厂','清丰分公司供应工厂']},{key:'material',label:'物料编码',placeholder:'请输入物料编码'},{key:'development',label:'对应开发',options:['定制','板木','软体','配套']},{key:'category',label:'材料类别',options:['板材','封边带','五金','电器']},{key:'solution',label:'处理方案类型',options:configOptions('electromechanical', 'solution', true)}], columns:electromechanicalConsumptionColumns, rows:baseRows.filter(row=>row.category === '电器') },
  'static-consumption': { title:'静态材料跟踪消耗报表', total:126, filters:[{key:'staticDate',label:'静态提出日期',type:'month'},{key:'factoryName',label:'工厂描述',options:['定制公司供应工厂','板木公司供应工厂','清丰分公司供应工厂']},{key:'development',label:'开发类型',options:['定制','板木','软体','配套']},{key:'category',label:'材料类别',options:['板材','封边带','五金','电器']},{key:'material',label:'物料编码',placeholder:'请输入物料编码'},{key:'solution',label:'处理方案类型',options:commonSolutions}], columns:staticConsumptionColumns, rows:baseRows },
  warning: { title:'静态物料警报表', total:2117, filters:[{key:'factoryName',label:'工厂',options:['定制公司供应工厂','板木公司供应工厂','清丰分公司供应工厂']},{key:'development',label:'对应开发',options:['定制','板木','软体','配套']},{key:'category',label:'材料类别',options:['五金','板材','封边带','电器']},{key:'material',label:'物料编码',placeholder:'请输入物料编码'},{key:'solution',label:'处理方案类型',options:commonSolutions},{key:'staticMonths',label:'静态月数区间',options:['0-6个月','7-12个月','13-24个月','24个月以上']},{key:'retention',label:'留存率区间',options:['0-10%','10-30%','30-60%','60-90%','90-100%']},{key:'warningLevel',label:'警报级别',options:['高危','警报','预警','正常']}], columns:warningColumns, rows:baseRows.map((row,index)=>({...row,staticMonths:[78,77,9,8,6][index],retention:['8.74%','93.68%','90.00%','90.00%','100.00%'][index],warningLevel:['高危','高危','预警','预警','正常'][index]})) },
};

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const emptyFilters = (config: ReportConfig) => Object.fromEntries(config.filters.map(filter => [filter.key, filter.type === 'month' ? currentMonth() : '']));

export const staticReportMenu = (Object.entries(reports) as [StaticReportId, ReportConfig][]).map(([id, config]) => ({ id, title: config.title }));

export default function StaticMaterialReports({ reportId }: { reportId: StaticReportId }) {
  const config = reports[reportId];
  const [newStaticTab, setNewStaticTab] = useState<NewStaticTab>('static');
  const activeConfig = reportId === 'new-static' ? newStaticTabs[newStaticTab] : config;
  const [draft, setDraft] = useState<Record<string,string>>(() => emptyFilters(activeConfig));
  const [applied, setApplied] = useState<Record<string,string>>(() => emptyFilters(activeConfig));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [toast, setToast] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('solution');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [pendingDataDownloaded, setPendingDataDownloaded] = useState(false);
  const [historyOverrides, setHistoryOverrides] = useState<Record<string, ChangeRecord[]>>({});
  const [rowUpdates, setRowUpdates] = useState<Record<string, Partial<Row>>>({});
  const [developmentOverrides, setDevelopmentOverrides] = useState<Record<string, string>>({});
  const [pendingDevelopments, setPendingDevelopments] = useState<Record<string, string>>({});
  const [editingDevelopments, setEditingDevelopments] = useState<Record<string, boolean>>({});
  const [pendingResponsibleUnits, setPendingResponsibleUnits] = useState<Record<string, string>>({});
  const [editingResponsibleUnits, setEditingResponsibleUnits] = useState<Record<string, boolean>>({});
  const [historyDialog, setHistoryDialog] = useState<{ material: string; records: ChangeRecord[] } | null>(null);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('V20260813-003');

  React.useEffect(() => { setNewStaticTab('static'); }, [reportId]);
  React.useEffect(() => { const next=emptyFilters(activeConfig); if (reportId === 'strategic-special-base') next.version = selectedVersion; setDraft(next); setApplied(next); setPage(1); setToast(''); setImportOpen(false); setImportFile(null); setImportError(''); setHistoryDialog(null); setVersionDrawerOpen(false); }, [reportId, newStaticTab, activeConfig, selectedVersion]);
  const reportRows = useMemo(() => {
    if (reportId === 'strategic-special-base') {
      const versionOrder = ['V20260812-001', 'V20260813-002', 'V20260813-003'];
      const versionIndex = versionOrder.indexOf(selectedVersion);
      const currentRows = strategicSpecialVersionRows[selectedVersion] ?? [];
      const previousRows = versionIndex > 0 ? strategicSpecialVersionRows[versionOrder[versionIndex - 1]] ?? [] : [];
      const previousCodes = new Set(previousRows.map(row => String(row.materialCode)));
      const currentCodes = new Set(currentRows.map(row => String(row.materialCode)));
      const activeRows = currentRows.map(row => ({ ...row, versionNo:selectedVersion, changeType: previousRows.length ? (previousCodes.has(String(row.materialCode)) ? '保持' : '新增') : '' }));
      const removedRows = previousRows.filter(row => !currentCodes.has(String(row.materialCode))).map(row => ({ ...row, status:'失效', versionNo:selectedVersion, changeType:'移除' }));
      return [...activeRows, ...removedRows];
    }
    return activeConfig.rows.map(row => {
      const key = recordKey(row);
      const calculated = calculatedDevelopmentType(row, activeConfig.rows);
      const merged = { ...row, development: developmentOverrides[key] ?? calculated, ...rowUpdates[key] };
      const solution = String(merged.solution ?? '').trim() || DEFAULT_SOLUTION;
      const usesSampleDate = solution === '开发新品' || solution === '开发特款';
      const reportedTotalRequired = Number(merged.reportedStock ?? 0);
      const totalOutbound = Number(merged.totalOutbound ?? 0);
      const outboundRatio = reportedTotalRequired > 0 ? `${(totalOutbound / reportedTotalRequired * 100).toFixed(2)}%` : '0.00%';
      return { ...merged, outboundRatio, expectedDate:usesSampleDate ? '' : merged.expectedDate, expectedSampleDate:usesSampleDate ? merged.expectedSampleDate : '', changeHistory: historyOverrides[key] ?? row.changeHistory ?? [] };
    });
  }, [activeConfig, developmentOverrides, historyOverrides, reportId, rowUpdates, selectedVersion]);
  const rows = useMemo(() => reportRows.filter(row => activeConfig.filters.every(filter => {
    const query = applied[filter.key];
    if (!query) return true;
    if (reportId === 'strategic-special-base' && filter.key === 'version') return true;
    if (filter.key === 'supplyDays') { const value = Number(row.supplyDays); return query === '30天以内' ? value < 30 : query === '30-60天' ? value >= 30 && value <= 60 : value > 60; }
    if (filter.key === 'staticMonths') { const value=Number(row.staticMonths); return query === '0-6个月' ? value <= 6 : query === '7-12个月' ? value >= 7 && value <= 12 : query === '13-24个月' ? value >= 13 && value <= 24 : value > 24; }
    if (filter.key === 'retention') { const value=parseFloat(String(row.retention ?? '0')); const [min,max]=query.replace('%','').split('-').map(Number); return value >= min && value <= max; }
    if (filter.key === 'solution') return (String(row.solution ?? '').trim() || DEFAULT_SOLUTION).includes(query);
    if (filter.type === 'month') return String(row[filter.key] ?? '').startsWith(query);
    return String(row[filter.key] ?? '').includes(query);
  })), [applied, activeConfig, reportRows]);
  const total = rows.length ? activeConfig.total : 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const versions = [
    { id:'V20260813-003', time:'2026-08-13 10:32:18', count:'12,846', status:'传输成功', latest:true },
    { id:'V20260813-002', time:'2026-08-13 08:17:46', count:'12,839', status:'传输成功' },
    { id:'V20260812-001', time:'2026-08-12 08:16:03', count:'12,804', status:'传输成功' },
  ];
  const downloadPendingImportData = () => {
    if (reportId === 'new-static' && importMode === 'solution' && newStaticTab === 'static') {
      const missingMaterials = Array.from(new Set(reportRows
        .filter(row => !String(row.development ?? '').trim() || !String(row.responsibleUnit ?? '').trim())
        .map(row => String(row.material ?? '').trim())
        .filter(Boolean)));
      if (missingMaterials.length) {
        setImportError(`${missingMaterials.join('，')}（物料编码）当前还未维护责任单位或者开发类型，请维护后重新下载！`);
        return;
      }
    }
    setImportError('');
    const fields = importMode === 'responsible-unit'
      ? newStaticTab === 'electromechanical' ? ['工厂编码','工厂描述','物料编码','物料描述','责任单位','静态提出日期'] : ['工厂编码','工厂描述','物料编码','物料描述','开发类型','责任单位','静态提出日期']
      : reportId === 'new-static' ? newStaticTabs[newStaticTab].templateFields : [];
    const pendingRows = reportRows.filter(row => importMode === 'responsible-unit'
      ? !String(row.responsibleUnit ?? '').trim() || (newStaticTab !== 'electromechanical' && !String(row.development ?? '').trim())
      : !String(row.solution ?? '').trim());
    const dataRows = pendingRows.map(row => Object.fromEntries(fields.map(field => [field, row[importFieldKey[field]] ?? ''])));
    const materialType: StaticMaterialType = newStaticTab === 'electromechanical' ? 'electromechanical' : 'static';
    const validations = importMode === 'responsible-unit' && newStaticTab !== 'electromechanical'
      ? [{ field:'开发类型', values:DEVELOPMENT_OPTIONS, errorTitle:'开发类型无效', errorMessage:'请选择板木、软体或定制，且不能为空' }]
      : importMode === 'solution'
        ? [
            { field:'处理方案类型', values:configOptions(materialType, 'solution'), errorTitle:'处理方案无效', errorMessage:`请选择配置中心启用的${newStaticTabs[newStaticTab].label}处理方案` },
            { field:'静态原因', values:configOptions(materialType, 'reason'), errorTitle:'静态原因无效', errorMessage:`请选择配置中心启用的${newStaticTabs[newStaticTab].label}静态原因` },
          ] : [];
    const editableFields = importMode === 'responsible-unit'
      ? newStaticTab === 'electromechanical' ? ['责任单位'] : ['开发类型','责任单位']
      : fields.filter(field => !['工厂编码','工厂描述','物料编码','物料描述','开发类型','责任单位','静态提出日期'].includes(field));
    const url = URL.createObjectURL(createXlsxTemplate(fields, dataRows[0] ?? {}, validations, dataRows, editableFields));
    const link = document.createElement('a');
    link.href = url;
    link.download = `新增${reportId === 'new-static' ? newStaticTabs[newStaticTab].label : ''}${importMode === 'responsible-unit' ? '责任单位待导入数据' : '处理方案待导入数据'}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    setPendingDataDownloaded(true);
    flash(pendingRows.length ? `已下载 ${pendingRows.length} 条待导入数据` : '当前没有待导入数据，已下载空模板');
  };
  const confirmImport = async () => {
    if (!pendingDataDownloaded) { setImportError('请先下载当前待导入数据，再上传处理后的文件。'); return; }
    if (!importFile) { flash('请选择导入文件'); return; }
    setImportError('');
    if (importFile.name.toLowerCase().endsWith('.csv')) {
      const lines = (await importFile.text()).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
      const headers = lines[0]?.split(',').map(value=>value.trim()) || [];
      const expectedFields = importMode === 'responsible-unit'
        ? newStaticTab === 'electromechanical' ? ['工厂编码','工厂描述','物料编码','物料描述','责任单位','静态提出日期'] : ['工厂编码','工厂描述','物料编码','物料描述','开发类型','责任单位','静态提出日期']
        : newStaticTabs[newStaticTab].templateFields;
      if (headers.length !== expectedFields.length || headers.some((header,index)=>header !== expectedFields[index])) {
        setImportError(`导入文件列名或列顺序已变更，请保持模板固定顺序：${expectedFields.join('、')}。`);
        return;
      }
      const materialIndex = headers.indexOf('物料编码');
      const factoryIndex = headers.indexOf('工厂编码');
      const staticDateIndex = headers.indexOf('静态提出日期');
      const importKeys = new Set<string>();
      for (const line of lines.slice(1)) {
        const values = line.split(',').map(value=>value.trim());
        const key = `${values[materialIndex]}|${values[factoryIndex]}|${values[staticDateIndex]}`;
        if (!values[materialIndex] || !values[factoryIndex] || !values[staticDateIndex]) { setImportError('物料编码、分厂编码（工厂编码）和静态提出日期不能为空。'); return; }
        if (importKeys.has(key)) { setImportError(`物料编码 ${values[materialIndex]}、分厂编码 ${values[factoryIndex]}、静态提出日期 ${values[staticDateIndex]} 存在重复数据。`); return; }
        importKeys.add(key);
      }
      if (importMode === 'responsible-unit') {
        const developmentIndex = headers.indexOf('开发类型');
        const responsibleUnitIndex = headers.indexOf('责任单位');
        if (factoryIndex < 0 || materialIndex < 0 || responsibleUnitIndex < 0 || (newStaticTab !== 'electromechanical' && developmentIndex < 0)) { setImportError(newStaticTab === 'electromechanical' ? '责任单位导入文件必须包含“工厂编码”“物料编码”和“责任单位”。' : '责任单位导入文件必须包含“工厂编码”“物料编码”“开发类型”和“责任单位”。'); return; }
        const nextUpdates = { ...rowUpdates };
        for (const line of lines.slice(1)) {
          const values = line.split(',').map(value=>value.trim());
          const material = values[materialIndex];
          const development = developmentIndex >= 0 ? values[developmentIndex] : '';
          const responsibleUnit = values[responsibleUnitIndex];
          const row = reportRows.find(item=>newStaticImportKey(item) === `${material}|${values[factoryIndex]}|${values[staticDateIndex]}`);
          if (!row) continue;
          if (!responsibleUnit || (newStaticTab !== 'electromechanical' && !development)) { setImportError(`工厂 ${row.factorySet}、物料编码 ${material} 的${newStaticTab === 'electromechanical' ? '责任单位' : '开发类型和责任单位'}不能为空，请补充后重新导入。`); return; }
          if (newStaticTab !== 'electromechanical' && !DEVELOPMENT_OPTIONS.includes(development)) { setImportError(`工厂 ${row.factorySet}、物料编码 ${material} 的开发类型“${development}”无效，请选择板木、软体或定制。`); return; }
          nextUpdates[recordKey(row)] = { ...nextUpdates[recordKey(row)], ...(newStaticTab === 'electromechanical' ? {} : { development }), responsibleUnit };
        }
        setRowUpdates(nextUpdates);
        setImportOpen(false);
        flash(`${importFile.name} 已提交责任单位导入`);
        return;
      }
      const solutionIndex = headers.indexOf('处理方案类型');
      const opinionIndex = headers.indexOf('处理意见');
      const solutionDepartmentIndex = headers.indexOf('方案制定部门');
      if (factoryIndex < 0 || materialIndex < 0 || solutionIndex < 0 || solutionDepartmentIndex < 0) { setImportError('处理方案导入文件必须包含“工厂编码”“物料编码”“处理方案类型”和“方案制定部门”。'); return; }
      const nextHistory = { ...historyOverrides };
      const nextUpdates = { ...rowUpdates };
      for (const line of lines.slice(1)) {
        const values = line.split(',').map(value=>value.trim());
        const material = values[materialIndex];
        const row = reportRows.find(item=>newStaticImportKey(item) === `${material}|${values[factoryIndex]}|${values[staticDateIndex]}`);
        if (!row) continue;
        const key = recordKey(row);
        const readField = (label: string, fallback: unknown) => { const index=headers.indexOf(label); return index >= 0 ? values[index] : fallback; };
        const currentSolution = String(nextUpdates[key]?.solution ?? row.solution ?? '').trim() || DEFAULT_SOLUTION;
        const currentOpinion = String(nextUpdates[key]?.opinion ?? row.opinion ?? '').trim();
        const solution = solutionIndex >= 0 ? (values[solutionIndex] || currentSolution) : currentSolution;
        const opinion = opinionIndex >= 0 ? (values[opinionIndex] || currentOpinion) : currentOpinion;
        const staticReason = String(readField('静态原因', row.staticReason) ?? '').trim();
        const importMaterialType: StaticMaterialType = newStaticTab === 'electromechanical' ? 'electromechanical' : 'static';
        const allowedSolutions = configOptions(importMaterialType, 'solution');
        const allowedReasons = configOptions(importMaterialType, 'reason');
        if (solutionIndex >= 0 && values[solutionIndex] && !allowedSolutions.includes(solution)) { setImportError(`工厂 ${row.factorySet}、物料编码 ${material} 的处理方案类型“${solution}”不在${newStaticTabs[newStaticTab].label}配置启用项中。`); return; }
        if (staticReason && !allowedReasons.includes(staticReason)) { setImportError(`工厂 ${row.factorySet}、物料编码 ${material} 的静态原因“${staticReason}”不在${newStaticTabs[newStaticTab].label}配置启用项中。`); return; }
        const changedSolution = solution !== currentSolution || opinion !== currentOpinion;
        if (changedSolution) {
          const records = nextHistory[key] ?? row.changeHistory ?? [];
          if (records.length >= 2) { setImportError(`工厂 ${row.factorySet}、物料编码 ${material} 的处理方案类型已累计变更 2 次，不能继续导入更新。`); return; }
          nextHistory[key] = [...records, { solution, opinion, updatedBy:'王俊励', updatedAt:new Date().toLocaleString('zh-CN', { hour12:false }).replace(/\//g,'-') }];
        }
        const usesSampleDate = solution === '开发新品' || solution === '开发特款';
        const usesRetention = solution === '生产留用' || solution === '售后留用';
        nextUpdates[key] = {
          ...nextUpdates[key],
          solution,
          opinion,
          solutionDepartment:readField('方案制定部门', row.solutionDepartment),
          staticReason,
          retainedQuantity:usesRetention ? readField('留用数量', row.retainedQuantity) : '',
          retainedDate:usesRetention ? readField('留用时间', row.retainedDate) : '',
          expectedDate:usesSampleDate ? '' : readField('预计消耗完成时间', row.expectedDate),
          expectedSampleDate:usesSampleDate ? readField('预计打样完成时间', row.expectedSampleDate) : '',
        };
      }
      setHistoryOverrides(nextHistory);
      setRowUpdates(nextUpdates);
    }
    setImportOpen(false);
    flash(`${importFile.name} 已提交处理方案导入`);
  };
  const downloadReportExport = () => {
    const fields = activeConfig.columns.map(column => column.label);
    const dataRows = rows.map(row => Object.fromEntries(activeConfig.columns.map(column => [column.label, column.key === 'solution' ? (String(row[column.key] ?? '').trim() || DEFAULT_SOLUTION) : row[column.key] ?? ''])));
    const url = URL.createObjectURL(createXlsxTemplate(fields, dataRows[0] ?? {}, [], dataRows, []));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.title}${reportId === 'new-static' ? `-${newStaticTabs[newStaticTab].label}` : ''}查询结果.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    flash(`已导出 ${rows.length} 条查询结果，数据列已锁定`);
  };

  return <section className="static-report-page" aria-label={config.title}>
    {reportId === 'new-static' && <nav className="static-report-tabs" aria-label="新增静态物料分类">{(Object.entries(newStaticTabs) as [NewStaticTab, NewStaticTabConfig][]).map(([id, tab])=><button key={id} type="button" className={newStaticTab === id ? 'active' : ''} onClick={()=>setNewStaticTab(id)}>{tab.label}</button>)}</nav>}
    <section className="static-report-filters" aria-label="查询条件">
      {activeConfig.filters.map(filter => <label key={filter.key}><span>{filter.label}</span>{filter.options ? <select value={draft[filter.key]} onChange={event=>setDraft(current=>({...current,[filter.key]:event.target.value}))}><option value="">全部</option>{filter.options.map(option=><option key={option}>{option}</option>)}</select> : filter.type === 'month' ? <div className="static-report-month-control"><input type="month" value={draft[filter.key]} disabled={!draft[filter.key]} onChange={event=>setDraft(current=>({...current,[filter.key]:event.target.value}))}/><div className="static-report-all-time"><input aria-label="全部时间" type="checkbox" checked={!draft[filter.key]} onChange={event=>setDraft(current=>({...current,[filter.key]:event.target.checked ? '' : currentMonth()}))}/><span>全部时间</span></div></div> : <input type={filter.type === 'date' ? 'date' : 'text'} value={draft[filter.key]} placeholder={filter.placeholder || '请选择'} onChange={event=>setDraft(current=>({...current,[filter.key]:event.target.value}))}/>}</label>)}
      <div className="static-report-actions"><button type="button" className="query" onClick={()=>{setApplied(draft);setPage(1);flash('查询完成');}}><Search size={14}/>查询</button><button type="button" className="reset" onClick={()=>{const next=emptyFilters(activeConfig);setDraft(next);setApplied(next);setPage(1);}}><RotateCcw size={14}/>重置</button></div>
    </section>
    <section className="static-report-table-panel">
      <div className="static-report-toolbar"><div className="static-report-toolbar-context">{reportId === 'strategic-special-base' && <><span>当前版本</span><b>{selectedVersion}</b><i>全量快照</i></>}</div><div className="static-report-toolbar-actions">{(reportId === 'strategic' || reportId === 'special') && <span className="static-report-data-updated-at"><span>数据更新时间：</span><b>{strategicDataUpdatedAt[reportId]}</b></span>}{reportId === 'strategic-special-base' && <button type="button" className="static-report-version-button" onClick={()=>setVersionDrawerOpen(true)}><History size={14}/>版本记录</button>}{reportId === 'new-static' && <><button type="button" className="static-report-import-button" onClick={()=>{setImportMode('solution');setPendingDataDownloaded(false);setImportFile(null);setImportError('');setImportOpen(true)}}><Upload size={14}/>导入处理方案</button><button type="button" className="static-report-import-button secondary" onClick={()=>{setImportMode('responsible-unit');setPendingDataDownloaded(false);setImportFile(null);setImportError('');setImportOpen(true)}}><Upload size={14}/>导入责任单位</button></>}<button type="button" onClick={downloadReportExport}><Download size={14}/>导出</button></div></div>
      <div className="static-report-table-scroll"><table><thead><tr><th className="row-number">序号</th>{activeConfig.columns.map(column=><th key={column.key} style={{width:column.width,minWidth:column.width}}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={`${recordKey(row)}-${index}`}><td className="row-number">{index+1}</td>{activeConfig.columns.map(column=>{ const key = recordKey(row); const cellValue = column.key === 'solution' ? (String(row.solution ?? '').trim() || DEFAULT_SOLUTION) : row[column.key]; const history = row.changeHistory ?? []; const isChangeCell = ['new-static','electromechanical','static-consumption'].includes(reportId) && history.length > 0 && (column.key === 'solution' || column.key === 'opinion'); const isDevelopmentCell = reportId === 'new-static' && column.key === 'development'; const isResponsibleUnitCell = reportId === 'new-static' && column.key === 'responsibleUnit'; const pendingResponsibleUnit = pendingResponsibleUnits[key]; const currentResponsibleUnit = String(row.responsibleUnit ?? ''); const isResponsibleUnitEditing = editingResponsibleUnits[key] === true || pendingResponsibleUnit !== undefined; const pending = pendingDevelopments[key]; const currentDevelopment = String(row.development ?? ''); const isEditing = editingDevelopments[key] === true || pending !== undefined; const showEditor = isDevelopmentCell && isEditing; const saveDevelopment = () => { if (!pending) return; setDevelopmentOverrides(current=>({...current,[key]:pending})); setPendingDevelopments(current=>{const next={...current};delete next[key];return next;}); setEditingDevelopments(current=>{const next={...current};delete next[key];return next;}); flash('开发类型已保存'); }; const cancelDevelopment = () => { setPendingDevelopments(current=>{const next={...current};delete next[key];return next;}); setEditingDevelopments(current=>{const next={...current};delete next[key];return next;}); }; return <td key={column.key} style={{width:column.width,minWidth:column.width}} className={`${column.key === 'warningLevel' ? `warning-${row[column.key]}` : ''} ${isChangeCell ? 'static-report-changed-cell' : ''}`}>{isChangeCell ? <button type="button" onClick={()=>setHistoryDialog({ material:`${row.factorySet} / ${row.material}`, records:history })}>{String(cellValue ?? '')}</button> : showEditor ? <div className="static-report-development-editor"><select className="static-report-development-select" aria-label={`维护物料 ${row.factorySet} ${row.material} 开发类型`} value={pending ?? currentDevelopment} onChange={event=>setPendingDevelopments(current=>({...current,[key]:event.target.value}))}>{!currentDevelopment && <option value="" disabled>请选择</option>}{DEVELOPMENT_OPTIONS.map(option=><option key={option}>{option}</option>)}</select><span><button type="button" className="save" disabled={!pending} onClick={saveDevelopment}>保存</button><button type="button" className="cancel" onClick={cancelDevelopment}>取消</button></span></div> : isResponsibleUnitCell && isResponsibleUnitEditing ? <div className="static-report-responsible-editor"><input value={pendingResponsibleUnit ?? currentResponsibleUnit} onChange={event=>setPendingResponsibleUnits(current=>({...current,[key]:event.target.value}))}/><span><button type="button" className="save" disabled={!String(pendingResponsibleUnit ?? '').trim()} onClick={()=>{const value=String(pendingResponsibleUnit ?? '').trim();if(!value)return;setRowUpdates(current=>({...current,[key]:{...current[key],responsibleUnit:value}}));setPendingResponsibleUnits(current=>{const next={...current};delete next[key];return next;});setEditingResponsibleUnits(current=>{const next={...current};delete next[key];return next;});flash('责任单位已保存');}}>保存</button><button type="button" className="cancel" onClick={()=>{setPendingResponsibleUnits(current=>{const next={...current};delete next[key];return next;});setEditingResponsibleUnits(current=>{const next={...current};delete next[key];return next;});}}>取消</button></span></div> : isResponsibleUnitCell ? <div className="static-report-development-display"><span className={!currentResponsibleUnit ? 'unmaintained' : ''}>{currentResponsibleUnit || '未维护'}</span><button type="button" title="维护责任单位" onClick={()=>setEditingResponsibleUnits(current=>({...current,[key]:true}))}><Pencil size={12}/></button></div> : isDevelopmentCell ? <div className="static-report-development-display"><span className={!currentDevelopment ? 'unmaintained' : ''}>{currentDevelopment || '未维护'}</span><button type="button" title="维护开发类型" aria-label={`维护物料 ${row.factorySet} ${row.material} 开发类型`} onClick={()=>setEditingDevelopments(current=>({...current,[key]:true}))}><Pencil size={12}/></button></div> : cellValue ?? '-'}</td>; })}</tr>)}{!rows.length&&<tr><td className="static-report-empty" colSpan={activeConfig.columns.length+1}>暂无匹配记录</td></tr>}</tbody></table></div>
      <footer className="static-report-pagination"><span>共 {total} 条记录</span><div><select value={pageSize} onChange={event=>{setPageSize(Number(event.target.value));setPage(1);}}><option value="20">20 条/页</option><option value="50">50 条/页</option><option value="100">100 条/页</option></select><button type="button" aria-label="上一页" disabled={page===1} onClick={()=>setPage(value=>Math.max(1,value-1))}><ChevronLeft size={14}/></button>{Array.from({length:Math.min(pageCount,5)},(_,index)=>index+1).map(value=><button type="button" key={value} className={page===value?'current':''} onClick={()=>setPage(value)}>{value}</button>)}{pageCount>5&&<><span>...</span><button type="button" className={page===pageCount?'current':''} onClick={()=>setPage(pageCount)}>{pageCount}</button></>}<button type="button" aria-label="下一页" disabled={page===pageCount} onClick={()=>setPage(value=>Math.min(pageCount,value+1))}><ChevronRight size={14}/></button><span>第 {page} / {pageCount} 页</span></div></footer>
    </section>
    {importOpen && <div className="static-report-import-backdrop" onMouseDown={event=>event.target === event.currentTarget && setImportOpen(false)}><section className="static-report-import-dialog" role="dialog" aria-modal="true" aria-labelledby="static-import-title"><header><strong id="static-import-title">{importMode === 'responsible-unit' ? '导入责任单位' : '导入处理方案'}</strong><button type="button" aria-label="关闭导入弹窗" onClick={()=>setImportOpen(false)}><X size={18}/></button></header><div className="static-report-import-body"><div className="static-report-import-file-row"><span>待导入数据</span><div><button type="button" className="static-report-template-link" onClick={downloadPendingImportData}><Download size={14}/>下载当前待导入数据</button><strong className={pendingDataDownloaded ? 'selected' : ''}>{pendingDataDownloaded ? '已下载，可上传处理后的文件' : '请先下载并维护当前待导入数据'}</strong></div></div><div className="static-report-import-file-row"><span>导入文件</span><div><label className="static-report-file-picker"><input type="file" disabled={!pendingDataDownloaded} accept=".xlsx,.xls,.csv" onChange={event=>{setImportFile(event.target.files?.[0] || null);setImportError('')}}/><Upload size={14}/><b>选择文件</b></label><strong className={importFile ? 'selected' : ''}>{importFile ? importFile.name : '支持 .xlsx、.xls、.csv 格式'}</strong></div></div><p>{importMode === 'responsible-unit' ? '下载责任单位或开发类型为空的当前数据后，必须同时填写开发类型和责任单位。系统按物料编码 + 分厂编码 + 静态提出日期更新，工厂描述与物料描述用于核对。' : `下载处理方案类型为空的当前数据后，填写处理方案类型、处理意见和方案制定部门。模板还包含：${reportId === 'new-static' && newStaticTabs[newStaticTab].templateFields.join('、')}。处理方案类型和静态原因仅可选择配置中心对应${newStaticTabs[newStaticTab].label}页面的启用项；处理方案类型或处理意见累计变更不得超过 2 次。`}</p>{importError && <div className="static-report-import-error" role="alert">{importError}</div>}</div><footer><button type="button" className="static-report-cancel-button" onClick={()=>setImportOpen(false)}>取消</button><button type="button" className="static-report-confirm-import" onClick={confirmImport}>确认导入</button></footer></section></div>}
    {historyDialog && <div className="static-report-history-backdrop" onMouseDown={event=>event.target === event.currentTarget && setHistoryDialog(null)}><section className="static-report-history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-title"><header><div><strong id="history-title">处理方案变更记录</strong><span>物料编码：{historyDialog.material}</span></div><button type="button" aria-label="关闭变更记录" onClick={()=>setHistoryDialog(null)}><X size={18}/></button></header><div><table><thead><tr><th>处理方案类型</th><th>处理意见</th><th>更新人</th><th>更新时间</th></tr></thead><tbody>{historyDialog.records.map((record,index)=><tr key={`${record.updatedAt}-${index}`}><td>{record.solution}</td><td>{record.opinion || '-'}</td><td>{record.updatedBy}</td><td>{record.updatedAt}</td></tr>)}</tbody></table></div><footer><button type="button" className="static-report-confirm-import" onClick={()=>setHistoryDialog(null)}>关闭</button></footer></section></div>}
    {versionDrawerOpen && <div className="static-report-version-backdrop" onMouseDown={event=>event.target === event.currentTarget && setVersionDrawerOpen(false)}><aside className="static-report-version-drawer" aria-label="传输版本记录"><header><div><strong>传输版本记录</strong><span>外围系统每次全量传输均生成独立版本</span></div><button type="button" aria-label="关闭版本记录" onClick={()=>setVersionDrawerOpen(false)}><X size={18}/></button></header><div className="static-report-version-list">{versions.map(version=><button type="button" key={version.id} className={selectedVersion === version.id ? 'active' : ''} onClick={()=>{setSelectedVersion(version.id); setDraft(current=>({...current,version:version.id})); setApplied(current=>({...current,version:version.id})); setVersionDrawerOpen(false); flash(`已切换至 ${version.id}`);}}><span className="static-report-version-dot"/><div><strong>{version.id}{version.latest && <em>当前</em>}</strong><span>{version.time}</span></div><small>{version.count} 条</small><b>{version.status}</b></button>)}</div><footer><span>保留所有成功传输的全量快照</span></footer></aside></div>}
    {toast&&<div className="static-report-toast" role="status">{toast}</div>}
  </section>;
}
