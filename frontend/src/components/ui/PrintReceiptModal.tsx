import React from 'react';
import { X, Printer, CheckCircle, School } from 'lucide-react';
import { PaymentReceipt } from '../../types/erp';

interface PrintReceiptModalProps {
  receipt: PaymentReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Action Bar (hidden when printing) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Official Payment Receipt Preview
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="printable-area p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 font-sans">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="inline-flex p-2 bg-blue-100 text-blue-700 rounded-full mb-2">
              <School className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Apex Academy & Institute</h2>
            <p className="text-xs text-slate-500 mt-0.5">100 University Blvd, Tech Valley, CA • Affiliation: AFF-STATE-89241</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
              FEE TRANSACTION ACKNOWLEDGEMENT
            </div>
          </div>

          {/* Key Identifiers */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Receipt Number</span>
              <span className="font-mono font-bold text-slate-800">{receipt.receiptNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Invoice Number</span>
              <span className="font-mono font-semibold text-slate-800">{receipt.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date of Payment</span>
              <span className="font-semibold text-slate-800">{receipt.paymentDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Payment Method</span>
              <span className="font-semibold text-slate-800">{receipt.paymentMethod.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Student Info */}
          <div className="py-4 border-b border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Student Name:</span>
              <span className="font-bold text-slate-800">{receipt.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Admission ID:</span>
              <span className="font-mono text-slate-700">{receipt.admissionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Class / Cohort:</span>
              <span className="text-slate-700 font-medium">{receipt.className}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Ref:</span>
              <span className="font-mono text-[11px] text-slate-600">{receipt.transactionReference}</span>
            </div>
          </div>

          {/* Amount Paid Highlight */}
          <div className="py-4 border-b border-slate-200 flex items-center justify-between bg-white px-4 rounded-lg my-3 border">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Amount Settled</span>
              <div className="text-xl font-extrabold text-emerald-700">
                ${(receipt.amountMinor / 100).toFixed(2)}
              </div>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-4 h-4 mr-1" />
              CONFIRMED
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="pt-4 flex items-end justify-between text-[11px] text-slate-500">
            <div>
              <span>Processed by:</span>
              <div className="font-semibold text-slate-700">{receipt.receivedBy}</div>
              <span className="text-[10px] text-slate-400">Computer generated receipt</span>
            </div>
            <div className="text-right">
              <div className="w-24 border-b border-slate-400 mb-1"></div>
              <span>Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* Bottom Close */}
        <div className="no-print mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
