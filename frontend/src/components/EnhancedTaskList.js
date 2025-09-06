import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components/ui';

const EnhancedTaskList = () => {
  const { user, token } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [dashboardStats, setDashboardStats] = useState({});

  // Fetch tasks with enhanced filtering
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
        params: { filter, sortBy }
      });
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchDashboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTasks();
      fetchDashboard();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filter, sortBy]);

  // Handle task decision with enhanced UX
  const handleDecision = async (jobKey, approved) => {
    try {
      await axios.post('/api/complete', {
        jobKey,
        approved,
        comments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Task ${approved ? 'approved' : 'rejected'} successfully!`);
      setSelectedTask(null);
      setComments('');
      fetchTasks();
      fetchDashboard();
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Error completing task:', error);
    }
  };

  // Enhanced task card component
  const TaskCard = ({ task }) => {
    const getPriorityColor = (days) => {
      if (days > 10) return 'bg-red-100 text-red-800';
      if (days > 5) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    };

    const getStatusColor = (role) => {
      switch (role) {
        case 'manager': return 'bg-blue-100 text-blue-800';
        case 'hr': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">
                {task.variables.requester || 'Anonymous'}
              </h3>
              <p className="text-sm text-gray-600">
                {task.variables.leaveType || 'Leave'} Request
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(task.role)}>
                {task.role?.toUpperCase()} APPROVAL
              </Badge>
              <Badge className={getPriorityColor(task.variables.days)}>
                {task.variables.days} days
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-gray-600">
                {task.start_date && task.end_date 
                  ? `${task.start_date} to ${task.end_date}`
                  : `${task.variables.days} days`
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Department</p>
              <p className="text-sm text-gray-600">
                {task.department || 'Not specified'}
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Reason</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {task.variables.reason}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setSelectedTask({ ...task, decision: 'approve' })}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
              disabled={user.role !== 'admin' && user.role !== task.role}
            >
              ✓ Approve
            </Button>
            <Button 
              onClick={() => setSelectedTask({ ...task, decision: 'reject' })}
              variant="destructive"
              className="flex-1"
              disabled={user.role !== 'admin' && user.role !== task.role}
            >
              ✗ Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Dashboard stats component
  const DashboardStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {dashboardStats.total_requests || 0}
          </div>
          <p className="text-sm text-gray-600">Total Requests</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {dashboardStats.pending || 0}
          </div>
          <p className="text-sm text-gray-600">Pending</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {dashboardStats.approved || 0}
          </div>
          <p className="text-sm text-gray-600">Approved</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {dashboardStats.rejected || 0}
          </div>
          <p className="text-sm text-gray-600">Rejected</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Leave Approval Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.name}! You have {tasks.length} pending tasks.
        </p>
      </div>

      <DashboardStats />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Tasks</TabsTrigger>
          <TabsTrigger value="history">Approval History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="manager">Manager Tasks</SelectItem>
                <SelectItem value="hr">HR Tasks</SelectItem>
                <SelectItem value="urgent">Urgent (&gt;10 days)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="days">Duration</SelectItem>
                <SelectItem value="requester">Requester</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchTasks} variant="outline">
              🔄 Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-gray-500">No pending tasks found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.job_key} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Approvals</h3>
            </CardHeader>
            <CardContent>
              {/* Approval history table would go here */}
              <p className="text-gray-500">Approval history coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Analytics & Reports</h3>
            </CardHeader>
            <CardContent>
              {/* Analytics charts would go here */}
              <p className="text-gray-500">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Decision Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTask?.decision === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium">{selectedTask.variables.requester}</h4>
                <p className="text-sm text-gray-600">{selectedTask.variables.reason}</p>
                <p className="text-sm text-gray-600">{selectedTask.variables.days} days</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Comments (optional)
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments about your decision..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleDecision(
                    selectedTask.job_key,
                    selectedTask.decision === 'approve'
                  )}
                  className={selectedTask.decision === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                  }
                  disabled={loading}
                >
                  Confirm {selectedTask.decision === 'approve' ? 'Approval' : 'Rejection'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTask(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedTaskList;
