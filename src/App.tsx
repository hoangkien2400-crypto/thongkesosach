/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { formatCurrency } from './utils/format';
import { exportToExcel, Expense } from './utils/excel';
import { Plus, Trash2, Download, Sparkles, Calculator, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  
  // State for manual entry
  const [income, setIncome] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // State for AI entry
  const [aiInput, setAiInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddExpense = () => {
    setExpenses([...expenses, { id: crypto.randomUUID(), name: '', amount: 0 }]);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleExpenseChange = (id: string, field: keyof Expense, value: string | number) => {
    setExpenses(expenses.map(e => {
      if (e.id === id) {
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const handleAnalyzeAI = async () => {
    if (!aiInput.trim()) {
      setAiError('Bạn vui lòng nhập thông tin thu nhập và chi tiêu nhé.');
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Phân tích đoạn văn bản sau và trích xuất thông tin thu nhập và các khoản chi tiêu.
        Nếu thiếu thông tin thu nhập hoặc chi tiêu, hãy trả về một thông báo lỗi nhẹ nhàng bằng tiếng Việt trong trường 'error'.
        
        Văn bản: "${aiInput}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              income: {
                type: Type.NUMBER,
                description: "Tổng thu nhập (VNĐ). Nếu không có, để null hoặc 0."
              },
              expenses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Tên khoản chi tiêu" },
                    amount: { type: Type.NUMBER, description: "Số tiền chi tiêu (VNĐ)" }
                  },
                  required: ["name", "amount"]
                },
                description: "Danh sách các khoản chi tiêu"
              },
              error: {
                type: Type.STRING,
                description: "Thông báo nhắc nhở nhẹ nhàng nếu thiếu thông tin thu nhập hoặc chi tiêu."
              }
            },
            required: ["expenses"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.error) {
        setAiError(result.error);
      } else {
        if (result.income) setIncome(result.income.toString());
        if (result.expenses && Array.isArray(result.expenses)) {
          setExpenses(result.expenses.map((e: any) => ({
            id: crypto.randomUUID(),
            name: e.name,
            amount: e.amount
          })));
        }
        setActiveTab('manual'); // Switch to manual tab to review
      }
    } catch (error) {
      console.error("Lỗi khi phân tích AI:", error);
      setAiError("Xin lỗi, mình gặp chút khó khăn khi đọc dữ liệu. Bạn thử lại nhé!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const numIncome = parseFloat(income) || 0;
  const totalExpense = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const balance = numIncome - totalExpense;

  const handleExport = () => {
    if (!income || expenses.length === 0) {
      setValidationError("Bạn ơi, hãy nhập đầy đủ thu nhập và ít nhất một khoản chi tiêu trước khi xuất file nhé!");
      return;
    }
    
    // Check for empty expense names or amounts
    const hasEmptyExpenses = expenses.some(e => !e.name.trim() || !e.amount);
    if (hasEmptyExpenses) {
      setValidationError("Hình như có khoản chi tiêu nào đó chưa có tên hoặc số tiền. Bạn kiểm tra lại giúp mình nhé!");
      return;
    }

    setValidationError(null);
    exportToExcel(numIncome, expenses, totalExpense, balance);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-200">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <Calculator size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Trợ Lý Tài Chính</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="flex border-b border-neutral-200">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Nhập thủ công
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'ai' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  <Sparkles size={16} />
                  Phân tích AI
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'ai' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-600">
                      Hãy kể cho mình nghe về thu nhập và các khoản chi tiêu của bạn nhé. Mình sẽ tự động phân tích và lập bảng cho bạn!
                    </p>
                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ví dụ: Tháng này mình nhận lương 15 triệu. Mình đã tiêu 3 triệu tiền ăn, 4 triệu tiền nhà, và 500k tiền điện nước..."
                      className="w-full h-40 p-3 rounded-xl border border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none text-sm"
                    />
                    
                    <AnimatePresence>
                      {aiError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm flex items-start gap-2"
                        >
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <p>{aiError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleAnalyzeAI}
                      disabled={isAnalyzing}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Phân tích dữ liệu
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tổng thu nhập (VNĐ)</label>
                      <input
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="VD: 15000000"
                        className="w-full p-2.5 rounded-xl border border-neutral-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-neutral-700">Các khoản chi tiêu</label>
                        <button
                          onClick={handleAddExpense}
                          className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Plus size={16} /> Thêm khoản chi
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <AnimatePresence>
                          {expenses.length === 0 && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm text-neutral-500 italic text-center py-4"
                            >
                              Chưa có khoản chi tiêu nào. Hãy thêm nhé!
                            </motion.p>
                          )}
                          {expenses.map((expense) => (
                            <motion.div
                              key={expense.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex gap-2 items-start"
                            >
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={expense.name}
                                  onChange={(e) => handleExpenseChange(expense.id, 'name', e.target.value)}
                                  placeholder="Tên khoản chi (VD: Tiền nhà)"
                                  className="w-full p-2 rounded-lg border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                />
                                <input
                                  type="number"
                                  value={expense.amount || ''}
                                  onChange={(e) => handleExpenseChange(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                                  placeholder="Số tiền (VNĐ)"
                                  className="w-full p-2 rounded-lg border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                />
                              </div>
                              <button
                                onClick={() => handleRemoveExpense(expense.id)}
                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                              >
                                <Trash2 size={18} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <p className="text-sm text-neutral-500 font-medium mb-1">Tổng thu nhập</p>
                <p className="text-xl font-bold text-neutral-900">{formatCurrency(numIncome)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-200">
                <p className="text-sm text-neutral-500 font-medium mb-1">Tổng chi tiêu</p>
                <p className="text-xl font-bold text-rose-600">{formatCurrency(totalExpense)}</p>
              </div>
              <div className={`p-5 rounded-2xl shadow-sm border ${balance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <p className={`text-sm font-medium mb-1 ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Số dư cuối tháng</p>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(balance)}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">Bảng thống kê chi tiêu</h2>
                <button
                  onClick={handleExport}
                  className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
                >
                  <Download size={16} />
                  Xuất Excel
                </button>
              </div>
              
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm flex items-start gap-2"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <p>{validationError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50/50 text-neutral-500 font-medium border-b border-neutral-200">
                    <tr>
                      <th className="px-5 py-3 w-16 text-center">STT</th>
                      <th className="px-5 py-3">Nội dung chi tiêu</th>
                      <th className="px-5 py-3 text-right">Số tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-neutral-400 italic">
                          Chưa có dữ liệu chi tiêu
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp, index) => (
                        <tr key={exp.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-5 py-3 text-center text-neutral-500">{index + 1}</td>
                          <td className="px-5 py-3 text-neutral-900">{exp.name || <span className="text-neutral-400 italic">Chưa nhập tên</span>}</td>
                          <td className="px-5 py-3 text-right font-mono text-neutral-700">{formatCurrency(exp.amount || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-neutral-50 font-medium border-t-2 border-neutral-200">
                    <tr>
                      <td colSpan={2} className="px-5 py-3 text-neutral-900">Tổng cộng chi tiêu</td>
                      <td className="px-5 py-3 text-right text-rose-600 font-mono">{formatCurrency(totalExpense)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-5 py-3 text-neutral-900">Số dư cuối tháng</td>
                      <td className={`px-5 py-3 text-right font-mono ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
