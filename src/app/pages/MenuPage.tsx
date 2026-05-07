import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { MenuItem, DailySale } from '../types';
import { Plus, Edit2, Trash2, ShoppingCart, CheckCircle, Settings as SettingsIcon, Minus, ImagePlus, ShoppingBag, Banknote, QrCode, Ticket } from 'lucide-react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { format } from 'date-fns';

type CheckoutStep = 'confirm' | 'success_cash' | 'success_scan' | null;

export const MenuPage: React.FC = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, addDailySale, updateDailySale, dailySales } = useBusiness();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    emoji: '🍔',
    image: '',
  });
  
  const [cart, setCart] = useState<{ [menuId: string]: number }>({});
  const [showManageMode, setShowManageMode] = useState(false);
  
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(null);
  const [queueNumber, setQueueNumber] = useState<string>('');
  const [lastOrder, setLastOrder] = useState<{ menuId: string; name: string; emoji: string; count: number; total: number }[]>([]);

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, price: item.price, description: item.description, emoji: item.emoji, image: item.image || '' });
    } else {
      setEditingItem(null);
      setFormData({ name: '', price: 0, description: '', emoji: '🍔', image: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const item: MenuItem = { id: editingItem?.id || Date.now().toString(), ...formData, image: formData.image || undefined };
    if (editingItem) updateMenuItem(editingItem.id, item);
    else addMenuItem(item);
    setDialogOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const addToCart = (menuId: string) => setCart({ ...cart, [menuId]: (cart[menuId] || 0) + 1 });

  const removeFromCart = (menuId: string) => {
    const newCount = (cart[menuId] || 0) - 1;
    if (newCount <= 0) {
      const newCart = { ...cart };
      delete newCart[menuId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [menuId]: newCount });
    }
  };

  const getTotalPrice = () => Object.entries(cart).reduce((total, [menuId, count]) => {
    const item = menuItems.find((m) => m.id === menuId);
    return total + (item?.price || 0) * count;
  }, 0);

  const getTotalItems = () => Object.values(cart).reduce((sum, count) => sum + count, 0);

  const handleStartCheckout = () => {
    const orderDetails = Object.entries(cart).map(([menuId, count]) => {
      const item = menuItems.find((m) => m.id === menuId);
      return item ? { menuId, name: item.name, emoji: item.emoji, count, total: item.price * count } : null;
    }).filter((item) => item !== null).sort((a, b) => b!.count - a!.count);

    setLastOrder(orderDetails as any);
    const randomQueue = `A${String(Math.floor(Math.random() * 99) + 1).padStart(3, '0')}`;
    setQueueNumber(randomQueue);
    setCheckoutStep('confirm');
  };

  const handleSelectPayment = (method: 'cash' | 'scan') => setCheckoutStep(method === 'cash' ? 'success_cash' : 'success_scan');

  const handleFinalizePayment = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const totalSales = getTotalPrice();
    const existingSale = dailySales.find((s) => s.date === today);
    
    const newMenuSales = { ...(existingSale?.menuSales || {}) };
    Object.entries(cart).forEach(([menuId, count]) => { 
      newMenuSales[menuId] = (newMenuSales[menuId] || 0) + count; 
    });

    const sale: DailySale = { 
      date: today, 
      sales: (existingSale?.sales || 0) + totalSales, 
      menuSales: newMenuSales,
      incomes: existingSale?.incomes || [],
      expenses: existingSale?.expenses || [],
    };

    if (existingSale) updateDailySale(today, sale);
    else addDailySale(sale);

    setCart({});
    setCheckoutStep(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* ---------------- Header Section ---------------- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            {showManageMode ? 'จัดการแคตตาล็อกสินค้า' : 'ระบบขายหน้าร้าน (POS)'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {showManageMode ? 'เพิ่ม แก้ไข หรือลบรายการสินค้าในระบบของคุณ' : 'เลือกสินค้าเพื่อดำเนินการชำระเงิน'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={showManageMode ? 'contained' : 'outlined'}
            startIcon={<SettingsIcon className="w-4 h-4" />}
            onClick={() => setShowManageMode(!showManageMode)}
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none', 
              fontWeight: 600,
              color: showManageMode ? 'white' : '#475569',
              borderColor: '#cbd5e1',
              bgcolor: showManageMode ? '#475569' : 'transparent',
              '&:hover': { bgcolor: showManageMode ? '#334155' : '#f8fafc', borderColor: '#94a3b8' }
            }}
          >
            {showManageMode ? 'สลับไปโหมดขาย' : 'จัดการสินค้า'}
          </Button>
          {showManageMode && (
            <Button 
              variant="contained" 
              startIcon={<Plus className="w-4 h-4" />} 
              onClick={() => handleOpenDialog()} 
              sx={{ borderRadius: '8px', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
            >
              เพิ่มสินค้าใหม่
            </Button>
          )}
        </div>
      </div>

      {/* ---------------- Cart Summary Banner ---------------- */}
      {!showManageMode && (
        <div className="mb-8 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 px-6 py-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                <ShoppingBag className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-slate-400 font-medium text-xs tracking-widest uppercase mb-1">รายการสินค้าในตะกร้า</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl md:text-4xl font-bold text-white">{getTotalItems()}</p>
                  <p className="text-sm text-slate-400 font-medium">รายการ</p>
                </div>
              </div>
            </div>

            <div className="hidden sm:block h-12 w-px bg-slate-700"></div>

            <div className="flex flex-col sm:items-end w-full sm:w-auto flex-grow">
              <p className="text-slate-400 font-medium text-xs tracking-widest uppercase mb-1">ยอดรวมสุทธิ</p>
              <p className="text-3xl md:text-4xl font-bold text-emerald-400 tracking-tight">฿{getTotalPrice().toLocaleString()}</p>
            </div>

            <Button
              variant="contained"
              size="large"
              startIcon={<CheckCircle className="w-5 h-5" />}
              onClick={handleStartCheckout}
              disabled={getTotalItems() === 0}
              sx={{ 
                bgcolor: '#4f46e5', 
                color: 'white', 
                fontWeight: 700,
                fontSize: '1rem',
                px: 4,
                py: 1.5,
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#4338ca' },
                '&.Mui-disabled': { bgcolor: '#334155', color: '#64748b' }
              }}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              ดำเนินการชำระเงิน
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- Menu Grid ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => !showManageMode && addToCart(item.id)}
            className={`group relative flex flex-col bg-white rounded-3xl p-4 transition-all duration-300 
              ${!showManageMode ? 'cursor-pointer hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1.5 border border-slate-100 shadow-sm' : 'border border-slate-200 shadow-sm'}
            `}
          >
            {!showManageMode && cart[item.id] > 0 && (
              <div className="absolute -top-3 -right-3 bg-pink-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-lg shadow-pink-500/40 z-20 animate-in zoom-in duration-200 border-2 border-white">
                {cart[item.id]}
              </div>
            )}

            <div className="aspect-square w-full rounded-2xl mb-4 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative">
              {item.image ? (
                 <img src={item.image} alt={item.name} className={`object-cover w-full h-full ${!showManageMode && 'group-hover:scale-110'} transition-transform duration-500`} />
              ) : (
                <span className={`text-6xl drop-shadow-sm ${!showManageMode && 'group-hover:scale-125'} transition-transform duration-500`}>{item.emoji}</span>
              )}
              
              {showManageMode && (
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDialog(item); }} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#f0f9ff', color: '#0284c7' } }}>
                    <Edit2 className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteMenuItem(item.id); }} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#fef2f2', color: '#dc2626' } }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </IconButton>
                </div>
              )}
            </div>
            
            <div className="flex flex-col flex-grow text-left px-1">
              <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2">{item.name}</h3>
              {showManageMode && <p className="text-slate-500 text-xs line-clamp-2 mb-2 leading-relaxed">{item.description}</p>}
              <div className="mt-auto pt-2 flex items-center justify-between">
                <p className="text-indigo-600 font-extrabold text-xl tracking-tight">฿{item.price.toLocaleString()}</p>
              </div>
            </div>

            {!showManageMode && (
              <div className="mt-4">
                {cart[item.id] > 0 ? (
                  <div className="flex items-center justify-between bg-blue-50/80 rounded-xl p-1 border border-blue-100/50">
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} sx={{ bgcolor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover':{ bgcolor: '#fee2e2' } }}>
                      <Minus className="w-4 h-4" />
                    </IconButton>
                    <span className="font-bold text-blue-800 text-lg w-8 text-center">{cart[item.id]}</span>
                    <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); addToCart(item.id); }} sx={{ bgcolor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', '&:hover':{ bgcolor: '#dbeafe' } }}>
                      <Plus className="w-4 h-4" />
                    </IconButton>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-slate-400 text-sm font-semibold group-hover:text-indigo-600 transition-colors">
                    <ShoppingCart className="w-4 h-4 mr-2" /> หยิบใส่ตะกร้า
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 mt-8">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">ยังไม่มีเมนูสินค้า</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">เริ่มสร้างเมนูสินค้าแรกของคุณ เพื่อเปิดการขายบนระบบ BizFlow ได้เลย</p>
          <Button variant="contained" size="large" startIcon={<Plus />} onClick={() => { setShowManageMode(true); handleOpenDialog(); }} sx={{ borderRadius: '14px', px: 6, py: 1.5, fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(37 99 235 / 0.2)' }}>
            สร้างเมนูใหม่
          </Button>
        </div>
      )}

      {/* ---------------- Dialog: จัดการเมนู ---------------- */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' } }}>
        <DialogTitle sx={{ pb: 2, pt: 3, px: 4, bgcolor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              {editingItem ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
            </div>
            <span className="text-xl font-bold text-gray-800">
              {editingItem ? 'แก้ไขรายละเอียดเมนู' : 'เพิ่มเมนูใหม่'}
            </span>
          </div>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 4, bgcolor: '#ffffff' }}>
          <div className="space-y-6 mt-2">
            <div className="flex gap-4">
              <div className="w-28 shrink-0">
                <TextField fullWidth label="Emoji" value={formData.emoji} onChange={(e) => setFormData({ ...formData, emoji: e.target.value })} placeholder="🍔" inputProps={{ style: { fontSize: '2rem', textAlign: 'center', padding: '12px' } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              </div>
              <div className="flex-1">
                <TextField fullWidth label="ชื่อเมนู" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น ข้าวกะเพราหมูสับ" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
              </div>
            </div>
            <TextField fullWidth label="ราคา (บาท)" type="number" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="0" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} InputProps={{ startAdornment: <span className="text-gray-400 font-semibold mr-2">฿</span>, }} />
            <TextField fullWidth label="คำอธิบาย (ตัวเลือก)" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="อธิบายส่วนผสม หรือจุดเด่นของเมนูนี้..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            
            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">รูปภาพประกอบเมนู</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group bg-slate-50/50">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {formData.image ? (
                  <div className="relative">
                    <img src={formData.image} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-sm" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-sm">
                      <div className="bg-white text-gray-800 px-5 py-2.5 rounded-full font-medium flex items-center gap-2 shadow-lg transform transition-transform group-hover:scale-105">
                        <Edit2 className="w-4 h-4" /> เปลี่ยนรูปภาพ
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-blue-500 group-hover:text-white">
                      <ImagePlus className="w-8 h-8" />
                    </div>
                    <p className="text-base font-semibold text-slate-700 mb-1">คลิกหรือลากรูปภาพมาวางที่นี่</p>
                    <p className="text-sm text-slate-500">รองรับไฟล์ JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 'bold', px: 3, borderRadius: '10px' }}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name || formData.price <= 0} sx={{ borderRadius: '10px', px: 4, py: 1.2, boxShadow: '0 4px 14px 0 rgb(59 130 246 / 0.39)', fontWeight: 'bold', fontSize: '1rem' }}>บันทึกข้อมูล</Button>
        </DialogActions>
      </Dialog>

      {/* ---------------- Dialog: Checkout Flow ---------------- */}
      <Dialog open={checkoutStep !== null} onClose={() => checkoutStep === 'confirm' ? setCheckoutStep(null) : {}} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' }}}>
        {checkoutStep === 'confirm' && (
          <>
            <DialogTitle sx={{ pb: 2, pt: 3, px: 4, bgcolor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" /> สรุปคำสั่งซื้อ
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                  {lastOrder.reduce((sum, item) => sum + item.count, 0)} รายการ
                </span>
              </div>
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
              <div className="max-h-60 overflow-y-auto px-4 py-4 space-y-2">
                {lastOrder.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-xs font-medium text-slate-500">{item.count} x ฿{(item.total/item.count).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-800">฿{item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-4 bg-white border-t border-slate-200">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">ยอดชำระสุทธิ</span>
                  <span className="text-4xl font-black text-indigo-600">
                    ฿{lastOrder.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-center text-sm font-bold text-slate-600 mb-3 border-t pt-4">เลือกวิธีชำระเงิน</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outlined" onClick={() => handleSelectPayment('cash')} sx={{ flexDirection: 'column', py: 2, borderRadius: '16px', border: '2px solid #e2e8f0', color: '#475569', '&:hover': { borderColor: '#10b981', bgcolor: '#f0fdf4', color: '#059669' }}}>
                    <Banknote className="w-8 h-8 mb-2" />
                    <span className="font-bold">เงินสด</span>
                  </Button>
                  <Button variant="outlined" onClick={() => handleSelectPayment('scan')} sx={{ flexDirection: 'column', py: 2, borderRadius: '16px', border: '2px solid #e2e8f0', color: '#475569', '&:hover': { borderColor: '#3b82f6', bgcolor: '#eff6ff', color: '#2563eb' }}}>
                    <QrCode className="w-8 h-8 mb-2" />
                    <span className="font-bold">สแกนจ่าย / โอน</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#ffffff' }}>
              <Button onClick={() => setCheckoutStep(null)} fullWidth sx={{ color: 'text.secondary', fontWeight: 'bold', py: 1.5 }}>
                ยกเลิกคำสั่งซื้อ
              </Button>
            </DialogActions>
          </>
        )}

        {(checkoutStep === 'success_cash' || checkoutStep === 'success_scan') && (
          <>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-xl">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">ทำรายการสำเร็จ!</h2>
              <p className="text-emerald-100 mt-2 font-medium">รอรับสินค้าตามหมายเลขคิว</p>
            </div>
            
            <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
              <div className="px-6 pt-6 pb-2 text-center">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 inline-block min-w-[200px]">
                  <div className="flex items-center justify-center gap-2 text-slate-500 mb-1">
                    <Ticket className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-widest">คิวของคุณ</span>
                  </div>
                  <p className="text-5xl font-black text-slate-800">{queueNumber}</p>
                </div>
              </div>

              {/* โซนแสดงรูปภาพ QR Code สแกนจ่าย */}
              {checkoutStep === 'success_scan' && (
                <div className="px-6 py-4 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                    
                    {/* เปลี่ยนมาใช้แท็ก img เพื่อดึงรูปภาพจากโฟลเดอร์ public */}
                    <img 
                      src="/promptpay.png"  /* <--- นำไฟล์รูปของคุณใส่ในโฟลเดอร์ public/promptpay.png */
                      alt="QR Code สำหรับรับเงิน" 
                      className="w-48 h-48 object-contain rounded-lg"
                      onError={(e) => {
                        // โค้ดส่วนนี้จะทำงานถ้าระบบหารูป promptpay.png ไม่เจอ (แสดงรูปสำรองแทน)
                        e.currentTarget.src = "https://placehold.co/300x300/f8fafc/94a3b8?text=QR+Code"; 
                      }}
                    />
                    
                    <p className="text-sm font-bold text-slate-700 mt-3">สแกนเพื่อชำระเงิน</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      ยอดชำระ: <span className="font-bold text-indigo-600">฿{lastOrder.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="px-6 py-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-700 text-sm">รายการสั่งซื้อ</h3>
                  <span className="font-bold text-indigo-600">฿{lastOrder.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lastOrder.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                      <span className="text-slate-600">{item.count}x {item.name}</span>
                      <span className="font-semibold text-slate-800">฿{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
            
            <DialogActions sx={{ px: 6, pb: 6, pt: 2, bgcolor: '#f8fafc' }}>
              <Button onClick={handleFinalizePayment} variant="contained" fullWidth size="large" sx={{ borderRadius: '16px', py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)' }}>
                เสร็จสิ้นการสั่งซื้อ
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};