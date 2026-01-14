import React, { useState, useEffect } from "react";
import axios from "../../../../../../api/axios";

export default function AssignRoleToUser({ role, onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/users");
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const toggleUser = (userId) => {
    const updated = new Set(selectedUsers);
    if (updated.has(userId)) {
      updated.delete(userId);
    } else {
      updated.add(userId);
    }
    setSelectedUsers(updated);
  };

  const handleSave = async () => {
    try {
      await axios.post(`/roles/${role.id}/assign-users`, { users: [...selectedUsers] });
      onClose();
    } catch (error) {
      console.error("Error assigning role to users", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Assign {role.name} to Users</h2>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {users.map((user) => (
            <label key={user.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedUsers.has(user.id)}
                onChange={() => toggleUser(user.id)}
              />
              <span>{user.full_name} ({user.email})</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 rounded border">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
