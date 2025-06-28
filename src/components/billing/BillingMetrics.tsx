import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, PoundSterling } from "lucide-react";

interface VATData {
  totalAmount: number;
  totalInvoiced: number;
  vatAmount: number;
  recordCount: number;
  invoicedCount: number;
}

interface BillingMetricsProps {
  pendingCount: number;
  totalProjectValue: number;
  totalBillingAmount: number;
  totalExpenses: number;
  paidCount: number;
  vatData: VATData;
}

export function BillingMetrics({ 
  pendingCount, 
  totalProjectValue, 
  totalBillingAmount, 
  totalExpenses, 
  paidCount,
  vatData
}: BillingMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Can be Invoiced</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Project Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            £{totalProjectValue.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Billing Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            £{totalBillingAmount.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            £{totalExpenses.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paidCount}</div>
        </CardContent>
      </Card>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center text-blue-800">
            <Calculator className="w-4 h-4 mr-1" />
            VAT Due This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-800 flex items-center">
            <PoundSterling className="w-5 h-5 mr-1" />
            {vatData.vatAmount > 0 ? vatData.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          {vatData.recordCount > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              {vatData.recordCount} record{vatData.recordCount !== 1 ? 's' : ''}
              {vatData.invoicedCount > 0 && (
                <span> ({vatData.invoicedCount} invoiced)</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
