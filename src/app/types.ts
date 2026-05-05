export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  image?: string;
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
  image?: string;
}

export interface DailySale {
  date: string;
  sales: number;
  menuSales: { [menuId: string]: number };
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  paymentType: 'daily' | 'monthly' | 'yearly';
  image?: string;
}

export interface CustomCost {
  id: string;
  name: string;
  amount: number;
}

export interface BusinessSettings {
  customCosts: CustomCost[];
  reinvestmentPercentage: number;
}
