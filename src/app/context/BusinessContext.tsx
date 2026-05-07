import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, DailySale, Partner, Employee, BusinessSettings } from '../types';

interface BusinessContextType {
  menuItems: MenuItem[];
  dailySales: DailySale[];
  partners: Partner[];
  employees: Employee[];
  settings: BusinessSettings;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  addDailySale: (sale: DailySale) => void;
  updateDailySale: (date: string, sale: DailySale) => void;
  addPartner: (partner: Partner) => void;
  updatePartner: (id: string, partner: Partner) => void;
  deletePartner: (id: string) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  updateSettings: (settings: BusinessSettings) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. ดึงข้อมูลจาก LocalStorage ตอนเปิดเว็บ (ถ้าเพิ่งเข้าครั้งแรก ให้ใช้ค่าว่าง)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('bizflow_menuItems');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailySales, setDailySales] = useState<DailySale[]>(() => {
    const saved = localStorage.getItem('bizflow_dailySales');
    return saved ? JSON.parse(saved) : [];
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('bizflow_partners');
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('bizflow_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('bizflow_settings');
    return saved ? JSON.parse(saved) : { reinvestmentPercentage: 0, customCosts: [] };
  });

  // 2. บันทึกข้อมูลลง LocalStorage ทันทีที่มีการเปลี่ยนแปลง
  useEffect(() => { localStorage.setItem('bizflow_menuItems', JSON.stringify(menuItems)); }, [menuItems]);
  useEffect(() => { localStorage.setItem('bizflow_dailySales', JSON.stringify(dailySales)); }, [dailySales]);
  useEffect(() => { localStorage.setItem('bizflow_partners', JSON.stringify(partners)); }, [partners]);
  useEffect(() => { localStorage.setItem('bizflow_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('bizflow_settings', JSON.stringify(settings)); }, [settings]);

  // --- Functions สำหรับจัดการข้อมูล ---
  const addMenuItem = (item: MenuItem) => setMenuItems([...menuItems, item]);
  const updateMenuItem = (id: string, item: MenuItem) => setMenuItems(menuItems.map(m => m.id === id ? item : m));
  const deleteMenuItem = (id: string) => setMenuItems(menuItems.filter(m => m.id !== id));

  const addDailySale = (sale: DailySale) => setDailySales([...dailySales, sale]);
  const updateDailySale = (date: string, sale: DailySale) => setDailySales(dailySales.map(s => s.date === date ? sale : s));

  const addPartner = (partner: Partner) => setPartners([...partners, partner]);
  const updatePartner = (id: string, partner: Partner) => setPartners(partners.map(p => p.id === id ? partner : p));
  const deletePartner = (id: string) => setPartners(partners.filter(p => p.id !== id));

  const addEmployee = (employee: Employee) => setEmployees([...employees, employee]);
  const updateEmployee = (id: string, employee: Employee) => setEmployees(employees.map(e => e.id === id ? employee : e));
  const deleteEmployee = (id: string) => setEmployees(employees.filter(e => e.id !== id));

  const updateSettings = (newSettings: BusinessSettings) => setSettings(newSettings);

  return (
    <BusinessContext.Provider value={{
      menuItems, dailySales, partners, employees, settings,
      addMenuItem, updateMenuItem, deleteMenuItem,
      addDailySale, updateDailySale,
      addPartner, updatePartner, deletePartner,
      addEmployee, updateEmployee, deleteEmployee,
      updateSettings
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};