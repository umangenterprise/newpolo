import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/apiClient";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);

  const load = async () => {
    const { data } = await api.get("/admin/users");
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="container section-gap">
      <h2>Users</h2>
      <div className="admin-list">
        {users.map((user) => (
          <article key={user._id} className="admin-item long">
            <div>
              <p>{user.name}</p>
              <span>{user.email}</span>
              <div className="order-meta">
                <span>{user.isBlocked ? "Blocked" : "Active"}</span>
              </div>
            </div>
            <span className="chip active role-badge">{user.role}</span>
            <div className="user-actions">
              {user.role !== "admin" && (
                <button
                  type="button"
                  className={user.isBlocked ? "ghost-btn" : "text-btn danger-text"}
                  onClick={async () => {
                    try {
                      await api.put(`/admin/users/${user._id}/block`);
                      toast.success(user.isBlocked ? "User unblocked" : "User blocked");
                      await load();
                    } catch (error) {
                      toast.error(error.response?.data?.message || "Action failed");
                    }
                  }}
                >
                  {user.isBlocked ? "Unblock" : "Block"}
                </button>
              )}
              {user.role !== "admin" && (
                <button
                  type="button"
                  className="text-btn danger-text"
                  onClick={async () => {
                    try {
                      await api.delete(`/admin/users/${user._id}`);
                      toast.success("User deleted");
                      await load();
                    } catch (error) {
                      toast.error(error.response?.data?.message || "Delete failed");
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AdminUsersPage;
