/* Only sends visitor-entered correspondence; no email address, model calls or tracking. */
(function () {
  'use strict';
  var form = document.getElementById('cform');
  if (!form || !window.fetch || !window.AbortController) return;
  var send = document.getElementById('cf-send');
  var fallback = document.getElementById('cf-fallback');
  var status = document.getElementById('cf-ok');
  var pending = false;
  form.noValidate = true;

  function message(zh, en) {
    document.getElementById('cf-status-zh').textContent = zh;
    document.getElementById('cf-status-en').textContent = en;
    status.classList.add('on');
  }
  function busy(value) {
    pending = value;
    send.disabled = value;
    fallback.disabled = value;
    form.setAttribute('aria-busy', value ? 'true' : 'false');
    document.getElementById('cf-send-zh').textContent = value ? '正在送出…' : '送出留言';
    document.getElementById('cf-send-en').textContent = value ? 'Sending…' : 'Send message';
  }
  function validate() {
    var first = null;
    ['cf-n', 'cf-m', 'cf-b'].forEach(function (id) {
      var field = document.getElementById(id);
      field.value = field.value.trim();
      var valid = field.checkValidity();
      field.setAttribute('aria-invalid', valid ? 'false' : 'true');
      document.getElementById(id + '-e').textContent = valid ? '' :
        (id === 'cf-m' ? '請填寫有效的回覆郵箱 · Please enter a valid reply email.' :
          id === 'cf-n' ? '請留下稱呼 · Please give your name.' : '請填寫留言 · Please write a message.');
      if (!valid && !first) first = field;
    });
    if (first) first.focus();
    return !first;
  }
  function subject() {
    document.getElementById('cf-subject').value = '千山獨行 · ' + document.getElementById('cf-s').value;
  }
  fallback.addEventListener('click', function () {
    if (pending || !validate()) return;
    subject();
    busy(true);
    HTMLFormElement.prototype.submit.call(form);
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (pending || !validate()) return;
    if (form.elements.namedItem('_honey').value) return;
    subject();
    fallback.hidden = true;
    busy(true);
    message('正在送出，請稍候。', 'Sending your message. Please wait.');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 20000);
    try {
      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });
      var response = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
        credentials: 'omit'
      });
      var result = await response.json();
      if (!response.ok || !(result.success === true || result.success === 'true')) throw new Error('Not confirmed');
      form.reset();
      message('留言已提交至作者的收信服務，謝謝您。', 'Your message has been submitted to the author’s mail service. Thank you.');
      status.focus();
    } catch (error) {
      message('暫未取得送達確認，您的文字仍保留。可稍後再試或改用驗證頁；請避免重複提交。',
        'Delivery could not be confirmed. Your text is still here. Try again later or use the verification page; please avoid duplicate submissions.');
      fallback.hidden = false;
    } finally {
      clearTimeout(timeout);
      busy(false);
    }
  });
})();
