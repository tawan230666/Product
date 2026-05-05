import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { MenuItem, DailySale } from '../types';
import { Plus, Edit2, Trash2, ShoppingCart, CheckCircle, Settings as SettingsIcon, Minus, ImagePlus } from 'lucide-react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, IconButton, Chip, Divider } from '@mui/material';
import { format } from 'date-fns';

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
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{ menuId: string; name: string; emoji: string; count: number; total: number }[]>([]);

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price,
        description: item.description,
        emoji: item.emoji,
        image: item.image || '',
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', price: 0, description: '', emoji: '🍔', image: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const item: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      ...formData,
      image: formData.image || undefined,
    };

    if (editingItem) {
      updateMenuItem(editingItem.id, item);
    } else {
      addMenuItem(item);
    }
    setDialogOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addToCart = (menuId: string) => {
    setCart({ ...cart, [menuId]: (cart[menuId] || 0) + 1 });
  };

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

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [menuId, count]) => {
      const item = menuItems.find((m) => m.id === menuId);
      return total + (item?.price || 0) * count;
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const handleConfirmOrder = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const totalSales = getTotalPrice();

    const orderDetails = Object.entries(cart)
      .map(([menuId, count]) => {
        const item = menuItems.find((m) => m.id === menuId);
        return item ? {
          menuId,
          name: item.name,
          emoji: item.emoji,
          count,
          total: item.price * count,
        } : null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => b!.count - a!.count);

    setLastOrder(orderDetails as any);

    const existingSale = dailySales.find((s) => s.date === today);
    const newMenuSales = { ...(existingSale?.menuSales || {}), ...cart };

    Object.entries(cart).forEach(([menuId, count]) => {
      newMenuSales[menuId] = (newMenuSales[menuId] || 0) + count;
    });

    const sale: DailySale = {
      date: today,
      sales: (existingSale?.sales || 0) + totalSales,
      menuSales: newMenuSales,
    };

    if (existingSale) {
      updateDailySale(today, sale);
    } else {
      addDailySale(sale);
    }

    setCart({});
    setOrderSummaryOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">🛍️ {showManageMode ? 'จัดการเมนูสินค้า' : 'หน้าขาย (POS)'}</h1>
        <div className="flex gap-2">
          <Button
            variant={showManageMode ? 'contained' : 'outlined'}
            startIcon={<SettingsIcon />}
            onClick={() => setShowManageMode(!showManageMode)}
            sx={{ borderRadius: '8px' }}
          >
            {showManageMode ? 'สลับไปโหมดขาย' : 'จัดการเมนู'}
          </Button>
          {showManageMode && (
            <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenDialog()} sx={{ borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
              เพิ่มเมนูใหม่
            </Button>
          )}
        </div>
      </div>

      {!showManageMode && (
        <div className="mb-6 p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg border border-indigo-400/30">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-indigo-100 font-medium mb-1">รายการในตะกร้า</p>
              <p className="text-4xl font-bold tracking-tight">{getTotalItems()} <span className="text-xl font-normal opacity-80">รายการ</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-100 font-medium mb-1">ยอดรวมทั้งหมด</p>
              <p className="text-4xl font-bold tracking-tight">฿{getTotalPrice().toLocaleString()}</p>
            </div>
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckCircle className="w-5 h-5" />}
              onClick={handleConfirmOrder}
              disabled={getTotalItems() === 0}
              sx={{ 
                bgcolor: 'white', 
                color: '#4f46e5', 
                fontWeight: 'bold',
                px: 4,
                py: 1.5,
                borderRadius: '10px',
                '&:hover': { bgcolor: '#f8fafc' },
                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.5)' }
              }}
            >
              ยืนยันคำสั่งซื้อ
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {menuItems.map((item) => (
          <Card
            key={item.id}
            sx={{
              cursor: !showManageMode ? 'pointer' : 'default',
              transition: 'all 0.2s',
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              '&:hover': !showManageMode ? { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } : {},
            }}
            onClick={() => !showManageMode && addToCart(item.id)}
          >
            <CardContent className="p-4">
              {showManageMode ? (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-3xl shadow-inner">
                        {item.emoji}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h3>
                        <p className="text-green-600 font-bold">฿{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 -mr-2 -mt-2">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDialog(item); }} color="primary">
                        <Edit2 className="w-4 h-4" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); deleteMenuItem(item.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-lg mb-3 border border-gray-100" />}
                  <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                </>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="relative mb-4 group">
                    {item.image ? (
                       <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded-xl shadow-sm" />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-6xl drop-shadow-sm">{item.emoji}</span>
                      </div>
                    )}
                    {cart[item.id] > 0 && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg ring-2 ring-white">
                        {cart[item.id]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-grow text-center">
                    <h3 className="font-bold text-gray-800 text-lg mb-1 leading-tight">{item.name}</h3>
                    <p className="text-green-600 font-bold text-xl mb-4 mt-auto">฿{item.price.toLocaleString()}</p>
                    
                    {cart[item.id] > 0 ? (
                      <div className="flex items-center justify-between bg-blue-50 rounded-lg p-1">
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} sx={{ bgcolor: 'white', '&:hover':{ bgcolor: '#fee2e2' } }}>
                          <Minus className="w-4 h-4" />
                        </IconButton>
                        <span className="font-bold text-blue-800">{cart[item.id]}</span>
                        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); addToCart(item.id); }} sx={{ bgcolor: 'white', '&:hover':{ bgcolor: '#dbeafe' } }}>
                          <Plus className="w-4 h-4" />
                        </IconButton>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 py-2 border border-dashed border-gray-200 rounded-lg">
                        คลิกเพื่อเลือก
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 mt-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีเมนูสินค้า</h3>
          <p className="text-gray-500 mb-6">เริ่มสร้างเมนูสินค้าของคุณเพื่อเริ่มต้นการขาย</p>
          <Button variant="contained" startIcon={<Plus />} onClick={() => { setShowManageMode(true); handleOpenDialog(); }} sx={{ borderRadius: '8px' }}>
            สร้างเมนูแรก
          </Button>
        </div>
      )}

     {/* ----------------------------------------------------- */}
      {/* 🎨 ปรับโฉม Dialog เพิ่ม/แก้ไขเมนู ให้สวยงามและเป็นระเบียบ */}
      {/* ----------------------------------------------------- */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: '24px', 
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' 
          }
        }}
      >
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
            
            {/* Row 1: Emoji & Name */}
            <div className="flex gap-4">
              <div className="w-28 shrink-0">
                <TextField
                  fullWidth
                  label="Emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="🍔"
                  inputProps={{ style: { fontSize: '2rem', textAlign: 'center', padding: '12px' } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </div>
              <div className="flex-1">
                <TextField
                  fullWidth
                  label="ชื่อเมนู"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ข้าวกะเพราหมูสับ"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </div>
            </div>

            {/* Row 2: Price */}
            <TextField
              fullWidth
              label="ราคา (บาท)"
              type="number"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              placeholder="0"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              InputProps={{
                startAdornment: <span className="text-gray-400 font-semibold mr-2">฿</span>,
              }}
            />

            {/* Row 3: Description */}
            <TextField
              fullWidth
              label="คำอธิบาย (ตัวเลือก)"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="อธิบายส่วนผสม หรือจุดเด่นของเมนูนี้..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Row 4: Custom Image Upload Zone */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">รูปภาพประกอบเมนู</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group bg-gray-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
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
                    <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-blue-500 group-hover:text-white">
                      <ImagePlus className="w-8 h-8" />
                    </div>
                    <p className="text-base font-semibold text-gray-800 mb-1">คลิกหรือลากรูปภาพมาวางที่นี่</p>
                    <p className="text-sm text-gray-500">รองรับไฟล์ JPG, PNG, WEBP (ขนาดแนะนำ 800x800px)</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ color: 'text.secondary', fontWeight: 'bold', px: 3, borderRadius: '10px' }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!formData.name || formData.price <= 0}
            sx={{ 
              borderRadius: '10px', 
              px: 4, 
              py: 1.2, 
              boxShadow: '0 4px 14px 0 rgb(59 130 246 / 0.39)', 
              fontWeight: 'bold',
              fontSize: '1rem' 
            }}
          >
            บันทึกข้อมูล
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Summary Dialog */}
      <Dialog open={orderSummaryOpen} onClose={() => setOrderSummaryOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' }}}>
        <div className="bg-green-500 p-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">บันทึกคำสั่งซื้อสำเร็จ!</h2>
        </div>
        <DialogContent sx={{ p: 4 }}>
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-500 font-medium mb-1">ยอดรวมชำระเงิน</p>
              <p className="text-5xl font-extrabold text-gray-800">
                ฿{lastOrder.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
              </p>
            </div>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <div>
              <h3 className="font-semibold text-gray-700 mb-3">รายการสั่งซื้อ ({lastOrder.reduce((sum, item) => sum + item.count, 0)} ชิ้น)</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {lastOrder.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.count} x ฿{(item.total/item.count).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-800">฿{item.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-center text-sm font-medium">
              ข้อมูลถูกบันทึกเข้าสู่ระบบบัญชีแล้ว (วันที่ {format(new Date(), 'dd/MM/yyyy')})
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 0 }}>
          <Button onClick={() => setOrderSummaryOpen(false)} variant="contained" fullWidth size="large" sx={{ borderRadius: '10px', py: 1.5, fontSize: '1.1rem' }}>
            ปิดหน้าต่าง
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};