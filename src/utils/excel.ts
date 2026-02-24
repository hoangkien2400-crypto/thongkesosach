import * as XLSX from 'xlsx';

export interface Expense {
  id: string;
  name: string;
  amount: number;
}

export const exportToExcel = (income: number, expenses: Expense[], totalExpense: number, balance: number) => {
  const data = expenses.map((exp, index) => ({
    'STT': index + 1,
    'Nội dung chi tiêu': exp.name,
    'Số tiền (VNĐ)': exp.amount
  }));

  data.push({
    'STT': '',
    'Nội dung chi tiêu': 'Tổng cộng chi tiêu',
    'Số tiền (VNĐ)': totalExpense
  } as any);

  data.push({
    'STT': '',
    'Nội dung chi tiêu': 'Số dư cuối tháng',
    'Số tiền (VNĐ)': balance
  } as any);

  data.push({
    'STT': '',
    'Nội dung chi tiêu': 'Tổng thu nhập',
    'Số tiền (VNĐ)': income
  } as any);

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Thống kê chi tiêu");

  XLSX.writeFile(wb, "thong_ke_chi_tieu.xlsx");
};
