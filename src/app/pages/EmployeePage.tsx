import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Employee } from '../types';
import { 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton, 
  Select, 
  MenuItem as MuiMenuItem, 
  FormControl, 
  InputLabel, 
  Box
} from '@mui/material';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  ImagePlus, 
  UserCircle, 
  Briefcase, 
  Wallet,
  UserPlus
} from 'lucide-react';

export const EmployeePage: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useBusiness();
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* ---------------- Header Section ---------------- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            บุคลากรและทีมงาน
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บริหารจัดการพนักงาน กำหนดค่าจ้าง และติดตามต้นทุนแรงงาน
          </p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<UserPlus className="w-4 h-4" />} 
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: '12px', 
            bgcolor: '#4f46e5', 
            '&:hover': { bgcolor: '#4338ca' }, 
            fontWeight: 'bold',
            textTransform: 'none',
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 14px 0 rgb(79 70 229 / 0.3)'
          }}
        >
          เพิ่มพนักงานใหม่
        </Button>
      </div>

      {/* ---------------- KPI Summary Card ---------------- */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card sx={{ borderRadius: '20px', bgcolor: '#0f172a', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <Wallet className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">ต้นทุนแรงงานรวมต่อวัน</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">฿{totalDailyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="text-slate-400 text-sm font-medium">/ วัน</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card sx={{ borderRadius: '20px', bgcolor: 'white', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">จำนวนพนักงานทั้งหมด</p>
                <p className="text-3xl font-black text-slate-800">{employees.length} <span className="text-sm font-medium text-slate-400">คน</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Employee Grid ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.map((employee) => (
          <div 
            key={employee.id} 
            className="bg-white rounded-[24px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
          >
            <div className="h-2 w-full bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
            
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100">
                    {employee.image ? (
                      <img src={employee.image} alt={employee.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                        <UserCircle className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-xl leading-tight mb-1">{employee.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-500 mb-5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wide">{employee.position}</span>
                </div>

                <div className="w-full bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ยอดชำระ {getPaymentTypeLabel(employee.paymentType)}</span>
                    <span className="text-xs font-bold text-indigo-600">฿{employee.salary.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-2/3 rounded-full"></div>
                  </div>
                </div>

                <div className="flex w-full gap-2 pt-2">
                  <Button 
                    fullWidth
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleOpenDialog(employee)} 
                    startIcon={<Edit2 className="w-3.5 h-3.5" />}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 'bold', borderColor: '#e2e8f0', color: '#64748b' }}
                  >
                    แก้ไข
                  </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => deleteEmployee(employee.id)} 
                    sx={{ borderRadius: '10px', bgcolor: '#fff1f2', color: '#f43f5e', '&:hover': { bgcolor: '#ffe4e6' } }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[32px] border-2 border-dashed border-slate-200 mt-4 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">ยังไม่มีพนักงานในระบบ</h3>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">เริ่มต้นเพิ่มข้อมูลพนักงานของคุณ เพื่อให้ระบบช่วยคำนวณต้นทุนแรงงานได้อย่างแม่นยำ</p>
          <Button 
            variant="contained" 
            startIcon={<Plus />} 
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: '12px', px: 4, py: 1.2, fontWeight: 'bold' }}
          >
            เพิ่มพนักงานคนแรก
          </Button>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* 🎨 Dialog: เพิ่ม/แก้ไขพนักงาน (แก้ปัญหาช่องเบียดกันแล้ว) */}
      {/* ----------------------------------------------------- */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }
        }}
      >
        <DialogTitle sx={{ pb: 3, pt: 4, px: 4, bgcolor: '#ffffff', borderBottom: '1px solid #f8fafc' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-none mb-1">
                {editingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มบุคลากรใหม่'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">กรอกข้อมูลพนักงานเพื่อบันทึกลงในฐานข้อมูลของร้าน</p>
            </div>
          </div>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 3, bgcolor: '#ffffff' }}>
          {/* ใช้ Box ควบคุมระยะห่างแบบตายตัว (gap: 3 = 24px) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            
            <TextField
              fullWidth
              label="ชื่อ-นามสกุล"
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }}
            />
            
            <TextField
              fullWidth
              label="ตำแหน่งงาน"
              variant="outlined"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="เช่น พนักงานเสิร์ฟ, พ่อครัว"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }}>
                <InputLabel>รอบการจ่ายเงิน</InputLabel>
                <Select
                  value={formData.paymentType}
                  label="รอบการจ่ายเงิน"
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as any })}
                >
                  <MuiMenuItem value="daily">รายวัน</MuiMenuItem>
                  <MuiMenuItem value="monthly">รายเดือน</MuiMenuItem>
                  <MuiMenuItem value="yearly">รายปี</MuiMenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="จำนวนเงิน"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#f8fafc' } }}
                InputProps={{
                  startAdornment: <span className="text-slate-400 font-bold mr-2 text-sm">฿</span>,
                }}
              />
            </Box>

            {/* อัปโหลดรูปภาพ */}
            <Box>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">รูปภาพโปรไฟล์พนักงาน</label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-[24px] p-6 text-center hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group bg-slate-50/50 overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {formData.image ? (
                  <div className="relative flex justify-center">
                    <img src={formData.image} alt="Preview" className="w-24 h-24 object-cover rounded-full shadow-lg border-4 border-white" />
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Edit2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 text-indigo-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">คลิกเพื่อเลือกรูปภาพ</p>
                    <p className="text-[10px] text-slate-400 mt-1">ขนาดแนะนำ 1:1 (PNG, JPG)</p>
                  </div>
                )}
              </div>
            </Box>

          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, py: 4, bgcolor: '#ffffff', borderTop: '1px solid #f8fafc' }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ color: 'text.secondary', fontWeight: 'bold', px: 3, textTransform: 'none' }}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!formData.name || formData.salary <= 0}
            sx={{ 
              borderRadius: '14px', 
              px: 5, 
              py: 1.2, 
              fontWeight: 'bold',
              textTransform: 'none',
              bgcolor: '#4f46e5',
              boxShadow: '0 8px 20px -6px rgb(79 70 229 / 0.5)',
              '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
            }}
          >
            {editingEmployee ? 'อัปเดตข้อมูล' : 'บันทึกพนักงาน'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};