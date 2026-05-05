import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Partner, DailySale, CustomCost, AccountEntry, DailyEntry } from '../types';
import { Button, TextField, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Tabs, Tab, Box, Divider } from '@mui/material';
import { Calendar, Plus, Sparkles, Edit2, Trash2, Settings, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export const CalculationPage: React.FC = () => {
  const { partners, dailySales, settings, employees, menuItems, addPartner, updatePartner, deletePartner, addDailySale, updateDailySale, updateSettings } = useBusiness();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState(0);
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingCost, setEditingCost] = useState<CustomCost | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', percentage: 0, image: '' });
  const [costForm, setCostForm] = useState({ name: '', amount: 0 });
  const [settingsForm, setSettingsForm] = useState(settings);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // ฟอร์มบันทึกรายรับ/รายจ่าย ประจำวัน
  const [dailyIncomes, setDailyIncomes] = useState<DailyEntry[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyEntry[]>([]);
  const currentSale = dailySales.find((s) => s.date === selectedDate);

  // โหลดข้อมูลรายวันเมื่อเปลี่ยนวันที่
  useEffect(() => {
    if (currentSale) {
      setDailyIncomes(currentSale.incomes || []);
      setDailyExpenses(currentSale.expenses || []);
    } else {
      setDailyIncomes([]);
      setDailyExpenses([]);
    }
  }, [selectedDate, currentSale]);

  const handleAddDailyEntry = (type: 'income' | 'expense') => {
    const newEntry: DailyEntry = { id: Date.now().toString(), name: '', amount: 0 };
    if (type === 'income') setDailyIncomes([...dailyIncomes, newEntry]);
    else setDailyExpenses([...dailyExpenses, newEntry]);
  };

  const handleUpdateDailyEntry = (type: 'income' | 'expense', id: string, field: 'name' | 'amount', value: any) => {
    if (type === 'income') {
      setDailyIncomes(dailyIncomes.map(item => item.id === id ? { ...item, [field]: value } : item));
    } else {
      setDailyExpenses(dailyExpenses.map(item => item.id === id ? { ...item, [field]: value } : item));
    }
  };

  const handleRemoveDailyEntry = (type: 'income' | 'expense', id: string) => {
    if (type === 'income') setDailyIncomes(dailyIncomes.filter(item => item.id !== id));
    else setDailyExpenses(dailyExpenses.filter(item => item.id !== id));
  };

  const handleSaveDailyData = () => {
    const sale: DailySale = {
      date: selectedDate,
      sales: currentSale?.sales || 0, // ยอดขายจาก POS ยังคงเดิม
      menuSales: currentSale?.menuSales || {},
      incomes: dailyIncomes.filter(i => i.name && i.amount > 0),
      expenses: dailyExpenses.filter(e => e.name && e.amount > 0),
    };
    
    if (currentSale) {
      updateDailySale(selectedDate, sale);
    } else {
      addDailySale(sale);
    }
    alert('บันทึกข้อมูลประจำวันสำเร็จ!');
  };

  // ----------------------------------------------------
  // ระบบหุ้นส่วนและการตั้งค่าต้นทุนหลัก
  // ----------------------------------------------------
  const handleAddPartner = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setPartnerForm({ name: partner.name, percentage: partner.percentage, image: partner.image || '' });
    } else {
      setEditingPartner(null);
      setPartnerForm({ name: '', percentage: 0, image: '' });
    }
    setPartnerDialogOpen(true);
  };

  const handleSavePartner = () => {
    const partner: Partner = {
      id: editingPartner?.id || Date.now().toString(),
      name: partnerForm.name,
      percentage: partnerForm.percentage,
      image: partnerForm.image || undefined,
    };
    if (editingPartner) {
      updatePartner(editingPartner.id, partner);
    } else {
      addPartner(partner);
    }
    setPartnerDialogOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPartnerForm({ ...partnerForm, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const calculateEmployeeDailyCost = () => {
    return employees.reduce((total, emp) => {
      if (emp.paymentType === 'daily') return total + emp.salary;
      if (emp.paymentType === 'monthly') return total + emp.salary / 30;
      if (emp.paymentType === 'yearly') return total + emp.salary / 365;
      return total;
    }, 0);
  };

  const getTotalCustomCosts = () => {
    return settings.customCosts.reduce((sum, cost) => sum + cost.amount, 0);
  };

  const handleAIAnalysis = () => {
    const totalPosSales = currentSale?.sales || 0;
    const extraIncomes = dailyIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const dailyExpensesAmount = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalSales = totalPosSales + extraIncomes;
    const totalCosts = getTotalCustomCosts() + calculateEmployeeDailyCost() + dailyExpensesAmount;
    
    const grossProfit = totalSales - totalCosts;
    const reinvestAmount = grossProfit * (settings.reinvestmentPercentage / 100);
    const netProfit = grossProfit - reinvestAmount;

    const partnerShares = partners.map((p) => ({
      name: p.name,
      percentage: p.percentage,
      amount: netProfit * (p.percentage / 100),
    }));

    setAiAnalysis({
      totalSales,
      totalCosts,
      grossProfit,
      reinvestAmount,
      netProfit,
      partnerShares,
      isProfitable: netProfit > 0,
    });
  };

  const handleSaveSettings = () => {
    updateSettings(settingsForm);
    setSettingsDialogOpen(false);
  };

  const handleAddCost = (cost?: CustomCost) => {
    if (cost) {
      setEditingCost(cost);
      setCostForm({ name: cost.name, amount: cost.amount });
    } else {
      setEditingCost(null);
      setCostForm({ name: '', amount: 0 });
    }
    setCostDialogOpen(true);
  };

  const handleSaveCost = () => {
    if (editingCost) {
      const updatedCosts = settingsForm.customCosts.map((c) =>
        c.id === editingCost.id ? { ...c, name: costForm.name, amount: costForm.amount } : c
      );
      setSettingsForm({ ...settingsForm, customCosts: updatedCosts });
    } else {
      const newCost: CustomCost = { id: Date.now().toString(), name: costForm.name, amount: costForm.amount };
      setSettingsForm({ ...settingsForm, customCosts: [...settingsForm.customCosts, newCost] });
    }
    setCostDialogOpen(false);
  };

  const handleDeleteCost = (costId: string) => {
    const updatedCosts = settingsForm.customCosts.filter((c) => c.id !== costId);
    setSettingsForm({ ...settingsForm, customCosts: updatedCosts });
  };

  // ----------------------------------------------------
  // ระบบประมวลผลบัญชีงบทดลอง (Trial Balance Logic)
  // ----------------------------------------------------
  const generateTrialBalance = () => {
    const revenueByMenu: { [key: string]: number } = {};
    const extraIncomesBySource: { [key: string]: number } = {};
    const extraExpensesBySource: { [key: string]: number } = {};
    
    let totalSalesAndIncomes = 0;
    const activeDays = dailySales.length > 0 ? dailySales.length : 1;

    // รวบรวมข้อมูลทุกวัน
    dailySales.forEach((sale) => {
      // 1. ยอดจากหน้า POS (เมนู)
      Object.entries(sale.menuSales || {}).forEach(([menuId, count]) => {
        const menu = menuItems.find((m) => m.id === menuId);
        if (menu) {
          const revenue = menu.price * count;
          revenueByMenu[menu.name] = (revenueByMenu[menu.name] || 0) + revenue;
          totalSalesAndIncomes += revenue;
        }
      });

      // 2. ยอดรายรับอื่นๆ
      (sale.incomes || []).forEach(inc => {
        extraIncomesBySource[inc.name] = (extraIncomesBySource[inc.name] || 0) + inc.amount;
        totalSalesAndIncomes += inc.amount;
      });

      // 3. ยอดรายจ่ายอื่นๆ (บันทึกรายวัน)
      (sale.expenses || []).forEach(exp => {
        extraExpensesBySource[exp.name] = (extraExpensesBySource[exp.name] || 0) + exp.amount;
      });
    });

    let totalSalaries = 0;
    employees.forEach(emp => {
       let daily = emp.paymentType === 'daily' ? emp.salary :
                   emp.paymentType === 'monthly' ? emp.salary / 30 : emp.salary / 365;
       totalSalaries += daily * activeDays;
    });

    const customCostEntries = settings.customCosts.map((cost, index) => ({
       accountCode: `50${2 + index}`,
       accountName: cost.name,
       debit: cost.amount * activeDays,
       credit: 0
    }));

    const totalCustomCosts = customCostEntries.reduce((sum, c) => sum + c.debit, 0);
    const totalExtraExpenses = Object.values(extraExpensesBySource).reduce((sum, val) => sum + val, 0);
    const totalExpenses = totalSalaries + totalCustomCosts + totalExtraExpenses;

    // สมการบัญชี: เงินสด = รายได้ - ค่าใช้จ่าย
    const cashBalance = totalSalesAndIncomes - totalExpenses;

    let entries: AccountEntry[] = [];

    // หมวด 1-2: สินทรัพย์ และหนี้สิน
    if (cashBalance >= 0) {
      entries.push({ accountCode: '101', accountName: 'เงินสดและเงินฝากธนาคาร', debit: cashBalance, credit: 0 });
    } else {
      entries.push({ accountCode: '201', accountName: 'เงินเบิกเกินบัญชี (เจ้าหนี้)', debit: 0, credit: Math.abs(cashBalance) });
    }

    // หมวด 4: รายได้ (เครดิต)
    let revCode = 401;
    Object.entries(revenueByMenu).sort((a, b) => b[1] - a[1]).forEach(([menuName, amount]) => {
      entries.push({ accountCode: String(revCode++), accountName: `รายได้ - ${menuName}`, debit: 0, credit: amount });
    });
    
    Object.entries(extraIncomesBySource).sort((a, b) => b[1] - a[1]).forEach(([name, amount]) => {
      entries.push({ accountCode: String(revCode++), accountName: `รายรับอื่นๆ - ${name}`, debit: 0, credit: amount });
    });

    // หมวด 5: ค่าใช้จ่าย (เดบิต)
    if (totalSalaries > 0) {
      entries.push({ accountCode: '501', accountName: 'เงินเดือนและค่าจ้างพนักงาน', debit: totalSalaries, credit: 0 });
    }
    entries = [...entries, ...customCostEntries.filter(c => c.debit > 0)];

    let expCode = 510;
    Object.entries(extraExpensesBySource).sort((a, b) => b[1] - a[1]).forEach(([name, amount]) => {
      entries.push({ accountCode: String(expCode++), accountName: `ค่าใช้จ่าย - ${name}`, debit: amount, credit: 0 });
    });

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    return { entries, totalDebit, totalCredit };
  };

  const trialBalance = generateTrialBalance();
  const formatMoney = (val: number) => val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl">💰 การเงินและบัญชี</h1>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<Settings />} onClick={() => { setSettingsForm(settings); setSettingsDialogOpen(true); }}>
            ตั้งค่าต้นทุนคงที่
          </Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="บันทึกรายการ & วิเคราะห์หุ้นส่วน" />
          <Tab label="งบทดลอง (TRIAL BALANCE)" />
        </Tabs>
      </Box>

      {/* TAB 1: บันทึกรายการรายวัน */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent>
              <h2 className="text-xl mb-4 flex items-center gap-2 font-semibold">
                <Calendar className="w-5 h-5 text-blue-600" />
                บันทึกรายการประจำวัน
              </h2>
              
              <div className="mb-6">
                <TextField
                  fullWidth
                  type="date"
                  label="เลือกวันที่บันทึกบัญชี"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              {/* ยอดขายจาก POS (แก้ไขไม่ได้) */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">ยอดขายจากหน้าร้าน (POS)</p>
                  <p className="text-xs text-gray-400">ระบบดึงข้อมูลให้อัตโนมัติ</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">฿{currentSale?.sales?.toLocaleString() || 0}</p>
              </div>

              {/* ส่วนเพิ่มรายรับ */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-green-700">รายรับอื่นๆ</h3>
                  <Button size="small" startIcon={<Plus />} onClick={() => handleAddDailyEntry('income')}>เพิ่มรายรับ</Button>
                </div>
                {dailyIncomes.map((inc) => (
                  <div key={inc.id} className="flex gap-2 mb-2 items-center">
                    <TextField fullWidth size="small" placeholder="เช่น ค่าทิป, ขายของเก่า" value={inc.name} onChange={(e) => handleUpdateDailyEntry('income', inc.id, 'name', e.target.value)} />
                    <TextField fullWidth size="small" type="number" placeholder="จำนวนเงิน" value={inc.amount || ''} onChange={(e) => handleUpdateDailyEntry('income', inc.id, 'amount', Number(e.target.value))} />
                    <IconButton color="error" onClick={() => handleRemoveDailyEntry('income', inc.id)}><Trash2 className="w-4 h-4" /></IconButton>
                  </div>
                ))}
                {dailyIncomes.length === 0 && <p className="text-sm text-gray-400 italic">ไม่มีรายรับอื่นๆ ในวันนี้</p>}
              </div>

              <Divider className="my-4"/>

              {/* ส่วนเพิ่มรายจ่าย */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-red-600">รายจ่ายที่เกิดขึ้นวันนี้</h3>
                  <Button size="small" color="error" startIcon={<Plus />} onClick={() => handleAddDailyEntry('expense')}>เพิ่มรายจ่าย</Button>
                </div>
                {dailyExpenses.map((exp) => (
                  <div key={exp.id} className="flex gap-2 mb-2 items-center">
                    <TextField fullWidth size="small" placeholder="เช่น ซื้อน้ำแข็ง, ค่าขนส่ง" value={exp.name} onChange={(e) => handleUpdateDailyEntry('expense', exp.id, 'name', e.target.value)} />
                    <TextField fullWidth size="small" type="number" placeholder="จำนวนเงิน" value={exp.amount || ''} onChange={(e) => handleUpdateDailyEntry('expense', exp.id, 'amount', Number(e.target.value))} />
                    <IconButton color="error" onClick={() => handleRemoveDailyEntry('expense', exp.id)}><Trash2 className="w-4 h-4" /></IconButton>
                  </div>
                ))}
                {dailyExpenses.length === 0 && <p className="text-sm text-gray-400 italic">ไม่มีรายจ่ายเพิ่มเติมในวันนี้</p>}
              </div>

              <Button fullWidth variant="contained" size="large" onClick={handleSaveDailyData}>
                บันทึกข้อมูลเข้าสู่ระบบบัญชี
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl">👥 หุ้นส่วน</h2>
                <Button size="small" startIcon={<Plus />} onClick={() => handleAddPartner()}>
                  เพิ่มหุ้นส่วน
                </Button>
              </div>

              <div className="space-y-3">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center gap-3 p-3 border rounded">
                    {partner.image ? (
                      <img src={partner.image} alt={partner.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {partner.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{partner.name}</p>
                      <Chip label={`${partner.percentage}%`} size="small" color="primary" />
                    </div>
                    <div className="flex gap-1">
                      <IconButton size="small" onClick={() => handleAddPartner(partner)}>
                        <Edit2 className="w-4 h-4" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deletePartner(partner.id)}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>

              <Button fullWidth variant="contained" color="secondary" startIcon={<Sparkles />} onClick={handleAIAnalysis} className="mt-6">
                คำนวณกำไร / ขาดทุน ประจำวัน
              </Button>

              {aiAnalysis && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded shadow-sm border border-purple-100">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    สรุปผลประกอบการวันนี้
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>ยอดขาย + รายรับรวม:</span>
                      <span className="font-semibold">฿{aiAnalysis.totalSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ต้นทุน + รายจ่ายรวม:</span>
                      <span className="font-semibold text-red-600">-฿{aiAnalysis.totalCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>กำไรขั้นต้น:</span>
                      <span className={`font-semibold ${aiAnalysis.grossProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ฿{aiAnalysis.grossProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>เก็บลงทุนต่อ ({settings.reinvestmentPercentage}%):</span>
                      <span className="font-semibold">-฿{aiAnalysis.reinvestAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 border-purple-200">
                      <span>กำไรสุทธิที่แบ่งได้:</span>
                      <span className={aiAnalysis.netProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                        ฿{aiAnalysis.netProfit.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-purple-200">
                      <p className="font-semibold mb-2">ส่วนแบ่งหุ้นส่วน (ปันผล):</p>
                      {aiAnalysis.partnerShares.map((share: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{share.name} ({share.percentage}%):</span>
                          <span className="font-semibold text-green-600">฿{share.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: งบทดลอง */}
      {activeTab === 1 && (
        <Card className="shadow-lg border-t-4 border-t-blue-600">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-1">ร้าน BizFlow</h2>
              <h3 className="text-xl font-semibold mb-1">งบทดลอง</h3>
              <p className="text-gray-600">ณ วันที่ {format(new Date(), 'dd MMMM yyyy', { locale: th })}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-4 py-3 text-left w-2/5 font-semibold">ชื่อบัญชี</th>
                    <th className="border border-gray-400 px-4 py-3 text-center w-1/5 font-semibold">เลขที่บัญชี</th>
                    <th className="border border-gray-400 px-4 py-3 text-right w-1/5 font-semibold">เดบิต (บาท)</th>
                    <th className="border border-gray-400 px-4 py-3 text-right w-1/5 font-semibold">เครดิต (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.entries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className={`border-l border-r border-gray-400 px-4 py-2 ${entry.credit > 0 ? 'pl-10' : ''}`}>
                        {entry.accountName}
                      </td>
                      <td className="border-l border-r border-gray-400 px-4 py-2 text-center text-gray-600">
                        {entry.accountCode}
                      </td>
                      <td className="border-l border-r border-gray-400 px-4 py-2 text-right">
                        {formatMoney(entry.debit)}
                      </td>
                      <td className="border-l border-r border-gray-400 px-4 py-2 text-right">
                        {formatMoney(entry.credit)}
                      </td>
                    </tr>
                  ))}
                  
                  {/* แถวว่างตกแต่ง */}
                  {[...Array(Math.max(0, 10 - trialBalance.entries.length))].map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border-l border-r border-gray-400 px-4 py-4"></td>
                      <td className="border-l border-r border-gray-400 px-4 py-4"></td>
                      <td className="border-l border-r border-gray-400 px-4 py-4"></td>
                      <td className="border-l border-r border-gray-400 px-4 py-4"></td>
                    </tr>
                  ))}
                  
                  {/* แถวรวมยอด */}
                  <tr className="bg-gray-50 font-bold border-y-2 border-double border-gray-600">
                    <td colSpan={2} className="border-x border-gray-400 px-4 py-3 text-center">รวม</td>
                    <td className="border-x border-gray-400 px-4 py-3 text-right text-blue-700 underline decoration-double">
                      {trialBalance.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border-x border-gray-400 px-4 py-3 text-right text-blue-700 underline decoration-double">
                      {trialBalance.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {trialBalance.totalDebit !== trialBalance.totalCredit && (
               <div className="mt-4 text-red-500 text-center font-semibold">
                 ⚠️ ยอดเดบิตและเครดิตไม่สมดุล กรุณาตรวจสอบการบันทึกรายการ
               </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={partnerDialogOpen} onClose={() => setPartnerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPartner ? 'แก้ไขหุ้นส่วน' : 'เพิ่มหุ้นส่วน'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField fullWidth label="ชื่อหุ้นส่วน" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} />
            <TextField fullWidth type="number" label="เปอร์เซ็นต์ (%)" value={partnerForm.percentage} onChange={(e) => setPartnerForm({ ...partnerForm, percentage: Number(e.target.value) })} />
            <div>
              <label className="block text-sm mb-2">รูปภาพ</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm" />
              {partnerForm.image && <img src={partnerForm.image} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover" />}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartnerDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSavePartner} variant="contained">บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ตั้งค่าต้นทุนคงที่ (Fixed Costs)</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm text-gray-600">รายการต้นทุนเหล่านี้จะถูกคำนวณในทุกๆ วันอัตโนมัติ</h3>
              <Button size="small" startIcon={<Plus />} onClick={() => handleAddCost()}>เพิ่มรายการ</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {settingsForm.customCosts.map((cost) => (
                <div key={cost.id} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-semibold">{cost.name}</p>
                    <p className="text-sm text-gray-600">฿{cost.amount.toLocaleString()} / วัน</p>
                  </div>
                  <IconButton size="small" onClick={() => handleAddCost(cost)}><Edit2 className="w-4 h-4" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteCost(cost.id)}><Trash2 className="w-4 h-4" /></IconButton>
                </div>
              ))}
            </div>
            <Divider className="my-4"/>
            <TextField fullWidth type="number" label="เปอร์เซ็นต์เอาไปลงทุนต่อ (%)" value={settingsForm.reinvestmentPercentage} onChange={(e) => setSettingsForm({ ...settingsForm, reinvestmentPercentage: Number(e.target.value) })} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSaveSettings} variant="contained">บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={costDialogOpen} onClose={() => setCostDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCost ? 'แก้ไขรายการ' : 'เพิ่มรายการต้นทุนคงที่'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField fullWidth label="ชื่อรายการ" value={costForm.name} onChange={(e) => setCostForm({ ...costForm, name: e.target.value })} placeholder="เช่น ค่าเช่าที่, ค่าไฟ" />
            <TextField fullWidth type="number" label="จำนวนเงิน (เฉลี่ยตกวันละกี่บาท)" value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: Number(e.target.value) })} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCostDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSaveCost} variant="contained">บันทึก</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};