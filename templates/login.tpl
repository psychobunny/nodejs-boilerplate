  <form class="login-form">
    <div class="form-group">
      <input class="form-control login-field username" value="" placeholder="Enter your username" name="username" type="username" required autofocus>
      <label class="login-field-icon fui-user" for="username"></label>
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
  	$.post('/login', $(this).serialize(), function(msg) {
      if (msg.err) {
        $('.password').popover({
          placement: 'bottom',
          content: 'Invalid password',
          trigger: 'manual'
        }).popover('show');
      } else {
        window.location.href = '/dashboard';
      }
  		
  	});

  	ev.preventDefault();
  	return false;
  });
  </script>