document.addEventListener('DOMContentLoaded', function () {
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggleBtn = document.getElementById('toggleSidebar');
  const closeBtn = document.getElementById('closeSidebar');
  function showSidebar() { sidebar?.classList.add('show'); overlay?.classList.add('show'); }
  function hideSidebar() { sidebar?.classList.remove('show'); overlay?.classList.remove('show'); }
  toggleBtn?.addEventListener('click', showSidebar);
  closeBtn?.addEventListener('click', hideSidebar);
  overlay?.addEventListener('click', hideSidebar);

  if (typeof jQuery !== 'undefined' && jQuery.fn.DataTable) {
    document.querySelectorAll('table.datatable').forEach((t) => {
      jQuery(t).DataTable({ pageLength: 25, language: { search: 'Rechercher:', lengthMenu: '_MENU_ par page', info: '_START_-_END_ sur _TOTAL_', paginate: { first: '«', last: '»', next: '›', previous: '‹' }, emptyTable: 'Aucune donnée' } });
    });
  }

  document.querySelectorAll('form[data-confirm]').forEach((f) => {
    f.addEventListener('submit', (e) => {
      if (!confirm(f.dataset.confirm || 'Êtes-vous sûr ?')) e.preventDefault();
    });
  });
});
