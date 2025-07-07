import React, { useState } from 'react';
import { BillingService } from '../../lib/billingService';
import { Calendar, DollarSign, AlertCircle } from 'lucide-react';

interface RetainerBillingSetupProps {
  clientId: string;
  onSetupComplete: () => void;
  onCancel: () => void;
  initialAmount?: number;
  initialBillingDay?: number;
}

const RetainerBillingSetup: React.FC<RetainerBillingSetupProps> = ({
  clientId,
  onSetupComplete,
  onCancel,
  initialAmount = 0,
  initialBillingDay = 1
}) => {
  const [formData, setFormData] = useState({
    amount: initialAmount,
    billingDay: initialBillingDay,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      setError('Retainer amount must be greater than 0');
      return;
    }

    if (formData.billingDay < 1 || formData.billingDay > 31) {
      setError('Billing day must be between 1 and 31');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await BillingService.setupRetainerBilling(
        clientId,
        formData.amount,
        formData.billingDay,
        new Date(formData.startDate)
      );

      onSetupComplete();
    } catch (err) {
      console.error('Failed to setup retainer billing:', err);
      setError('Failed to setup retainer billing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNextBillingDate = () => {
    const today = new Date();
    const billingDay = formData.billingDay;
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), billingDay);
    
    if (currentMonth > today) {
      return currentMonth;
    } else {
      return new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
    }
  };

  const nextBillingDate = calculateNextBillingDate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Setup Retainer Billing</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Retainer Amount (£)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Day of Month
            </label>
            <select
              value={formData.billingDay}
              onChange={(e) => setFormData({ ...formData, billingDay: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>
                  {day}
                  {day === 1 && ' (1st)'}
                  {day === 2 && ' (2nd)'}
                  {day === 3 && ' (3rd)'}
                  {day > 3 && day <= 31 && ` (${day}th)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Billing Preview</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Monthly Amount:</span>
                <span className="font-medium">£{formData.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Day:</span>
                <span className="font-medium">{formData.billingDay}</span>
              </div>
              <div className="flex justify-between">
                <span>Next Billing:</span>
                <span className="font-medium">{nextBillingDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (20%):</span>
                <span className="font-medium">£{(formData.amount * 0.2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total per month:</span>
                <span className="font-bold">£{(formData.amount * 1.2).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Setting up...' : 'Setup Retainer Billing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RetainerBillingSetup; 