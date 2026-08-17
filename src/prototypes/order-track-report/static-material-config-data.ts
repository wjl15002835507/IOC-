export type StaticConfigType = 'solution' | 'reason';
export type StaticMaterialType = 'static' | 'electromechanical';
export type StaticConfigItem = { id: number; name: string; enabled: boolean; createdAt: string; createdBy: string };
export type StaticMaterialConfigData = Record<StaticConfigType, Record<StaticMaterialType, StaticConfigItem[]>>;

export const STATIC_MATERIAL_CONFIG_STORAGE_KEY = 'ioc-static-material-config';

const makeItems = (names: string[]): StaticConfigItem[] => names.map((name, index) => ({
  id: index + 1,
  name,
  enabled: true,
  createdAt: '2026-08-14 09:00',
  createdBy: '王俊杰',
}));

export const defaultStaticMaterialConfig: StaticMaterialConfigData = {
  solution: {
    static: makeItems(['生产留用', '售后留用', '材料替换', '采购退货', '报废变卖', '开发新品', '开发特款']),
    electromechanical: makeItems(['生产留用']),
  },
  reason: {
    static: makeItems(['采购大于需求', '计划大于需求', '样品采购', '首批采购', '起订量采购', '停单扣款', '报废拆件', '材料退回', '物料替换', '分厂需求', '计划取消', '业务调整', '设备报废', '常规备料', '战略备料', '专项备料']),
    electromechanical: makeItems(['业务调整', '设备报废', '起订量采购', '物料替换', '材料退回']),
  },
};

const cloneDefaultConfig = () => JSON.parse(JSON.stringify(defaultStaticMaterialConfig)) as StaticMaterialConfigData;

export const readStaticMaterialConfig = (): StaticMaterialConfigData => {
  if (typeof window === 'undefined') return cloneDefaultConfig();
  try {
    const stored = window.localStorage.getItem(STATIC_MATERIAL_CONFIG_STORAGE_KEY);
    if (!stored) return cloneDefaultConfig();
    const parsed = JSON.parse(stored) as StaticMaterialConfigData;
    if (!parsed?.solution?.static || !parsed?.solution?.electromechanical || !parsed?.reason?.static || !parsed?.reason?.electromechanical) return cloneDefaultConfig();
    return parsed;
  } catch {
    return cloneDefaultConfig();
  }
};

export const saveStaticMaterialConfig = (data: StaticMaterialConfigData) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(STATIC_MATERIAL_CONFIG_STORAGE_KEY, JSON.stringify(data));
};

export const getEnabledConfigValues = (materialType: StaticMaterialType, configType: StaticConfigType) =>
  readStaticMaterialConfig()[configType][materialType].filter(item => item.enabled).map(item => item.name);
