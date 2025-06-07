
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CRMMetricsProps {
  pendingCount: number;
  totalProjectValue: number;
  totalBillingAmount: number;
  totalExpenses: number;
  paidCount: number;
}

export function CRMMetrics({ 
  pendingCount, 
  totalProjectValue, 
  totalBillingAmount, 
  totalExpenses, 
  paidCount 
}: CRMMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
    </div>
  );
}
