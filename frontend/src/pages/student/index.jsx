import React, { useState } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function StudentPortal() {
  const { user, memberships, activeInstitutionId, activeMembership, switchInstitution, logout } = useAuth();

  // Student Profile Context
  const student = {
    name: 'John Doe',
    admissionNumber: 'ADM-2025-001',
    rollNumber: '101',
    cohort: 'Grade 10 - Section A',
    academicYear: '2025-2026',
    institution: 'Apex Model High School',
  };

  // Attendance Statistics
  const attendanceStats = {
    totalSessions: 60,
    present: 55,
    absent: 3,
    late: 2,
    percentage: 91.7,
  };

  // Fees State (Stored in minor units: cents / paise)
  const [invoices, setInvoices] = useState([
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2025-001',
      dueDate: '2025-11-15',
      totalMinor: 150000, // $1,500.00
      paidMinor: 100000, // $1,000.00
      status: 'PARTIALLY_PAID',
      items: [
        { id: 'item-1', name: 'Annual Tuition Fee', amountMinor: 120000, allocatedMinor: 100000 },
        { id: 'item-2', name: 'Science Laboratory Fee', amountMinor: 30000, allocatedMinor: 0 },
      ],
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2025-002',
      dueDate: '2025-12-01',
      totalMinor: 25000, // $250.00
      paidMinor: 0,
      status: 'ISSUED',
      items: [
        { id: 'item-3', name: 'Library & Technology Fee', amountMinor: 25000, allocatedMinor: 0 },
      ],
    },
  ]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmountDollars, setPaymentAmountDollars] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  // Transcript / Marks
  const transcript = [
    { subject: 'Mathematics', assessment: 'Midterm 2025', marks: 88, maxMarks: 100, grade: 'A', points: 9.0 },
    { subject: 'Physics', assessment: 'Midterm 2025', marks: 92, maxMarks: 100, grade: 'A+', points: 10.0 },
    { subject: 'Chemistry', assessment: 'Midterm 2025', marks: 78, maxMarks: 100, grade: 'B', points: 8.0 },
    { subject: 'English Literature', assessment: 'Midterm 2025', marks: 85, maxMarks: 100, grade: 'A', points: 9.0 },
  ];

  const totalPoints = transcript.reduce((acc, curr) => acc + curr.points, 0);
  const gpa = (totalPoints / transcript.length).toFixed(2);

  const formatCurrency = (minorUnits) => {
    return (minorUnits / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    const balanceRemaining = (inv.totalMinor - inv.paidMinor) / 100;
    setPaymentAmountDollars(String(balanceRemaining));
    setPaymentReceipt(null);
    setPaymentModalOpen(true);
  };

  const executePayment = () => {
    if (!selectedInvoice) return;
    const amountMinor = Math.round(parseFloat(paymentAmountDollars) * 100);
    const balanceRemaining = selectedInvoice.totalMinor - selectedInvoice.paidMinor;

    if (isNaN(amountMinor) || amountMinor <= 0 || amountMinor > balanceRemaining) {
      alert('Invalid payment amount. Cannot exceed outstanding balance.');
      return;
    }

    // Generate atomic receipt with idempotency
    const receiptNum = `RCP-2025-${Math.floor(10000 + Math.random() * 90000)}`;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === selectedInvoice.id) {
          const newPaid = inv.paidMinor + amountMinor;
          return {
            ...inv,
            paidMinor: newPaid,
            status: newPaid >= inv.totalMinor ? 'PAID' : 'PARTIALLY_PAID',
          };
        }
        return inv;
      })
    );

    setPaymentReceipt({
      receiptNumber: receiptNum,
      amountMinor: amountMinor,
      invoiceNumber: selectedInvoice.invoiceNumber,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        institutionName={activeMembership?.institution_name || student.institution}
        userEmail={user?.email || 'student@apex.edu'}
        userRole="Student / Parent"
        memberships={memberships}
        activeInstitutionId={activeInstitutionId}
        onSwitchInstitution={switchInstitution}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Profile Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {student.cohort}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 space-x-4">
              <span>Admission #: <strong className="text-slate-700">{student.admissionNumber}</strong></span>
              <span>Roll #: <strong className="text-slate-700">{student.rollNumber}</strong></span>
              <span>Academic Year: <strong className="text-slate-700">{student.academicYear}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-500 uppercase">Current GPA</div>
              <div className="text-2xl font-extrabold text-blue-600">{gpa} / 10.0</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-500 uppercase">Attendance</div>
              <div className={`text-2xl font-extrabold ${attendanceStats.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {attendanceStats.percentage}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Attendance & Academic Transcript */}
          <div className="lg:col-span-2 space-y-8">
            {/* Attendance Detail Card */}
            <Card title="Attendance Record" subtitle="Homeroom & Lecture presence log">
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                  <span>Attendance Rate: {attendanceStats.percentage}%</span>
                  <span>Minimum Threshold: 75%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${attendanceStats.percentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-center">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{attendanceStats.present}</div>
                    <div className="text-xs text-slate-500">Days Present</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-rose-600">{attendanceStats.absent}</div>
                    <div className="text-xs text-slate-500">Days Absent</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-600">{attendanceStats.late}</div>
                    <div className="text-xs text-slate-500">Late Arrivals</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Transcript Card */}
            <Card title="Academic Transcript & Report Card" subtitle="Published assessments and grade points">
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Subject</th>
                      <th className="px-4 py-2.5">Assessment</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5">Grade</th>
                      <th className="px-4 py-2.5">GP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {transcript.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{item.subject}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.assessment}</td>
                        <td className="px-4 py-3 font-mono text-xs">{item.marks} / {item.maxMarks}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{item.grade}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{item.points.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column: Fees & Online Payment */}
          <div className="space-y-6">
            <Card title="Invoices & Outstanding Fees" subtitle="Minor unit precision financial balance">
              <div className="space-y-4 mt-4">
                {invoices.map((inv) => {
                  const balance = inv.totalMinor - inv.paidMinor;
                  return (
                    <div key={inv.id} className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{inv.invoiceNumber}</div>
                          <div className="text-xs text-slate-500">Due: {inv.dueDate}</div>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-slate-600">
                          <span>Total Invoiced:</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(inv.totalMinor)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Paid:</span>
                          <span className="font-semibold text-emerald-600">{formatCurrency(inv.paidMinor)}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-bold">
                          <span>Remaining Balance:</span>
                          <span>{formatCurrency(balance)}</span>
                        </div>
                      </div>

                      {balance > 0 && (
                        <Button
                          variant="primary"
                          className="w-full text-xs justify-center py-1.5"
                          onClick={() => handleOpenPayment(inv)}
                        >
                          Pay Balance ({formatCurrency(balance)})
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* Payment Modal */}
        {paymentModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Pay Invoice: {selectedInvoice.invoiceNumber}
              </h3>

              {!paymentReceipt ? (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500">
                    Settles invoice items with atomic row-locking on the PostgreSQL backend.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Payment Amount (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmountDollars}
                      onChange={(e) => setPaymentAmountDollars(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-700">Line Items Covered:</div>
                    {selectedInvoice.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.name}</span>
                        <span>{formatCurrency(it.amountMinor)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                    <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={executePayment}>
                      Confirm & Pay
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="font-bold text-slate-800">Payment Successfully Processed</h4>
                  <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 space-y-1 text-left">
                    <div className="flex justify-between">
                      <span className="font-semibold">Receipt Number:</span>
                      <span className="font-mono">{paymentReceipt.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Amount Paid:</span>
                      <span>{formatCurrency(paymentReceipt.amountMinor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Invoice:</span>
                      <span>{paymentReceipt.invoiceNumber}</span>
                    </div>
                  </div>
                  <Button variant="primary" className="w-full justify-center" onClick={() => setPaymentModalOpen(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
