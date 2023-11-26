const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;


// google auth config
passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL:"http://localhost:4000/auth/google/callback",
    passReqToCallback:true
},
(request, accessToken, refreshToken, profile, cb) => {
        return cb(null, profile);
    }
))

// facebook auth config
passport.use(new FacebookStrategy ({
    clientID:process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:4000/auth/facebook/callback",
    enableProof: true,
    profileFields: ['id', 'displayName', 'photos', 'email']
},
function(accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
  }
))

// *github auth config 
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: "http://127.0.0.1:4000/auth/github/callback"
},
function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile);
  });
}
));



passport.serializeUser((user, done) =>{ done(null, user)})
passport.deserializeUser((user, done) =>{done(null, user)})