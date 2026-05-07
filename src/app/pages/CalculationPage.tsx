import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Partner, DailySale, CustomCost, DailyEntry } from '../types';
import { Button, TextField, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Tabs, Tab, Box, Divider } from '@mui/material';
import { Calendar, Plus, Sparkles, Edit2, Trash2, Settings, TrendingUp, TrendingDown, Wallet, Users, ImagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export const CalculationPage: React.FC = () => {
  const { partners, dailySales, settings, employees, addPartner, updatePartner, deletePartner, addDailySale, updateDailySale, updateSettings } = useBusiness();
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
    const reinvestAmount = grossProfit > 0 ? grossProfit * (settings.reinvestmentPercentage / 100) : 0;
    const netProfit = grossProfit > 0 ? grossProfit - reinvestAmount : grossProfit;

    const partnerShares = partners.map((p) => ({
      name: p.name,
      percentage: p.percentage,
      amount: netProfit > 0 ? netProfit * (p.percentage / 100) : 0,
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
    let totalPosSales = 0;
    
    dailySales.forEach((sale) => {
      totalPosSales += sale.sales;

      (sale.incomes || []).forEach(inc => {
        incomes.push({ name: `รายรับอื่นๆ - ${inc.name}`, amount: inc.amount });
      });
      
      (sale.expenses || []).forEach(exp => {
        expenses.push({ name: `รายจ่าย - ${exp.name}`, amount: exp.amount });
      });
    });

    if (totalPosSales > 0) {
      incomes.unshift({ name: `ยอดขายจากหน้าร้าน (POS)`, amount: totalPosSales });
    }

    // 2. รวบรวมรายจ่ายคงที่
    let totalSalaries = 0;
    employees.forEach(emp => {
       let daily = emp.paymentType === 'daily' ? emp.salary :
                   emp.paymentType === 'monthly' ? emp.salary / 30 : emp.salary / 365;
       totalSalaries += daily * activeDays;
    });
    if (totalSalaries > 0) expenses.push({ name: 'ต้นทุนคงที่ - ค่าพนักงาน', amount: totalSalaries });

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <span className="text-3xl">💰</span> การเงินและบัญชี
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outlined" 
            startIcon={<Settings className="w-4 h-4" />} 
            onClick={() => { setSettingsForm(settings); setSettingsDialogOpen(true); }}
            sx={{ 
              borderRadius: '10px', 
              textTransform: 'none', 
              fontWeight: 600,
              color: '#475569',
              borderColor: '#cbd5e1',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' }
            }}
          >
            ตั้งค่าต้นทุนคงที่
          </Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', mb: 6 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          TabIndicatorProps={{ style: { backgroundColor: '#3b82f6', height: '3px', borderRadius: '3px' } }}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              color: '#64748b',
              '&.Mui-selected': { color: '#3b82f6' }
            }
          }}
        >
          <Tab label="บันทึกรายการ & วิเคราะห์หุ้นส่วน" />
          <Tab label="งบกำไรขาดทุน (สรุปรายรับ-รายจ่าย)" />
        </Tabs>
      </Box>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: บันทึกรายการรายวัน & หุ้นส่วน */}
      {/* ---------------------------------------------------- */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ส่วนบันทึกรายการ */}
          <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl mb-6 flex items-center gap-2 font-bold text-slate-800">
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
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl mb-6 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-sm font-bold text-blue-900">ยอดขายจากหน้าร้าน (POS)</p>
                  <p className="text-[11px] text-blue-600/70 font-semibold mt-1">ระบบดึงข้อมูลให้อัตโนมัติ</p>
                </div>
                <p className="text-3xl font-black text-blue-700">฿{currentSale?.sales?.toLocaleString() || 0}</p>
              </div>

              {/* ส่วนเพิ่มรายรับ */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-emerald-700 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> รายรับอื่นๆ
                  </h3>
                  <Button size="small" variant="outlined" color="success" startIcon={<Plus />} onClick={() => handleAddDailyEntry('income')} sx={{ borderRadius: '8px', fontWeight: 'bold' }}>เพิ่มรายรับ</Button>
                </div>
                <div className="space-y-3">
                  {dailyIncomes.map((inc) => (
                    <div key={inc.id} className="flex gap-2 items-center bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                      <TextField fullWidth size="small" placeholder="เช่น ค่าทิป, ขายของเก่า" value={inc.name} onChange={(e) => handleUpdateDailyEntry('income', inc.id, 'name', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '8px' } }} />
                      <TextField fullWidth size="small" type="number" placeholder="จำนวนเงิน" value={inc.amount || ''} onChange={(e) => handleUpdateDailyEntry('income', inc.id, 'amount', Number(e.target.value))} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '8px' } }} />
                      <IconButton color="error" onClick={() => handleRemoveDailyEntry('income', inc.id)} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#fee2e2' } }}><Trash2 className="w-4 h-4" /></IconButton>
                    </div>
                  ))}
                  {dailyIncomes.length === 0 && <p className="text-sm text-slate-400 font-medium text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ไม่มีรายรับอื่นๆ ในวันนี้</p>}
                </div>
              </div>

              <Divider className="my-8" sx={{ borderStyle: 'dashed' }} />

              {/* ส่วนเพิ่มรายจ่าย */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-rose-600 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" /> รายจ่ายที่เกิดขึ้นวันนี้
                  </h3>
                  <Button size="small" variant="outlined" color="error" startIcon={<Plus />} onClick={() => handleAddDailyEntry('expense')} sx={{ borderRadius: '8px', fontWeight: 'bold' }}>เพิ่มรายจ่าย</Button>
                </div>
                <div className="space-y-3">
                  {dailyExpenses.map((exp) => (
                    <div key={exp.id} className="flex gap-2 items-center bg-rose-50/50 p-2 rounded-xl border border-rose-100">
                      <TextField fullWidth size="small" placeholder="เช่น ซื้อน้ำแข็ง, ค่าขนส่ง" value={exp.name} onChange={(e) => handleUpdateDailyEntry('expense', exp.id, 'name', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '8px' } }} />
                      <TextField fullWidth size="small" type="number" placeholder="จำนวนเงิน" value={exp.amount || ''} onChange={(e) => handleUpdateDailyEntry('expense', exp.id, 'amount', Number(e.target.value))} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: '8px' } }} />
                      <IconButton color="error" onClick={() => handleRemoveDailyEntry('expense', exp.id)} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#fee2e2' } }}><Trash2 className="w-4 h-4" /></IconButton>
                    </div>
                  ))}
                  {dailyExpenses.length === 0 && <p className="text-sm text-slate-400 font-medium text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">ไม่มีรายจ่ายเพิ่มเติมในวันนี้</p>}
                </div>
              </div>

              <Button fullWidth variant="contained" size="large" onClick={handleSaveDailyData} sx={{ borderRadius: '14px', py: 1.5, fontWeight: 'bold', fontSize: '1rem', bgcolor: '#2563eb', boxShadow: '0 8px 16px -4px rgba(37,99,235,0.3)', '&:hover': { bgcolor: '#1d4ed8' } }}>
                บันทึกข้อมูลเข้าสู่ระบบบัญชี
              </Button>
            </CardContent>
          </Card>

          {/* ส่วนหุ้นส่วนและการวิเคราะห์ */}
          <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-600" /> หุ้นส่วน
                </h2>
                <Button size="small" variant="outlined" startIcon={<Plus />} onClick={() => handleAddPartner()} sx={{ borderRadius: '8px', color: '#9333ea', borderColor: '#d8b4fe', '&:hover': { bgcolor: '#faf5ff', borderColor: '#a855f7' } }}>
                  เพิ่มหุ้นส่วน
                </Button>
              </div>

              <div className="space-y-3">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                    {partner.image ? (
                      <img src={partner.image} alt={partner.name} className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-slate-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {partner.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-slate-800">{partner.name}</p>
                      <Chip label={`ส่วนแบ่ง ${partner.percentage}%`} size="small" sx={{ mt: 0.5, fontWeight: 'bold', bgcolor: '#f3e8ff', color: '#7e22ce' }} />
                    </div>
                    <div className="flex gap-1">
                      <IconButton size="small" onClick={() => handleAddPartner(partner)} sx={{ bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </IconButton>
                      <IconButton size="small" onClick={() => deletePartner(partner.id)} sx={{ bgcolor: '#fff1f2', '&:hover': { bgcolor: '#ffe4e6' } }}>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </IconButton>
                    </div>
                  </div>
                ))}
                {partners.length === 0 && <p className="text-center text-slate-400 font-medium py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">ยังไม่มีข้อมูลหุ้นส่วนในระบบ</p>}
              </div>

              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<Sparkles />} 
                onClick={handleAIAnalysis} 
                sx={{ mt: 6, borderRadius: '14px', py: 1.5, fontWeight: 'bold', fontSize: '1rem', bgcolor: '#9333ea', boxShadow: '0 8px 16px -4px rgba(147,51,234,0.3)', '&:hover': { bgcolor: '#7e22ce' } }}
              >
                คำนวณกำไร / ขาดทุน ประจำวัน
              </Button>

              {aiAnalysis && (
                <div className="mt-6 p-6 bg-slate-900 rounded-2xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl"></div>
                  
                  <h3 className="font-bold mb-5 flex items-center gap-2 text-white text-lg relative z-10">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    สรุปผลประกอบการวันนี้
                  </h3>
                  
                  <div className="space-y-4 text-sm relative z-10">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                      <span className="text-slate-400 font-medium">ยอดขาย + รายรับรวม:</span>
                      <span className="font-bold text-base text-white">฿{aiAnalysis.totalSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                      <span className="text-slate-400 font-medium">ต้นทุน + รายจ่ายรวม:</span>
                      <span className="font-bold text-base text-rose-400">-฿{aiAnalysis.totalCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                      <span className="text-slate-400 font-medium">กำไรขั้นต้น:</span>
                      <span className={`font-bold text-base ${aiAnalysis.grossProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ฿{aiAnalysis.grossProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                      <span className="text-slate-400 font-medium">เก็บลงทุนต่อ ({settings.reinvestmentPercentage}%):</span>
                      <span className="font-bold text-base text-amber-400">-฿{aiAnalysis.reinvestAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-white font-bold text-lg">กำไรสุทธิที่แบ่งได้:</span>
                      <span className={`font-black text-2xl ${aiAnalysis.netProfit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                        ฿{aiAnalysis.netProfit.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4 pt-5 border-t border-slate-700 border-dashed">
                      <p className="font-bold text-slate-300 mb-3 text-xs uppercase tracking-widest">💰 ส่วนแบ่งหุ้นส่วน (ปันผล)</p>
                      <div className="space-y-2">
                        {aiAnalysis.partnerShares.map((share: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl">
                            <span className="font-medium text-slate-300">{share.name} <span className="text-slate-500 text-xs ml-1">({share.percentage}%)</span></span>
                            <span className="font-bold text-emerald-400">฿{share.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
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

      {/* ---------------------------------------------------- */}
      {/* TAB 2: งบกำไรขาดทุน */}
      {/* ---------------------------------------------------- */}
      {activeTab === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
               <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
                   <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">รายรับรวมทั้งหมด</p>
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 mt-3">฿{formatMoney(incomeStatement.totalIncome)}</h3>
               </CardContent>
             </Card>

             <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
               <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><TrendingDown className="w-5 h-5" /></div>
                   <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">รายจ่ายรวมทั้งหมด</p>
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 mt-3">฿{formatMoney(incomeStatement.totalExpense)}</h3>
               </CardContent>
             </Card>

             <Card sx={{ borderRadius: '20px', bgcolor: incomeStatement.netProfit >= 0 ? '#eff6ff' : '#fff1f2', border: `1px solid ${incomeStatement.netProfit >= 0 ? '#bfdbfe' : '#fecdd3'}`, boxShadow: 'none' }}>
               <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-2">
                   <div className={`p-2 rounded-xl ${incomeStatement.netProfit >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                     <Wallet className="w-5 h-5" />
                   </div>
                   <p className={`font-bold uppercase tracking-wider text-xs ${incomeStatement.netProfit >= 0 ? 'text-blue-800' : 'text-rose-800'}`}>กำไรสุทธิ (เข้ากระเป๋าเจ้าของ)</p>
                 </div>
                 <h3 className={`text-4xl font-black mt-3 ${incomeStatement.netProfit >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                   ฿{formatMoney(incomeStatement.netProfit)}
                 </h3>
               </CardContent>
             </Card>
          </div>

          <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', overflow: 'hidden' }}>
            <CardContent className="p-0">
              <div className="bg-white px-6 py-5 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">รายละเอียด งบกำไรขาดทุน</h2>
                <p className="text-sm text-slate-500 mt-1">สรุปข้อมูลการเงิน ณ วันที่ {format(new Date(), 'dd MMMM yyyy', { locale: th })}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200">
                      <th className="px-6 py-4 font-bold">รายการ (Description)</th>
                      <th className="px-6 py-4 font-bold text-right">รายรับ (Income)</th>
                      <th className="px-6 py-4 font-bold text-right">รายจ่าย (Expense)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    
                    {/* หมวดรายรับ */}
                    <tr className="bg-emerald-50/50">
                      <td colSpan={3} className="px-6 py-3 font-bold text-emerald-800 text-xs uppercase tracking-widest">
                        <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4"/> หมวดรายรับ</div>
                      </td>
                    </tr>
                    {incomeStatement.incomes.length > 0 ? (
                      incomeStatement.incomes.map((item, idx) => (
                        <tr key={`inc-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 pl-10 text-slate-700 font-medium">{item.name}</td>
                          <td className="px-6 py-4 text-right text-emerald-600 font-bold">{formatMoney(item.amount)}</td>
                          <td className="px-6 py-4 text-right text-slate-300">-</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400 italic font-medium">ไม่มีข้อมูลรายรับ</td></tr>
                    )}
                    
                    {/* หมวดรายจ่าย */}
                    <tr className="bg-rose-50/50">
                      <td colSpan={3} className="px-6 py-3 font-bold text-rose-800 text-xs uppercase tracking-widest border-t-2 border-slate-100">
                        <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4"/> หมวดรายจ่าย</div>
                      </td>
                    </tr>
                    {incomeStatement.expenses.length > 0 ? (
                      incomeStatement.expenses.map((item, idx) => (
                        <tr key={`exp-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 pl-10 text-slate-700 font-medium">{item.name}</td>
                          <td className="px-6 py-4 text-right text-slate-300">-</td>
                          <td className="px-6 py-4 text-right text-rose-500 font-bold">{formatMoney(item.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400 italic font-medium">ไม่มีข้อมูลรายจ่าย</td></tr>
                    )}
                    
                    {/* สรุปยอดรวมด้านล่างตาราง */}
                    <tr className="bg-slate-900 text-white">
                      <td className="px-6 py-5 font-bold text-right uppercase text-sm tracking-widest text-slate-400">รวมทั้งหมดสุทธิ</td>
                      <td className="px-6 py-5 text-right font-black text-emerald-400 text-lg">{formatMoney(incomeStatement.totalIncome)}</td>
                      <td className="px-6 py-5 text-right font-black text-rose-400 text-lg">{formatMoney(incomeStatement.totalExpense)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* 🎨 Dialogs (Modern UI with Box spacing) */}
      {/* ----------------------------------------------------- */}

      {/* 1. หุ้นส่วน */}
      <Dialog open={partnerDialogOpen} onClose={() => setPartnerDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}}>
        <DialogTitle sx={{ pb: 3, pt: 4, px: 4, bgcolor: '#ffffff', borderBottom: '1px solid #f8fafc' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center"><Users className="w-6 h-6 text-purple-600" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-none mb-1">{editingPartner ? 'แก้ไขข้อมูลหุ้นส่วน' : 'เพิ่มหุ้นส่วนใหม่'}</h2>
              <p className="text-xs text-slate-400 font-medium">จัดการข้อมูลและสัดส่วนการแบ่งกำไร</p>
            </div>
          </div>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3, bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField fullWidth label="ชื่อหุ้นส่วน" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }} />
            <TextField fullWidth label="เปอร์เซ็นต์ส่วนแบ่ง (%)" type="number" value={partnerForm.percentage || ''} onChange={(e) => setPartnerForm({ ...partnerForm, percentage: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }} />
            <Box>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">รูปโปรไฟล์ (ตัวเลือก)</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-[24px] p-6 text-center hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer group bg-slate-50/50 overflow-hidden">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {partnerForm.image ? (
                  <div className="relative flex justify-center">
                    <img src={partnerForm.image} alt="Preview" className="w-24 h-24 object-cover rounded-full shadow-lg border-4 border-white" />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"><Edit2 className="w-5 h-5 text-white" /></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 text-purple-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><ImagePlus className="w-5 h-5" /></div>
                    <p className="text-sm font-bold text-slate-700">คลิกเพื่อเลือกรูปภาพ</p>
                    <p className="text-[10px] text-slate-400 mt-1">ขนาดแนะนำ 1:1 (PNG, JPG)</p>
                  </div>
                )}
              </div>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 4, bgcolor: '#ffffff', borderTop: '1px solid #f8fafc' }}>
          <Button onClick={() => setPartnerDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold', px: 3, textTransform: 'none' }}>ยกเลิก</Button>
          <Button onClick={handleSavePartner} variant="contained" disabled={!partnerForm.name || partnerForm.percentage <= 0} sx={{ borderRadius: '14px', px: 5, py: 1.2, fontWeight: 'bold', textTransform: 'none', bgcolor: '#9333ea', boxShadow: '0 8px 20px -6px rgba(147, 51, 234, 0.5)', '&:hover': { bgcolor: '#7e22ce' }, '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }}}>บันทึกข้อมูล</Button>
        </DialogActions>
      </Dialog>

      {/* 2. ตั้งค่าต้นทุนหลัก */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}}>
        <DialogTitle sx={{ pb: 3, pt: 4, px: 4, bgcolor: '#ffffff', borderBottom: '1px solid #f8fafc' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center"><Settings className="w-6 h-6 text-slate-600" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-none mb-1">ตั้งค่าต้นทุนคงที่</h2>
              <p className="text-xs text-slate-400 font-medium">รายการเหล่านี้จะถูกหักจากรายรับอัตโนมัติทุกวัน</p>
            </div>
          </div>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3, bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            
            <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-4">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-700">รายการต้นทุนรายวัน</h3>
                <Button size="small" variant="contained" startIcon={<Plus className="w-4 h-4"/>} onClick={() => handleAddCost()} sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#334155', boxShadow: 'none', '&:hover': { bgcolor: '#0f172a' }}}>เพิ่มรายการ</Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {settingsForm.customCosts.map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{cost.name}</p>
                      <p className="text-xs text-rose-500 font-bold mt-0.5">฿{cost.amount.toLocaleString()} / วัน</p>
                    </div>
                    <div className="flex gap-1">
                      <IconButton size="small" onClick={() => handleAddCost(cost)} sx={{ bgcolor: '#f8fafc' }}><Edit2 className="w-4 h-4 text-slate-600" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteCost(cost.id)} sx={{ bgcolor: '#fff1f2' }}><Trash2 className="w-4 h-4 text-rose-500" /></IconButton>
                    </div>
                  </div>
                ))}
                {settingsForm.customCosts.length === 0 && <p className="text-center text-slate-400 py-4 text-sm font-medium">ยังไม่มีการตั้งค่าต้นทุนคงที่</p>}
              </div>
            </div>

            <TextField fullWidth type="number" label="เปอร์เซ็นต์หักเก็บไว้ลงทุนต่อ (%)" value={settingsForm.reinvestmentPercentage} onChange={(e) => setSettingsForm({ ...settingsForm, reinvestmentPercentage: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }} helperText="รายได้สุทธิส่วนนี้จะไม่ถูกนำไปปันผลให้หุ้นส่วน" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 4, bgcolor: '#ffffff', borderTop: '1px solid #f8fafc' }}>
          <Button onClick={() => setSettingsDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold', px: 3, textTransform: 'none' }}>ยกเลิก</Button>
          <Button onClick={handleSaveSettings} variant="contained" sx={{ borderRadius: '14px', px: 5, py: 1.2, fontWeight: 'bold', textTransform: 'none', bgcolor: '#334155', boxShadow: '0 8px 20px -6px rgba(15, 23, 42, 0.5)', '&:hover': { bgcolor: '#0f172a' }}}>บันทึกการตั้งค่า</Button>
        </DialogActions>
      </Dialog>

      {/* 3. เพิ่ม/แก้ไข รายการต้นทุน */}
      <Dialog open={costDialogOpen} onClose={() => setCostDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}}>
        <DialogTitle sx={{ pb: 3, pt: 4, px: 4, bgcolor: '#ffffff', borderBottom: '1px solid #f8fafc' }}>
          <h2 className="text-xl font-bold text-slate-800 leading-none mb-1">{editingCost ? 'แก้ไขรายการ' : 'เพิ่มรายการต้นทุน'}</h2>
          <p className="text-xs text-slate-400 font-medium">ระบุต้นทุนที่ต้องจ่ายคงที่ในทุกๆ วัน</p>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3, bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField fullWidth label="ชื่อรายการ" value={costForm.name} onChange={(e) => setCostForm({ ...costForm, name: e.target.value })} placeholder="เช่น ค่าเช่าที่, ค่าไฟ" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }} />
            <TextField fullWidth type="number" label="จำนวนเงิน (บาท/วัน)" value={costForm.amount || ''} onChange={(e) => setCostForm({ ...costForm, amount: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }} InputProps={{ startAdornment: <span className="text-slate-400 font-bold mr-2 text-sm">฿</span> }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 4, bgcolor: '#ffffff', borderTop: '1px solid #f8fafc' }}>
          <Button onClick={() => setCostDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold', px: 3, textTransform: 'none' }}>ยกเลิก</Button>
          <Button onClick={handleSaveCost} variant="contained" disabled={!costForm.name || costForm.amount <= 0} sx={{ borderRadius: '14px', px: 5, py: 1.2, fontWeight: 'bold', textTransform: 'none', bgcolor: '#334155', boxShadow: '0 8px 20px -6px rgba(15, 23, 42, 0.5)', '&:hover': { bgcolor: '#0f172a' }, '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }}}>บันทึก</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};