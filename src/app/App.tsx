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
      <div className="min-h-screen bg-gray-50">
        <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Toolbar>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              💼 BizFlow - ระบบจัดการธุรกิจ
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<ShoppingBag className="w-5 h-5" />}
              label="เมนูสินค้า"
              iconPosition="start"
            />
            <Tab
              icon={<Calculator className="w-5 h-5" />}
              label="คำนวณและหุ้นส่วน"
              iconPosition="start"
            />
            <Tab
              icon={<Users className="w-5 h-5" />}
              label="พนักงาน"
              iconPosition="start"
            />
            <Tab
              icon={<BarChart3 className="w-5 h-5" />}
              label="สรุปรายงาน"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </div>
    </BusinessProvider>
  );
}