import React, { useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Employee } from '../types';
import { Button, TextField, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Select, MenuItem as MuiMenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';

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
        <h1 className="text-3xl flex items-center gap-2">
          <Users className="w-8 h-8" />
          พนักงาน
        </h1>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenDialog()}>
          เพิ่มพนักงาน
        </Button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">ค่าจ้างรวมต่อวัน:</span>
          <span className="text-2xl font-bold text-blue-600">฿{totalDailyCost.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardContent>
              <div className="flex items-start gap-3">
                {employee.image ? (
                  <img src={employee.image} alt={employee.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {employee.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <p className="text-gray-600 text-sm">{employee.position}</p>
                    </div>
                    <div className="flex gap-1">
                      <IconButton size="small" onClick={() => handleOpenDialog(employee)}>
                        <Edit2 className="w-4 h-4" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteEmployee(employee.id)}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Chip
                      label={getPaymentTypeLabel(employee.paymentType)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">ค่าจ้าง:</p>
                      <p className="font-bold text-green-600">฿{employee.salary.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        (≈ ฿{calculateDailySalary(employee).toLocaleString()}/วัน)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีพนักงาน</p>
          <p className="text-sm">คลิก "เพิ่มพนักงาน" เพื่อเริ่มต้น</p>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="ชื่อพนักงาน"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="ตำแหน่ง"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="เช่น แคชเชียร์, พนักงานครัว, ผู้จัดการ"
            />
            <FormControl fullWidth>
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
            <TextField
              fullWidth
              type="number"
              label="ค่าจ้าง (บาท)"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
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
                <img src={formData.image} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained">บันทึก</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
