import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Partner, DailySale, CustomCost, DailyEntry } from '../types';
import { Button, TextField, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Tabs, Tab, Box, Divider } from '@mui/material';
import { Calendar, Plus, Sparkles, Edit2, Trash2, Settings, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
      sales: currentSale?.sales || 0,
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
  // ระบบสรุปรายรับ-รายจ่าย (งบกำไรขาดทุน)
  // ----------------------------------------------------
  const generateIncomeStatement = () => {
    const activeDays = dailySales.length > 0 ? dailySales.length : 1;
    let incomes: { name: string; amount: number }[] = [];
    let expenses: { name: string; amount: number }[] = [];

    // 1. รวบรวมรายรับทั้งหมด
    const revenueByMenu: { [key: string]: number } = {};
    dailySales.forEach((sale) => {
      // รายได้จากการขายเมนู
      Object.entries(sale.menuSales || {}).forEach(([menuId, count]) => {
        const menu = menuItems.find((m) => m.id === menuId);
        if (menu) {
          revenueByMenu[menu.name] = (revenueByMenu[menu.name] || 0) + (menu.price * count);
        }
      });
      // รายรับอื่นๆ ที่พิมพ์เพิ่ม
      (sale.incomes || []).forEach(inc => {
        incomes.push({ name: `รายรับอื่นๆ - ${inc.name}`, amount: inc.amount });
      });
      // รายจ่ายย่อยที่พิมพ์เพิ่ม
      (sale.expenses || []).forEach(exp => {
        expenses.push({ name: `รายจ่าย - ${exp.name}`, amount: exp.amount });
      });
    });

    Object.entries(revenueByMenu).sort((a, b) => b[1] - a[1]).forEach(([name, amount]) => {
      incomes.unshift({ name: `ยอดขาย - ${name}`, amount });
    });

    // 2. รวบรวมรายจ่ายคงที่
    let totalSalaries = 0;
    employees.forEach(emp => {
       let daily = emp.paymentType === 'daily' ? emp.salary :
                   emp.paymentType === 'monthly' ? emp.salary / 30 : emp.salary / 365;
       totalSalaries += daily * activeDays;
    });
    if (totalSalaries > 0) expenses.push({ name: 'ค่าจ้างพนักงาน', amount: totalSalaries });

    settings.customCosts.forEach(cost => {
      expenses.push({ name: `ต้นทุนคงที่ - ${cost.name}`, amount: cost.amount * activeDays });
    });

    // 3. คำนวณสรุปผล
    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalIncome - totalExpense;

    return { incomes, expenses, totalIncome, totalExpense, netProfit };
  };

  const incomeStatement = generateIncomeStatement();
  const formatMoney = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">💰 การเงินและบัญชี</h1>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<Settings />} onClick={() => { setSettingsForm(settings); setSettingsDialogOpen(true); }}>
            ตั้งค่าต้นทุนคงที่
          </Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="บันทึกรายการ & วิเคราะห์หุ้นส่วน" sx={{ fontWeight: 'bold' }} />
          <Tab label="งบกำไรขาดทุน (สรุปรายรับ-รายจ่าย)" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* TAB 1: บันทึกรายการรายวัน */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: บันทึกรายการประจำวัน */}
          <Card className="shadow-sm border border-gray-100 rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl mb-6 flex items-center gap-2 font-bold text-gray-800">
                <Calendar className="w-6 h-6 text-blue-600" />
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </div>

              {/* ยอดขายจาก POS */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl mb-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-blue-800">ยอดขายจากหน้าร้าน (POS)</p>
                  <p className="text-xs text-blue-600/70 mt-1">ระบบดึงข้อมูลให้อัตโนมัติ</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">฿{currentSale?.sales?.toLocaleString() || 0}</p>
              </div>

              {/* ส่วนเพิ่มรายรับ */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-green-700 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> รายรับอื่นๆ
                  </h3>
                  <Button size="small" variant="outlined" color="success" startIcon={<Plus />} onClick={() => handleAddDailyEntry('income')} sx={{ borderRadius: '8px' }}>เพิ่มรายรับ</Button>
                </div>
                <div className="space-y-3">
                  {dailyIncomes.map((inc) => (
                    <div key={inc.id} className="flex gap-2 items-center bg-green-50/50 p-2 rounded-lg border border-green-100">
                      <TextField fullWidth size="small" placeholder="เช่น ค่าทิป, ขายของเก่า" value={inc.name} onChange={(e) => handleUpdateDailyEntry('income', inc.id, 'name', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }} />
                      <TextField fullWidth size="small" type="number" placeholder="จำนวนเงิน" value={inc.amount || ''} onChange={(e) => handleUpdateDailyEntry('income', inc.id, 'amount', Number(e.target.value))} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }} />
                      <IconButton color="error" onClick={() => handleRemoveDailyEntry('income', inc.id)}><Trash2 className="w-5 h-5" /></IconButton>
                    </div>
                  ))}
                  {dailyIncomes.length === 0 && <p className="text-sm text-gray-400 italic text-center py-2">ไม่มีรายรับอื่นๆ ในวันนี้</p>}
                </div>
              </div>

              <Divider className="my-6 border-dashed" />

              {/* ส่วนเพิ่มรายจ่าย */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-red-600 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" /> รายจ่ายที่เกิดขึ้นวันนี้
                  </h3>
                  <Button size="small" variant="outlined" color="error" startIcon={<Plus />} onClick={() => handleAddDailyEntry('expense')} sx={{ borderRadius: '8px' }}>เพิ่มรายจ่าย</Button>
                </div>
                <div className="space-y-3">
                  {dailyExpenses.map((exp) => (
                    <div key={exp.id} className="flex gap-2 items-center bg-red-50/50 p-2 rounded-lg border border-red-100">
                      <TextField fullWidth size="small" placeholder="เช่น ซื้อน้ำแข็ง, ค่าขนส่ง" value={exp.name} onChange={(e) => handleUpdateDailyEntry('expense', exp.id, 'name', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }} />
                      <TextField fullWidth size="small" type="number" placeholder="จำนวนเงิน" value={exp.amount || ''} onChange={(e) => handleUpdateDailyEntry('expense', exp.id, 'amount', Number(e.target.value))} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }} />
                      <IconButton color="error" onClick={() => handleRemoveDailyEntry('expense', exp.id)}><Trash2 className="w-5 h-5" /></IconButton>
                    </div>
                  ))}
                  {dailyExpenses.length === 0 && <p className="text-sm text-gray-400 italic text-center py-2">ไม่มีรายจ่ายเพิ่มเติมในวันนี้</p>}
                </div>
              </div>

              <Button fullWidth variant="contained" size="large" onClick={handleSaveDailyData} sx={{ borderRadius: '10px', py: 1.5, fontWeight: 'bold' }}>
                บันทึกข้อมูลเข้าสู่ระบบบัญชี
              </Button>
            </CardContent>
          </Card>

          {/* Card: วิเคราะห์หุ้นส่วน */}
          <Card className="shadow-sm border border-gray-100 rounded-2xl h-fit">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">👥 หุ้นส่วน</h2>
                <Button size="small" variant="outlined" startIcon={<Plus />} onClick={() => handleAddPartner()} sx={{ borderRadius: '8px' }}>
                  เพิ่มหุ้นส่วน
                </Button>
              </div>

              <div className="space-y-3">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                    {partner.image ? (
                      <img src={partner.image} alt={partner.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {partner.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{partner.name}</p>
                      <Chip label={`ส่วนแบ่ง ${partner.percentage}%`} size="small" color="primary" sx={{ mt: 0.5, fontWeight: 'medium' }} />
                    </div>
                    <div className="flex gap-1">
                      <IconButton size="small" onClick={() => handleAddPartner(partner)}>
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deletePartner(partner.id)}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                ))}
                {partners.length === 0 && <p className="text-center text-gray-400 py-4">ยังไม่มีข้อมูลหุ้นส่วน</p>}
              </div>

              <Button fullWidth variant="contained" color="secondary" startIcon={<Sparkles />} onClick={handleAIAnalysis} sx={{ mt: 6, borderRadius: '10px', py: 1.5, fontWeight: 'bold' }}>
                คำนวณกำไร / ขาดทุน ประจำวัน
              </Button>

              {aiAnalysis && (
                <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-900 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    สรุปผลประกอบการวันนี้
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">ยอดขาย + รายรับรวม:</span>
                      <span className="font-bold text-base text-gray-800">฿{aiAnalysis.totalSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">ต้นทุน + รายจ่ายรวม:</span>
                      <span className="font-bold text-base text-red-600">-฿{aiAnalysis.totalCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">กำไรขั้นต้น:</span>
                      <span className={`font-bold text-base ${aiAnalysis.grossProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ฿{aiAnalysis.grossProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">เก็บลงทุนต่อ ({settings.reinvestmentPercentage}%):</span>
                      <span className="font-bold text-base text-orange-600">-฿{aiAnalysis.reinvestAmount.toLocaleString()}</span>
                    </div>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-900 font-bold text-lg">กำไรสุทธิที่แบ่งได้:</span>
                      <span className={`font-black text-2xl ${aiAnalysis.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ฿{aiAnalysis.netProfit.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-purple-200/60">
                      <p className="font-bold text-indigo-900 mb-3">💰 ส่วนแบ่งหุ้นส่วน (ปันผล):</p>
                      <div className="space-y-2">
                        {aiAnalysis.partnerShares.map((share: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white/60 p-2 rounded-lg">
                            <span className="font-medium text-gray-700">{share.name} ({share.percentage}%)</span>
                            <span className="font-bold text-green-700">฿{share.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: สรุปรายรับ-รายจ่าย (งบกำไรขาดทุน) Dashboard */}
      {activeTab === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm rounded-2xl">
               <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-green-200 rounded-lg text-green-700"><TrendingUp className="w-5 h-5" /></div>
                   <p className="text-green-800 font-semibold">รายรับรวมทั้งหมด</p>
                 </div>
                 <h3 className="text-3xl font-black text-green-700 mt-2">฿{formatMoney(incomeStatement.totalIncome)}</h3>
               </CardContent>
             </Card>
             <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm rounded-2xl">
               <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-red-200 rounded-lg text-red-700"><TrendingDown className="w-5 h-5" /></div>
                   <p className="text-red-800 font-semibold">รายจ่ายรวมทั้งหมด</p>
                 </div>
                 <h3 className="text-3xl font-black text-red-700 mt-2">฿{formatMoney(incomeStatement.totalExpense)}</h3>
               </CardContent>
             </Card>
             <Card className={`border shadow-sm rounded-2xl ${incomeStatement.netProfit >= 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-red-100 border-orange-200'}`}>
               <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <div className={`p-2 rounded-lg ${incomeStatement.netProfit >= 0 ? 'bg-blue-200 text-blue-700' : 'bg-orange-200 text-orange-700'}`}>
                     <Wallet className="w-5 h-5" />
                   </div>
                   <p className={`font-semibold ${incomeStatement.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>กำไรสุทธิ (เงินเข้ากระเป๋าเจ้าของ)</p>
                 </div>
                 <h3 className={`text-4xl font-black mt-2 ${incomeStatement.netProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                   ฿{formatMoney(incomeStatement.netProfit)}
                 </h3>
               </CardContent>
             </Card>
          </div>

          {/* Detailed Table */}
          <Card className="shadow-md border border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-white px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">รายละเอียด งบกำไรขาดทุน</h2>
                <p className="text-sm text-gray-500 mt-1">สรุปข้อมูลการเงิน ณ วันที่ {format(new Date(), 'dd MMMM yyyy', { locale: th })}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">รายการ (Description)</th>
                      <th className="px-6 py-4 font-semibold text-right">รายรับ (Income)</th>
                      <th className="px-6 py-4 font-semibold text-right">รายจ่าย (Expense)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    
                    {/* หมวดรายรับ */}
                    <tr className="bg-green-50/30">
                      <td colSpan={3} className="px-6 py-3 font-bold text-green-800 text-sm">
                        <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4"/> หมวดรายรับ</div>
                      </td>
                    </tr>
                    {incomeStatement.incomes.length > 0 ? (
                      incomeStatement.incomes.map((item, idx) => (
                        <tr key={`inc-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 pl-10 text-gray-700 font-medium">{item.name}</td>
                          <td className="px-6 py-4 text-right text-green-600 font-bold">{formatMoney(item.amount)}</td>
                          <td className="px-6 py-4 text-right text-gray-300">-</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400 italic">ไม่มีข้อมูลรายรับ</td></tr>
                    )}
                    
                    {/* หมวดรายจ่าย */}
                    <tr className="bg-red-50/30">
                      <td colSpan={3} className="px-6 py-3 font-bold text-red-800 text-sm border-t-2 border-gray-100">
                        <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4"/> หมวดรายจ่าย</div>
                      </td>
                    </tr>
                    {incomeStatement.expenses.length > 0 ? (
                      incomeStatement.expenses.map((item, idx) => (
                        <tr key={`exp-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 pl-10 text-gray-700 font-medium">{item.name}</td>
                          <td className="px-6 py-4 text-right text-gray-300">-</td>
                          <td className="px-6 py-4 text-right text-red-500 font-bold">{formatMoney(item.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400 italic">ไม่มีข้อมูลรายจ่าย</td></tr>
                    )}
                    
                    {/* สรุปยอดรวมด้านล่างตาราง */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-5 font-bold text-gray-800 text-right uppercase text-sm tracking-wider">รวมทั้งหมด</td>
                      <td className="px-6 py-5 text-right font-black text-green-700 text-lg">{formatMoney(incomeStatement.totalIncome)}</td>
                      <td className="px-6 py-5 text-right font-black text-red-600 text-lg">{formatMoney(incomeStatement.totalExpense)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={partnerDialogOpen} onClose={() => setPartnerDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ pb: 2, pt: 3, px: 4, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>
          {editingPartner ? 'แก้ไขข้อมูลหุ้นส่วน' : 'เพิ่มหุ้นส่วนใหม่'}
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          <div className="space-y-5 mt-2">
            <TextField fullWidth label="ชื่อหุ้นส่วน" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            <TextField fullWidth type="number" label="เปอร์เซ็นต์ส่วนแบ่ง (%)" value={partnerForm.percentage} onChange={(e) => setPartnerForm({ ...partnerForm, percentage: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">รูปโปรไฟล์ (ตัวเลือก)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {partnerForm.image && <img src={partnerForm.image} alt="Preview" className="mt-4 w-24 h-24 rounded-full object-cover shadow-md border border-gray-100" />}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setPartnerDialogOpen(false)} sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ยกเลิก</Button>
          <Button onClick={handleSavePartner} variant="contained" sx={{ borderRadius: '8px', fontWeight: 'bold', px: 4 }}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ pb: 2, pt: 3, px: 4, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>ตั้งค่าต้นทุนคงที่ (Fixed Costs)</DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          <div className="space-y-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm text-gray-500">รายการต้นทุนเหล่านี้จะถูกนำไปหักลบรายวันโดยอัตโนมัติ</h3>
              <Button size="small" variant="outlined" startIcon={<Plus />} onClick={() => handleAddCost()} sx={{ borderRadius: '8px' }}>เพิ่มรายการ</Button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {settingsForm.customCosts.map((cost) => (
                <div key={cost.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{cost.name}</p>
                    <p className="text-sm text-red-600 font-medium">฿{cost.amount.toLocaleString()} / วัน</p>
                  </div>
                  <IconButton size="small" onClick={() => handleAddCost(cost)} sx={{ bgcolor: 'white', shadow: 'sm' }}><Edit2 className="w-4 h-4 text-blue-600" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteCost(cost.id)} sx={{ bgcolor: 'white', shadow: 'sm' }}><Trash2 className="w-4 h-4" /></IconButton>
                </div>
              ))}
              {settingsForm.customCosts.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">ยังไม่มีการตั้งค่าต้นทุนคงที่</p>}
            </div>
            <Divider className="my-5 border-dashed"/>
            <TextField fullWidth type="number" label="เปอร์เซ็นต์หักเก็บไว้ลงทุนต่อ (%)" value={settingsForm.reinvestmentPercentage} onChange={(e) => setSettingsForm({ ...settingsForm, reinvestmentPercentage: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} helperText="รายได้สุทธิส่วนนี้จะไม่ถูกนำไปปันผลให้หุ้นส่วน" />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setSettingsDialogOpen(false)} sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ยกเลิก</Button>
          <Button onClick={handleSaveSettings} variant="contained" sx={{ borderRadius: '8px', fontWeight: 'bold', px: 4 }}>บันทึกตั้งค่า</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={costDialogOpen} onClose={() => setCostDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ pb: 2, pt: 3, px: 4, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{editingCost ? 'แก้ไขรายการ' : 'เพิ่มรายการต้นทุนคงที่'}</DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          <div className="space-y-5 mt-2">
            <TextField fullWidth label="ชื่อรายการ" value={costForm.name} onChange={(e) => setCostForm({ ...costForm, name: e.target.value })} placeholder="เช่น ค่าเช่าที่, ค่าไฟ" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            <TextField fullWidth type="number" label="จำนวนเงิน (เฉลี่ยตกวันละกี่บาท)" value={costForm.amount || ''} onChange={(e) => setCostForm({ ...costForm, amount: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} InputProps={{ startAdornment: <span className="text-gray-400 font-bold mr-2">฿</span> }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setCostDialogOpen(false)} sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ยกเลิก</Button>
          <Button onClick={handleSaveCost} variant="contained" disabled={!costForm.name || costForm.amount <= 0} sx={{ borderRadius: '8px', fontWeight: 'bold', px: 4 }}>บันทึก</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};