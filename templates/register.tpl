  <form class="login-form">
    <div class="form-group">
      <input class="form-control login-field username" value="" placeholder="Enter your username" name="username" type="username" required autofocus>
      <label class="login-field-icon fui-user" for="username"></label>
    </div>

    <div class="form-group">
      <input class="form-control login-field email" value="" placeholder="Enter your email" name="email" type="email" required>
      <label class="login-field-icon fui-lock" for="email"></label>
    </div>

     <div class="form-group">
      <input class="form-control login-field password" value="" placeholder="Enter your password" name="password" type="password" required>
      <label class="login-field-icon fui-lock" for="password"></label>
    </div>

    <input type="hidden" name="_csrf" value="{csrf}" />

    <button class="btn btn-primary btn-lg btn-block" href="#">Login</button>
    <!--<a class="login-link" href="#">Lost your password?</a>-->
  </form>

  <script type="text/javascript">
  $('.login-form').on('submit', function(ev) {
    $.post('/register', $(this).serialize(), function(msg) {
      var field = '';

      if (msg.err === 'Invalid Email!' || msg.err === 'Email taken!') {
        field = '.email';
      } else if (msg.err === 'Invalid Username!' || msg.err === 'Username taken!') {
        field = '.username';
      } else if (msg.err === 'Invalid Password!') {
        field = '.password';
      } else {
        window.location.href = msg.redirect;
      }

      if (field) {
        $(field).popover({
          placement: 'bottom',
          content: msg.err,
          trigger: 'manual'
        }).popover('show');
      }
      
    });

    ev.preventDefault();
    return false;
  });
  </script>