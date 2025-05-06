let users = [
    { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 'admin', status: 'active' },
    { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', role: 'manager', status: 'active' },
    { id: '3', first_name: 'Bob', last_name: 'Brown', email: 'bob@example.com', role: 'employee', status: 'inactive' },
  ];

  let filteredUsers = [...users];
  let currentPage = 1;
  const itemsPerPage = 5;

  function renderTable() {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    paginatedUsers.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" class="user-check" value="${user.id}"></td>
        <td>${user.first_name} ${user.last_name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.status}</td>
        <td>
          <button class="btn btn-primary" onclick="openEditModal('${user.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger" onclick="confirmDeleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });

    updatePagination();
  }

  function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;

    filteredUsers = users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return fullName.includes(searchTerm) && (roleFilter === '' || user.role === roleFilter);
    });
    currentPage = 1;
    renderTable();
  }

  function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.user-check');
    const selectAll = document.getElementById('select-all').checked;
    checkboxes.forEach(cb => cb.checked = selectAll);
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    document.getElementById('page-info').innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
  }

  function changePage(delta) {
    currentPage += delta;
    renderTable();
  }

  function openEditModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    document.getElementById('edit-id').value = user.id;
    document.getElementById('edit-first-name').value = user.first_name;
    document.getElementById('edit-last-name').value = user.last_name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-role').value = user.role;
    document.getElementById('edit-status').value = user.status;
    openModal('edit-user-modal');
  }

  function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const updated = {
      id,
      first_name: document.getElementById('edit-first-name').value,
      last_name: document.getElementById('edit-last-name').value,
      email: document.getElementById('edit-email').value,
      role: document.getElementById('edit-role').value,
      status: document.getElementById('edit-status').value
    };
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = updated;
      showNotification('User updated successfully', 'success');
      closeModal('edit-user-modal');
      filterUsers();
    }
  }

  function createUser() {
    const newUser = {
      id: Date.now().toString(),
      first_name: document.getElementById('new-first-name').value,
      last_name: document.getElementById('new-last-name').value,
      email: document.getElementById('new-email').value,
      role: document.getElementById('new-role').value,
      status: document.getElementById('new-status').value
    };
    users.push(newUser);
    showNotification('User created successfully', 'success');
    closeModal('create-user-modal');
    filterUsers();
  }

  function confirmDeleteUser(id) {
    currentDeleteId = id;
    document.getElementById('confirm-message').innerText = 'Are you sure you want to delete this user?';
    openModal('confirm-modal');
  }

  let currentDeleteId = null;

  function deleteConfirmedUser() {
    users = users.filter(u => u.id !== currentDeleteId);
    showNotification('User deleted successfully', 'success');
    closeModal('confirm-modal');
    filterUsers();
  }

  function openModal(id) {
    document.getElementById(id).style.display = 'block';
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.className = `notification ${type}`;
    notification.innerText = message;
    notification.style.display = 'block';
    setTimeout(() => notification.style.display = 'none', 3000);
  }

  // Initial render
  window.onload = () => {
    renderTable();
  };