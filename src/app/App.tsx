import React, { useState } from 'react';
import { BusinessProvider } from './context/BusinessContext';
import { MenuPage } from './pages/MenuPage';
import { CalculationPage } from './pages/CalculationPage';
import { EmployeePage } from './pages/EmployeePage';
import { ReportPage } from './pages/ReportPage';
import { Tabs, Tab, Box, AppBar, Toolbar, Typography } from '@mui/material';
import { ShoppingBag, Calculator, Users, BarChart3 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);

  const renderPage = () => {
    switch (activeTab) {
      case 0:
        return <MenuPage />;
      case 1:
        return <CalculationPage />;
      case 2:
        return <EmployeePage />;
      case 3:
        return <ReportPage />;
      default:
        return <MenuPage />;
    }
  };

  return (
    <BusinessProvider>
      <div className="min-h-screen bg-slate-50">
        
        {/* แถบด้านบนสุด (App Bar) - เพิ่มความสูงให้ดูโปร่งขึ้น */}
        <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: 'none', zIndex: 50 }}>
          <Toolbar sx={{ minHeight: '72px !important' }}>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: '800', display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: '-0.5px' }}>
              💼 BizFlow <span className="text-lg font-medium opacity-80 hidden sm:inline tracking-normal">- ระบบจัดการธุรกิจ</span>
            </Typography>
          </Toolbar>
        </AppBar>

        {/* แถบเมนู Tabs - เพิ่ม Padding บนล่าง (py: 1.5) เพื่อลดความอึดอัด */}
        <Box sx={{ 
          bgcolor: 'white', 
          borderBottom: '1px solid #e2e8f0', // ใช้เส้นขอบบางๆ แทนเงาให้ดูคลีนขึ้น
          position: 'sticky',
          top: 72, // ให้ตรงกับความสูง AppBar ที่ปรับใหม่
          zIndex: 40,
          py: 1.5 
        }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              // ปรับแต่งตัวสไลด์พื้นหลัง (Indicator) ให้อวบอิ่มขึ้น
              TabIndicatorProps={{
                style: {
                  height: '100%', 
                  top: 0,
                  bottom: 0,
                  backgroundColor: '#eff6ff', // สีฟ้าอ่อน
                  borderRadius: '16px',       // ขอบมนกว้างขึ้น
                  zIndex: 0,
                }
              }}
              sx={{
                minHeight: '52px',
                '& .MuiTabs-flexContainer': {
                  alignItems: 'center',
                  gap: '8px', // เพิ่มระยะห่างระหว่างเมนู (ลดความเบียด)
                },
                '& .MuiTab-root': {
                  zIndex: 1,
                  textTransform: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  minHeight: '52px',
                  borderRadius: '16px',
                  color: '#64748b',
                  transition: 'all 0.3s ease',
                  padding: '0 24px', // เพิ่มพื้นที่ซ้าย-ขวาของตัวอักษรในปุ่ม
                  margin: '0 4px', // เว้นระยะห่างระหว่างแต่ละ Tab เพิ่มเติม
                  '&:hover': {
                    color: '#3b82f6',
                    backgroundColor: '#f8fafc',
                  },
                  '&.Mui-selected': {
                    color: '#2563eb',
                  }
                }
              }}
            >
              <Tab icon={<ShoppingBag className="w-5 h-5 mb-0 mr-2" />} label="เมนูสินค้า" iconPosition="start" disableRipple />
              <Tab icon={<Calculator className="w-5 h-5 mb-0 mr-2" />} label="การเงินและบัญชี" iconPosition="start" disableRipple />
              <Tab icon={<Users className="w-5 h-5 mb-0 mr-2" />} label="พนักงาน" iconPosition="start" disableRipple />
              <Tab icon={<BarChart3 className="w-5 h-5 mb-0 mr-2" />} label="สรุปรายงาน" iconPosition="start" disableRipple />
            </Tabs>
          </div>
        </Box>

        {/* ส่วนแสดงเนื้อหา - เพิ่ม pt-6 เพื่อดันเนื้อหาให้ห่างจากแถบเมนูด้านบน */}
        <div className="max-w-7xl mx-auto pt-6 pb-16">
          {renderPage()}
        </div>
        
      </div>
    </BusinessProvider>
  );
}