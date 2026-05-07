import React, { useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Button, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, TrendingDown, Award, BarChart3, PieChart as PieChartIcon, Utensils, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export const ReportPage: React.FC = () => {
  const { dailySales, menuItems, partners, employees, settings } = useBusiness();

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

  // 1. คำนวณสรุปผลกำไร
  const profitSummary = useMemo(() => {
    let totalPosSales = 0;
    let totalOtherIncomes = 0;
    let totalDailyExpenses = 0;

    dailySales.forEach((sale) => {
      totalPosSales += sale.sales || 0;
      totalOtherIncomes += (sale.incomes || []).reduce((sum, inc) => sum + inc.amount, 0);
      totalDailyExpenses += (sale.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    });

    const totalRevenue = totalPosSales + totalOtherIncomes;
    
    const activeDays = dailySales.length > 0 ? dailySales.length : 1;
    const fixedCosts = (getTotalCustomCosts() + calculateEmployeeDailyCost()) * activeDays;
    const totalCosts = fixedCosts + totalDailyExpenses;

    const netProfit = totalRevenue - totalCosts; 
    const reinvestAmount = netProfit > 0 ? netProfit * (settings.reinvestmentPercentage / 100) : 0;
    const distributableProfit = netProfit > 0 ? netProfit - reinvestAmount : 0;

    const partnerShares = partners.map((p) => ({
      name: p.name,
      value: distributableProfit * (p.percentage / 100),
      percentage: p.percentage,
    }));

    return {
      totalRevenue,
      totalCosts,
      netProfit,
      reinvestAmount,
      distributableProfit,
      partnerShares,
    };
  }, [dailySales, settings, partners, employees]);

  // 2. ข้อมูลกราฟเปรียบเทียบ รายรับ-รายจ่าย (แก้ไขเพิ่มรายจ่ายลงกราฟ)
  const salesChartData = useMemo(() => {
    const dailyFixedCost = getTotalCustomCosts() + calculateEmployeeDailyCost();

    return dailySales
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((sale) => {
        const dailyRevenue = sale.sales + (sale.incomes || []).reduce((sum, inc) => sum + inc.amount, 0);
        const dailyOtherExpense = (sale.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
        const dailyTotalExpense = dailyFixedCost + dailyOtherExpense;

        return {
          date: format(parseISO(sale.date), 'dd MMM', { locale: th }),
          revenue: dailyRevenue,
          expense: dailyTotalExpense,
        };
      });
  }, [dailySales, settings.customCosts, employees]);

  // 3. หาวันที่ขายดีที่สุด
  const topSalesDay = useMemo(() => {
    if (dailySales.length === 0) return null;
    let bestDay = { date: '', revenue: 0 };
    dailySales.forEach(sale => {
      const rev = sale.sales + (sale.incomes || []).reduce((sum, i) => sum + i.amount, 0);
      if (rev > bestDay.revenue) {
        bestDay = { date: sale.date, revenue: rev };
      }
    });
    return bestDay.date ? bestDay : null;
  }, [dailySales]);

  // 4. เมนูขายดี
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

  const handleDownloadExcel = () => {
    const salesDetailData = dailySales.map((sale) => {
      const dailyOtherIncome = (sale.incomes || []).reduce((sum, inc) => sum + inc.amount, 0);
      const dailyOtherExpense = (sale.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
      const dailyRevenue = sale.sales + dailyOtherIncome;
      
      const dailyFixedCost = getTotalCustomCosts() + calculateEmployeeDailyCost();
      const dailyTotalCost = dailyFixedCost + dailyOtherExpense;
      
      const profit = dailyRevenue - dailyTotalCost;
      const reinvest = profit > 0 ? profit * (settings.reinvestmentPercentage / 100) : 0;
      const netProfitForDividend = profit > 0 ? profit - reinvest : 0;

      return {
        'วันที่': format(parseISO(sale.date), 'dd/MM/yyyy', { locale: th }),
        'ยอดขายหน้าร้าน (บาท)': sale.sales,
        'รายรับอื่นๆ (บาท)': dailyOtherIncome,
        'รายรับรวม (บาท)': dailyRevenue,
        'รายจ่ายอื่นๆ (บาท)': dailyOtherExpense,
        'ต้นทุนคงที่ (บาท)': dailyFixedCost,
        'รวมรายจ่าย (บาท)': dailyTotalCost,
        'กำไรสุทธิ (บาท)': profit,
        'เก็บลงทุนต่อ (บาท)': reinvest,
        'ปันผลหุ้นส่วน (บาท)': netProfitForDividend,
        'สถานะ': profit > 0 ? 'กำไร' : profit < 0 ? 'ขาดทุน' : 'เท่าทุน',
      };
    });

    const summaryData = [
      { 'รายการ': 'รายรับรวมทั้งหมด', 'จำนวน (บาท)': profitSummary.totalRevenue },
      { 'รายการ': 'รายจ่ายรวมทั้งหมด', 'จำนวน (บาท)': profitSummary.totalCosts },
      { 'รายการ': 'กำไรสุทธิ', 'จำนวน (บาท)': profitSummary.netProfit },
      { 'รายการ': `เก็บลงทุนต่อ (${settings.reinvestmentPercentage}%)`, 'จำนวน (บาท)': profitSummary.reinvestAmount },
      { 'รายการ': 'ยอดแบ่งปันผลหุ้นส่วน', 'จำนวน (บาท)': profitSummary.distributableProfit },
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
      'รายการต้นทุน': 'ค่าพนักงานเฉลี่ยต่อวัน',
      'จำนวน (บาท/วัน)': calculateEmployeeDailyCost(),
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(salesDetailData);
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    const ws3 = XLSX.utils.json_to_sheet(topMenuData);
    const ws4 = XLSX.utils.json_to_sheet(partnerData);
    const ws5 = XLSX.utils.json_to_sheet(employeeData);
    const ws6 = XLSX.utils.json_to_sheet(costsData);

    XLSX.utils.book_append_sheet(wb, ws1, 'สรุปรายวัน');
    XLSX.utils.book_append_sheet(wb, ws2, 'สรุปกำไร-ขาดทุน');
    XLSX.utils.book_append_sheet(wb, ws3, 'สินค้าขายดี');
    XLSX.utils.book_append_sheet(wb, ws4, 'แบ่งปันผลหุ้นส่วน');
    XLSX.utils.book_append_sheet(wb, ws5, 'ข้อมูลพนักงาน');
    XLSX.utils.book_append_sheet(wb, ws6, 'ต้นทุนคงที่');

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
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">รายรับรวมทั้งหมด</p>
              <h3 className="text-2xl font-black text-slate-800">฿{formatMoney(profitSummary.totalRevenue)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: รายจ่ายรวม (เปลี่ยนจากเฉลี่ยต่อวัน) */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)' }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">รายจ่ายรวมทั้งหมด</p>
              <h3 className="text-2xl font-black text-rose-600">฿{formatMoney(profitSummary.totalCosts)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: กำไรสุทธิ */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)' }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${profitSummary.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <Wallet className={`w-6 h-6 ${profitSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-0.5">กำไรสุทธิ</p>
              <h3 className={`text-2xl font-black ${profitSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
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
                  <p className="text-xs text-amber-600 font-medium mt-0.5">ยอด ฿{formatMoney(topSalesDay.revenue)}</p>
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
        
        {/* กราฟเปรียบเทียบ รายรับ-รายจ่าย (แก้ไขเป็น 2 แท่ง) */}
        <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-800">เปรียบเทียบรายรับ - รายจ่าย</h3>
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" fill="#4f46e5" name="รายรับรวม (บาท)" radius={[4, 4, 0, 0]} barSize={15} />
                  <Bar dataKey="expense" fill="#f43f5e" name="รายจ่ายรวม (บาท)" radius={[4, 4, 0, 0]} barSize={15} />
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
              <h3 className="text-lg font-bold text-slate-800">สัดส่วนการแบ่งปันผลหุ้นส่วน</h3>
            </div>

            {profitSummary.partnerShares.length > 0 && profitSummary.distributableProfit > 0 ? (
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