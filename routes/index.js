const express = require('express');
const router = express.Router();
const masjidController = require('../controllers/masjidController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(masjidController.getMasajid));
router.get('/masajid', catchErrors(masjidController.getMasajid));
router.get('/masajid/page/:page', catchErrors(masjidController.getMasajid));
router.get('/add', authController.isLoggedIn, masjidController.addMasjid);

router.post('/add',
  masjidController.upload,
  catchErrors(masjidController.resize),
  catchErrors(masjidController.createMasjid)
);

router.post('/add/:id',
  masjidController.upload,
  catchErrors(masjidController.resize),
  catchErrors(masjidController.updateMasjid)
);

router.get('/masajid/:id/edit', catchErrors(masjidController.editMasjid));
router.get('/masjid/:slug', catchErrors(masjidController.getMasjidBySlug));

router.get('/tags', catchErrors(masjidController.getMasajidByTag));
router.get('/tags/:tag', catchErrors(masjidController.getMasajidByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

// 1. Validate the registration data
// 2. register the user
// 3. we need to log them in
router.post('/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
router.get('/map', masjidController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(masjidController.getHearts));
router.post('/reviews/:id',
  authController.isLoggedIn,
  catchErrors(reviewController.addReview)
);

router.get('/top', catchErrors(masjidController.getTopMasajid));

/*
  API
*/

router.get('/api/search', catchErrors(masjidController.searchMasajid));
router.get('/api/masajid/near', catchErrors(masjidController.mapMasajid));
router.post('/api/masajid/:id/heart', catchErrors(masjidController.heartMasjid));

module.exports = router;
