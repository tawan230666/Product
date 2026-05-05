import React, { useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Button, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Award, Calendar as CalendarIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl">📊 สรุปรายงาน</h1>
        <Button variant="contained" startIcon={<Download />} onClick={handleDownloadExcel}>
          ดาวน์โหลด Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">รายได้รวม</p>
                <p className="text-2xl font-bold text-blue-600">฿{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">เฉลี่ยต่อวัน</p>
                <p className="text-2xl font-bold text-green-600">฿{averageDaily.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">กำไรสุทธิ</p>
                <p className={`text-2xl font-bold ${profitSummary.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{profitSummary.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">วันที่ขายดีสุด</p>
                {topSalesDay ? (
                  <>
                    <p className="text-lg font-bold text-orange-600">
                      {format(parseISO(topSalesDay.date), 'dd MMM', { locale: th })}
                    </p>
                    <p className="text-xs text-gray-500">฿{topSalesDay.sales.toLocaleString()}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent>
            <h2 className="text-xl mb-4">กราฟรายได้</h2>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#3b82f6" name="ยอดขาย (บาท)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                ยังไม่มีข้อมูลยอดขาย
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl mb-4">การแบ่งกำไรหุ้นส่วน</h2>
            {profitSummary.partnerShares.length > 0 && profitSummary.netProfit > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={profitSummary.partnerShares}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {profitSummary.partnerShares.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                {partners.length === 0 ? 'ยังไม่มีหุ้นส่วน' : 'ไม่มีกำไรให้แบ่ง'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <Award className="w-6 h-6" />
            เมนูขายดี TOP 5
          </h2>
          {topMenuItems.length > 0 ? (
            <div className="space-y-3">
              {topMenuItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">ขายไป {item.count} รายการ</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              ยังไม่มีข้อมูลการขาย
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
