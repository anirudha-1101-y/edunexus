import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardCard } from '../components/ui/DashboardCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { SearchFilterBar } from '../components/ui/SearchFilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PrintReceiptModal } from '../components/ui/PrintReceiptModal';
import { erpService } from '../services/erpService';
import { FeeStructure, FeeCategory, StudentFeeLedger, PaymentReceipt } from '../types/erp';
import { useToast } from '../context/ToastContext';
import {
  CreditCard,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Printer,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  X,
} from 'lucide-react';

export default function FinancePage() {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'ledgers' | 'structures' | 'categories'>('ledgers');
  const [ledgers, setLedgers] = useState<StudentFeeLedger[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<StudentFeeLedger | null>(null);
  const [payAmountDollars, setPayAmountDollars] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentReceipt['paymentMethod']>('BANK_TRANSFER');

  // Printable Receipt Modal State
  const [printableReceipt, setPrintableReceipt] = useState<PaymentReceipt | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgersData, structData, catsData] = await Promise.all([
        erpService.getStudentFeeLedgers(),
        erpService.getFeeStructures(),
        erpService.getFeeCategories(),
      ]);
      setLedgers(ledgersData);
      setStructures(structData);
      setCategories(catsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (ledger: StudentFeeLedger) => {
    setSelectedLedger(ledger);
    setPayAmountDollars((ledger.dueMinor / 100).toFixed(2));
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedger) return;

    const amountMinor = Math.round(parseFloat(payAmountDollars) * 100);
    if (isNaN(amountMinor) || amountMinor <= 0) {
      error('Invalid Amount', 'Please enter a valid positive dollar amount.');
      return;
    }
    if (amountMinor > selectedLedger.dueMinor) {
      error('Overpayment Rejected', `Amount exceeds remaining invoice balance of $${(selectedLedger.dueMinor / 100).toFixed(2)}.`);
      return;
    }

    const { ledger: updatedLedger, receipt } = await erpService.recordFeePayment(
      selectedLedger.id,
      amountMinor,
      payMethod,
      'Harold Finch (Bursar)'
    );

    setLedgers((prev) =>
      prev.map((l) => (l.id === updatedLedger.id ? updatedLedger : l))
    );
    setPayModalOpen(false);
    success('Payment Recorded', `$${(amountMinor / 100).toFixed(2)} credited to ${updatedLedger.studentName}.`);

    // Auto-open receipt preview
    setPrintableReceipt(receipt);
    setReceiptModalOpen(true);
  };

  // Filtered Ledgers
  const filteredLedgers = ledgers.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(search.toLowerCase()) ||
      item.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Fiscal Metrics
  const totalBilledMinor = ledgers.reduce((acc, curr) => acc + curr.totalMinor, 0);
  const totalCollectedMinor = ledgers.reduce((acc, curr) => acc + curr.paidMinor, 0);
  const totalOutstandingMinor = ledgers.reduce((acc, curr) => acc + curr.dueMinor, 0);
  const collectionRate = totalBilledMinor > 0 ? ((totalCollectedMinor / totalBilledMinor) * 100).toFixed(1) : '0';

  const ledgerColumns: Column<StudentFeeLedger>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      render: (item) => <span className="font-mono text-xs font-bold text-slate-800">{item.invoiceNumber}</span>,
    },
    {
      key: 'studentName',
      header: 'Student & Admission',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-bold text-slate-900">{item.studentName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{item.admissionNumber} • {item.className}</div>
        </div>
      ),
    },
    {
      key: 'totalMinor',
      header: 'Billed Total',
      sortable: true,
      render: (item) => <span className="font-semibold text-slate-800">${(item.totalMinor / 100).toFixed(2)}</span>,
    },
    {
      key: 'paidMinor',
      header: 'Settled',
      sortable: true,
      render: (item) => <span className="font-bold text-emerald-700">${(item.paidMinor / 100).toFixed(2)}</span>,
    },
    {
      key: 'dueMinor',
      header: 'Balance Due',
      sortable: true,
      render: (item) => (
        <span className={`font-bold ${item.dueMinor > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
          ${(item.dueMinor / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (item) => <span className="text-xs text-slate-600">{item.dueDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5">
          {item.dueMinor > 0 ? (
            <button
              onClick={() => openPaymentModal(item)}
              className="inline-flex items-center px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
            >
              Pay Balance
            </button>
          ) : (
            <button
              onClick={() => {
                if (item.payments.length > 0) {
                  setPrintableReceipt(item.payments[0]);
                  setReceiptModalOpen(true);
                } else {
                  error('No Receipts', 'No payment vouchers recorded on this invoice.');
                }
              }}
              className="inline-flex items-center px-2 py-1 rounded border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Receipt
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Fees, Ledger & Bursar Finance"
        subtitle="Monetary tuition ledger stored in integer minor currency units, eliminating floating-point rounding errors."
        breadcrumbs={[{ label: 'Fees & Finance' }]}
        actions={
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Minor-Unit Balanced (Cents/Paise)
            </span>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="Total Billed Receivables"
          value={`$${(totalBilledMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Annual Invoiced Tuition"
          icon={CreditCard}
          colorTheme="blue"
        />
        <DashboardCard
          title="Total Collected Funds"
          value={`$${(totalCollectedMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Settled Bank & Online Fees"
          icon={DollarSign}
          colorTheme="emerald"
        />
        <DashboardCard
          title="Outstanding Balance"
          value={`$${(totalOutstandingMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Unsettled Student Balances"
          icon={AlertCircle}
          colorTheme="amber"
        />
        <DashboardCard
          title="Fiscal Collection Ratio"
          value={`${collectionRate}%`}
          subtitle="Zero Floating Drift"
          icon={Receipt}
          colorTheme="indigo"
          trend={{ value: 'Target: 95%', isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6">
        <button
          onClick={() => setActiveTab('ledgers')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'ledgers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student Fee Ledgers ({ledgers.length})
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'structures' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Schedules & Structures ({structures.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Categories ({categories.length})
        </button>
      </div>

      {/* Tab 1: Student Fee Ledgers */}
      {activeTab === 'ledgers' && (
        <>
          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search student name, invoice #, admission ID..."
            filters={[
              {
                id: 'status',
                label: 'Payment Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Paid in Full', value: 'PAID' },
                  { label: 'Partially Paid', value: 'PARTIAL' },
                  { label: 'Pending Dues', value: 'PENDING' },
                  { label: 'Overdue', value: 'OVERDUE' },
                ],
              },
            ]}
            onReset={() => {
              setSearch('');
              setStatusFilter('ALL');
            }}
          />

          <DataTable
            columns={ledgerColumns}
            data={filteredLedgers}
            keyExtractor={(item) => item.id}
            isLoading={loading}
            pageSize={6}
            emptyMessage="No fee invoices matching the search criteria."
          />
        </>
      )}

      {/* Tab 2: Fee Structures */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {structures.map((fs) => (
            <div key={fs.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase mb-1">
                  <span>{fs.classOrProgram}</span>
                  <span>{fs.academicYear}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">{fs.title}</h4>
                <div className="mt-3 text-2xl font-black text-blue-700">
                  ${(fs.totalAmountMinor / 100).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Due by {fs.dueDate}</div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  {fs.categories.map((c, i) => (
                    <div key={i} className="flex justify-between text-slate-600">
                      <span>{c.categoryName}:</span>
                      <span className="font-semibold text-slate-900">${(c.amountMinor / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Active Structure
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Fee Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">Category Code</th>
                <th className="px-5 py-3.5">Billing Frequency</th>
                <th className="px-5 py-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{cat.name}</td>
                  <td className="px-5 py-3.5 font-mono text-blue-700">{cat.code}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                      {cat.frequency}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{cat.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Payment Recording */}
      {payModalOpen && selectedLedger && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[11px] font-mono text-slate-400 font-bold">{selectedLedger.invoiceNumber}</span>
                <h3 className="text-base font-bold text-slate-900">Record Fee Settlement</h3>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold text-slate-900">{selectedLedger.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-amber-700">${(selectedLedger.dueMinor / 100).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={(selectedLedger.dueMinor / 100).toFixed(2)}
                    required
                    value={payAmountDollars}
                    onChange={(e) => setPayAmountDollars(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Channel / Gateway</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="BANK_TRANSFER">Bank Wire / Electronic Transfer</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash Over-the-Counter</option>
                  <option value="UPI">UPI / Mobile Instant Settlement</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Submit & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <PrintReceiptModal
        receipt={printableReceipt}
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />
    </MainLayout>
  );
}
