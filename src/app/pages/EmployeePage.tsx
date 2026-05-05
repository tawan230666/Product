import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Employee } from '../types';
import { Button, TextField, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Select, MenuItem as MuiMenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { Plus, Edit2, Trash2, Users, ImagePlus, UserCircle } from 'lucide-react';

export const EmployeePage: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, settings } = useBusiness();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    salary: 0,
    paymentType: 'daily' as 'daily' | 'monthly' | 'yearly',
    image: '',
  });

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        position: employee.position,
        salary: employee.salary,
        paymentType: employee.paymentType,
        image: employee.image || '',
      });
    } else {
      setEditingEmployee(null);
      setFormData({ name: '', position: '', salary: 0, paymentType: 'daily', image: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const employee: Employee = {
      id: editingEmployee?.id || Date.now().toString(),
      ...formData,
      image: formData.image || undefined,
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employee);
    } else {
      addEmployee(employee);
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

  const calculateDailySalary = (employee: Employee) => {
    if (employee.paymentType === 'daily') return employee.salary;
    if (employee.paymentType === 'monthly') return employee.salary / 30;
    if (employee.paymentType === 'yearly') return employee.salary / 365;
    return 0;
  };

  const getPaymentTypeLabel = (type: string) => {
    if (type === 'daily') return 'รายวัน';
    if (type === 'monthly') return 'รายเดือน';
    if (type === 'yearly') return 'รายปี';
    return type;
  };

  const totalDailyCost = employees.reduce((sum, emp) => sum + calculateDailySalary(emp), 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          พนักงาน
        </h1>
        <Button 
          variant="contained" 
          startIcon={<Plus />} 
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: '8px', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontWeight: 'bold' }}
        >
          เพิ่มพนักงาน
        </Button>
      </div>

      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-blue-800 text-lg">ค่าจ้างรวมต่อวัน (ประมาณการ):</span>
          <span className="text-3xl font-black text-blue-600">฿{totalDailyCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {employees.map((employee) => (
          <Card 
            key={employee.id} 
            sx={{ 
              borderRadius: '16px', 
              border: '1px solid #f1f5f9', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {employee.image ? (
                  <img src={employee.image} alt={employee.name} className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-sm ring-1 ring-gray-100">
                    {employee.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1">{employee.name}</h3>
                      <p className="text-blue-600 text-sm font-medium mt-0.5">{employee.position}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 space-y-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">ประเภท</span>
                  <Chip 
                    label={getPaymentTypeLabel(employee.paymentType)} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                    sx={{ fontWeight: 'bold', bgcolor: 'white' }}
                  />
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-500 font-medium">ค่าจ้าง</span>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg leading-none">฿{employee.salary.toLocaleString()}</p>
                    {employee.paymentType !== 'daily' && (
                      <p className="text-xs text-gray-400 mt-1">
                        (≈ ฿{calculateDailySalary(employee).toLocaleString(undefined, { maximumFractionDigits: 0 })}/วัน)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button size="small" variant="text" onClick={() => handleOpenDialog(employee)} startIcon={<Edit2 className="w-4 h-4" />} sx={{ color: 'text.secondary', '&:hover': { bgcolor: '#f1f5f9' } }}>
                  แก้ไข
                </Button>
                <Button size="small" variant="text" color="error" onClick={() => deleteEmployee(employee.id)} startIcon={<Trash2 className="w-4 h-4" />} sx={{ '&:hover': { bgcolor: '#fee2e2' } }}>
                  ลบ
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 mt-4 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-blue-300" />
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีข้อมูลพนักงาน</p>
          <p className="text-gray-500 mb-6 text-sm">คลิก "เพิ่มพนักงาน" เพื่อเริ่มต้นจัดการทีมงานของคุณ</p>
          <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenDialog()} sx={{ borderRadius: '8px' }}>
            เพิ่มพนักงานคนแรก
          </Button>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* 🎨 ปรับโฉม Dialog เพิ่ม/แก้ไขพนักงาน ให้สวยงาม */}
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
              {editingEmployee ? <UserCircle className="w-6 h-6 text-blue-600" /> : <UserCircle className="w-6 h-6 text-blue-600" />}
            </div>
            <span className="text-xl font-bold text-gray-800">
              {editingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
            </span>
          </div>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 4, bgcolor: '#ffffff' }}>
          <div className="space-y-6 mt-2">
            
            {/* Row 1: ชื่อ */}
            <TextField
              fullWidth
              label="ชื่อ-นามสกุลพนักงาน"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น สมชาย ใจดี"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            
            {/* Row 2: ตำแหน่ง */}
            <TextField
              fullWidth
              label="ตำแหน่ง"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="เช่น แคชเชียร์, พนักงานครัว, ผู้จัดการ"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            
            {/* Row 3: ประเภทการจ่าย & ค่าจ้าง */}
            <div className="flex gap-4">
              <div className="w-2/5">
                <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                  <InputLabel>ประเภทการจ่าย</InputLabel>
                  <Select
                    value={formData.paymentType}
                    label="ประเภทการจ่าย"
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                  >
                    <MuiMenuItem value="daily">รายวัน</MuiMenuItem>
                    <MuiMenuItem value="monthly">รายเดือน</MuiMenuItem>
                    <MuiMenuItem value="yearly">รายปี</MuiMenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="flex-1">
                <TextField
                  fullWidth
                  type="number"
                  label="ค่าจ้าง"
                  value={formData.salary || ''}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  placeholder="0"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  InputProps={{
                    startAdornment: <span className="text-gray-400 font-semibold mr-2">฿</span>,
                  }}
                />
              </div>
            </div>

            {/* Row 4: Custom Image Upload Zone */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">รูปภาพโปรไฟล์</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group bg-gray-50/50 overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {formData.image ? (
                  <div className="relative flex justify-center">
                    <img src={formData.image} alt="Preview" className="w-32 h-32 object-cover rounded-full shadow-md border-4 border-white ring-1 ring-gray-100" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-sm w-full h-full">
                      <div className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg transform transition-transform group-hover:scale-105 text-sm">
                        <Edit2 className="w-4 h-4" /> เปลี่ยนรูปภาพ
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-blue-500 group-hover:text-white">
                      <ImagePlus className="w-8 h-8" />
                    </div>
                    <p className="text-base font-semibold text-gray-800 mb-1">คลิกหรือลากรูปภาพมาวางที่นี่</p>
                    <p className="text-sm text-gray-500">แนะนำรูปอัตราส่วน 1:1 (รูปโปรไฟล์)</p>
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
            disabled={!formData.name || formData.salary <= 0}
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
    </div>
  );
};