
        </div>

      </div>

    </div>
    
    <script src="//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js"></script>
    <script type="text/javascript">
    var csrf = '{csrf}';

    $('.nav li').removeClass('active');
    var path = window.location.pathname.slice(1);
    if (!path) {
    	path = 'home';
    }
    $('.nav-' + path).addClass('active');

    $('#logout').on('click', function() {
    	$.post('/logout', {_csrf: csrf}, function() {
    		window.location.href='/';
    	});
    });
    </script>
  </body>
</html>