import { Plus, UserPlus, Package, Truck, FileText, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function QuickActionsMenu() {
  const handleQuickAction = (action: string) => {
    toast.success(`${action} action initiated`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleQuickAction('Create New Order')}>
          <Package className="w-4 h-4 mr-2" />
          Create New Order
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickAction('Add Worker')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Worker
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickAction('Schedule Dispatch')}>
          <Truck className="w-4 h-4 mr-2" />
          Schedule Dispatch
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Reports</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleQuickAction('Export Orders')}>
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickAction('Generate Report')}>
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
