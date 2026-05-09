document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.period-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.period-btn').forEach((b) => b.classList.remove('active'));
      this.classList.add('active');
      const period = this.dataset.period;
      document.querySelectorAll('.price-display').forEach((d) => (d.style.display = 'none'));
      document.querySelectorAll(`.price-display[data-period="${period}"]`).forEach((d) => (d.style.display = 'block'));
    });
  });
});
