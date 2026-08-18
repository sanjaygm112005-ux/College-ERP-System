import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const StudentFees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const { data } = await api.get(`/fees/student/${user.id}`);
        setFees(data);
      } catch (err) {
        console.error('Error fetching student fees:', err);
        setError('Failed to load fee status sheets.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchFees();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600 max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-bold">Fees Error</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  // Aggregate pending/paid balances
  const totalDue = fees.reduce((acc, f) => acc + parseFloat(f.total_amount), 0);
  const totalPaid = fees.reduce((acc, f) => acc + parseFloat(f.paid_amount), 0);
  const totalPending = totalDue - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Fees & Invoices</h1>
        <p className="text-sm text-slate-500">Track pending fees, past payments, invoices, and payment deadlines.</p>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Billed</span>
          <span className="text-2xl font-extrabold text-slate-800 mt-2 block">${totalDue.toLocaleString()}</span>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Paid</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-2 block">${totalPaid.toLocaleString()}</span>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Remaining Due</span>
          <span className={`text-2xl font-extrabold mt-2 block ${totalPending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ${totalPending.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-slate-500" /> Invoice History
        </h3>
        
        {fees.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No fee records found.</p>
        ) : (
          <div className="space-y-4">
            {fees.map((invoice) => {
              const remaining = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
              return (
                <div key={invoice.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-xl bg-slate-50 p-5 border border-slate-100 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">{invoice.description}</h4>
                    <p className="text-xs text-slate-400">Semester {invoice.semester} • Due Date: {invoice.due_date}</p>
                    <p className="text-xs text-slate-500 font-semibold">
                      Total Billed: ${parseFloat(invoice.total_amount).toLocaleString()} | Paid: ${parseFloat(invoice.paid_amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    {remaining > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Balance Due</span>
                        <span className="block text-sm font-extrabold text-rose-600">${remaining.toLocaleString()}</span>
                      </div>
                    )}
                    <div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        invoice.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : invoice.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {invoice.status === 'PAID' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFees;
