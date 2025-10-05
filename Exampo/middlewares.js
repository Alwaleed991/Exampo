module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.flash("error", "You must be signed in")
        return res.redirect("/login")
    }
    next()
}

module.exports.isAdmin = (req, res, next) => {
    // Check if the user is authenticated and has the username 'admin'
    if (req.isAuthenticated() && req.user.username === 'admin') {
        return next(); // Allow access if the username is 'admin'
    }

    // Deny access if not an admin
    req.flash('error', 'You do not have permission to access this page.');
    return res.redirect('/home'); // Redirect to the homepage or any other route
}
