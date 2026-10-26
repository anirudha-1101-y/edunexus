import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardCard } from '../components/ui/DashboardCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { SearchFilterBar } from '../components/ui/SearchFilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { erpService } from '../services/erpService';
import { UserAccount, UserRole } from '../types/erp';
import { useToast } from '../context/ToastContext';
import { useRole } from '../context/RoleContext';
import {
  Users,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Lock,
  Power,
  Edit,
  ShieldAlert,
  Clock,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function UserManagementPage() {
  const { success, error } = useToast();
  const { currentRole } = useRole();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  // Selected User
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Teacher' as UserRole,
    department: 'Academics',
    designation: 'Faculty Instructor',
    phone: '',
    idNumber: '',
  });

  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await erpService.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      error('Required Fields Missing', 'Please provide a name and email.');
      return;
    }
    const created = await erpService.createUser({
      ...formData,
      status: 'ACTIVE',
      idNumber: formData.idNumber || `EMP-${Date.now().toString().slice(-4)}`,
      permissions: ['standard:access'],
    });
    setUsers([created, ...users]);
    setAddModalOpen(false);
    success('Account Provisioned', `User account for ${created.name} (${created.role}) has been created.`);
    setFormData({
      name: '',
      email: '',
      role: 'Teacher',
      department: 'Academics',
      designation: 'Faculty Instructor',
      phone: '',
      idNumber: '',
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const updated = await erpService.updateUser(selectedUser.id, formData);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditModalOpen(false);
    success('Account Updated', `Settings for ${updated.name} have been updated.`);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const updated = await erpService.toggleUserStatus(selectedUser.id);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setConfirmToggleOpen(false);
    success('Status Changed', `Account for ${updated.name} is now ${updated.status}.`);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setResetModalOpen(false);
    setNewPassword('');
    success('Password Reset', `Temporary password dispatched to ${selectedUser.email}.`);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.idNumber.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns: Column<UserAccount>[] = [
    {
      key: 'name',
      header: 'User Identity',
      sortable: true,
      render: (u) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
            {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{u.name}</div>
            <div className="text-[11px] text-slate-400">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      sortable: true,
      render: (u) => (
        <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {u.role}
        </span>
      ),
    },
    {
      key: 'idNumber',
      header: 'Identity ID',
      sortable: true,
      render: (u) => <span className="font-mono text-xs font-bold text-slate-700">{u.idNumber}</span>,
    },
    {
      key: 'department',
      header: 'Department / Unit',
      render: (u) => <span className="text-slate-600">{u.department || 'Institutional General'}</span>,
    },
    {
      key: 'lastLogin',
      header: 'Last Active',
      render: (u) => <span className="text-[11px] text-slate-500">{u.lastLogin}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => {
              setSelectedUser(u);
              setFormData({
                name: u.name,
                email: u.email,
                role: u.role,
                department: u.department || '',
                designation: u.designation || '',
                phone: u.phone,
                idNumber: u.idNumber,
              });
              setEditModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Edit Role & Permissions"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(u);
              setResetModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition-colors"
            title="Trigger Password Reset"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(u);
              setConfirmToggleOpen(true);
            }}
            className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${
              u.status === 'ACTIVE'
                ? 'hover:bg-rose-50 hover:text-rose-600 text-slate-600'
                : 'hover:bg-emerald-50 hover:text-emerald-600 text-slate-600'
            }`}
            title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Re-activate Account'}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="User Accounts & Role-Based Access (RBAC)"
        subtitle="Manage administrative accounts, role privileges, multi-factor credential policies, and user activation states."
        breadcrumbs={[{ label: 'User Management' }]}
        actions={
          <button
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                role: 'Teacher',
                department: 'Academics',
                designation: 'Faculty Instructor',
                phone: '',
                idNumber: '',
              });
              setAddModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Provision New User
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="Total User Accounts"
          value={users.length}
          subtitle="Provisioned System Identities"
          icon={Users}
          colorTheme="blue"
        />
        <DashboardCard
          title="Active Credentials"
          value={users.filter((u) => u.status === 'ACTIVE').length}
          subtitle="Verified Operational Users"
          icon={ShieldCheck}
          colorTheme="emerald"
        />
        <DashboardCard
          title="Administrative Accounts"
          value={users.filter((u) => ['Super Admin', 'Administrator', 'Principal'].includes(u.role)).length}
          subtitle="Elevated Institutional Privileges"
          icon={Lock}
          colorTheme="indigo"
        />
        <DashboardCard
          title="RBAC Roles Defined"
          value={8}
          subtitle="Enterprise Role Taxonomy"
          icon={ShieldAlert}
          colorTheme="slate"
        />
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, identity ID..."
        filters={[
          {
            id: 'role',
            label: 'Role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: 'All Roles', value: 'ALL' },
              { label: 'Super Admin', value: 'Super Admin' },
              { label: 'Administrator', value: 'Administrator' },
              { label: 'Principal', value: 'Principal' },
              { label: 'Teacher', value: 'Teacher' },
              { label: 'Accountant', value: 'Accountant' },
              { label: 'HR Manager', value: 'HR Manager' },
              { label: 'Student', value: 'Student' },
              { label: 'Parent', value: 'Parent' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setRoleFilter('ALL');
          setStatusFilter('ALL');
        }}
      />

      {/* User Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={8}
        emptyMessage="No user accounts matching the filter criteria."
      />

      {/* Modal: Add User */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center">
              <UserPlus className="w-5 h-5 text-blue-600 mr-2" />
              Provision New User Identity
            </h3>
            <p className="text-xs text-slate-500 mb-4">Assign institutional roles and system permissions.</p>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  placeholder="e.g. Liam Foster"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  placeholder="liam.foster@apex.edu"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned RBAC Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Principal">Principal / College Director</option>
                  <option value="Teacher">Teacher / Faculty</option>
                  <option value="Accountant">Accountant / Bursar</option>
                  <option value="HR Manager">HR / Staff Manager</option>
                  <option value="Student">Student</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Staff / Student ID</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                    placeholder="Auto-generated if blank"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Role & Permissions */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center">
              <Edit className="w-5 h-5 text-blue-600 mr-2" />
              Edit Account ({selectedUser.idNumber})
            </h3>
            <p className="text-xs text-slate-500 mb-4">Update role assignment and department affiliations.</p>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">RBAC Role Assignment</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Principal">Principal / Director</option>
                  <option value="Teacher">Teacher / Faculty</option>
                  <option value="Accountant">Accountant</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Student">Student</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Password Reset */}
      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center">
              <KeyRound className="w-5 h-5 text-amber-600 mr-2" />
              Reset Account Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter temporary password for <strong className="text-slate-800">{selectedUser.name}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  placeholder="Min 8 characters"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog: Activate / Deactivate */}
      <ConfirmDialog
        isOpen={confirmToggleOpen}
        title={selectedUser?.status === 'ACTIVE' ? 'Deactivate User Account?' : 'Activate User Account?'}
        message={
          selectedUser?.status === 'ACTIVE'
            ? `Deactivating ${selectedUser?.name} will prevent them from signing in or accessing campus ERP resources.`
            : `Re-activating ${selectedUser?.name} will restore their login access and assigned privileges.`
        }
        confirmText={selectedUser?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        variant={selectedUser?.status === 'ACTIVE' ? 'danger' : 'success'}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmToggleOpen(false)}
      />
    </MainLayout>
  );
}
