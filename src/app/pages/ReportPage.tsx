import React, { useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Button, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Award, Calendar as CalendarIcon, BarChart3, PieChart as PieChartIcon, Utensils, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export const ReportPage: React.FC = () => {
  const { dailySales, menuItems, partners, employees, settings } = useBusiness();

  const salesChartData = useMemo(() => {
    return dailySales
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((sale) => ({
        date: format(parseISO(sale.date), 'dd MMM', { locale: th }),
        sales: sale.sales,
      }));
  }, [dailySales]);

  const topMenuItems = useMemo(() => {
    const menuSalesCount: { [menuId: string]: number } = {};
    dailySales.forEach((sale) => {
      Object.entries(sale.menuSales || {}).forEach(([menuId, count]) => {
        menuSalesCount[menuId] = (menuSalesCount[menuId] || 0) + count;
      });
    });

    return Object.entries(menuSalesCount)
      .map(([menuId, count]) => {
        const menu = menuItems.find((m) => m.id === menuId);
        return {
          name: menu?.name || 'Unknown',
          emoji: menu?.emoji || '📦',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [dailySales, menuItems]);

  const topSalesDay = useMemo(() => {
    if (dailySales.length === 0) return null;
    return dailySales.reduce((max, sale) => (sale.sales > max.sales ? sale : max));
  }, [dailySales]);

  const totalRevenue = dailySales.reduce((sum, sale) => sum + sale.sales, 0);
  const averageDaily = dailySales.length > 0 ? totalRevenue / dailySales.length : 0;

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

  const profitSummary = useMemo(() => {
    const totalSales = dailySales.reduce((sum, sale) => sum + sale.sales, 0);
    const dailyCosts = getTotalCustomCosts() + calculateEmployeeDailyCost();
    const totalCosts = dailyCosts * dailySales.length;
    const grossProfit = totalSales - totalCosts;
    const reinvestAmount = grossProfit * (settings.reinvestmentPercentage / 100);
    const netProfit = grossProfit - reinvestAmount;

    const partnerShares = partners.map((p) => ({
      name: p.name,
      value: netProfit * (p.percentage / 100),
      percentage: p.percentage,
    }));

    return {
      totalSales,
      totalCosts,
      grossProfit,
      reinvestAmount,
      netProfit,
      partnerShares,
    };
  }, [dailySales, settings, partners, employees]);

  const handleDownloadExcel = () => {
    const salesDetailData = dailySales.map((sale) => {
      const dailyCost = getTotalCustomCosts() + calculateEmployeeDailyCost();
      const profit = sale.sales - dailyCost;
      const reinvest = profit * (settings.reinvestmentPercentage / 100);
      const netProfit = profit - reinvest;

      return {
        'วันที่': format(parseISO(sale.date), 'dd/MM/yyyy', { locale: th }),
        'ยอดขาย (บาท)': sale.sales,
        'ต้นทุน (บาท)': dailyCost,
        'กำไรขั้นต้น (บาท)': profit,
        'เก็บลงทุนต่อ (บาท)': reinvest,
        'กำไรสุทธิ (บาท)': netProfit,
        'สถานะ': netProfit > 0 ? 'กำไร' : netProfit < 0 ? 'ขาดทุน' : 'เท่าทุน',
      };
    });

    const summaryData = [
      { 'รายการ': 'ยอดขายรวมทั้งหมด', 'จำนวน (บาท)': profitSummary.totalSales },
      { 'รายการ': 'ต้นทุนรวมทั้งหมด', 'จำนวน (บาท)': profitSummary.totalCosts },
      { 'รายการ': 'กำไรขั้นต้น', 'จำนวน (บาท)': profitSummary.grossProfit },
      { 'รายการ': `เก็บลงทุนต่อ (${settings.reinvestmentPercentage}%)`, 'จำนวน (บาท)': profitSummary.reinvestAmount },
      { 'รายการ': 'กำไรสุทธิ', 'จำนวน (บาท)': profitSummary.netProfit },
      { 'รายการ': 'สถานะ', 'จำนวน (บาท)': profitSummary.netProfit > 0 ? 'กำไร' : 'ขาดทุน' },
    ];

    const menuSalesCount: { [menuId: string]: number } = {};
    const menuSalesRevenue: { [menuId: string]: number } = {};

    dailySales.forEach((sale) => {
      Object.entries(sale.menuSales || {}).forEach(([menuId, count]) => {
        menuSalesCount[menuId] = (menuSalesCount[menuId] || 0) + count;
        const menu = menuItems.find((m) => m.id === menuId);
        if (menu) {
          menuSalesRevenue[menuId] = (menuSalesRevenue[menuId] || 0) + (menu.price * count);
        }
      });
    });

    const topMenuData = Object.entries(menuSalesCount)
      .map(([menuId, count]) => {
        const menu = menuItems.find((m) => m.id === menuId);
        return {
          'เมนู': menu?.name || 'Unknown',
          'จำนวนที่ขาย (รายการ)': count,
          'รายได้รวม (บาท)': menuSalesRevenue[menuId] || 0,
        };
      })
      .sort((a, b) => b['จำนวนที่ขาย (รายการ)'] - a['จำนวนที่ขาย (รายการ)']);

    const partnerData = profitSummary.partnerShares.map((p) => ({
      'ชื่อหุ้นส่วน': p.name,
      'เปอร์เซ็นต์': `${p.percentage}%`,
      'รับเงิน (บาท)': p.value,
    }));

    const employeeData = employees.map((emp) => {
      const dailySalary = emp.paymentType === 'daily' ? emp.salary :
                          emp.paymentType === 'monthly' ? emp.salary / 30 :
                          emp.salary / 365;
      return {
        'ชื่อพนักงาน': emp.name,
        'ตำแหน่ง': emp.position,
        'ค่าจ้าง (บาท)': emp.salary,
        'ประเภท': emp.paymentType === 'daily' ? 'รายวัน' : emp.paymentType === 'monthly' ? 'รายเดือน' : 'รายปี',
        'ค่าจ้างเฉลี่ยต่อวัน (บาท)': Math.round(dailySalary),
      };
    });

    const costsData = settings.customCosts.map((cost) => ({
      'รายการต้นทุน': cost.name,
      'จำนวน (บาท/วัน)': cost.amount,
    }));
    costsData.push({
      'รายการต้นทุน': 'ค่าพนักงาน',
      'จำนวน (บาท/วัน)': calculateEmployeeDailyCost(),
    });
    costsData.push({
      'รายการต้นทุน': 'รวมทั้งหมด',
      'จำนวน (บาท/วัน)': getTotalCustomCosts() + calculateEmployeeDailyCost(),
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(salesDetailData);
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    const ws3 = XLSX.utils.json_to_sheet(topMenuData);
    const ws4 = XLSX.utils.json_to_sheet(partnerData);
    const ws5 = XLSX.utils.json_to_sheet(employeeData);
    const ws6 = XLSX.utils.json_to_sheet(costsData);

    XLSX.utils.book_append_sheet(wb, ws1, 'ยอดขายรายวัน');
    XLSX.utils.book_append_sheet(wb, ws2, 'สรุปกำไร-ขาดทุน');
    XLSX.utils.book_append_sheet(wb, ws3, 'สินค้าขายดี');
    XLSX.utils.book_append_sheet(wb, ws4, 'แบ่งกำไรหุ้นส่วน');
    XLSX.utils.book_append_sheet(wb, ws5, 'พนักงาน');
    XLSX.utils.book_append_sheet(wb, ws6, 'รายการต้นทุน');

    XLSX.writeFile(wb, `BizFlow-Report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const formatMoney = (amount: number) => amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            สรุปรายงาน (Dashboard)
          </h1>
          <p className="text-sm text-slate-500 mt-1 pl-11">
            วิเคราะห์ภาพรวมธุรกิจ ยอดขาย และผลประกอบการ
          </p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<Download className="w-4 h-4" />} 
          onClick={handleDownloadExcel}
          sx={{ 
            borderRadius: '10px', 
            bgcolor: '#0f172a', 
            textTransform: 'none', 
            fontWeight: 600, 
            px: 3,
            '&:hover': { bgcolor: '#334155' } 
          }}
        >
          ดาวน์โหลด EXCEL
        </Button>
      </div>

      {/* ---------------- KPI Cards ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: รายได้รวม */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)' }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">รายได้รวม</p>
              <h3 className="text-2xl font-black text-slate-800">฿{formatMoney(totalRevenue)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: เฉลี่ยต่อวัน */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)' }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CalendarIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">เฉลี่ยต่อวัน</p>
              <h3 className="text-2xl font-black text-slate-800">฿{formatMoney(averageDaily)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: กำไรสุทธิ */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)' }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${profitSummary.netProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
              <Wallet className={`w-6 h-6 ${profitSummary.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">กำไรสุทธิ</p>
              <h3 className={`text-2xl font-black ${profitSummary.netProfit >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                {profitSummary.netProfit < 0 ? '-' : ''}฿{formatMoney(Math.abs(profitSummary.netProfit))}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: วันที่ขายดีสุด */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)' }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">วันที่ขายดีที่สุด</p>
              {topSalesDay ? (
                <>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">
                    {format(parseISO(topSalesDay.date), 'dd MMM yyyy', { locale: th })}
                  </h3>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">ยอด ฿{formatMoney(topSalesDay.sales)}</p>
                </>
              ) : (
                <h3 className="text-lg font-bold text-slate-400">ไม่มีข้อมูล</h3>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Charts Section ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* กราฟรายได้ (Recharts) */}
        <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-800">แนวโน้มรายได้</h3>
            </div>
            
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sales" fill="#4f46e5" name="ยอดขาย (บาท)" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-10 h-10 mb-3 text-slate-300" />
                <p className="font-medium">ยังไม่มีข้อมูลยอดขาย</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* การแบ่งกำไรหุ้นส่วน (Recharts PieChart) */}
        <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-800">สัดส่วนการแบ่งกำไรหุ้นส่วน</h3>
            </div>

            {profitSummary.partnerShares.length > 0 && profitSummary.netProfit > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={profitSummary.partnerShares}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {profitSummary.partnerShares.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `฿${value.toLocaleString()}`} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <PieChartIcon className="w-10 h-10 mb-3 text-slate-300" />
                <p className="font-medium">
                  {partners.length === 0 ? 'ยังไม่มีรายชื่อหุ้นส่วนในระบบ' : 'ยังไม่มีกำไรให้ปันผลในขณะนี้'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Top 5 Best Sellers ---------------- */}
      <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <CardContent className="p-0">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-800">เมนูขายดี TOP 5</h3>
          </div>
          
          {topMenuItems.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {topMenuItems.map((item, index) => (
                <div key={index} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${index === 0 ? 'bg-amber-100 text-amber-600' : 
                        index === 1 ? 'bg-slate-200 text-slate-600' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl">
                      {item.emoji}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-base">{item.name}</p>
                      <p className="text-sm text-slate-500">ขายไปแล้ว {item.count} รายการ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400">
              <Award className="w-12 h-12 mb-4 text-slate-200" />
              <p className="font-medium">ยังไม่มีข้อมูลการขายสินค้า</p>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
};