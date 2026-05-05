import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Partner, DailySale, CustomCost } from '../types';
import { Button, TextField, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip } from '@mui/material';
import { Calendar, Plus, Sparkles, Edit2, Trash2, Settings } from 'lucide-react';
import { format } from 'date-fns';

export const CalculationPage: React.FC = () => {
  const { partners, dailySales, settings, menuItems, employees, addPartner, updatePartner, deletePartner, addDailySale, updateSettings } = useBusiness();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingCost, setEditingCost] = useState<CustomCost | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', percentage: 0, image: '' });
  const [costForm, setCostForm] = useState({ name: '', amount: 0 });
  const [settingsForm, setSettingsForm] = useState(settings);
  const [salesAmount, setSalesAmount] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const currentSale = dailySales.find((s) => s.date === selectedDate);

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
      reader.onloadend = () => {
        setPartnerForm({ ...partnerForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSales = () => {
    const sale: DailySale = {
      date: selectedDate,
      sales: salesAmount,
      menuSales: {},
    };
    addDailySale(sale);
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
    const totalSales = currentSale?.sales || salesAmount;
    const totalCosts = getTotalCustomCosts() + calculateEmployeeDailyCost();
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
      const newCost: CustomCost = {
        id: Date.now().toString(),
        name: costForm.name,
        amount: costForm.amount,
      };
      setSettingsForm({ ...settingsForm, customCosts: [...settingsForm.customCosts, newCost] });
    }
    setCostDialogOpen(false);
  };

  const handleDeleteCost = (costId: string) => {
    const updatedCosts = settingsForm.customCosts.filter((c) => c.id !== costId);
    setSettingsForm({ ...settingsForm, customCosts: updatedCosts });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl">💰 คำนวณและหุ้นส่วน</h1>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<Settings />} onClick={() => { setSettingsForm(settings); setSettingsDialogOpen(true); }}>
            ตั้งค่าต้นทุน
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              บันทึกยอดขาย
            </h2>
            <div className="space-y-4">
              <TextField
                fullWidth
                type="date"
                label="เลือกวันที่"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="number"
                label="ยอดขายวันนี้ (บาท)"
                value={currentSale?.sales || salesAmount}
                onChange={(e) => setSalesAmount(Number(e.target.value))}
              />
              <Button fullWidth variant="contained" onClick={handleSaveSales}>
                บันทึกยอดขาย
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">ต้นทุนรายวัน</h3>
              <div className="space-y-1 text-sm">
                {settings.customCosts.map((cost) => (
                  <div key={cost.id} className="flex justify-between">
                    <span>{cost.name}:</span>
                    <span>฿{cost.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span>ค่าพนักงาน:</span>
                  <span>฿{calculateEmployeeDailyCost().toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>รวม:</span>
                  <span>฿{(getTotalCustomCosts() + calculateEmployeeDailyCost()).toLocaleString()}</span>
                </div>
              </div>
            </div>
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

            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<Sparkles />}
              onClick={handleAIAnalysis}
              className="mt-4"
            >
              วิเคราะห์ด้วย AI
            </Button>

            {aiAnalysis && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  ผลการวิเคราะห์
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ยอดขายรวม:</span>
                    <span className="font-semibold">฿{aiAnalysis.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ต้นทุนรวม:</span>
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
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>กำไรสุทธิ:</span>
                    <span className={aiAnalysis.netProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                      ฿{aiAnalysis.netProfit.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <p className="font-semibold mb-2">การแบ่งกำไร:</p>
                    {aiAnalysis.partnerShares.map((share: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{share.name} ({share.percentage}%):</span>
                        <span className="font-semibold text-green-600">฿{share.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-2 bg-white rounded text-center">
                    {aiAnalysis.isProfitable ? (
                      <span className="text-green-600 font-bold">✅ มีกำไร</span>
                    ) : (
                      <span className="text-red-600 font-bold">⚠️ ขาดทุน</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={partnerDialogOpen} onClose={() => setPartnerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPartner ? 'แก้ไขหุ้นส่วน' : 'เพิ่มหุ้นส่วน'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="ชื่อหุ้นส่วน"
              value={partnerForm.name}
              onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
            />
            <TextField
              fullWidth
              type="number"
              label="เปอร์เซ็นต์ (%)"
              value={partnerForm.percentage}
              onChange={(e) => setPartnerForm({ ...partnerForm, percentage: Number(e.target.value) })}
            />
            <div>
              <label className="block text-sm mb-2">รูปภาพ</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm" />
              {partnerForm.image && (
                <img src={partnerForm.image} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartnerDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSavePartner} variant="contained">บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ตั้งค่าต้นทุน</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">รายการต้นทุน</h3>
              <Button size="small" startIcon={<Plus />} onClick={() => handleAddCost()}>
                เพิ่มรายการ
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {settingsForm.customCosts.map((cost) => (
                <div key={cost.id} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-semibold">{cost.name}</p>
                    <p className="text-sm text-gray-600">฿{cost.amount.toLocaleString()}</p>
                  </div>
                  <IconButton size="small" onClick={() => handleAddCost(cost)}>
                    <Edit2 className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteCost(cost.id)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
            </div>

            <TextField
              fullWidth
              type="number"
              label="เปอร์เซ็นต์เอาไปลงทุนต่อ (%)"
              value={settingsForm.reinvestmentPercentage}
              onChange={(e) => setSettingsForm({ ...settingsForm, reinvestmentPercentage: Number(e.target.value) })}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSaveSettings} variant="contained">บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={costDialogOpen} onClose={() => setCostDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCost ? 'แก้ไขรายการ' : 'เพิ่มรายการต้นทุน'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="ชื่อรายการ"
              value={costForm.name}
              onChange={(e) => setCostForm({ ...costForm, name: e.target.value })}
              placeholder="เช่น ค่าไฟ, ค่าวัตถุดิบ"
            />
            <TextField
              fullWidth
              type="number"
              label="จำนวนเงิน (บาท/วัน)"
              value={costForm.amount}
              onChange={(e) => setCostForm({ ...costForm, amount: Number(e.target.value) })}
            />
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
