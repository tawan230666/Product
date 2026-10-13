import React, { createContext, useContext, ReactNode } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { MenuItem, Partner, DailySale, Employee, BusinessSettings } from '../types';

interface BusinessContextType {
  menuItems: MenuItem[];
  partners: Partner[];
  dailySales: DailySale[];
  employees: Employee[];
  settings: BusinessSettings;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  addPartner: (partner: Partner) => void;
  updatePartner: (id: string, partner: Partner) => void;
  deletePartner: (id: string) => void;
  addDailySale: (sale: DailySale) => void;
  updateDailySale: (date: string, sale: DailySale) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  updateSettings: (settings: BusinessSettings) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Demo menu shown on the first visit; afterwards everything comes from localStorage.
  const demoMenu: MenuItem[] = [
    { id: 'demo-1', name: 'ชาเย็น', price: 45, description: 'ชาไทยเย็น หวานมัน', emoji: '🧋' },
    { id: 'demo-2', name: 'กาแฟเย็น', price: 50, description: 'กาแฟสดคั่วเข้ม', emoji: '☕' },
    { id: 'demo-3', name: 'ขนมปังปิ้ง', price: 35, description: 'ขนมปังปิ้งเนยนม', emoji: '🍞' },
    { id: 'demo-4', name: 'ข้าวกะเพรา', price: 60, description: 'ข้าวกะเพราหมูสับไข่ดาว', emoji: '🍛' },
  ];

  const [menuItems, setMenuItems] = usePersistentState<MenuItem[]>('menuItems', demoMenu);
  const [partners, setPartners] = usePersistentState<Partner[]>('partners', []);
  const [dailySales, setDailySales] = usePersistentState<DailySale[]>('dailySales', []);
  const [employees, setEmployees] = usePersistentState<Employee[]>('employees', []);
  const [settings, setSettings] = usePersistentState<BusinessSettings>('settings', {
    customCosts: [
      { id: '1', name: 'ค่าน้ำ', amount: 0 },
      { id: '2', name: 'ค่าน้ำมัน', amount: 0 },
      { id: '3', name: 'ค่าเช่า', amount: 0 },
    ],
    reinvestmentPercentage: 20,
  });

  const addMenuItem = (item: MenuItem) => setMenuItems([...menuItems, item]);
  const updateMenuItem = (id: string, item: MenuItem) =>
    setMenuItems(menuItems.map((m) => (m.id === id ? item : m)));
  const deleteMenuItem = (id: string) => setMenuItems(menuItems.filter((m) => m.id !== id));

  const addPartner = (partner: Partner) => setPartners([...partners, partner]);
  const updatePartner = (id: string, partner: Partner) =>
    setPartners(partners.map((p) => (p.id === id ? partner : p)));
  const deletePartner = (id: string) => setPartners(partners.filter((p) => p.id !== id));

  const addDailySale = (sale: DailySale) => setDailySales([...dailySales, sale]);
  const updateDailySale = (date: string, sale: DailySale) =>
    setDailySales(dailySales.map((s) => (s.date === date ? sale : s)));

  const addEmployee = (employee: Employee) => setEmployees([...employees, employee]);
  const updateEmployee = (id: string, employee: Employee) =>
    setEmployees(employees.map((e) => (e.id === id ? employee : e)));
  const deleteEmployee = (id: string) => setEmployees(employees.filter((e) => e.id !== id));

  const updateSettings = (newSettings: BusinessSettings) => setSettings(newSettings);

  return (
    <BusinessContext.Provider
      value={{
        menuItems,
        partners,
        dailySales,
        employees,
        settings,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addPartner,
        updatePartner,
        deletePartner,
        addDailySale,
        updateDailySale,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateSettings,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within BusinessProvider');
  return context;
};
