import React, { useRef, useCallback, useState } from "react";
import UserCard from "./UserCard";
import { User } from "lucide-react";
import UserDetailsModal from "./UserDetailsModal";
import { useTranslation } from "react-i18next";

export default function UsersList({ users, setUsers, loading, hasMore, loadMore }) {
  const { t } = useTranslation();
  const observer = useRef();
  const [selectedUser, setSelectedUser] = useState(null);

  const lastUserRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  // Update the users list locally when an action occurs
  const handleUserUpdated = (updatedUser, action) => {
    if (!setUsers || typeof setUsers !== 'function') {
      console.warn('setUsers function is not available');
      return;
    }
    
    if (action === 'deleted') {
      // Remove user from list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== updatedUser.id));
    } else {
      // Update user in list
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      ));
    }
  };

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      {/* Users List */}
      <div className="flex flex-col gap-3 w-full max-w-full">
        {users.map((user, index) => {
          const isLastUser = index === users.length - 1;

          return (
            <div
              key={user.id}
              className="w-full max-w-full"
              ref={isLastUser ? lastUserRef : null}
            >
              <UserCard
                user={user}
                onClick={() => handleUserClick(user)}
              />
            </div>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8 w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="text-center py-12 w-full max-w-full px-4">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            {t("usersList.emptyState.title")}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {t("usersList.emptyState.description")}
          </p>
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && users.length > 0 && (
        <div className="flex justify-center pt-6 w-full px-4">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#9b69b2] hover:to-purple-500 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 w-full sm:w-auto max-w-sm"
          >
            {t("usersList.loadMore")}
          </button>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}