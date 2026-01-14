import React, { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axios"; 
import UsersHeader from "../../../../components/layout/dashboard/admin/users/UsersHeader";
import UsersList from "../../../../components/layout/dashboard/admin/users/UsersList";
import UserForm from "../../../../components/layout/dashboard/admin/users/UserForm";

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]); 
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false); 

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [lastLogin, setLastLogin] = useState("");

  const LIMIT = 50;

  // Fetch users function
  const fetchUsers = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await api.get("/user", {
        params: {
          limit: LIMIT,
          offset: reset ? 0 : offset,
          search,
          role: roleFilter,
          status: statusFilter,
          sort,
          date_start: dateRange.start,
          date_end: dateRange.end,
          last_login: lastLogin,
        },
      });

      const fetchedUsers = res.data?.users || res.data || [];
      const total = res.data?.total || fetchedUsers.length;

      setUsers(reset ? fetchedUsers : [...users, ...fetchedUsers]);
      setTotalUsers(total);
      setHasMore(fetchedUsers.length === LIMIT);
      setOffset(reset ? LIMIT : offset + fetchedUsers.length);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    roleFilter,
    statusFilter,
    sort,
    dateRange,
    lastLogin,
    offset,
    users,
    loading
  ]);

  // Fetch roles for UserForm dropdown
  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await api.get("/roles");
      setRoles(data);
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  }, []);

  // Export filtered users as CSV
  const handleExport = async () => {
    try {
      const res = await api.get("/user/export", {
        params: {
          search,
          role: roleFilter,
          status: statusFilter,
          sort,
          date_start: dateRange.start,
          date_end: dateRange.end,
          last_login: lastLogin,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `users_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting users:", err);
      alert("Failed to export users.");
    }
  };

  // Handle Add User button click
  const handleAddUser = () => {
    setIsUserFormOpen(true); 
  };

  // Handle modal close
  const handleCloseUserForm = () => {
    setIsUserFormOpen(false); 
  };

  // Handle user creation success
  const handleSaveUser = () => {
    fetchUsers(true); 
  };

  // Fetch users on first render and whenever filters change
  useEffect(() => {
    fetchUsers(true);
  }, [search, roleFilter, statusFilter, sort, dateRange.start, dateRange.end, lastLogin]);

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Refresh total users every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/user/total");
        setTotalUsers(res.data.total || totalUsers);
      } catch (err) {
        console.error("Error fetching total users:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [totalUsers]);

  return (
    <div className="w-full">
      <UsersHeader
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sort={sort}
        setSort={setSort}
        totalUsers={totalUsers}
        filteredCount={users.length}
        dateRange={dateRange}
        setDateRange={setDateRange}
        lastLogin={lastLogin}
        setLastLogin={setLastLogin}
        onAddUser={handleAddUser}
        onExport={handleExport}
        selectedUsers={[]}
        onBulkAction={(action) => console.log("Bulk Action:", action)}
        onRefresh={fetchUsers}
      />

      <UsersList
        users={users}
        loading={loading}
        hasMore={hasMore}
        loadMore={() => fetchUsers()}
      />

      {/* User Form Modal  */}
      {isUserFormOpen && (
        <UserForm
          onClose={handleCloseUserForm}
          onSave={handleSaveUser}
          roles={roles}
        />
      )}
    </div>
  );
}