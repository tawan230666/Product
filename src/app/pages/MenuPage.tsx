import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { MenuItem, DailySale } from '../types';
import { Plus, Edit2, Trash2, ShoppingCart, CheckCircle, Settings as SettingsIcon, Minus } from 'lucide-react';
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
        <h1 className="text-3xl">🛍️ {showManageMode ? 'จัดการเมนูสินค้า' : 'หน้าขาย (POS)'}</h1>
        <div className="flex gap-2">
          <Button
            variant={showManageMode ? 'contained' : 'outlined'}
            startIcon={<SettingsIcon />}
            onClick={() => setShowManageMode(!showManageMode)}
          >
            {showManageMode ? 'โหมดขาย' : 'จัดการเมนู'}
          </Button>
          {showManageMode && (
            <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenDialog()}>
              เพิ่มเมนูใหม่
            </Button>
          )}
        </div>
      </div>

      {!showManageMode && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">รายการในตะกร้า</p>
              <p className="text-3xl font-bold">{getTotalItems()} รายการ</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">ยอดรวม</p>
              <p className="text-3xl font-bold">฿{getTotalPrice().toLocaleString()}</p>
            </div>
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckCircle />}
              onClick={handleConfirmOrder}
              disabled={getTotalItems() === 0}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'gray.100' } }}
            >
              ยืนยันคำสั่งซื้อ
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {menuItems.map((item) => (
          <Card
            key={item.id}
            sx={{
              cursor: !showManageMode ? 'pointer' : 'default',
              transition: 'all 0.2s',
              '&:hover': !showManageMode ? { transform: 'scale(1.02)', boxShadow: 4 } : {},
            }}
            onClick={() => !showManageMode && addToCart(item.id)}
          >
            <CardContent>
              {showManageMode ? (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-4xl">{item.emoji}</span>
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-green-600 font-bold">฿{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <IconButton size="small" onClick={() => handleOpenDialog(item)}>
                        <Edit2 className="w-4 h-4" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteMenuItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded mb-2" />}
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </>
              ) : (
                <>
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded mb-3" />}
                  <div className="text-center">
                    <span className="text-5xl mb-2 block">{item.emoji}</span>
                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                    <p className="text-green-600 font-bold text-xl mb-2">฿{item.price.toLocaleString()}</p>
                    {cart[item.id] > 0 && (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
                        >
                          <Minus className="w-4 h-4" />
                        </IconButton>
                        <Chip
                          label={`${cart[item.id]} รายการ`}
                          color="primary"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item.id);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีเมนูสินค้า</p>
          <p className="text-sm">คลิก "จัดการเมนู" เพื่อเพิ่มสินค้า</p>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Emoji"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              placeholder="🍔"
            />
            <TextField
              fullWidth
              label="ชื่อเมนู"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="ราคา (บาท)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            />
            <TextField
              fullWidth
              label="คำอธิบาย"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div>
              <label className="block text-sm mb-2">รูปภาพ</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm"
              />
              {formData.image && (
                <img src={formData.image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained">บันทึก</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={orderSummaryOpen} onClose={() => setOrderSummaryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-green-500 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" />
            <span>บันทึกคำสั่งซื้อสำเร็จ!</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="mt-4 space-y-3">
            <div className="text-center mb-4">
              <p className="text-gray-600">ยอดรวมทั้งหมด</p>
              <p className="text-4xl font-bold text-green-600">
                ฿{lastOrder.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
              </p>
            </div>

            <Divider />

            <h3 className="font-semibold text-lg mt-4">รายการที่สั่ง</h3>
            {lastOrder.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.count} รายการ</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">฿{item.total.toLocaleString()}</p>
              </div>
            ))}

            <div className="mt-4 p-3 bg-blue-50 rounded text-center">
              <p className="text-sm text-gray-600">บันทึกเข้าระบบแล้ว วันที่ {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderSummaryOpen(false)} variant="contained" fullWidth size="large">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
