
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, User, Speech } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface BillingRecord {
  id: string;
  project_id: string;
  stage_id: string;
  billing_percentage: number;
  amount: number | null;
  invoice_status: string;
  invoice_number: string | null;
  created_at: string;
  processed_at: string | null;
  project: {
    title: string;
    project_value: number | null;
    is_retainer: boolean;
    treat_as_oneoff: boolean;
    po_number: string | null;
    client: {
      company: string;
      name: string;
      email?: string;
      phone?: string;
      contact_person?: string;
      address?: string;
    };
  };
  stage: {
    name: string;
  };
}

interface Expense {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

interface BillingTableProps {
  records: BillingRecord[];
  expenses: Expense[];
  onUpdate: (recordId: string, amount: number, invoiceNumber: string, status: string) => void;
  onOpenExpenseModal: (projectId: string) => void;
  calculateBillingAmount: (record: BillingRecord) => number;
  getTotalExpenses: (projectId: string) => number;
}

export function BillingTable({ 
  records, 
  expenses, 
  onUpdate, 
  onOpenExpenseModal, 
  calculateBillingAmount, 
  getTotalExpenses 
}: BillingTableProps) {
  const [commentDialogs, setCommentDialogs] = useState<{[key: string]: boolean}>({});
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [newComment, setNewComment] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer';
      case 'invoiced':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Can be Invoiced';
      case 'invoiced':
        return 'Invoiced';
      case 'on_hold':
        return 'On Hold';
      default:
        return status;
    }
  };

  const handleStatusChange = (record: BillingRecord, newStatus: string) => {
    const calculatedAmount = calculateBillingAmount(record);
    const defaultInvoiceNumber = newStatus === 'invoiced' ? `INV-${record.project.title.substring(0, 3).toUpperCase()}-${Date.now()}` : '';
    onUpdate(record.id, record.amount || calculatedAmount, defaultInvoiceNumber, newStatus);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const openCommentDialog = (recordId: string) => {
    setCommentDialogs({...commentDialogs, [recordId]: true});
  };

  const closeCommentDialog = (recordId: string) => {
    setCommentDialogs({...commentDialogs, [recordId]: false});
    setNewComment("");
  };

  const addComment = (recordId: string) => {
    if (newComment.trim()) {
      const timestamp = new Date().toLocaleString();
      const comment = `[${timestamp}] ${newComment}`;
      const existingComments = comments[recordId] || "";
      setComments({
        ...comments,
        [recordId]: existingComments ? `${existingComments}\n${comment}` : comment
      });
      setNewComment("");
      closeCommentDialog(recordId);
    }
  };

  const formatComment = (commentText: string) => {
    // Extract timestamp and comment from the format: [08/06/2025, 10:20:03] comment text
    const match = commentText.match(/^\[([^\]]+)\] (.+)$/);
    if (match) {
      const [, timestamp, comment] = match;
      return {
        comment,
        timestamp,
        username: "Staff User" // For now, using a placeholder username
      };
    }
    return {
      comment: commentText,
      timestamp: "",
      username: "Staff User"
    };
  };

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[800px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Expenses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deal Value</TableHead>
              <TableHead>Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const totalProjectExpenses = getTotalExpenses(record.project_id);
              const calculatedAmount = calculateBillingAmount(record);
              
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{record.project.title}</div>
                      {record.project.po_number && (
                        <div className="text-sm text-purple-600">
                          PO: {record.project.po_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>{record.project.client.company}</TableCell>
                  
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{record.project.client.name}</span>
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Client Information</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Company</label>
                            <p className="text-lg font-semibold">{record.project.client.company}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contact Name</label>
                            <p>{record.project.client.name}</p>
                          </div>
                          {record.project.client.email && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Email</label>
                              <p>{record.project.client.email}</p>
                            </div>
                          )}
                          {record.project.client.phone && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Phone</label>
                              <p>{record.project.client.phone}</p>
                            </div>
                          )}
                          {record.project.client.contact_person && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Contact Person</label>
                              <p>{record.project.client.contact_person}</p>
                            </div>
                          )}
                          {record.project.client.address && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Address</label>
                              <p>{record.project.client.address}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  
                  <TableCell>
                    <div title={record.stage.name}>
                      {truncateText(record.stage.name, 9)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.billing_percentage}%
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {totalProjectExpenses > 0 ? (
                        <span className="text-red-600 font-medium">
                          £{totalProjectExpenses.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">£0</span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => onOpenExpenseModal(record.project_id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Badge className={getStatusColor(record.invoice_status)}>
                          {getStatusText(record.invoice_status)}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 bg-background border shadow-md">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Change Status</h4>
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleStatusChange(record, 'pending')}
                            >
                              Can be Invoiced
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleStatusChange(record, 'invoiced')}
                            >
                              Invoiced
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleStatusChange(record, 'on_hold')}
                            >
                              On Hold
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">
                      £{(record.amount || calculatedAmount).toLocaleString()}
                    </div>
                    {record.project.project_value && (
                      <div className="text-sm text-muted-foreground">
                        of £{record.project.project_value.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openCommentDialog(record.id)}
                        >
                          <Speech className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Project Comments</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="max-h-40 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                            {comments[record.id] ? (
                              <div className="space-y-3">
                                {comments[record.id].split('\n').map((commentLine, index) => {
                                  if (!commentLine.trim()) return null;
                                  const { comment, timestamp, username } = formatComment(commentLine);
                                  return (
                                    <div key={index} className="bg-white p-3 rounded-lg border">
                                      <p className="text-sm text-gray-900 mb-2">{comment}</p>
                                      <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span className="font-medium">{username}</span>
                                        <span>{timestamp}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-20"
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => addComment(record.id)}
                                disabled={!newComment.trim()}
                              >
                                Add Comment
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => closeCommentDialog(record.id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
