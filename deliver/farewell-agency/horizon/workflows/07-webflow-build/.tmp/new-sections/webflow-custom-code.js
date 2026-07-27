(() => {
document.querySelectorAll('.faq_question').forEach(function (q) {
  q.addEventListener('click', function () {
    var item = q.closest('.faq_item');
    var answer = item.querySelector('.faq_answer');
    var icon = item.querySelector('.faq_icon');
    var isOpen = item.classList.contains('is--open');
    if (isOpen) {
      item.classList.remove('is--open');
      answer.style.maxHeight = '0px';
      if (icon) { icon.style.transform = 'rotate(0deg)'; }
    } else {
      item.classList.add('is--open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      if (icon) { icon.style.transform = 'rotate(45deg)'; }
    }
  });
});
})();
