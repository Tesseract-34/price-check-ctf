document.addEventListener('DOMContentLoaded', () => {
  
  document.querySelectorAll('.reset').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!confirm('Clear your cart and start over?')) {
        e.preventDefault();
      }
    });
  });

});